'use client'

import { useState } from 'react'
import { Metadata } from 'next'
import Link from 'next/link'

// Note: In a real app, you'd need to use generateMetadata for dynamic metadata in client components
// For now, we'll handle this with a static export

export default function NewStoryPage() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    content: '',
    tags: '',
    author: '',
    location: '',
    dataSource: '',
    coordinates: ''
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)

  const categories = [
    'Climate Change',
    'Deforestation',
    'Natural Disasters',
    'Urban Climate',
    'Atmospheric Science',
    'Vegetation',
    'Ocean Changes',
    'Air Quality',
    'Land Use Change',
    'Wildlife Habitat'
  ]

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // In a real app, you'd submit to your API here
    console.log('Story submitted:', formData)
    
    setIsSubmitting(false)
    alert('Story submitted successfully! (This is a demo - no actual submission occurred)')
  }

  const nextStep = () => {
    if (currentStep < 3) setCurrentStep(currentStep + 1)
  }

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1)
  }

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return formData.title && formData.description && formData.category
      case 2:
        return formData.author && formData.content
      case 3:
        return true
      default:
        return false
    }
  }

  return (
    <div className="min-h-screen pt-20 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Share Your{' '}
            <span className="bg-gradient-to-r from-terra-500 to-terra-700 bg-clip-text text-transparent">
              Environmental Story
            </span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Tell the world about environmental changes you've observed or researched using NASA Terra satellite data.
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                  currentStep >= step 
                    ? 'bg-terra-500 text-white' 
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                }`}>
                  {step}
                </div>
                {step < 3 && (
                  <div className={`flex-1 h-1 mx-4 ${
                    currentStep > step 
                      ? 'bg-terra-500' 
                      : 'bg-gray-200 dark:bg-gray-700'
                  }`}></div>
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
            <span>Story Details</span>
            <span>Content & Author</span>
            <span>Location & Data</span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
          
          {/* Step 1: Story Details */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Story Details</h2>
              
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Story Title *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  required
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-white/50 dark:bg-gray-700/50 focus:outline-none focus:ring-2 focus:ring-terra-500 focus:border-transparent"
                  placeholder="e.g., Deforestation in the Amazon: A Decade of Change"
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Brief Description *
                </label>
                <textarea
                  id="description"
                  name="description"
                  required
                  rows={3}
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-white/50 dark:bg-gray-700/50 focus:outline-none focus:ring-2 focus:ring-terra-500 focus:border-transparent"
                  placeholder="A brief summary of your environmental story..."
                />
              </div>

              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category *
                </label>
                <select
                  id="category"
                  name="category"
                  required
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-white/50 dark:bg-gray-700/50 focus:outline-none focus:ring-2 focus:ring-terra-500 focus:border-transparent"
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="tags" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  id="tags"
                  name="tags"
                  value={formData.tags}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-white/50 dark:bg-gray-700/50 focus:outline-none focus:ring-2 focus:ring-terra-500 focus:border-transparent"
                  placeholder="e.g., Amazon, Deforestation, MODIS, Satellite Data"
                />
              </div>
            </div>
          )}

          {/* Step 2: Content & Author */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Content & Author</h2>
              
              <div>
                <label htmlFor="author" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Author Name *
                </label>
                <input
                  type="text"
                  id="author"
                  name="author"
                  required
                  value={formData.author}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-white/50 dark:bg-gray-700/50 focus:outline-none focus:ring-2 focus:ring-terra-500 focus:border-transparent"
                  placeholder="Your name or organization"
                />
              </div>

              <div>
                <label htmlFor="content" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Story Content *
                </label>
                <textarea
                  id="content"
                  name="content"
                  required
                  rows={12}
                  value={formData.content}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-white/50 dark:bg-gray-700/50 focus:outline-none focus:ring-2 focus:ring-terra-500 focus:border-transparent"
                  placeholder="Write your environmental story here. Include details about what you observed, the timeframe, the environmental impact, and how Terra satellite data helped reveal these changes..."
                />
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Tip: Include specific dates, locations, and Terra satellite layers (MODIS, ASTER, etc.) you used.
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Location & Data */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Location & Data Sources</h2>
              
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Geographic Location
                </label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-white/50 dark:bg-gray-700/50 focus:outline-none focus:ring-2 focus:ring-terra-500 focus:border-transparent"
                  placeholder="e.g., Amazon Basin, Brazil"
                />
              </div>

              <div>
                <label htmlFor="coordinates" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Coordinates (optional)
                </label>
                <input
                  type="text"
                  id="coordinates"
                  name="coordinates"
                  value={formData.coordinates}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-white/50 dark:bg-gray-700/50 focus:outline-none focus:ring-2 focus:ring-terra-500 focus:border-transparent"
                  placeholder="e.g., -3.4653, -62.2159"
                />
              </div>

              <div>
                <label htmlFor="dataSource" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Terra Data Sources Used
                </label>
                <textarea
                  id="dataSource"
                  name="dataSource"
                  rows={4}
                  value={formData.dataSource}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-white/50 dark:bg-gray-700/50 focus:outline-none focus:ring-2 focus:ring-terra-500 focus:border-transparent"
                  placeholder="e.g., MODIS True Color imagery (2000-2024), ASTER thermal data, specific NASA GIBS layers used..."
                />
              </div>

              <div className="bg-terra-50 dark:bg-terra-900/20 rounded-lg p-4 border border-terra-200 dark:border-terra-800">
                <h3 className="font-semibold text-terra-800 dark:text-terra-200 mb-2">Story Preview</h3>
                <div className="space-y-2 text-sm">
                  <p><strong>Title:</strong> {formData.title || 'Not specified'}</p>
                  <p><strong>Category:</strong> {formData.category || 'Not specified'}</p>
                  <p><strong>Author:</strong> {formData.author || 'Not specified'}</p>
                  <p><strong>Location:</strong> {formData.location || 'Not specified'}</p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200 dark:border-gray-600">
            <div>
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={prevStep}
                  className="flex items-center px-6 py-3 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Previous
                </button>
              )}
            </div>

            <div className="flex items-center space-x-4">
              <Link
                href="/stories"
                className="px-6 py-3 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Cancel
              </Link>
              
              {currentStep < 3 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  disabled={!isStepValid()}
                  className="flex items-center bg-gradient-to-r from-terra-500 to-terra-600 text-white px-6 py-3 rounded-lg hover:from-terra-600 hover:to-terra-700 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center bg-gradient-to-r from-terra-500 to-terra-600 text-white px-8 py-3 rounded-lg hover:from-terra-600 hover:to-terra-700 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Publishing...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                      Publish Story
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </form>

        {/* Help Section */}
        <div className="mt-12 bg-gradient-to-r from-terra-500/10 to-terra-700/10 rounded-2xl p-8 border border-terra-500/20">
          <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Writing Tips</h3>
          <div className="grid md:grid-cols-2 gap-6 text-gray-700 dark:text-gray-300">
            <div>
              <h4 className="font-semibold mb-2">📊 Use Specific Data</h4>
              <p className="text-sm">Include specific Terra satellite layers (MODIS, ASTER, CERES) and date ranges in your story.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">📍 Be Location-Specific</h4>
              <p className="text-sm">Provide exact coordinates or detailed location descriptions to help readers explore the area.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">📈 Show Change Over Time</h4>
              <p className="text-sm">Highlight temporal changes using before/after comparisons or trend analysis.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">🔬 Scientific Context</h4>
              <p className="text-sm">Explain the environmental significance and broader implications of your observations.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}