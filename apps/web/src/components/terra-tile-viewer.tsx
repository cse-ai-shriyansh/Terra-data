'use client'

import React, { useState, useEffect, useCallback } from 'react'

interface TerraTileViewerProps {
  initialDate?: string
  initialLayer?: string
  className?: string
}

/**
 * Terra Tile Viewer Component
 * Displays NASA Terra satellite imagery
 */
export function TerraTileViewer({ 
  initialDate = '2025-10-01', 
  initialLayer = 'MODIS_Terra_CorrectedReflectance_TrueColor',
  className = ''
}: TerraTileViewerProps) {
  const [date, setDate] = useState(initialDate)
  const [layer, setLayer] = useState(initialLayer)
  const [resolution, setResolution] = useState('250m')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [availableLayers, setAvailableLayers] = useState<any>({})
  const [imageLoaded, setImageLoaded] = useState(false)

  // Load available layers on component mount
  useEffect(() => {
    const loadLayers = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003'}/api/terra/layers`)
        const data = await response.json()
        if (data.success) {
          setAvailableLayers(data.layers)
        }
      } catch (error) {
        console.error('Failed to load Terra layers:', error)
      }
    }
    
    loadLayers()
  }, [])

  // Handle date change with validation
  const handleDateChange = useCallback((newDate: string) => {
    const today = new Date().toISOString().split('T')[0]
    if (newDate > today) {
      setError('Cannot select future dates')
      return
    }
    
    setError(null)
    setDate(newDate)
    setImageLoaded(false)
  }, [])

  // Generate animation sequence
  const generateAnimation = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const startDate = new Date(date)
      startDate.setDate(startDate.getDate() - 7) // 7 days before
      const endDate = date
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003'}/api/terra/sequence`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate: startDate.toISOString().split('T')[0],
          endDate,
          z: 3, // Global view
          x: 4,
          y: 2,
          layer,
          resolution,
          saveLocal: false,
          concurrency: 2
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        console.log(`✅ Generated ${data.successfulTiles} tiles for animation`)
        alert(`Animation ready! Generated ${data.successfulTiles}/${data.totalTiles} tiles`)
      } else {
        throw new Error('Failed to generate animation sequence')
      }
      
    } catch (error) {
      setError(`Failed to generate animation: ${(error as Error).message}`)
    } finally {
      setIsLoading(false)
    }
  }, [date, layer, resolution])

  const tileUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003'}/api/terra/tile/${date}/3/4/2?layer=${layer}&resolution=${resolution}`

  return (
    <div className={`terra-tile-viewer ${className}`}>
      {/* Controls */}
      <div className="bg-white p-4 shadow-lg rounded-lg mb-4 border border-gray-200">
        <h3 className="text-lg font-semibold mb-4 text-gray-900">🛰️ NASA Terra Satellite Data</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Date Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📅 Date
            </label>
            <div className="relative">
              <input
                type="date"
                value={date}
                onChange={(e) => handleDateChange(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border-2 border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-blue-50 font-semibold text-blue-900"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <span className="text-blue-600 text-sm font-medium">
                  {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
            </div>
          </div>

          {/* Layer Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Layer
            </label>
            <select
              value={layer}
              onChange={(e) => { setLayer(e.target.value); setImageLoaded(false) }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Object.entries(availableLayers).map(([key, info]: [string, any]) => (
                <option key={key} value={key}>
                  {info?.description || key}
                </option>
              ))}
            </select>
          </div>

          {/* Resolution Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Resolution
            </label>
            <select
              value={resolution}
              onChange={(e) => { setResolution(e.target.value); setImageLoaded(false) }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="250m">250m</option>
              <option value="500m">500m</option>
              <option value="1km">1km</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <div className="px-3 py-2 bg-gray-50 rounded-md text-sm">
              {imageLoaded ? (
                <span className="text-green-600">✅ Loaded</span>
              ) : (
                <span className="text-yellow-600">⏳ Loading...</span>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={generateAnimation}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? '⏳ Generating...' : '🎬 Generate Animation'}
          </button>
          
          <button
            onClick={() => window.open(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003'}/api/terra/url/${date}/3/4/2?layer=${layer}&resolution=${resolution}`, '_blank')}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            🔗 Get Direct URL
          </button>

          <button
            onClick={() => { setImageLoaded(false); window.location.reload() }}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            🔄 Refresh
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            ❌ {error}
          </div>
        )}

        {/* Info */}
        <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
          <p className="text-sm text-gray-800">
            📡 Current: <span className="font-semibold text-blue-800">{layer.replace(/_/g, ' ')}</span> | 
            <span className="font-semibold text-green-800">{resolution}</span> | 
            <span className="font-bold text-purple-800 bg-purple-100 px-2 py-1 rounded">{new Date(date).toLocaleDateString('en-US', { 
              weekday: 'short', 
              year: 'numeric', 
              month: 'short', 
              day: 'numeric' 
            })}</span>
          </p>
          <p className="text-sm text-gray-700 mt-1">🌍 Data source: NASA GIBS WMTS API</p>
        </div>
      </div>

      {/* Satellite Image Display */}
      <div className="h-96 rounded-lg overflow-hidden shadow-lg bg-gray-100 flex items-center justify-center">
        <div className="text-center max-w-full">
          {!imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
              <div className="text-center">
                <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                <p className="text-gray-600">Loading Terra satellite data...</p>
              </div>
            </div>
          )}
          <img 
            src={tileUrl}
            alt={`Terra satellite imagery for ${date}`}
            className={`max-w-full h-auto rounded-lg shadow-md transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setImageLoaded(true)}
            onError={(e) => {
              console.error('Failed to load Terra tile:', tileUrl)
              setError('Failed to load satellite imagery. The tile may not be available for this date.')
              const target = e.target as HTMLImageElement
              target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjU2IiBoZWlnaHQ9IjI1NiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjU2IiBoZWlnaHQ9IjI1NiIgZmlsbD0iI2YzZjRmNiIvPjx0ZXh0IHg9IjEyOCIgeT0iMTI4IiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNiIgZmlsbD0iIzZiNzI4MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkZhaWxlZCB0byBsb2FkPC90ZXh0Pjwvc3ZnPg=='
            }}
          />
          {imageLoaded && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-700 font-medium">
                🛰️ Terra satellite tile for <span className="font-bold text-blue-800 bg-blue-100 px-2 py-1 rounded">{new Date(date).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</span>
              </p>
              <p className="text-sm text-gray-600 mt-1">
                📍 Global view - Z:3, X:4, Y:2
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Layer: {layer.replace(/_/g, ' ')} • Resolution: {resolution}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}