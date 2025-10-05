/**
 * MODIS Terra Data Test - Public Access
 * Test NASA GIBS without authentication first
 */

import axios from 'axios';

const GIBS_BASE_URL = 'https://gibs.earthdata.nasa.gov/wmts/1.0.0';

async function testPublicAccess() {
  console.log('🛰️ Testing MODIS Terra Public Access...\n');

  // Test public GetCapabilities (no auth required for this)
  console.log('🔍 Testing public GetCapabilities...');
  try {
    const capabilitiesUrl = `${GIBS_BASE_URL}?SERVICE=WMTS&REQUEST=GetCapabilities`;
    console.log(`📡 URL: ${capabilitiesUrl}`);
    
    const response = await axios({
      method: 'GET',
      url: capabilitiesUrl,
      timeout: 15000,
      headers: {
        'User-Agent': 'Terra25/1.0.0 Test'
      }
    });

    if (response.status === 200) {
      console.log('✅ Public GetCapabilities: SUCCESS');
      console.log(`   Response size: ${response.data.length} characters`);
      
      // Check for MODIS Terra layers
      const hasModisTerra = response.data.includes('MODIS_Terra');
      console.log(`   MODIS Terra layers found: ${hasModisTerra ? '✅ YES' : '❌ NO'}`);
      
      if (hasModisTerra) {
        const match = response.data.match(/<ows:Identifier>MODIS_Terra[^<]*<\/ows:Identifier>/g);
        if (match) {
          console.log('   Found layers:');
          match.slice(0, 5).forEach(layer => {
            const layerName = layer.replace(/<\/?ows:Identifier>/g, '');
            console.log(`     - ${layerName}`);
          });
        }
      }
    }
  } catch (error) {
    console.log(`❌ GetCapabilities failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  console.log('');

  // Test simple tile access without auth
  console.log('🧪 Testing public tile access...');
  
  // Try a basic MODIS Terra tile
  const tileUrl = `${GIBS_BASE_URL}/MODIS_Terra_CorrectedReflectance_TrueColor/default/2024-01-01/GoogleMapsCompatible_Level9/0/0/0.jpg`;
  console.log(`📡 Tile URL: ${tileUrl}`);
  
  try {
    const response = await axios({
      method: 'GET',
      url: tileUrl,
      responseType: 'arraybuffer',
      timeout: 10000,
      headers: {
        'User-Agent': 'Terra25/1.0.0 Test'
      }
    });

    if (response.status === 200) {
      console.log(`✅ Public tile access: SUCCESS`);
      console.log(`   Data size: ${response.data.length} bytes`);
      console.log(`   Content-Type: ${response.headers['content-type']}`);
    }
    
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.log(`❌ Public tile failed: HTTP ${error.response?.status} - ${error.message}`);
      if (error.response?.status === 401) {
        console.log('   This suggests authentication is required for tile access');
      }
    } else {
      console.log(`❌ Public tile failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  console.log('\n🎉 Public Access Test Complete!');
}

testPublicAccess().catch(console.error);