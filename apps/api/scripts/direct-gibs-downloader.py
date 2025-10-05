#!/usr/bin/env python3
"""
Direct GIBS Image Downloader
Downloads high-quality images directly from NASA GIBS WMTS service
"""

import os
import sys
import requests
from PIL import Image
from datetime import datetime
import argparse

class DirectGIBSDownloader:
    def __init__(self):
        self.base_url = "https://gibs.earthdata.nasa.gov/wmts/epsg4326/best"
        
        self.layers = {
            "terra_true_color": {
                "id": "MODIS_Terra_CorrectedReflectance_TrueColor",
                "resolution": "250m",
                "format": "jpg"
            },
            "terra_false_color": {
                "id": "MODIS_Terra_CorrectedReflectance_Bands367", 
                "resolution": "250m",
                "format": "jpg"
            },
            "terra_bands721": {
                "id": "MODIS_Terra_CorrectedReflectance_Bands721",
                "resolution": "250m", 
                "format": "jpg"
            },
            "aqua_true_color": {
                "id": "MODIS_Aqua_CorrectedReflectance_TrueColor",
                "resolution": "250m",
                "format": "jpg"
            },
            "viirs_true_color": {
                "id": "VIIRS_SNPP_CorrectedReflectance_TrueColor",
                "resolution": "250m",
                "format": "jpg"
            }
        }
    
    def download_single_tile(self, layer_key, date, z, x, y, output_path):
        """Download a single WMTS tile"""
        if layer_key not in self.layers:
            raise ValueError(f"Unknown layer: {layer_key}")
        
        layer_info = self.layers[layer_key]
        layer_id = layer_info["id"]
        resolution = layer_info["resolution"]
        format_ext = layer_info["format"]
        
        url = f"{self.base_url}/{layer_id}/default/{date}/{resolution}/{z}/{y}/{x}.{format_ext}"
        
        print(f"Downloading: {url}")
        
        try:
            response = requests.get(url, timeout=30)
            if response.status_code == 200:
                with open(output_path, 'wb') as f:
                    f.write(response.content)
                print(f"Successfully downloaded: {output_path}")
                return True
            else:
                print(f"Download failed: HTTP {response.status_code}")
                return False
        except Exception as e:
            print(f"Error downloading: {e}")
            return False
    
    def download_region_grid(self, layer_key, date, zoom_level, x_min, x_max, y_min, y_max, output_dir):
        """Download a grid of tiles for a region"""
        if layer_key not in self.layers:
            raise ValueError(f"Unknown layer: {layer_key}")
        
        os.makedirs(output_dir, exist_ok=True)
        
        successful = 0
        failed = 0
        
        for x in range(x_min, x_max + 1):
            for y in range(y_min, y_max + 1):
                tile_filename = f"{layer_key}_{date}_z{zoom_level}_x{x}_y{y}.{self.layers[layer_key]['format']}"
                tile_path = os.path.join(output_dir, tile_filename)
                
                if self.download_single_tile(layer_key, date, zoom_level, x, y, tile_path):
                    successful += 1
                else:
                    failed += 1
        
        print(f"Region download complete: {successful} successful, {failed} failed")
        return successful, failed
    
    def download_global_coverage(self, layer_key, date, zoom_level, output_dir):
        """Download global coverage at specified zoom level"""
        max_tile = 2 ** zoom_level
        return self.download_region_grid(
            layer_key, date, zoom_level, 
            0, max_tile - 1, 0, max_tile - 1, 
            output_dir
        )
    
    def create_composite_image(self, layer_key, date, zoom_level, tile_dir, output_path, target_width=3840, target_height=2160):
        """Create a composite image from downloaded tiles"""
        layer_info = self.layers[layer_key]
        format_ext = layer_info["format"]
        
        # Find all tiles in directory
        tiles = []
        for filename in os.listdir(tile_dir):
            if filename.startswith(f"{layer_key}_{date}_z{zoom_level}") and filename.endswith(f".{format_ext}"):
                # Extract x, y from filename
                parts = filename.replace(f".{format_ext}", "").split("_")
                for i, part in enumerate(parts):
                    if part.startswith("x"):
                        x = int(part[1:])
                        y = int(parts[i+1][1:])
                        tiles.append((x, y, os.path.join(tile_dir, filename)))
                        break
        
        if not tiles:
            print("No tiles found for composite")
            return False
        
        print(f"Creating composite from {len(tiles)} tiles")
        
        # Calculate grid dimensions
        max_tile = 2 ** zoom_level
        tile_size = 256
        
        # Create composite image
        composite_width = max_tile * tile_size
        composite_height = max_tile * tile_size
        
        print(f"Composite size: {composite_width}x{composite_height}")
        
        composite = Image.new('RGB', (composite_width, composite_height), (0, 0, 50))
        
        # Place tiles
        tiles_placed = 0
        for x, y, tile_path in tiles:
            try:
                tile_img = Image.open(tile_path)
                composite.paste(tile_img, (x * tile_size, y * tile_size))
                tiles_placed += 1
            except Exception as e:
                print(f"Error placing tile {x},{y}: {e}")
        
        print(f"Placed {tiles_placed} tiles")
        
        # Resize to target dimensions
        if target_width and target_height:
            composite = composite.resize((target_width, target_height), Image.Resampling.LANCZOS)
            print(f"Resized to {target_width}x{target_height}")
        
        # Save composite
        composite.save(output_path, quality=95)
        print(f"Saved composite: {output_path}")
        
        return True
    
    def download_and_composite(self, layer_key, date, zoom_level, output_path, target_width=3840, target_height=2160):
        """Download tiles and create composite in one operation"""
        # Create temp directory for tiles
        temp_dir = f"temp_tiles_{layer_key}_{date}_{zoom_level}"
        
        try:
            # Download tiles
            print(f"Downloading {layer_key} tiles for {date} at zoom {zoom_level}")
            successful, failed = self.download_global_coverage(layer_key, date, zoom_level, temp_dir)
            
            if successful == 0:
                print("No tiles downloaded successfully")
                return False
            
            # Create composite
            return self.create_composite_image(layer_key, date, zoom_level, temp_dir, output_path, target_width, target_height)
            
        finally:
            # Clean up temp files (optional)
            import shutil
            try:
                if os.path.exists(temp_dir):
                    shutil.rmtree(temp_dir)
                    print(f"Cleaned up temporary directory: {temp_dir}")
            except:
                pass


