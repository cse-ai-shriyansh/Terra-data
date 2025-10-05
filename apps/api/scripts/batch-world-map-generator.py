#!/usr/bin/env python3
"""
Batch Terra Complete World Map Generator
Generates complete world maps from downloaded Terra satellite data
"""

import os
import sys
import subprocess
from datetime import datetime, timedelta
import argparse

def find_downloaded_dates(terra_downloads_dir):
    """Find all dates with downloaded Terra data"""
    dates = set()
    
    if not os.path.exists(terra_downloads_dir):
        print(f"❌ Terra downloads directory not found: {terra_downloads_dir}")
        return []
    
    # Scan through all subdirectories for image files
    for root, dirs, files in os.walk(terra_downloads_dir):
        for file in files:
            if file.endswith('.jpg') or file.endswith('.jpeg'):
                # Extract date from filename like: MODIS_Terra_CorrectedReflectance_TrueColor_2023-01-01.jpg
                parts = file.split('_')
                for part in parts:
                    if len(part) == 10 and part.count('-') == 2:
                        try:
                            datetime.strptime(part, '%Y-%m-%d')
                            dates.add(part)
                        except ValueError:
                            continue
    
    return sorted(list(dates))

def generate_world_map_for_date(date, output_dir, zoom_level=2):
    """Generate a world map for a specific date"""
    script_path = os.path.join(os.path.dirname(__file__), 'complete-world-map-generator.py')
    
    cmd = [
        sys.executable,
        script_path,
        '--date', date,
        '--output', output_dir,
        '--zoom', str(zoom_level)
    ]
    
    print(f"🌍 Generating world map for {date}...")
    
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
        
        if result.returncode == 0:
            print(f"✅ Successfully generated world map for {date}")
            return True
        else:
            print(f"❌ Failed to generate world map for {date}")
            print(f"Error: {result.stderr}")
            return False
            
    except subprocess.TimeoutExpired:
        print(f"⏰ Timeout generating world map for {date}")
        return False
    except Exception as e:
        print(f"❌ Error generating world map for {date}: {e}")
        return False

def main():
    parser = argparse.ArgumentParser(description="Batch generate Terra complete world maps")
    parser.add_argument("--downloads", "-d", required=True, help="Terra downloads directory")
    parser.add_argument("--output", "-o", required=True, help="Output directory for world maps")
    parser.add_argument("--zoom", "-z", type=int, default=2, help="Zoom level (2-4, default: 2)")
    parser.add_argument("--limit", "-l", type=int, help="Limit number of maps to generate")
    parser.add_argument("--start-date", help="Start date (YYYY-MM-DD)")
    parser.add_argument("--end-date", help="End date (YYYY-MM-DD)")
    
    args = parser.parse_args()
    
    print(f"🛰️ Terra Batch World Map Generator")
    print(f"📂 Downloads: {args.downloads}")
    print(f"📂 Output: {args.output}")
    print(f"🔍 Zoom: {args.zoom}")
    print()
    
    # Find all available dates
    print("🔍 Scanning for downloaded Terra data...")
    available_dates = find_downloaded_dates(args.downloads)
    
    if not available_dates:
        print("❌ No Terra data found in downloads directory")
        return 1
    
    print(f"📊 Found {len(available_dates)} dates with Terra data")
    print(f"📅 Date range: {available_dates[0]} to {available_dates[-1]}")
    
    # Filter dates by range if specified
    dates_to_process = available_dates
    
    if args.start_date:
        dates_to_process = [d for d in dates_to_process if d >= args.start_date]
    
    if args.end_date:
        dates_to_process = [d for d in dates_to_process if d <= args.end_date]
    
    # Limit number of dates if specified
    if args.limit:
        dates_to_process = dates_to_process[:args.limit]
    
    print(f"🎯 Processing {len(dates_to_process)} dates")
    print()
    
    # Create output directory
    os.makedirs(args.output, exist_ok=True)
    
    # Generate world maps
    successful = 0
    failed = 0
    
    for i, date in enumerate(dates_to_process, 1):
        print(f"[{i}/{len(dates_to_process)}] Processing {date}")
        
        # Check if world map already exists
        expected_filename = f"terra_complete_world_map_{date}_z{args.zoom}.jpg"
        expected_path = os.path.join(args.output, expected_filename)
        
        if os.path.exists(expected_path):
            print(f"⚡ World map already exists for {date}, skipping")
            successful += 1
            continue
        
        # Generate world map
        if generate_world_map_for_date(date, args.output, args.zoom):
            successful += 1
        else:
            failed += 1
        
        print(f"📊 Progress: {successful} successful, {failed} failed")
        print()
    
    print("🎉 Batch world map generation complete!")
    print(f"✅ Successfully generated: {successful} world maps")
    print(f"❌ Failed to generate: {failed} world maps")
    print(f"📊 Success rate: {(successful / len(dates_to_process) * 100):.1f}%")
    
    return 0 if failed == 0 else 1

if __name__ == "__main__":
    sys.exit(main())