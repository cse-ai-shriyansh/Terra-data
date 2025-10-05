# Terra25 Developer Checklist

Complete this checklist to set up your Terra25 development environment.

## Prerequisites
- [ ] Node.js 18+ installed
- [ ] Docker and Docker Compose installed
- [ ] Python 3.11+ installed (for data processing)
- [ ] Git configured with your credentials

## Environment Setup
- [ ] Clone the repository: `git clone <repository-url>`
- [ ] Copy `.env.example` to `.env`
- [ ] Add EARTHDATA_USERNAME & EARTHDATA_PASSWORD to `.env`
- [ ] Add S3 keys to `.env` (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, S3_BUCKET)
- [ ] Add MAPBOX_ACCESS_TOKEN to `.env` (optional, for enhanced maps)
- [ ] Configure DATABASE_URL in `.env`

## NASA Earthdata Setup
- [ ] Create account at https://urs.earthdata.nasa.gov/
- [ ] Apply for data access permissions
- [ ] Generate application token for programmatic access
- [ ] Test credentials with LAADS DAAC API

## Development Environment
- [ ] Install dependencies: `npm install`
- [ ] Start database and services: `docker-compose up -d postgres redis`
- [ ] Run database migrations (if applicable)
- [ ] Start API server: `cd apps/api && npm run dev`
- [ ] Start frontend: `cd apps/web && npm run dev`
- [ ] Verify health check: http://localhost:3001/health

## Testing Data Ingestion
- [ ] Start Python ingestor: `docker-compose up ingestor`
- [ ] Test sample ingest: 
  ```bash
  curl -X POST http://localhost:3001/api/ingest \
    -H "Content-Type: application/json" \
    -d '{
      "product": "MODIS_Terra_CorrectedReflectance_TrueColor",
      "date": "2024-01-15",
      "bbox": [-124.4, 32.5, -114.1, 42.0]
    }'
  ```
- [ ] Check ingestion status via returned job ID
- [ ] Verify processed frames in `/api/frames/sequence/`

## Frontend Testing
- [ ] Visit http://localhost:3000
- [ ] Test navigation between pages
- [ ] Verify map component loads correctly
- [ ] Test dataset gallery interactions
- [ ] Create a test story in story builder

## Code Quality
- [ ] Run linting: `npm run lint`
- [ ] Run type checking: `npm run type-check`
- [ ] Run tests: `npm run test`
- [ ] Verify no console errors in browser
- [ ] Test responsive design on mobile/tablet

## Documentation
- [ ] Read through README.md
- [ ] Review API documentation
- [ ] Understand data source configurations
- [ ] Familiarize yourself with project structure

## Optional Enhancements
- [ ] Set up Mapbox account for enhanced mapping features
- [ ] Configure Sentry for error monitoring
- [ ] Set up local SSL certificates for HTTPS testing
- [ ] Install NASA Worldview browser bookmarks for reference

## Production Readiness (if deploying)
- [ ] Configure production environment variables
- [ ] Set up AWS S3 bucket and CloudFront distribution
- [ ] Configure domain and SSL certificates
- [ ] Set up monitoring and alerting
- [ ] Test backup and recovery procedures

## Troubleshooting Common Issues

### Database Connection Issues
- Ensure PostgreSQL is running: `docker-compose ps`
- Check connection string in `.env`
- Verify database exists: `docker-compose exec postgres psql -U terra25 -d terra25`

### NASA API Authentication
- Verify Earthdata credentials
- Check firewall/proxy settings
- Test with curl: `curl -u username:password https://ladsweb.modaps.eosdis.nasa.gov/api/v1/`

### Map Not Loading
- Check MAPBOX_ACCESS_TOKEN (if using Mapbox)
- Verify CORS settings in API
- Check browser console for WebGL errors

### Python Ingestor Issues
- Ensure all Python dependencies installed
- Check GDAL installation
- Verify data directory permissions

## Getting Help
- Check GitHub issues for known problems
- Review NASA Earthdata documentation
- Join Terra25 community discussions
- Contact team leads for technical support

---

**Status**: Complete this checklist and mark items as done. Report any issues to the development team.

**Last Updated**: 2024-01-01