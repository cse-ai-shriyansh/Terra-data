/**
 * Control Panel Component
 * Form interface for selecting Terra layers, date ranges, and triggering animations
 */
'use client';

import { useState, useEffect } from 'react';
import { Calendar, Map, Layers, Zap, MapPin } from 'lucide-react';

interface BoundingBox {
  north: number;
  south: number;
  east: number;
  west: number;
}

interface ControlPanelProps {
  selectedLayer: string;
  onLayerChange: (layer: string) => void;
  dateRange: { start: string; end: string };
  onDateRangeChange: (range: { start: string; end: string }) => void;
  boundingBox: BoundingBox | null;
  onBoundingBoxChange: (bbox: BoundingBox | null) => void;
  onGenerateAnimation: () => void;
  isGenerating: boolean;
}

// Available Terra layers
const TERRA_LAYERS = [
  {
    id: 'MODIS_Terra_CorrectedReflectance_TrueColor',
    name: 'True Color',
    description: 'Natural color imagery as the human eye would see',
    resolution: '250m',
  },
  {
    id: 'MODIS_Terra_CorrectedReflectance_Bands721',
    name: 'False Color (721)',
    description: 'Infrared false color highlighting vegetation and fires',
    resolution: '500m',
  },
  {
    id: 'MODIS_Terra_CorrectedReflectance_Bands367',
    name: 'Enhanced Vegetation',
    description: 'Vegetation enhancement and atmospheric penetration',
    resolution: '500m',
  },
  {
    id: 'MODIS_Terra_SurfaceReflectance_Bands121',
    name: 'Surface Reflectance',
    description: 'Atmospheric correction for surface analysis',
    resolution: '500m',
  },
  {
    id: 'MODIS_Terra_Aerosol',
    name: 'Aerosol Optical Depth',
    description: 'Atmospheric aerosol and pollution monitoring',
    resolution: '1km',
  },
  {
    id: 'MODIS_Terra_Chlorophyll_A',
    name: 'Ocean Chlorophyll',
    description: 'Marine phytoplankton and ocean productivity',
    resolution: '4km',
  },
];

// Preset regions for quick selection
const PRESET_REGIONS = [
  {
    name: 'Global',
    bbox: { north: 85, south: -85, east: 180, west: -180 },
  },
  {
    name: 'North America',
    bbox: { north: 72, south: 15, east: -50, west: -170 },
  },
  {
    name: 'Amazon Basin',
    bbox: { north: 5, south: -20, east: -45, west: -80 },
  },
  {
    name: 'Africa',
    bbox: { north: 37, south: -35, east: 55, west: -20 },
  },
  {
    name: 'Arctic',
    bbox: { north: 85, south: 60, east: 180, west: -180 },
  },
  {
    name: 'Australia',
    bbox: { north: -10, south: -45, east: 155, west: 110 },
  },
];

