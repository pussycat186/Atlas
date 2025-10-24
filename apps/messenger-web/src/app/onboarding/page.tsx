'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [username, setUsername] = useState('');

  const handlePasskeySetup = async () => {
    // Passkey stub - full WebAuthn implementation would go here
    console.log('Setting up passkey for:', username);
    
    // Simulate passkey creation
    localStorage.setItem('atlas_onboarded', 'true');
    localStorage.setItem('atlas_username', username);
    
    router.push('/chats');
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-950">
      <div className="w-full max-w-md px-6">
        <div className="card p-8">
          <h1 className="text-3xl font-bold text-center mb-2">
            Chào mừng đến Atlas
          </h1>
          <p className="text-center text-gray-600 dark:text-gray-400 mb-8">
            Nhắn tin mã hóa đầu cuối với xác thực passkey
          </p>

          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label htmlFor="username" className="block text-sm font-medium mb-2">
                  Tên người dùng
                </label>
                <input
                  id="username"
                  type="text"
                  className="input"
                  placeholder="Nhập tên của bạn"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="off"
                />
              </div>

              <button
                className="btn-primary w-full"
                onClick={() => setStep(2)}
                disabled={!username.trim()}
              >
                Tiếp theo
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="mx-auto w-20 h-20 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-10 h-10 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold mb-2">
                  Thiết lập Passkey
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                  Sử dụng passkey (vân tay, Face ID, hoặc mã PIN) để bảo vệ tài khoản của bạn
                </p>
              </div>

              <button
                className="btn-primary w-full"
                onClick={handlePasskeySetup}
              >
                Tạo Passkey
              </button>

              <button
                className="btn-secondary w-full"
                onClick={() => setStep(1)}
              >
                Quay lại
              </button>
            </div>
          )}

          <p className="mt-6 text-xs text-center text-gray-500 dark:text-gray-500">
            Bằng cách tiếp tục, bạn đồng ý với Điều khoản dịch vụ và Chính sách bảo mật của chúng tôi
          </p>
        </div>
      </div>
    </div>
  );
}
