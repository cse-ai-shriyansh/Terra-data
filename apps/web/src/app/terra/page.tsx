'use client'

import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import { TerraTileViewer } from '@/components/terra-tile-viewer'
import {
  exampleFetchSingleTile,
  exampleFetchTileSequence,
  examplePrefetchForAnimation,
} from '@/lib/terra-client'

export default function TerraDataPage() {
  const [apiStatus, setApiStatus] = useState<string>('checking...')
  const [examples, setExamples] = useState<Record<string, { status: string; result: any }>>({})

  // Check API status on mount
  useEffect(() => {
    const checkApiStatus = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003'}/health`)
        if (response.ok) {
          setApiStatus('✅ API Connected')
        } else {
          setApiStatus('❌ API Error')
        }
      } catch (error) {
        setApiStatus('❌ API Unavailable')
      }
    }
    
    checkApiStatus()
  }, [])

  // Run example functions
  const runExample = async (name: string, fn: () => Promise<any>) => {
    try {
      setExamples((prev: Record<string, { status: string; result: any }>) => ({ 
        ...prev, 
        [name]: { status: 'running...', result: null } 
      }))
      const result = await fn()
      setExamples((prev: Record<string, { status: string; result: any }>) => ({ 
        ...prev, 
        [name]: { status: '✅ Complete', result } 
      }))
    } catch (error) {
      setExamples((prev: Record<string, { status: string; result: any }>) => ({ 
        ...prev, 
        [name]: { status: '❌ Error', result: (error as Error).message } 
      }))
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          {/* Terra25 Logo */}
          <div className="flex justify-center mb-6">
            <Image src="/terra/logo.png" alt="Terra25" width={100} height={100} priority className="drop-shadow-lg" />
          </div>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
             NASA Terra Satellite Data Integration
          </h1>
          <p className="text-xl text-gray-600 mb-4">
            Real-time access to Terra satellite imagery via NASA GIBS WMTS API
          </p>
          <div className="inline-flex items-center space-x-4 text-sm mb-4">
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full">
              API Status: {apiStatus}
            </span>
            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full">
              🌍 Global Coverage
            </span>
            <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full">
              📅 Daily Updates
            </span>
          </div>
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-yellow-100 to-orange-100 px-4 py-2 rounded-lg border border-yellow-300">
            <span className="text-lg">📆</span>
            <span className="text-sm font-medium text-gray-700">Currently Viewing:</span>
            <span className="font-bold text-orange-800 bg-orange-200 px-3 py-1 rounded-full">
              {new Date('2025-10-01').toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </span>
          </div>
        </div>

        {/* Example Functions */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-gray-900">🧪 Example Functions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Single Tile Example */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold mb-2 text-gray-900">Single Tile Fetch</h3>
              <p className="text-sm text-gray-700 mb-3">
                Fetch one Terra tile for <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-1 rounded">October 1, 2025</span>
              </p>
              <button
                onClick={() => runExample('singleTile', exampleFetchSingleTile)}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                🌍 Run Example
              </button>
              {examples.singleTile && (
                <div className="mt-3 p-2 bg-gray-50 rounded text-xs border border-gray-200">
                  <p className="text-gray-900 font-medium">{examples.singleTile.status}</p>
                  {examples.singleTile.result && (
                    <a 
                      href={examples.singleTile.result} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-700 hover:text-blue-800 hover:underline break-all font-medium"
                    >
                      View Tile →
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Sequence Example */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold mb-2 text-gray-900">Tile Sequence</h3>
              <p className="text-sm text-gray-700 mb-3">
                Fetch multiple tiles (<span className="font-semibold text-green-700 bg-green-50 px-2 py-1 rounded">Sep 1-10, 2025</span>)
              </p>
              <button
                onClick={() => runExample('sequence', exampleFetchTileSequence)}
                className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
              >
                🎬 Run Example
              </button>
              {examples.sequence && (
                <div className="mt-3 p-2 bg-gray-50 rounded text-xs border border-gray-200">
                  <p className="text-gray-900 font-medium">{examples.sequence.status}</p>
                  {examples.sequence.result && (
                    <p className="text-green-700 font-medium">
                      {examples.sequence.result.successfulTiles}/{examples.sequence.result.totalTiles} tiles
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Prefetch Example */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold mb-2 text-gray-900">Animation Prefetch</h3>
              <p className="text-sm text-gray-700 mb-3">
                Prefetch tiles for smooth animation
              </p>
              <button
                onClick={() => runExample('prefetch', examplePrefetchForAnimation)}
                className="w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
              >
                📦 Run Example
              </button>
              {examples.prefetch && (
                <div className="mt-3 p-2 bg-gray-50 rounded text-xs border border-gray-200">
                  <p className="text-gray-900 font-medium">{examples.prefetch.status}</p>
                  {examples.prefetch.result && (
                    <p className="text-purple-700 font-medium">
                      {examples.prefetch.result.filter((t: any) => t.url).length}/
                      {examples.prefetch.result.length} tiles ready
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Interactive Terra Viewer */}
        <TerraTileViewer 
          initialDate="2025-10-01"
          initialLayer="MODIS_Terra_CorrectedReflectance_TrueColor"
          className="mb-8"
        />

        {/* API Documentation */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-semibold mb-4 text-gray-900">📚 API Reference</h2>
          
          <div className="space-y-6">
            {/* getTerraTile Function */}
            <div className="border-l-4 border-blue-500 pl-4">
              <h3 className="font-semibold text-lg text-gray-900">getTerraTile(date, z, x, y)</h3>
              <p className="text-gray-700 mb-2">
                Fetches a single Terra satellite tile from NASA GIBS WMTS API
              </p>
              <div className="bg-gray-100 rounded p-3 text-sm font-mono">
                <p className="text-gray-900"><strong>Parameters:</strong></p>
                <ul className="mt-2 space-y-1 text-gray-800">
                  <li>• <code className="bg-gray-200 px-1 rounded text-gray-900">date</code> (string): Date in YYYY-MM-DD format</li>
                  <li>• <code className="bg-gray-200 px-1 rounded text-gray-900">z</code> (number): Zoom level (0-9)</li>
                  <li>• <code className="bg-gray-200 px-1 rounded text-gray-900">x</code> (number): Tile X coordinate</li>
                  <li>• <code className="bg-gray-200 px-1 rounded text-gray-900">y</code> (number): Tile Y coordinate</li>
                </ul>
                <p className="mt-2 text-gray-900"><strong>Example URL:</strong></p>
                <p className="text-blue-700 break-all font-medium bg-blue-50 p-2 rounded border">
                  https://gibs.earthdata.nasa.gov/wmts/epsg4326/best/MODIS_Terra_CorrectedReflectance_TrueColor/default/<span className="bg-yellow-200 px-1 rounded font-bold">2025-10-01</span>/250m/3/4/2.jpg
                </p>
              </div>
            </div>

            {/* API Endpoints */}
            <div className="border-l-4 border-green-500 pl-4">
              <h3 className="font-semibold text-lg text-gray-900">API Endpoints</h3>
              <div className="space-y-2 text-sm">
                <div className="bg-gray-100 rounded p-2">
                  <code className="text-gray-900 font-medium">GET /api/terra/tile/:date/:z/:x/:y</code> - <span className="text-gray-700">Fetch single tile</span>
                </div>
                <div className="bg-gray-100 rounded p-2">
                  <code className="text-gray-900 font-medium">POST /api/terra/sequence</code> - <span className="text-gray-700">Fetch multiple tiles</span>
                </div>
                <div className="bg-gray-100 rounded p-2">
                  <code className="text-gray-900 font-medium">GET /api/terra/layers</code> - <span className="text-gray-700">Get available layers</span>
                </div>
                <div className="bg-gray-100 rounded p-2">
                  <code className="text-gray-900 font-medium">GET /api/terra/url/:date/:z/:x/:y</code> - <span className="text-gray-700">Get direct NASA URL</span>
                </div>
              </div>
            </div>

            {/* Available Layers */}
            <div className="border-l-4 border-purple-500 pl-4">
              <h3 className="font-semibold text-lg text-gray-900">Available Terra Layers</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <div className="bg-gray-50 rounded p-3 border border-gray-200">
                  <p className="font-medium text-gray-900">True Color</p>
                  <p className="text-sm text-gray-700">MODIS_Terra_CorrectedReflectance_TrueColor</p>
                </div>
                <div className="bg-gray-50 rounded p-3 border border-gray-200">
                  <p className="font-medium text-gray-900">Bands 7-2-1</p>
                  <p className="text-sm text-gray-700">MODIS_Terra_CorrectedReflectance_Bands721</p>
                </div>
                <div className="bg-gray-50 rounded p-3 border border-gray-200">
                  <p className="font-medium text-gray-900">Bands 3-6-7</p>
                  <p className="text-sm text-gray-700">MODIS_Terra_CorrectedReflectance_Bands367</p>
                </div>
                <div className="bg-gray-50 rounded p-3 border border-gray-200">
                  <p className="font-medium text-gray-900">Surface Reflectance</p>
                  <p className="text-sm text-gray-700">MODIS_Terra_SurfaceReflectance_Bands121</p>
                </div>
              </div>
            </div>

            {/* Usage Examples */}
            <div className="border-l-4 border-orange-500 pl-4">
              <h3 className="font-semibold text-lg text-gray-900">Usage Examples</h3>
              <div className="bg-gray-100 rounded p-4 text-sm border border-gray-200">
                <p className="font-medium mb-2 text-gray-900">Browser JavaScript:</p>
                <pre className="text-xs overflow-x-auto text-gray-800 bg-gray-50 p-3 rounded border">
{`import { terraClient } from './lib/terra-client'

// Fetch single tile
const tileUrl = await terraClient.getTerraTileUrl(
  '2025-10-01', 3, 4, 2
)

// Fetch sequence for animation
const sequence = await terraClient.fetchTerraSequence(
  '2025-09-01', '2025-09-10', 3, 4, 2
)

// Prefetch for smooth playback
const tiles = await terraClient.prefetchTilesForAnimation(
  ['2025-09-01', '2025-09-02', '2025-09-03'], 3, 4, 2
)`}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}