# Terra25 - NASA Terra Satellite Data Animation Portal

> **🎯 Complete End-to-End Animated Data Portal for Terra Satellite Visualization**

Terra25 is a comprehensive web application that transforms NASA Terra satellite data into stunning animated visualizations. Built for the NASA Space Apps Challenge, it provides real-time access to Terra satellite imagery with powerful animation and export capabilities.

## ✨ Features

### 🌍 Interactive Terra Satellite Mapping
- **Real-time Terra Data**: Direct integration with NASA GIBS WMTS services
- **Multiple Terra Layers**: 6 different Terra satellite data products
- **Interactive Mapping**: Leaflet-based map with zoom, pan, and bounding box selection
- **Date Range Selection**: Animate data across custom time periods

### 🎬 Advanced Animation Engine
- **Smooth Animations**: Frame-by-frame Terra satellite imagery playback
- **Customizable Speed**: Adjustable frame rates from 1-30 FPS
- **Loop Controls**: Seamless looping and manual frame navigation
- **Preloading**: Intelligent tile prefetching for smooth playback

### 📤 Flexible Export Options
- **MP4 Video**: High-quality video exports with custom quality settings
- **Animated GIF**: Web-friendly animated images
- **WebM Video**: Open-source video format for web delivery
- **ZIP Archive**: Individual frame images for detailed analysis

### 🏗️ Scalable Architecture
- **Microservices**: Separate frontend, API, and data processing services
- **Containerized**: Full Docker Compose orchestration
- **Cloud-Ready**: S3-compatible storage with MinIO
- **Queue-Based**: Redis-powered job processing

## 🚀 Quick Start

### Prerequisites
- Docker Desktop
- NASA Earthdata Account ([Register here](https://urs.earthdata.nasa.gov/))

### 1. Clone and Setup
```bash
git clone <repository-url>
cd terra25
cp .env.example .env
```

### 2. Configure NASA Credentials
Edit `.env` file:
```env
EARTHDATA_USERNAME=your_earthdata_username
EARTHDATA_PASSWORD=your_earthdata_password
```

### 3. Start the Application
```bash
# Windows
start.bat

# macOS/Linux
chmod +x start.sh
./start.sh

# Or manually with Docker Compose
docker-compose up --build
```

### 4. Access the Application
- 🌐 **Web App**: http://localhost:3000
- 🔌 **API**: http://localhost:3001
- 💾 **MinIO Console**: http://localhost:9001 (admin/terra25secret)

## Development

### Prerequisites

- Docker & Docker Compose
- Node.js 18+ (for local development)
- Python 3.9+ (for local ingestor development)
- NASA Earthdata account (for LAADS access)

### Local Development

1. **Frontend Only**:
   ```bash
   cd apps/web
   npm install
   npm run dev
   ```

2. **Backend API Only**:
   ```bash
   cd apps/api
   npm install
   npm run dev
   ```

3. **Ingestor Service Only**:
   ```bash
   cd services/ingestor
   pip install -r requirements.txt
   python ingest_worker.py
   ```

## NASA Earthdata Setup

1. Create account at https://urs.earthdata.nasa.gov/
2. Create `.netrc` file in your home directory:
   ```
   machine urs.earthdata.nasa.gov
   login YOUR_USERNAME
   password YOUR_PASSWORD
   ```
3. Or use environment variables in `.env`:
   ```
   EARTHDATA_USERNAME=your_username
   EARTHDATA_PASSWORD=your_password
   ```

## API Endpoints

- `POST /api/ingest` - Trigger data ingestion
- `GET /api/frames` - Get frame URLs for animation
- `POST /api/export` - Create export job (MP4/GIF)
- `GET /api/export/:jobId` - Check export status

## Environment Variables

See `.env.example` for all configuration options including:
- EARTHDATA credentials
- S3/MinIO settings
- API keys and secrets
- Service endpoints

## Data Sources

- **WMTS Tiles**: NASA GIBS for fast visual tiles
- **Full Products**: LAADS DAAC for complete granules
- **Default Layer**: MODIS_Terra_CorrectedReflectance_TrueColor
- **Resolution**: 250m tiles for optimal performance

## Export Formats

- **MP4**: High-quality video animations
- **GIF**: Web-friendly animated GIFs
- **PNG Sequence**: Individual frames for custom processing

## Contributing

1. Fork the repository
2. Create feature branch
3. Add tests for new functionality
4. Submit pull request

## License

MIT License - see LICENSE file for details