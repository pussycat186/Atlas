import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Atlas - Secure Messaging & Storage',
  description: 'Zero-crypto messaging and storage platform with multi-witness quorum',
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
                  <h1 className="text-xl font-bold text-atlas-600">Atlas</h1>
                  <span className="ml-2 text-sm text-gray-500">Secure Fabric</span>
                </div>
                <nav className="flex space-x-8">
                  <a href="/" className="text-gray-700 hover:text-atlas-600 px-3 py-2 rounded-md text-sm font-medium">
                    Chat
                  </a>
                  <a href="/drive" className="text-gray-700 hover:text-atlas-600 px-3 py-2 rounded-md text-sm font-medium">
                    Drive
                  </a>
                  <a href="/admin" className="text-gray-700 hover:text-atlas-600 px-3 py-2 rounded-md text-sm font-medium">
                    Admin
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
