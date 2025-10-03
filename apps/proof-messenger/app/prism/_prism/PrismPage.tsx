'use client';

import { useState } from 'react';
import { ChatBubble, CommandPalette } from '@atlas/ui-system';
import { Combobox } from '@atlas/ui-primitives';

export default function PrismPage() {
  const [sku, setSku] = useState<'basic' | 'pro'>('basic');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [lux, setLux] = useState(sku === 'pro');
  const [showPalette, setShowPalette] = useState(false);
  const [messages] = useState([
    { id: '1', message: 'Hello from Atlas!', timestamp: new Date().toISOString(), isOwn: false, status: 'read' as const },
    { id: '2', message: 'Quantum messaging is working perfectly', timestamp: new Date().toISOString(), isOwn: true, status: 'delivered' as const }
  ]);
  const [folders] = useState(['Inbox', 'Sent', 'Drafts', 'Archive']);
  const commands = [
    { id: '1', label: 'New Message', action: () => console.log('New message') },
    { id: '2', label: 'Search Messages', action: () => console.log('Search') },
    { id: '3', label: 'Settings', action: () => console.log('Settings') }
  ];

  return (
    <>
      {/* SSR-visible marker (must be literal text, not computed) */}
      <div data-prism-marker data-testid="prism-marker" className="hidden">
        ATLAS • Prism UI — Peak Preview
      </div>
      <div className={`min-h-screen transition-colors ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="relative z-10">
        <div className={`border-b ${theme === 'dark' ? 'border-gray-800 bg-gray-900/80' : 'border-gray-200 bg-white/80'} backdrop-blur-sm`}>
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg"></div>
                  <span className="font-bold">ATLAS • Prism UI — Peak Preview</span>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${sku === 'pro' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}`}>
                  {sku.toUpperCase()}
                </span>
                {sku === 'pro' && (
                  <div className="flex items-center gap-2">
                    <label htmlFor="tenant-select" className="sr-only">Select tenant</label>
                    <select id="tenant-select" className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm min-h-[44px]" aria-label="Select tenant">
                      <option>Tenant: acme-corp</option>
                    </select>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-sm text-green-400">Live</span>
                    </div>
                    <span className="text-sm px-2 py-1 bg-purple-500/20 text-purple-400 rounded">/qtca/stream</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer min-h-[44px]">
                  <input
                    type="checkbox"
                    checked={sku === 'pro'}
                    onChange={(e) => {
                      const newSku = e.target.checked ? 'pro' : 'basic';
                      setSku(newSku);
                      setLux(newSku === 'pro');
                    }}
                    className="sr-only"
                    aria-label="PRO"
                  />
                  <div className={`w-12 h-6 rounded-full transition-colors ${sku === 'pro' ? 'bg-purple-500' : 'bg-gray-600'}`}>
                    <div className={`w-5 h-5 bg-white rounded-full transition-transform mt-0.5 ${sku === 'pro' ? 'translate-x-6' : 'translate-x-0.5'}`}></div>
                  </div>
                  <span className="text-sm">PRO</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer min-h-[44px]">
                  <input
                    type="checkbox"
                    checked={lux}
                    onChange={(e) => setLux(e.target.checked)}
                    className="w-4 h-4"
                    aria-label="Luxury"
                  />
                  <span className="text-sm">Luxury</span>
                </label>

                <button
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-white min-h-[44px] min-w-[44px]"
                  aria-label="Toggle theme"
                >
                  {theme === 'dark' ? '☀️' : '🌙'}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Atlas Prism Preview</h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
              {sku === 'pro' ? 'Enterprise-grade quantum computing interface' : 'Essential quantum computing tools'}
            </p>
            
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
              {/* Sidebar */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4" data-testid="messenger-sidebar">
                <h2 className="text-lg font-semibold mb-4">Folders</h2>
                <nav role="navigation" aria-label="Message folders">
                  {folders.map(folder => (
                    <button 
                      key={folder} 
                      className="w-full text-left px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 mb-1 min-h-[44px] min-w-[44px]"
                      aria-label={`Open ${folder} folder`}
                      data-testid={`folder-${folder.toLowerCase()}`}
                    >
                      {folder}
                    </button>
                  ))}
                </nav>
                <div className="mt-4">
                  <label htmlFor="search-input" className="sr-only">Search messages</label>
                  <Combobox 
                    options={['Search messages...', 'Find contacts...', 'Filter by date...']}
                    placeholder="Search..."
                    data-testid="search-combobox"
                  />
                </div>
              </div>
              
              {/* Chat Area */}
              <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4" data-testid="chat-area">
                <h2 className="text-lg font-semibold mb-4">Messages</h2>
                <div className="space-y-2 mb-4">
                  {messages.map(msg => (
                    <ChatBubble
                      key={msg.id}
                      message={msg.message}
                      timestamp={msg.timestamp}
                      isOwn={msg.isOwn}
                      status={msg.status}
                      data-testid={`chat-bubble-${msg.id}`}
                    />
                  ))}
                </div>
                <div className="flex gap-2">
                  <label htmlFor="message-input" className="sr-only">Type a message</label>
                  <input 
                    id="message-input"
                    type="text" 
                    placeholder="Type a message..." 
                    className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                    data-testid="message-input"
                    aria-label="Type a message"
                  />
                  <button 
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 min-h-[44px] min-w-[44px]"
                    data-testid="send-button"
                    aria-label="Send"
                  >
                    Send
                  </button>
                </div>
              </div>
              
              {/* Thread/Minimap */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4" data-testid="thread-minimap">
                <h2 className="text-lg font-semibold mb-4">Thread</h2>
                <div className="space-y-2 text-sm">
                  <button className="w-full text-left p-2 bg-gray-100 dark:bg-gray-700 rounded min-h-[44px]" aria-label="Open Thread 1: Welcome">Thread 1: Welcome</button>
                  <button className="w-full text-left p-2 bg-blue-100 dark:bg-blue-900 rounded min-h-[44px]" aria-label="Open Thread 2: Active">Thread 2: Active</button>
                  <button className="w-full text-left p-2 bg-gray-100 dark:bg-gray-700 rounded min-h-[44px]" aria-label="Open Thread 3: Archive">Thread 3: Archive</button>
                </div>
                <button 
                  onClick={() => setShowPalette(true)}
                  className="mt-4 w-full px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 min-h-[44px]"
                  data-testid="command-palette-trigger"
                  aria-label="Command Palette"
                >
                  Command Palette (⌘K)
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
      
      <CommandPalette
        isOpen={showPalette}
        onClose={() => setShowPalette(false)}
        commands={commands}
        data-testid="command-palette"
      />
    </>
  );
}
