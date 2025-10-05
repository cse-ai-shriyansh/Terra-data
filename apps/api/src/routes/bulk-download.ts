import { Router } from 'express';
import { bulkDownloadService } from '../services/bulk-download';

const router = Router();

/**
 * POST /api/bulk-download
 * Start a bulk download job
 */
router.post('/', async (req, res) => {
  try {
    const { year, layers, zoom, x, y, outputDir, maxConcurrent, retries } = req.body;

    if (!year) {
      return res.status(400).json({ error: 'Year is required' });
    }

    const config = {
      year: year.toString(),
      layers: layers || [
        'MODIS_Terra_CorrectedReflectance_TrueColor',
        'MODIS_Terra_CorrectedReflectance_Bands721',
        'MODIS_Terra_CorrectedReflectance_Bands367',
        'MODIS_Terra_SurfaceReflectance_Bands121'
      ],
      zoom: zoom || 3,
      x: x || 4,
      y: y || 2,
      outputDir: outputDir || './data/terra_downloads',
      maxConcurrent: maxConcurrent || 3,
      retries: retries || 3
    };

    const downloadId = await bulkDownloadService.startBulkDownload(config);

    res.json({
      success: true,
      downloadId,
      config,
      message: 'Bulk download started'
    });

  } catch (error) {
    console.error('Bulk download error:', error);
    res.status(500).json({
      error: 'Failed to start bulk download',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/bulk-download/:id
 * Get download progress
 */
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const progress = bulkDownloadService.getDownloadProgress(id);

    if (!progress) {
      return res.status(404).json({ error: 'Download not found' });
    }

    res.json({
      success: true,
      progress
    });

  } catch (error) {
    console.error('Get progress error:', error);
    res.status(500).json({
      error: 'Failed to get download progress',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/bulk-download
 * List all active downloads
 */
router.get('/', (req, res) => {
  try {
    const downloads = bulkDownloadService.listActiveDownloads();
    
    res.json({
      success: true,
      downloads
    });

  } catch (error) {
    console.error('List downloads error:', error);
    res.status(500).json({
      error: 'Failed to list downloads',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * DELETE /api/bulk-download/:id
 * Cancel a download
 */
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const success = bulkDownloadService.cancelDownload(id);

    if (!success) {
      return res.status(404).json({ error: 'Download not found' });
    }

    res.json({
      success: true,
      message: 'Download cancelled'
    });

  } catch (error) {
    console.error('Cancel download error:', error);
    res.status(500).json({
      error: 'Failed to cancel download',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;