/**
 * Frames Route Handlers
 * API endpoints for managing and serving animation frames
 */

import { Router, Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs/promises';
import { Job, JobStatus, FrameJob } from '../types/jobs';
import { logger } from '../utils/logger';
import { 
  saveJobMetadata, 
  loadJobMetadata, 
  updateJobStatus,
  listJobs 
} from '../utils/jobStorage';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { gibsService } from '../services/gibs';

const router = Router();

// Data directory for storing frames
const FRAMES_DIR = path.join(process.cwd(), 'data', 'frames');

// Ensure frames directory exists
async function ensureFramesDir(): Promise<void> {
  try {
    await fs.mkdir(FRAMES_DIR, { recursive: true });
  } catch (error) {
    logger.error('Failed to create frames directory:', error);
  }
}

ensureFramesDir();

/**
 * GET /api/frames
 * List all frame generation jobs
 */
router.get('/', 
  query('status').optional().isIn(Object.values(JobStatus)),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation failed', 400);
    }

    const { status, limit } = req.query;
    
    const jobs = await listJobs({
      type: 'frame_generation',
      status: status as JobStatus,
      limit: limit ? parseInt(limit as string) : undefined,
    });

    res.json({
      success: true,
      data: {
        jobs: jobs.map(job => ({
          id: job.id,
          status: job.status,
          progress: job.progress,
          createdAt: job.createdAt,
          updatedAt: job.updatedAt,
          completedAt: job.completedAt,
          params: (job as FrameJob).params,
          frameCount: (job as FrameJob).frameCount,
          framesGenerated: (job as FrameJob).framesGenerated,
        })),
        total: jobs.length,
      },
    });
  })
);

/**
 * GET /api/frames/:jobId
 * Get specific frame generation job details
 */
router.get('/:jobId',
  param('jobId').isUUID(),
  asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Invalid job ID', 400);
    }

    const { jobId } = req.params;
    const job = await loadJobMetadata(jobId);

    if (!job || job.type !== 'frame_generation') {
      throw new AppError('Frame generation job not found', 404);
    }

    const frameJob = job as FrameJob;

    res.json({
      success: true,
      data: {
        id: frameJob.id,
        status: frameJob.status,
        progress: frameJob.progress,
        message: frameJob.message,
        createdAt: frameJob.createdAt,
        updatedAt: frameJob.updatedAt,
        completedAt: frameJob.completedAt,
        params: frameJob.params,
        frameCount: frameJob.frameCount,
        framesGenerated: frameJob.framesGenerated,
        outputPath: frameJob.outputPath,
      },
    });
  })
);

/**
 * POST /api/frames/generate
 * Generate animation frames from Terra data
 */
router.post('/generate',
  body('boundingBox').isObject(),
  body('boundingBox.north').isFloat({ min: -90, max: 90 }),
  body('boundingBox.south').isFloat({ min: -90, max: 90 }),
  body('boundingBox.east').isFloat({ min: -180, max: 180 }),
  body('boundingBox.west').isFloat({ min: -180, max: 180 }),
  body('dateRange').isObject(),
  body('dateRange.start').isISO8601(),
  body('dateRange.end').isISO8601(),
  body('layers').optional().isArray(),
  body('resolution').optional().isIn(['250m', '500m', '1km']),
  body('frameRate').optional().isInt({ min: 1, max: 60 }),
  asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation failed', 400);
    }

    const { boundingBox, dateRange, layers = ['MODIS_Terra_CorrectedReflectance_TrueColor'], resolution = '1km', frameRate = 10 } = req.body;

    // Validate date range
    const startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);
    
    if (startDate >= endDate) {
      throw new AppError('Start date must be before end date', 400);
    }

    if (endDate > new Date()) {
      throw new AppError('End date cannot be in the future', 400);
    }

    // Calculate frame count (one frame per day)
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const frameCount = Math.min(daysDiff, 365); // Limit to 1 year

    if (frameCount > 365) {
      throw new AppError('Date range too large. Maximum 365 days allowed.', 400);
    }

    // Create frame generation job
    const jobId = uuidv4();
    const job: FrameJob = {
      id: jobId,
      type: 'frame_generation',
      status: JobStatus.PENDING,
      progress: 0,
      message: 'Frame generation job created',
      createdAt: new Date(),
      updatedAt: new Date(),
      params: {
        boundingBox,
        dateRange: {
          start: startDate,
          end: endDate,
        },
        layers,
        resolution,
        frameRate,
      },
      frameCount,
      framesGenerated: 0,
      outputPath: path.join(FRAMES_DIR, jobId),
    };

    await saveJobMetadata(job);

    // Start frame generation process (async)
    processFrameGeneration(jobId).catch(error => {
      logger.error(`Frame generation failed for job ${jobId}:`, error);
      updateJobStatus(jobId, JobStatus.FAILED, { 
        message: `Frame generation failed: ${error.message}` 
      });
    });

    res.status(201).json({
      success: true,
      data: {
        jobId,
        status: job.status,
        frameCount,
        estimatedDuration: `${Math.ceil(frameCount / 10)} minutes`,
        message: 'Frame generation started',
      },
    });
  })
);

