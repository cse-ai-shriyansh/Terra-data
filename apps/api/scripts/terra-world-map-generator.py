#!/usr/bin/env python3
"""
Terra World Map Generator
Combines Terra satellite tiles into world map visualizations
"""

import os
import sys
from PIL import Image, ImageDraw, ImageFont
import glob
from datetime import datetime
import argparse

def create_world_map_from_terra_tiles(images_dir, output_dir, date=None):
    """
    Create a world map visualization from Terra satellite tiles
    
    Args:
        images_dir: Directory containing Terra tile images
        output_dir: Directory to save world map outputs
        date: Specific date to process (YYYY-MM-DD) or None for all
    """
    
    # Ensure output directory exists
    os.makedirs(output_dir, exist_ok=True)
    
    # Find all Terra image files
    if date:
        pattern = f"*{date}*.jpg"
    else:
        pattern = "*.jpg"
    
    image_files = glob.glob(os.path.join(images_dir, pattern))
    image_files.sort()
    
    if not image_files:
        print(f"No images found matching pattern: {pattern}")
        return
    
    print(f"Found {len(image_files)} Terra images")
    
    # Process images by date
    dates_processed = set()
    
    for img_path in image_files:
        try:
            # Extract date from filename
            filename = os.path.basename(img_path)
            # Format: MODIS_Terra_CorrectedReflectance_TrueColor_2023-10-12_3_4_2.jpg
            parts = filename.split('_')
            img_date = parts[-3]  # Extract date part
            
            if img_date in dates_processed:
                continue
                
            dates_processed.add(img_date)
            
            # Create world map for this date
            create_enhanced_world_map(img_path, output_dir, img_date)
            
        except Exception as e:
            print(f"Error processing {img_path}: {e}")
            continue

