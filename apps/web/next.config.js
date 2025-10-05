/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'gibs.earthdata.nasa.gov',
      'worldview.earthdata.nasa.gov',
      'map1.vis.earthdata.nasa.gov',
    ],
  },
  env: {
    MAPBOX_ACCESS_TOKEN: process.env.MAPBOX_ACCESS_TOKEN || '',
    NASA_API_KEY: process.env.NASA_API_KEY || '',
  },
  async rewrites() {
    const api = process.env.NEXT_PUBLIC_API_URL
    if (!api) return []
    return [
      { source: '/api/:path*', destination: `${api}/api/:path*` },
      { source: '/health', destination: `${api}/health` },
    ]
  },
}

module.exports = nextConfig