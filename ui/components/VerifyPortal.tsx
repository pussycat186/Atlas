/**
 * VerifyPortal Component
 * 
 * Component React cho Trust Portal - xác thực receipts
 * Cho phép scan QR code (giả lập) và filter theo kid/epoch
 * Hiển thị kết quả xác thực và thông tin JWKS
 */

import React, { useState } from 'react';

interface Receipt {
  id: string;
  messageId: string;
  kid: string;
  algorithm: string;
  epoch: number;
  timestamp: number;
  signature: string;
  verified: boolean | null;
}

interface VerifyPortalProps {
  onVerifyReceipt: (receiptId: string) => Promise<boolean>;
}

export const VerifyPortal: React.FC<VerifyPortalProps> = ({ onVerifyReceipt }) => {
  const [receiptInput, setReceiptInput] = useState('');
  const [filter, setFilter] = useState({ kid: '', epoch: '' });
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerify = async () => {
    if (!receiptInput.trim() || isVerifying) return;

    try {
      setIsVerifying(true);
      const isValid = await onVerifyReceipt(receiptInput);
      
      const newReceipt: Receipt = {
        id: receiptInput,
        messageId: `msg_${Date.now()}`,
        kid: 'key-2025-01',
        algorithm: 'ed25519',
        epoch: 123,
        timestamp: Date.now(),
        signature: receiptInput.substring(0, 32) + '...',
        verified: isValid,
      };
      
      setReceipts([newReceipt, ...receipts]);
      setReceiptInput('');
    } catch (error) {
      console.error('Verify error:', error);
    } finally {
      setIsVerifying(false);
    }
  };

  const filteredReceipts = receipts.filter(r => {
    if (filter.kid && !r.kid.includes(filter.kid)) return false;
    if (filter.epoch && r.epoch.toString() !== filter.epoch) return false;
    return true;
  });

  return (
    <div style={{ fontFamily: 'Roboto, sans-serif', padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
      <h1 style={{ color: '#0A2540', fontSize: '32px', marginBottom: '8px' }}>🔍 Trust Portal</h1>
      <p style={{ color: '#666', marginBottom: '32px' }}>Xác thực receipts và kiểm tra tính toàn vẹn tin nhắn</p>

      {/* Input section */}
      <div style={{ backgroundColor: '#FFF', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', marginBottom: '24px' }}>
        <label style={{ display: 'block', marginBottom: '12px', color: '#0A2540', fontWeight: 'bold' }}>
          Receipt ID hoặc Signature
        </label>
        <div style={{ display: 'flex', gap: '12px' }}>
          <input
            type="text"
            value={receiptInput}
            onChange={(e) => setReceiptInput(e.target.value)}
            placeholder="Nhập receipt ID hoặc scan QR code..."
            style={{ flex: 1, padding: '12px', fontSize: '15px', border: '2px solid #DDD', borderRadius: '8px' }}
          />
          <button
            onClick={handleVerify}
            disabled={!receiptInput.trim() || isVerifying}
            style={{
              padding: '12px 32px',
              fontSize: '16px',
              fontWeight: 'bold',
              color: '#FFF',
              backgroundColor: receiptInput.trim() && !isVerifying ? '#00D4AA' : '#CCC',
              border: 'none',
              borderRadius: '8px',
              cursor: receiptInput.trim() && !isVerifying ? 'pointer' : 'not-allowed',
            }}
          >
            {isVerifying ? 'Đang xác thực...' : 'Xác thực'}
          </button>
          <button
            style={{
              padding: '12px 24px',
              fontSize: '16px',
              color: '#0A2540',
              backgroundColor: '#F0F0F0',
              border: '2px solid #DDD',
              borderRadius: '8px',
              cursor: 'pointer',
            }}
            title="Scan QR code (giả lập)"
          >
            📷 QR
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <input
          type="text"
          placeholder="Filter by kid..."
          value={filter.kid}
          onChange={(e) => setFilter({ ...filter, kid: e.target.value })}
          style={{ padding: '10px', fontSize: '14px', border: '1px solid #DDD', borderRadius: '6px', width: '200px' }}
        />
        <input
          type="text"
          placeholder="Filter by epoch..."
          value={filter.epoch}
          onChange={(e) => setFilter({ ...filter, epoch: e.target.value })}
          style={{ padding: '10px', fontSize: '14px', border: '1px solid #DDD', borderRadius: '6px', width: '150px' }}
        />
        <button
          onClick={() => setFilter({ kid: '', epoch: '' })}
          style={{ padding: '10px 20px', fontSize: '14px', backgroundColor: '#F0F0F0', border: '1px solid #DDD', borderRadius: '6px', cursor: 'pointer' }}
        >
          Xóa filter
        </button>
      </div>

      {/* Results */}
      <div>
        <h2 style={{ color: '#0A2540', fontSize: '20px', marginBottom: '16px' }}>
          Kết quả ({filteredReceipts.length})
        </h2>
        
        {filteredReceipts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#999' }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>📝</div>
            <p>Chưa có receipts nào được xác thực</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '16px' }}>
            {filteredReceipts.map((receipt) => (
              <div
                key={receipt.id}
                style={{
                  backgroundColor: '#FFF',
                  padding: '20px',
                  borderRadius: '12px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  borderLeft: `4px solid ${receipt.verified ? '#4CAF50' : '#E74C3C'}`,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#0A2540' }}>
                      {receipt.verified ? '✓ Hợp lệ' : '✗ Không hợp lệ'}
                    </div>
                    <div style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>
                      {new Date(receipt.timestamp).toLocaleString('vi-VN')}
                    </div>
                  </div>
                  <div style={{ fontSize: '32px' }}>{receipt.verified ? '🟢' : '🔴'}</div>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '8px', fontSize: '14px' }}>
                  <div style={{ color: '#666' }}>Message ID:</div>
                  <div style={{ fontFamily: 'monospace', color: '#0A2540' }}>{receipt.messageId}</div>
                  
                  <div style={{ color: '#666' }}>Key ID (kid):</div>
                  <div style={{ fontFamily: 'monospace', color: '#0A2540' }}>{receipt.kid}</div>
                  
                  <div style={{ color: '#666' }}>Algorithm:</div>
                  <div style={{ fontFamily: 'monospace', color: '#0A2540' }}>{receipt.algorithm}</div>
                  
                  <div style={{ color: '#666' }}>Epoch:</div>
                  <div style={{ fontFamily: 'monospace', color: '#0A2540' }}>{receipt.epoch}</div>
                  
                  <div style={{ color: '#666' }}>Signature:</div>
                  <div style={{ fontFamily: 'monospace', color: '#0A2540', wordBreak: 'break-all' }}>
                    {receipt.signature}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyPortal;
