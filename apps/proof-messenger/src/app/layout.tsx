import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Atlas Proof Messenger - Verifiable Messaging',
  description: 'Zero-crypto messaging with multi-witness quorum verification and integrity timeline',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-gray-50">
          <header className="bg-white shadow-sm border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                <div className="flex items-center">
                  <h1 className="text-xl font-bold text-atlas-600">Atlas Proof Messenger</h1>
                  <span className="ml-2 text-sm text-gray-500">Verifiable Messaging</span>
                </div>
                <nav className="flex space-x-8">
                  <a href="/" className="text-gray-700 hover:text-atlas-600 px-3 py-2 rounded-md text-sm font-medium">
                    Messages
                  </a>
                  <a href="/receipts" className="text-gray-700 hover:text-atlas-600 px-3 py-2 rounded-md text-sm font-medium">
                    Receipts
                  </a>
                  <a href="/evidence" className="text-gray-700 hover:text-atlas-600 px-3 py-2 rounded-md text-sm font-medium">
                    Evidence
                  </a>
                  <a href="/settings" className="text-gray-700 hover:text-atlas-600 px-3 py-2 rounded-md text-sm font-medium">
                    Settings
                  </a>
                </nav>
              </div>
            </div>
          </header>
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}

