import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Fan AlFaisal Recruitment Portal | شركة فن الفيصل للاستقدام',
  description: 'Official recruitment operations portal for Fan AlFaisal Recruitment Company - Musaned Certified',
  icons: {
    icon: [
      {
        url: '/fan-alfaisal-logo.png',
        type: 'image/png',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    shortcut: '/fan-alfaisal-logo.png',
    apple: '/fan-alfaisal-logo.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: [{ media: '(prefers-color-scheme: light)', color: '#f7f9fb' }],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" dir="ltr">
      <body className="antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
