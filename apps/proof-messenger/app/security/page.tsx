// Security Page - DPoP toggle, PQC slider, JWKS download
'use client';

import React, { useState } from 'react';

export default function SecurityPage() {
  const [dpopEnabled, setDpopEnabled] = useState(true);
  const [pqcPercentage, setPqcPercentage] = useState(1);

  const handleDownloadJWKS = () => {
    const jwks = {
      keys: [
        {
          kty: 'EC',
          crv: 'P-256',
          kid: 'kid-2024-10',
          x: 'placeholder_x',
          y: 'placeholder_y',
          use: 'sig',
          alg: 'ES256'
        }
      ]
    };

    const blob = new Blob([JSON.stringify(jwks, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'jwks.json';
    a.click();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-6 px-4 pb-20">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Bảo mật
        </h1>

        {/* DPoP Toggle */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-4 shadow">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">DPoP Binding</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Gắn token với device-specific proof
              </p>
            </div>
            <button
              onClick={() => setDpopEnabled(!dpopEnabled)}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                dpopEnabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                  dpopEnabled ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          <div className={`mt-3 text-sm ${dpopEnabled ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}`}>
            {dpopEnabled ? '✓ Đã bật - Mọi request đều có proof' : '✗ Đã tắt'}
          </div>
        </div>

        {/* PQC Slider */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-4 shadow">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
            Post-Quantum Cryptography
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Tỷ lệ sử dụng ML-KEM-768 (canary deployment)
          </p>
          
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="0"
              max="100"
              value={pqcPercentage}
              onChange={(e) => setPqcPercentage(Number(e.target.value))}
              className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-600"
            />
            <span className="text-lg font-semibold text-gray-900 dark:text-white w-16 text-right">
              {pqcPercentage}%
            </span>
          </div>

          <div className="mt-3 text-sm text-purple-600 dark:text-purple-400">
            {pqcPercentage === 0 && '✗ PQC disabled'}
            {pqcPercentage > 0 && pqcPercentage <= 10 && '⚠️ Canary mode (testing)'}
            {pqcPercentage > 10 && pqcPercentage < 100 && '⚡ Scaling in progress'}
            {pqcPercentage === 100 && '✓ Full PQC deployment'}
          </div>
        </div>

        {/* JWKS Download */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
            JSON Web Key Set (JWKS)
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Tải public keys để xác thực signatures
          </p>

          <button
            onClick={handleDownloadJWKS}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Tải JWKS
          </button>

          <div className="mt-4 bg-gray-50 dark:bg-gray-900 rounded p-3 text-xs font-mono text-gray-700 dark:text-gray-300">
            <p>Kid: kid-2024-10</p>
            <p>Algorithm: ES256</p>
            <p>Rotation: Every 90 days</p>
          </div>
        </div>

        <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Thông tin bảo mật</h4>
          <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
            <li>✓ E2EE mặc định cho mọi tin nhắn</li>
            <li>✓ RFC 9421 Message Signatures</li>
            <li>✓ DPoP token binding (RFC 9449)</li>
            <li>✓ ML-KEM-768 Post-Quantum ready</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
