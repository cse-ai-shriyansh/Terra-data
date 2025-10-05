/**
 * Terra25 API Server
 * Express.js backend for Terra satellite data processing and animation generation
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';

// Import routes
import ingestRoutes from './routes/ingest';
import framesRoutes from './routes/frames';
import exportRoutes from './routes/export';

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';
import { gibsService } from './services/gibs';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.API_PORT || 3001;

// Trust proxy for rate limiting behind reverse proxy
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Compression middleware
app.use(compression());

// Request logging
app.use(morgan('combined', {
  stream: {
    write: (message: string) => logger.info(message.trim())
  }
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // 100 requests per window
  message: {
    error: 'Too many requests, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
  });
});

// NASA GIBS test endpoint
app.get('/api/test/nasa', async (req, res) => {
  try {
    logger.info('Testing NASA GIBS connection...');
    const isConnected = await gibsService.testConnection();
    
    res.json({
      status: isConnected ? 'success' : 'failed',
      message: isConnected ? 'NASA GIBS API connection successful' : 'NASA GIBS API connection failed',
      timestamp: new Date().toISOString(),
      earthdataToken: process.env.EARTHDATA_TOKEN ? 'configured' : 'missing',
      availableLayers: gibsService.getAvailableLayers().map(layer => ({
        name: layer.name,
        displayName: layer.displayName,
        description: layer.description
      }))
    });
  } catch (error) {
    logger.error('NASA GIBS test failed:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to test NASA GIBS connection',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// API documentation endpoint
app.get('/api', (req, res) => {
  res.json({
    name: 'Terra25 API',
    version: '1.0.0',
    description: 'REST API for Terra satellite data processing and animation generation',
    endpoints: {
      'POST /api/ingest': 'Trigger data ingestion for animation generation',
      'GET /api/frames': 'Get frame URLs for animation playback',
      'POST /api/export': 'Create export job for MP4/GIF generation',
      'GET /api/export/:jobId': 'Check export job status',
      'GET /health': 'Health check endpoint',
    },
    documentation: 'https://github.com/your-repo/terra25/blob/main/docs/api.md',
  });
});

// API routes
app.use('/api/ingest', ingestRoutes);
app.use('/api/frames', framesRoutes);
app.use('/api/export', exportRoutes);

// Serve static files (for generated exports)
app.use('/exports', express.static(path.join(__dirname, '../data/exports')));

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: 'API endpoint not found',
    message: `The requested endpoint ${req.method} ${req.path} does not exist`,
    availableEndpoints: [
      'POST /api/ingest',
      'GET /api/frames',
      'POST /api/export',
      'GET /api/export/:jobId',
    ],
  });
});

// Global error handler
app.use(errorHandler);

// Graceful shutdown
const gracefulShutdown = (signal: string) => {
  logger.info(`Received ${signal}, shutting down gracefully`);
  
  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server - explicitly bind to localhost
app.listen(Number(PORT), 'localhost', () => {
  logger.info(`Terra25 API server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`Health check: http://localhost:${PORT}/health`);
  logger.info(`API documentation: http://localhost:${PORT}/api`);
});

export default app;