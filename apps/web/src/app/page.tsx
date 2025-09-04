/**
 * Atlas Chat Page
 * Main chat interface with integrity verification
 */

'use client';

import React, { useState, useEffect } from 'react';
import { ChatRoom } from '@/components/ChatMessage';
import { chatService, type ChatMessage } from '@/lib/atlas-client';
import { format } from 'date-fns';

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [roomId] = useState('general');
  const [userId] = useState('user_' + Math.random().toString(36).substr(2, 9));
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Simulate connection status
    setIsConnected(true);
    
    // Add a welcome message
    const welcomeMessage: ChatMessage = {
      id: 'welcome',
      room_id: roomId,
      user_id: 'system',
      content: 'Welcome to Atlas Secure Chat! All messages are verified by our multi-witness quorum system.',
      timestamp: new Date().toISOString(),
      integrity_status: 'verified',
      quorum_count: 4,
      max_skew_ms: 150,
    };
    
    setMessages([welcomeMessage]);
  }, [roomId]);

  const handleSendMessage = async (content: string) => {
    try {
      const newMessage = await chatService.sendMessage(roomId, userId, content);
      setMessages(prev => [...prev, newMessage]);
    } catch (error) {
      console.error('Failed to send message:', error);
      // Add error message to chat
      const errorMessage: ChatMessage = {
        id: 'error_' + Date.now(),
        room_id: roomId,
        user_id: 'system',
        content: 'Failed to send message. Please try again.',
        timestamp: new Date().toISOString(),
        integrity_status: 'conflict',
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Atlas Secure Chat
        </h1>
        <p className="text-gray-600">
          Zero-crypto messaging with multi-witness quorum verification
        </p>
        
        {/* Connection Status */}
        <div className="mt-4 flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-sm text-gray-600">
            {isConnected ? 'Connected to Atlas Fabric' : 'Disconnected'}
          </span>
        </div>
      </div>

      {/* Chat Interface */}
      <div className="card h-96">
        <ChatRoom
          roomId={roomId}
          messages={messages}
          onSendMessage={handleSendMessage}
          className="h-full"
        />
      </div>

      {/* Integrity Information */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Multi-Witness Quorum
          </h3>
          <p className="text-gray-600 text-sm">
            Every message is verified by 4 out of 5 witness nodes across different regions.
          </p>
        </div>
        
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Zero-Crypto Security
          </h3>
          <p className="text-gray-600 text-sm">
            No traditional cryptography. Security through distributed consensus and time diversity.
          </p>
        </div>
        
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Real-time Verification
          </h3>
          <p className="text-gray-600 text-sm">
            Messages are verified in real-time with integrity badges showing verification status.
          </p>
        </div>
      </div>
    </div>
  );
}
