import Link from 'next/link'
import { Navigation } from '@/components/navigation'

export default function NotFound() {
  return (
    <div className="min-h-screen">
      <Navigation />
      
      <main className="pt-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <div className="text-center py-16">
          {/* 404 Hero */}
          <div className="mb-8">
            <h1 className="text-9xl font-bold bg-gradient-to-br from-terra-400 to-terra-600 bg-clip-text text-transparent">
              404
            </h1>
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mt-4">
              Page Not Found
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-2 max-w-md mx-auto">
              Sorry, we couldn't find the page you're looking for. The page may have been moved, deleted, or doesn't exist.
            </p>
          </div>

          {/* Satellite Animation */}
          <div className="mb-8 flex justify-center">
            <div className="relative">
              <div className="w-24 h-24 bg-gradient-to-br from-terra-400 to-terra-600 rounded-full flex items-center justify-center animate-pulse">
                <span className="text-white text-2xl">🛰️</span>
              </div>
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full animate-ping"></div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center">
            <Link
              href="/"
              className="inline-block bg-gradient-to-r from-terra-500 to-terra-600 text-white px-6 py-3 rounded-lg font-medium hover:from-terra-600 hover:to-terra-700 transition-all duration-200"
            >
              🏠 Go Home
            </Link>
            <Link
              href="/terra"
              className="inline-block border border-terra-300 dark:border-terra-600 text-terra-600 dark:text-terra-400 px-6 py-3 rounded-lg font-medium hover:bg-terra-50 dark:hover:bg-terra-900/50 transition-all duration-200"
            >
              🛰️ Explore Terra Data
            </Link>
          </div>

          {/* Help Text */}
          <div className="mt-12 p-6 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
              Lost in Space? 🌌
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Navigate back to familiar territory or explore our NASA Terra satellite data portal.
            </p>
            
            {/* Quick Links */}
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <Link 
                href="/" 
                className="text-terra-600 dark:text-terra-400 hover:underline text-sm"
              >
                Home
              </Link>
              <span className="text-gray-300">•</span>
              <Link 
                href="/terra" 
                className="text-terra-600 dark:text-terra-400 hover:underline text-sm"
              >
                Terra Data
              </Link>
              <span className="text-gray-300">•</span>
              <Link 
                href="/gallery" 
                className="text-terra-600 dark:text-terra-400 hover:underline text-sm"
              >
                Gallery
              </Link>
              <span className="text-gray-300">•</span>
              <Link 
                href="/about" 
                className="text-terra-600 dark:text-terra-400 hover:underline text-sm"
              >
                About
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

// Optional: Add metadata
export const metadata = {
  title: '404 - Page Not Found | Terra25',
  description: 'The page you are looking for could not be found.',
}