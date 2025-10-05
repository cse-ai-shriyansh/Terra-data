# Terra25 Development Setup Instructions

## Quick Start

1. **Clone and Setup**
   ```bash
   cd terra25
   cp .env.example .env
   ```

2. **Configure Environment**
   Edit `.env` file with your NASA Earthdata credentials:
   ```
   EARTHDATA_USERNAME=your_username
   EARTHDATA_PASSWORD=your_password
   ```

3. **Start Services**
   ```bash
   docker-compose up --build
   ```

4. **Access Applications**
   - Web App: http://localhost:3000
   - API: http://localhost:3001
   - MinIO Console: http://localhost:9001

## Full Development Setup

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for local development)
- Python 3.11+ (for ingestor development)
- NASA Earthdata account

### NASA Earthdata Setup
1. Create account at: https://urs.earthdata.nasa.gov/
2. Note your username and password
3. Add to `.env` file

### Local Development

#### Frontend Development
```bash
cd apps/web
npm install
npm run dev
```

#### Backend Development
```bash
cd apps/api
npm install
npm run dev
```

#### Python Ingestor Development
```bash
cd services/ingestor
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python ingest_worker.py
```

### Testing

#### Run All Tests
```bash
# Frontend tests
cd apps/web && npm test

# Backend tests
cd apps/api && npm test

# Python tests
cd services/ingestor && pytest
```

#### Integration Testing
```bash
docker-compose -f docker-compose.yml -f docker-compose.test.yml up --abort-on-container-exit
```

### Production Deployment

1. **Build Images**
   ```bash
   docker-compose -f docker-compose.prod.yml build
   ```

2. **Deploy**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

## Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Next.js Web   │───▶│   Express API   │───▶│ Python Ingestor │
│     (Port 3000) │    │    (Port 3001)  │    │   (Background)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│      MinIO      │    │   PostgreSQL    │    │      Redis      │
│   (Port 9000)   │    │   (Port 5432)   │    │   (Port 6379)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## API Endpoints

### Ingestion
- `POST /api/ingest` - Start ingestion job
- `GET /api/ingest/:jobId` - Get job status
- `GET /api/ingest` - List jobs
- `DELETE /api/ingest/:jobId` - Cancel job

### Frames
- `GET /api/frames/job/:jobId` - Get frames for job
- `GET /api/frames/:jobId/:frameIndex` - Get specific frame
- `GET /api/frames/:jobId/:frameIndex/stream` - Stream frame

### Export
- `POST /api/export` - Create export job
- `GET /api/export/:exportId` - Get export status
- `GET /api/export/:exportId/download` - Download export

## Troubleshooting

### Common Issues

1. **NASA API Authentication Errors**
   - Verify Earthdata credentials in `.env`
   - Check NASA GIBS service status

2. **Docker Build Failures**
   - Clear Docker cache: `docker system prune -a`
   - Rebuild: `docker-compose build --no-cache`

3. **Memory Issues**
   - Increase Docker memory limit
   - Reduce worker concurrency in `.env`

4. **Slow Performance**
   - Check Redis connection
   - Monitor MinIO storage space
   - Verify network connectivity to NASA GIBS

### Debug Commands

```bash
# View logs
docker-compose logs -f web
docker-compose logs -f api
docker-compose logs -f ingestor

# Database access
docker-compose exec postgres psql -U terra25 -d terra25

# Redis access
docker-compose exec redis redis-cli

# MinIO access
docker-compose exec minio mc ls terra25/
```

## Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.