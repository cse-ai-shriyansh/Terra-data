#!/usr/bin/env python3
"""
Terra25 Animation System Demo
Complete demonstration of time-lapse satellite animation capabilities
"""

import os
import json
import requests
import time
from datetime import datetime, timedelta

class Terra25AnimationDemo:
    def __init__(self, api_base="http://localhost:3005"):
        self.api_base = api_base
        self.session = requests.Session()
        
    def create_animation(self, layer, start_date, end_date, bbox=None):
        """Create a new animation job"""
        if bbox is None:
            bbox = [-180, -85, 180, 85]  # Global coverage
            
        payload = {
            "layer": layer,
            "startDate": start_date,
            "endDate": end_date,
            "bbox": bbox
        }
        
        print(f"🎬 Creating animation: {layer}")
        print(f"📅 Date range: {start_date} to {end_date}")
        print(f"🌍 Coverage: {bbox}")
        
        response = self.session.post(
            f"{self.api_base}/api/animation/generate",
            json=payload
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Animation job created: {data['jobId']}")
            return data['jobId']
        else:
            print(f"❌ Failed to create animation: {response.status_code}")
            return None
    
    def monitor_progress(self, job_id, max_wait=300):
        """Monitor animation generation progress"""
        print(f"⏳ Monitoring progress for job: {job_id}")
        start_time = time.time()
        
        while time.time() - start_time < max_wait:
            response = self.session.get(f"{self.api_base}/api/animation/{job_id}")
            
            if response.status_code == 200:
                data = response.json()
                status = data.get('status', 'unknown')
                progress = data.get('progress', 0)
                
                print(f"📊 Status: {status} | Progress: {progress:.1f}%")
                
                if status == 'completed':
                    print(f"🎉 Animation generation completed!")
                    return True
                elif status == 'failed':
                    print(f"💥 Animation generation failed: {data.get('error', 'Unknown error')}")
                    return False
                    
            time.sleep(5)  # Check every 5 seconds
            
        print("⏰ Timeout waiting for animation completion")
        return False
    
    def export_video(self, job_id, format="mp4", fps=2, quality="medium"):
        """Export animation as video"""
        payload = {
            "format": format,
            "fps": fps,
            "quality": quality,
            "width": 800
        }
        
        print(f"🎥 Exporting video: {format.upper()}")
        
        response = self.session.post(
            f"{self.api_base}/api/animation/export-video/{job_id}",
            json=payload
        )
        
        if response.status_code == 200:
            data = response.json()
            export_id = data['exportId']
            print(f"✅ Video export started: {export_id}")
            return export_id
        else:
            print(f"❌ Failed to start video export: {response.status_code}")
            return None
    
    def download_frames(self, job_id, output_path="animation_frames.zip"):
        """Download animation frames as ZIP"""
        print(f"📦 Downloading frames archive...")
        
        response = self.session.get(
            f"{self.api_base}/api/animation/download-frames/{job_id}",
            stream=True
        )
        
        if response.status_code == 200:
            with open(output_path, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
            print(f"✅ Frames downloaded: {output_path}")
            return True
        else:
            print(f"❌ Failed to download frames: {response.status_code}")
            return False

def main():
    """Main demonstration function"""
    print("🌍 Terra25 Animation System - Complete Demo")
    print("=" * 50)
    
    demo = Terra25AnimationDemo()
    
    # Demo parameters
    layer = "MODIS_Terra_CorrectedReflectance_TrueColor"
    start_date = "2024-09-30"
    end_date = "2024-10-03"
    
    # 1. Create animation
    job_id = demo.create_animation(layer, start_date, end_date)
    if not job_id:
        return
    
    # 2. Monitor progress
    if not demo.monitor_progress(job_id):
        return
    
    # 3. Export video
    export_id = demo.export_video(job_id, format="mp4", fps=2)
    
    # 4. Download frames
    demo.download_frames(job_id)
    
    print("\n🎊 Demo completed successfully!")
    print(f"📋 Job ID: {job_id}")
    print(f"🎬 Export ID: {export_id}")
    print(f"🌐 Web Interface: http://localhost:3003/animation")
    print(f"🔗 API Docs: http://localhost:3005/api/animation/{job_id}")

if __name__ == "__main__":
    main()