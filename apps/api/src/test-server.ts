import express from 'express'
import cors from 'cors'

const app = express()
const PORT = 3002

app.use(cors())
app.use(express.json())

// Simple health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Test server is running' })
})

// Simple animation test route
app.post('/api/animation/generate', async (req, res) => {
  const { layer, startDate, endDate, bbox } = req.body
  
  console.log('Animation request:', { layer, startDate, endDate, bbox })
  
  const jobId = `anim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  res.json({
    jobId,
    status: 'processing',
    message: 'Animation job created successfully',
    statusUrl: `/api/animation/${jobId}`
  })
})

app.listen(PORT, () => {
  console.log(`🚀 Test API server running on port ${PORT}`)
  console.log(`📊 Health check: http://localhost:${PORT}/health`)
})