export function ControlPanel({
  selectedLayer,
  onLayerChange,
  dateRange,
  onDateRangeChange,
  boundingBox,
  onBoundingBoxChange,
  onGenerateAnimation,
  isGenerating,
}: ControlPanelProps) {
  const [maxDate, setMaxDate] = useState('');

  // Set max date to today
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setMaxDate(today);
  }, []);

  // Calculate days between dates
  const getDayCount = () => {
    if (!dateRange.start || !dateRange.end) return 0;
    const start = new Date(dateRange.start);
    const end = new Date(dateRange.end);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  const handlePresetRegion = (region: typeof PRESET_REGIONS[0]) => {
    onBoundingBoxChange(region.bbox);
  };

  const clearBoundingBox = () => {
    onBoundingBoxChange(null);
  };

  const canGenerate = boundingBox && dateRange.start && dateRange.end && !isGenerating;

  return (
    <div className="p-4 space-y-6 overflow-y-auto">
      {/* Layer Selection */}
      <div>
        <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-3">
          <Layers size={16} />
          <span>Terra Satellite Layer</span>
        </label>
        <select
          value={selectedLayer}
          onChange={(e) => onLayerChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-terra-500 focus:border-transparent"
        >
          {TERRA_LAYERS.map((layer) => (
            <option key={layer.id} value={layer.id}>
              {layer.name} ({layer.resolution})
            </option>
          ))}
        </select>
        
        {/* Layer Description */}
        <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600">
          {TERRA_LAYERS.find(l => l.id === selectedLayer)?.description}
        </div>
      </div>

      {/* Date Range Selection */}
      <div>
        <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-3">
          <Calendar size={16} />
          <span>Date Range</span>
        </label>
        
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Start Date</label>
            <input
              type="date"
              value={dateRange.start}
              max={maxDate}
              onChange={(e) => onDateRangeChange({ ...dateRange, start: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-terra-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-xs text-gray-600 mb-1">End Date</label>
            <input
              type="date"
              value={dateRange.end}
              min={dateRange.start}
              max={maxDate}
              onChange={(e) => onDateRangeChange({ ...dateRange, end: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-terra-500 focus:border-transparent"
            />
          </div>
        </div>
        
        <div className="mt-2 text-xs text-gray-600">
          {getDayCount()} day{getDayCount() !== 1 ? 's' : ''} selected
        </div>
      </div>

      {/* Region Selection */}
      <div>
        <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-3">
          <Map size={16} />
          <span>Region Selection</span>
        </label>
        
        {/* Current Bounding Box */}
        {boundingBox ? (
          <div className="mb-3 p-3 bg-terra-50 rounded-lg border border-terra-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-terra-700">Selected Area</span>
              <button
                onClick={clearBoundingBox}
                className="text-xs text-red-600 hover:text-red-800"
              >
                Clear
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
              <div>North: {boundingBox.north.toFixed(2)}°</div>
              <div>South: {boundingBox.south.toFixed(2)}°</div>
              <div>East: {boundingBox.east.toFixed(2)}°</div>
              <div>West: {boundingBox.west.toFixed(2)}°</div>
            </div>
          </div>
        ) : (
          <div className="mb-3 p-3 bg-gray-50 rounded-lg border border-gray-200 text-center">
            <MapPin size={16} className="mx-auto mb-1 text-gray-400" />
            <div className="text-xs text-gray-600">
              No area selected. Hold Shift + drag on map to select.
            </div>
          </div>
        )}
        
        {/* Preset Regions */}
        <div>
          <label className="block text-xs text-gray-600 mb-2">Quick Regions</label>
          <div className="grid grid-cols-2 gap-2">
            {PRESET_REGIONS.map((region) => (
              <button
                key={region.name}
                onClick={() => handlePresetRegion(region)}
                className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
              >
                {region.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Animation Settings */}
      <div>
        <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-3">
          <Zap size={16} />
          <span>Animation Settings</span>
        </label>
        
        <div className="space-y-3 text-xs text-gray-600">
          <div className="flex justify-between">
            <span>Estimated frames:</span>
            <span className="font-medium">{getDayCount()}</span>
          </div>
          <div className="flex justify-between">
            <span>Animation duration (2 FPS):</span>
            <span className="font-medium">{(getDayCount() / 2).toFixed(1)}s</span>
          </div>
          <div className="flex justify-between">
            <span>Data source:</span>
            <span className="font-medium">NASA GIBS</span>
          </div>
        </div>
      </div>

      {/* Generate Animation Button */}
      <button
        onClick={onGenerateAnimation}
        disabled={!canGenerate}
        className="w-full flex items-center justify-center space-x-2 bg-terra-500 text-white px-4 py-3 rounded-lg hover:bg-terra-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
      >
        {isGenerating ? (
          <>
            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
            <span>Generating...</span>
          </>
        ) : (
          <>
            <Zap size={16} />
            <span>Generate Animation</span>
          </>
        )}
      </button>
      
      {!canGenerate && !isGenerating && (
        <div className="text-xs text-gray-500 text-center">
          {!boundingBox && 'Select an area on the map first'}
          {boundingBox && (!dateRange.start || !dateRange.end) && 'Set date range'}
        </div>
      )}

      {/* Tips */}
      <div className="mt-6 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <h4 className="text-sm font-medium text-blue-800 mb-2">💡 Tips</h4>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>• Smaller areas generate faster</li>
          <li>• 7-30 days work best for animations</li>
          <li>• True Color shows natural imagery</li>
          <li>• False Color reveals vegetation changes</li>
          <li>• Check cloud cover for your dates</li>
        </ul>
      </div>
    </div>
  );
}