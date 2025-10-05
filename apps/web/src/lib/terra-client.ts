/**
 * Client-side Terra utilities for browser usage
 * This module provides functions to work with NASA Terra satellite data in the browser
 */

export interface TerraApiResponse {
  success: boolean
  url?: string
  date?: string
  coordinates?: { z: number; x: number; y: number }
  layer?: string
  resolution?: string
  error?: string
}

export interface TerraSequenceResponse {
  success: boolean
  totalTiles: number
  successfulTiles: number
  failedTiles: number
  tiles: Array<{
    date: string
    success: boolean
    url: string | null
  }>
}

/**
 * Terra client for browser-side operations
 */
export class TerraClient {
  private apiUrl: string

  constructor(apiUrl: string = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003') {
    this.apiUrl = apiUrl
  }

  /**
   * Generate Terra tile URL using the API
   * @param date - Date in YYYY-MM-DD format
   * @param z - Zoom level
   * @param x - Tile X coordinate
   * @param y - Tile Y coordinate
   * @param layer - GIBS layer name (optional)
   * @param resolution - Tile resolution (optional)
   * @returns Promise with NASA GIBS URL
   */
  async getTerraTileUrl(
    date: string,
    z: number,
    x: number,
    y: number,
    layer?: string,
    resolution?: string
  ): Promise<string | null> {
    try {
      const params = new URLSearchParams()
      if (layer) params.append('layer', layer)
      if (resolution) params.append('resolution', resolution)
      
      const url = `${this.apiUrl}/api/terra/url/${date}/${z}/${x}/${y}?${params.toString()}`
      
      const response = await fetch(url)
      const data: TerraApiResponse = await response.json()
      
      if (data.success && data.url) {
        return data.url
      }
      
      console.error('Failed to get Terra tile URL:', data.error)
      return null
      
    } catch (error) {
      console.error('Error fetching Terra tile URL:', error)
      return null
    }
  }

  /**
   * Fetch Terra tile as blob for display in browser
   * @param date - Date in YYYY-MM-DD format
   * @param z - Zoom level
   * @param x - Tile X coordinate
   * @param y - Tile Y coordinate
   * @param layer - GIBS layer name (optional)
   * @param resolution - Tile resolution (optional)
   * @returns Promise with image blob
   */
  async getTerraTileBlob(
    date: string,
    z: number,
    x: number,
    y: number,
    layer?: string,
    resolution?: string
  ): Promise<Blob | null> {
    try {
      const params = new URLSearchParams()
      if (layer) params.append('layer', layer)
      if (resolution) params.append('resolution', resolution)
      
      const url = `${this.apiUrl}/api/terra/tile/${date}/${z}/${x}/${y}?${params.toString()}`
      
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      return await response.blob()
      
    } catch (error) {
      console.error('Error fetching Terra tile blob:', error)
      return null
    }
  }

  /**
   * Generate object URL for Terra tile (for use in img src)
   * @param date - Date in YYYY-MM-DD format
   * @param z - Zoom level
   * @param x - Tile X coordinate
   * @param y - Tile Y coordinate
   * @param layer - GIBS layer name (optional)
   * @param resolution - Tile resolution (optional)
   * @returns Promise with object URL
   */
  async getTerraTileObjectUrl(
    date: string,
    z: number,
    x: number,
    y: number,
    layer?: string,
    resolution?: string
  ): Promise<string | null> {
    const blob = await this.getTerraTileBlob(date, z, x, y, layer, resolution)
    
    if (blob) {
      return URL.createObjectURL(blob)
    }
    
    return null
  }

