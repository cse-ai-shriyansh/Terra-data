#!/usr/bin/env node

/**
 * Terra Satellite Data Integration Demo
 * This script demonstrates all the Terra integration features we've built
 */

import axios from 'axios'
import fs from 'fs'
import path from 'path'

// API Base URL
const API_BASE = 'http://localhost:3004'

/**
 * 1. SIMPLEST VERSION: Get Terra Tile URL
 * This is the basic function you requested
 */
function getTerraTile(date, z, x, y, layer = 'MODIS_Terra_CorrectedReflectance_TrueColor', resolution = '250m') {
  return `https://gibs.earthdata.nasa.gov/wmts/epsg4326/best/${layer}/default/${date}/${resolution}/${z}/${y}/${x}.jpg`
}

/**
 * 2. ENHANCED VERSION: Fetch Terra Tile with Error Handling
 */
async function fetchTerraTile(date, z, x, y, options = {}) {
  const { layer, resolution, saveLocal = false, retries = 3 } = options
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`🌍 Fetching Terra tile: ${date} [${z}/${x}/${y}] (attempt ${attempt})`)
      
      const url = getTerraTile(date, z, x, y, layer, resolution)
      const response = await axios.get(url, { 
        responseType: 'arraybuffer',
        timeout: 30000,
        headers: {
          'User-Agent': 'Terra25-NASA-Data-Portal/1.0'
        }
      })
      
      const buffer = Buffer.from(response.data)
      
      if (saveLocal) {
        const filename = `terra_${date}_${z}_${x}_${y}.jpg`
        const filepath = path.join('./downloads', filename)
        
        // Ensure downloads directory exists
        await fs.promises.mkdir('./downloads', { recursive: true })
        await fs.promises.writeFile(filepath, buffer)
        console.log(`💾 Saved: ${filepath}`)
      }
      
      console.log(`✅ Successfully fetched tile: ${date} [${z}/${x}/${y}]`)
      return buffer
      
    } catch (error) {
      console.error(`❌ Attempt ${attempt} failed:`, error.message)
      
      if (attempt === retries) {
        console.error(`🚫 All ${retries} attempts failed for tile: ${date} [${z}/${x}/${y}]`)
        return null
      }
      
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt - 1)))
    }
  }
}

/**
 * 3. MULTIPLE DATES: Loop Through Date Range
 */
async function fetchMultipleDates(startDate, endDate, z, x, y, options = {}) {
  console.log(`🚀 Fetching Terra tiles from ${startDate} to ${endDate}`)
  
  const dates = generateDateRange(startDate, endDate)
  const results = []
  
  for (const date of dates) {
    const tile = await fetchTerraTile(date, z, x, y, options)
    results.push({
      date,
      success: tile !== null,
      size: tile ? tile.length : 0
    })
    
    // Small delay to be respectful to NASA servers
    await new Promise(resolve => setTimeout(resolve, 500))
  }
  
  const successCount = results.filter(r => r.success).length
  console.log(`📊 Completed: ${successCount}/${dates.length} tiles successfully fetched`)
  
  return results
}

/**
 * 4. ANIMATION PREFETCH: Fetch tiles for smooth animation
 */
async function prefetchForAnimation(startDate, endDate, z, x, y, options = {}) {
  console.log(`🎬 Prefetching tiles for animation: ${startDate} → ${endDate}`)
  
  const dates = generateDateRange(startDate, endDate)
  const { concurrency = 3 } = options
  
  const results = []
  
  // Process in batches for better performance
  for (let i = 0; i < dates.length; i += concurrency) {
    const batch = dates.slice(i, i + concurrency)
    
    const batchPromises = batch.map(async (date) => {
      const tile = await fetchTerraTile(date, z, x, y, { ...options, saveLocal: true })
      return {
        date,
        success: tile !== null,
        filename: tile ? `terra_${date}_${z}_${x}_${y}.jpg` : null
      }
    })
    
    const batchResults = await Promise.all(batchPromises)
    results.push(...batchResults)
    
    console.log(`📦 Batch ${Math.floor(i/concurrency) + 1} complete`)
  }
  
  return results
}

/**
 * 5. EARTHDATA LOGIN INTEGRATION (Example)
 * Note: For production use, you'd want to use OAuth2 or URS tokens
 */
async function fetchWithEarthdataAuth(date, z, x, y, credentials) {
  try {
    const url = getTerraTile(date, z, x, y)
    
    // Basic Auth example (replace with actual Earthdata credentials)
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      auth: credentials ? {
        username: credentials.username,
        password: credentials.password
      } : undefined,
      headers: {
        'User-Agent': 'Terra25-NASA-Data-Portal/1.0'
      }
    })
    
    return Buffer.from(response.data)
    
  } catch (error) {
    console.error('Earthdata authentication failed:', error.message)
    return null
  }
}

/**
 * 6. API INTEGRATION: Use our Terra25 API
 */
