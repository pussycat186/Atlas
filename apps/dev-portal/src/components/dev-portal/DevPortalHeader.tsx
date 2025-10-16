'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';

export function DevPortalHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" aria-label="Top">
        <div className="w-full py-6 flex items-center justify-between border-b border-blue-500 lg:border-none">
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  Atlas
                </span>
                <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                  Developer Portal
                </span>
              </div>
            </Link>
            <div className="hidden ml-10 space-x-8 lg:block">
              <Link 
                href="/docs"
                className="text-base font-medium text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
              >
                Documentation
              </Link>
              <Link 
                href="/api-reference"
                className="text-base font-medium text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
              >
                API Reference
              </Link>
              <Link 
                href="/examples"
                className="text-base font-medium text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
              >
                Examples
              </Link>
              <Link 
                href="/sandbox"
                className="text-base font-medium text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
              >
                Sandbox
              </Link>
              <Link 
                href="/community"
                className="text-base font-medium text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
              >
                Community
              </Link>
            </div>
          </div>
          
          <div className="ml-10 space-x-4 flex items-center">
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            >
              {theme === 'dark' ? '🌞' : '🌙'}
            </button>
            
            <Link
              href="https://github.com/pussycat186/Atlas"
              className="inline-block bg-blue-600 py-2 px-4 border border-transparent rounded-md text-base font-medium text-white hover:bg-opacity-75"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </Link>
          </div>
        </div>
        
        <div className="py-4 flex flex-wrap justify-center space-x-6 lg:hidden">
          <Link 
            href="/docs"
            className="text-base font-medium text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
          >
            Documentation
          </Link>
          <Link 
            href="/api-reference"
            className="text-base font-medium text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
          >
            API Reference
          </Link>
          <Link 
            href="/examples"
            className="text-base font-medium text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
          >
            Examples
          </Link>
          <Link 
            href="/sandbox"
            className="text-base font-medium text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
          >
            Sandbox
          </Link>
        </div>
      </nav>
    </header>
  );
}