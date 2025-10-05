import { Metadata } from 'next'
import { DatasetGallery } from '@/components/dataset-gallery'

export const metadata: Metadata = {
  title: 'Data Gallery | Terra25',
  description: 'Explore NASA Terra satellite datasets and create animated stories from Earth observation data.',
}

export default function GalleryPage() {
  return (
    <div className="min-h-screen pt-20">
      {/* Hero Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-16 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Data Gallery
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Explore our curated collection of NASA Terra satellite datasets. Each dataset tells a unique story about our planet's systems and changes.
          </p>
        </div>
      </section>

      {/* Dataset Gallery */}
      <section className="px-4 sm:px-6 lg:px-8 pb-16">
        <DatasetGallery />
      </section>
    </div>
  )
}