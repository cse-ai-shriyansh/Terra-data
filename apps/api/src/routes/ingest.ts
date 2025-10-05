import { Router, Request, Response } from 'express'
import axios from 'axios'

export const ingestRouter = Router()

interface IngestRequest {
  product: string
  date: string
  bbox: [number, number, number, number]
  resolution?: string
  format?: 'png' | 'jpeg' | 'geotiff'
}

/**
 * POST /api/ingest
 * Trigger data ingestion for a specific dataset and region
 */
ingestRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { product, date, bbox, resolution = '250m', format = 'png' }: IngestRequest = req.body

    // Validate required fields
    if (!product || !date || !bbox) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['product', 'date', 'bbox']
      })
    }

    // Validate bbox format
    if (!Array.isArray(bbox) || bbox.length !== 4) {
      return res.status(400).json({
        error: 'Invalid bbox format',
        expected: '[minLng, minLat, maxLng, maxLat]'
      })
    }

    console.log(`📥 Ingesting data: ${product} for ${date}`)
    console.log(`📍 Region: ${bbox.join(', ')}`)

    // TODO: Implement actual NASA API calls
    // For now, return a mock response
    const mockResponse = {
      id: `ingest-${Date.now()}`,
      product,
      date,
      bbox,
      resolution,
      format,
      status: 'processing',
      timestamp: new Date().toISOString(),
      estimatedCompletion: new Date(Date.now() + 300000).toISOString(), // 5 minutes
      frames: generateMockFrames(product, date, bbox)
    }

    res.json({
      message: 'Ingestion started successfully',
      data: mockResponse
    })

  } catch (error) {
    console.error('Ingestion error:', error)
    res.status(500).json({
      error: 'Ingestion failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

/**
 * GET /api/ingest/:id
 * Get ingestion job status
 */
ingestRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    // TODO: Implement actual status tracking
    // For now, return mock status
    const mockStatus = {
      id,
      status: Math.random() > 0.3 ? 'completed' : 'processing',
      progress: Math.min(100, Math.random() * 100),
      framesProcessed: Math.floor(Math.random() * 30),
      totalFrames: 30,
      timestamp: new Date().toISOString()
    }

    res.json(mockStatus)

  } catch (error) {
    console.error('Status check error:', error)
    res.status(500).json({
      error: 'Status check failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Helper function to generate mock frame data
function generateMockFrames(product: string, startDate: string, bbox: [number, number, number, number]) {
  const frames = []
  const start = new Date(startDate)
  
  // Generate 30 days of mock frames
  for (let i = 0; i < 30; i++) {
    const frameDate = new Date(start)
    frameDate.setDate(start.getDate() + i)
    
    frames.push({
      id: `frame-${product}-${frameDate.toISOString().split('T')[0]}-${i}`,
      date: frameDate.toISOString().split('T')[0],
      imageUrl: `/api/frames/mock/${product}/${frameDate.toISOString().split('T')[0]}.png`,
      dataUrl: `/api/frames/mock/${product}/${frameDate.toISOString().split('T')[0]}.json`,
      metadata: {
        product,
        bbox,
        resolution: '250m',
        cloudCover: Math.random() * 100,
        quality: Math.random() > 0.8 ? 'high' : 'medium'
      }
    })
  }
  
  return frames
}