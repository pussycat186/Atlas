import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Atlas Developer Portal',
  description: 'SDK quickstarts, API documentation, and integration guides for Atlas.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans">
        <div className="min-h-screen bg-gray-50">
          <header className="bg-white shadow-sm border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                <div className="flex items-center">
                  <h1 className="text-xl font-bold text-atlas-600">Atlas Developer Portal</h1>
                </div>
                <nav className="flex space-x-8">
                  <a href="/" className="text-gray-700 hover:text-atlas-600 px-3 py-2 rounded-md text-sm font-medium">
                    Quickstart
                  </a>
                  <a href="/docs" className="text-gray-700 hover:text-atlas-600 px-3 py-2 rounded-md text-sm font-medium">
                    API Docs
                  </a>
                  <a href="/sdk" className="text-gray-700 hover:text-atlas-600 px-3 py-2 rounded-md text-sm font-medium">
                    SDK
                  </a>
                  <a href="/examples" className="text-gray-700 hover:text-atlas-600 px-3 py-2 rounded-md text-sm font-medium">
                    Examples
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

