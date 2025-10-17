// Individual Chat Page - Compose/send/verified/receipt display
'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { SecurityBadge } from '../../(ui)/SecurityBadge';
import { ReceiptModal } from '../../(ui)/ReceiptModal';

interface Message {
  id: string;
  text: string;
  sender: 'me' | 'them';
  timestamp: string;
  verified: boolean;
  receipt?: any;
}

const MOCK_MESSAGES: Message[] = [
  {
    id: '1',
    text: 'Xin chào! Bạn khỏe không?',
    sender: 'them',
    timestamp: '10:00',
    verified: true,
    receipt: {
      message: 'SGVsbG8=',
      signature: 'sig1=:MEUCIQDxyz...:',
      metadata: { kid: 'kid-2024-10', algorithm: 'ecdsa-p256-sha256', created: 1697500800, verified: true }
    }
  },
  {
    id: '2',
    text: 'Mình khỏe, cảm ơn bạn!',
    sender: 'me',
    timestamp: '10:05',
    verified: true,
  },
];

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const chatId = params?.id as string;
  
  const [messages, setMessages] = useState<Message[]>(MOCK_MESSAGES);
  const [newMessage, setNewMessage] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState<any | null>(null);

  const chatName = chatId === 'family' ? 'Gia đình' : chatId === 'work' ? 'Nhóm công việc' : 'Chat';

  const handleSend = () => {
    if (!newMessage.trim()) return;

    const message: Message = {
      id: Date.now().toString(),
      text: newMessage,
      sender: 'me',
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      verified: true,
      receipt: {
        message: btoa(newMessage),
        signature: `sig1=:${Math.random().toString(36).substring(7)}...:`,
        metadata: {
          kid: 'kid-2024-10',
          algorithm: 'ecdsa-p256-sha256',
          created: Math.floor(Date.now() / 1000),
          verified: true
        }
      }
    };

    setMessages([...messages, message]);
    setNewMessage('');
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          aria-label="Back"
        >
          <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
          {chatName.charAt(0).toUpperCase()}
        </div>
        
        <div className="flex-1">
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">{chatName}</h1>
          <SecurityBadge e2ee bound pqcPercentage={1} className="scale-75 origin-left" />
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[75%] ${msg.sender === 'me' ? 'order-2' : 'order-1'}`}>
              <div
                className={`px-4 py-2 rounded-2xl text-base ${
                  msg.sender === 'me'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white'
                }`}
              >
                <p className="break-words">{msg.text}</p>
              </div>
              
              <div className={`flex items-center gap-2 mt-1 px-2 ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                <span className="text-xs text-gray-500 dark:text-gray-400">{msg.timestamp}</span>
                {msg.verified && (
                  <button
                    onClick={() => msg.receipt && setSelectedReceipt(msg.receipt)}
                    className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 hover:underline"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Verified
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-end gap-2">
          <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-2xl px-4 py-2">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Nhập tin nhắn..."
              className="w-full bg-transparent text-gray-900 dark:text-white resize-none outline-none text-base max-h-32"
              rows={1}
              aria-label="Message input"
            />
          </div>
          
          <button
            onClick={handleSend}
            disabled={!newMessage.trim()}
            className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Send message"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
        
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
          E2EE enabled • Mọi tin nhắn đều được xác thực
        </p>
      </div>

      {/* Receipt Modal */}
      {selectedReceipt && (
        <ReceiptModal
          receipt={selectedReceipt}
          isOpen={!!selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
        />
      )}
    </div>
  );
}
