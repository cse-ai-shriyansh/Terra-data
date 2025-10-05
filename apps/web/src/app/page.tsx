import { Hero } from '@/components/hero'
import { DatasetGallery } from '@/components/dataset-gallery'
import { FeaturesSection } from '@/components/features-section'
import { Navigation } from '@/components/navigation'

export default function Home() {
  return (
    <main className="min-h-screen">
      <Navigation />
      <Hero />
      <FeaturesSection />
      <DatasetGallery />
    </main>
  )
}