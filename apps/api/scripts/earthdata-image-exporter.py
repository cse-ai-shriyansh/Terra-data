#!/usr/bin/env python3
"""
NASA Earthdata API Image Exporter
Export satellite images directly from NASA Earthdata services
Supports GIBS WMTS, WMS, and other NASA imaging services
"""

import os
import sys
import requests
import json
from PIL import Image, ImageDraw, ImageFont
from datetime import datetime, timedelta
import argparse
from urllib.parse import urlencode
import time
from concurrent.futures import ThreadPoolExecutor, as_completed

class EarthdataImageExporter:
    def __init__(self):
        self.gibs_wmts_base = "https://gibs.earthdata.nasa.gov/wmts/epsg4326/best"
        self.gibs_wms_base = "https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi"
        self.worldview_api = "https://worldview.earthdata.nasa.gov/api/v1"
        
        # Available layers with their metadata
        self.layers = {
            "terra_true_color": {
                "id": "MODIS_Terra_CorrectedReflectance_TrueColor",
                "name": "Terra True Color",
                "resolution": "250m",
                "format": "jpg"
            },
            "terra_false_color": {
                "id": "MODIS_Terra_CorrectedReflectance_Bands367",
                "name": "Terra False Color (3-6-7)",
                "resolution": "250m",
                "format": "jpg"
            },
            "terra_bands721": {
                "id": "MODIS_Terra_CorrectedReflectance_Bands721",
                "name": "Terra Bands 7-2-1",
                "resolution": "250m",
                "format": "jpg"
            },
            "terra_aerosol": {
                "id": "MODIS_Terra_Aerosol",
                "name": "Terra Aerosol Optical Depth",
                "resolution": "1km",
                "format": "png"
            },
            "terra_lst": {
                "id": "MODIS_Terra_Land_Surface_Temp_Day",
                "name": "Terra Land Surface Temperature (Day)",
                "resolution": "1km",
                "format": "png"
            },
            "terra_snow": {
                "id": "MODIS_Terra_Snow_Cover",
                "name": "Terra Snow Cover",
                "resolution": "500m",
                "format": "png"
            },
            "aqua_true_color": {
                "id": "MODIS_Aqua_CorrectedReflectance_TrueColor",
                "name": "Aqua True Color",
                "resolution": "250m",
                "format": "jpg"
            },
            "viirs_true_color": {
                "id": "VIIRS_SNPP_CorrectedReflectance_TrueColor",
                "name": "VIIRS True Color",
                "resolution": "250m",
                "format": "jpg"
            }
        }
    
    def export_wmts_image(self, layer_key, date, bbox, width, height, output_path):
        """
        Export image using WMTS (Web Map Tile Service)
        bbox: [min_lon, min_lat, max_lon, max_lat]
        """
        if layer_key not in self.layers:
            raise ValueError(f"Unknown layer: {layer_key}")
        
        layer_info = self.layers[layer_key]
        layer_id = layer_info["id"]
        resolution = layer_info["resolution"]
        
        print(f"Exporting {layer_info['name']} for {date}")
        print(f"Bounding box: {bbox}")
        print(f"Size: {width}x{height}")
        
        # Calculate zoom level based on desired resolution
        zoom_level = self.calculate_optimal_zoom(bbox, width, height)
        
        # Get all tiles needed for the bounding box
        tiles = self.get_tiles_for_bbox(bbox, zoom_level)
        
        # Download tiles
        tile_images = []
        for tile_x, tile_y in tiles:
            tile_url = f"{self.gibs_wmts_base}/{layer_id}/default/{date}/{resolution}/{zoom_level}/{tile_y}/{tile_x}.{layer_info['format']}"
            
            try:
                response = requests.get(tile_url, timeout=30)
                if response.status_code == 200:
                    tile_img = Image.open(BytesIO(response.content))
                    tile_images.append((tile_x, tile_y, tile_img))
                    print(f"Downloaded tile {tile_x}/{tile_y}")
                else:
                    print(f"Failed to download tile {tile_x}/{tile_y}: HTTP {response.status_code}")
            except Exception as e:
                print(f"Error downloading tile {tile_x}/{tile_y}: {e}")
        
        # Stitch tiles together
        if tile_images:
            result_image = self.stitch_tiles(tile_images, bbox, width, height, zoom_level)
            result_image.save(output_path, quality=95)
            print(f"Saved image: {output_path}")
            return True
        else:
            print("No tiles downloaded successfully")
            return False
    
    def export_wms_image(self, layer_key, date, bbox, width, height, output_path):
        """
        Export image using WMS (Web Map Service) - single request for entire image
        bbox: [min_lon, min_lat, max_lon, max_lat]
        """
        if layer_key not in self.layers:
            raise ValueError(f"Unknown layer: {layer_key}")
        
        layer_info = self.layers[layer_key]
        layer_id = layer_info["id"]
        
        print(f"Exporting {layer_info['name']} via WMS for {date}")
        print(f"Bounding box: {bbox}")
        print(f"Size: {width}x{height}")
        
        # Build WMS request parameters
        params = {
            'SERVICE': 'WMS',
            'VERSION': '1.3.0',
            'REQUEST': 'GetMap',
            'FORMAT': f"image/{layer_info['format']}",
            'TRANSPARENT': 'true',
            'LAYERS': layer_id,
            'CRS': 'EPSG:4326',
            'STYLES': '',
            'WIDTH': width,
            'HEIGHT': height,
            'BBOX': f"{bbox[1]},{bbox[0]},{bbox[3]},{bbox[2]}",  # WMS 1.3.0 uses lat,lon order
            'TIME': date
        }
        
        url = f"{self.gibs_wms_base}?{urlencode(params)}"
        print(f"WMS URL: {url}")
        
        try:
            response = requests.get(url, timeout=60)
            if response.status_code == 200:
                with open(output_path, 'wb') as f:
                    f.write(response.content)
                print(f"Successfully exported image: {output_path}")
                return True
            else:
                print(f"WMS request failed: HTTP {response.status_code}")
                print(f"Response: {response.text}")
                return False
        except Exception as e:
            print(f"Error making WMS request: {e}")
            return False
    
    def export_worldview_snapshot(self, layer_key, date, bbox, width, height, output_path):
        """
        Export image using NASA Worldview snapshot API
        """
        if layer_key not in self.layers:
            raise ValueError(f"Unknown layer: {layer_key}")
        
        layer_info = self.layers[layer_key]
        layer_id = layer_info["id"]
        
        print(f"Exporting {layer_info['name']} via Worldview API for {date}")
        
        # Worldview snapshot parameters
        params = {
            'REQUEST': 'GetSnapshot',
            'TIME': date,
            'BBOX': f"{bbox[0]},{bbox[1]},{bbox[2]},{bbox[3]}",
            'CRS': 'EPSG:4326',
            'LAYERS': layer_id,
            'WRAP': 'day',
            'FORMAT': f"image/{layer_info['format']}",
            'WIDTH': width,
            'HEIGHT': height,
            'AUTOSCALE': 'TRUE'
        }
        
        url = f"{self.worldview_api}/snapshot?{urlencode(params)}"
        
        try:
            response = requests.get(url, timeout=120)
            if response.status_code == 200:
                with open(output_path, 'wb') as f:
                    f.write(response.content)
                print(f"Successfully exported Worldview snapshot: {output_path}")
                return True
            else:
                print(f"Worldview request failed: HTTP {response.status_code}")
                return False
        except Exception as e:
            print(f"Error making Worldview request: {e}")
            return False
    
    def export_region_image(self, layer_key, date, region, width, height, output_path, method="wms"):
        """
        Export image for a predefined region
        """
        regions = {
            "global": [-180, -90, 180, 90],
            "north_america": [-140, 20, -50, 70],
            "europe": [-15, 35, 40, 70],
            "asia": [60, 10, 150, 55],
            "africa": [-20, -35, 55, 35],
            "south_america": [-85, -55, -35, 15],
            "australia": [110, -45, 155, -10],
            "arctic": [-180, 60, 180, 90],
            "antarctic": [-180, -90, 180, -60]
        }
        
        if region not in regions:
            raise ValueError(f"Unknown region: {region}. Available: {list(regions.keys())}")
        
        bbox = regions[region]
        
        if method == "wms":
            return self.export_wms_image(layer_key, date, bbox, width, height, output_path)
        elif method == "wmts":
            return self.export_wmts_image(layer_key, date, bbox, width, height, output_path)
        elif method == "worldview":
            return self.export_worldview_snapshot(layer_key, date, bbox, width, height, output_path)
        else:
            raise ValueError(f"Unknown method: {method}")
    
    def export_time_series(self, layer_key, start_date, end_date, region, width, height, output_dir, method="wms"):
        """
        Export a time series of images
        """
        start = datetime.strptime(start_date, '%Y-%m-%d')
        end = datetime.strptime(end_date, '%Y-%m-%d')
        
        os.makedirs(output_dir, exist_ok=True)
        
        current = start
        successful = 0
        failed = 0
        
        while current <= end:
            date_str = current.strftime('%Y-%m-%d')
            output_filename = f"{layer_key}_{region}_{date_str}.jpg"
            output_path = os.path.join(output_dir, output_filename)
            
            print(f"Exporting {date_str}...")
            
            if self.export_region_image(layer_key, date_str, region, width, height, output_path, method):
                successful += 1
            else:
                failed += 1
            
            current += timedelta(days=1)
        
        print(f"Time series export complete: {successful} successful, {failed} failed")
        return successful, failed
    
    def calculate_optimal_zoom(self, bbox, width, height):
        """Calculate optimal zoom level for WMTS tiles"""
        lon_span = bbox[2] - bbox[0]
        lat_span = bbox[3] - bbox[1]
        
        # Calculate required resolution
        lon_res = lon_span / width
        lat_res = lat_span / height
        
        # WMTS zoom levels (approximate degrees per pixel)
        zoom_resolutions = {
            0: 1.40625,
            1: 0.703125,
            2: 0.3515625,
            3: 0.17578125,
            4: 0.087890625,
            5: 0.0439453125
        }
        
        target_res = max(lon_res, lat_res)
        
        for zoom, res in zoom_resolutions.items():
            if res <= target_res:
                return max(0, zoom - 1)
        
        return 5  # Maximum zoom
    
    def get_tiles_for_bbox(self, bbox, zoom_level):
        """Get tile coordinates for bounding box"""
        # Convert bbox to tile coordinates
        tiles = []
        
        # Simplified tile calculation (this would need proper implementation)
        max_tile = 2 ** zoom_level
        
        x_min = max(0, int((bbox[0] + 180) / 360 * max_tile))
        x_max = min(max_tile - 1, int((bbox[2] + 180) / 360 * max_tile))
        y_min = max(0, int((90 - bbox[3]) / 180 * max_tile))
        y_max = min(max_tile - 1, int((90 - bbox[1]) / 180 * max_tile))
        
        for x in range(x_min, x_max + 1):
            for y in range(y_min, y_max + 1):
                tiles.append((x, y))
        
        return tiles
    
    def stitch_tiles(self, tile_images, bbox, width, height, zoom_level):
        """Stitch downloaded tiles into final image"""
        # Create output image
        result = Image.new('RGB', (width, height), (0, 0, 50))
        
        # This is a simplified stitching - would need proper georeferencing
        tile_size = 256
        cols = width // tile_size + 1
        rows = height // tile_size + 1
        
        for i, (tile_x, tile_y, tile_img) in enumerate(tile_images):
            x = (i % cols) * tile_size
            y = (i // cols) * tile_size
            
            if x < width and y < height:
                result.paste(tile_img, (x, y))
        
        return result.resize((width, height), Image.Resampling.LANCZOS)
    
    def list_available_layers(self):
        """List all available layers"""
        print("Available Layers:")
        print("================")
        for key, info in self.layers.items():
            print(f"{key:20} | {info['name']}")
        print()


def main():
    parser = argparse.ArgumentParser(description="Export images from NASA Earthdata API")
    parser.add_argument("--layer", "-l", help="Layer key (use --list-layers to see options)")
    parser.add_argument("--date", "-d", help="Date in YYYY-MM-DD format")
    parser.add_argument("--output", "-o", help="Output image path")
    parser.add_argument("--method", "-m", default="wms", choices=["wms", "wmts", "worldview"], help="Export method")
    parser.add_argument("--width", "-w", type=int, default=1920, help="Image width")
    parser.add_argument("--height", type=int, default=1080, help="Image height")
    parser.add_argument("--region", "-r", default="global", help="Region to export")
    parser.add_argument("--bbox", help="Custom bounding box: min_lon,min_lat,max_lon,max_lat")
    parser.add_argument("--time-series", action="store_true", help="Export time series")
    parser.add_argument("--end-date", help="End date for time series (YYYY-MM-DD)")
    parser.add_argument("--list-layers", action="store_true", help="List available layers")
    
    args = parser.parse_args()
    
    exporter = EarthdataImageExporter()
    
    if args.list_layers:
        exporter.list_available_layers()
        return 0
    
    # Check required arguments for non-list operations
    if not args.layer or not args.date or not args.output:
        parser.error("--layer, --date, and --output are required unless using --list-layers")
    
    print(f"NASA Earthdata Image Exporter")
    print(f"Layer: {args.layer}")
    print(f"Date: {args.date}")
    print(f"Method: {args.method}")
    print(f"Output: {args.output}")
    print()
    
    try:
        if args.time_series:
            if not args.end_date:
                print("Error: --end-date required for time series")
                return 1
            
            output_dir = args.output
            successful, failed = exporter.export_time_series(
                args.layer, args.date, args.end_date, args.region, 
                args.width, args.height, output_dir, args.method
            )
            
            if successful > 0:
                print(f"Time series export completed: {successful} images")
                return 0
            else:
                print("Time series export failed")
                return 1
        
        else:
            # Single image export
            if args.bbox:
                bbox = [float(x) for x in args.bbox.split(',')]
                if args.method == "wms":
                    success = exporter.export_wms_image(args.layer, args.date, bbox, args.width, args.height, args.output)
                elif args.method == "wmts":
                    success = exporter.export_wmts_image(args.layer, args.date, bbox, args.width, args.height, args.output)
                else:
                    success = exporter.export_worldview_snapshot(args.layer, args.date, bbox, args.width, args.height, args.output)
            else:
                success = exporter.export_region_image(args.layer, args.date, args.region, args.width, args.height, args.output, args.method)
            
            if success:
                print("Export completed successfully!")
                return 0
            else:
                print("Export failed!")
                return 1
    
    except Exception as e:
        print(f"Error: {e}")
        return 1


if __name__ == "__main__":
    import io
    from io import BytesIO
    sys.exit(main())