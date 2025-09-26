'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Chip } from './Primitives';

interface Message {
  id: string;
  text: string;
  sender: 'self' | 'system';
  timestamp: Date;
  status: 'sending' | 'sent' | 'verified';
  reactions: string[];
  thread?: Message[];
}

interface MessengerProps {
  sku: 'basic' | 'pro';
  theme: 'dark' | 'light';
}

export default function Messenger({ sku, theme }: MessengerProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Welcome to Atlas Prism! Your secure messaging is now active.',
      sender: 'system',
      timestamp: new Date(Date.now() - 300000),
      status: 'verified',
      reactions: ['👍'],
      thread: [
        { id: '1a', text: 'Thanks for the welcome!', sender: 'self', timestamp: new Date(Date.now() - 250000), status: 'verified', reactions: [] }
      ]
    },
    {
      id: '2',
      text: 'Testing quantum-resistant encryption...',
      sender: 'self',
      timestamp: new Date(Date.now() - 120000),
      status: 'verified',
      reactions: ['🔥', '✨'],
    },
    {
      id: '3',
      text: 'All systems operational. Multi-witness verification complete.',
      sender: 'system',
      timestamp: new Date(Date.now() - 60000),
      status: 'verified',
      reactions: [],
    }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [openThread, setOpenThread] = useState<string | null>(null);
  const [liveEvents, setLiveEvents] = useState<string[]>([]);
  const messagesRef = useRef<HTMLDivElement>(null);

  // Live ticker for Pro
  useEffect(() => {
    if (sku === 'pro') {
      const interval = setInterval(() => {
        const events = ['Witness sync +1', 'PQC handshake ✓', 'Edge route optimized', 'Quantum entropy +128'];
        setLiveEvents(prev => [...prev.slice(-2), events[Math.floor(Math.random() * events.length)]]);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [sku]);

  const sendMessage = () => {
    if (!newMessage.trim()) return;
    const msg: Message = {
      id: Date.now().toString(),
      text: newMessage,
      sender: 'self',
      timestamp: new Date(),
      status: 'sending',
      reactions: []
    };
    setMessages(prev => [...prev, msg]);
    setNewMessage('');
    
    // Simulate status progression
    setTimeout(() => {
      setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, status: 'sent' } : m));
    }, 500);
    setTimeout(() => {
      setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, status: 'verified' } : m));
    }, 1200);
  };

  const scrollToMessage = (index: number) => {
    if (messagesRef.current) {
      const messageElements = messagesRef.current.children;
      if (messageElements[index]) {
        messageElements[index].scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  return (
    <div className="h-full flex flex-col">
      {sku === 'pro' && (
        <div className="mb-4 p-3 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-lg border border-purple-500/30">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-purple-300">/qtca/stream</span>
          </div>
          <div className="text-xs text-gray-400 space-y-1">
            {liveEvents.map((event, i) => (
              <div key={i} className="opacity-60">{event}</div>
            ))}
          </div>
        </div>
      )}
      
      <div ref={messagesRef} className="flex-1 space-y-4 overflow-y-auto mb-4">
        {messages.map((msg, index) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${msg.sender === 'self' ? 'justify-end' : 'justify-start'}`}
          >
            <div 
              className={`max-w-xs p-3 rounded-2xl cursor-pointer ${
                msg.sender === 'self' 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-gray-700 text-gray-100'
              }`}
              onClick={() => msg.thread && setOpenThread(openThread === msg.id ? null : msg.id)}
            >
              <div className="text-sm">{msg.text}</div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs opacity-70">
                  {msg.timestamp.toLocaleTimeString()}
                </span>
                <div className="flex items-center gap-1">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    msg.status === 'verified' ? 'bg-green-500/20 text-green-400' :
                    msg.status === 'sent' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-gray-500/20 text-gray-400'
                  }`}>
                    {msg.status}
                  </span>
                  {sku === 'pro' && msg.status === 'verified' && (
                    <span className="text-xs text-purple-400">• PQC</span>
                  )}
                </div>
              </div>
              {msg.reactions.length > 0 && (
                <div className="flex gap-1 mt-2">
                  {msg.reactions.map((emoji, i) => (
                    <Chip key={i}>{emoji}</Chip>
                  ))}
                </div>
              )}
              {msg.thread && (
                <div className="text-xs text-purple-300 mt-1">
                  {msg.thread.length} replies
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Minimap */}
      <div className="mb-4 p-2 bg-gray-800/50 rounded-lg">
        <div className="text-xs text-gray-400 mb-2">Message Map</div>
        <div className="flex gap-1">
          {messages.map((_, index) => (
            <button
              key={index}
              onClick={() => scrollToMessage(index)}
              className="w-3 h-3 rounded-full bg-purple-500/50 hover:bg-purple-400 transition-colors"
              aria-label={`Scroll to message ${index + 1}`}
            />
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Type a message..."
          className="flex-1 p-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400"
          aria-label="Message input"
        />
        <button
          onClick={sendMessage}
          className="px-4 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg text-white font-medium"
          aria-label="Send message"
        >
          Send
        </button>
      </div>

      {/* Thread Panel */}
      <AnimatePresence>
        {openThread && (
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className="fixed right-4 top-20 bottom-4 w-80 bg-gray-900 border border-gray-700 rounded-xl p-4 z-50"
            role="dialog"
            aria-label="Message thread"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-white">Thread</h3>
              <button
                onClick={() => setOpenThread(null)}
                className="text-gray-400 hover:text-white"
                aria-label="Close thread"
              >
                ✕
              </button>
            </div>
            {messages.find(m => m.id === openThread)?.thread?.map(reply => (
              <div key={reply.id} className="mb-3 p-2 bg-gray-800 rounded-lg">
                <div className="text-sm text-white">{reply.text}</div>
                <div className="text-xs text-gray-400 mt-1">
                  {reply.timestamp.toLocaleTimeString()}
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
