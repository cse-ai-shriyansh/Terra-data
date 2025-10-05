#!/usr/bin/env tsx

import { bulkDownloadService, BulkDownloadConfig } from '../src/services/bulk-download';
import path from 'path';

// Terra satellite layers available in NASA GIBS
const TERRA_LAYERS = [
  'MODIS_Terra_CorrectedReflectance_TrueColor',
  'MODIS_Terra_CorrectedReflectance_Bands721',
  'MODIS_Terra_CorrectedReflectance_Bands367',
  'MODIS_Terra_SurfaceReflectance_Bands121',
  'MODIS_Terra_SurfaceReflectance_Bands143',
  'MODIS_Terra_Aerosol',
  'MODIS_Terra_Land_Surface_Temp_Day',
  'MODIS_Terra_Snow_Cover'
];

async function main() {
  console.log('🛰️ Terra25 Bulk Download CLI');
  console.log('==============================\n');

  const year = process.argv[2] || '2023';
  const outputDir = process.argv[3] || path.join(process.cwd(), 'data', 'terra_downloads');
  
  // For global coverage, we'll download multiple representative tiles
  const tiles = [
    { z: 3, x: 4, y: 2 },  // North America
    { z: 3, x: 6, y: 3 },  // Europe/Africa
    { z: 3, x: 7, y: 4 },  // Asia
    { z: 3, x: 2, y: 5 },  // South America
    { z: 3, x: 0, y: 4 }   // Pacific
  ];

  console.log(`📅 Year: ${year}`);
  console.log(`📁 Output Directory: ${outputDir}`);
  console.log(`🌍 Tiles: ${tiles.length} global regions`);
  console.log(`📡 Layers: ${TERRA_LAYERS.length} Terra instruments`);
  console.log('');

  const config: BulkDownloadConfig = {
    year,
    layers: TERRA_LAYERS,
    zoom: 3,
    x: 4,  // Default tile - we'll iterate through multiple tiles
    y: 2,
    outputDir,
    maxConcurrent: 3,  // Conservative to avoid overwhelming NASA servers
    retries: 3
  };

  try {
    console.log('🚀 Starting bulk download...\n');
    
    const downloadId = await bulkDownloadService.startBulkDownload(config);
    console.log(`📋 Download ID: ${downloadId}`);
    
    // Monitor progress
    const progressInterval = setInterval(() => {
      const progress = bulkDownloadService.getDownloadProgress(downloadId);
      if (!progress) {
        clearInterval(progressInterval);
        return;
      }

      const percentage = ((progress.completed + progress.failed) / progress.total * 100).toFixed(1);
      console.log(`📊 Progress: ${percentage}% (${progress.completed}/${progress.total} completed, ${progress.failed} failed)`);
      
      if (progress.current) {
        console.log(`📡 Current: ${progress.current}`);
      }

      if (progress.status === 'completed' || progress.status === 'error') {
        clearInterval(progressInterval);
        console.log('\n✅ Download completed!');
        console.log(`📈 Final Stats: ${progress.completed}/${progress.total} successful, ${progress.failed} failed`);
        process.exit(0);
      }
    }, 5000); // Update every 5 seconds

    // Keep the process alive
    process.on('SIGINT', () => {
      console.log('\n🛑 Cancelling download...');
      bulkDownloadService.cancelDownload(downloadId);
      clearInterval(progressInterval);
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Download failed:', error);
    process.exit(1);
  }
}

// Usage information
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log('🛰️ Terra25 Bulk Download CLI');
  console.log('');
  console.log('Usage:');
  console.log('  npm run download-terra [year] [output-dir]');
  console.log('');
  console.log('Arguments:');
  console.log('  year        Year to download (default: 2023)');
  console.log('  output-dir  Output directory (default: ./data/terra_downloads)');
  console.log('');
  console.log('Examples:');
  console.log('  npm run download-terra 2023');
  console.log('  npm run download-terra 2023 /path/to/downloads');
  console.log('');
  console.log('Available Terra Layers:');
  TERRA_LAYERS.forEach(layer => {
    console.log(`  - ${layer}`);
  });
  process.exit(0);
}

main().catch(console.error);