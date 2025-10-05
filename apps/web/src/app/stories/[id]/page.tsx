import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

// Mock data for individual stories - in a real app, this would come from a database or API
const storyData: Record<string, any> = {
  '1': {
    id: 1,
    title: "Amazon Rainforest Deforestation: 25 Years of Change",
    description: "Tracking the Amazon rainforest's changing landscape through Terra satellite imagery, revealing patterns of deforestation and conservation efforts.",
    author: "Dr. Maria Santos",
    authorBio: "Environmental scientist specializing in tropical deforestation monitoring using satellite remote sensing.",
    date: "2024-03-15",
    readTime: "8 min read",
    category: "Deforestation",
    image: "/api/placeholder/800/400",
    tags: ["Amazon", "Deforestation", "Conservation", "MODIS"],
    location: "Amazon Basin, Brazil",
    coordinates: "-3.4653, -62.2159",
    content: `
      <p>The Amazon rainforest, often called the "lungs of the Earth," has undergone dramatic changes over the past 25 years. Using NASA's Terra satellite data, we've been able to track these changes with unprecedented detail and accuracy.</p>
      
      <h2>The Data Story</h2>
      <p>Since Terra's launch in 1999, the MODIS (Moderate Resolution Imaging Spectroradiometer) instrument has provided continuous monitoring of the Amazon basin. The satellite's daily global coverage allows us to track deforestation patterns, seasonal changes, and fire activity across this vast ecosystem.</p>
      
      <p>Our analysis reveals several key trends:</p>
      <ul>
        <li><strong>Deforestation Hotspots:</strong> Concentrated along the "arc of deforestation" in southern and eastern Amazon</li>
        <li><strong>Seasonal Patterns:</strong> Peak deforestation typically occurs during the dry season (June-November)</li>
        <li><strong>Conservation Success:</strong> Protected areas show significantly lower deforestation rates</li>
        <li><strong>Recovery Indicators:</strong> Some previously cleared areas show signs of forest regrowth</li>
      </ul>
      
      <h2>Methodology</h2>
      <p>This analysis utilized multiple Terra satellite products:</p>
      <ul>
        <li><strong>MODIS True Color:</strong> For visual identification of cleared areas</li>
        <li><strong>MODIS NDVI:</strong> To quantify vegetation health and coverage</li>
        <li><strong>MODIS Fire Detection:</strong> To track burning activity</li>
        <li><strong>MODIS Land Cover:</strong> For classification of forest vs. non-forest areas</li>
      </ul>
      
      <h2>Key Findings</h2>
      <p>Between 2000 and 2024, our Terra satellite analysis revealed:</p>
      <ul>
        <li>Approximately 15% of the original Amazon forest has been cleared</li>
        <li>Deforestation rates peaked in 2004-2005, then declined due to conservation efforts</li>
        <li>Recent years show concerning upticks in clearing activity</li>
        <li>Climate change is affecting forest resilience and recovery capacity</li>
      </ul>
      
      <h2>Environmental Impact</h2>
      <p>The satellite data reveals the broader environmental consequences of Amazon deforestation:</p>
      <ul>
        <li><strong>Carbon Emissions:</strong> Lost forest biomass contributes significantly to global CO2 levels</li>
        <li><strong>Biodiversity Loss:</strong> Fragmented habitats threaten countless species</li>
        <li><strong>Climate Feedback:</strong> Reduced rainfall affects regional and global weather patterns</li>
        <li><strong>Soil Degradation:</strong> Cleared areas often become unsuitable for agriculture within decades</li>
      </ul>
      
      <h2>Looking Forward</h2>
      <p>Terra satellite monitoring continues to be crucial for:</p>
      <ul>
        <li>Early warning systems for rapid deforestation detection</li>
        <li>Monitoring compliance with conservation agreements</li>
        <li>Assessing the effectiveness of protected areas</li>
        <li>Understanding climate change impacts on tropical forests</li>
      </ul>
      
      <p>The 25-year Terra dataset provides an invaluable baseline for understanding one of Earth's most critical ecosystems. As we face the challenges of climate change and increasing pressure on natural resources, this satellite perspective becomes even more important for informed decision-making and conservation efforts.</p>
    `
  },
  '2': {
    id: 2,
    title: "Arctic Sea Ice Decline: A Visual Journey",
    description: "Documenting the dramatic changes in Arctic sea ice extent using 25 years of Terra satellite data and what it means for global climate.",
    author: "Prof. James Arctic",
    authorBio: "Polar climate researcher and professor of atmospheric sciences with 20+ years of Arctic research experience.",
    date: "2024-03-10",
    readTime: "12 min read",
    category: "Climate Change",
    image: "/api/placeholder/800/400",
    tags: ["Arctic", "Sea Ice", "Climate Change", "Global Warming"],
    location: "Arctic Ocean",
    coordinates: "90.0000, 0.0000",
    content: `
      <p>The Arctic is warming twice as fast as the global average, and nowhere is this more visible than in the dramatic decline of sea ice. Terra satellite data provides a 25-year record of these changes, offering crucial insights into one of climate change's most visible impacts.</p>
      
      <h2>The Disappearing Ice</h2>
      <p>Since 1999, Terra's MODIS sensor has captured the annual cycle of Arctic sea ice formation and melt. The data reveals a troubling trend: the Arctic is losing sea ice at a rate of approximately 13% per decade during September, the month of minimum ice extent.</p>
      
      <h2>Key Observations</h2>
      <p>Terra satellite analysis reveals several critical patterns:</p>
      <ul>
        <li><strong>Accelerating Decline:</strong> Ice loss has accelerated significantly since 2007</li>
        <li><strong>Thickness Changes:</strong> Multi-year ice is being replaced by thinner, seasonal ice</li>
        <li><strong>Timing Shifts:</strong> Melt season starts earlier and freeze-up occurs later</li>
        <li><strong>Geographic Patterns:</strong> Most dramatic losses occur in the Beaufort and Chukchi Seas</li>
      </ul>
      
      <p>This ongoing transformation has profound implications for global climate, Arctic ecosystems, and human communities that depend on sea ice for their traditional way of life.</p>
    `
  }
}

