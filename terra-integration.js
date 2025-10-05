/**
 * Terra Satellite Data Integration - Simple Examples
 * 
 * This demonstrates the exact functions you requested:
 * 1. getTerraTile(date, z, x, y) - Returns tile URL
 * 2. Multiple date fetching with error handling
 * 3. Earthdata Login integration
 * 4. Local saving and browser rendering
 */

// ================================================================
// 1. SIMPLEST VERSION: getTerraTile function
// ================================================================

/**
 * Generate Terra tile URL from NASA GIBS WMTS API
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {number} z - Zoom level
 * @param {number} x - Tile X coordinate  
 * @param {number} y - Tile Y coordinate
 * @param {string} layer - GIBS layer name
 * @param {string} resolution - Tile resolution
 * @returns {string} NASA GIBS WMTS URL
 */
function getTerraTile(date, z, x, y, layer = 'MODIS_Terra_CorrectedReflectance_TrueColor', resolution = '250m') {
  // NASA GIBS WMTS URL pattern
  return `https://gibs.earthdata.nasa.gov/wmts/epsg4326/best/${layer}/default/${date}/${resolution}/${z}/${y}/${x}.jpg`
}

// ================================================================
// 2. ENHANCED FETCH WITH ERROR HANDLING & RETRIES
// ================================================================

/**
 * Fetch a single Terra tile with error handling and retries
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {number} z - Zoom level
 * @param {number} x - Tile X coordinate
 * @param {number} y - Tile Y coordinate
 * @param {Object} options - Additional options
 * @returns {Promise<ArrayBuffer|null>} Tile data or null if failed
 */
