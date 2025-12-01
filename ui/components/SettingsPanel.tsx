/**
 * SettingsPanel Component
 * 
 * Component React cho panel cài đặt
 * Bao gồm: PQC toggle, JWKS rotation, Privacy settings, Eco-Score
 */

import React, { useState } from 'react';

interface SettingsPanelProps {
  onSave: (settings: any) => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ onSave }) => {
  const [pqcEnabled, setPqcEnabled] = useState(false);
  const [jwksRotationDays, setJwksRotationDays] = useState(30);
  const [privacyLevel, setPrivacyLevel] = useState(2); // 0: Low, 1: Medium, 2: High
  const [telemetryOptOut, setTelemetryOptOut] = useState(false);

  const handleSave = () => {
    onSave({
      pqcEnabled,
      jwksRotationDays,
      privacyLevel,
      telemetryOptOut,
    });
    alert('Cài đặt đã được lưu!');
  };

  return (
    <div style={{ fontFamily: 'Roboto, sans-serif', padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ color: '#0A2540', fontSize: '28px', marginBottom: '8px' }}>⚙️ Cài đặt</h1>
      <p style={{ color: '#666', marginBottom: '32px' }}>Tùy chỉnh bảo mật và quyền riêng tư</p>

      {/* PQC Section */}
      <div style={{ backgroundColor: '#FFF', padding: '24px', borderRadius: '12px', marginBottom: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ color: '#0A2540', fontSize: '18px', marginBottom: '8px' }}>🔐 Post-Quantum Cryptography (PQC)</h3>
            <p style={{ color: '#666', fontSize: '14px', lineHeight: '1.5' }}>
              Bật mã hóa kháng lượng tử (ML-KEM-768, ML-DSA-3). Hiện đang ở chế độ canary.
            </p>
          </div>
          <label style={{ position: 'relative', display: 'inline-block', width: '60px', height: '34px' }}>
            <input
              type="checkbox"
              checked={pqcEnabled}
              onChange={(e) => setPqcEnabled(e.target.checked)}
              style={{ opacity: 0, width: 0, height: 0 }}
            />
            <span style={{
              position: 'absolute',
              cursor: 'pointer',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: pqcEnabled ? '#00D4AA' : '#CCC',
              transition: '0.4s',
              borderRadius: '34px',
            }}>
              <span style={{
                position: 'absolute',
                content: '""',
                height: '26px',
                width: '26px',
                left: pqcEnabled ? '30px' : '4px',
                bottom: '4px',
                backgroundColor: 'white',
                transition: '0.4s',
                borderRadius: '50%',
              }} />
            </span>
          </label>
        </div>
      </div>

      {/* JWKS Rotation */}
      <div style={{ backgroundColor: '#FFF', padding: '24px', borderRadius: '12px', marginBottom: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <h3 style={{ color: '#0A2540', fontSize: '18px', marginBottom: '12px' }}>🔑 JWKS Key Rotation</h3>
        <p style={{ color: '#666', fontSize: '14px', marginBottom: '16px' }}>
          Tần suất rotation khóa ký: <strong>{jwksRotationDays} ngày</strong>
        </p>
        <input
          type="range"
          min="7"
          max="90"
          value={jwksRotationDays}
          onChange={(e) => setJwksRotationDays(Number(e.target.value))}
          style={{ width: '100%', accentColor: '#00D4AA' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#999', marginTop: '8px' }}>
          <span>7 ngày</span>
          <span>90 ngày</span>
        </div>
      </div>

      {/* Privacy Level */}
      <div style={{ backgroundColor: '#FFF', padding: '24px', borderRadius: '12px', marginBottom: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <h3 style={{ color: '#0A2540', fontSize: '18px', marginBottom: '12px' }}>🛡️ Mức độ riêng tư</h3>
        <div style={{ display: 'flex', gap: '12px' }}>
          {['Thấp', 'Trung bình', 'Cao'].map((level, index) => (
            <button
              key={index}
              onClick={() => setPrivacyLevel(index)}
              style={{
                flex: 1,
                padding: '16px',
                fontSize: '15px',
                fontWeight: privacyLevel === index ? 'bold' : 'normal',
                color: privacyLevel === index ? '#FFF' : '#0A2540',
                backgroundColor: privacyLevel === index ? '#00D4AA' : '#F0F0F0',
                border: privacyLevel === index ? '2px solid #00D4AA' : '2px solid #DDD',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {level}
            </button>
          ))}
        </div>
        <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#F9F9F9', borderRadius: '6px', fontSize: '14px', color: '#666' }}>
          {privacyLevel === 0 && '• Metadata cơ bản • Tối ưu hiệu năng'}
          {privacyLevel === 1 && '• Giảm metadata • Cân bằng hiệu năng và riêng tư'}
          {privacyLevel === 2 && '• Metadata tối thiểu • Onion routing • Độ trễ cao hơn'}
        </div>
      </div>

      {/* Telemetry */}
      <div style={{ backgroundColor: '#FFF', padding: '24px', borderRadius: '12px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
          <input
            type="checkbox"
            id="telemetry"
            checked={telemetryOptOut}
            onChange={(e) => setTelemetryOptOut(e.target.checked)}
            style={{ marginTop: '4px', accentColor: '#00D4AA', width: '20px', height: '20px', cursor: 'pointer' }}
          />
          <div>
            <label htmlFor="telemetry" style={{ color: '#0A2540', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', display: 'block' }}>
              Từ chối telemetry
            </label>
            <p style={{ color: '#666', fontSize: '14px', marginTop: '4px', lineHeight: '1.5' }}>
              Không gửi dữ liệu sử dụng ẩn danh. Chúng tôi chỉ thu thập số liệu tối thiểu để cải thiện dịch vụ.
            </p>
          </div>
        </div>
      </div>

      {/* Eco-Score Display */}
      <div style={{ backgroundColor: '#E8F5E9', padding: '24px', borderRadius: '12px', marginBottom: '24px', border: '2px solid #4CAF50' }}>
        <h3 style={{ color: '#2E7D32', fontSize: '18px', marginBottom: '12px' }}>🌱 Eco-Score</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#4CAF50' }}>A+</div>
          <div>
            <p style={{ color: '#2E7D32', fontSize: '14px', marginBottom: '4px' }}>
              Carbon footprint: <strong>0.8g CO₂/message</strong>
            </p>
            <p style={{ color: '#666', fontSize: '13px' }}>
              Bạn đang giúp bảo vệ môi trường bằng cách sử dụng Atlas!
            </p>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        style={{
          width: '100%',
          padding: '16px',
          fontSize: '18px',
          fontWeight: 'bold',
          color: '#FFF',
          backgroundColor: '#00D4AA',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          transition: 'background-color 0.2s',
        }}
      >
        💾 Lưu cài đặt
      </button>
    </div>
  );
};

export default SettingsPanel;
