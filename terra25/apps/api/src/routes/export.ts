/**
 * Export Route Handlers
 * API endpoints for exporting Terra animations (MP4, GIF, etc.)
 */

import { Router, Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs/promises';
import { Job, JobStatus, ExportJob, FrameJob } from '../types/jobs';
import { logger } from '../utils/logger';
import { 
  saveJobMetadata, 
  loadJobMetadata, 
  updateJobStatus,
  listJobs 
} from '../utils/jobStorage';
import { asyncHandler, AppError } from '../middleware/errorHandler';

const router = Router();

// Data directory for storing exports
const EXPORTS_DIR = path.join(process.cwd(), 'data', 'exports');

// Ensure exports directory exists
async function ensureExportsDir(): Promise<void> {
  try {
    await fs.mkdir(EXPORTS_DIR, { recursive: true });
  } catch (error) {
    logger.error('Failed to create exports directory:', error);
  }
}

ensureExportsDir();

/**
 * GET /api/export
 * List all export jobs
 */
router.get('/', 
  query('status').optional().isIn(Object.values(JobStatus)),
  query('format').optional().isIn(['mp4', 'gif', 'webm']),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation failed', 400);
    }

    const { status, format, limit } = req.query;
    
    const jobs = await listJobs({
      type: 'export',
      status: status as JobStatus,
      limit: limit ? parseInt(limit as string) : undefined,
    });

    // Filter by format if specified
    const filteredJobs = format ? 
      jobs.filter(job => (job as ExportJob).options?.format === format) : 
      jobs;

    res.json({
      success: true,
      data: {
        jobs: filteredJobs.map(job => {
          const exportJob = job as ExportJob;
          return {
            id: exportJob.id,
            status: exportJob.status,
            progress: exportJob.progress,
            createdAt: exportJob.createdAt,
            updatedAt: exportJob.updatedAt,
            completedAt: exportJob.completedAt,
            ingestJobId: exportJob.ingestJobId,
            format: exportJob.options?.format,
            quality: exportJob.options?.quality,
            outputUrl: exportJob.outputUrl,
            fileSize: exportJob.fileSize,
            duration: exportJob.duration,
          };
        }),
        total: filteredJobs.length,
      },
    });
  })
);

/**
 * GET /api/export/:jobId
 * Get specific export job details
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

    if (!job || job.type !== 'export') {
      throw new AppError('Export job not found', 404);
    }

    const exportJob = job as ExportJob;

    res.json({
      success: true,
      data: {
        id: exportJob.id,
        status: exportJob.status,
        progress: exportJob.progress,
        message: exportJob.message,
        createdAt: exportJob.createdAt,
        updatedAt: exportJob.updatedAt,
        completedAt: exportJob.completedAt,
        ingestJobId: exportJob.ingestJobId,
        options: exportJob.options,
        outputUrl: exportJob.outputUrl,
        fileSize: exportJob.fileSize,
        duration: exportJob.duration,
      },
    });
  })
);

/**
 * POST /api/export
 * Create new export job from existing frame generation job
 */
router.post('/',
  body('frameJobId').isUUID(),
  body('format').isIn(['mp4', 'gif', 'webm']),
  body('quality').optional().isIn(['low', 'medium', 'high']),
  body('frameRate').optional().isInt({ min: 1, max: 60 }),
  body('watermark').optional().isBoolean(),
  asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation failed', 400);
    }

    const { 
      frameJobId, 
      format, 
      quality = 'medium', 
      frameRate = 10,
      watermark = false 
    } = req.body;

    // Verify frame generation job exists and is completed
    const frameJob = await loadJobMetadata(frameJobId);
    if (!frameJob || frameJob.type !== 'frame_generation') {
      throw new AppError('Frame generation job not found', 404);
    }

    if (frameJob.status !== JobStatus.COMPLETED) {
      throw new AppError('Frame generation job must be completed before export', 400);
    }

    const frameJobData = frameJob as FrameJob;

    // Create export job
    const jobId = uuidv4();
    const job: ExportJob = {
      id: jobId,
      type: 'export' as any, // Type assertion for compatibility
      status: JobStatus.PENDING,
      progress: 0,
      message: 'Export job created',
      createdAt: new Date(),
      updatedAt: new Date(),
      ingestJobId: frameJobId,
      options: {
        format: format as 'mp4' | 'gif' | 'webm',
        quality: quality as 'low' | 'medium' | 'high',
        fps: frameRate,
        watermark,
      },
    };

    await saveJobMetadata(job);

    // Start export process (async)
    processExport(jobId, frameJobData).catch(error => {
      logger.error(`Export failed for job ${jobId}:`, error);
      updateJobStatus(jobId, JobStatus.FAILED, { 
        message: `Export failed: ${error.message}` 
      });
    });

    // Estimate file size and duration
    const estimatedDuration = Math.ceil(frameJobData.frameCount / frameRate);
    const estimatedSize = estimateFileSize(format, quality, frameJobData.frameCount);

    res.status(201).json({
      success: true,
      data: {
        jobId,
        status: job.status,
        format,
        quality,
        estimatedDuration: `${estimatedDuration} seconds`,
        estimatedSize: `${(estimatedSize / 1024 / 1024).toFixed(2)} MB`,
        message: 'Export started',
      },
    });
  })
);

