/**
 * NASA GIBS WMTS Service
 * Integration with NASA Global Imagery Browse Services for Terra satellite data
 */

import axios from 'axios';
import { logger } from '../utils/logger';

export interface TerraLayer {
  name: string;
  displayName: string;
  description: string;
  wmtsLayer: string;
  tileMatrixSet: string;
  format: string;
  temporal: boolean;
  maxZoom: number;
}

export interface TileRequest {
  layer: string;
  date: string;
  z: number;
  x: number;
  y: number;
  format?: string;
}

export interface BoundingBox {
  north: number;
  south: number;
  east: number;
  west: number;
}

// Terra satellite layers available via GIBS WMTS
export const TERRA_LAYERS: Record<string, TerraLayer> = {
  'MODIS_Terra_CorrectedReflectance_TrueColor': {
    name: 'MODIS_Terra_CorrectedReflectance_TrueColor',
    displayName: 'Terra True Color',
    description: 'MODIS Terra Corrected Reflectance (True Color)',
    wmtsLayer: 'MODIS_Terra_CorrectedReflectance_TrueColor',
    tileMatrixSet: 'GoogleMapsCompatible_Level9',
    format: 'image/jpeg',
    temporal: true,
    maxZoom: 9
  },
  'MODIS_Terra_CorrectedReflectance_Bands367': {
    name: 'MODIS_Terra_CorrectedReflectance_Bands367',
    displayName: 'Terra False Color (367)',
    description: 'MODIS Terra Corrected Reflectance (Bands 3-6-7)',
    wmtsLayer: 'MODIS_Terra_CorrectedReflectance_Bands367',
    tileMatrixSet: 'GoogleMapsCompatible_Level9',
    format: 'image/jpeg',
    temporal: true,
    maxZoom: 9
  },
  'MODIS_Terra_Aerosol': {
    name: 'MODIS_Terra_Aerosol',
    displayName: 'Terra Aerosol Optical Depth',
    description: 'MODIS Terra Aerosol Optical Depth at 550nm',
    wmtsLayer: 'MODIS_Terra_Aerosol',
    tileMatrixSet: 'GoogleMapsCompatible_Level9',
    format: 'image/png',
    temporal: true,
    maxZoom: 6
  },
  'MODIS_Terra_Brightness_Temp_Band31_Day': {
    name: 'MODIS_Terra_Brightness_Temp_Band31_Day',
    displayName: 'Terra Brightness Temperature',
    description: 'MODIS Terra Brightness Temperature (Band 31, Day)',
    wmtsLayer: 'MODIS_Terra_Brightness_Temp_Band31_Day',
    tileMatrixSet: 'GoogleMapsCompatible_Level9',
    format: 'image/png',
    temporal: true,
    maxZoom: 6
  },
  'MODIS_Terra_Land_Surface_Temp_Day': {
    name: 'MODIS_Terra_Land_Surface_Temp_Day',
    displayName: 'Terra Land Surface Temperature',
    description: 'MODIS Terra Land Surface Temperature (Day)',
    wmtsLayer: 'MODIS_Terra_Land_Surface_Temp_Day',
    tileMatrixSet: 'GoogleMapsCompatible_Level9',
    format: 'image/png',
    temporal: true,
    maxZoom: 6
  },
  'MODIS_Terra_Snow_Cover': {
    name: 'MODIS_Terra_Snow_Cover',
    displayName: 'Terra Snow Cover',
    description: 'MODIS Terra Snow Cover (Normalized Difference Snow Index)',
    wmtsLayer: 'MODIS_Terra_Snow_Cover',
    tileMatrixSet: 'GoogleMapsCompatible_Level9',
    format: 'image/png',
    temporal: true,
    maxZoom: 8
  }
};

export class GIBSService {
  private baseUrl: string;
  private earthdataToken: string;

  constructor() {
    this.baseUrl = process.env.NASA_GIBS_BASE_URL || 'https://gibs.earthdata.nasa.gov/wmts/epsg4326/best/wmts.cgi';
    this.earthdataToken = process.env.EARTHDATA_TOKEN || '';
  }

  /**
   * Generate WMTS tile URL for Terra satellite data
   */
  generateTileUrl(request: TileRequest): string {
    const layer = TERRA_LAYERS[request.layer];
    if (!layer) {
      throw new Error(`Unknown Terra layer: ${request.layer}`);
    }

    const format = request.format || layer.format;
    const tileMatrixSet = layer.tileMatrixSet;

    // Format date for GIBS (YYYY-MM-DD)
    const formattedDate = request.date;

    const url = `${this.baseUrl}/${layer.wmtsLayer}/default/${formattedDate}/${tileMatrixSet}/${request.z}/${request.y}/${request.x}.${this.getFileExtension(format)}`;

    return url;
  }

