/**
 * MODIS Terra Data Test Script - Enhanced
 * Test NASA GIBS WMTS capabilities and tile access
 */

import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const EARTHDATA_TOKEN = process.env.EARTHDATA_TOKEN;
const GIBS_BASE_URL = 'https://gibs.earthdata.nasa.gov/wmts/1.0.0';

async function testModisCapabilities() {
  console.log('🛰️ Testing MODIS Terra GIBS Capabilities...\n');
  
  if (!EARTHDATA_TOKEN) {
    console.error('❌ EARTHDATA_TOKEN not found in environment');
    return;
  }
  
  console.log('✅ Earthdata Token: Configured');
  console.log(`🌐 GIBS Base URL: ${GIBS_BASE_URL}\n`);

  // Test GIBS GetCapabilities
  console.log('🔍 Testing GIBS GetCapabilities...');
  try {
    const capabilitiesUrl = `${GIBS_BASE_URL}?SERVICE=WMTS&REQUEST=GetCapabilities`;
    const response = await axios({
      method: 'GET',
      url: capabilitiesUrl,
      headers: {
        'Authorization': `Bearer ${EARTHDATA_TOKEN}`,
        'User-Agent': 'Terra25/1.0.0'
      },
      timeout: 15000
    });

    if (response.status === 200) {
      console.log('✅ GIBS GetCapabilities: SUCCESS');
      console.log(`   Response size: ${response.data.length} characters`);
      
      // Check if MODIS Terra layers are mentioned
      const hasModisTerra = response.data.includes('MODIS_Terra');
      console.log(`   MODIS Terra layers found: ${hasModisTerra ? '✅ YES' : '❌ NO'}`);
    }
  } catch (error) {
    console.log(`❌ GetCapabilities failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  console.log('');

  // Test specific Terra tiles with different coordinates
  const testConfigs = [
    {
      layer: 'MODIS_Terra_CorrectedReflectance_TrueColor',
      date: '2024-01-01',
      z: 0, x: 0, y: 0, // Try global tile
      format: 'jpg'
    },
    {
      layer: 'MODIS_Terra_CorrectedReflectance_TrueColor', 
      date: '2024-01-01',
      z: 1, x: 0, y: 0, // Try zoom level 1
      format: 'jpg'
    },
    {
      layer: 'MODIS_Terra_CorrectedReflectance_TrueColor',
      date: '2024-01-01', 
      z: 1, x: 1, y: 0, // Different tile
      format: 'jpg'
    }
  ];

  for (const config of testConfigs) {
    console.log(`🧪 Testing: ${config.layer} (z${config.z}/${config.x}/${config.y})`);
    
    const tileUrl = `${GIBS_BASE_URL}/${config.layer}/default/${config.date}/GoogleMapsCompatible_Level9/${config.z}/${config.y}/${config.x}.${config.format}`;
    
    try {
      const response = await axios({
        method: 'GET',
        url: tileUrl,
        responseType: 'arraybuffer',
        headers: {
          'Authorization': `Bearer ${EARTHDATA_TOKEN}`,
          'User-Agent': 'Terra25/1.0.0'
        },
        timeout: 10000
      });

      if (response.status === 200) {
        console.log(`✅ SUCCESS: ${response.data.length} bytes, Content-Type: ${response.headers['content-type']}`);
        break; // Success, no need to test more
      }
      
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        console.log(`❌ 404: Tile not available`);
      } else {
        console.log(`❌ Error: ${error instanceof Error ? error.message : 'Unknown'}`);
      }
    }
  }

  // Test a more recent date
  console.log('\n🗓️  Testing recent data availability...');
  const recentDate = '2024-10-01'; // Recent but not too recent
  
  const recentUrl = `${GIBS_BASE_URL}/MODIS_Terra_CorrectedReflectance_TrueColor/default/${recentDate}/GoogleMapsCompatible_Level9/0/0/0.jpg`;
  
  try {
    const response = await axios({
      method: 'GET',
      url: recentUrl,
      responseType: 'arraybuffer',
      headers: {
        'Authorization': `Bearer ${EARTHDATA_TOKEN}`,
        'User-Agent': 'Terra25/1.0.0'
      },
      timeout: 10000
    });

    if (response.status === 200) {
      console.log(`✅ Recent data (${recentDate}): ${response.data.length} bytes`);
    }
    
  } catch (error) {
    console.log(`❌ Recent data test: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  console.log('\n🎉 MODIS Terra Test Complete!');
}

testModisCapabilities().catch(console.error);