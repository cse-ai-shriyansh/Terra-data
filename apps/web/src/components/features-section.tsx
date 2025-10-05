'use client'

import { motion } from 'framer-motion'

export function FeaturesSection() {
  const features = [
    {
      icon: '',
      title: 'Global Coverage',
      description: 'Comprehensive Earth observation data from NASA Terra satellite instruments covering the entire planet.',
    },
    {
      icon: '',
      title: 'Interactive Visualizations',
      description: 'Dynamic maps and charts that bring complex environmental data to life with intuitive controls.',
    },
    {
      icon: '',
      title: 'Time Series Animation',
      description: 'Watch environmental changes unfold over time with smooth, customizable animation controls.',
    },
    {
      icon: '',
      title: 'Impact Analysis',
      description: 'Understand human and environmental impacts through data-driven storytelling and analysis.',
    },
    {
      icon: '',
      title: 'Responsive Design',
      description: 'Access your data stories on any device with our mobile-first, responsive interface.',
    },
    {
      icon: '',
      title: 'API Integration',
      description: 'Real-time data updates from NASA sources with automated ingestion and processing.',
    },
  ]

  return (
    <section className="py-24 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Powerful Features for{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-terra-500 to-blue-600">
              Data Storytelling
            </span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Transform complex satellite data into compelling visual narratives 
            with our comprehensive suite of visualization and analysis tools.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ 
                duration: 0.6, 
                delay: index * 0.1,
                ease: "easeOut"
              }}
              viewport={{ once: true }}
              className="group relative"
            >
              <div className="h-full p-8 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 hover:border-terra-300 dark:hover:border-terra-600 transition-all duration-300 hover:shadow-xl hover:shadow-terra-500/10 hover:-translate-y-1">
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}