def create_enhanced_world_map(tile_path, output_dir, date):
    """
    Create an enhanced world map visualization from a single Terra tile
    """
    try:
        # Load the Terra satellite image
        terra_img = Image.open(tile_path)
        original_width, original_height = terra_img.size
        
        # Create a larger canvas for world map context
        map_width = 1920
        map_height = 1080
        
        # Create base world map canvas
        world_map = Image.new('RGB', (map_width, map_height), color=(25, 25, 112))  # Navy blue
        
        # Calculate tile positioning for global context
        # The tile coordinates (3, 4, 2) represent a specific geographic region
        # Let's position it appropriately on the world map
        
        # Scale the Terra tile to fit nicely in the world map
        tile_scale = 0.6
        scaled_width = int(original_width * tile_scale)
        scaled_height = int(original_height * tile_scale)
        terra_scaled = terra_img.resize((scaled_width, scaled_height), Image.Resampling.LANCZOS)
        
        # Position the tile in the center-right area (representing its geographic location)
        tile_x = map_width // 2 - scaled_width // 2
        tile_y = map_height // 2 - scaled_height // 2
        
        # Paste the Terra tile onto the world map
        world_map.paste(terra_scaled, (tile_x, tile_y))
        
        # Add geographic context visualization
        draw = ImageDraw.Draw(world_map)
        
        # Try to load a font, fallback to default if not available
        try:
            title_font = ImageFont.truetype("arial.ttf", 36)
            subtitle_font = ImageFont.truetype("arial.ttf", 24)
            info_font = ImageFont.truetype("arial.ttf", 18)
        except:
            title_font = ImageFont.load_default()
            subtitle_font = ImageFont.load_default()
            info_font = ImageFont.load_default()
        
        # Add title and information
        title = f"NASA Terra Satellite - World View"
        subtitle = f"Date: {date}"
        
        # Calculate text positions
        title_bbox = draw.textbbox((0, 0), title, font=title_font)
        title_width = title_bbox[2] - title_bbox[0]
        title_x = (map_width - title_width) // 2
        
        subtitle_bbox = draw.textbbox((0, 0), subtitle, font=subtitle_font)
        subtitle_width = subtitle_bbox[2] - subtitle_bbox[0]
        subtitle_x = (map_width - subtitle_width) // 2
        
        # Draw title with shadow effect
        draw.text((title_x + 2, 32), title, font=title_font, fill=(0, 0, 0))
        draw.text((title_x, 30), title, font=title_font, fill=(255, 255, 255))
        
        # Draw subtitle
        draw.text((subtitle_x + 1, 81), subtitle, font=subtitle_font, fill=(0, 0, 0))
        draw.text((subtitle_x, 80), subtitle, font=subtitle_font, fill=(200, 200, 255))
        
        # Add geographic grid lines for context
        grid_color = (100, 100, 150, 128)
        
        # Vertical lines (longitude)
        for i in range(6):
            x = (map_width // 6) * i
            draw.line([(x, 120), (x, map_height - 100)], fill=grid_color, width=1)
        
        # Horizontal lines (latitude)
        for i in range(4):
            y = 120 + ((map_height - 220) // 4) * i
            draw.line([(50, y), (map_width - 50, y)], fill=grid_color, width=1)
        
        # Add coordinate information
        coord_info = "Tile Coordinates: Z:3, X:4, Y:2 (Global Coverage)"
        layer_info = "Layer: MODIS Terra Corrected Reflectance (True Color)"
        resolution_info = "Resolution: 250m per pixel"
        
        info_y = map_height - 90
        draw.text((51, info_y + 1), coord_info, font=info_font, fill=(0, 0, 0))
        draw.text((50, info_y), coord_info, font=info_font, fill=(255, 255, 255))
        
        info_y += 25
        draw.text((51, info_y + 1), layer_info, font=info_font, fill=(0, 0, 0))
        draw.text((50, info_y), layer_info, font=info_font, fill=(200, 255, 200))
        
        info_y += 25
        draw.text((51, info_y + 1), resolution_info, font=info_font, fill=(0, 0, 0))
        draw.text((50, info_y), resolution_info, font=info_font, fill=(200, 200, 255))
        
        # Add border frame
        border_color = (255, 255, 255)
        border_width = 3
        draw.rectangle([0, 0, map_width-1, map_height-1], outline=border_color, width=border_width)
        
        # Save the enhanced world map
        output_filename = f"terra_world_map_{date}.jpg"
        output_path = os.path.join(output_dir, output_filename)
        world_map.save(output_path, "JPEG", quality=95)
        
        print(f"✅ Created world map: {output_filename}")
        
        # Also create a thumbnail version
        thumbnail_size = (800, 450)
        thumbnail = world_map.resize(thumbnail_size, Image.Resampling.LANCZOS)
        thumb_filename = f"terra_world_map_{date}_thumb.jpg"
        thumb_path = os.path.join(output_dir, thumb_filename)
        thumbnail.save(thumb_path, "JPEG", quality=85)
        
        print(f"📎 Created thumbnail: {thumb_filename}")
        
    except Exception as e:
        print(f"❌ Error creating world map for {date}: {e}")

def create_animation_frames(images_dir, output_dir, start_date=None, end_date=None):
    """
    Create animation frames from a sequence of Terra images
    """
    print("🎬 Creating animation frames...")
    
    # Find all image files in date range
    image_files = glob.glob(os.path.join(images_dir, "*.jpg"))
    image_files.sort()
    
    if start_date and end_date:
        filtered_files = []
        for img_path in image_files:
            filename = os.path.basename(img_path)
            parts = filename.split('_')
            img_date = parts[-3]
            if start_date <= img_date <= end_date:
                filtered_files.append(img_path)
        image_files = filtered_files
    
    print(f"Creating animation from {len(image_files)} frames...")
    
    # Create animation directory
    anim_dir = os.path.join(output_dir, "animation_frames")
    os.makedirs(anim_dir, exist_ok=True)
    
    for i, img_path in enumerate(image_files[:30]):  # Limit to first 30 for demo
        filename = os.path.basename(img_path)
        parts = filename.split('_')
        img_date = parts[-3]
        
        create_enhanced_world_map(img_path, anim_dir, f"{img_date}_frame_{i:03d}")

def main():
    parser = argparse.ArgumentParser(description="Generate world maps from Terra satellite images")
    parser.add_argument("--input", "-i", required=True, help="Input directory with Terra images")
    parser.add_argument("--output", "-o", required=True, help="Output directory for world maps")
    parser.add_argument("--date", "-d", help="Specific date to process (YYYY-MM-DD)")
    parser.add_argument("--animation", "-a", action="store_true", help="Create animation frames")
    parser.add_argument("--start-date", help="Start date for animation (YYYY-MM-DD)")
    parser.add_argument("--end-date", help="End date for animation (YYYY-MM-DD)")
    
    args = parser.parse_args()
    
    if not os.path.exists(args.input):
        print(f"❌ Input directory does not exist: {args.input}")
        return 1
    
    print(f"🛰️ Terra World Map Generator")
    print(f"📂 Input: {args.input}")
    print(f"💾 Output: {args.output}")
    
    if args.animation:
        create_animation_frames(args.input, args.output, args.start_date, args.end_date)
    else:
        create_world_map_from_terra_tiles(args.input, args.output, args.date)
    
    print("✅ World map generation complete!")
    return 0

if __name__ == "__main__":
    sys.exit(main())