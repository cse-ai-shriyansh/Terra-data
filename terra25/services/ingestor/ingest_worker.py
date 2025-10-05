"""
Terra25 Ingestor Worker
Main data ingestion and processing service for NASA Terra satellite data
Handles WMTS tile downloads, LAADS product ingestion, and frame generation
"""

import os
import sys
import time
import logging
import asyncio
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Tuple
from pathlib import Path
import tempfile
import shutil

import requests
import numpy as np
from PIL import Image
import rasterio
from rasterio.transform import from_bounds
from rasterio.warp import calculate_default_transform, reproject, Resampling
import rioxarray as rxr
import xarray as xr
from minio import Minio
from minio.error import S3Error
import redis
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class TerraIngestor:
    """Main class for Terra satellite data ingestion and processing"""
    
    def __init__(self):
        self.setup_config()
        self.setup_storage()
        self.setup_cache()
        
    def setup_config(self):
        """Initialize configuration from environment variables"""
        self.earthdata_username = os.getenv('EARTHDATA_USERNAME')
        self.earthdata_password = os.getenv('EARTHDATA_PASSWORD')
        self.nasa_gibs_url = os.getenv('NASA_GIBS_WMTS_URL', 'https://gibs.earthdata.nasa.gov/wmts/epsg4326/best')
        self.laads_url = os.getenv('LAADS_DAAC_URL', 'https://ladsweb.modaps.eosdis.nasa.gov/api/v2')
        self.temp_dir = Path(os.getenv('TEMP_DIR', '/tmp/terra25'))
        self.temp_dir.mkdir(parents=True, exist_ok=True)
        
    def setup_storage(self):
        """Initialize S3/MinIO storage connection"""
        try:
            self.minio_client = Minio(
                endpoint=os.getenv('MINIO_ENDPOINT', 'localhost:9000').replace('http://', ''),
                access_key=os.getenv('MINIO_ROOT_USER', 'admin'),
                secret_key=os.getenv('MINIO_ROOT_PASSWORD', 'password123'),
                secure=False  # Set to True for HTTPS
            )
            
            # Ensure bucket exists
            bucket_name = os.getenv('MINIO_BUCKET', 'terra25-local')
            if not self.minio_client.bucket_exists(bucket_name):
                self.minio_client.make_bucket(bucket_name)
                logger.info(f"Created bucket: {bucket_name}")
                
            self.bucket_name = bucket_name
            logger.info("Storage connection established")
            
        except Exception as e:
            logger.error(f"Failed to setup storage: {e}")
            raise
            
    def setup_cache(self):
        """Initialize Redis cache connection"""
        try:
            self.redis_client = redis.Redis(
                host=os.getenv('REDIS_HOST', 'localhost'),
                port=int(os.getenv('REDIS_PORT', '6379')),
                db=0,
                decode_responses=True
            )
            self.redis_client.ping()
            logger.info("Cache connection established")
        except Exception as e:
            logger.warning(f"Cache not available: {e}")
            self.redis_client = None

    def fetch_wmts_tile(self, layer: str, date: str, z: int, x: int, y: int) -> Optional[bytes]:
        """
        Download WMTS tile from NASA GIBS
        
        Args:
            layer: Terra layer identifier
            date: Date in YYYY-MM-DD format
            z: Zoom level
            x: Tile X coordinate
            y: Tile Y coordinate
            
        Returns:
            Tile data as bytes or None if failed
        """
        try:
            # Determine resolution and format based on layer
            resolution_map = {
                'MODIS_Terra_CorrectedReflectance_TrueColor': '250m',
                'MODIS_Terra_CorrectedReflectance_Bands721': '500m',
                'MODIS_Terra_CorrectedReflectance_Bands367': '500m',
                'MODIS_Terra_SurfaceReflectance_Bands121': '500m',
                'MODIS_Terra_Aerosol': '1km',
                'MODIS_Terra_Chlorophyll_A': '4km',
            }
            
            format_map = {
                'MODIS_Terra_CorrectedReflectance_TrueColor': 'jpg',
                'MODIS_Terra_CorrectedReflectance_Bands721': 'jpg',
                'MODIS_Terra_CorrectedReflectance_Bands367': 'jpg',
                'MODIS_Terra_SurfaceReflectance_Bands121': 'jpg',
                'MODIS_Terra_Aerosol': 'png',
                'MODIS_Terra_Chlorophyll_A': 'png',
            }
            
            resolution = resolution_map.get(layer, '250m')
            fmt = format_map.get(layer, 'jpg')
            
            # Build WMTS URL
            url = f"{self.nasa_gibs_url}/{layer}/default/{date}/{resolution}/{z}/{y}/{x}.{fmt}"
            
            logger.info(f"Fetching tile: {url}")
            
            response = requests.get(url, timeout=30)
            response.raise_for_status()
            
            return response.content
            
        except requests.RequestException as e:
            logger.error(f"Failed to fetch WMTS tile: {e}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error fetching tile: {e}")
            return None

    def download_laads_product(self, product: str, date: str, bbox: Dict[str, float]) -> Optional[str]:
        """
        Download LAADS product (stub implementation)
        
        Args:
            product: LAADS product identifier
            date: Date in YYYY-MM-DD format
            bbox: Bounding box with north, south, east, west keys
            
        Returns:
            Path to downloaded file or None if failed
        """
        try:
            # This is a stub implementation - real implementation would:
            # 1. Query LAADS API for available granules
            # 2. Filter by bounding box and date
            # 3. Download granules using EARTHDATA credentials
            # 4. Return path to downloaded file
            
            logger.info(f"LAADS download stub: {product} for {date}")
            
            if not self.earthdata_username or not self.earthdata_password:
                logger.warning("EARTHDATA credentials not configured")
                return None
                
            # Example API call structure (not functional without proper implementation)
            headers = {
                'User-Agent': 'Terra25-Ingestor/1.0'
            }
            
            # Would implement actual LAADS API calls here
            logger.info("LAADS download not yet implemented - using WMTS tiles instead")
            return None
            
        except Exception as e:
            logger.error(f"LAADS download failed: {e}")
            return None

    def reproject_and_tile(self, input_file: str, output_dir: str) -> List[str]:
        """
        Reproject and tile raster data (example implementation)
        
        Args:
            input_file: Path to input raster file
            output_dir: Directory for output tiles
            
        Returns:
            List of generated tile file paths
        """
        try:
            output_path = Path(output_dir)
            output_path.mkdir(parents=True, exist_ok=True)
            
            # Read input raster
            with rasterio.open(input_file) as src:
                # Calculate transform to Web Mercator (EPSG:3857)
                dst_crs = 'EPSG:3857'
                transform, width, height = calculate_default_transform(
                    src.crs, dst_crs, src.width, src.height, *src.bounds
                )
                
                # Create output dataset
                kwargs = src.meta.copy()
                kwargs.update({
                    'crs': dst_crs,
                    'transform': transform,
                    'width': width,
                    'height': height
                })
                
                output_file = output_path / f"reprojected_{Path(input_file).stem}.tif"
                
                with rasterio.open(output_file, 'w', **kwargs) as dst:
                    for i in range(1, src.count + 1):
                        reproject(
                            source=rasterio.band(src, i),
                            destination=rasterio.band(dst, i),
                            src_transform=src.transform,
                            src_crs=src.crs,
                            dst_transform=transform,
                            dst_crs=dst_crs,
                            resampling=Resampling.nearest
                        )
            
            # Generate tiles (simplified - would use proper tiling algorithm)
            tiles = [str(output_file)]
            logger.info(f"Generated {len(tiles)} tiles")
            return tiles
            
        except Exception as e:
            logger.error(f"Reprojection failed: {e}")
            return []

    def generate_frames(self, dates: List[str], bbox: Dict[str, float], layer: str = 'MODIS_Terra_CorrectedReflectance_TrueColor') -> List[str]:
        """
        Generate animation frames for specified dates and bounding box
        
        Args:
            dates: List of dates in YYYY-MM-DD format
            bbox: Bounding box with north, south, east, west keys
            layer: Terra layer to use
            
        Returns:
            List of URLs to generated frames
        """
        try:
            frame_urls = []
            
            # Calculate tile coordinates for bounding box at zoom level 5
            zoom = 5
            tile_coords = self._get_tile_coordinates(bbox, zoom)
            
            for date in dates:
                frame_tiles = []
                
                # Download tiles for this date
                for x, y in tile_coords:
                    tile_data = self.fetch_wmts_tile(layer, date, zoom, x, y)
                    if tile_data:
                        frame_tiles.append((x, y, tile_data))
                
                if frame_tiles:
                    # Compose tiles into single frame
                    frame_path = self._compose_frame(frame_tiles, date, bbox, zoom)
                    if frame_path:
                        # Upload to storage
                        object_name = f"frames/{layer}/{date}_{zoom}_{hash(str(bbox))}.png"
                        frame_url = self._upload_to_storage(frame_path, object_name)
                        if frame_url:
                            frame_urls.append(frame_url)
                        
                        # Clean up local file
                        os.unlink(frame_path)
                
                logger.info(f"Generated frame for {date}")
            
            logger.info(f"Generated {len(frame_urls)} total frames")
            return frame_urls
            
        except Exception as e:
            logger.error(f"Frame generation failed: {e}")
            return []

    def _get_tile_coordinates(self, bbox: Dict[str, float], zoom: int) -> List[Tuple[int, int]]:
        """Calculate tile coordinates for bounding box at given zoom level"""
        import math
        
        def deg2num(lat_deg: float, lon_deg: float, zoom: int) -> Tuple[int, int]:
            lat_rad = math.radians(lat_deg)
            n = 2.0 ** zoom
            x = int((lon_deg + 180.0) / 360.0 * n)
            y = int((1.0 - math.asinh(math.tan(lat_rad)) / math.pi) / 2.0 * n)
            return (x, y)
        
        # Get tile boundaries
        min_x, max_y = deg2num(bbox['north'], bbox['west'], zoom)
        max_x, min_y = deg2num(bbox['south'], bbox['east'], zoom)
        
        # Generate all tile coordinates in bounding box
        coordinates = []
        for x in range(min_x, max_x + 1):
            for y in range(min_y, max_y + 1):
                coordinates.append((x, y))
        
        return coordinates[:25]  # Limit to prevent excessive tile downloads

    def _compose_frame(self, tiles: List[Tuple[int, int, bytes]], date: str, bbox: Dict[str, float], zoom: int) -> Optional[str]:
        """Compose individual tiles into a single frame image"""
        try:
            if not tiles:
                return None
            
            # Calculate frame dimensions
            tile_size = 256
            min_x = min(tile[0] for tile in tiles)
            max_x = max(tile[0] for tile in tiles)
            min_y = min(tile[1] for tile in tiles)
            max_y = max(tile[1] for tile in tiles)
            
            width = (max_x - min_x + 1) * tile_size
            height = (max_y - min_y + 1) * tile_size
            
            # Create composite image
            frame = Image.new('RGB', (width, height), (0, 0, 0))
            
            for x, y, tile_data in tiles:
                try:
                    tile_img = Image.open(io.BytesIO(tile_data))
                    paste_x = (x - min_x) * tile_size
                    paste_y = (y - min_y) * tile_size
                    frame.paste(tile_img, (paste_x, paste_y))
                except Exception as e:
                    logger.warning(f"Failed to paste tile {x},{y}: {e}")
                    continue
            
            # Save frame
            frame_path = self.temp_dir / f"frame_{date}_{zoom}_{hash(str(bbox))}.png"
            frame.save(frame_path, 'PNG', optimize=True)
            
            return str(frame_path)
            
        except Exception as e:
            logger.error(f"Frame composition failed: {e}")
            return None

    def _upload_to_storage(self, file_path: str, object_name: str) -> Optional[str]:
        """Upload file to S3/MinIO storage"""
        try:
            self.minio_client.fput_object(
                bucket_name=self.bucket_name,
                object_name=object_name,
                file_path=file_path,
                content_type='image/png'
            )
            
            # Return public URL
            endpoint = os.getenv('MINIO_ENDPOINT', 'http://localhost:9000')
            return f"{endpoint}/{self.bucket_name}/{object_name}"
            
        except S3Error as e:
            logger.error(f"Storage upload failed: {e}")
            return None

def main():
    """Main worker loop"""
    logger.info("Starting Terra25 Ingestor Worker")
    
    ingestor = TerraIngestor()
    
    # Example usage - generate frames for a test case
    test_dates = [
        '2024-01-01', '2024-01-02', '2024-01-03',
        '2024-01-04', '2024-01-05', '2024-01-06', '2024-01-07'
    ]
    
    test_bbox = {
        'north': 45.0,
        'south': 35.0,
        'east': -110.0,
        'west': -120.0
    }
    
    # Generate test animation
    frame_urls = ingestor.generate_frames(test_dates, test_bbox)
    logger.info(f"Generated test animation with {len(frame_urls)} frames")
    
    # Keep worker alive
    while True:
        try:
            logger.info("Worker heartbeat")
            time.sleep(60)  # Check every minute
        except KeyboardInterrupt:
            logger.info("Shutting down worker")
            break
        except Exception as e:
            logger.error(f"Worker error: {e}")
            time.sleep(10)

if __name__ == '__main__':
    # Add missing import
    import io
    main()