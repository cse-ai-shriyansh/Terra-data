#!/usr/bin/env node

/**
 * NASA Terra Satellite Data Integration - Example Script
 * 
 * This script demonstrates how to fetch Terra satellite imagery
 * using the Terra25 API and NASA GIBS WMTS endpoints.
 * 
 * Usage:
 *   node examples/terra-example.js
 */

const axios = require('axios')
const fs = require('fs')
const path = require('path')

// Configuration
const API_BASE_URL = process.env.API_URL || 'http://localhost:3003'
const OUTPUT_DIR = './terra-output'

/**
 * Create output directory if it doesn't exist
 */
function ensureOutputDir() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true })
    console.log(`📁 Created output directory: ${OUTPUT_DIR}`)
  }
}

/**
 * Example 1: Fetch a single Terra tile
 */
async function fetchSingleTile() {
  console.log('\n🌍 Example 1: Fetching single Terra tile...')
  
  try {
    const date = '2024-01-15'
    const z = 3, x = 4, y = 2 // Global view coordinates
    const layer = 'MODIS_Terra_CorrectedReflectance_TrueColor'
    const resolution = '250m'
    
    console.log(`📡 Fetching tile for ${date} [${z}/${x}/${y}]`)
    
    // Get the tile URL first
    const urlResponse = await axios.get(
      `${API_BASE_URL}/api/terra/url/${date}/${z}/${x}/${y}?layer=${layer}&resolution=${resolution}`
    )
    
    if (urlResponse.data.success) {
      console.log(`✅ NASA GIBS URL: ${urlResponse.data.url}`)
      
      // Fetch the actual tile
      const tileResponse = await axios.get(
        `${API_BASE_URL}/api/terra/tile/${date}/${z}/${x}/${y}?layer=${layer}&resolution=${resolution}`,
        { responseType: 'arraybuffer' }
      )
      
      // Save the tile
      const filename = `terra_${date}_${z}_${x}_${y}.jpg`
      const filepath = path.join(OUTPUT_DIR, filename)
      
      fs.writeFileSync(filepath, Buffer.from(tileResponse.data))
      console.log(`💾 Saved tile: ${filepath}`)
      
      return filepath
    } else {
      throw new Error('Failed to get tile URL')
    }
    
  } catch (error) {
    console.error('❌ Error fetching single tile:', error.message)
    return null
  }
}

/**
 * Example 2: Fetch multiple tiles for animation
 */
async function fetchTileSequence() {
  console.log('\n🎬 Example 2: Fetching tile sequence for animation...')
  
  try {
    const startDate = '2023-08-01'
    const endDate = '2023-08-05' // 5 days for quick demo
    const z = 3, x = 4, y = 2
    const layer = 'MODIS_Terra_CorrectedReflectance_TrueColor'
    const resolution = '250m'
    
    console.log(`📅 Fetching tiles from ${startDate} to ${endDate}`)
    
    const sequenceResponse = await axios.post(`${API_BASE_URL}/api/terra/sequence`, {
      startDate,
      endDate,
      z,
      x,
      y,
      layer,
      resolution,
      saveLocal: false,
      concurrency: 2
    })
    
    if (sequenceResponse.data.success) {
      const { totalTiles, successfulTiles, tiles } = sequenceResponse.data
      console.log(`✅ Sequence complete: ${successfulTiles}/${totalTiles} tiles`)
      
      // Download each successful tile
      for (const tile of tiles) {
        if (tile.success && tile.url) {
          try {
            const tileResponse = await axios.get(`${API_BASE_URL}${tile.url}`, {
              responseType: 'arraybuffer'
            })
            
            const filename = `animation_${tile.date}_${z}_${x}_${y}.jpg`
            const filepath = path.join(OUTPUT_DIR, filename)
            
            fs.writeFileSync(filepath, Buffer.from(tileResponse.data))
            console.log(`💾 Saved animation frame: ${filename}`)
            
          } catch (error) {
            console.error(`❌ Failed to download tile for ${tile.date}:`, error.message)
          }
        }
      }
      
      return tiles.filter(t => t.success)
    } else {
      throw new Error('Failed to fetch tile sequence')
    }
    
  } catch (error) {
    console.error('❌ Error fetching tile sequence:', error.message)
    return []
  }
}

