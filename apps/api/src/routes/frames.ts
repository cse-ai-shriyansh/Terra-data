import { Router, Request, Response } from 'express'

export const framesRouter = Router()

/**
 * GET /api/frames/:product/:date
 * Get frame data for a specific product and date
 */
framesRouter.get('/:product/:date', async (req: Request, res: Response) => {
  try {
    const { product, date } = req.params
    const { bbox, format = 'png' } = req.query

    console.log(`🖼️  Requesting frame: ${product} for ${date}`)

    // TODO: Implement actual frame serving from S3/storage
    // For now, return mock frame data
    const mockFrame = {
      id: `frame-${product}-${date}`,
      product,
      date,
      imageUrl: generateMockImageUrl(product, date),
      dataUrl: generateMockDataUrl(product, date),
      metadata: {
        product,
        date,
        bbox: bbox ? JSON.parse(bbox as string) : [-180, -90, 180, 90],
        resolution: '250m',
        format,
        size: {
          width: 1024,
          height: 512
        },
        projection: 'EPSG:4326',
        cloudCover: Math.random() * 100,
        quality: Math.random() > 0.8 ? 'high' : 'medium',
        timestamp: new Date().toISOString()
      }
    }

    res.json(mockFrame)

  } catch (error) {
    console.error('Frame retrieval error:', error)
    res.status(500).json({
      error: 'Frame retrieval failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

/**
 * GET /api/frames/sequence/:product
 * Get a sequence of frames for animation
 */
framesRouter.get('/sequence/:product', async (req: Request, res: Response) => {
  try {
    const { product } = req.params
    const { 
      startDate, 
      endDate, 
      bbox, 
      interval = 'daily',
      limit = 30 
    } = req.query

    if (!startDate || !endDate) {
      return res.status(400).json({
        error: 'Missing required parameters',
        required: ['startDate', 'endDate']
      })
    }

    console.log(`🎬 Requesting frame sequence: ${product} from ${startDate} to ${endDate}`)

    // Generate frame sequence
    const frames = generateFrameSequence(
      product,
      startDate as string,
      endDate as string,
      parseInt(limit as string) || 30
    )

    res.json({
      product,
      startDate,
      endDate,
      totalFrames: frames.length,
      interval,
      frames
    })

  } catch (error) {
    console.error('Frame sequence error:', error)
    res.status(500).json({
      error: 'Frame sequence retrieval failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

/**
 * GET /api/frames/mock/:product/:filename
 * Serve mock frame images (placeholder endpoint)
 */
framesRouter.get('/mock/:product/:filename', (req: Request, res: Response) => {
  const { product, filename } = req.params
  
  // Generate a simple colored rectangle as placeholder
  // In production, this would serve actual processed satellite imagery
  const color = getProductColor(product)
  
  res.json({
    message: 'Mock frame endpoint',
    product,
    filename,
    note: 'In production, this would serve actual satellite imagery',
    placeholderColor: color,
    imageUrl: `https://via.placeholder.com/1024x512/${color.replace('#', '')}/ffffff?text=${product}+${filename}`
  })
})

// Helper functions
function generateMockImageUrl(product: string, date: string): string {
  const color = getProductColor(product).replace('#', '')
  return `https://via.placeholder.com/1024x512/${color}/ffffff?text=${product}+${date}`
}

function generateMockDataUrl(product: string, date: string): string {
  return `/api/frames/mock/${product}/${date}.json`
}

function getProductColor(product: string): string {
  const colors: Record<string, string> = {
    'MODIS_Terra_CorrectedReflectance_TrueColor': '#4A90E2',
    'MODIS_Terra_Fires': '#E94B3C',
    'MOPITT_CO_Total_Column': '#F5A623',
    'MISR_Aerosol_Optical_Depth': '#7ED321',
    'ASTER_Land_Surface_Temperature': '#D0021B',
    'CERES_Net_Radiation': '#BD10E0'
  }
  
  return colors[product] || '#6B7280'
}

function generateFrameSequence(
  product: string, 
  startDate: string, 
  endDate: string, 
  limit: number
) {
  const frames = []
  const start = new Date(startDate)
  const end = new Date(endDate)
  const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  const step = Math.max(1, Math.floor(daysDiff / limit))

  for (let i = 0; i < limit && i * step <= daysDiff; i++) {
    const frameDate = new Date(start)
    frameDate.setDate(start.getDate() + (i * step))
    
    const dateStr = frameDate.toISOString().split('T')[0]
    
    frames.push({
      id: `frame-${product}-${dateStr}-${i}`,
      index: i,
      date: dateStr,
      imageUrl: generateMockImageUrl(product, dateStr),
      dataUrl: generateMockDataUrl(product, dateStr),
      metadata: {
        product,
        date: dateStr,
        resolution: '250m',
        cloudCover: Math.random() * 100,
        quality: Math.random() > 0.8 ? 'high' : 'medium'
      }
    })
  }

  return frames
}