def main():
    parser = argparse.ArgumentParser(description="Download images directly from NASA GIBS")
    parser.add_argument("--layer", "-l", required=True, help="Layer key")
    parser.add_argument("--date", "-d", required=True, help="Date (YYYY-MM-DD)")
    parser.add_argument("--output", "-o", required=True, help="Output image path")
    parser.add_argument("--zoom", "-z", type=int, default=2, help="Zoom level (0-5)")
    parser.add_argument("--width", "-w", type=int, default=3840, help="Target width")
    parser.add_argument("--height", type=int, default=2160, help="Target height")
    parser.add_argument("--list-layers", action="store_true", help="List available layers")
    
    args = parser.parse_args()
    
    downloader = DirectGIBSDownloader()
    
    if args.list_layers:
        print("Available Layers:")
        print("================")
        for key, info in downloader.layers.items():
            print(f"{key:20} | {info['id']}")
        return 0
    
    print(f"NASA GIBS Direct Downloader")
    print(f"Layer: {args.layer}")
    print(f"Date: {args.date}")
    print(f"Zoom: {args.zoom}")
    print(f"Output: {args.output}")
    print(f"Target size: {args.width}x{args.height}")
    print()
    
    success = downloader.download_and_composite(
        args.layer, args.date, args.zoom, args.output, args.width, args.height
    )
    
    if success:
        print("Download and composite completed successfully!")
        return 0
    else:
        print("Download and composite failed!")
        return 1


if __name__ == "__main__":
    sys.exit(main())