/**
 * WMTS (Web Map Tile Service) utilities for NASA Terra satellite data
 * Builds tile URLs for NASA GIBS service and handles tile prefetching
 */

/**
 * Build WMTS tile URL for NASA Terra satellite data
 * @param layer - Terra layer identifier (e.g., 'MODIS_Terra_CorrectedReflectance_TrueColor')
 * @param date - Date in YYYY-MM-DD format
 * @param z - Zoom level (0-9 for Terra data)
 * @param x - Tile X coordinate
 * @param y - Tile Y coordinate
 * @returns Complete WMTS tile URL
 */
export function getTerraTileURL(
  layer: string,
  date: string,
  z: string | number,
  x: string | number,
  y: string | number
): string {
  // Use our authenticated API proxy instead of direct NASA GIBS access
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005';
  
  return `${apiBaseUrl}/api/frames/tile/${layer}/${date}/${z}/${x}/${y}`;
}

/**
 * Get the appropriate format for a Terra layer
 * @param layer - Terra layer identifier
 * @returns Format string (e.g., 'image/jpeg', 'image/png')
 */
export function getLayerFormat(layer: string): string {
  const formatMap: Record<string, string> = {
    'MODIS_Terra_CorrectedReflectance_TrueColor': 'image/jpeg',
    'MODIS_Terra_CorrectedReflectance_Bands721': 'image/jpeg',
    'MODIS_Terra_CorrectedReflectance_Bands367': 'image/jpeg',
    'MODIS_Terra_SurfaceReflectance_Bands121': 'image/jpeg',
    'MODIS_Terra_Aerosol': 'image/png',
    'MODIS_Terra_Chlorophyll_A': 'image/png',
  };
  
  return formatMap[layer] || 'image/jpeg';
}

/**
 * Get the appropriate resolution for a Terra layer
 * @param layer - Terra layer identifier
 * @returns Resolution string (e.g., '250m', '500m', '1km')
 */
export function getLayerResolution(layer: string): string {
  const resolutionMap: Record<string, string> = {
    'MODIS_Terra_CorrectedReflectance_TrueColor': '250m',
    'MODIS_Terra_CorrectedReflectance_Bands721': '500m',
    'MODIS_Terra_CorrectedReflectance_Bands367': '500m',
    'MODIS_Terra_SurfaceReflectance_Bands121': '500m',
    'MODIS_Terra_Aerosol': '1km',
    'MODIS_Terra_Chlorophyll_A': '4km',
  };
  
  return resolutionMap[layer] || '250m';
}

/**
 * Generate tile coordinates for a bounding box at a specific zoom level
 * @param bbox - Bounding box with north, south, east, west coordinates
 * @param zoom - Zoom level
 * @returns Array of tile coordinates
 */
export function getTilesForBoundingBox(
  bbox: { north: number; south: number; east: number; west: number },
  zoom: number
): Array<{ x: number; y: number; z: number }> {
  const tiles: Array<{ x: number; y: number; z: number }> = [];
  
  // Convert lat/lng to tile coordinates
  const northWestTile = latLngToTile(bbox.north, bbox.west, zoom);
  const southEastTile = latLngToTile(bbox.south, bbox.east, zoom);
  
  // Generate all tiles in the bounding box
  for (let x = northWestTile.x; x <= southEastTile.x; x++) {
    for (let y = northWestTile.y; y <= southEastTile.y; y++) {
      tiles.push({ x, y, z: zoom });
    }
  }
  
  return tiles;
}

/**
 * Convert latitude/longitude to tile coordinates
 * @param lat - Latitude
 * @param lng - Longitude
 * @param zoom - Zoom level
 * @returns Tile coordinates
 */
export function latLngToTile(lat: number, lng: number, zoom: number): { x: number; y: number } {
  const n = Math.pow(2, zoom);
  const x = Math.floor(((lng + 180) / 360) * n);
  const y = Math.floor(((1 - Math.log(Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)) / Math.PI) / 2) * n);
  
  return { x, y };
}

/**
 * Prefetch tiles for animation to improve playback performance
 * @param layer - Terra layer identifier
 * @param dates - Array of dates to prefetch
 * @param tiles - Array of tile coordinates
 * @returns Promise that resolves when prefetching is complete
 */
