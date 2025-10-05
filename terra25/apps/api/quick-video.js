/**
 * Simple Terra25 Video Generation
 * Direct API call to create animated satellite video
 */

import axios from 'axios';

async function quickVideoGeneration() {
  console.log('🎬 Creating Terra Satellite Animation...\n');

  try {
    // Quick animation request
    const response = await axios.post('http://localhost:3002/api/ingest', {
      layer: 'MODIS_Terra_CorrectedReflectance_TrueColor',
      dateRange: { start: '2024-01-01', end: '2024-01-05' },
      boundingBox: { north: 35, south: 25, east: -75, west: -85 },
      format: 'mp4',
      fps: 1
    }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000
    });

    console.log('✅ Animation job created successfully!');
    console.log('📊 Job Details:', response.data);
    console.log('\n🎯 Check the Terra25 web interface for progress:');
    console.log('   → http://localhost:3000');
    
  } catch (error) {
    console.log('❌ Error:', error.response?.data || error.message);
  }
}

quickVideoGeneration();