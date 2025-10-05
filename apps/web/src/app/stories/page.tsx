import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Stories | Terra25 - Environmental Stories Through Data',
  description: 'Discover compelling stories about environmental change told through NASA Terra satellite data.',
}

// Mock data for stories - in a real app, this would come from a database or API
const stories = [
  {
    id: 1,
    title: "Amazon Rainforest Deforestation: 25 Years of Change",
    description: "Tracking the Amazon rainforest's changing landscape through Terra satellite imagery, revealing patterns of deforestation and conservation efforts.",
    author: "Dr. Maria Santos",
    date: "2024-03-15",
    readTime: "8 min read",
    category: "Deforestation",
    image: "/api/placeholder/400/250",
    featured: true,
    tags: ["Amazon", "Deforestation", "Conservation", "MODIS"]
  },
  {
    id: 2,
    title: "Arctic Sea Ice Decline: A Visual Journey",
    description: "Documenting the dramatic changes in Arctic sea ice extent using 25 years of Terra satellite data and what it means for global climate.",
    author: "Prof. James Arctic",
    date: "2024-03-10",
    readTime: "12 min read",
    category: "Climate Change",
    image: "/api/placeholder/400/250",
    featured: true,
    tags: ["Arctic", "Sea Ice", "Climate Change", "Global Warming"]
  },
  {
    id: 3,
    title: "Volcanic Eruptions: Monitoring from Space",
    description: "How Terra's thermal sensors capture volcanic activity around the world, providing early warnings and tracking environmental impacts.",
    author: "Dr. Lisa Volcano",
    date: "2024-03-05",
    readTime: "6 min read",
    category: "Natural Disasters",
    image: "/api/placeholder/400/250",
    featured: false,
    tags: ["Volcanoes", "ASTER", "Natural Disasters", "Thermal Imaging"]
  },
  {
    id: 4,
    title: "Urban Heat Islands: Cities Getting Hotter",
    description: "Exploring how Terra's thermal data reveals urban heat islands in major cities and their impact on human health and energy consumption.",
    author: "Urban Climate Team",
    date: "2024-02-28",
    readTime: "10 min read",
    category: "Urban Climate",
    image: "/api/placeholder/400/250",
    featured: false,
    tags: ["Urban Heat", "Cities", "Temperature", "Public Health"]
  },
  {
    id: 5,
    title: "Sahara Dust: Journey Across the Atlantic",
    description: "Following massive dust clouds from the Sahara Desert as they travel across the Atlantic Ocean, affecting air quality and ecosystems.",
    author: "Atmospheric Science Lab",
    date: "2024-02-20",
    readTime: "7 min read",
    category: "Atmospheric Science",
    image: "/api/placeholder/400/250",
    featured: false,
    tags: ["Sahara", "Dust Storms", "Atmosphere", "Ocean Ecosystems"]
  },
  {
    id: 6,
    title: "Seasonal Changes in Earth's Vegetation",
    description: "Time-lapse analysis of global vegetation patterns through the seasons, revealing the pulse of our living planet.",
    author: "Vegetation Dynamics Group",
    date: "2024-02-15",
    readTime: "9 min read",
    category: "Vegetation",
    image: "/api/placeholder/400/250",
    featured: false,
    tags: ["Vegetation", "Seasons", "Phenology", "Plant Growth"]
  }
]

const categories = ["All", "Climate Change", "Deforestation", "Natural Disasters", "Urban Climate", "Atmospheric Science", "Vegetation"]

