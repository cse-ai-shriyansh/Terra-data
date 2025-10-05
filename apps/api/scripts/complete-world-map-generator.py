#!/usr/bin/env python3
"""
Complete Terra World Map Generator
Downloads and combines multiple Terra satellite tiles to create complete world maps
"""

import os
import sys
import requests
from PIL import Image, ImageDraw, ImageFont
import math
from datetime import datetime, timedelta
import argparse
from concurrent.futures import ThreadPoolExecutor, as_completed
import time

class TerraWorldMapGenerator:
    def __init__(self):
        self.base_url = "https://gibs.earthdata.nasa.gov/wmts/epsg4326/best"
        self.default_layer = "MODIS_Terra_CorrectedReflectance_TrueColor"
        self.default_resolution = "250m"
        self.tile_size = 256  # Standard WMTS tile size
        
    def calculate_world_tiles(self, zoom_level=4):
        """
        Calculate all tile coordinates needed for global coverage at given zoom level
        """
        tiles = []
        max_tile = 2 ** zoom_level
        
        # For global coverage, we need tiles from:
        # X: 0 to max_tile-1 (longitude coverage)
        # Y: 0 to max_tile-1 (latitude coverage)
        
        for x in range(max_tile):
            for y in range(max_tile):
                tiles.append((zoom_level, x, y))
        
        return tiles
    
    def get_terra_tile_url(self, date, z, x, y, layer=None, resolution=None):
        """Generate Terra tile URL"""
        layer = layer or self.default_layer
        resolution = resolution or self.default_resolution
        return f"{self.base_url}/{layer}/default/{date}/{resolution}/{z}/{y}/{x}.jpg"
    
    def download_tile(self, date, z, x, y, output_dir, layer=None):
        """Download a single Terra tile"""
        try:
            url = self.get_terra_tile_url(date, z, x, y, layer)
            
            # Create tile filename
            tile_filename = f"tile_{z}_{x}_{y}.jpg"
            tile_path = os.path.join(output_dir, tile_filename)
            
            # Skip if already downloaded
            if os.path.exists(tile_path):
                return tile_path, True
            
            response = requests.get(url, timeout=30)
            if response.status_code == 200:
                with open(tile_path, 'wb') as f:
                    f.write(response.content)
                return tile_path, True
            else:
                print(f" Failed to download tile {z}/{x}/{y}: HTTP {response.status_code}")
                return None, False
                
        except Exception as e:
            print(f" Error downloading tile {z}/{x}/{y}: {e}")
            return None, False
    
    def download_all_tiles(self, date, zoom_level, output_dir, layer=None, max_workers=8):
        """Download all tiles needed for world map"""
        print(f" Downloading world tiles for {date} at zoom level {zoom_level}")
        
        # Calculate all required tiles
        tiles = self.calculate_world_tiles(zoom_level)
        print(f" Total tiles needed: {len(tiles)}")
        
        # Create output directory
        os.makedirs(output_dir, exist_ok=True)
        
        successful_tiles = []
        failed_count = 0
        
        # Download tiles concurrently
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            # Submit all download tasks
            future_to_tile = {
                executor.submit(self.download_tile, date, z, x, y, output_dir, layer): (z, x, y)
                for z, x, y in tiles
            }
            
            # Process completed downloads
            for i, future in enumerate(as_completed(future_to_tile)):
                z, x, y = future_to_tile[future]
                try:
                    tile_path, success = future.result()
                    if success and tile_path:
                        successful_tiles.append((z, x, y, tile_path))
                    else:
                        failed_count += 1
                    
                    # Progress update
                    if (i + 1) % 10 == 0:
                        progress = ((i + 1) / len(tiles)) * 100
                        print(f" Progress: {progress:.1f}% ({i + 1}/{len(tiles)} tiles)")
                        
                except Exception as e:
                    print(f" Error processing tile {z}/{x}/{y}: {e}")
                    failed_count += 1
        
        print(f" Downloaded {len(successful_tiles)} tiles successfully")
        print(f" Failed to download {failed_count} tiles")
        
        return successful_tiles
    
    def stitch_world_map(self, successful_tiles, zoom_level, output_path, date):
        """Stitch downloaded tiles into a complete world map"""
        print(f" Stitching {len(successful_tiles)} tiles into world map...")
        
        if not successful_tiles:
            print(" No tiles to stitch!")
            return False
        
        # Calculate world map dimensions
        max_tile = 2 ** zoom_level
        world_width = max_tile * self.tile_size
        world_height = max_tile * self.tile_size
        
        print(f" World map size: {world_width}x{world_height} pixels")
        
        # Create world map canvas
        world_map = Image.new('RGB', (world_width, world_height), color=(0, 0, 50))  # Dark blue background
        
        # Place each tile in the correct position
        tiles_placed = 0
        for z, x, y, tile_path in successful_tiles:
            try:
                # Load tile image
                tile_img = Image.open(tile_path)
                
                # Calculate position on world map
                tile_x = x * self.tile_size
                tile_y = y * self.tile_size
                
                # Paste tile onto world map
                world_map.paste(tile_img, (tile_x, tile_y))
                tiles_placed += 1
                
                if tiles_placed % 20 == 0:
                    progress = (tiles_placed / len(successful_tiles)) * 100
                    print(f" Stitching progress: {progress:.1f}% ({tiles_placed}/{len(successful_tiles)} tiles)")
                
            except Exception as e:
                print(f" Error placing tile {z}/{x}/{y}: {e}")
                continue
        
        print(f" Placed {tiles_placed} tiles successfully")
        
        # Add title and metadata
        self.add_world_map_overlay(world_map, date, zoom_level, tiles_placed)
        
        # Resize for practical viewing (optional)
        if world_width > 4000:  # If too large, create a smaller version
            print(" Creating web-friendly version...")
            display_width = 3840  # 4K width
            display_height = int(world_height * (display_width / world_width))
            world_map_display = world_map.resize((display_width, display_height), Image.Resampling.LANCZOS)
            
            # Save both versions
            display_path = output_path.replace('.jpg', '_display.jpg')
            world_map_display.save(display_path, "JPEG", quality=90)
            print(f" Saved display version: {display_path}")
        
        # Save full resolution world map
        world_map.save(output_path, "JPEG", quality=95)
        print(f" Saved world map: {output_path}")
        
        return True
    
    def add_world_map_overlay(self, world_map, date, zoom_level, tiles_count):
        """Add title and metadata overlay to world map"""
        draw = ImageDraw.Draw(world_map)
        
        # Try to load fonts
        try:
            title_font = ImageFont.truetype("arial.ttf", 72)
            subtitle_font = ImageFont.truetype("arial.ttf", 48)
            info_font = ImageFont.truetype("arial.ttf", 36)
        except:
            title_font = ImageFont.load_default()
            subtitle_font = ImageFont.load_default()
            info_font = ImageFont.load_default()
        
        # Add semi-transparent overlay for text
        overlay = Image.new('RGBA', world_map.size, (0, 0, 0, 0))
        overlay_draw = ImageDraw.Draw(overlay)
        
        # Draw header background
        header_height = 150
        overlay_draw.rectangle([0, 0, world_map.width, header_height], fill=(0, 0, 0, 180))
        
        # Add title text
        title = f"NASA Terra Satellite - Complete World Map"
        subtitle = f"Date: {date} | Zoom Level: {zoom_level} | Tiles: {tiles_count}"
        
        # Calculate text positions
        title_bbox = draw.textbbox((0, 0), title, font=title_font)
        title_width = title_bbox[2] - title_bbox[0]
        title_x = (world_map.width - title_width) // 2
        
        subtitle_bbox = draw.textbbox((0, 0), subtitle, font=subtitle_font)
        subtitle_width = subtitle_bbox[2] - subtitle_bbox[0]
        subtitle_x = (world_map.width - subtitle_width) // 2
        
        # Composite overlay
        world_map = Image.alpha_composite(world_map.convert('RGBA'), overlay).convert('RGB')
        draw = ImageDraw.Draw(world_map)
        
        # Draw text with shadow
        draw.text((title_x + 3, 33), title, font=title_font, fill=(0, 0, 0))
        draw.text((title_x, 30), title, font=title_font, fill=(255, 255, 255))
        
        draw.text((subtitle_x + 2, 92), subtitle, font=subtitle_font, fill=(0, 0, 0))
        draw.text((subtitle_x, 90), subtitle, font=subtitle_font, fill=(200, 200, 255))
        
        # Add coordinate grid lines (optional)
        self.add_coordinate_grid(draw, world_map.width, world_map.height)
    
    def add_coordinate_grid(self, draw, width, height):
        """Add coordinate grid lines to world map"""
        grid_color = (100, 100, 150, 100)
        
        # Add longitude lines
        for i in range(1, 8):
            x = (width // 8) * i
            draw.line([(x, 150), (x, height - 50)], fill=grid_color, width=2)
        
        # Add latitude lines
        for i in range(1, 4):
            y = 150 + ((height - 200) // 4) * i
            draw.line([(50, y), (width - 50, y)], fill=grid_color, width=2)
    
    def generate_complete_world_map(self, date, output_dir, zoom_level=4, layer=None):
        """Generate a complete world map for the given date"""
        print(f" Generating complete world map for {date}")
        print(f" Zoom level: {zoom_level} ({2**zoom_level}x{2**zoom_level} = {(2**zoom_level)**2} tiles)")
        
        # Create temporary tiles directory
        tiles_dir = os.path.join(output_dir, f"temp_tiles_{date}")
        os.makedirs(tiles_dir, exist_ok=True)
        
        try:
            # Download all tiles
            successful_tiles = self.download_all_tiles(
                date, zoom_level, tiles_dir, layer
            )
            
            if not successful_tiles:
                print(" No tiles downloaded successfully")
                return False
            
            # Create output filename
            output_filename = f"terra_complete_world_map_{date}_z{zoom_level}.jpg"
            output_path = os.path.join(output_dir, output_filename)
            
            # Stitch tiles into world map
            success = self.stitch_world_map(successful_tiles, zoom_level, output_path, date)
            
            return success
            
        except Exception as e:
            print(f" Error generating world map: {e}")
            return False
        
        finally:
            # Cleanup temporary tiles (optional - comment out to keep tiles)
            print(" Cleaning up temporary tiles...")
            import shutil
            try:
                shutil.rmtree(tiles_dir)
            except:
                pass

def main():
    parser = argparse.ArgumentParser(description="Generate complete Terra world maps")
    parser.add_argument("--date", "-d", required=True, help="Date in YYYY-MM-DD format")
    parser.add_argument("--output", "-o", required=True, help="Output directory")
    parser.add_argument("--zoom", "-z", type=int, default=3, help="Zoom level (2-5, default: 3)")
    parser.add_argument("--layer", "-l", help="Terra layer name")
    
    args = parser.parse_args()
    
    if args.zoom < 2 or args.zoom > 5:
        print("ERROR: Zoom level must be between 2 and 5")
        return 1
    
    generator = TerraWorldMapGenerator()
    
    print(f"Terra Complete World Map Generator")
    print(f"Date: {args.date}")
    print(f"Output: {args.output}")
    print(f"Zoom: {args.zoom}")
    print(f"Layer: {args.layer or 'Default (True Color)'}")
    
    success = generator.generate_complete_world_map(
        args.date, args.output, args.zoom, args.layer
    )
    
    if success:
        print("SUCCESS: Complete world map generation finished!")
        return 0
    else:
        print("ERROR: World map generation failed!")
        return 1

if __name__ == "__main__":
    sys.exit(main())