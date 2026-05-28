import type { Metadata, Viewport } from 'next'
import './globals.css'
import { VERSION } from '@/lib/version'

export const metadata: Metadata = {
  title: 'PartyPulse',
  description: 'Realtime multiplayer party game for groups',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'PartyPulse' },
}

export const viewport: Viewport = {
  themeColor: '#7c3aed',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <script src="/register-sw.js" defer />
      </head>
      <body className="noise grid-bg min-h-screen">
        {children}
        <div style={{
          position: 'fixed',
          bottom: '8px',
          right: '10px',
          fontSize: '10px',
          color: 'rgba(255,255,255,0.15)',
          fontFamily: 'monospace',
          pointerEvents: 'none',
          zIndex: 9999,
          letterSpacing: '0.05em',
          userSelect: 'none',
        }}>
          PartyPulse {VERSION}
        </div>
      </body>
    </html>
  )
}
