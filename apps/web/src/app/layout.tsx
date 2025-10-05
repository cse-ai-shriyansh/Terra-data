import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ThemeProvider } from '@/components/theme-provider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Terra25 — Animated Terra Data Portal',
  description: 'Visualizing NASA Terra satellite datasets as animated stories for researchers, civic planners, educators, and engaged citizens.',
  keywords: ['NASA', 'Terra', 'satellite', 'data', 'visualization', 'MODIS', 'MOPITT', 'MISR', 'ASTER', 'CERES'],
  authors: [{ name: 'Terra25 Team' }],
  openGraph: {
    title: 'Terra25 — Animated Terra Data Portal',
    description: 'Visualizing NASA Terra satellite datasets as animated stories',
    type: 'website',
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-900">
            {children}
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}