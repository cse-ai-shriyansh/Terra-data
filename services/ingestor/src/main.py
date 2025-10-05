"""
Terra25 Data Ingestor
Main application for processing NASA Terra satellite data
"""

import os
import asyncio
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from dataclasses import dataclass
from pathlib import Path

import schedule
import time
from dotenv import load_dotenv

from downloaders.nasa_downloader import NASADownloader
from processors.image_processor import ImageProcessor
from uploaders.s3_uploader import S3Uploader
from database.metadata_store import MetadataStore

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@dataclass
class IngestionJob:
    """Represents a data ingestion job"""
    product: str
    date: str
    bbox: List[float]  # [minLng, minLat, maxLng, maxLat]
    resolution: str = "250m"
    format: str = "png"
    priority: int = 1

class TerraIngestor:
    """Main ingestor class for Terra satellite data"""
    
    def __init__(self):
        self.downloader = NASADownloader()
        self.processor = ImageProcessor()
        self.uploader = S3Uploader()
        self.metadata_store = MetadataStore()
        
        # Configure paths
        self.data_dir = Path(os.getenv('DATA_DIR', '/app/data'))
        self.output_dir = Path(os.getenv('OUTPUT_DIR', '/app/output'))
        
        # Create directories
        self.data_dir.mkdir(exist_ok=True)
        self.output_dir.mkdir(exist_ok=True)
        
        logger.info("🚀 Terra25 Ingestor initialized")
    
    async def process_job(self, job: IngestionJob) -> Dict[str, Any]:
        """Process a single ingestion job"""
        try:
            logger.info(f"📥 Processing job: {job.product} for {job.date}")
            
            # Step 1: Download raw data from NASA
            raw_file = await self.downloader.download(
                product=job.product,
                date=job.date,
                bbox=job.bbox,
                output_dir=self.data_dir
            )
            
            if not raw_file:
                raise Exception("Failed to download data from NASA")
            
            logger.info(f"✅ Downloaded: {raw_file}")
            
            # Step 2: Process the data (reproject, tile, etc.)
            processed_files = await self.processor.process(
                input_file=raw_file,
                bbox=job.bbox,
                resolution=job.resolution,
                format=job.format,
                output_dir=self.output_dir
            )
            
            logger.info(f"✅ Processed {len(processed_files)} files")
            
            # Step 3: Upload to cloud storage
            uploaded_urls = []
            for file_path in processed_files:
                url = await self.uploader.upload(file_path)
                uploaded_urls.append(url)
                logger.info(f"☁️  Uploaded: {url}")
            
            # Step 4: Store metadata in database
            metadata = {
                'product': job.product,
                'date': job.date,
                'bbox': job.bbox,
                'resolution': job.resolution,
                'format': job.format,
                'files': uploaded_urls,
                'processed_at': datetime.utcnow().isoformat(),
                'file_count': len(uploaded_urls)
            }
            
            await self.metadata_store.store(metadata)
            logger.info(f"💾 Stored metadata for {job.product}")
            
            # Cleanup local files
            self._cleanup_files([raw_file] + processed_files)
            
            return {
                'status': 'success',
                'product': job.product,
                'date': job.date,
                'files_processed': len(processed_files),
                'urls': uploaded_urls,
                'metadata': metadata
            }
            
        except Exception as e:
            logger.error(f"❌ Job failed: {str(e)}")
            return {
                'status': 'error',
                'product': job.product,
                'date': job.date,
                'error': str(e)
            }
    
    async def process_date_range(
        self, 
        product: str, 
        start_date: str, 
        end_date: str,
        bbox: List[float]
    ) -> List[Dict[str, Any]]:
        """Process a range of dates for a product"""
        
        start = datetime.strptime(start_date, '%Y-%m-%d')
        end = datetime.strptime(end_date, '%Y-%m-%d')
        
        jobs = []
        current = start
        
        while current <= end:
            job = IngestionJob(
                product=product,
                date=current.strftime('%Y-%m-%d'),
                bbox=bbox
            )
            jobs.append(job)
            current += timedelta(days=1)
        
        logger.info(f"📋 Processing {len(jobs)} jobs for {product}")
        
        # Process jobs concurrently (but limit concurrency)
        semaphore = asyncio.Semaphore(3)  # Max 3 concurrent jobs
        
        async def process_with_semaphore(job):
            async with semaphore:
                return await self.process_job(job)
        
        results = await asyncio.gather(
            *[process_with_semaphore(job) for job in jobs],
            return_exceptions=True
        )
        
        return results
    
    def _cleanup_files(self, file_paths: List[Path]):
        """Clean up temporary files"""
        for file_path in file_paths:
            try:
                if file_path.exists():
                    file_path.unlink()
                    logger.debug(f"🗑️  Cleaned up: {file_path}")
            except Exception as e:
                logger.warning(f"Failed to cleanup {file_path}: {e}")
    
    def schedule_daily_ingestion(self):
        """Schedule daily ingestion jobs"""
        
        # Define default products and regions for daily ingestion
        daily_jobs = [
            {
                'product': 'MODIS_Terra_CorrectedReflectance_TrueColor',
                'bbox': [-180, -90, 180, 90],  # Global
            },
            {
                'product': 'MODIS_Terra_Fires',
                'bbox': [-180, -90, 180, 90],  # Global
            },
            {
                'product': 'MOPITT_CO_Total_Column',
                'bbox': [-180, -90, 180, 90],  # Global
            }
        ]
        
        def run_daily_ingestion():
            """Run daily ingestion for yesterday's data"""
            yesterday = (datetime.now() - timedelta(days=1)).strftime('%Y-%m-%d')
            
            for job_config in daily_jobs:
                job = IngestionJob(
                    product=job_config['product'],
                    date=yesterday,
                    bbox=job_config['bbox']
                )
                
                # Run the job asynchronously
                asyncio.create_task(self.process_job(job))
        
        # Schedule at 2 AM UTC daily
        schedule.every().day.at("02:00").do(run_daily_ingestion)
        logger.info("📅 Scheduled daily ingestion at 02:00 UTC")

async def main():
    """Main entry point"""
    ingestor = TerraIngestor()
    
    # Setup scheduled jobs
    ingestor.schedule_daily_ingestion()
    
    # Example: Process recent MODIS data
    if os.getenv('RUN_EXAMPLE', 'false').lower() == 'true':
        logger.info("🧪 Running example ingestion...")
        
        # Process last 7 days of MODIS fire data for California
        end_date = datetime.now().strftime('%Y-%m-%d')
        start_date = (datetime.now() - timedelta(days=7)).strftime('%Y-%m-%d')
        
        california_bbox = [-124.4096, 32.5343, -114.1308, 42.0095]
        
        results = await ingestor.process_date_range(
            product='MODIS_Terra_Fires',
            start_date=start_date,
            end_date=end_date,
            bbox=california_bbox
        )
        
        logger.info(f"🏁 Example completed: {len(results)} jobs processed")
    
    # Keep the service running and check for scheduled jobs
    logger.info("🔄 Starting scheduler loop...")
    while True:
        schedule.run_pending()
        await asyncio.sleep(60)  # Check every minute

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("👋 Shutting down ingestor...")
    except Exception as e:
        logger.error(f"💥 Fatal error: {e}")
        raise