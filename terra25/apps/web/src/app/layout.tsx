import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Terra25 - Animated NASA Satellite Data Portal',
  description: 'Interactive visualization and animation of NASA Terra satellite data for environmental monitoring and research.',
  keywords: ['NASA', 'Terra', 'satellite', 'animation', 'environment', 'climate', 'MODIS'],
  authors: [{ name: 'Terra25 Team' }],
  openGraph: {
    title: 'Terra25 - Animated NASA Satellite Data Portal',
    description: 'Interactive visualization and animation of NASA Terra satellite data',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div id="root">
          {children}
        </div>
      </body>
    </html>
  )
}