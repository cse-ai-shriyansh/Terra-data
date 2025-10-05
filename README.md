# Terra25 — Animated Terra Data Portal

> **Visualizing NASA Terra satellite datasets as animated stories for researchers, civic planners, educators, and engaged citizens.**

![Terra25 Banner](https://via.placeholder.com/1200x400/0ea5e9/ffffff?text=Terra25+-+Animated+Terra+Data+Portal)

## 🌍 Overview

Terra25 is a cutting-edge web application that transforms NASA Terra satellite datasets into compelling animated visualizations. Our platform empowers users to explore environmental changes through interactive stories, focusing on critical issues like air quality, wildfires, glacier retreat, urban heat islands, and extreme weather patterns.

### Key Features

- **🛰️ Multi-Instrument Support**: MODIS, MOPITT, MISR, ASTER, and CERES datasets
- **🎬 Animated Storytelling**: Transform static data into dynamic visual narratives
- **🗺️ Interactive Maps**: Powered by MapLibre GL with custom NASA tile layers
- **⏱️ Time Series Analysis**: Explore environmental changes over time
- **📱 Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **🔄 Real-time Updates**: Automated data ingestion from NASA sources
- **📊 Export Capabilities**: Generate GIF/MP4 animations for presentations
- **♿ Accessibility**: WCAG AA compliant with keyboard navigation

## 🏗️ Architecture

```
Terra25/
├── apps/
│   ├── web/                 # Next.js frontend application
│   └── api/                 # Express.js backend API
├── services/
│   └── ingestor/           # Python data processing service
├── infra/                  # Infrastructure and deployment configs
├── docs/                   # Documentation and guides
└── packages/               # Shared libraries and utilities
```

### Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, TailwindCSS, Framer Motion
- **Backend**: Node.js, Express, TypeScript
- **Data Processing**: Python, xarray, rasterio, GDAL
- **Maps**: MapLibre GL, deck.gl, Leaflet (fallback)
- **Database**: PostgreSQL with PostGIS
- **Storage**: AWS S3 + CloudFront CDN
- **Deployment**: Docker, GitHub Actions

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose
- Python 3.11+ (for data processing)
- NASA Earthdata credentials

### 1. Clone and Setup

```bash
git clone <repository-url>
cd "nasa space apps"

# Copy environment configuration
cp .env.example .env
# Edit .env with your credentials
```

### 2. Start Development Environment

```bash
# Install dependencies
npm install

# Start all services with Docker Compose
docker-compose up -d

# Start frontend development server
cd apps/web
npm run dev
```

### 3. Access the Application

- **Frontend**: http://localhost:3000
- **API**: http://localhost:3001
- **Health Check**: http://localhost:3001/health

## 📊 Data Sources

Terra25 integrates with multiple NASA data sources:

### MODIS (Moderate Resolution Imaging Spectroradiometer)
- **Products**: True Color imagery, Active Fire Detection, Vegetation Indices
- **Resolution**: 250m-1km
- **Coverage**: Global, daily
- **Use Cases**: Fire monitoring, vegetation health, land cover changes

### MOPITT (Measurements of Pollution in the Troposphere)
- **Products**: Carbon Monoxide concentrations
- **Resolution**: 22km
- **Coverage**: Global
- **Use Cases**: Air quality monitoring, pollution tracking

### MISR (Multi-angle Imaging SpectroRadiometer)
- **Products**: Aerosol Optical Depth, Cloud properties
- **Resolution**: 17.6km
- **Coverage**: Global
- **Use Cases**: Air quality, climate studies

### ASTER (Advanced Spaceborne Thermal Emission and Reflection Radiometer)
- **Products**: Land Surface Temperature, Digital Elevation Models
- **Resolution**: 15m-90m
- **Coverage**: On-demand
- **Use Cases**: Urban heat islands, geological studies

### CERES (Clouds and the Earth's Radiant Energy System)
- **Products**: Earth's radiation budget
- **Resolution**: 20km
- **Coverage**: Global
- **Use Cases**: Climate research, energy balance studies

## 🛠️ Development

### Project Structure

```
apps/web/src/
├── app/                    # Next.js 14 App Router pages
├── components/             # Reusable React components
│   ├── hero.tsx           # Landing page hero section
│   ├── map.tsx            # Interactive map component
│   ├── navigation.tsx     # Navigation bar
│   └── dataset-gallery.tsx # Dataset showcase
├── lib/                   # Utility functions and configurations
├── types/                 # TypeScript type definitions
└── styles/                # Global styles and Tailwind config

apps/api/src/
├── routes/                # API route handlers
│   ├── ingest.ts         # Data ingestion endpoints
│   ├── frames.ts         # Frame serving endpoints
│   └── export.ts         # Animation export endpoints
└── index.ts              # Express server configuration

services/ingestor/src/
├── downloaders/          # NASA data downloaders
├── processors/           # Image processing modules
├── uploaders/           # Cloud storage uploaders
└── main.py              # Main ingestor application
```

### Available Scripts

#### Frontend (apps/web)
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking
```

#### Backend (apps/api)
```bash
npm run dev          # Start development server with hot reload
npm run build        # Compile TypeScript
npm run start        # Start production server
```

#### Monorepo Root
```bash
npm run dev          # Start all services in development
npm run build        # Build all applications
npm run test         # Run all tests
npm run lint         # Lint all packages
```

### Environment Configuration

Key environment variables (see `.env.example`):

```bash
# NASA Earthdata Credentials
EARTHDATA_USERNAME=your_username
EARTHDATA_PASSWORD=your_password

# AWS Configuration
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
S3_BUCKET=terra25-data

# Database
DATABASE_URL=postgresql://terra25:password@localhost:5432/terra25

# Optional: Mapbox for enhanced maps
MAPBOX_ACCESS_TOKEN=your_mapbox_token
```

## 🔧 API Reference

### Data Ingestion

```bash
# Trigger data ingestion
POST /api/ingest
{
  "product": "MODIS_Terra_Fires",
  "date": "2024-01-15",
  "bbox": [-124.4, 32.5, -114.1, 42.0]
}

# Check ingestion status
GET /api/ingest/{job_id}
```

### Frame Retrieval

```bash
# Get single frame
GET /api/frames/{product}/{date}?bbox=[-124,32,-114,42]

# Get frame sequence for animation
GET /api/frames/sequence/{product}?startDate=2024-01-01&endDate=2024-01-30
```

### Animation Export

```bash
# Create animation export
POST /api/export
{
  "frames": ["url1", "url2", ...],
  "format": "mp4",
  "fps": 10,
  "quality": "high"
}

# Download completed export
GET /api/export/download/{export_id}
```

## 📚 Documentation

- [Getting Started Guide](docs/getting-started.md)
- [NASA Data Sources](docs/data-sources.md)
- [API Documentation](docs/api.md)
- [Deployment Guide](docs/deployment.md)
- [Contributing Guidelines](docs/contributing.md)
- [Developer Checklist](docs/dev-checklist.md)

## 🌟 Use Cases

### For Researchers
- **Climate Studies**: Analyze long-term environmental trends
- **Fire Research**: Track wildfire progression and impacts
- **Air Quality**: Monitor pollution patterns and sources
- **Validation**: Compare satellite data with ground measurements

### For Civic Planners
- **Urban Planning**: Assess urban heat island effects
- **Emergency Response**: Monitor disaster impacts in real-time
- **Environmental Policy**: Support data-driven decision making
- **Public Health**: Correlate environmental factors with health outcomes

### For Educators
- **Environmental Science**: Teach climate change concepts
- **Data Literacy**: Demonstrate scientific data analysis
- **Geography**: Explore Earth system interactions
- **STEM Education**: Engage students with real NASA data

### For Citizens
- **Local Awareness**: Understand environmental conditions in your area
- **Climate Education**: Learn about global environmental changes
- **Advocacy**: Support environmental causes with data
- **Personal Interest**: Explore Earth from space

## 🤝 Contributing

We welcome contributions from the community! Please read our [Contributing Guidelines](docs/contributing.md) for details on:

- Code of Conduct
- Development process
- Pull request guidelines
- Issue reporting
- Feature requests

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **NASA Earth Science Division** for providing open access to Terra satellite data
- **NASA GIBS** for the Web Map Tile Service infrastructure
- **Earthdata** for data access and authentication systems
- **Open Source Community** for the amazing tools and libraries

## 🔗 Links

- [NASA Terra Mission](https://terra.nasa.gov/)
- [NASA Worldview](https://worldview.earthdata.nasa.gov/)
- [NASA GIBS](https://wiki.earthdata.nasa.gov/display/GIBS)
- [Earthdata](https://earthdata.nasa.gov/)

---

**Terra25** — Bringing Earth's story to life through data visualization 🌍✨