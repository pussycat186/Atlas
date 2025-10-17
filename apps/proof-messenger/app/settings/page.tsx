// Settings Page - Theme and accessibility settings
'use client';

import React, { useState } from 'react';

export default function SettingsPage() {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [largeText, setLargeText] = useState(false);
  const [notifications, setNotifications] = useState(true);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-6 px-4 pb-20">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Cài đặt
        </h1>

        {/* Theme */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-4 shadow">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Giao diện</h3>
          <div className="space-y-3">
            {(['light', 'dark', 'system'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className={`w-full px-4 py-3 rounded-lg text-left flex items-center justify-between ${
                  theme === t
                    ? 'bg-blue-100 dark:bg-blue-900/30 border-2 border-blue-500'
                    : 'bg-gray-50 dark:bg-gray-700 border-2 border-transparent'
                }`}
              >
                <span className="font-medium text-gray-900 dark:text-white">
                  {t === 'light' && '☀️ Sáng'}
                  {t === 'dark' && '🌙 Tối'}
                  {t === 'system' && '💻 Theo hệ thống'}
                </span>
                {theme === t && (
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Accessibility */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-4 shadow">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Truy cập</h3>
          
          <div className="flex items-center justify-between py-3">
            <div>
              <div className="font-medium text-gray-900 dark:text-white">Hiển thị lớn</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Tăng kích thước chữ và nút
              </div>
            </div>
            <button
              onClick={() => setLargeText(!largeText)}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                largeText ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                  largeText ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-4 shadow">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Thông báo</h3>
          
          <div className="flex items-center justify-between py-3">
            <div>
              <div className="font-medium text-gray-900 dark:text-white">Bật thông báo</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Nhận thông báo tin nhắn mới
              </div>
            </div>
            <button
              onClick={() => setNotifications(!notifications)}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                notifications ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                  notifications ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* About */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Về Atlas</h3>
          <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <p><strong>Version:</strong> 1.0.0</p>
            <p><strong>Build:</strong> {new Date().toISOString().split('T')[0]}</p>
            <p><strong>Security:</strong> E2EE + PQC Ready</p>
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
            <a href="/terms" className="block text-blue-600 dark:text-blue-400 hover:underline">
              Điều khoản dịch vụ
            </a>
            <a href="/privacy" className="block text-blue-600 dark:text-blue-400 hover:underline">
              Chính sách bảo mật
            </a>
            <a href="https://github.com/pussycat186/Atlas" className="block text-blue-600 dark:text-blue-400 hover:underline">
              GitHub Repository
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}