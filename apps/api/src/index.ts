import express, { Request, Response, NextFunction } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'
import { ingestRouter } from './routes/ingest'
import { framesRouter } from './routes/frames'
import { exportRouter } from './routes/export'
import { terraRouter } from './routes/terra'
import bulkDownloadRouter from './routes/bulk-download'
import worldMapsRouter from './routes/world-maps'
import earthdataExportRouter from './routes/earthdata-export'
import animationRouter from './routes/animation'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3005

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}))
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'terra25-api'
  })
})

// Root route
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Terra25 API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/health',
      api: {
        ingest: '/api/ingest',
        frames: '/api/frames',
        export: '/api/export',
        terra: '/api/terra',
        'bulk-download': '/api/bulk-download',
        'world-maps': '/api/world-maps',
        'earthdata-export': '/api/earthdata-export',
        animation: '/api/animation'
      }
    }
  })
})

// API Routes
app.use('/api/ingest', ingestRouter)
app.use('/api/frames', framesRouter)
app.use('/api/export', exportRouter)
app.use('/api/terra', terraRouter)
app.use('/api/bulk-download', bulkDownloadRouter)
app.use('/api/world-maps', worldMapsRouter)
app.use('/api/earthdata-export', earthdataExportRouter)
app.use('/api/animation', animationRouter)

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err)
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  })
})

// 404 handler
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.originalUrl} not found`
  })
})

// Export for Vercel serverless
export default app

// For local development
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`🚀 Terra25 API server running on port ${PORT}`)
    console.log(`📊 Health check: http://localhost:${PORT}/health`)
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`)
  })
}