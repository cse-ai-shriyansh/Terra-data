/**
 * MapPlayer Component
 * Interactive Leaflet map that animates WMTS tiles from NASA Terra satellite
 * Supports bounding box selection and real-time tile animation
 */
'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { MapContainer, TileLayer, useMap, useMapEvents, Rectangle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getTerraTileURL } from '@/lib/wmts';
import { format, addDays, parseISO } from 'date-fns';

// Fix for default markers in React Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface BoundingBox {
  north: number;
  south: number;
  east: number;
  west: number;
}

interface AnimationState {
  isPlaying: boolean;
  currentFrame: number;
  totalFrames: number;
  fps: number;
}

interface MapPlayerProps {
  layer: string;
  dateRange: { start: string; end: string };
  boundingBox: BoundingBox | null;
  onBoundingBoxChange: (bbox: BoundingBox | null) => void;
  animationState: AnimationState;
  onAnimationStateChange: (state: AnimationState) => void;
}

interface MapControllerProps {
  layer: string;
  dateRange: { start: string; end: string };
  animationState: AnimationState;
  onAnimationStateChange: (state: AnimationState) => void;
}

// Component to handle map events and tile updates
function MapController({ layer, dateRange, animationState, onAnimationStateChange }: MapControllerProps) {
  const map = useMap();
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Generate date frames between start and end dates
  const generateDateFrames = useCallback(() => {
    const frames: string[] = [];
    const startDate = parseISO(dateRange.start);
    const endDate = parseISO(dateRange.end);
    
    let currentDate = startDate;
    while (currentDate <= endDate) {
      frames.push(format(currentDate, 'yyyy-MM-dd'));
      currentDate = addDays(currentDate, 1);
    }
    
    return frames;
  }, [dateRange]);

  // Update tile layer with current frame
  const updateTileLayer = useCallback((frameIndex: number) => {
    const frames = generateDateFrames();
    if (frames.length === 0) return;

    const currentDate = frames[frameIndex] || frames[0];
    const tileUrl = getTerraTileURL(layer, currentDate, '{z}', '{x}', '{y}');

    // Remove existing tile layer
    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    // Add new tile layer
    const newTileLayer = L.tileLayer(tileUrl, {
      attribution: '© NASA Terra Satellite',
      maxZoom: 9,
      opacity: 0.8,
      crossOrigin: true,
    });

    tileLayerRef.current = newTileLayer;
    map.addLayer(newTileLayer);

    // Update animation state
    onAnimationStateChange({
      ...animationState,
      currentFrame: frameIndex,
      totalFrames: frames.length,
    });
  }, [layer, animationState, onAnimationStateChange, generateDateFrames, map]);

  // Handle animation playback
  useEffect(() => {
    if (animationState.isPlaying && animationState.totalFrames > 0) {
      intervalRef.current = setInterval(() => {
        const nextFrame = (animationState.currentFrame + 1) % animationState.totalFrames;
        updateTileLayer(nextFrame);
      }, 1000 / animationState.fps);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [animationState.isPlaying, animationState.fps, animationState.currentFrame, animationState.totalFrames, updateTileLayer]);

  // Initialize with first frame
  useEffect(() => {
    const frames = generateDateFrames();
    if (frames.length > 0) {
      onAnimationStateChange({
        ...animationState,
        totalFrames: frames.length,
        currentFrame: 0,
      });
      updateTileLayer(0);
    }
  }, [layer, dateRange, generateDateFrames, onAnimationStateChange, updateTileLayer]);

  return null;
}

// Component to handle bounding box selection
function BoundingBoxSelector({ 
  boundingBox, 
  onBoundingBoxChange 
}: { 
  boundingBox: BoundingBox | null;
  onBoundingBoxChange: (bbox: BoundingBox | null) => void;
}) {
  const [isSelecting, setIsSelecting] = useState(false);
  const [startPoint, setStartPoint] = useState<L.LatLng | null>(null);

  const map = useMapEvents({
    mousedown(e) {
      if (e.originalEvent.shiftKey) {
        setIsSelecting(true);
        setStartPoint(e.latlng);
      }
    },
    mousemove(e) {
      if (isSelecting && startPoint) {
        const currentBounds = L.latLngBounds(startPoint, e.latlng);
        const bbox: BoundingBox = {
          north: currentBounds.getNorth(),
          south: currentBounds.getSouth(),
          east: currentBounds.getEast(),
          west: currentBounds.getWest(),
        };
        onBoundingBoxChange(bbox);
      }
    },
    mouseup(e) {
      if (isSelecting && startPoint) {
        const finalBounds = L.latLngBounds(startPoint, e.latlng);
        const bbox: BoundingBox = {
          north: finalBounds.getNorth(),
          south: finalBounds.getSouth(),
          east: finalBounds.getEast(),
          west: finalBounds.getWest(),
        };
        onBoundingBoxChange(bbox);
        setIsSelecting(false);
        setStartPoint(null);
      }
    },
    dblclick() {
      // Clear selection on double click
      onBoundingBoxChange(null);
    }
  });

  return boundingBox ? (
    <Rectangle
      bounds={[
        [boundingBox.south, boundingBox.west],
        [boundingBox.north, boundingBox.east]
      ]}
      pathOptions={{
        color: '#ff0000',
        weight: 2,
        fillOpacity: 0.1
      }}
    />
  ) : null;
}

export function MapPlayer({ 
  layer, 
  dateRange, 
  boundingBox, 
  onBoundingBoxChange, 
  animationState, 
  onAnimationStateChange 
}: MapPlayerProps) {
  const mapRef = useRef<L.Map | null>(null);

  return (
    <div className="h-full w-full relative">
      {/* Instructions Overlay */}
      <div className="absolute top-4 left-4 z-[1000] bg-white bg-opacity-90 rounded-lg p-3 shadow-lg max-w-sm">
        <h3 className="font-semibold text-sm mb-2">How to use:</h3>
        <ul className="text-xs text-gray-600 space-y-1">
          <li>• Hold <kbd className="bg-gray-200 px-1 rounded">Shift</kbd> + drag to select area</li>
          <li>• Double-click to clear selection</li>
          <li>• Use controls to generate animation</li>
          <li>• Zoom in/out to see different detail levels</li>
        </ul>
      </div>

      {/* Current Date Display */}
      <div className="absolute top-4 right-4 z-[1000] bg-black bg-opacity-70 text-white rounded-lg px-3 py-2">
        <div className="text-sm">
          Current Date: {(() => {
            const frames = [];
            const startDate = parseISO(dateRange.start);
            const endDate = parseISO(dateRange.end);
            let currentDate = startDate;
            while (currentDate <= endDate) {
              frames.push(format(currentDate, 'yyyy-MM-dd'));
              currentDate = addDays(currentDate, 1);
            }
            return frames[animationState.currentFrame] || dateRange.start;
          })()}
        </div>
      </div>

      <MapContainer
        center={[20, 0]} // Center on equator
        zoom={3}
        className="h-full w-full"
        ref={mapRef}
        scrollWheelZoom={true}
        doubleClickZoom={false} // Disable to allow our double-click handler
      >
        {/* Base map layer */}
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="© OpenStreetMap contributors"
          opacity={0.3}
        />

        {/* Terra satellite data controller */}
        <MapController
          layer={layer}
          dateRange={dateRange}
          animationState={animationState}
          onAnimationStateChange={onAnimationStateChange}
        />

        {/* Bounding box selector */}
        <BoundingBoxSelector
          boundingBox={boundingBox}
          onBoundingBoxChange={onBoundingBoxChange}
        />
      </MapContainer>

      {/* Animation Status */}
      {animationState.isPlaying && (
        <div className="absolute bottom-4 left-4 z-[1000] bg-terra-500 text-white rounded-lg px-3 py-2 flex items-center space-x-2">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          <span className="text-sm">Playing at {animationState.fps} FPS</span>
        </div>
      )}
    </div>
  );
}

export default MapPlayer;