/**
 * GET /api/frames/:jobId/download
 * Download generated frames as ZIP archive
 */
router.get('/:jobId/download',
  param('jobId').isUUID(),
  asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Invalid job ID', 400);
    }

    const { jobId } = req.params;
    const job = await loadJobMetadata(jobId);

    if (!job || job.type !== 'frame_generation') {
      throw new AppError('Frame generation job not found', 404);
    }

    const frameJob = job as FrameJob;

    if (frameJob.status !== JobStatus.COMPLETED) {
      throw new AppError('Frame generation not completed yet', 400);
    }

    const zipPath = path.join(frameJob.outputPath!, 'frames.zip');
    
    try {
      await fs.access(zipPath);
    } catch {
      throw new AppError('Generated frames not found', 404);
    }

    res.download(zipPath, `terra_frames_${jobId}.zip`, (err) => {
      if (err) {
        logger.error(`Download failed for job ${jobId}:`, err);
        if (!res.headersSent) {
          throw new AppError('Download failed', 500);
        }
      }
    });
  })
);

/**
 * DELETE /api/frames/:jobId
 * Cancel frame generation job or delete completed job data
 */
router.delete('/:jobId',
  param('jobId').isUUID(),
  asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Invalid job ID', 400);
    }

    const { jobId } = req.params;
    const job = await loadJobMetadata(jobId);

    if (!job || job.type !== 'frame_generation') {
      throw new AppError('Frame generation job not found', 404);
    }

    const frameJob = job as FrameJob;

    if (frameJob.status === JobStatus.PROCESSING) {
      // Cancel running job
      await updateJobStatus(jobId, JobStatus.CANCELLED, {
        message: 'Job cancelled by user',
      });
    }

    // Clean up output files if they exist
    if (frameJob.outputPath) {
      try {
        await fs.rm(frameJob.outputPath, { recursive: true, force: true });
        logger.info(`Cleaned up frames for job ${jobId}`);
      } catch (error) {
        logger.warn(`Failed to clean up frames for job ${jobId}:`, error);
      }
    }

    res.json({
      success: true,
      message: 'Frame generation job deleted',
    });
  })
);

/**
 * Async frame generation process
 * This simulates the actual frame generation workflow
 */