async function fetchTerraTileWithRetries(date, z, x, y, options = {}) {
  const { 
    layer = 'MODIS_Terra_CorrectedReflectance_TrueColor',
    resolution = '250m',
    retries = 3,
    timeout = 30000
  } = options

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`🌍 Fetching Terra tile: ${date} [${z}/${x}/${y}] (attempt ${attempt})`)
      
      const url = getTerraTile(date, z, x, y, layer, resolution)
      
      const response = await fetch(url, {
        signal: AbortSignal.timeout(timeout),
        headers: {
          'User-Agent': 'Terra25-NASA-Data-Portal/1.0'
        }
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const arrayBuffer = await response.arrayBuffer()
      console.log(`✅ Successfully fetched tile: ${date} [${z}/${x}/${y}] (${arrayBuffer.byteLength} bytes)`)
      
      return arrayBuffer
      
    } catch (error) {
      console.error(`❌ Attempt ${attempt} failed for tile ${date} [${z}/${x}/${y}]:`, error.message)
      
      if (attempt === retries) {
        console.error(`🚫 All ${retries} attempts failed for tile: ${date} [${z}/${x}/${y}]`)
        return null
      }
      
      // Exponential backoff delay
      const delay = 1000 * Math.pow(2, attempt - 1)
      console.log(`⏳ Waiting ${delay}ms before retry...`)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  return null
}

// ================================================================
// 3. MULTIPLE DATES LOOP WITH ASYNC/AWAIT
// ================================================================

/**
 * Fetch Terra tiles for multiple dates
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @param {string} endDate - End date in YYYY-MM-DD format
 * @param {number} z - Zoom level
 * @param {number} x - Tile X coordinate
 * @param {number} y - Tile Y coordinate
 * @param {Object} options - Additional options
 * @returns {Promise<Array>} Array of results with tile data
 */
async function fetchMultipleTerraImages(startDate, endDate, z, x, y, options = {}) {
  const { concurrency = 2, saveLocal = false } = options
  
  console.log(`🚀 Fetching Terra tiles from ${startDate} to ${endDate}`)
  
  // Generate date range
  const dates = generateDateRange(startDate, endDate)
  const results = []
  
  // Process dates in batches to avoid overwhelming the server
  for (let i = 0; i < dates.length; i += concurrency) {
    const batch = dates.slice(i, i + concurrency)
    
    const batchPromises = batch.map(async (date) => {
      const tileData = await fetchTerraTileWithRetries(date, z, x, y, options)
      
      let savedPath = null
      if (tileData && saveLocal && typeof window === 'undefined') {
        // Node.js environment - save to file
        savedPath = await saveTileToFile(tileData, date, z, x, y)
      }
      
      return {
        date,
        success: tileData !== null,
        size: tileData ? tileData.byteLength : 0,
        data: tileData,
        savedPath
      }
    })
    
    const batchResults = await Promise.all(batchPromises)
    results.push(...batchResults)
    
    // Small delay between batches
    if (i + concurrency < dates.length) {
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }
  
  const successCount = results.filter(r => r.success).length
  console.log(`📊 Completed: ${successCount}/${dates.length} tiles successfully fetched`)
  
  return results
}

// ================================================================
// 4. EARTHDATA LOGIN INTEGRATION
// ================================================================

/**
 * Fetch Terra tile with Earthdata Login authentication
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {number} z - Zoom level
 * @param {number} x - Tile X coordinate
 * @param {number} y - Tile Y coordinate
 * @param {Object} credentials - Earthdata login credentials
 * @returns {Promise<ArrayBuffer|null>} Tile data or null if failed
 */
async function fetchTerraWithEarthdataLogin(date, z, x, y, credentials = null) {
  try {
    const url = getTerraTile(date, z, x, y)
    
    const headers = {
      'User-Agent': 'Terra25-NASA-Data-Portal/1.0'
    }
    
    // Add authentication if credentials provided
    if (credentials) {
      if (credentials.token) {
        // Bearer token authentication
        headers['Authorization'] = `Bearer ${credentials.token}`
      } else if (credentials.username && credentials.password) {
        // Basic authentication
        const auth = btoa(`${credentials.username}:${credentials.password}`)
        headers['Authorization'] = `Basic ${auth}`
      }
    }
    
    const response = await fetch(url, { headers })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    return await response.arrayBuffer()
    
  } catch (error) {
    console.error('❌ Earthdata authentication failed:', error.message)
    return null
  }
}

// ================================================================
// 5. SAVE IMAGES LOCALLY (Node.js)
// ================================================================

/**
 * Save tile data to local file (Node.js only)
 * @param {ArrayBuffer} tileData - Tile image data
 * @param {string} date - Date string
 * @param {number} z - Zoom level
 * @param {number} x - Tile X coordinate
 * @param {number} y - Tile Y coordinate
 * @returns {Promise<string>} Saved file path
 */
async function saveTileToFile(tileData, date, z, x, y) {
  if (typeof window !== 'undefined') {
    throw new Error('saveTileToFile can only be used in Node.js environment')
  }
  
  const fs = await import('fs')
  const path = await import('path')
  
  const outputDir = './terra-downloads'
  const filename = `terra_${date}_z${z}_x${x}_y${y}.jpg`
  const filepath = path.join(outputDir, filename)
  
  // Ensure output directory exists
  await fs.promises.mkdir(outputDir, { recursive: true })
  
  // Convert ArrayBuffer to Buffer and save
  const buffer = Buffer.from(tileData)
  await fs.promises.writeFile(filepath, buffer)
  
  console.log(`💾 Saved tile to: ${filepath}`)
  return filepath
}

// ================================================================
// 6. RENDER IN BROWSER (React/HTML)
// ================================================================

/**
 * Create image element for browser display
 * @param {ArrayBuffer} tileData - Tile image data
 * @param {string} date - Date for alt text
 * @returns {HTMLImageElement} Image element ready for DOM
 */
function createImageElementFromTile(tileData, date) {
  if (typeof window === 'undefined') {
    throw new Error('createImageElementFromTile can only be used in browser environment')
  }
  
  // Create blob from array buffer
  const blob = new Blob([tileData], { type: 'image/jpeg' })
  const objectUrl = URL.createObjectURL(blob)
  
  // Create image element
  const img = document.createElement('img')
  img.src = objectUrl
  img.alt = `Terra satellite imagery for ${date}`
  img.onload = () => {
    // Clean up object URL when image loads
    URL.revokeObjectURL(objectUrl)
  }
  
  return img
}

// ================================================================
// 7. PREFETCH FOR ANIMATION
// ================================================================

/**
 * Prefetch multiple Terra tiles for smooth animation playback
 * @param {Array<string>} dates - Array of dates to prefetch
 * @param {number} z - Zoom level
 * @param {number} x - Tile X coordinate
 * @param {number} y - Tile Y coordinate
 * @param {Object} options - Additional options
 * @returns {Promise<Array>} Array of prefetched tiles
 */
async function prefetchTilesForAnimation(dates, z, x, y, options = {}) {
  console.log(`🎬 Prefetching ${dates.length} tiles for animation...`)
  
  const results = await Promise.all(
    dates.map(async (date) => {
      const tileData = await fetchTerraTileWithRetries(date, z, x, y, options)
      
      let objectUrl = null
      if (tileData && typeof window !== 'undefined') {
        // Create object URL for browser use
        const blob = new Blob([tileData], { type: 'image/jpeg' })
        objectUrl = URL.createObjectURL(blob)
      }
      
      return {
        date,
        success: tileData !== null,
        data: tileData,
        objectUrl // Ready for immediate display
      }
    })
  )
  
  const successCount = results.filter(r => r.success).length
  console.log(`📦 Prefetched ${successCount}/${dates.length} tiles for animation`)
  
  return results
}

// ================================================================
// 8. UTILITY FUNCTIONS
// ================================================================

/**
 * Generate array of dates between start and end date
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @param {string} endDate - End date in YYYY-MM-DD format
 * @returns {Array<string>} Array of date strings
 */
function generateDateRange(startDate, endDate) {
  const dates = []
  const start = new Date(startDate)
  const end = new Date(endDate)
  
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    dates.push(d.toISOString().split('T')[0])
  }
  
  return dates
}

/**
 * Validate date format (YYYY-MM-DD)
 * @param {string} date - Date string to validate
 * @returns {boolean} True if valid
 */
function isValidDate(date) {
  const regex = /^\d{4}-\d{2}-\d{2}$/
  if (!regex.test(date)) return false
  
  const parsedDate = new Date(date)
  return parsedDate instanceof Date && !isNaN(parsedDate.getTime())
}

// ================================================================
// 9. EXAMPLE USAGE
// ================================================================

/**
 * Example: Fetch tiles for August 1-10, 2023 and save them
 */
async function exampleFetchAndSave() {
  console.log('🌍 Example: Fetching Terra tiles for 2023-08-01 → 2023-08-10')
  
  const results = await fetchMultipleTerraImages(
    '2023-08-01',  // Start date
    '2023-08-10',  // End date
    3,             // Zoom level (global view)
    4,             // X coordinate
    2,             // Y coordinate
    {
      layer: 'MODIS_Terra_CorrectedReflectance_TrueColor',
      resolution: '250m',
      saveLocal: true,
      concurrency: 2
    }
  )
  
  console.log('📊 Results:')
  results.forEach(result => {
    console.log(`  ${result.date}: ${result.success ? '✅' : '❌'} ${result.size} bytes`)
  })
  
  return results
}

// ================================================================
// EXPORTS (for use in other modules)
// ================================================================

// Export all functions for use in other files
if (typeof module !== 'undefined' && module.exports) {
  // Node.js
  module.exports = {
    getTerraTile,
    fetchTerraTileWithRetries,
    fetchMultipleTerraImages,
    fetchTerraWithEarthdataLogin,
    saveTileToFile,
    prefetchTilesForAnimation,
    generateDateRange,
    isValidDate,
    exampleFetchAndSave
  }
} else if (typeof window !== 'undefined') {
  // Browser
  window.TerraIntegration = {
    getTerraTile,
    fetchTerraTileWithRetries,
    fetchMultipleTerraImages,
    fetchTerraWithEarthdataLogin,
    createImageElementFromTile,
    prefetchTilesForAnimation,
    generateDateRange,
    isValidDate
  }
}

// ================================================================
// AUTO-RUN EXAMPLE (if loaded directly)
// ================================================================
if (typeof window === 'undefined' && typeof require !== 'undefined') {
  // Running in Node.js directly
  console.log('🛰️ Terra25 NASA Satellite Data Integration')
  console.log('Ready to fetch Terra imagery!')
  console.log('')
  console.log('Available functions:')
  console.log('• getTerraTile(date, z, x, y) - Generate tile URL')
  console.log('• fetchTerraTileWithRetries(date, z, x, y) - Fetch single tile')
  console.log('• fetchMultipleTerraImages(start, end, z, x, y) - Fetch multiple tiles')
  console.log('• prefetchTilesForAnimation(dates, z, x, y) - Prefetch for animation')
  console.log('')
  console.log('Example usage:')
  console.log('  const url = getTerraTile("2024-01-15", 3, 4, 2)')
  console.log('  console.log(url)')
}