export default function StoriesPage() {
  const featuredStories = stories.filter(story => story.featured)
  const regularStories = stories.filter(story => !story.featured)

  return (
    <div className="min-h-screen pt-20 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Environmental{' '}
            <span className="bg-gradient-to-r from-terra-500 to-terra-700 bg-clip-text text-transparent">
              Stories
            </span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto mb-8">
            Discover compelling narratives about our changing planet through NASA Terra satellite data, 
            told by scientists, researchers, and environmental advocates.
          </p>
          
          {/* Create Story CTA */}
          <Link
            href="/stories/new"
            className="inline-flex items-center bg-gradient-to-r from-terra-500 to-terra-600 text-white px-6 py-3 rounded-lg hover:from-terra-600 hover:to-terra-700 transition-all duration-200 font-medium"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Share Your Story
          </Link>
        </div>

        {/* Category Filter */}
        <div className="mb-12">
          <div className="flex flex-wrap justify-center gap-3">
            {categories.map((category) => (
              <button
                key={category}
                className="px-4 py-2 rounded-full bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-white/20 hover:bg-terra-500/10 hover:border-terra-500/30 transition-all duration-200 text-gray-700 dark:text-gray-300"
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Featured Stories */}
        {featuredStories.length > 0 && (
          <section className="mb-16">
            <h2 className="text-2xl font-bold mb-8 text-gray-900 dark:text-white">Featured Stories</h2>
            <div className="grid lg:grid-cols-2 gap-8">
              {featuredStories.map((story) => (
                <article key={story.id} className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/20 hover:border-terra-500/30 transition-all duration-200 group">
                  <div className="aspect-video bg-gradient-to-br from-terra-400/20 to-terra-600/20 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                    <div className="absolute top-4 left-4">
                      <span className="bg-terra-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                        Featured
                      </span>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-3">
                      <span className="bg-terra-100 dark:bg-terra-900 text-terra-700 dark:text-terra-300 px-2 py-1 rounded text-xs font-medium mr-3">
                        {story.category}
                      </span>
                      <span>{story.date}</span>
                      <span className="mx-2">•</span>
                      <span>{story.readTime}</span>
                    </div>
                    <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white group-hover:text-terra-600 dark:group-hover:text-terra-400 transition-colors">
                      {story.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
                      {story.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        By {story.author}
                      </span>
                      <Link
                        href={`/stories/${story.id}`}
                        className="text-terra-600 dark:text-terra-400 hover:text-terra-700 dark:hover:text-terra-300 font-medium transition-colors"
                      >
                        Read Story →
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* Regular Stories Grid */}
        <section>
          <h2 className="text-2xl font-bold mb-8 text-gray-900 dark:text-white">All Stories</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {regularStories.map((story) => (
              <article key={story.id} className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl overflow-hidden border border-white/20 hover:border-terra-500/30 transition-all duration-200 group">
                <div className="aspect-video bg-gradient-to-br from-terra-400/10 to-terra-600/10 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent"></div>
                </div>
                <div className="p-6">
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-3">
                    <span className="bg-terra-100 dark:bg-terra-900 text-terra-700 dark:text-terra-300 px-2 py-1 rounded text-xs font-medium mr-3">
                      {story.category}
                    </span>
                    <span>{story.readTime}</span>
                  </div>
                  <h3 className="text-lg font-bold mb-3 text-gray-900 dark:text-white group-hover:text-terra-600 dark:group-hover:text-terra-400 transition-colors">
                    {story.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2 text-sm">
                    {story.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {story.author}
                    </span>
                    <Link
                      href={`/stories/${story.id}`}
                      className="text-terra-600 dark:text-terra-400 hover:text-terra-700 dark:hover:text-terra-300 font-medium transition-colors text-sm"
                    >
                      Read →
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Call to Action */}
        <section className="mt-16 text-center">
          <div className="bg-gradient-to-r from-terra-500/10 to-terra-700/10 rounded-2xl p-12 border border-terra-500/20">
            <h2 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">
              Have a Story to Tell?
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
              Share your environmental discoveries, research findings, or local observations 
              using Terra satellite data with our global community.
            </p>
            <Link
              href="/stories/new"
              className="inline-flex items-center bg-gradient-to-r from-terra-500 to-terra-600 text-white px-8 py-4 rounded-lg hover:from-terra-600 hover:to-terra-700 transition-all duration-200 font-medium text-lg"
            >
              <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              Start Writing Your Story
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}