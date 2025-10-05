# Terra25 Frontend

Interactive Next.js application for visualizing and animating NASA Terra satellite data.

## Features

- **Interactive Map**: Leaflet-based map with Terra satellite imagery
- **Animation Controls**: Play/pause, speed control, and frame navigation
- **Layer Selection**: Multiple Terra layers (True Color, False Color, etc.)
- **Date Range Selection**: Choose custom date ranges for animations
- **Bounding Box Selection**: Select specific geographic areas
- **Export Functionality**: Generate MP4 and GIF animations

## Development

### Prerequisites

- Node.js 18+
- npm or yarn

### Setup

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Environment Configuration**:
   ```bash
   # Copy environment template
   cp .env.example .env.local
   
   # Edit .env.local with your settings
   NEXT_PUBLIC_API_URL=http://localhost:3001
   NEXT_PUBLIC_MINIO_ENDPOINT=http://localhost:9000
   ```

3. **Start Development Server**:
   ```bash
   npm run dev
   ```

4. **Open Browser**:
   Navigate to http://localhost:3000

### Build for Production

```bash
npm run build
npm start
```

## Architecture

### Components

- **`MapPlayer`**: Interactive Leaflet map with Terra tile layers
- **`ControlPanel`**: Form controls for layer and date selection
- **`page.tsx`**: Main application layout and state management

### Libraries Used

- **Next.js 14**: React framework with App Router
- **React Leaflet**: Interactive maps
- **Tailwind CSS**: Styling
- **date-fns**: Date manipulation
- **Lucide React**: Icons
- **React Hook Form**: Form handling
- **Zustand**: State management
- **Framer Motion**: Animations

### Services

- **WMTS Utilities** (`lib/wmts.ts`): NASA GIBS tile URL generation
- **API Client**: Backend communication for data ingestion and exports

## Usage

### Basic Workflow

1. **Select Layer**: Choose Terra satellite layer (True Color, False Color, etc.)
2. **Set Date Range**: Pick start and end dates for animation
3. **Select Area**: Hold Shift + drag on map to select bounding box
4. **Generate Animation**: Click "Generate Animation" to create frames
5. **Play Animation**: Use controls to play/pause and adjust speed
6. **Export**: Generate MP4 or GIF files for sharing

### Map Controls

- **Pan**: Click and drag to move around
- **Zoom**: Mouse wheel or +/- buttons
- **Select Area**: Hold Shift + drag to select bounding box
- **Clear Selection**: Double-click to clear selection

### Keyboard Shortcuts

- **Space**: Play/pause animation
- **Left/Right Arrow**: Navigate frames manually
- **+/-**: Zoom in/out
- **R**: Reset map view

## Terra Layers

### Available Layers

1. **True Color (250m)**: Natural color imagery
2. **False Color 721 (500m)**: Infrared highlighting vegetation/fires
3. **Enhanced Vegetation (500m)**: Vegetation enhancement
4. **Surface Reflectance (500m)**: Atmospheric correction
5. **Aerosol Optical Depth (1km)**: Atmospheric pollution
6. **Ocean Chlorophyll (4km)**: Marine productivity

### Data Source

All imagery comes from NASA's Global Imagery Browse Services (GIBS):
- Base URL: `https://gibs.earthdata.nasa.gov/wmts/epsg4326/best`
- Format: JPEG tiles
- Projection: EPSG:4326 (Geographic)
- Update Frequency: Daily

## Performance

### Optimization Strategies

- **Tile Prefetching**: Preload tiles for smoother animation
- **Dynamic Imports**: Code splitting for map components
- **Image Optimization**: Unoptimized setting for satellite imagery
- **Concurrent Limits**: Limit simultaneous tile requests

### Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## Configuration

### Environment Variables

```bash
# API endpoint
NEXT_PUBLIC_API_URL=http://localhost:3001

# Storage endpoint for downloads
NEXT_PUBLIC_MINIO_ENDPOINT=http://localhost:9000
```

### Build Configuration

See `next.config.js` for:
- Image domain allowlist
- Webpack configuration for map libraries
- CORS headers for satellite imagery

## Testing

### Unit Tests

```bash
npm test
```

### Test Files

- `__tests__/lib/wmts.test.ts`: WMTS utility functions
- `__tests__/components/`: Component tests

### Test Coverage

Run with coverage reporting:
```bash
npm run test:coverage
```

## Deployment

### Docker

```bash
# Build image
docker build -t terra25-web .

# Run container
docker run -p 3000:3000 terra25-web
```

### Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

## Troubleshooting

### Common Issues

1. **Map not loading**: Check network connectivity to NASA GIBS
2. **Tiles not appearing**: Verify date format (YYYY-MM-DD)
3. **Animation not playing**: Ensure frames are generated first
4. **Export failing**: Check API connection and backend status

### Debug Mode

Enable debug logging:
```bash
NODE_ENV=development npm run dev
```

### Browser Console

Check for errors in browser developer tools:
- Network tab: Verify API calls
- Console tab: JavaScript errors
- Application tab: Local storage state

## Contributing

1. Fork the repository
2. Create feature branch
3. Add tests for new functionality
4. Submit pull request

## License

MIT License - see LICENSE file for details