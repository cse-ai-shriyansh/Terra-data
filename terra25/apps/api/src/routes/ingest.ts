/**
 * Ingest Routes
 * POST /api/ingest - Trigger data ingestion for animation generation
 */

import express from 'express';
import { body, validationResult } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';
import { IngestJob, JobStatus } from '../types/jobs';
import { saveJobMetadata, updateJobStatus } from '../utils/jobStorage';
import { gibsService, TERRA_LAYERS } from '../services/gibs';

const router = express.Router();

// In-memory job storage for demo (use Redis/database in production)
const jobs = new Map<string, IngestJob>();

// Validation middleware
const validateIngestRequest = [
  body('layer').isString().notEmpty().isIn(Object.keys(TERRA_LAYERS)).withMessage('Layer must be a valid Terra layer'),
  body('dateRange.start').isISO8601().withMessage('Valid start date is required'),
  body('dateRange.end').isISO8601().withMessage('Valid end date is required'),
  body('boundingBox.north').isFloat({ min: -90, max: 90 }).withMessage('Valid north coordinate is required'),
  body('boundingBox.south').isFloat({ min: -90, max: 90 }).withMessage('Valid south coordinate is required'),
  body('boundingBox.east').isFloat({ min: -180, max: 180 }).withMessage('Valid east coordinate is required'),
  body('boundingBox.west').isFloat({ min: -180, max: 180 }).withMessage('Valid west coordinate is required'),
];

/**
 * POST /api/ingest
 * Trigger data ingestion for animation generation
 */
router.post('/', validateIngestRequest, async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array(),
      });
    }

    const { layer, dateRange, boundingBox, options = {} } = req.body;
    
    // Validate date range
    const startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);
    
    if (startDate >= endDate) {
      return res.status(400).json({
        error: 'Invalid date range',
        message: 'Start date must be before end date',
      });
    }

    // Calculate date range (limit to reasonable size)
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff > 365) {
      return res.status(400).json({
        error: 'Date range too large',
        message: 'Maximum date range is 365 days',
      });
    }

    // Validate bounding box
    if (boundingBox.north <= boundingBox.south || boundingBox.east <= boundingBox.west) {
      return res.status(400).json({
        error: 'Invalid bounding box',
        message: 'Bounding box coordinates are invalid',
      });
    }

    // Create new ingest job
    const jobId = uuidv4();
    const job: any = {
      id: jobId,
      type: 'ingest',
      status: JobStatus.PENDING,
      layer,
      dateRange,
      boundingBox,
      options: {
        resolution: options.resolution || 'auto',
        format: options.format || 'png',
        maxConcurrent: options.maxConcurrent || 3,
        ...options,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Store job
    jobs.set(jobId, job);
    await saveJobMetadata(job);

    logger.info(`Created ingest job ${jobId} for layer ${layer}`);

    // Start ingestion process asynchronously
    processIngestJob(job).catch((error) => {
      logger.error(`Ingest job ${jobId} failed:`, error);
      updateJobStatus(jobId, JobStatus.FAILED, { message: error.message });
    });

    res.status(202).json({
      jobId,
      status: job.status,
      message: 'Ingest job created and started',
      estimatedFrames: daysDiff + 1,
      estimatedDuration: `${Math.ceil(daysDiff / 10)} minutes`,
    });

  } catch (error) {
    logger.error('Ingest endpoint error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to create ingest job',
    });
  }
});

/**
 * GET /api/ingest/:jobId
 * Get ingest job status
 */
router.get('/:jobId', (req: any, res: any) => {
  const { jobId } = req.params;
  const job = jobs.get(jobId);

  if (!job) {
    return res.status(404).json({
      error: 'Job not found',
      message: `Ingest job ${jobId} does not exist`,
    });
  }

  res.json({
    jobId: job.id,
    status: job.status,
    layer: job.layer,
    dateRange: job.dateRange,
    boundingBox: job.boundingBox,
    progress: job.progress || 0,
    frameCount: job.frameCount || 0,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
    completedAt: job.completedAt,
    error: (job as any).message,
  });
});

/**
 * DELETE /api/ingest/:jobId
 * Cancel ingest job
 */
router.delete('/:jobId', (req: any, res: any) => {
  const { jobId } = req.params;
  const job = jobs.get(jobId);

  if (!job) {
    return res.status(404).json({
      error: 'Job not found',
      message: `Ingest job ${jobId} does not exist`,
    });
  }

  if (job.status === JobStatus.COMPLETED) {
    return res.status(400).json({
      error: 'Cannot cancel completed job',
      message: 'Job has already completed successfully',
    });
  }

  // Update job status
  job.status = JobStatus.CANCELLED;
  job.updatedAt = new Date();
  jobs.set(jobId, job);

  logger.info(`Cancelled ingest job ${jobId}`);

  res.json({
    jobId,
    status: job.status,
    message: 'Ingest job cancelled',
  });
});

