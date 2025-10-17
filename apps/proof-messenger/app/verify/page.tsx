// Verify Page - Paste JSON receipt and verify
'use client';

import React, { useState } from 'react';

export default function VerifyPage() {
  const [receiptText, setReceiptText] = useState('');
  const [verifyResult, setVerifyResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    setLoading(true);
    setVerifyResult(null);

    try {
      const receipt = JSON.parse(receiptText);
      
      // Call verify API
      const response = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receipt }),
      });

      const result = await response.json();
      setVerifyResult(result);
    } catch (error) {
      setVerifyResult({
        valid: false,
        error: 'Invalid JSON or verification failed',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Xác minh tin nhắn
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Dán JSON receipt để xác thực tính toàn vẹn
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Receipt JSON
          </label>
          <textarea
            value={receiptText}
            onChange={(e) => setReceiptText(e.target.value)}
            placeholder='{"message":"...","signature":"...","metadata":{...}}'
            className="w-full h-40 px-4 py-3 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />

          <button
            onClick={handleVerify}
            disabled={!receiptText.trim() || loading}
            className="w-full mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-lg"
          >
            {loading ? 'Đang xác minh...' : 'Xác minh'}
          </button>
        </div>

        {verifyResult && (
          <div className={`rounded-lg shadow-lg p-6 ${
            verifyResult.valid
              ? 'bg-green-50 dark:bg-green-900/20 border-2 border-green-500'
              : 'bg-red-50 dark:bg-red-900/20 border-2 border-red-500'
          }`}>
            <div className="flex items-center gap-3 mb-4">
              {verifyResult.valid ? (
                <>
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h2 className="text-2xl font-bold text-green-700 dark:text-green-400">
                    ✓ Xác minh thành công
                  </h2>
                </>
              ) : (
                <>
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h2 className="text-2xl font-bold text-red-700 dark:text-red-400">
                    ✗ Xác minh thất bại
                  </h2>
                </>
              )}
            </div>

            {verifyResult.valid && (
              <div className="space-y-2 text-gray-700 dark:text-gray-300">
                <p><strong>Key ID:</strong> {verifyResult.kid || 'N/A'}</p>
                <p><strong>Algorithm:</strong> {verifyResult.algorithm || 'N/A'}</p>
                <p><strong>Epoch:</strong> {verifyResult.epoch || 'N/A'}</p>
                <p><strong>Timestamp:</strong> {verifyResult.ts ? new Date(verifyResult.ts * 1000).toLocaleString('vi-VN') : 'N/A'}</p>
              </div>
            )}

            {verifyResult.error && (
              <p className="text-red-700 dark:text-red-300 mt-2">
                <strong>Error:</strong> {verifyResult.error}
              </p>
            )}
          </div>
        )}

        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
            Về xác minh tin nhắn
          </h3>
          <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
            <li>✓ Sử dụng RFC 9421 Message Signatures</li>
            <li>✓ Xác thực bằng ECDSA P-256</li>
            <li>✓ Mỗi tin nhắn có receipt riêng</li>
            <li>✓ Không thể giả mạo hoặc thay đổi</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
