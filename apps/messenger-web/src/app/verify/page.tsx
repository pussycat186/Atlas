'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function VerifyPage() {
  const router = useRouter();
  const [signature, setSignature] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState<{ valid: boolean; kid?: string; error?: string } | null>(null);

  const handleVerify = async () => {
    setVerifying(true);
    setResult(null);

    try {
      // Call atlas-api /verify endpoint
      const response = await fetch('https://atlas-api.workers.dev/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: {
            method: 'POST',
            url: 'https://example.com/test',
            headers: {},
          },
          signature: signature,
          signatureInput: 'sig=("@method" "@target-uri");keyid="test-key";alg="ed25519"',
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult({ valid: true, kid: data.kid });
      } else {
        setResult({ valid: false, error: data.error?.message || 'Xác minh thất bại' });
      }
    } catch (error) {
      setResult({ valid: false, error: 'Không thể kết nối đến máy chủ' });
    } finally {
      setVerifying(false);
    }
  };

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
        <h1 className="text-xl font-bold">Xác minh chữ ký</h1>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-2xl mx-auto">
          <div className="card p-6 mb-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold">RFC 9421 Signature</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Xác minh chữ ký HTTP Message Signatures
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="signature" className="block text-sm font-medium mb-2">
                  Chữ ký (Base64url)
                </label>
                <textarea
                  id="signature"
                  className="input min-h-[120px] font-mono text-xs"
                  placeholder="Nhập chữ ký cần xác minh..."
                  value={signature}
                  onChange={(e) => setSignature(e.target.value)}
                />
              </div>

              <button
                onClick={handleVerify}
                disabled={!signature.trim() || verifying}
                className="btn-primary w-full"
              >
                {verifying ? 'Đang xác minh...' : 'Xác minh'}
              </button>

              {result && (
                <div
                  className={`p-4 rounded-lg ${
                    result.valid
                      ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300'
                      : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {result.valid ? (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-semibold">Xác minh thành công</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-semibold">Xác minh thất bại</span>
                      </>
                    )}
                  </div>
                  {result.kid && (
                    <p className="text-sm">
                      Key ID: <code className="font-mono bg-white/50 px-1 rounded">{result.kid}</code>
                    </p>
                  )}
                  {result.error && <p className="text-sm">{result.error}</p>}
                </div>
              )}
            </div>
          </div>

          <div className="card p-6">
            <h3 className="font-semibold mb-3">Về xác minh chữ ký</h3>
            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
              <p>
                Atlas sử dụng <strong>RFC 9421 HTTP Message Signatures</strong> với Ed25519 để xác thực
                tính toàn vẹn của tin nhắn và biên nhận.
              </p>
              <p>
                Chữ ký được tạo trên máy khách và có thể xác minh bởi bất kỳ ai có quyền truy cập vào
                JWKS công khai tại <code className="font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded">/.well-known/jwks.json</code>
              </p>
              <p>
                Điều này đảm bảo tính minh bạch và khả năng kiểm tra toàn cầu.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
