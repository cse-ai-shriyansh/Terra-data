import { Router } from 'express';
import fs from 'fs/promises';
import path from 'path';

const router = Router();

/**
 * GET /api/world-maps
 * List available world map files
 */
router.get('/', async (req, res) => {
  try {
    const worldMapsDir = path.join(process.cwd(), 'data', 'world_maps');
    
    // Check if directory exists
    try {
      await fs.access(worldMapsDir);
    } catch {
      return res.json({
        success: true,
        maps: [],
        message: 'No world maps generated yet'
      });
    }
    
    const files = await fs.readdir(worldMapsDir);
    const mapFiles = files
      .filter(file => file.endsWith('.jpg') && !file.includes('thumb'))
      .map(file => {
        const stats = fs.stat(path.join(worldMapsDir, file));
        return {
          filename: file,
          path: `/api/world-maps/image/${file}`,
          thumbnail: `/api/world-maps/image/${file.replace('.jpg', '_thumb.jpg')}`,
          date: extractDateFromFilename(file),
          size: stats.then(s => s.size).catch(() => 0)
        };
      });

    const resolvedMaps = await Promise.all(
      mapFiles.map(async (map) => ({
        ...map,
        size: await map.size
      }))
    );

    res.json({
      success: true,
      maps: resolvedMaps.sort((a, b) => a.date.localeCompare(b.date)),
      total: resolvedMaps.length
    });

  } catch (error) {
    console.error('Error listing world maps:', error);
    res.status(500).json({
      error: 'Failed to list world maps',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/world-maps/image/:filename
 * Serve world map image files
 */
router.get('/image/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const worldMapsDir = path.join(process.cwd(), 'data', 'world_maps');
    const filePath = path.join(worldMapsDir, filename);

    // Security check - ensure filename doesn't contain path traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({ error: 'Invalid filename' });
    }

    // Check if file exists
    try {
      await fs.access(filePath);
    } catch {
      return res.status(404).json({ error: 'World map not found' });
    }

    // Set appropriate headers
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour

    // Stream the file
    const fileStream = require('fs').createReadStream(filePath);
    fileStream.pipe(res);

  } catch (error) {
    console.error('Error serving world map:', error);
    res.status(500).json({
      error: 'Failed to serve world map',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/world-maps/generate
 * Generate new world maps from Terra data
 */
router.post('/generate', async (req, res) => {
  try {
    const { date, generateAll = false } = req.body;

    // This would trigger the Python script
    // For now, return a placeholder response
    res.json({
      success: true,
      message: 'World map generation initiated',
      date: date || 'all dates',
      estimated_time: generateAll ? '10-15 minutes' : '30 seconds'
    });

  } catch (error) {
    console.error('Error generating world maps:', error);
    res.status(500).json({
      error: 'Failed to generate world maps',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Extract date from world map filename
 */
function extractDateFromFilename(filename: string): string {
  // Extract date from filename like: terra_world_map_2023-01-01.jpg
  const match = filename.match(/(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : '1970-01-01';
}

export default router;