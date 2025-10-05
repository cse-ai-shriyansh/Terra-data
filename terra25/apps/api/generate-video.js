/**
 * Terra25 Animated Video Generation Test
 * Demonstrates creating an animation with NASA Terra satellite data
 */

import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const API_BASE_URL = 'http://localhost:3002';

async function generateAnimatedVideo() {
  console.log('🎬 Generating Terra25 Animated Video...\n');

  try {
    // Step 1: Create animation job
    console.log('🛰️ Step 1: Creating animation job with Terra satellite data...');
    
    const animationRequest = {
      layer: 'MODIS_Terra_CorrectedReflectance_TrueColor',
      dateRange: {
        start: '2024-01-01',
        end: '2024-01-07'
      },
      boundingBox: {
        north: 40.0,
        south: 30.0,
        east: -70.0,
        west: -80.0
      },
      outputFormat: 'frames',
      fps: 2
    };

    const ingestResponse = await axios.post(`${API_BASE_URL}/api/ingest`, animationRequest, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000
    });

    if (ingestResponse.status === 200) {
      const jobId = ingestResponse.data.jobId;
      console.log(`✅ Animation job created: ${jobId}`);
      console.log(`   Layer: ${animationRequest.layer}`);
      console.log(`   Date Range: ${animationRequest.dateRange.start} to ${animationRequest.dateRange.end}`);
      console.log(`   Area: Eastern US Coast\n`);

      // Step 2: Monitor job progress
      console.log('⏳ Step 2: Monitoring job progress...');
      
      let attempts = 0;
      const maxAttempts = 30; // 5 minutes max
      
      while (attempts < maxAttempts) {
        try {
          const statusResponse = await axios.get(`${API_BASE_URL}/api/frames/${jobId}`);
          
          if (statusResponse.status === 200 && statusResponse.data.status === 'completed') {
            console.log(`✅ Animation frames ready: ${statusResponse.data.frameCount} frames`);
            
            // Step 3: Create video export
            console.log('\n🎥 Step 3: Creating MP4 video export...');
            
            const exportRequest = {
              jobId: jobId,
              format: 'mp4',
              fps: 2,
              resolution: '1080p'
            };

            const exportResponse = await axios.post(`${API_BASE_URL}/api/export`, exportRequest, {
              headers: { 'Content-Type': 'application/json' },
              timeout: 60000
            });

            if (exportResponse.status === 200) {
              const exportJobId = exportResponse.data.exportJobId;
              console.log(`✅ Video export started: ${exportJobId}`);
              
              // Monitor export progress
              console.log('⏳ Step 4: Processing video...');
              
              let exportAttempts = 0;
              while (exportAttempts < 20) {
                await new Promise(resolve => setTimeout(resolve, 3000));
                
                try {
                  const exportStatusResponse = await axios.get(`${API_BASE_URL}/api/export/${exportJobId}`);
                  
                  if (exportStatusResponse.status === 200) {
                    const exportStatus = exportStatusResponse.data;
                    
                    if (exportStatus.status === 'completed') {
                      console.log(`\n🎉 ANIMATED VIDEO READY!`);
                      console.log(`📁 Download URL: ${API_BASE_URL}/exports/${exportJobId}.mp4`);
                      console.log(`📊 Video Details:`);
                      console.log(`   - Format: MP4`);
                      console.log(`   - Resolution: 1080p`);
                      console.log(`   - FPS: 2`);
                      console.log(`   - Duration: ~3.5 seconds (7 frames)`);
                      console.log(`   - Content: Terra True Color satellite imagery`);
                      console.log(`   - Area: Eastern US coastline`);
                      return;
                    } else if (exportStatus.status === 'failed') {
                      console.log(`❌ Video export failed: ${exportStatus.error}`);
                      return;
                    } else {
                      console.log(`⏳ Export progress: ${exportStatus.status}`);
                    }
                  }
                } catch (error) {
                  console.log(`⚠️  Export status check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
                }
                
                exportAttempts++;
              }
              
              console.log('⏰ Export timeout - video may still be processing');
              
            } else {
              console.log(`❌ Export request failed: ${exportResponse.status}`);
            }
            
            return;
            
          } else if (statusResponse.data.status === 'failed') {
            console.log(`❌ Animation job failed: ${statusResponse.data.error}`);
            return;
          } else {
            console.log(`⏳ Job progress: ${statusResponse.data.status}`);
          }
          
        } catch (error) {
          console.log(`⚠️  Status check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
        
        await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
        attempts++;
      }
      
      console.log('⏰ Animation timeout - job may still be processing');
      
    } else {
      console.log(`❌ Failed to create animation job: ${ingestResponse.status}`);
    }

  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.log(`❌ API Error: ${error.response?.status} - ${error.message}`);
      if (error.response?.data) {
        console.log(`   Details: ${JSON.stringify(error.response.data)}`);
      }
    } else {
      console.log(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Run the video generation
generateAnimatedVideo().catch(console.error);