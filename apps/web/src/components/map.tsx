'use client'

import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import { MapViewState } from '@/types'

interface MapProps {
  viewState: MapViewState
  onViewStateChange: (viewState: MapViewState) => void
  layers?: any[]
  className?: string
}

export function Map({ 
  viewState, 
  onViewStateChange, 
  layers = [], 
  className = "w-full h-full" 
}: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<maplibregl.Map | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    if (!mapContainer.current || map.current) return

    // Initialize map
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          'osm': {
            type: 'raster',
            tiles: [
              'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
              'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
              'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png'
            ],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors'
          }
        },
        layers: [
          {
            id: 'osm',
            type: 'raster',
            source: 'osm'
          }
        ]
      },
      center: [viewState.longitude, viewState.latitude],
      zoom: viewState.zoom,
      pitch: viewState.pitch || 0,
      bearing: viewState.bearing || 0,
    })

    // Add navigation controls
    map.current.addControl(new maplibregl.NavigationControl(), 'top-right')
    map.current.addControl(new maplibregl.ScaleControl({}), 'bottom-left')

    // Handle map interactions
    map.current.on('move', () => {
      if (!map.current) return
      
      const center = map.current.getCenter()
      const zoom = map.current.getZoom()
      const pitch = map.current.getPitch()
      const bearing = map.current.getBearing()

      onViewStateChange({
        longitude: center.lng,
        latitude: center.lat,
        zoom,
        pitch,
        bearing,
      })
    })

    map.current.on('load', () => {
      setIsLoaded(true)
    })

    return () => {
      if (map.current) {
        map.current.remove()
        map.current = null
      }
    }
  }, [])

  // Update map view when viewState changes externally
  useEffect(() => {
    if (!map.current || !isLoaded) return

    map.current.flyTo({
      center: [viewState.longitude, viewState.latitude],
      zoom: viewState.zoom,
      pitch: viewState.pitch || 0,
      bearing: viewState.bearing || 0,
      duration: 1000,
    })
  }, [viewState, isLoaded])

  // Add/update layers
  useEffect(() => {
    if (!map.current || !isLoaded) return

    // Remove existing Terra layers
    const existingLayers = map.current.getStyle().layers || []
    existingLayers.forEach((layer) => {
      if (layer.id.startsWith('terra-')) {
        map.current?.removeLayer(layer.id)
      }
    })

    // Remove existing Terra sources
    const existingSources = map.current.getStyle().sources || {}
    Object.keys(existingSources).forEach((sourceId) => {
      if (sourceId.startsWith('terra-')) {
        map.current?.removeSource(sourceId)
      }
    })

    // Add new layers
    layers.forEach((layer, index) => {
      if (!map.current) return

      const sourceId = `terra-${layer.id || index}`
      const layerId = `terra-layer-${layer.id || index}`

      // Add source
      map.current.addSource(sourceId, layer.source)

      // Add layer
      map.current.addLayer({
        id: layerId,
        type: layer.type || 'raster',
        source: sourceId,
        paint: layer.paint || {},
        layout: layer.layout || {},
      })
    })
  }, [layers, isLoaded])

  return (
    <div className={className}>
      <div 
        ref={mapContainer} 
        className="w-full h-full rounded-lg overflow-hidden"
        style={{ minHeight: '400px' }}
      />
      
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg">
          <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-300">
            <div className="animate-spin w-5 h-5 border-2 border-terra-500 border-t-transparent rounded-full" />
            <span>Loading map...</span>
          </div>
        </div>
      )}
    </div>
  )
}

// WMTS Layer Helper
export function createWMTSLayer(
  id: string,
  wmtsUrl: string,
  options: {
    opacity?: number
    minzoom?: number
    maxzoom?: number
  } = {}
) {
  return {
    id,
    source: {
      type: 'raster',
      tiles: [wmtsUrl],
      tileSize: 256,
      attribution: '© NASA GIBS',
    },
    type: 'raster',
    paint: {
      'raster-opacity': options.opacity || 1,
    },
    minzoom: options.minzoom || 0,
    maxzoom: options.maxzoom || 18,
  }
}

// NASA GIBS WMTS URL helper
export function buildGIBSUrl(
  layer: string,
  date: string,
  format: string = 'jpg'
): string {
  const baseUrl = 'https://gibs.earthdata.nasa.gov/wmts/epsg4326/best'
  return `${baseUrl}/${layer}/default/${date}/250m/{z}/{y}/{x}.${format}`
}