async function processFrameGeneration(jobId: string): Promise<void> {
  try {
    const job = await loadJobMetadata(jobId);
    if (!job || job.type !== 'frame_generation') {
      throw new Error('Job not found');
    }

    const frameJob = job as FrameJob;
    
    // Update status to processing
    await updateJobStatus(jobId, JobStatus.PROCESSING, {
      message: 'Starting frame generation...',
    });

    // Create output directory
    await fs.mkdir(frameJob.outputPath!, { recursive: true });

    const { params } = frameJob;
    const totalFrames = frameJob.frameCount;
    let framesGenerated = 0;

    // Generate frames for each day in the date range
    const currentDate = new Date(params.dateRange.start);
    const endDate = new Date(params.dateRange.end);

    while (currentDate <= endDate && framesGenerated < totalFrames) {
      // Check if job was cancelled
      const currentJob = await loadJobMetadata(jobId);
      if (currentJob?.status === JobStatus.CANCELLED) {
        logger.info(`Frame generation cancelled for job ${jobId}`);
        return;
      }

      // Simulate frame generation (in real implementation, this would call Terra data APIs)
      logger.debug(`Generating frame ${framesGenerated + 1}/${totalFrames} for ${currentDate.toISOString().split('T')[0]}`);
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 500));

      // Create placeholder frame file
      const frameFilename = `frame_${String(framesGenerated + 1).padStart(4, '0')}_${currentDate.toISOString().split('T')[0]}.png`;
      const framePath = path.join(frameJob.outputPath!, frameFilename);
      
      // In real implementation, this would be actual Terra tile data
      await fs.writeFile(framePath, `Frame ${framesGenerated + 1} - ${currentDate.toISOString().split('T')[0]}`, 'utf-8');

      framesGenerated++;
      const progress = Math.round((framesGenerated / totalFrames) * 100);

      // Update progress
      await updateJobStatus(jobId, JobStatus.PROCESSING, {
        progress,
        message: `Generated ${framesGenerated}/${totalFrames} frames`,
        framesGenerated,
      });

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Create ZIP archive of frames (placeholder)
    const zipPath = path.join(frameJob.outputPath!, 'frames.zip');
    await fs.writeFile(zipPath, `ZIP archive of ${framesGenerated} frames`, 'utf-8');

    // Mark as completed
    await updateJobStatus(jobId, JobStatus.COMPLETED, {
      progress: 100,
      message: `Successfully generated ${framesGenerated} frames`,
      framesGenerated,
    });

    logger.info(`Frame generation completed for job ${jobId}: ${framesGenerated} frames`);

  } catch (error) {
    logger.error(`Frame generation failed for job ${jobId}:`, error);
    await updateJobStatus(jobId, JobStatus.FAILED, {
      message: `Frame generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
    throw error;
  }
}

/**
 * GET /api/frames/tile/:layer/:date/:z/:x/:y
 * Proxy authenticated NASA GIBS tile requests
 */
router.get('/tile/:layer/:date/:z/:x/:y',
  param('layer').isString().notEmpty(),
  param('date').matches(/^\d{4}-\d{2}-\d{2}$/),
  param('z').isInt({ min: 0, max: 9 }),
  param('x').isInt({ min: 0 }),
  param('y').isInt({ min: 0 }),
  asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Invalid tile parameters', 400);
    }

    const { layer, date, z, x, y } = req.params;

    try {
      // Fetch tile from NASA GIBS with authentication
      const tileBuffer = await gibsService.fetchTile({
        layer,
        date,
        z: parseInt(z),
        x: parseInt(x),
        y: parseInt(y)
      });

      // Determine content type based on layer
      const contentType = layer.includes('Aerosol') || layer.includes('Temperature') ? 'image/png' : 'image/jpeg';
      
      // Set appropriate headers
      res.set({
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        'Access-Control-Allow-Origin': '*',
        'Content-Length': tileBuffer.length.toString()
      });

      // Send tile data
      res.send(tileBuffer);

    } catch (error) {
      logger.warn(`Tile request failed: ${layer} ${date} ${z}/${x}/${y}`, error);
      
      // Return a 1x1 transparent PNG for missing tiles
      const transparentPng = Buffer.from([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
        0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
        0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4, 0x89, 0x00, 0x00, 0x00,
        0x0B, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,
        0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00, 0x00, 0x00, 0x00, 0x49,
        0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
      ]);
      
      res.set({
        'Content-Type': 'image/png',
        'Content-Length': transparentPng.length.toString()
      });
      
      res.send(transparentPng);
    }
  })
);

export default router;