export async function prefetchTilesForAnimation(
  layer: string,
  dates: string[],
  tiles: Array<{ x: number; y: number; z: number }>
): Promise<void> {
  const prefetchPromises: Promise<void>[] = [];
  
  // Limit concurrent requests to avoid overwhelming the server
  const maxConcurrent = 5;
  let currentIndex = 0;
  
  const processBatch = async (): Promise<void> => {
    const batch: Promise<void>[] = [];
    
    for (let i = 0; i < maxConcurrent && currentIndex < dates.length * tiles.length; i++) {
      const dateIndex = Math.floor(currentIndex / tiles.length);
      const tileIndex = currentIndex % tiles.length;
      
      if (dateIndex < dates.length && tileIndex < tiles.length) {
        const date = dates[dateIndex];
        const tile = tiles[tileIndex];
        
        batch.push(prefetchSingleTile(layer, date, tile.z, tile.x, tile.y));
        currentIndex++;
      }
    }
    
    await Promise.all(batch);
    
    if (currentIndex < dates.length * tiles.length) {
      await processBatch();
    }
  };
  
  await processBatch();
}

/**
 * Prefetch a single tile
 * @param layer - Terra layer identifier
 * @param date - Date string
 * @param z - Zoom level
 * @param x - Tile X coordinate
 * @param y - Tile Y coordinate
 * @returns Promise that resolves when tile is prefetched
 */
async function prefetchSingleTile(
  layer: string,
  date: string,
  z: number,
  x: number,
  y: number
): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => resolve();
    img.onerror = () => resolve(); // Continue even if tile fails to load
    
    img.src = getTerraTileURL(layer, date, z, x, y);
  });
}

/**
 * Generate date range between two dates
 * @param startDate - Start date in YYYY-MM-DD format
 * @param endDate - End date in YYYY-MM-DD format
 * @returns Array of date strings
 */
export function generateDateRange(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  const currentDate = new Date(start);
  while (currentDate <= end) {
    dates.push(currentDate.toISOString().split('T')[0]);
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return dates;
}

/**
 * Validate Terra layer identifier
 * @param layer - Layer identifier to validate
 * @returns True if layer is valid
 */
export function isValidTerraLayer(layer: string): boolean {
  const validLayers = [
    'MODIS_Terra_CorrectedReflectance_TrueColor',
    'MODIS_Terra_CorrectedReflectance_Bands721',
    'MODIS_Terra_CorrectedReflectance_Bands367',
    'MODIS_Terra_SurfaceReflectance_Bands121',
    'MODIS_Terra_Aerosol',
    'MODIS_Terra_Chlorophyll_A',
  ];
  
  return validLayers.includes(layer);
}

/**
 * Get layer information including name, description, and resolution
 * @param layer - Layer identifier
 * @returns Layer information object
 */
export function getLayerInfo(layer: string): {
  id: string;
  name: string;
  description: string;
  resolution: string;
} | null {
  const layerInfo: Record<string, any> = {
    'MODIS_Terra_CorrectedReflectance_TrueColor': {
      id: layer,
      name: 'True Color',
      description: 'Natural color imagery as the human eye would see',
      resolution: '250m',
    },
    'MODIS_Terra_CorrectedReflectance_Bands721': {
      id: layer,
      name: 'False Color (721)',
      description: 'Infrared false color highlighting vegetation and fires',
      resolution: '500m',
    },
    'MODIS_Terra_CorrectedReflectance_Bands367': {
      id: layer,
      name: 'Enhanced Vegetation',
      description: 'Vegetation enhancement and atmospheric penetration',
      resolution: '500m',
    },
    'MODIS_Terra_SurfaceReflectance_Bands121': {
      id: layer,
      name: 'Surface Reflectance',
      description: 'Atmospheric correction for surface analysis',
      resolution: '500m',
    },
    'MODIS_Terra_Aerosol': {
      id: layer,
      name: 'Aerosol Optical Depth',
      description: 'Atmospheric aerosol and pollution monitoring',
      resolution: '1km',
    },
    'MODIS_Terra_Chlorophyll_A': {
      id: layer,
      name: 'Ocean Chlorophyll',
      description: 'Marine phytoplankton and ocean productivity',
      resolution: '4km',
    },
  };
  
  return layerInfo[layer] || null;
}