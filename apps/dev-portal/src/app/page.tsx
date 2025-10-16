import { Metadata } from 'next';
import { DevPortalLayout } from '@/components/dev-portal/DevPortalLayout';
import { DocumentationGrid } from '@/components/dev-portal/DocumentationGrid';
import { QuickStart } from '@/components/dev-portal/QuickStart';
import { CodeExamples } from '@/components/dev-portal/CodeExamples';
import { Sandbox } from '@/components/dev-portal/Sandbox';

export const metadata: Metadata = {
  title: 'Atlas Developer Portal',
  description: 'Complete developer documentation, APIs, SDKs, and testing tools for Atlas',
};

export default function DevPortalPage() {
  return (
    <DevPortalLayout>
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl">
              Atlas Developer Portal
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Everything you need to build secure, scalable applications with Atlas. 
              From getting started guides to advanced API documentation.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <button className="rounded-md bg-blue-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">
                Get Started
              </button>
              <button className="text-sm font-semibold leading-6 text-gray-900 dark:text-white">
                View API Docs <span aria-hidden="true">→</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Start Section */}
      <section className="py-12 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <QuickStart />
        </div>
      </section>

      {/* Documentation Grid */}
      <section className="py-12 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
              Developer Resources
            </h2>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
              Comprehensive guides, references, and tools for Atlas development
            </p>
          </div>
          <DocumentationGrid />
        </div>
      </section>

      {/* Code Examples */}
      <section className="py-12 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
              Code Examples
            </h2>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
              Ready-to-use code snippets and implementation patterns
            </p>
          </div>
          <CodeExamples />
        </div>
      </section>

      {/* Interactive Sandbox */}
      <section className="py-12 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
              Interactive Testing
            </h2>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
              Test Atlas APIs and features in real-time without leaving the portal
            </p>
          </div>
          <Sandbox />
        </div>
      </section>

      {/* Developer Tools */}
      <section className="py-12 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
              Developer Tools
            </h2>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
              CLI tools, SDKs, and debugging utilities
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                Atlas CLI
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Command-line interface for Atlas development and deployment
              </p>
              <pre className="bg-gray-800 text-green-400 p-3 rounded text-sm overflow-x-auto">
npm install -g @atlas/cli
atlas init my-project
atlas deploy --env production
              </pre>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                SDKs & Libraries
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Official SDKs for multiple programming languages
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-blue-600 dark:text-blue-400">•</span>
                  <span className="text-sm">@atlas/js-sdk</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-blue-600 dark:text-blue-400">•</span>
                  <span className="text-sm">@atlas/react-hooks</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-blue-600 dark:text-blue-400">•</span>
                  <span className="text-sm">@atlas/security-middleware</span>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                Debugging Tools
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Debug Atlas applications and troubleshoot issues
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-green-600 dark:text-green-400">•</span>
                  <span className="text-sm">Network Inspector</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-600 dark:text-green-400">•</span>
                  <span className="text-sm">Performance Profiler</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-600 dark:text-green-400">•</span>
                  <span className="text-sm">Security Analyzer</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Status & Support */}
      <section className="py-12 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                System Status
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-300">API Gateway</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Operational
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Authentication</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Operational
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Database</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Operational
                  </span>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                Support & Community
              </h3>
              <div className="space-y-3">
                <a href="/docs/support" className="block text-blue-600 dark:text-blue-400 hover:underline">
                  📋 Submit Support Ticket
                </a>
                <a href="/docs/community" className="block text-blue-600 dark:text-blue-400 hover:underline">
                  💬 Community Forum
                </a>
                <a href="/docs/changelog" className="block text-blue-600 dark:text-blue-400 hover:underline">
                  📝 Changelog & Updates
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </DevPortalLayout>
  );
}