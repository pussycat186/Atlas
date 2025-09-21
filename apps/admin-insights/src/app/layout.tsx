import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '@atlas/design-system/src/styles/globals.css';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Atlas Admin & Insights',
  description: 'Cluster health monitoring, witness quorum status, and system metrics dashboard.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-gray-50">
          <header className="bg-white shadow-sm border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                <div className="flex items-center">
                  <h1 className="text-xl font-bold text-atlas-600">Atlas Admin & Insights</h1>
                </div>
                <nav className="flex space-x-8">
                  <a href="/" className="text-gray-700 hover:text-atlas-600 px-3 py-2 rounded-md text-sm font-medium">
                    Dashboard
                  </a>
                  <a href="/metrics" className="text-gray-700 hover:text-atlas-600 px-3 py-2 rounded-md text-sm font-medium">
                    Metrics
                  </a>
                  <a href="/traces" className="text-gray-700 hover:text-atlas-600 px-3 py-2 rounded-md text-sm font-medium">
                    Traces
                  </a>
                  <a href="/witnesses" className="text-gray-700 hover:text-atlas-600 px-3 py-2 rounded-md text-sm font-medium">
                    Witnesses
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
  );
}

