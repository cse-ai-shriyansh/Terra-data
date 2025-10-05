import axios, { AxiosResponse } from 'axios'
import fs from 'fs'
import path from 'path'

/**
 * Terra satellite data service for NASA GIBS WMTS API integration
 */
export class TerraService {
  private baseUrl = 'https://gibs.earthdata.nasa.gov/wmts/epsg4326/best'
  private defaultLayer = 'MODIS_Terra_CorrectedReflectance_TrueColor'
  private defaultResolution = '250m'
  private retryAttempts = 3
  private retryDelay = 1000

  /**
   * Generate Terra tile URL for NASA GIBS WMTS API
   * @param date - Date in YYYY-MM-DD format
   * @param z - Zoom level
   * @param x - Tile X coordinate
   * @param y - Tile Y coordinate
   * @param layer - GIBS layer name (optional)
   * @param resolution - Tile resolution (optional)
   * @returns Formatted WMTS URL
   */
  getTerraTileUrl(
    date: string,
    z: number,
    x: number,
    y: number,
    layer: string = this.defaultLayer,
    resolution: string = this.defaultResolution
  ): string {
    return `${this.baseUrl}/${layer}/default/${date}/${resolution}/${z}/${y}/${x}.jpg`
  }

  /**
   * Fetch a single Terra tile with error handling and retries
   * @param date - Date in YYYY-MM-DD format
   * @param z - Zoom level
   * @param x - Tile X coordinate
   * @param y - Tile Y coordinate
   * @param options - Additional options
   * @returns Promise with tile buffer or null if failed
   */
  async getTerraTile(
    date: string,
    z: number,
    x: number,
    y: number,
    options: {
      layer?: string
      resolution?: string
      saveLocal?: boolean
      outputDir?: string
    } = {}
  ): Promise<Buffer | null> {
    const { layer, resolution, saveLocal = false, outputDir = './tiles' } = options
    const url = this.getTerraTileUrl(date, z, x, y, layer, resolution)

    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        console.log(`🌍 Fetching Terra tile: ${date} [${z}/${x}/${y}] (attempt ${attempt})`)
        
        const response: AxiosResponse<Buffer> = await axios.get(url, {
          responseType: 'arraybuffer',
          timeout: 30000,
          headers: {
            'User-Agent': 'Terra25-NASA-Data-Portal/1.0'
          }
        })

        const buffer = Buffer.from(response.data)
        
        // Save locally if requested
        if (saveLocal) {
          await this.saveTileLocally(buffer, date, z, x, y, outputDir)
        }

        console.log(`✅ Successfully fetched tile: ${date} [${z}/${x}/${y}]`)
        return buffer

      } catch (error) {
        console.error(`❌ Attempt ${attempt} failed for tile ${date} [${z}/${x}/${y}]:`, error)
        
        if (attempt === this.retryAttempts) {
          console.error(`🚫 All retry attempts failed for tile: ${date} [${z}/${x}/${y}]`)
          return null
        }
        
        // Exponential backoff
        await this.delay(this.retryDelay * Math.pow(2, attempt - 1))
      }
    }

    return null
  }

  /**
   * Fetch multiple Terra tiles for a date range
   * @param startDate - Start date in YYYY-MM-DD format
   * @param endDate - End date in YYYY-MM-DD format
   * @param z - Zoom level
   * @param x - Tile X coordinate
   * @param y - Tile Y coordinate
   * @param options - Additional options
   * @returns Promise with array of tile results
   */
  async getTerraTileSequence(
    startDate: string,
    endDate: string,
    z: number,
    x: number,
    y: number,
    options: {
      layer?: string
      resolution?: string
      saveLocal?: boolean
      outputDir?: string
      concurrency?: number
    } = {}
  ): Promise<Array<{ date: string; tile: Buffer | null; success: boolean }>> {
    const { concurrency = 3 } = options
    const dates = this.generateDateRange(startDate, endDate)
    
    console.log(`🚀 Fetching ${dates.length} Terra tiles from ${startDate} to ${endDate}`)
    
    const results: Array<{ date: string; tile: Buffer | null; success: boolean }> = []
    
    // Process dates in batches to avoid overwhelming the API
    for (let i = 0; i < dates.length; i += concurrency) {
      const batch = dates.slice(i, i + concurrency)
      
      const batchPromises = batch.map(async (date) => {
        const tile = await this.getTerraTile(date, z, x, y, options)
        return {
          date,
          tile,
          success: tile !== null
        }
      })
      
      const batchResults = await Promise.all(batchPromises)
      results.push(...batchResults)
      
      // Small delay between batches
      if (i + concurrency < dates.length) {
        await this.delay(500)
      }
    }
    
    const successCount = results.filter(r => r.success).length
    console.log(`📊 Completed: ${successCount}/${dates.length} tiles successfully fetched`)
    
    return results
  }

  /**
   * Save tile buffer to local filesystem
   * @param buffer - Tile image buffer
   * @param date - Date string
   * @param z - Zoom level
   * @param x - Tile X coordinate
   * @param y - Tile Y coordinate
   * @param outputDir - Output directory
   */
  private async saveTileLocally(
    buffer: Buffer,
    date: string,
    z: number,
    x: number,
    y: number,
    outputDir: string
  ): Promise<void> {
    const dirPath = path.join(outputDir, date)
    const filename = `tile_${z}_${x}_${y}.jpg`
    const filePath = path.join(dirPath, filename)
    
    // Ensure directory exists
    await fs.promises.mkdir(dirPath, { recursive: true })
    
    // Write file
    await fs.promises.writeFile(filePath, buffer)
    console.log(`💾 Saved tile to: ${filePath}`)
  }

  /**
   * Generate array of dates between start and end date
   * @param startDate - Start date in YYYY-MM-DD format
   * @param endDate - End date in YYYY-MM-DD format
   * @returns Array of date strings
   */
  private generateDateRange(startDate: string, endDate: string): string[] {
    const dates: string[] = []
    const start = new Date(startDate)
    const end = new Date(endDate)
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      dates.push(d.toISOString().split('T')[0])
    }
    
    return dates
  }

  /**
   * Utility function for delays
   * @param ms - Milliseconds to delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Get available Terra layers and their information
   */
  getAvailableLayers() {
    return {
      'MODIS_Terra_CorrectedReflectance_TrueColor': {
        description: 'MODIS Terra Corrected Reflectance (True Color)',
        resolutions: ['250m', '500m', '1km'],
        format: 'jpg'
      },
      'MODIS_Terra_CorrectedReflectance_Bands721': {
        description: 'MODIS Terra Corrected Reflectance (Bands 7-2-1)',
        resolutions: ['250m', '500m', '1km'],
        format: 'jpg'
      },
      'MODIS_Terra_CorrectedReflectance_Bands367': {
        description: 'MODIS Terra Corrected Reflectance (Bands 3-6-7)',
        resolutions: ['250m', '500m', '1km'],
        format: 'jpg'
      },
      'MODIS_Terra_SurfaceReflectance_Bands121': {
        description: 'MODIS Terra Surface Reflectance (Bands 1-2-1)',
        resolutions: ['250m', '500m'],
        format: 'jpg'
      }
    }
  }

  /**
   * Validate date format (YYYY-MM-DD)
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

// Export singleton instance
export const terraService = new TerraService()