'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';

interface WorldMap {
  filename: string;
  path: string;
  thumbnail: string;
  date: string;
  size: number;
}

export default function WorldMapsPage() {
  const [worldMaps, setWorldMaps] = useState<WorldMap[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMap, setSelectedMap] = useState<WorldMap | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadWorldMaps();
  }, []);

  const loadWorldMaps = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005'}/api/world-maps`);
      const data = await response.json();
      
      if (data.success) {
        setWorldMaps(data.maps);
      } else {
        setError('Failed to load world maps');
      }
    } catch (error) {
      setError('Error loading world maps');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            🗺️ Terra World Maps
          </h1>
          <p className="text-xl text-gray-700 dark:text-gray-300 mb-4">
            Enhanced world map visualizations from NASA Terra satellite data
          </p>
          <div className="inline-flex items-center space-x-4 text-sm">
            <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full">
              🛰️ Terra Satellite Data
            </span>
            <span className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full">
              🌍 World Map Format
            </span>
            <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full">
              📅 2023 Data
            </span>
          </div>
        </div>

        {loading && (
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading world maps...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            ❌ {error}
          </div>
        )}

        {!loading && !error && worldMaps.length === 0 && (
          <div className="text-center bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
            <p className="mb-2">📭 No world maps found yet!</p>
            <p className="text-sm">World maps will appear here after they are generated from your Terra satellite data.</p>
          </div>
        )}

        {/* World Maps Grid */}
        {!loading && worldMaps.length > 0 && (
          <>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6 mb-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                  World Map Gallery
                </h2>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {worldMaps.length} maps available
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {worldMaps.map((map, index) => (
                  <div 
                    key={map.filename}
                    className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600 hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => setSelectedMap(map)}
                  >
                    <div className="aspect-video bg-gray-200 dark:bg-gray-600 rounded-lg mb-3 overflow-hidden">
                      <img
                        src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005'}${map.thumbnail}`}
                        alt={`Terra World Map - ${map.date}`}
                        className="w-full h-full object-cover hover:scale-105 transition-transform"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIyNSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIyNSIgZmlsbD0iI2YzZjRmNiIvPjx0ZXh0IHg9IjIwMCIgeT0iMTEyIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNiIgZmlsbD0iIzZiNzI4MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPldvcmxkIE1hcDwvdGV4dD48L3N2Zz4=';
                        }}
                      />
                    </div>
                    
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                      {formatDate(map.date)}
                    </h3>
                    
                    <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      <p>📅 Date: {map.date}</p>
                      <p>💾 Size: {formatFileSize(map.size)}</p>
                      <p>🖼️ Format: High-res JPEG</p>
                    </div>
                    
                    <button className="mt-3 w-full px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm">
                      🔍 View Full Size
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Statistics */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                📊 World Maps Statistics
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {worldMaps.length}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total Maps</div>
                </div>
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {formatFileSize(worldMaps.reduce((total, map) => total + map.size, 0))}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total Size</div>
                </div>
                <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    1920×1080
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Resolution</div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Full Size Modal */}
        {selectedMap && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="max-w-6xl max-h-full bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Terra World Map - {formatDate(selectedMap.date)}
                  </h3>
                  <button 
                    onClick={() => setSelectedMap(null)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    ✕
                  </button>
                </div>
              </div>
              <div className="p-4">
                <img
                  src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005'}${selectedMap.path}`}
                  alt={`Terra World Map - ${selectedMap.date}`}
                  className="max-w-full max-h-[70vh] object-contain mx-auto"
                />
                <div className="mt-4 text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    NASA Terra Satellite Data • {selectedMap.date} • {formatFileSize(selectedMap.size)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}