/**
 * GET /api/export/:jobId/download
 * Download exported animation file
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

    if (!job || job.type !== 'export') {
      throw new AppError('Export job not found', 404);
    }

    const exportJob = job as ExportJob;

    if (exportJob.status !== JobStatus.COMPLETED) {
      throw new AppError('Export not completed yet', 400);
    }

    if (!exportJob.outputUrl) {
      throw new AppError('Export file not found', 404);
    }

    const filePath = path.join(EXPORTS_DIR, path.basename(exportJob.outputUrl));
    
    try {
      await fs.access(filePath);
    } catch {
      throw new AppError('Export file not found', 404);
    }

    const format = exportJob.options?.format || 'mp4';
    const filename = `terra_animation_${jobId}.${format}`;

    res.download(filePath, filename, (err) => {
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
 * DELETE /api/export/:jobId
 * Cancel export job or delete completed export
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

    if (!job || job.type !== 'export') {
      throw new AppError('Export job not found', 404);
    }

    const exportJob = job as ExportJob;

    if (exportJob.status === JobStatus.PROCESSING) {
      // Cancel running job
      await updateJobStatus(jobId, JobStatus.CANCELLED, {
        message: 'Export cancelled by user',
      });
    }

    // Clean up output file if it exists
    if (exportJob.outputUrl) {
      try {
        const filePath = path.join(EXPORTS_DIR, path.basename(exportJob.outputUrl));
        await fs.unlink(filePath);
        logger.info(`Cleaned up export file for job ${jobId}`);
      } catch (error) {
        logger.warn(`Failed to clean up export file for job ${jobId}:`, error);
      }
    }

    res.json({
      success: true,
      message: 'Export job deleted',
    });
  })
);

/**
 * Async export processing function
 * This simulates the actual video/animation generation workflow
 */
async function processExport(jobId: string, frameJob: FrameJob): Promise<void> {
  try {
    const job = await loadJobMetadata(jobId);
    if (!job || job.type !== 'export') {
      throw new Error('Export job not found');
    }

    const exportJob = job as ExportJob;
    
    // Update status to processing
    await updateJobStatus(jobId, JobStatus.PROCESSING, {
      message: 'Starting export...',
    });

    const { format, quality, fps } = exportJob.options;
    const frameCount = frameJob.frameCount;

    // Simulate export processing steps
    const steps = [
      { name: 'Preparing frames', duration: 1000 },
      { name: 'Encoding video', duration: 3000 },
      { name: 'Optimizing output', duration: 1500 },
      { name: 'Finalizing', duration: 500 },
    ];

    let completedSteps = 0;

    for (const step of steps) {
      // Check if job was cancelled
      const currentJob = await loadJobMetadata(jobId);
      if (currentJob?.status === JobStatus.CANCELLED) {
        logger.info(`Export cancelled for job ${jobId}`);
        return;
      }

      logger.debug(`Export ${jobId}: ${step.name}`);
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, step.duration));

      completedSteps++;
      const progress = Math.round((completedSteps / steps.length) * 100);

      await updateJobStatus(jobId, JobStatus.PROCESSING, {
        progress,
        message: step.name,
      });
    }

    // Create output file (placeholder)
    const filename = `${jobId}.${format}`;
    const outputPath = path.join(EXPORTS_DIR, filename);
    const outputUrl = `/api/export/${jobId}/download`;

    // Simulate file creation
    const fileSize = estimateFileSize(format, quality, frameCount);
    await fs.writeFile(outputPath, `${format.toUpperCase()} export of ${frameCount} frames`, 'utf-8');

    // Calculate duration
    const duration = Math.ceil(frameCount / (fps || 10));

    // Mark as completed
    await updateJobStatus(jobId, JobStatus.COMPLETED, {
      progress: 100,
      message: `Successfully exported ${format.toUpperCase()} animation`,
      outputUrl,
      fileSize,
      duration,
    });

    logger.info(`Export completed for job ${jobId}: ${format} (${frameCount} frames)`);

  } catch (error) {
    logger.error(`Export failed for job ${jobId}:`, error);
    await updateJobStatus(jobId, JobStatus.FAILED, {
      message: `Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
    throw error;
  }
}

/**
 * Estimate file size based on format, quality, and frame count
 */
function estimateFileSize(format: string, quality: string, frameCount: number): number {
  const baseSize = frameCount * 1024; // 1KB per frame base

  const formatMultiplier = {
    'mp4': 1.0,
    'gif': 0.8,
    'webm': 0.9,
  }[format] || 1.0;

  const qualityMultiplier = {
    'low': 0.5,
    'medium': 1.0,
    'high': 2.0,
  }[quality] || 1.0;

  return Math.round(baseSize * formatMultiplier * qualityMultiplier);
}

export default router;