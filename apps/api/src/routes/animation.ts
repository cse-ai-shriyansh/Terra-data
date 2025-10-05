import { Router } from 'express';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import archiver from 'archiver';

const router = Router();

interface AnimationJob {
  id: string;
  status: 'processing' | 'completed' | 'failed';
  parameters: any;
  frames: AnimationFrame[];
  startedAt: Date;
  completedAt?: Date;
  progress: number;
}

interface AnimationFrame {
  date: string;
  filename?: string;
  url?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

interface VideoExportJob {
  id: string;
  animationId: string;
  format: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  outputPath?: string;
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}

// In-memory job storage (in production, use Redis or database)
const animationJobs = new Map<string, AnimationJob>();
const videoExports = new Map<string, VideoExportJob>();

/**
 * POST /api/animation/generate
 * Generate a time-lapse animation from satellite imagery
 */
router.post('/generate', async (req, res) => {
  try {
    const {
      layer = 'terra_true_color',
      startDate,
      endDate,
      method = 'direct',
      width = 1920,
      height = 1080,
      zoom = 2,
      region = 'global',
      frameRate = 2,
      format = 'mp4'
    } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({
        error: 'Start date and end date are required',
        message: 'Please provide startDate and endDate in YYYY-MM-DD format'
      });
    }

    // Generate date range
    const dates = generateDateRange(startDate, endDate);
    
    if (dates.length > 30) {
      return res.status(400).json({
        error: 'Too many frames',
        message: 'Animation is limited to 30 frames. Please reduce the date range.'
      });
    }

    // Create job
    const jobId = generateJobId();
    const frames: AnimationFrame[] = dates.map(date => ({
      date,
      status: 'pending'
    }));

    const job: AnimationJob = {
      id: jobId,
      status: 'processing',
      parameters: {
        layer,
        startDate,
        endDate,
        method,
        width,
        height,
        zoom,
        region,
        frameRate,
        format
      },
      frames,
      startedAt: new Date(),
      progress: 0
    };

    animationJobs.set(jobId, job);

    res.json({
      success: true,
      message: 'Animation generation started',
      jobId,
      totalFrames: dates.length,
      estimatedTime: `${Math.ceil(dates.length * 30 / 60)} minutes`,
      statusUrl: `/api/animation/status/${jobId}`
    });

    // Start animation generation in background
    generateAnimationFrames(job).catch(error => {
      console.error('Animation generation failed:', error);
      job.status = 'failed';
      animationJobs.set(jobId, job);
    });

  } catch (error) {
    console.error('Animation generation error:', error);
    res.status(500).json({
      error: 'Animation generation failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/animation/status/:jobId
 * Get animation generation status
 */
router.get('/status/:jobId', (req, res) => {
  try {
    const { jobId } = req.params;
    const job = animationJobs.get(jobId);

    if (!job) {
      return res.status(404).json({
        error: 'Job not found',
        message: 'Animation job not found or expired'
      });
    }

    // Calculate progress
    const completedFrames = job.frames.filter(f => f.status === 'completed').length;
    const progress = job.frames.length > 0 ? (completedFrames / job.frames.length) * 100 : 0;

    res.json({
      success: true,
      job: {
        id: job.id,
        status: job.status,
        progress: Math.round(progress),
        totalFrames: job.frames.length,
        completedFrames,
        frames: job.frames,
        startedAt: job.startedAt,
        completedAt: job.completedAt,
        parameters: job.parameters
      }
    });

  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({
      error: 'Status check failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/animation/frame/:jobId/:date
 * Get a specific frame from an animation job
 */
router.get('/frame/:jobId/:date', async (req, res) => {
  try {
    const { jobId, date } = req.params;
    const job = animationJobs.get(jobId);

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const frame = job.frames.find(f => f.date === date);
    if (!frame || frame.status !== 'completed' || !frame.filename) {
      return res.status(404).json({ error: 'Frame not ready' });
    }

    const framePath = path.join(process.cwd(), 'data', 'animation_frames', jobId, frame.filename);
    
    // Check if file exists
    try {
      await fs.promises.access(framePath);
    } catch {
      return res.status(404).json({ error: 'Frame file not found' });
    }

    // Set appropriate headers
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400');

    // Stream the file
    const fileStream = require('fs').createReadStream(framePath);
    fileStream.pipe(res);

  } catch (error) {
    console.error('Frame serving error:', error);
    res.status(500).json({
      error: 'Frame serving failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/animation/export-video/:jobId
 * Export animation as video file
 */
router.post('/export-video/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    const { 
      format = 'mp4',
      fps = 2,
      quality = 'medium',
      width = 800
    } = req.body;

    const job = animationJobs.get(jobId);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (job.status !== 'completed') {
      return res.status(400).json({ 
        error: 'Animation not ready',
        message: 'Animation must be completed before exporting video'
      });
    }

    const framesDir = path.join(process.cwd(), 'data', 'animation_frames', jobId);
    const outputDir = path.join(process.cwd(), 'data', 'animation_videos');
    await fs.promises.mkdir(outputDir, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outputFilename = `animation_${jobId}_${timestamp}.${format}`;
    const outputPath = path.join(outputDir, outputFilename);

    // Create video export job
    const exportJob: VideoExportJob = {
      id: timestamp,
      animationId: jobId,
      format,
      status: 'pending',
      createdAt: new Date()
    };
    videoExports.set(timestamp, exportJob);

    res.json({
      success: true,
      message: 'Video export started',
      exportId: timestamp,
      format,
      estimatedTime: '30-60 seconds',
      statusUrl: `/api/animation/export-status/${timestamp}`
    });

    // Start video export in background
    exportVideoInBackground(framesDir, outputPath, format, fps, quality, width, timestamp)
      .then(() => {
        // Update job status on success
        const job = videoExports.get(timestamp);
        if (job) {
          job.status = 'completed';
          job.outputPath = outputPath;
          job.completedAt = new Date();
          videoExports.set(timestamp, job);
        }
      })
      .catch((error: Error) => {
        // Update job status on failure
        const job = videoExports.get(timestamp);
        if (job) {
          job.status = 'failed';
          job.error = error.message;
          videoExports.set(timestamp, job);
        }
        console.error('Video export failed:', error);
      });

  } catch (error) {
    console.error('Video export error:', error);
    res.status(500).json({
      error: 'Video export failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/animation/download-frames/:jobId
 * Download all frames as a ZIP file
 */
router.get('/download-frames/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = animationJobs.get(jobId);

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (job.status !== 'completed') {
      return res.status(400).json({ 
        error: 'Animation not ready',
        message: 'Animation must be completed before downloading frames'
      });
    }

    const framesDir = path.join(process.cwd(), 'data', 'animation_frames', jobId);
    
    // Create ZIP file
    const archive = archiver('zip', { zlib: { level: 9 } });

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="animation_frames_${jobId}.zip"`);

    archive.pipe(res);
    archive.directory(framesDir, false);
    await archive.finalize();

  } catch (error) {
    console.error('Frame download error:', error);
    res.status(500).json({
      error: 'Frame download failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/animation/export-status/:exportId
 * Get video export status
 */
router.get('/export-status/:exportId', async (req, res) => {
  try {
    const { exportId } = req.params;
    const exportJob = videoExports.get(exportId);

    if (!exportJob) {
      return res.status(404).json({ error: 'Export job not found' });
    }

    res.json({
      id: exportJob.id,
      status: exportJob.status,
      format: exportJob.format,
      createdAt: exportJob.createdAt,
      completedAt: exportJob.completedAt,
      downloadUrl: exportJob.status === 'completed' && exportJob.outputPath 
        ? `/api/animation/download-video/${exportId}` 
        : undefined,
      error: exportJob.error
    });

  } catch (error) {
    console.error('Export status error:', error);
    res.status(500).json({
      error: 'Failed to get export status',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/animation/download-video/:exportId
 * Download exported video file
 */
router.get('/download-video/:exportId', async (req, res) => {
  try {
    const { exportId } = req.params;
    const exportJob = videoExports.get(exportId);

    if (!exportJob) {
      return res.status(404).json({ error: 'Export job not found' });
    }

    if (exportJob.status !== 'completed' || !exportJob.outputPath) {
      return res.status(400).json({ error: 'Video not ready for download' });
    }

    if (!fs.existsSync(exportJob.outputPath)) {
      return res.status(404).json({ error: 'Video file not found' });
    }

    const filename = path.basename(exportJob.outputPath);
    res.setHeader('Content-Type', exportJob.format === 'mp4' ? 'video/mp4' : 'image/gif');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    const fileStream = fs.createReadStream(exportJob.outputPath);
    fileStream.pipe(res);

  } catch (error) {
    console.error('Video download error:', error);
    res.status(500).json({
      error: 'Video download failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.delete('/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = animationJobs.get(jobId);

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Remove job from memory
    animationJobs.delete(jobId);

    // Clean up files
    const jobDir = path.join(process.cwd(), 'data', 'animation_frames', jobId);
    try {
      await fs.promises.rmdir(jobDir, { recursive: true });
    } catch (error) {
      console.error('Failed to cleanup job files:', error);
    }

    res.json({
      success: true,
      message: 'Animation job deleted successfully'
    });

  } catch (error) {
    console.error('Job deletion error:', error);
    res.status(500).json({
      error: 'Job deletion failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/animation/jobs
 * List all animation jobs
 */
router.get('/jobs', (req, res) => {
  try {
    const jobs = Array.from(animationJobs.values()).map(job => ({
      id: job.id,
      status: job.status,
      parameters: job.parameters,
      totalFrames: job.frames.length,
      completedFrames: job.frames.filter(f => f.status === 'completed').length,
      startedAt: job.startedAt,
      completedAt: job.completedAt
    }));

    res.json({
      success: true,
      jobs: jobs.sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime())
    });

  } catch (error) {
    console.error('Job listing error:', error);
    res.status(500).json({
      error: 'Job listing failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Helper functions

function generateJobId(): string {
  return `anim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function generateDateRange(start: string, end: string): string[] {
  const dates: string[] = [];
  const startDate = new Date(start);
  const endDate = new Date(end);
  
  const current = new Date(startDate);
  while (current <= endDate) {
    dates.push(current.toISOString().split('T')[0]);
    current.setDate(current.getDate() + 1);
  }
  
  return dates;
}

async function generateAnimationFrames(job: AnimationJob): Promise<void> {
  const jobDir = path.join(process.cwd(), 'data', 'animation_frames', job.id);
  await fs.promises.mkdir(jobDir, { recursive: true });

  console.log(`Starting animation generation for job ${job.id}`);

  for (let i = 0; i < job.frames.length; i++) {
    const frame = job.frames[i];
    frame.status = 'processing';
    animationJobs.set(job.id, job);

    try {
      const filename = `frame_${i.toString().padStart(3, '0')}_${frame.date}.jpg`;
      const outputPath = path.join(jobDir, filename);

      // Generate frame using direct GIBS downloader
      const success = await generateSingleFrame(
        job.parameters,
        frame.date,
        outputPath
      );

      if (success) {
        frame.status = 'completed';
        frame.filename = filename;
        frame.url = `/api/animation/frame/${job.id}/${frame.date}`;
        console.log(`Generated frame ${i + 1}/${job.frames.length}: ${filename}`);
      } else {
        frame.status = 'failed';
        console.error(`Failed to generate frame ${i + 1}/${job.frames.length}: ${frame.date}`);
      }

    } catch (error) {
      console.error(`Error generating frame ${frame.date}:`, error);
      frame.status = 'failed';
    }

    // Update job progress
    const completedFrames = job.frames.filter(f => f.status === 'completed').length;
    job.progress = (completedFrames / job.frames.length) * 100;
    animationJobs.set(job.id, job);
  }

  // Mark job as completed
  job.status = 'completed';
  job.completedAt = new Date();
  animationJobs.set(job.id, job);

  console.log(`Animation generation completed for job ${job.id}`);
}

async function generateSingleFrame(
  parameters: any,
  date: string,
  outputPath: string
): Promise<boolean> {
  return new Promise((resolve) => {
    const scriptPath = path.join(process.cwd(), 'scripts', 'direct-gibs-downloader.py');
    const args = [
      '--layer', parameters.layer,
      '--date', date,
      '--output', outputPath,
      '--zoom', parameters.zoom.toString(),
      '--width', parameters.width.toString(),
      '--height', parameters.height.toString()
    ];

    const pythonProcess = spawn('python', [scriptPath, ...args], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    pythonProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code === 0) {
        resolve(true);
      } else {
        console.error(`Frame generation failed for ${date}: ${stderr}`);
        resolve(false);
      }
    });

    pythonProcess.on('error', (error) => {
      console.error(`Frame generation process error for ${date}:`, error);
      resolve(false);
    });

    // Timeout after 2 minutes
    setTimeout(() => {
      pythonProcess.kill();
      resolve(false);
    }, 120000);
  });
}

export default router;

// Background video export function
async function exportVideoInBackground(
  framesDir: string, 
  outputPath: string, 
  format: string, 
  fps: number, 
  quality: string, 
  width: number, 
  exportId: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    const pythonScript = path.join(process.cwd(), 'scripts', 'animation-video-generator.py');
    
    const args = [
      pythonScript,
      framesDir,
      outputPath,
      format,
      fps.toString(),
      quality,
      width.toString()
    ];

    console.log(`Starting video export: ${exportId}`);
    console.log(`Command: python ${args.join(' ')}`);

    const pythonProcess = spawn('python', args, {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    pythonProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code === 0) {
        console.log(`Video export completed: ${exportId}`);
        resolve();
      } else {
        console.error(`Video export failed: ${exportId}`, stderr);
        reject(new Error(`Video export failed with code ${code}: ${stderr}`));
      }
    });

    pythonProcess.on('error', (error) => {
      console.error(`Video export process error: ${exportId}`, error);
      reject(error);
    });
  });
}