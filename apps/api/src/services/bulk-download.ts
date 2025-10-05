import fs from 'fs/promises';
import path from 'path';
import https from 'https';
import { terraService } from './terra-service';

export interface BulkDownloadConfig {
  year: string;
  layers: string[];
  zoom: number;
  x: number;
  y: number;
  outputDir: string;
  maxConcurrent?: number;
  retries?: number;
}

export interface DownloadProgress {
  total: number;
  completed: number;
  failed: number;
  current?: string;
  status: 'idle' | 'downloading' | 'completed' | 'error';
}

export class BulkDownloadService {
  private static instance: BulkDownloadService;
  private activeDownloads = new Map<string, DownloadProgress>();

  static getInstance(): BulkDownloadService {
    if (!BulkDownloadService.instance) {
      BulkDownloadService.instance = new BulkDownloadService();
    }
    return BulkDownloadService.instance;
  }

  /**
   * Generate all dates for a given year
   */
  private generateDatesForYear(year: string): string[] {
    const dates: string[] = [];
    const startDate = new Date(`${year}-01-01`);
    const endDate = new Date(`${year}-12-31`);
    
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      dates.push(d.toISOString().split('T')[0]);
    }
    
    return dates;
  }

  /**
   * Download a single tile with retry logic
   */
  private async downloadTile(url: string, outputPath: string, retries = 3): Promise<boolean> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        await fs.mkdir(path.dirname(outputPath), { recursive: true });
        
        const file = await fs.open(outputPath, 'w');
        const stream = file.createWriteStream();
        
        return new Promise<boolean>((resolve, reject) => {
          https.get(url, (response) => {
            if (response.statusCode === 200) {
              response.pipe(stream);
              stream.on('finish', () => {
                stream.close();
                resolve(true);
              });
            } else {
              stream.close();
              reject(new Error(`HTTP ${response.statusCode}`));
            }
          }).on('error', (error) => {
            stream.close();
            reject(error);
          });
        });
      } catch (error) {
        console.error(`Attempt ${attempt}/${retries} failed for ${url}:`, error);
        if (attempt === retries) {
          return false;
        }
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
    return false;
  }

  /**
   * Start bulk download for a year of Terra data
   */
  async startBulkDownload(config: BulkDownloadConfig): Promise<string> {
    const downloadId = `bulk_${Date.now()}`;
    const dates = this.generateDatesForYear(config.year);
    const { layers, zoom, x, y, outputDir, maxConcurrent = 5, retries = 3 } = config;
    
    const totalTiles = dates.length * layers.length;
    
    // Initialize progress tracking
    this.activeDownloads.set(downloadId, {
      total: totalTiles,
      completed: 0,
      failed: 0,
      status: 'downloading'
    });

    // Start the download process asynchronously
    this.processBulkDownload(downloadId, dates, layers, zoom, x, y, outputDir, maxConcurrent, retries, config.year)
      .catch(error => {
        console.error('Bulk download error:', error);
        const progress = this.activeDownloads.get(downloadId);
        if (progress) {
          progress.status = 'error';
        }
      });

    return downloadId;
  }

  /**
   * Process the bulk download with concurrency control
   */
  private async processBulkDownload(
    downloadId: string,
    dates: string[],
    layers: string[],
    zoom: number,
    x: number,
    y: number,
    outputDir: string,
    maxConcurrent: number,
    retries: number,
    year: string
  ): Promise<void> {
    const progress = this.activeDownloads.get(downloadId)!;
    const semaphore = new Array(maxConcurrent).fill(null).map(() => Promise.resolve());
    let semaphoreIndex = 0;

    const downloadTasks: Promise<void>[] = [];

    for (const date of dates) {
      for (const layer of layers) {
        const task = semaphore[semaphoreIndex].then(async () => {
          try {
            progress.current = `${date} - ${layer}`;
            
            const url = terraService.getTerraTileUrl(date, zoom, x, y, layer);
            const filename = `${layer}_${date}_${zoom}_${x}_${y}.jpg`;
            const outputPath = path.join(outputDir, year, layer, filename);
            
            const success = await this.downloadTile(url, outputPath, retries);
            
            if (success) {
              progress.completed++;
            } else {
              progress.failed++;
            }
            
            console.log(`Progress: ${progress.completed + progress.failed}/${progress.total} (${progress.failed} failed)`);
            
          } catch (error) {
            console.error(`Download failed for ${date} ${layer}:`, error);
            progress.failed++;
          }
        });

        downloadTasks.push(task);
        semaphore[semaphoreIndex] = task;
        semaphoreIndex = (semaphoreIndex + 1) % maxConcurrent;
      }
    }

    // Wait for all downloads to complete
    await Promise.all(downloadTasks);
    
    progress.status = 'completed';
    progress.current = undefined;
    
    console.log(`Bulk download ${downloadId} completed: ${progress.completed}/${progress.total} successful, ${progress.failed} failed`);
  }

  /**
   * Get download progress
   */
  getDownloadProgress(downloadId: string): DownloadProgress | null {
    return this.activeDownloads.get(downloadId) || null;
  }

  /**
   * List all active downloads
   */
  listActiveDownloads(): Array<{ id: string; progress: DownloadProgress }> {
    return Array.from(this.activeDownloads.entries()).map(([id, progress]) => ({ id, progress }));
  }

  /**
   * Cancel a download (stops tracking, doesn't stop in-flight requests)
   */
  cancelDownload(downloadId: string): boolean {
    return this.activeDownloads.delete(downloadId);
  }
}

export const bulkDownloadService = BulkDownloadService.getInstance();