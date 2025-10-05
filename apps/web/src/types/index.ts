export interface TerraDataset {
  id: string
  name: string
  instrument: 'MODIS' | 'MOPITT' | 'MISR' | 'ASTER' | 'CERES'
  description: string
  resolution: string
  timespan: string
  sampleImageUrl?: string
  dataUrl: string
  wmtsUrl?: string
  categories: string[]
  impact: string
}

export interface AnimationFrame {
  id: string
  date: string
  imageUrl: string
  dataUrl?: string
  metadata?: Record<string, any>
}

export interface StoryConfig {
  id: string
  title: string
  description: string
  dataset: TerraDataset
  region: {
    bbox: [number, number, number, number] // [minLng, minLat, maxLng, maxLat]
    center: [number, number]
    zoom: number
  }
  timeRange: {
    start: string
    end: string
  }
  frameRate: number
  frames: AnimationFrame[]
}

export interface DataIngestionConfig {
  product: string
  date: string
  bbox: [number, number, number, number]
  resolution?: string
  format?: 'png' | 'jpeg' | 'geotiff'
}

export interface MapViewState {
  longitude: number
  latitude: number
  zoom: number
  pitch?: number
  bearing?: number
}

export interface PlayerState {
  isPlaying: boolean
  currentFrame: number
  speed: number
  loop: boolean
}

export interface ExportConfig {
  format: 'gif' | 'mp4'
  quality: 'low' | 'medium' | 'high'
  fps: number
  resolution: {
    width: number
    height: number
  }
}