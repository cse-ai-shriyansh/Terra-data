/**
 * MODIS Terra Data Test - Correct GIBS Format
 * Test with the proper NASA GIBS WMTS URL structure
 */

import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const EARTHDATA_TOKEN = process.env.EARTHDATA_TOKEN;

async function testCorrectGIBSFormat() {
  console.log('🛰️ Testing MODIS Terra with Correct GIBS Format...\n');
  
  if (!EARTHDATA_TOKEN) {
    console.error('❌ EARTHDATA_TOKEN not found in environment');
    return;
  }
  
  console.log('✅ Earthdata Token: Configured\n');

  // Test different GIBS endpoint variations
  const endpoints = [
    'https://gibs.earthdata.nasa.gov/wmts/epsg4326/best/wmts.cgi',
    'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/wmts.cgi', 
    'https://gibs.earthdata.nasa.gov/wmts-geo/wmts.cgi',
    'https://gibs.earthdata.nasa.gov/wmts-arctic/wmts.cgi'
  ];

  for (const endpoint of endpoints) {
    console.log(`🔍 Testing endpoint: ${endpoint}`);
    
    try {
      const capabilitiesUrl = `${endpoint}?SERVICE=WMTS&REQUEST=GetCapabilities`;
      const response = await axios({
        method: 'GET',
        url: capabilitiesUrl,
        timeout: 15000,
        headers: {
          'Authorization': `Bearer ${EARTHDATA_TOKEN}`,
          'User-Agent': 'Terra25/1.0.0'
        }
      });

      if (response.status === 200) {
        console.log(`✅ SUCCESS: ${endpoint}`);
        console.log(`   Response size: ${response.data.length} characters`);
        
        const hasModisTerra = response.data.includes('MODIS_Terra');
        console.log(`   MODIS Terra layers: ${hasModisTerra ? '✅ Found' : '❌ Not found'}`);
        
        if (hasModisTerra) {
          console.log('   🎯 This is the correct endpoint!');
          
          // Try to get a tile from this endpoint
          const tileUrl = `${endpoint}?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=MODIS_Terra_CorrectedReflectance_TrueColor&STYLE=default&FORMAT=image/jpeg&TILEMATRIXSET=GoogleMapsCompatible_Level9&TILEMATRIX=0&TILEROW=0&TILECOL=0&TIME=2024-01-01`;
          
          console.log(`🧪 Testing tile: ${tileUrl.substring(0, 100)}...`);
          
          try {
            const tileResponse = await axios({
              method: 'GET',
              url: tileUrl,
              responseType: 'arraybuffer',
              timeout: 10000,
              headers: {
                'Authorization': `Bearer ${EARTHDATA_TOKEN}`,
                'User-Agent': 'Terra25/1.0.0'
              }
            });

            if (tileResponse.status === 200) {
              console.log(`✅ TILE SUCCESS: ${tileResponse.data.length} bytes`);
              console.log(`   Content-Type: ${tileResponse.headers['content-type']}`);
            }
          } catch (tileError) {
            console.log(`❌ Tile failed: ${tileError instanceof Error ? tileError.message : 'Unknown'}`);
          }
          
          break; // Found working endpoint
        }
      }
    } catch (error) {
      console.log(`❌ Failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    console.log('');
  }

  // Also test the map server endpoint
  console.log('🌍 Testing GIBS WMS (alternative)...');
  const wmsUrl = 'https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi?SERVICE=WMS&REQUEST=GetCapabilities';
  
  try {
    const response = await axios({
      method: 'GET',
      url: wmsUrl,
      timeout: 15000,
      headers: {
        'Authorization': `Bearer ${EARTHDATA_TOKEN}`,
        'User-Agent': 'Terra25/1.0.0'
      }
    });

    if (response.status === 200) {
      console.log('✅ WMS GetCapabilities: SUCCESS');
      const hasModisTerra = response.data.includes('MODIS_Terra');
      console.log(`   MODIS Terra layers: ${hasModisTerra ? '✅ Found' : '❌ Not found'}`);
    }
  } catch (error) {
    console.log(`❌ WMS failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  console.log('\n🎉 GIBS Format Test Complete!');
}

testCorrectGIBSFormat().catch(console.error);