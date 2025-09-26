import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Atlas Proof Messenger - Verifiable Messaging',
  description: 'Zero-crypto messaging with multi-witness quorum verification and integrity timeline',
  manifest: '/manifest.json',
  themeColor: '#2563eb',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Atlas Messenger',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    shortcut: '/favicon.svg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="font-sans">
        {children}
      </body>
    </html>
  )
}

