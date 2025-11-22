/**
 * OnboardingPasskey Component
 * 
 * Component React cho quy trình onboarding với Passkey/WebAuthn
 * Hỗ trợ đăng ký và xác thực không mật khẩu theo chuẩn FIDO2
 * 
 * Tính năng:
 * - Đăng ký Passkey mới (registration)
 * - Xác thực bằng Passkey (authentication)
 * - UI/UX Việt hóa, thân thiện
 * - Xử lý lỗi rõ ràng
 */

import React, { useState } from 'react';

interface OnboardingPasskeyProps {
  onComplete: (credential: PublicKeyCredential) => void;
  onError: (error: Error) => void;
}

export const OnboardingPasskey: React.FC<OnboardingPasskeyProps> = ({
  onComplete,
  onError,
}) => {
  const [step, setStep] = useState<'welcome' | 'creating' | 'success'>('welcome');
  const [username, setUsername] = useState('');

  /**
   * Xử lý đăng ký Passkey mới
   */
  const handleCreatePasskey = async () => {
    try {
      setStep('creating');

      // TODO: Triển khai WebAuthn registration thực sự
      // 1. Gọi API để lấy challenge từ server
      // 2. Gọi navigator.credentials.create() với PublicKeyCredentialCreationOptions
      // 3. Gửi credential về server để xác thực
      // 4. Lưu credential ID và public key

      // Placeholder: giả lập tạo Passkey
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const mockCredential = {
        id: 'mock-credential-id',
        type: 'public-key',
      } as any;

      setStep('success');
      setTimeout(() => onComplete(mockCredential), 1000);
    } catch (error) {
      console.error('Passkey creation error:', error);
      onError(error as Error);
      setStep('welcome');
    }
  };

  /**
   * Render bước Welcome
   */
  const renderWelcome = () => (
    <div className="onboarding-welcome">
      <div className="atlas-logo">
        {/* TODO: Thêm logo SVG */}
        <div style={{ fontSize: '48px', color: '#00D4AA' }}>🔐</div>
      </div>
      
      <h1 style={{ color: '#0A2540', fontSize: '28px', marginTop: '20px' }}>
        Chào mừng đến với Atlas
      </h1>
      
      <p style={{ color: '#666', fontSize: '16px', marginTop: '12px', lineHeight: '1.6' }}>
        Nền tảng nhắn tin bảo mật đầu cuối (E2EE) với khả năng kiểm chứng minh bạch.
        Không cần mật khẩu - sử dụng Passkey an toàn hơn.
      </p>

      <div style={{ marginTop: '32px', marginBottom: '20px' }}>
        <label htmlFor="username" style={{ display: 'block', marginBottom: '8px', color: '#0A2540' }}>
          Tên hiển thị
        </label>
        <input
          id="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Nhập tên của bạn"
          style={{
            width: '100%',
            padding: '12px',
            fontSize: '16px',
            border: '2px solid #DDD',
            borderRadius: '8px',
            outline: 'none',
          }}
        />
      </div>

      <button
        onClick={handleCreatePasskey}
        disabled={!username.trim()}
        style={{
          width: '100%',
          padding: '16px',
          fontSize: '18px',
          fontWeight: 'bold',
          color: '#FFF',
          backgroundColor: username.trim() ? '#00D4AA' : '#CCC',
          border: 'none',
          borderRadius: '8px',
          cursor: username.trim() ? 'pointer' : 'not-allowed',
          transition: 'background-color 0.2s',
        }}
      >
        Tạo Passkey
      </button>

      <div style={{ marginTop: '24px', fontSize: '14px', color: '#888' }}>
        <p>✓ Không cần mật khẩu</p>
        <p>✓ Bảo mật bằng sinh trắc học hoặc PIN</p>
        <p>✓ Dữ liệu được mã hóa đầu cuối</p>
      </div>
    </div>
  );

  /**
   * Render bước Creating
   */
  const renderCreating = () => (
    <div className="onboarding-creating" style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '64px', marginBottom: '20px' }}>🔑</div>
      <h2 style={{ color: '#0A2540', fontSize: '24px' }}>Đang tạo Passkey...</h2>
      <p style={{ color: '#666', marginTop: '12px' }}>
        Vui lòng xác thực bằng sinh trắc học hoặc PIN của bạn
      </p>
      
      {/* Loading animation */}
      <div style={{ marginTop: '32px' }}>
        <div className="loading-spinner" style={{
          width: '48px',
          height: '48px',
          border: '4px solid #DDD',
          borderTop: '4px solid #00D4AA',
          borderRadius: '50%',
          margin: '0 auto',
          animation: 'spin 1s linear infinite',
        }} />
      </div>
      
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );

  /**
   * Render bước Success
   */
  const renderSuccess = () => (
    <div className="onboarding-success" style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '64px', marginBottom: '20px' }}>✅</div>
      <h2 style={{ color: '#00D4AA', fontSize: '24px' }}>Hoàn tất!</h2>
      <p style={{ color: '#666', marginTop: '12px' }}>
        Passkey của bạn đã được tạo thành công.
        Đang chuyển đến ứng dụng...
      </p>
    </div>
  );

  return (
    <div
      className="onboarding-container"
      style={{
        maxWidth: '440px',
        margin: '0 auto',
        padding: '40px 24px',
        fontFamily: 'Roboto, sans-serif',
      }}
    >
      {step === 'welcome' && renderWelcome()}
      {step === 'creating' && renderCreating()}
      {step === 'success' && renderSuccess()}
    </div>
  );
};

export default OnboardingPasskey;