async function useTerraTileAPI(date, z, x, y, options = {}) {
  try {
    console.log(`🔗 Using Terra25 API for tile: ${date} [${z}/${x}/${y}]`)
    
    const { layer, resolution } = options
    const params = new URLSearchParams()
    if (layer) params.append('layer', layer)
    if (resolution) params.append('resolution', resolution)
    
    const response = await axios.get(`${API_BASE}/api/terra/tile/${date}/${z}/${x}/${y}?${params.toString()}`, {
      responseType: 'arraybuffer'
    })
    
    console.log(`✅ API response: ${response.status} ${response.statusText}`)
    return Buffer.from(response.data)
    
  } catch (error) {
    console.error('❌ API request failed:', error.message)
    return null
  }
}

/**
 * UTILITY: Generate date range
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
 * DEMO FUNCTIONS
 */

// Demo 1: Simple tile fetch
async function demo1_SimpleTile() {
  console.log('\n🎯 DEMO 1: Simple Terra Tile URL Generation')
  console.log('='.repeat(50))
  
  const date = '2024-01-15'
  const z = 3, x = 4, y = 2  // Global view tile
  
  const tileUrl = getTerraTile(date, z, x, y)
  console.log(`📡 Terra tile URL: ${tileUrl}`)
  
  // Test direct fetch
  const tile = await fetchTerraTile(date, z, x, y, { saveLocal: true })
  console.log(`💾 Tile fetched: ${tile ? 'Success' : 'Failed'}`)
}

// Demo 2: Multiple dates sequence
async function demo2_Multipledates() {
  console.log('\n🎯 DEMO 2: Multiple Dates Sequence (Animation)')
  console.log('='.repeat(50))
  
  const results = await fetchMultipleDates(
    '2023-08-01',  // Start date
    '2023-08-05',  // End date (reduced for demo)
    3, 4, 2,       // Global view coordinates
    { 
      saveLocal: true,
      layer: 'MODIS_Terra_CorrectedReflectance_TrueColor',
      resolution: '250m'
    }
  )
  
  console.log('📊 Results summary:')
  results.forEach(result => {
    console.log(`  ${result.date}: ${result.success ? '✅' : '❌'} ${result.size} bytes`)
  })
}

// Demo 3: API Integration Test
async function demo3_APIIntegration() {
  console.log('\n🎯 DEMO 3: Terra25 API Integration')
  console.log('='.repeat(50))
  
  try {
    // Test API health
    const healthResponse = await axios.get(`${API_BASE}/health`)
    console.log(`🏥 API Health: ${healthResponse.data.status}`)
    
    // Get available layers
    const layersResponse = await axios.get(`${API_BASE}/api/terra/layers`)
    console.log(`📋 Available layers: ${Object.keys(layersResponse.data.layers).length}`)
    
    // Fetch tile via API
    const tile = await useTerraTileAPI('2024-01-15', 3, 4, 2, {
      layer: 'MODIS_Terra_CorrectedReflectance_TrueColor',
      resolution: '250m'
    })
    
    console.log(`🛰️ API tile fetch: ${tile ? 'Success' : 'Failed'}`)
    
  } catch (error) {
    console.log(`⚠️  API not available: ${error.message}`)
    console.log('💡 Start the API server with: npm run dev')
  }
}

// Demo 4: Animation prefetch
async function demo4_AnimationPrefetch() {
  console.log('\n🎯 DEMO 4: Animation Prefetch')
  console.log('='.repeat(50))
  
  const results = await prefetchForAnimation(
    '2023-08-01',
    '2023-08-03',  // Small range for demo
    3, 4, 2,
    {
      concurrency: 2,
      layer: 'MODIS_Terra_CorrectedReflectance_TrueColor',
      resolution: '250m'
    }
  )
  
  console.log('🎬 Animation frames ready:')
  results.forEach(result => {
    console.log(`  ${result.date}: ${result.success ? '🎞️' : '❌'} ${result.filename || 'Failed'}`)
  })
}

/**
 * MAIN EXECUTION
 */
async function main() {
  console.log('🛰️ Terra25 NASA Satellite Data Integration Demo')
  console.log('=' .repeat(60))
  console.log('This demonstrates all the Terra integration features built into your project!')
  console.log('')
  
  try {
    await demo1_SimpleTile()
    await demo2_Multipledates()
    await demo3_APIIntegration()
    await demo4_AnimationPrefetch()
    
    console.log('\n🎉 All demos completed!')
    console.log('📁 Check the ./downloads folder for saved images')
    console.log('🌐 Visit http://localhost:3001/terra for the web interface')
    
  } catch (error) {
    console.error('💥 Demo failed:', error)
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}

export {
  getTerraTile,
  fetchTerraTile, 
  fetchMultipleDates,
  prefetchForAnimation,
  fetchWithEarthdataAuth,
  useTerraTileAPI
}