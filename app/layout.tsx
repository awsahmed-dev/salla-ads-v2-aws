import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { GlobalHeader } from '@/components/shared/global-header'
import { AppProvider } from '@/lib/app-context'
import './globals.css'

export const metadata: Metadata = {
  title: 'Salla Ads v2 -- Campaign Manager',
  description: 'Create and manage Snapchat ad campaigns through the Salla Ads platform.',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        <AppProvider>
          <GlobalHeader />
          {children}
        </AppProvider>
        <Analytics />
      </body>
    </html>
  )
}