  /**
   * Fetch Terra satellite tile from NASA GIBS
   */
  async fetchTile(request: TileRequest): Promise<Buffer> {
    try {
      const url = this.generateTileUrl(request);
      
      logger.debug(`Fetching Terra tile: ${url}`);

      const response = await axios({
        method: 'GET',
        url,
        responseType: 'arraybuffer',
        headers: {
          'Authorization': `Bearer ${this.earthdataToken}`,
          'User-Agent': 'Terra25/1.0.0'
        },
        timeout: 15000 // 15 second timeout
      });

      if (response.status !== 200) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return Buffer.from(response.data);

    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          logger.warn(`Terra tile not available: ${request.layer} ${request.date} z${request.z}/${request.x}/${request.y}`);
          throw new Error(`Tile not available for the specified date and location`);
        }
        if (error.response?.status === 401) {
          logger.error('NASA Earthdata authentication failed');
          throw new Error('NASA Earthdata authentication failed');
        }
      }
      
      logger.error('Error fetching Terra tile:', error);
      throw new Error(`Failed to fetch tile: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get tiles for a specific date and bounding box
   */
  async getTilesForRegion(
    layer: string,
    date: string,
    boundingBox: BoundingBox,
    zoomLevel: number = 4
  ): Promise<{ tiles: Buffer[], tileInfo: TileRequest[] }> {
    const layerInfo = TERRA_LAYERS[layer];
    if (!layerInfo) {
      throw new Error(`Unknown Terra layer: ${layer}`);
    }

    const maxZoom = Math.min(zoomLevel, layerInfo.maxZoom);
    const tiles: Buffer[] = [];
    const tileInfo: TileRequest[] = [];

    // Calculate tile coordinates for the bounding box
    const tileCoords = this.getBoundingBoxTiles(boundingBox, maxZoom);

    logger.info(`Fetching ${tileCoords.length} Terra tiles for ${layer} on ${date}`);

    // Fetch tiles with concurrency limit
    const concurrencyLimit = 5;
    for (let i = 0; i < tileCoords.length; i += concurrencyLimit) {
      const batch = tileCoords.slice(i, i + concurrencyLimit);
      
      const batchPromises = batch.map(async (coord) => {
        const request: TileRequest = {
          layer,
          date,
          z: coord.z,
          x: coord.x,
          y: coord.y
        };

        try {
          const tileBuffer = await this.fetchTile(request);
          tiles.push(tileBuffer);
          tileInfo.push(request);
          return { success: true, coord };
        } catch (error) {
          logger.warn(`Failed to fetch tile ${coord.z}/${coord.x}/${coord.y}:`, error);
          return { success: false, coord, error };
        }
      });

      await Promise.all(batchPromises);
    }

    logger.info(`Successfully fetched ${tiles.length}/${tileCoords.length} Terra tiles`);

    return { tiles, tileInfo };
  }

  /**
   * Calculate tile coordinates for a bounding box at a given zoom level
   */
  private getBoundingBoxTiles(bbox: BoundingBox, zoom: number): Array<{z: number, x: number, y: number}> {
    const tiles: Array<{z: number, x: number, y: number}> = [];

    // Convert lat/lon to tile coordinates
    const minTileX = this.lonToTileX(bbox.west, zoom);
    const maxTileX = this.lonToTileX(bbox.east, zoom);
    const minTileY = this.latToTileY(bbox.north, zoom);
    const maxTileY = this.latToTileY(bbox.south, zoom);

    // Generate tile coordinates
    for (let x = minTileX; x <= maxTileX; x++) {
      for (let y = minTileY; y <= maxTileY; y++) {
        tiles.push({ z: zoom, x, y });
      }
    }

    return tiles;
  }

  /**
   * Convert longitude to tile X coordinate
   */
  private lonToTileX(lon: number, zoom: number): number {
    return Math.floor((lon + 180) / 360 * Math.pow(2, zoom));
  }

  /**
   * Convert latitude to tile Y coordinate
   */
  private latToTileY(lat: number, zoom: number): number {
    const latRad = lat * Math.PI / 180;
    return Math.floor((1 - Math.asinh(Math.tan(latRad)) / Math.PI) / 2 * Math.pow(2, zoom));
  }

  /**
   * Get file extension from MIME type
   */
  private getFileExtension(mimeType: string): string {
    switch (mimeType) {
      case 'image/jpeg':
        return 'jpg';
      case 'image/png':
        return 'png';
      case 'image/tiff':
        return 'tif';
      default:
        return 'jpg';
    }
  }

  /**
   * Validate date format and availability
   */
  validateDate(date: string): boolean {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return false;
    }

    const parsedDate = new Date(date);
    const now = new Date();
    const terraLaunchDate = new Date('1999-12-18'); // Terra satellite launch date

    return parsedDate >= terraLaunchDate && parsedDate <= now;
  }

  /**
   * Get available Terra layers
   */
  getAvailableLayers(): TerraLayer[] {
    return Object.values(TERRA_LAYERS);
  }

  /**
   * Test NASA GIBS connectivity
   */
  async testConnection(): Promise<boolean> {
    try {
      // Test with a simple True Color tile
      const testRequest: TileRequest = {
        layer: 'MODIS_Terra_CorrectedReflectance_TrueColor',
        date: '2024-01-01',
        z: 1,
        x: 0,
        y: 0
      };

      await this.fetchTile(testRequest);
      logger.info('NASA GIBS connection test successful');
      return true;
    } catch (error) {
      logger.error('NASA GIBS connection test failed:', error);
      return false;
    }
  }
}

export const gibsService = new GIBSService();