type Props = {
  params: { id: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const story = storyData[params.id]
  
  if (!story) {
    return {
      title: 'Story Not Found | Terra25',
    }
  }

  return {
    title: `${story.title} | Terra25`,
    description: story.description,
  }
}

export default function StoryPage({ params }: Props) {
  const story = storyData[params.id]

  if (!story) {
    notFound()
  }

  return (
    <div className="min-h-screen pt-20 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back to Stories */}
        <Link
          href="/stories"
          className="inline-flex items-center text-terra-600 dark:text-terra-400 hover:text-terra-700 dark:hover:text-terra-300 mb-8 transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Stories
        </Link>

        {/* Hero Image */}
        <div className="aspect-video bg-gradient-to-br from-terra-400/20 to-terra-600/20 rounded-2xl mb-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
          <div className="absolute bottom-6 left-6 text-white">
            <span className="bg-terra-500 px-3 py-1 rounded-full text-sm font-medium">
              {story.category}
            </span>
          </div>
        </div>

        {/* Article Header */}
        <header className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900 dark:text-white leading-tight">
            {story.title}
          </h1>
          
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
            {story.description}
          </p>

          {/* Article Meta */}
          <div className="flex flex-wrap items-center gap-6 text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 pb-6">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-terra-400 to-terra-600 rounded-full flex items-center justify-center mr-3">
                <span className="text-white font-semibold text-sm">
                  {story.author.split(' ').map((n: string) => n[0]).join('')}
                </span>
              </div>
              <div>
                <div className="font-medium text-gray-900 dark:text-white">{story.author}</div>
                <div className="text-sm">{story.authorBio}</div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span>{story.date}</span>
              <span>•</span>
              <span>{story.readTime}</span>
              {story.location && (
                <>
                  <span>•</span>
                  <span>📍 {story.location}</span>
                </>
              )}
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mt-6">
            {story.tags.map((tag: string) => (
              <span
                key={tag}
                className="bg-terra-100 dark:bg-terra-900 text-terra-700 dark:text-terra-300 px-3 py-1 rounded-full text-sm font-medium"
              >
                {tag}
              </span>
            ))}
          </div>
        </header>

        {/* Article Content */}
        <article className="prose prose-lg prose-gray dark:prose-invert max-w-none">
          <div dangerouslySetInnerHTML={{ __html: story.content }} />
        </article>

        {/* Terra Data Information */}
        <div className="mt-12 bg-gradient-to-r from-terra-500/10 to-terra-700/10 rounded-2xl p-8 border border-terra-500/20">
          <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
            🛰️ Terra Satellite Data Used
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2 text-gray-900 dark:text-white">Data Sources</h4>
              <ul className="text-gray-700 dark:text-gray-300 space-y-1">
                <li>• NASA GIBS WMTS Service</li>
                <li>• MODIS Terra Satellite Imagery</li>
                <li>• 25-year historical archive (1999-2024)</li>
                <li>• Global daily coverage at 250m-1km resolution</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2 text-gray-900 dark:text-white">Explore the Data</h4>
              <div className="space-y-2">
                <Link
                  href="/terra"
                  className="block text-terra-600 dark:text-terra-400 hover:text-terra-700 dark:hover:text-terra-300 transition-colors"
                >
                  → View Terra Data Explorer
                </Link>
                <Link
                  href="/gallery"
                  className="block text-terra-600 dark:text-terra-400 hover:text-terra-700 dark:hover:text-terra-300 transition-colors"
                >
                  → Browse Image Gallery
                </Link>
                {story.coordinates && (
                  <a
                    href={`/terra?lat=${story.coordinates.split(',')[0]}&lng=${story.coordinates.split(',')[1]}`}
                    className="block text-terra-600 dark:text-terra-400 hover:text-terra-700 dark:hover:text-terra-300 transition-colors"
                  >
                    → View This Location
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Related Stories */}
        <div className="mt-16">
          <h3 className="text-2xl font-bold mb-8 text-gray-900 dark:text-white">More Environmental Stories</h3>
          <div className="grid md:grid-cols-2 gap-8">
            {Object.entries(storyData)
              .filter(([id]) => id !== params.id)
              .slice(0, 2)
              .map(([id, relatedStory]) => (
                <Link
                  key={id}
                  href={`/stories/${id}`}
                  className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:border-terra-500/30 transition-all duration-200 group"
                >
                  <div className="aspect-video bg-gradient-to-br from-terra-400/10 to-terra-600/10 rounded-lg mb-4"></div>
                  <div className="text-sm text-terra-600 dark:text-terra-400 font-medium mb-2">
                    {relatedStory.category}
                  </div>
                  <h4 className="text-lg font-bold mb-2 text-gray-900 dark:text-white group-hover:text-terra-600 dark:group-hover:text-terra-400 transition-colors">
                    {relatedStory.title}
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2">
                    {relatedStory.description}
                  </p>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mt-3">
                    {relatedStory.readTime} • {relatedStory.author}
                  </div>
                </Link>
              ))}
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-terra-500 to-terra-700 rounded-2xl p-12 text-white">
            <h3 className="text-3xl font-bold mb-4">Share Your Own Story</h3>
            <p className="text-xl mb-8 opacity-90">
              Have you observed environmental changes using Terra satellite data?
            </p>
            <Link
              href="/stories/new"
              className="inline-flex items-center bg-white text-terra-600 px-8 py-4 rounded-lg hover:bg-gray-100 transition-colors font-medium text-lg"
            >
              <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              Create Your Story
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}