/**
 * Example 3: Get available layers
 */
async function getAvailableLayers() {
  console.log('\n📋 Example 3: Getting available Terra layers...')
  
  try {
    const response = await axios.get(`${API_BASE_URL}/api/terra/layers`)
    
    if (response.data.success) {
      const layers = response.data.layers
      console.log('🛰️ Available Terra layers:')
      
      Object.entries(layers).forEach(([key, info]) => {
        console.log(`  • ${key}`)
        console.log(`    Description: ${info.description}`)
        console.log(`    Resolutions: ${info.resolutions.join(', ')}`)
        console.log(`    Format: ${info.format}`)
        console.log('')
      })
      
      return layers
    } else {
      throw new Error('Failed to get layers')
    }
    
  } catch (error) {
    console.error('❌ Error getting layers:', error.message)
    return {}
  }
}

/**
 * Example 4: Generate direct NASA GIBS URLs
 */
function generateDirectUrls() {
  console.log('\n🔗 Example 4: Generating direct NASA GIBS URLs...')
  
  const dates = ['2024-01-15', '2024-01-16', '2024-01-17']
  const z = 3, x = 4, y = 2
  const layer = 'MODIS_Terra_CorrectedReflectance_TrueColor'
  const resolution = '250m'
  const baseUrl = 'https://gibs.earthdata.nasa.gov/wmts/epsg4326/best'
  
  console.log('📡 Direct NASA GIBS URLs:')
  dates.forEach(date => {
    const url = `${baseUrl}/${layer}/default/${date}/${resolution}/${z}/${y}/${x}.jpg`
    console.log(`  ${date}: ${url}`)
  })
  
  return dates.map(date => ({
    date,
    url: `${baseUrl}/${layer}/default/${date}/${resolution}/${z}/${y}/${x}.jpg`
  }))
}

/**
 * Check API health
 */
async function checkApiHealth() {
  console.log('🏥 Checking API health...')
  
  try {
    const response = await axios.get(`${API_BASE_URL}/health`)
    if (response.data.status === 'ok') {
      console.log('✅ API is healthy and ready')
      return true
    } else {
      console.log('⚠️ API responded but status is not OK')
      return false
    }
  } catch (error) {
    console.error('❌ API is not accessible:', error.message)
    console.error('💡 Make sure the Terra25 API server is running on', API_BASE_URL)
    return false
  }
}

/**
 * Main function - runs all examples
 */
async function main() {
  console.log('🛰️ NASA Terra Satellite Data Integration Examples')
  console.log('==================================================')
  console.log(`🌐 API URL: ${API_BASE_URL}`)
  
  // Ensure output directory exists
  ensureOutputDir()
  
  // Check API health first
  const isHealthy = await checkApiHealth()
  if (!isHealthy) {
    console.log('\n❌ Cannot proceed without a healthy API connection')
    process.exit(1)
  }
  
  // Run examples
  const results = {
    singleTile: await fetchSingleTile(),
    tileSequence: await fetchTileSequence(),
    availableLayers: await getAvailableLayers(),
    directUrls: generateDirectUrls()
  }
  
  // Summary
  console.log('\n📊 Summary:')
  console.log('==========')
  console.log(`✅ Single tile: ${results.singleTile ? 'Success' : 'Failed'}`)
  console.log(`✅ Tile sequence: ${results.tileSequence.length} tiles downloaded`)
  console.log(`✅ Available layers: ${Object.keys(results.availableLayers).length} layers found`)
  console.log(`✅ Direct URLs: ${results.directUrls.length} URLs generated`)
  
  if (results.singleTile || results.tileSequence.length > 0) {
    console.log(`\n💾 Output files saved in: ${OUTPUT_DIR}`)
    console.log('🎬 You can use these images to create animations or time-lapse videos!')
  }
  
  console.log('\n🚀 Terra integration examples completed!')
}

// Run the examples if this file is executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('\n💥 Fatal error:', error.message)
    process.exit(1)
  })
}

module.exports = {
  fetchSingleTile,
  fetchTileSequence,
  getAvailableLayers,
  generateDirectUrls,
  checkApiHealth
}