'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useTheme } from './theme-provider'
import { Terra25Logo } from './terra25-logo'

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false)
  const { theme, setTheme } = useTheme()

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glassmorphism border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3">
            <Terra25Logo size={40} animated className="transition-transform hover:scale-105" />
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              Terra25
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link 
              href="/" 
              className="text-gray-700 dark:text-gray-300 hover:text-terra-600 dark:hover:text-terra-400 transition-colors"
            >
              Home
            </Link>
            <Link 
              href="/terra" 
              className="text-gray-700 dark:text-gray-300 hover:text-terra-600 dark:hover:text-terra-400 transition-colors"
            >
              🛰️ Terra Data
            </Link>
            <Link 
              href="/animation" 
              className="text-gray-700 dark:text-gray-300 hover:text-terra-600 dark:hover:text-terra-400 transition-colors"
            >
              🎬 Animation
            </Link>
            <Link 
              href="/gallery" 
              className="text-gray-700 dark:text-gray-300 hover:text-terra-600 dark:hover:text-terra-400 transition-colors"
            >
              Gallery
            </Link>
            <Link 
              href="/stories" 
              className="text-gray-700 dark:text-gray-300 hover:text-terra-600 dark:hover:text-terra-400 transition-colors"
            >
              Stories
            </Link>
            <Link 
              href="/about" 
              className="text-gray-700 dark:text-gray-300 hover:text-terra-600 dark:hover:text-terra-400 transition-colors"
            >
              About
            </Link>
            
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-slate-700" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              )}
            </button>

            <Link
              href="/stories/new"
              className="bg-gradient-to-r from-terra-500 to-terra-600 text-white px-4 py-2 rounded-lg hover:from-terra-600 hover:to-terra-700 transition-all duration-200 font-medium"
            >
              Create Story
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-t border-white/10">
          <div className="px-4 py-4 space-y-3">
            <Link href="/" className="block text-gray-700 dark:text-gray-300 hover:text-terra-600 dark:hover:text-terra-400 transition-colors">
              Home
            </Link>
            <Link href="/animation" className="block text-gray-700 dark:text-gray-300 hover:text-terra-600 dark:hover:text-terra-400 transition-colors">
              🎬 Animation
            </Link>
            <Link href="/gallery" className="block text-gray-700 dark:text-gray-300 hover:text-terra-600 dark:hover:text-terra-400 transition-colors">
              Gallery
            </Link>
            <Link href="/stories" className="block text-gray-700 dark:text-gray-300 hover:text-terra-600 dark:hover:text-terra-400 transition-colors">
              Stories
            </Link>
            <Link href="/about" className="block text-gray-700 dark:text-gray-300 hover:text-terra-600 dark:hover:text-terra-400 transition-colors">
              About
            </Link>
            <Link
              href="/stories/new"
              className="block bg-gradient-to-r from-terra-500 to-terra-600 text-white px-4 py-2 rounded-lg text-center font-medium"
            >
              Create Story
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}