  /**
   * Fetch multiple Terra tiles for animation
   * @param startDate - Start date in YYYY-MM-DD format
   * @param endDate - End date in YYYY-MM-DD format
   * @param z - Zoom level
   * @param x - Tile X coordinate
   * @param y - Tile Y coordinate
   * @param options - Additional options
   * @returns Promise with sequence metadata
   */
  async fetchTerraSequence(
    startDate: string,
    endDate: string,
    z: number,
    x: number,
    y: number,
    options: {
      layer?: string
      resolution?: string
      concurrency?: number
    } = {}
  ): Promise<TerraSequenceResponse | null> {
    try {
      const response = await fetch(`${this.apiUrl}/api/terra/sequence`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate,
          endDate,
          z,
          x,
          y,
          ...options,
          saveLocal: false // Don't save on server for browser requests
        })
      })
      
      const data: TerraSequenceResponse = await response.json()
      
      if (data.success) {
        console.log(`✅ Fetched ${data.successfulTiles}/${data.totalTiles} Terra tiles`)
        return data
      } else {
        console.error('Failed to fetch Terra sequence')
        return null
      }
      
    } catch (error) {
      console.error('Error fetching Terra sequence:', error)
      return null
    }
  }

  /**
   * Prefetch tiles for smooth animation playback
   * @param dates - Array of dates in YYYY-MM-DD format
   * @param z - Zoom level
   * @param x - Tile X coordinate
   * @param y - Tile Y coordinate
   * @param layer - GIBS layer name (optional)
   * @param resolution - Tile resolution (optional)
   * @returns Promise with array of object URLs
   */
  async prefetchTilesForAnimation(
    dates: string[],
    z: number,
    x: number,
    y: number,
    layer?: string,
    resolution?: string
  ): Promise<Array<{ date: string; url: string | null }>> {
    console.log(`🎬 Prefetching ${dates.length} tiles for animation...`)
    
    const results = await Promise.all(
      dates.map(async (date) => {
        const url = await this.getTerraTileObjectUrl(date, z, x, y, layer, resolution)
        return { date, url }
      })
    )
    
    const successCount = results.filter(r => r.url !== null).length
    console.log(`📦 Prefetched ${successCount}/${dates.length} tiles`)
    
    return results
  }

  /**
   * Get available Terra layers
   * @returns Promise with layers information
   */
  async getAvailableLayers(): Promise<any> {
    try {
      const response = await fetch(`${this.apiUrl}/api/terra/layers`)
      const data = await response.json()
      
      if (data.success) {
        return data.layers
      }
      
      return {}
      
    } catch (error) {
      console.error('Error fetching Terra layers:', error)
      return {}
    }
  }

  /**
   * Generate date range array
   * @param startDate - Start date in YYYY-MM-DD format
   * @param endDate - End date in YYYY-MM-DD format
   * @returns Array of date strings
   */
  generateDateRange(startDate: string, endDate: string): string[] {
    const dates: string[] = []
    const start = new Date(startDate)
    const end = new Date(endDate)
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      dates.push(d.toISOString().split('T')[0])
    }
    
    return dates
  }

  /**
   * Validate date format
   * @param date - Date string to validate
   * @returns Boolean indicating if date is valid
   */
  isValidDate(date: string): boolean {
    const regex = /^\d{4}-\d{2}-\d{2}$/
    if (!regex.test(date)) return false
    
    const parsedDate = new Date(date)
    return parsedDate instanceof Date && !isNaN(parsedDate.getTime())
  }
}

// Example usage functions

/**
 * Example: Fetch a single Terra tile
 */
export async function exampleFetchSingleTile() {
  const client = new TerraClient()
  
  console.log('🌍 Fetching single Terra tile...')
  
  // Fetch tile for January 15, 2024, global view
  const tileUrl = await client.getTerraTileUrl(
    '2024-01-15', // date
    3,            // zoom level (global view)
    4,            // x coordinate
    2,            // y coordinate
    'MODIS_Terra_CorrectedReflectance_TrueColor', // layer
    '250m'        // resolution
  )
  
  if (tileUrl) {
    console.log('✅ Tile URL:', tileUrl)
    return tileUrl
  } else {
    console.log('❌ Failed to fetch tile')
    return null
  }
}

/**
 * Example: Fetch multiple tiles for animation
 */
export async function exampleFetchTileSequence() {
  const client = new TerraClient()
  
  console.log('🎬 Fetching Terra tile sequence...')
  
  // Fetch tiles from August 1-10, 2023
  const sequence = await client.fetchTerraSequence(
    '2023-08-01', // start date
    '2023-08-10', // end date
    3,            // zoom level
    4,            // x coordinate
    2,            // y coordinate
    {
      layer: 'MODIS_Terra_CorrectedReflectance_TrueColor',
      resolution: '250m',
      concurrency: 2
    }
  )
  
  if (sequence) {
    console.log(`✅ Sequence: ${sequence.successfulTiles}/${sequence.totalTiles} tiles`)
    console.log('Tile URLs:')
    sequence.tiles.forEach(tile => {
      if (tile.success && tile.url) {
        console.log(`  ${tile.date}: ${tile.url}`)
      }
    })
    return sequence
  } else {
    console.log('❌ Failed to fetch sequence')
    return null
  }
}

/**
 * Example: Prefetch tiles for animation playback
 */
export async function examplePrefetchForAnimation() {
  const client = new TerraClient()
  
  console.log('📦 Prefetching tiles for animation...')
  
  // Generate date range
  const dates = client.generateDateRange('2023-08-01', '2023-08-10')
  
  // Prefetch tiles
  const prefetchedTiles = await client.prefetchTilesForAnimation(
    dates,
    3, // zoom level
    4, // x coordinate  
    2, // y coordinate
    'MODIS_Terra_CorrectedReflectance_TrueColor',
    '250m'
  )
  
  console.log('📦 Prefetched tiles:')
  prefetchedTiles.forEach(tile => {
    if (tile.url) {
      console.log(`  ${tile.date}: Ready for animation`)
    } else {
      console.log(`  ${tile.date}: ❌ Failed to load`)
    }
  })
  
  return prefetchedTiles
}

// Export singleton instance
export const terraClient = new TerraClient()