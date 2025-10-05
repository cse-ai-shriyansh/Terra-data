/**
 * Simple Server Test
 */
import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.API_PORT || 3001;

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    earthdataToken: process.env.EARTHDATA_TOKEN ? 'configured' : 'missing'
  });
});

app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});