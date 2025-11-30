/**
 * ChatView Component
 * 
 * Component React cho màn hình chat chính
 * Hiển thị danh sách tin nhắn với lock badge để verify
 * Hỗ trợ E2EE, hiển thị epochs (MLS), và receipt verification
 * 
 * Tính năng:
 * - Danh sách tin nhắn với bubble design
 * - Lock badge tap-to-verify cho mỗi tin
 * - Hiển thị trạng thái E2EE và epoch
 * - Input tin nhắn với mã hóa tự động
 * - Scroll tự động đến tin mới nhất
 */

import React, { useState, useRef, useEffect } from 'react';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: number;
  encrypted: boolean;
  epoch: number;
  receiptId?: string;
  verified?: boolean;
}

interface ChatViewProps {
  conversationId: string;
  messages: Message[];
  currentUserId: string;
  onSendMessage: (content: string) => Promise<void>;
  onVerifyReceipt: (receiptId: string) => Promise<boolean>;
}

export const ChatView: React.FC<ChatViewProps> = ({
  conversationId,
  messages,
  currentUserId,
  onSendMessage,
  onVerifyReceipt,
}) => {
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [verifyingReceipt, setVerifyingReceipt] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  /**
   * Scroll đến tin nhắn mới nhất
   */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /**
   * Xử lý gửi tin nhắn
   */
  const handleSendMessage = async () => {
    if (!inputText.trim() || isSending) return;

    try {
      setIsSending(true);
      await onSendMessage(inputText);
      setInputText('');
    } catch (error) {
      console.error('Send message error:', error);
      alert('Không thể gửi tin nhắn. Vui lòng thử lại.');
    } finally {
      setIsSending(false);
    }
  };

  /**
   * Xử lý verify receipt
   */
  const handleVerifyReceipt = async (receiptId: string) => {
    try {
      setVerifyingReceipt(receiptId);
      const isValid = await onVerifyReceipt(receiptId);
      
      if (isValid) {
        alert('✓ Receipt hợp lệ - Tin nhắn đã được xác thực');
      } else {
        alert('✗ Receipt không hợp lệ - Có thể bị giả mạo');
      }
    } catch (error) {
      console.error('Verify receipt error:', error);
      alert('Không thể xác thực receipt');
    } finally {
      setVerifyingReceipt(null);
    }
  };

  /**
   * Render một message bubble
   */
  const renderMessage = (message: Message) => {
    const isOwnMessage = message.senderId === currentUserId;

    return (
      <div
        key={message.id}
        style={{
          display: 'flex',
          flexDirection: isOwnMessage ? 'row-reverse' : 'row',
          marginBottom: '16px',
          alignItems: 'flex-end',
        }}
      >
        {/* Avatar placeholder */}
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            backgroundColor: isOwnMessage ? '#00D4AA' : '#0A2540',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFF',
            fontSize: '14px',
            fontWeight: 'bold',
            flexShrink: 0,
            margin: isOwnMessage ? '0 0 0 8px' : '0 8px 0 0',
          }}
        >
          {message.senderName.charAt(0).toUpperCase()}
        </div>

        {/* Message bubble */}
        <div
          style={{
            maxWidth: '70%',
            backgroundColor: isOwnMessage ? '#00D4AA' : '#F0F0F0',
            color: isOwnMessage ? '#FFF' : '#0A2540',
            padding: '12px 16px',
            borderRadius: '16px',
            position: 'relative',
          }}
        >
          {!isOwnMessage && (
            <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>
              {message.senderName}
            </div>
          )}
          
          <div style={{ fontSize: '15px', lineHeight: '1.4' }}>
            {message.content}
          </div>

          {/* Metadata bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: '8px',
              fontSize: '11px',
              opacity: 0.7,
            }}
          >
            <span>
              {new Date(message.timestamp).toLocaleTimeString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>

            <span style={{ marginLeft: '8px' }}>Epoch {message.epoch}</span>
          </div>

          {/* Lock badge - tap to verify */}
          {message.encrypted && message.receiptId && (
            <button
              onClick={() => handleVerifyReceipt(message.receiptId!)}
              disabled={verifyingReceipt === message.receiptId}
              style={{
                position: 'absolute',
                bottom: '-8px',
                right: '8px',
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                border: '2px solid #FFF',
                backgroundColor: message.verified ? '#4CAF50' : '#FFA500',
                color: '#FFF',
                fontSize: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
              }}
              title="Nhấn để xác thực receipt"
            >
              {verifyingReceipt === message.receiptId ? '⏳' : '🔒'}
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div
      className="chat-view-container"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        fontFamily: 'Roboto, sans-serif',
        backgroundColor: '#FAFAFA',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '16px',
          backgroundColor: '#0A2540',
          color: '#FFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: '18px' }}>Cuộc trò chuyện</h2>
          <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '4px' }}>
            🔐 E2EE được bật · ID: {conversationId.substring(0, 8)}...
          </div>
        </div>
        
        <div style={{ fontSize: '24px', cursor: 'pointer' }}>⋮</div>
      </div>

      {/* Messages area */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px',
        }}
      >
        {messages.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#999', marginTop: '40px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>💬</div>
            <p>Chưa có tin nhắn nào</p>
            <p style={{ fontSize: '14px' }}>Gửi tin nhắn đầu tiên để bắt đầu</p>
          </div>
        ) : (
          messages.map(renderMessage)
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div
        style={{
          padding: '16px',
          backgroundColor: '#FFF',
          borderTop: '1px solid #E0E0E0',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="Nhập tin nhắn (sẽ được mã hóa E2EE)..."
          disabled={isSending}
          style={{
            flex: 1,
            padding: '12px 16px',
            fontSize: '15px',
            border: '1px solid #DDD',
            borderRadius: '24px',
            outline: 'none',
          }}
        />

        <button
          onClick={handleSendMessage}
          disabled={!inputText.trim() || isSending}
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            border: 'none',
            backgroundColor: inputText.trim() && !isSending ? '#00D4AA' : '#CCC',
            color: '#FFF',
            fontSize: '20px',
            cursor: inputText.trim() && !isSending ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background-color 0.2s',
          }}
        >
          {isSending ? '⏳' : '➤'}
        </button>
      </div>
    </div>
  );
};

export default ChatView;