/**
 * Process ingest job with real NASA Terra satellite data
 */
async function processIngestJob(job: IngestJob): Promise<void> {
  try {
    // Update status to processing
    job.status = JobStatus.PROCESSING;
    job.updatedAt = new Date();
    jobs.set(job.id, job);

    // Validate layer exists
    if (!TERRA_LAYERS[job.layer]) {
      throw new Error(`Invalid Terra layer: ${job.layer}`);
    }

    // Calculate date range and frames
    const startDate = new Date(job.dateRange.start);
    const endDate = new Date(job.dateRange.end);
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    logger.info(`Processing Terra data for ${job.layer} from ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]} (${totalDays} days)`);

    const frameUrls: string[] = [];
    let processedFrames = 0;

    // Process each day in the date range
    for (let dayOffset = 0; dayOffset < totalDays; dayOffset++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + dayOffset);
      const dateString = currentDate.toISOString().split('T')[0];

      try {
        // Validate date
        if (!gibsService.validateDate(dateString)) {
          logger.warn(`Skipping invalid date: ${dateString}`);
          continue;
        }

        // Fetch Terra satellite tiles for this date
        const { tiles, tileInfo } = await gibsService.getTilesForRegion(
          job.layer,
          dateString,
          job.boundingBox,
          6 // zoom level
        );

        if (tiles.length > 0) {
          // In a real implementation, you would:
          // 1. Compose tiles into a single frame image
          // 2. Save to storage (S3/MinIO)
          // 3. Generate thumbnail
          // 4. Store frame metadata
          
          const frameUrl = `/api/frames/${job.id}/${processedFrames}`;
          frameUrls.push(frameUrl);
          
          logger.info(`Generated frame ${processedFrames} for ${dateString} with ${tiles.length} tiles`);
        } else {
          logger.warn(`No tiles available for ${job.layer} on ${dateString}`);
        }

        processedFrames++;

        // Update progress
        job.progress = Math.round((processedFrames / totalDays) * 100);
        job.frameCount = processedFrames;
        job.updatedAt = new Date();
        jobs.set(job.id, job);

        logger.debug(`Terra ingestion progress: ${job.progress}% (${processedFrames}/${totalDays})`);

        // Small delay to avoid overwhelming NASA GIBS
        await new Promise(resolve => setTimeout(resolve, 200));

      } catch (dateError) {
        logger.error(`Error processing date ${dateString}:`, dateError);
        // Continue with next date rather than failing the entire job
      }
    }

    // Complete job
    job.status = JobStatus.COMPLETED;
    job.progress = 100;
    job.frameCount = frameUrls.length;
    job.frameUrls = frameUrls;
    job.completedAt = new Date();
    job.updatedAt = new Date();
    jobs.set(job.id, job);

    logger.info(`Completed Terra ingestion job ${job.id}: ${frameUrls.length} frames generated from ${totalDays} days`);

  } catch (error) {
    // Handle job failure
    job.status = JobStatus.FAILED;
    (job as any).message = error instanceof Error ? error.message : 'Unknown error';
    job.updatedAt = new Date();
    jobs.set(job.id, job);

    logger.error(`Terra ingestion job ${job.id} failed:`, error);
    throw error;
  }
}

/**
 * GET /api/ingest/layers
 * Get available Terra satellite layers
 */
router.get('/layers', (req: any, res: any) => {
  try {
    const layers = gibsService.getAvailableLayers();
    res.json({
      layers: layers.map(layer => ({
        name: layer.name,
        displayName: layer.displayName,
        description: layer.description,
        temporal: layer.temporal,
        maxZoom: layer.maxZoom
      })),
      total: layers.length
    });
  } catch (error) {
    logger.error('Error fetching Terra layers:', error);
    res.status(500).json({
      error: 'Failed to fetch Terra layers',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/ingest/test
 * Test NASA GIBS connectivity
 */
router.get('/test', async (req: any, res: any) => {
  try {
    logger.info('Testing NASA GIBS connectivity...');
    const isConnected = await gibsService.testConnection();
    
    if (isConnected) {
      res.json({
        status: 'success',
        message: 'NASA GIBS connection successful',
        timestamp: new Date().toISOString(),
        earthdataToken: process.env.EARTHDATA_TOKEN ? 'configured' : 'missing'
      });
    } else {
      res.status(503).json({
        status: 'error',
        message: 'NASA GIBS connection failed',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    logger.error('NASA GIBS test error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to test NASA GIBS connection',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;