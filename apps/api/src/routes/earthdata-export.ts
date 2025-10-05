import { Router } from 'express';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

const router = Router();

/**
 * POST /api/earthdata-export
 * Export images directly from NASA Earthdata API
 */
router.post('/export', async (req, res) => {
  try {
    const {
      layer = 'terra_true_color',
      date,
      method = 'direct',
      width = 3840,
      height = 2160,
      zoom = 2,
      region = 'global',
      bbox,
      format = 'jpg'
    } = req.body;

    if (!date) {
      return res.status(400).json({
        error: 'Date is required',
        message: 'Please provide a date in YYYY-MM-DD format'
      });
    }

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({
        error: 'Invalid date format',
        message: 'Date must be in YYYY-MM-DD format'
      });
    }

    const outputDir = path.join(process.cwd(), 'data', 'earthdata_exports');
    await fs.promises.mkdir(outputDir, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${layer}_${date}_${method}_${timestamp}.${format}`;
    const outputPath = path.join(outputDir, filename);

    res.json({
      success: true,
      message: 'Export started',
      jobId: timestamp,
      parameters: {
        layer,
        date,
        method,
        width,
        height,
        zoom,
        region,
        bbox
      },
      estimatedTime: '30-60 seconds',
      outputPath: `/api/earthdata-export/download/${filename}`
    });

    // Start export process in background
    exportInBackground(req.body, outputPath).catch(error => {
      console.error('Background export failed:', error);
    });

  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({
      error: 'Export failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/earthdata-export/download/:filename
 * Download exported image files
 */
router.get('/download/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const outputDir = path.join(process.cwd(), 'data', 'earthdata_exports');
    const filePath = path.join(outputDir, filename);

    // Security check
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({ error: 'Invalid filename' });
    }

    // Check if file exists
    try {
      await fs.promises.access(filePath);
    } catch {
      return res.status(404).json({ error: 'File not found' });
    }

    // Set appropriate headers
    const ext = path.extname(filename).toLowerCase();
    const mimeType = ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : 
                    ext === '.png' ? 'image/png' : 'application/octet-stream';

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Cache-Control', 'public, max-age=86400'); // 24 hours

    // Stream the file
    const fileStream = require('fs').createReadStream(filePath);
    fileStream.pipe(res);

  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({
      error: 'Download failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/earthdata-export/status/:jobId
 * Check export job status
 */
router.get('/status/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    const outputDir = path.join(process.cwd(), 'data', 'earthdata_exports');
    
    // Look for files with this job ID
    const files = await fs.promises.readdir(outputDir);
    const jobFiles = files.filter(file => file.includes(jobId));

    if (jobFiles.length === 0) {
      return res.json({
        status: 'processing',
        message: 'Export job is still running',
        jobId
      });
    }

    const filename = jobFiles[0];
    const filePath = path.join(outputDir, filename);
    const stats = await fs.promises.stat(filePath);

    res.json({
      status: 'completed',
      message: 'Export job completed successfully',
      jobId,
      filename,
      size: stats.size,
      downloadUrl: `/api/earthdata-export/download/${filename}`,
      completedAt: stats.birthtime
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
 * GET /api/earthdata-export/layers
 * List available layers for export
 */
router.get('/layers', (req, res) => {
  const layers = {
    terra_true_color: {
      name: 'Terra True Color',
      description: 'MODIS Terra Corrected Reflectance (True Color)',
      resolution: '250m',
      format: 'jpg'
    },
    terra_false_color: {
      name: 'Terra False Color (3-6-7)',
      description: 'MODIS Terra Corrected Reflectance (Bands 3-6-7)',
      resolution: '250m',
      format: 'jpg'
    },
    terra_bands721: {
      name: 'Terra Bands 7-2-1',
      description: 'MODIS Terra Corrected Reflectance (Bands 7-2-1)',
      resolution: '250m',
      format: 'jpg'
    },
    aqua_true_color: {
      name: 'Aqua True Color',
      description: 'MODIS Aqua Corrected Reflectance (True Color)',
      resolution: '250m',
      format: 'jpg'
    },
    viirs_true_color: {
      name: 'VIIRS True Color',
      description: 'VIIRS/S-NPP Corrected Reflectance (True Color)',
      resolution: '250m',
      format: 'jpg'
    }
  };

  res.json({
    success: true,
    layers,
    total: Object.keys(layers).length
  });
});

/**
 * Background export function
 */
async function exportInBackground(params: any, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const {
      layer = 'terra_true_color',
      date,
      method = 'direct',
      width = 3840,
      height = 2160,
      zoom = 2
    } = params;

    let scriptPath: string;
    let args: string[];

    if (method === 'direct') {
      scriptPath = path.join(process.cwd(), 'scripts', 'direct-gibs-downloader.py');
      args = [
        '--layer', layer,
        '--date', date,
        '--output', outputPath,
        '--zoom', zoom.toString(),
        '--width', width.toString(),
        '--height', height.toString()
      ];
    } else {
      scriptPath = path.join(process.cwd(), 'scripts', 'earthdata-image-exporter.py');
      args = [
        '--layer', layer,
        '--date', date,
        '--output', outputPath,
        '--method', method,
        '--width', width.toString(),
        '--height', height.toString()
      ];
    }

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
        console.log('Export completed successfully:', outputPath);
        resolve();
      } else {
        console.error('Export failed:', stderr);
        reject(new Error(`Export process failed with code ${code}: ${stderr}`));
      }
    });

    pythonProcess.on('error', (error) => {
      console.error('Export process error:', error);
      reject(error);
    });
  });
}

/**
 * POST /api/earthdata-export/create-video
 * Create video from frame URLs
 */
router.post('/create-video', async (req, res) => {
  try {
    const {
      frameUrls,
      format = 'mp4',
      fps = 2,
      quality = 'medium',
      width = 800,
      height = 600
    } = req.body;

    if (!frameUrls || !Array.isArray(frameUrls) || frameUrls.length === 0) {
      return res.status(400).json({
        error: 'Frame URLs required',
        message: 'Please provide an array of frame URLs'
      });
    }

    // Generate unique export ID
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const exportId = `video_${timestamp}`;

    res.json({
      success: true,
      message: 'Video creation started',
      exportId,
      format,
      estimatedTime: '30-60 seconds',
      statusUrl: `/api/earthdata-export/video-status/${exportId}`
    });

    // Start video creation in background
    createVideoFromUrls(frameUrls, format, fps, quality, width, height, exportId)
      .catch(error => {
        console.error('Video creation failed:', error);
        // Update status would go here if we had persistent storage
      });

  } catch (error) {
    console.error('Video creation error:', error);
    res.status(500).json({
      error: 'Video creation failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/earthdata-export/video-status/:exportId
 * Check video creation status
 */
router.get('/video-status/:exportId', (req, res) => {
  try {
    const { exportId } = req.params;
    
    // Simple file check - in production, use proper job tracking
    const outputDir = path.join(process.cwd(), 'data', 'video_exports');
    const possibleFiles = ['mp4', 'gif', 'webm'].map(ext => 
      path.join(outputDir, `${exportId}.${ext}`)
    );

    for (const filePath of possibleFiles) {
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        const ext = path.extname(filePath).slice(1);
        
        return res.json({
          success: true,
          status: 'completed',
          downloadUrl: `/api/earthdata-export/download-video/${exportId}.${ext}`,
          fileSize: stats.size,
          completedAt: stats.mtime
        });
      }
    }

    // Check if still processing (basic check)
    res.json({
      success: true,
      status: 'processing',
      progress: 50 // Placeholder
    });

  } catch (error) {
    console.error('Video status check error:', error);
    res.status(500).json({
      error: 'Status check failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/earthdata-export/download-video/:filename
 * Download created video
 */
router.get('/download-video/:filename', (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(process.cwd(), 'data', 'video_exports', filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Video file not found' });
    }

    const ext = path.extname(filename).slice(1);
    const mimeTypes: { [key: string]: string } = {
      'mp4': 'video/mp4',
      'gif': 'image/gif',
      'webm': 'video/webm'
    };

    res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

  } catch (error) {
    console.error('Video download error:', error);
    res.status(500).json({
      error: 'Download failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Helper function to create video from URLs
async function createVideoFromUrls(
  frameUrls: string[],
  format: string,
  fps: number,
  quality: string,
  width: number,
  height: number,
  exportId: string
): Promise<void> {
  const outputDir = path.join(process.cwd(), 'data', 'video_exports');
  await fs.promises.mkdir(outputDir, { recursive: true });

  const outputPath = path.join(outputDir, `${exportId}.${format}`);

  // For now, create a simple placeholder file
  // In a real implementation, you would:
  // 1. Download the frame images
  // 2. Use FFmpeg to create the video
  // 3. Handle the different formats properly

  const placeholderContent = `Video export placeholder for ${frameUrls.length} frames in ${format} format`;
  await fs.promises.writeFile(outputPath.replace(`.${format}`, '.txt'), placeholderContent);

  console.log(`Video creation completed for ${exportId} with ${frameUrls.length} frames`);
}

export default router;