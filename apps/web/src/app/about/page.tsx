import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About Terra25 | NASA Terra Satellite Data Visualization',
  description: 'Learn about Terra25, a platform for exploring NASA Terra satellite data and environmental changes over 25 years.',
}

export default function AboutPage() {
  return (
    <div className="min-h-screen pt-20 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            About{' '}
            <span className="bg-gradient-to-r from-terra-500 to-terra-700 bg-clip-text text-transparent">
              Terra25
            </span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Celebrating 25 years of NASA Terra satellite data with cutting-edge visualization 
            and storytelling tools for understanding our changing planet.
          </p>
        </div>

        {/* Mission Section */}
        <section className="mb-16">
          <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
            <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">Our Mission</h2>
            <p className="text-lg text-gray-700 dark:text-gray-300 mb-4">
              Terra25 makes NASA's Terra satellite data accessible to everyone through interactive 
              visualizations, compelling stories, and educational resources. We believe that 
              understanding Earth's environmental changes is crucial for making informed decisions 
              about our planet's future.
            </p>
            <p className="text-lg text-gray-700 dark:text-gray-300">
              Since 1999, NASA's Terra satellite has been observing Earth, collecting invaluable 
              data about our atmosphere, land, and oceans. Terra25 transforms this scientific 
              data into engaging visual experiences that inspire action and understanding.
            </p>
          </div>
        </section>

        {/* Features Grid */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center text-gray-900 dark:text-white">
            What We Offer
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="w-12 h-12 bg-gradient-to-br from-terra-400 to-terra-600 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.002 4.002 0 003 15z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
                Real-time Data
              </h3>
              <p className="text-gray-700 dark:text-gray-300">
                Access the latest Terra satellite imagery and atmospheric data from NASA's GIBS service.
              </p>
            </div>

            <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="w-12 h-12 bg-gradient-to-br from-terra-400 to-terra-600 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 00-2-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
                Interactive Visualizations
              </h3>
              <p className="text-gray-700 dark:text-gray-300">
                Explore data through interactive maps, charts, and animations that bring Earth science to life.
              </p>
            </div>

            <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="w-12 h-12 bg-gradient-to-br from-terra-400 to-terra-600 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
                Educational Stories
              </h3>
              <p className="text-gray-700 dark:text-gray-300">
                Learn about climate change, deforestation, and environmental monitoring through compelling narratives.
              </p>
            </div>

            <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="w-12 h-12 bg-gradient-to-br from-terra-400 to-terra-600 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
                Open Source
              </h3>
              <p className="text-gray-700 dark:text-gray-300">
                Built with modern web technologies and open APIs, making Earth data accessible to developers.
              </p>
            </div>

            <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="w-12 h-12 bg-gradient-to-br from-terra-400 to-terra-600 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
                Community Driven
              </h3>
              <p className="text-gray-700 dark:text-gray-300">
                Share your own stories and discoveries with a global community of Earth science enthusiasts.
              </p>
            </div>

            <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="w-12 h-12 bg-gradient-to-br from-terra-400 to-terra-600 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
                Performance Focused
              </h3>
              <p className="text-gray-700 dark:text-gray-300">
                Fast, responsive interface built with Next.js and optimized for handling large datasets.
              </p>
            </div>
          </div>
        </section>

        {/* Terra Satellite Info */}
        <section className="mb-16">
          <div className="bg-gradient-to-r from-terra-500/10 to-terra-700/10 rounded-2xl p-8 border border-terra-500/20">
            <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">
              About NASA's Terra Satellite
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Mission Overview</h3>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  Launched on December 18, 1999, Terra (originally known as EOS AM-1) is a multi-national 
                  scientific research satellite. It's the flagship of NASA's Earth Observing System (EOS) 
                  and carries five state-of-the-art instruments.
                </p>
                <p className="text-gray-700 dark:text-gray-300">
                  Terra passes from north to south across the equator in the morning, collecting data 
                  about Earth's atmosphere, land, and water for climate and environmental research.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Key Instruments</h3>
                <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                  <li>• <strong>MODIS</strong> - Moderate Resolution Imaging Spectroradiometer</li>
                  <li>• <strong>ASTER</strong> - Advanced Spaceborne Thermal Emission</li>
                  <li>• <strong>CERES</strong> - Clouds and Earth's Radiant Energy System</li>
                  <li>• <strong>MISR</strong> - Multi-angle Imaging SpectroRadiometer</li>
                  <li>• <strong>MOPITT</strong> - Measurements of Pollution in the Troposphere</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="text-center">
          <div className="bg-gradient-to-r from-terra-500 to-terra-700 rounded-2xl p-12 text-white">
            <h2 className="text-3xl font-bold mb-4">Ready to Explore?</h2>
            <p className="text-xl mb-8 opacity-90">
              Start your journey through 25 years of Earth observation data
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/terra"
                className="bg-white text-terra-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                Explore Terra Data
              </a>
              <a
                href="/gallery"
                className="bg-terra-800 text-white px-8 py-3 rounded-lg font-semibold hover:bg-terra-900 transition-colors"
              >
                View Gallery
              </a>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}