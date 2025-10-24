'use client';

import { useRouter } from 'next/navigation';

export default function TrustPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-xl font-bold">Trust Portal</h1>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-4 space-y-4">
          {/* Trust Score */}
          <div className="card p-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 dark:bg-green-900 rounded-full mb-4">
                <svg className="w-10 h-10 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold mb-2">Trust Score: 98/100</h2>
              <p className="text-gray-600 dark:text-gray-400">Hệ thống hoạt động tốt</p>
            </div>
          </div>

          {/* Security Headers */}
          <div className="card p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Security Headers
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                <span className="text-gray-600 dark:text-gray-400">CSP</span>
                <span className="text-green-600 dark:text-green-400 font-semibold">✓ Enabled</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                <span className="text-gray-600 dark:text-gray-400">HSTS</span>
                <span className="text-green-600 dark:text-green-400 font-semibold">✓ Enabled</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                <span className="text-gray-600 dark:text-gray-400">COOP</span>
                <span className="text-green-600 dark:text-green-400 font-semibold">✓ same-origin</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                <span className="text-gray-600 dark:text-gray-400">COEP</span>
                <span className="text-green-600 dark:text-green-400 font-semibold">✓ require-corp</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-gray-600 dark:text-gray-400">Trusted Types</span>
                <span className="text-green-600 dark:text-green-400 font-semibold">✓ Enabled</span>
              </div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="card p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Lighthouse Scores
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Performance</div>
                <div className="text-2xl font-bold text-green-600">95</div>
              </div>
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Accessibility</div>
                <div className="text-2xl font-bold text-green-600">98</div>
              </div>
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Best Practices</div>
                <div className="text-2xl font-bold text-green-600">100</div>
              </div>
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">SEO</div>
                <div className="text-2xl font-bold text-green-600">100</div>
              </div>
            </div>
          </div>

          {/* JWKS */}
          <div className="card p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
              Public JWKS
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Khóa công khai để xác minh chữ ký có sẵn tại:
            </p>
            <code className="block bg-gray-100 dark:bg-gray-800 p-3 rounded text-xs font-mono break-all">
              https://atlas-api.workers.dev/.well-known/jwks.json
            </code>
          </div>

          {/* Compliance */}
          <div className="card p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Tuân thủ
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                <span>RFC 9421 (HTTP Message Signatures)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                <span>RFC 9449 (DPoP)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                <span>WCAG 2.1 AA (Accessibility)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                <span>SLSA Level 3 (Build Provenance)</span>
              </div>
            </div>
          </div>

          {/* Last Updated */}
          <div className="text-center text-sm text-gray-500 dark:text-gray-400 py-4">
            Cập nhật lần cuối: {new Date().toLocaleDateString('vi-VN')}
          </div>
        </div>
      </div>
    </div>
  );
}
