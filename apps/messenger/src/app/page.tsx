'use client';

import { useEffect, useState } from 'react';
import { useMessengerStore } from '../store/messenger';
import { ConversationList } from '../components/ConversationList';
import { ChatWindow } from '../components/ChatWindow';
import { AuthModal } from '../components/AuthModal';
import { Sidebar } from '../components/Sidebar';

export default function MessengerPage() {
  const { 
    currentUser, 
    isConnected, 
    setConnected, 
    setWSConnection,
    addMessage 
  } = useMessengerStore();
  
  const [showAuth, setShowAuth] = useState(!currentUser);

  // WebSocket connection management
  useEffect(() => {
    if (!currentUser) return;
    
    const ws = new WebSocket(`ws://localhost:3010/ws/${currentUser.id}`);
    
    ws.onopen = () => {
      setConnected(true);
      setWSConnection(ws);
      console.log('Connected to chat service');
    };
    
    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        
        if (payload.type === 'message') {
          addMessage(payload.data);
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };
    
    ws.onclose = () => {
      setConnected(false);
      setWSConnection(null);
      console.log('Disconnected from chat service');
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    return () => {
      ws.close();
    };
  }, [currentUser, setConnected, setWSConnection, addMessage]);

  if (!currentUser || showAuth) {
    return <AuthModal onClose={() => setShowAuth(false)} />;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Conversation List */}
      <div className="w-80 bg-white border-r border-gray-200">
        <ConversationList />
      </div>
      
      {/* Chat Window */}
      <div className="flex-1 flex flex-col">
        <ChatWindow />
      </div>
      
      {/* Connection Status */}
      <div className={`fixed top-4 right-4 px-3 py-1 rounded-full text-sm font-medium ${
        isConnected 
          ? 'bg-green-100 text-green-800' 
          : 'bg-red-100 text-red-800'
      }`}>
        {isConnected ? 'Connected' : 'Disconnected'}
      </div>
    </div>
  );
}