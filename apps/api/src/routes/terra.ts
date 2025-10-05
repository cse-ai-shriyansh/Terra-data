import { Router, Request, Response } from 'express'
import { terraService } from '../services/terra-service'

const router = Router()

/**
 * GET /api/terra/tile/:date/:z/:x/:y
 * Fetch a single Terra tile for the specified coordinates and date
 */
router.get('/tile/:date/:z/:x/:y', async (req: Request, res: Response) => {
  try {
    const { date, z, x, y } = req.params
    const { layer, resolution, save } = req.query

    // Validate parameters
    if (!terraService.isValidDate(date)) {
      return res.status(400).json({
        error: 'Invalid date format. Use YYYY-MM-DD'
      })
    }

    const zNum = parseInt(z)
    const xNum = parseInt(x)
    const yNum = parseInt(y)

    if (isNaN(zNum) || isNaN(xNum) || isNaN(yNum)) {
      return res.status(400).json({
        error: 'Invalid tile coordinates. Z, X, Y must be numbers'
      })
    }

    console.log(`🌍 API: Fetching Terra tile for ${date} [${z}/${x}/${y}]`)

    // Fetch the tile
    const tileBuffer = await terraService.getTerraTile(date, zNum, xNum, yNum, {
      layer: layer as string,
      resolution: resolution as string,
      saveLocal: save === 'true',
      outputDir: './public/tiles'
    })

    if (!tileBuffer) {
      return res.status(404).json({
        error: 'Tile not found or failed to fetch'
      })
    }

    // Return the image
    res.set({
      'Content-Type': 'image/jpeg',
      'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
      'Access-Control-Allow-Origin': '*'
    })
    
    res.send(tileBuffer)

  } catch (error) {
    console.error('Error fetching Terra tile:', error)
    res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Failed to fetch tile'
    })
  }
})

/**
 * POST /api/terra/sequence
 * Fetch multiple Terra tiles for a date range
 */
router.post('/sequence', async (req: Request, res: Response) => {
  try {
    const {
      startDate,
      endDate,
      z,
      x,
      y,
      layer,
      resolution,
      saveLocal = false,
      concurrency = 3
    } = req.body

    // Validate required parameters
    if (!startDate || !endDate || z === undefined || x === undefined || y === undefined) {
      return res.status(400).json({
        error: 'Missing required parameters: startDate, endDate, z, x, y'
      })
    }

    if (!terraService.isValidDate(startDate) || !terraService.isValidDate(endDate)) {
      return res.status(400).json({
        error: 'Invalid date format. Use YYYY-MM-DD'
      })
    }

    console.log(`🚀 API: Fetching Terra sequence from ${startDate} to ${endDate}`)

    // Fetch the tile sequence
    const results = await terraService.getTerraTileSequence(
      startDate,
      endDate,
      parseInt(z),
      parseInt(x),
      parseInt(y),
      {
        layer,
        resolution,
        saveLocal,
        outputDir: './public/tiles',
        concurrency: parseInt(concurrency)
      }
    )

    // Return metadata (not the actual images to avoid large responses)
    const metadata = results.map(result => ({
      date: result.date,
      success: result.success,
      url: result.success 
        ? `/api/terra/tile/${result.date}/${z}/${x}/${y}${layer ? `?layer=${layer}` : ''}${resolution ? `&resolution=${resolution}` : ''}`
        : null
    }))

    res.json({
      success: true,
      totalTiles: results.length,
      successfulTiles: results.filter(r => r.success).length,
      failedTiles: results.filter(r => !r.success).length,
      tiles: metadata
    })

  } catch (error) {
    console.error('Error fetching Terra sequence:', error)
    res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Failed to fetch sequence'
    })
  }
})

/**
 * GET /api/terra/layers
 * Get available Terra layers and their information
 */
router.get('/layers', (req: Request, res: Response) => {
  try {
    const layers = terraService.getAvailableLayers()
    res.json({
      success: true,
      layers
    })
  } catch (error) {
    console.error('Error getting Terra layers:', error)
    res.status(500).json({
      error: 'Internal server error'
    })
  }
})

/**
 * GET /api/terra/url/:date/:z/:x/:y
 * Get the direct NASA GIBS URL for a tile (without fetching)
 */
router.get('/url/:date/:z/:x/:y', (req: Request, res: Response) => {
  try {
    const { date, z, x, y } = req.params
    const { layer, resolution } = req.query

    if (!terraService.isValidDate(date)) {
      return res.status(400).json({
        error: 'Invalid date format. Use YYYY-MM-DD'
      })
    }

    const url = terraService.getTerraTileUrl(
      date,
      parseInt(z),
      parseInt(x),
      parseInt(y),
      layer as string,
      resolution as string
    )

    res.json({
      success: true,
      url,
      date,
      coordinates: { z: parseInt(z), x: parseInt(x), y: parseInt(y) },
      layer: layer || 'MODIS_Terra_CorrectedReflectance_TrueColor',
      resolution: resolution || '250m'
    })

  } catch (error) {
    console.error('Error generating Terra URL:', error)
    res.status(500).json({
      error: 'Internal server error'
    })
  }
})

export { router as terraRouter }