'use client';

export function DevPortalFooter() {
  return (
    <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center mb-4">
              <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                Atlas
              </span>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-4 max-w-md">
              Secure, scalable messaging platform with end-to-end encryption, 
              cryptographic receipts, and enterprise-grade security controls.
            </p>
            <div className="flex space-x-4">
              <a 
                href="https://github.com/pussycat186/Atlas"
                className="text-gray-500 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300"
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub
              </a>
              <a 
                href="/docs"
                className="text-gray-500 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300"
              >
                Documentation
              </a>
              <a 
                href="/community"
                className="text-gray-500 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300"
              >
                Community
              </a>
            </div>
          </div>

          {/* Documentation Links */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white tracking-wider uppercase mb-4">
              Documentation
            </h3>
            <ul className="space-y-3">
              <li>
                <a href="/docs/getting-started" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
                  Getting Started
                </a>
              </li>
              <li>
                <a href="/docs/api" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
                  API Reference
                </a>
              </li>
              <li>
                <a href="/docs/security" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
                  Security Guide
                </a>
              </li>
              <li>
                <a href="/examples" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
                  Examples
                </a>
              </li>
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white tracking-wider uppercase mb-4">
              Support
            </h3>
            <ul className="space-y-3">
              <li>
                <a href="/support" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
                  Help Center
                </a>
              </li>
              <li>
                <a href="/status" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
                  System Status
                </a>
              </li>
              <li>
                <a href="/changelog" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
                  Changelog
                </a>
              </li>
              <li>
                <a href="/contact" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
                  Contact Us
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              © 2024 Atlas Platform. Built with security and privacy by design.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="/privacy" className="text-gray-500 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300 text-sm">
                Privacy Policy
              </a>
              <a href="/terms" className="text-gray-500 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300 text-sm">
                Terms of Service
              </a>
              <a href="/security" className="text-gray-500 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300 text-sm">
                Security Policy
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}