/**
 * MODIS Terra Data Test Script
 * Direct test of NASA GIBS WMTS API with your Earthdata token
 */

import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const EARTHDATA_TOKEN = process.env.EARTHDATA_TOKEN;
const GIBS_BASE_URL = 'https://gibs.earthdata.nasa.gov/wmts/1.0.0';

// Test MODIS Terra True Color tile
async function testModisTerraData() {
  console.log('🛰️ Testing MODIS Terra Satellite Data Loading...\n');
  
  if (!EARTHDATA_TOKEN) {
    console.error('❌ EARTHDATA_TOKEN not found in environment');
    return;
  }
  
  console.log('✅ Earthdata Token: Configured');
  console.log(`🌐 GIBS Base URL: ${GIBS_BASE_URL}\n`);

  // Test different MODIS Terra layers
  const testLayers = [
    {
      name: 'MODIS_Terra_CorrectedReflectance_TrueColor',
      displayName: 'Terra True Color',
      date: '2024-01-01',
      z: 2, x: 1, y: 1,
      format: 'jpg'
    },
    {
      name: 'MODIS_Terra_CorrectedReflectance_Bands367', 
      displayName: 'Terra False Color (Bands 3-6-7)',
      date: '2024-01-01',
      z: 2, x: 1, y: 1,
      format: 'jpg'
    },
    {
      name: 'MODIS_Terra_Aerosol',
      displayName: 'Terra Aerosol Optical Depth',
      date: '2024-01-01', 
      z: 2, x: 1, y: 1,
      format: 'png'
    }
  ];

  for (const layer of testLayers) {
    console.log(`🧪 Testing: ${layer.displayName}`);
    
    const tileUrl = `${GIBS_BASE_URL}/${layer.name}/default/${layer.date}/GoogleMapsCompatible_Level9/${layer.z}/${layer.y}/${layer.x}.${layer.format}`;
    
    console.log(`📡 URL: ${tileUrl}`);
    
    try {
      const response = await axios({
        method: 'GET',
        url: tileUrl,
        responseType: 'arraybuffer',
        headers: {
          'Authorization': `Bearer ${EARTHDATA_TOKEN}`,
          'User-Agent': 'Terra25/1.0.0 MODIS-Test'
        },
        timeout: 10000
      });

      if (response.status === 200) {
        const dataSize = response.data.length;
        console.log(`✅ SUCCESS: Received ${dataSize} bytes`);
        console.log(`   Content-Type: ${response.headers['content-type']}`);
      } else {
        console.log(`⚠️  Unexpected status: ${response.status}`);
      }
      
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          console.log(`❌ FAILED: Tile not available (404)`);
        } else if (error.response?.status === 401) {
          console.log(`❌ FAILED: Authentication error (401) - Check token validity`);
        } else {
          console.log(`❌ FAILED: HTTP ${error.response?.status} - ${error.message}`);
        }
      } else {
        console.log(`❌ FAILED: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    console.log('');
  }

  // Test with recent date (past week)
  const recentDate = new Date();
  recentDate.setDate(recentDate.getDate() - 7);
  const recentDateStr = recentDate.toISOString().split('T')[0];
  
  console.log(`🗓️  Testing with recent date: ${recentDateStr}`);
  
  const recentTileUrl = `${GIBS_BASE_URL}/MODIS_Terra_CorrectedReflectance_TrueColor/default/${recentDateStr}/GoogleMapsCompatible_Level9/2/1/1.jpg`;
  
  try {
    const response = await axios({
      method: 'GET',
      url: recentTileUrl,
      responseType: 'arraybuffer',
      headers: {
        'Authorization': `Bearer ${EARTHDATA_TOKEN}`,
        'User-Agent': 'Terra25/1.0.0 MODIS-Recent-Test'
      },
      timeout: 10000
    });

    if (response.status === 200) {
      console.log(`✅ Recent data available: ${response.data.length} bytes`);
    }
    
  } catch (error) {
    console.log(`❌ Recent data test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
  
  console.log('\n🎉 MODIS Terra Data Test Complete!');
}

// Run the test
testModisTerraData().catch(console.error);