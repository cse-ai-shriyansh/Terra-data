'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { TerraDataset } from '@/types'

const datasets: TerraDataset[] = [
  {
    id: 'modis-fires',
    name: 'MODIS Active Fire Detection',
    instrument: 'MODIS',
    description: 'Real-time fire detection and monitoring across global landscapes, showing active fire locations and intensity.',
    resolution: '1km',
    timespan: '2000-present',
    sampleImageUrl: '/api/placeholder/400/300',
    dataUrl: 'https://firms.modaps.eosdis.nasa.gov/',
    wmtsUrl: 'https://gibs.earthdata.nasa.gov/wmts/1.0.0/MODIS_Terra_CorrectedReflectance_TrueColor/default/{time}/{tilematrixset}{max_zoom}/{z}/{y}/{x}.jpg',
    categories: ['fires', 'disasters', 'environmental'],
    impact: 'Critical for wildfire management, emergency response, and climate research',
  },
  {
    id: 'modis-vegetation',
    name: 'MODIS Vegetation Indices',
    instrument: 'MODIS',
    description: 'Monitor vegetation health, productivity, and seasonal changes through NDVI and EVI measurements.',
    resolution: '250m-1km',
    timespan: '2000-present',
    sampleImageUrl: '/api/placeholder/400/300',
    dataUrl: 'https://modis.gsfc.nasa.gov/',
    categories: ['vegetation', 'agriculture', 'climate'],
    impact: 'Essential for agricultural monitoring, food security, and ecosystem health assessment',
  },
  {
    id: 'mopitt-co',
    name: 'MOPITT Carbon Monoxide',
    instrument: 'MOPITT',
    description: 'Track atmospheric carbon monoxide concentrations and pollution transport patterns globally.',
    resolution: '22km',
    timespan: '2000-present',
    sampleImageUrl: '/api/placeholder/400/300',
    dataUrl: 'https://www2.acom.ucar.edu/mopitt',
    categories: ['air-quality', 'pollution', 'atmospheric'],
    impact: 'Vital for air quality monitoring, pollution source identification, and health studies',
  },
  {
    id: 'misr-aerosols',
    name: 'MISR Aerosol Optical Depth',
    instrument: 'MISR',
    description: 'Multi-angle measurements of atmospheric aerosols, dust, and particulate matter.',
    resolution: '17.6km',
    timespan: '2000-present',
    sampleImageUrl: '/api/placeholder/400/300',
    dataUrl: 'https://misr.jpl.nasa.gov/',
    categories: ['aerosols', 'air-quality', 'atmospheric'],
    impact: 'Key for understanding air quality, climate impacts, and human health effects',
  },
  {
    id: 'aster-temperature',
    name: 'ASTER Land Surface Temperature',
    instrument: 'ASTER',
    description: 'High-resolution thermal infrared measurements for urban heat island and surface temperature analysis.',
    resolution: '90m',
    timespan: '2000-present',
    sampleImageUrl: '/api/placeholder/400/300',
    dataUrl: 'https://asterweb.jpl.nasa.gov/',
    categories: ['temperature', 'urban', 'thermal'],
    impact: 'Critical for urban planning, heat stress studies, and climate adaptation strategies',
  },
  {
    id: 'ceres-radiation',
    name: 'CERES Earth Radiation Budget',
    instrument: 'CERES',
    description: 'Measure Earth\'s energy balance through incoming and outgoing radiation measurements.',
    resolution: '20km',
    timespan: '2000-present',
    sampleImageUrl: '/api/placeholder/400/300',
    dataUrl: 'https://ceres.larc.nasa.gov/',
    categories: ['radiation', 'climate', 'energy'],
    impact: 'Fundamental for climate modeling, energy balance studies, and global warming research',
  },
]

export function DatasetGallery() {
  return (
    <section className="py-24 bg-gray-50/80 dark:bg-gray-800/80 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Explore{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-terra-500 to-blue-600">
              Terra Datasets
            </span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Discover the power of NASA Terra satellite instruments. Each dataset tells 
            a unique story about our changing planet.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {datasets.map((dataset, index) => (
            <motion.div
              key={dataset.id}
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ 
                duration: 0.6, 
                delay: index * 0.1,
                ease: "easeOut"
              }}
              viewport={{ once: true }}
              className="group"
            >
              <div className="h-full bg-white dark:bg-gray-900 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-200 dark:border-gray-700 hover:border-terra-300 dark:hover:border-terra-600 hover:-translate-y-2">
                {/* Image */}
                <div className="relative h-48 bg-gradient-to-br from-terra-400 to-blue-500 overflow-hidden">
                  <div className="absolute inset-0 bg-black/20" />
                  <div className="absolute top-4 left-4 z-10">
                    <span className="px-3 py-1 text-xs font-semibold text-white bg-black/40 backdrop-blur-sm rounded-full">
                      {dataset.instrument}
                    </span>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-white/80 text-6xl">
                      {dataset.instrument === 'MODIS' ? '🔥' : 
                       dataset.instrument === 'MOPITT' ? '💨' :
                       dataset.instrument === 'MISR' ? '☁️' :
                       dataset.instrument === 'ASTER' ? '🌡️' : '☀️'}
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-terra-600 dark:group-hover:text-terra-400 transition-colors">
                    {dataset.name}
                  </h3>
                  
                  <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-3">
                    {dataset.description}
                  </p>

                  {/* Metadata */}
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Resolution:</span>
                      <span className="font-medium text-gray-700 dark:text-gray-300">{dataset.resolution}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Timespan:</span>
                      <span className="font-medium text-gray-700 dark:text-gray-300">{dataset.timespan}</span>
                    </div>
                  </div>

                  {/* Categories */}
                  <div className="flex flex-wrap gap-1 mb-4">
                    {dataset.categories.slice(0, 3).map((category) => (
                      <span
                        key={category}
                        className="px-2 py-1 text-xs bg-terra-100 dark:bg-terra-900 text-terra-700 dark:text-terra-300 rounded-md capitalize"
                      >
                        {category}
                      </span>
                    ))}
                  </div>

                  {/* Impact */}
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-4 italic">
                    "{dataset.impact}"
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Link
                      href={`/stories/new?dataset=${dataset.id}`}
                      className="flex-1 bg-gradient-to-r from-terra-500 to-terra-600 text-white text-sm font-medium py-2 px-4 rounded-lg hover:from-terra-600 hover:to-terra-700 transition-all duration-200 text-center"
                    >
                      Create Story
                    </Link>
                    <Link
                      href={`/gallery/${dataset.id}`}
                      className="px-4 py-2 text-sm font-medium text-terra-600 dark:text-terra-400 border border-terra-300 dark:border-terra-600 rounded-lg hover:bg-terra-50 dark:hover:bg-terra-900/50 transition-colors"
                    >
                      View
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <Link
            href="/gallery"
            className="inline-flex items-center px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-terra-500 to-terra-600 rounded-2xl hover:from-terra-600 hover:to-terra-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
          >
            View All Datasets
            <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </motion.div>
      </div>
    </section>
  )
}