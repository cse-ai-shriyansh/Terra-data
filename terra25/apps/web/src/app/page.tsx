/**
 * Terra25 Main Landing Page
 * Interactive animated Terra satellite data visualization portal
 */
'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { MapPlayer } from '@/components/MapPlayer';
import { ControlPanel } from '@/components/ControlPanel';
import { Play, Pause, Download, Info } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

// Dynamically import map component to avoid SSR issues
const DynamicMapPlayer = dynamic(() => import('@/components/MapPlayer'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-gray-100 animate-pulse flex items-center justify-center">
      <div className="text-gray-500">Loading Terra Map...</div>
    </div>
  ),
});

interface AnimationState {
  isPlaying: boolean;
  currentFrame: number;
  totalFrames: number;
  fps: number;
}

interface BoundingBox {
  north: number;
  south: number;
  east: number;
  west: number;
}

export default function HomePage() {
  const [animationState, setAnimationState] = useState<AnimationState>({
    isPlaying: false,
    currentFrame: 0,
    totalFrames: 0,
    fps: 2,
  });

  const [selectedLayer, setSelectedLayer] = useState('MODIS_Terra_CorrectedReflectance_TrueColor');
  const [dateRange, setDateRange] = useState({
    start: '2024-01-01',
    end: '2024-01-07',
  });
  const [boundingBox, setBoundingBox] = useState<BoundingBox | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Handle animation playback
  const togglePlayback = () => {
    setAnimationState(prev => ({
      ...prev,
      isPlaying: !prev.isPlaying,
    }));
  };

  // Generate animation frames
  const generateAnimation = async () => {
    if (!boundingBox) {
      toast.error('Please select an area on the map first');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ingest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          layer: selectedLayer,
          dateRange,
          boundingBox,
        }),
      });

      if (!response.ok) throw new Error('Failed to generate animation');
      
      const result = await response.json();
      toast.success(`Animation generated with ${result.frameCount} frames`);
      
      setAnimationState(prev => ({
        ...prev,
        totalFrames: result.frameCount,
        currentFrame: 0,
      }));
    } catch (error) {
      toast.error('Failed to generate animation');
      console.error('Generation error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Export animation
  const exportAnimation = async (format: 'mp4' | 'gif') => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          layer: selectedLayer,
          dateRange,
          boundingBox,
          format,
          fps: animationState.fps,
        }),
      });

      if (!response.ok) throw new Error('Export failed');
      
      const result = await response.json();
      toast.success(`Export started! Job ID: ${result.jobId}`);
    } catch (error) {
      toast.error('Export failed');
      console.error('Export error:', error);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <Toaster position="top-right" />
      
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-terra-400 to-terra-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">T25</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Terra25 Animated Data Portal</h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <button
            onClick={() => window.open('/docs', '_blank')}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <Info size={18} />
            <span>Documentation</span>
          </button>
          
          <a
            href="https://github.com/your-repo/terra25"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
          >
            View on GitHub
          </a>
        </div>
      </header>

      <div className="flex-1 flex">
        {/* Control Panel Sidebar */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          <ControlPanel
            selectedLayer={selectedLayer}
            onLayerChange={setSelectedLayer}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            boundingBox={boundingBox}
            onBoundingBoxChange={setBoundingBox}
            onGenerateAnimation={generateAnimation}
            isGenerating={isGenerating}
          />
          
          {/* Animation Controls */}
          <div className="p-4 border-t border-gray-200">
            <h3 className="text-lg font-semibold mb-4">Animation Controls</h3>
            
            <div className="space-y-4">
              {/* Play/Pause Button */}
              <button
                onClick={togglePlayback}
                disabled={animationState.totalFrames === 0}
                className="w-full flex items-center justify-center space-x-2 bg-terra-500 text-white px-4 py-3 rounded-lg hover:bg-terra-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {animationState.isPlaying ? <Pause size={20} /> : <Play size={20} />}
                <span>{animationState.isPlaying ? 'Pause' : 'Play'} Animation</span>
              </button>
              
              {/* Frame Info */}
              <div className="text-sm text-gray-600 text-center">
                Frame {animationState.currentFrame + 1} of {animationState.totalFrames}
              </div>
              
              {/* FPS Control */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Playback Speed: {animationState.fps} FPS
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="10"
                  step="0.5"
                  value={animationState.fps}
                  onChange={(e) => setAnimationState(prev => ({ ...prev, fps: parseFloat(e.target.value) }))}
                  className="w-full"
                />
              </div>
              
              {/* Export Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => exportAnimation('mp4')}
                  disabled={animationState.totalFrames === 0}
                  className="flex items-center justify-center space-x-1 bg-gray-600 text-white px-3 py-2 rounded text-sm hover:bg-gray-700 transition-colors disabled:opacity-50"
                >
                  <Download size={16} />
                  <span>MP4</span>
                </button>
                <button
                  onClick={() => exportAnimation('gif')}
                  disabled={animationState.totalFrames === 0}
                  className="flex items-center justify-center space-x-1 bg-gray-600 text-white px-3 py-2 rounded text-sm hover:bg-gray-700 transition-colors disabled:opacity-50"
                >
                  <Download size={16} />
                  <span>GIF</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Map Area */}
        <div className="flex-1 relative">
          <DynamicMapPlayer
            layer={selectedLayer}
            dateRange={dateRange}
            boundingBox={boundingBox}
            onBoundingBoxChange={setBoundingBox}
            animationState={animationState}
            onAnimationStateChange={setAnimationState}
          />
          
          {/* Loading Overlay */}
          {isGenerating && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 flex items-center space-x-4">
                <div className="animate-spin w-6 h-6 border-2 border-terra-500 border-t-transparent rounded-full"></div>
                <span className="text-gray-700">Generating animation frames...</span>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Status Bar */}
      <footer className="bg-gray-100 border-t border-gray-200 px-6 py-2 flex items-center justify-between text-sm text-gray-600">
        <div className="flex items-center space-x-4">
          <span>Layer: {selectedLayer}</span>
          <span>•</span>
          <span>Range: {dateRange.start} to {dateRange.end}</span>
          {boundingBox && (
            <>
              <span>•</span>
              <span>Area: {boundingBox.west.toFixed(2)}, {boundingBox.south.toFixed(2)} to {boundingBox.east.toFixed(2)}, {boundingBox.north.toFixed(2)}</span>
            </>
          )}
        </div>
        <div>
          Powered by NASA Terra Satellite Data
        </div>
      </footer>
    </div>
  );
}