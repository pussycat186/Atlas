// Onboarding Page - Passkey registration flow
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SecurityBadge } from '../(ui)/SecurityBadge';

export default function OnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'welcome' | 'passkey' | 'complete'>('welcome');

  const handlePasskeyRegistration = async () => {
    setLoading(true);
    try {
      // Stub: Real WebAuthn registration would go here
      // For now, simulate passkey creation
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setStep('complete');
      setTimeout(() => {
        router.push('/chats');
      }, 2000);
    } catch (error) {
      console.error('Passkey registration failed:', error);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
        {step === 'welcome' && (
          <div className="text-center">
            <div className="mb-6">
              <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Chào mừng đến Atlas
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Nhắn tin an toàn với xác thực từng tin nhắn
              </p>
            </div>

            <div className="mb-6">
              <SecurityBadge e2ee bound pqcPercentage={1} className="justify-center w-full" />
            </div>

            <div className="space-y-4 mb-6 text-left">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">E2EE mặc định</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Mã hóa đầu cuối cho mọi tin nhắn</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">Xác thực tin nhắn</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">RFC 9421 receipts cho mỗi tin</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">Post-Quantum ready</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">ML-KEM-768 canary deployment</div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setStep('passkey')}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
            >
              Bắt đầu
            </button>
          </div>
        )}

        {step === 'passkey' && (
          <div className="text-center">
            <div className="mb-6">
              <div className="w-20 h-20 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Tạo Passkey
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Đăng nhập an toàn không cần mật khẩu
              </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6 text-sm text-gray-700 dark:text-gray-300">
              <p className="mb-2">✨ Passkey sử dụng vân tay, Face ID, hoặc PIN của bạn</p>
              <p>🔒 An toàn hơn mật khẩu truyền thống</p>
            </div>

            <button
              onClick={handlePasskeyRegistration}
              disabled={loading}
              className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Đang tạo...' : 'Tạo Passkey'}
            </button>

            <button
              onClick={() => setStep('welcome')}
              className="w-full mt-3 px-6 py-3 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              Quay lại
            </button>
          </div>
        )}

        {step === 'complete' && (
          <div className="text-center">
            <div className="mb-6">
              <div className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Hoàn tất!
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Đang chuyển đến tin nhắn...
              </p>
            </div>
          </div>
        )}

        <div className="mt-6 text-center text-xs text-gray-500 dark:text-gray-400">
          <p>Bằng cách tiếp tục, bạn đồng ý với</p>
          <p>
            <a href="/terms" className="text-blue-600 dark:text-blue-400 hover:underline">Điều khoản</a>
            {' và '}
            <a href="/privacy" className="text-blue-600 dark:text-blue-400 hover:underline">Chính sách bảo mật</a>
          </p>
        </div>
      </div>
    </div>
  );
}
