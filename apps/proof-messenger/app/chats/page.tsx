// Chats List Page - Searchable chat list with accessibility features
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { SecurityBadge } from '../(ui)/SecurityBadge';

interface Chat {
  id: string;
  name: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
  verified: boolean;
  avatar?: string;
}

const MOCK_CHATS: Chat[] = [
  {
    id: 'family',
    name: 'Gia đình',
    lastMessage: 'Hẹn gặp lại nhé!',
    timestamp: '10:30',
    unread: 2,
    verified: true,
  },
  {
    id: 'work',
    name: 'Nhóm công việc',
    lastMessage: 'Báo cáo đã gửi',
    timestamp: 'Hôm qua',
    unread: 0,
    verified: true,
  },
  {
    id: 'friends',
    name: 'Bạn bè',
    lastMessage: 'Cuối tuần đi chơi không?',
    timestamp: '2 ngày',
    unread: 5,
    verified: true,
  },
];

export default function ChatsPage() {
  const [search, setSearch] = useState('');
  const [chats] = useState<Chat[]>(MOCK_CHATS);

  const filteredChats = chats.filter(chat =>
    chat.name.toLowerCase().includes(search.toLowerCase()) ||
    chat.lastMessage.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Tin nhắn
            </h1>
            <div className="flex items-center gap-3">
              <SecurityBadge e2ee bound pqcPercentage={1} />
              <Link
                href="/settings"
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                aria-label="Settings"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm tin nhắn..."
              className="w-full px-4 py-3 pl-12 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
              aria-label="Search chats"
            />
            <svg className="w-5 h-5 text-gray-500 absolute left-4 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Chat List */}
      <div className="max-w-4xl mx-auto">
        {filteredChats.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-xl text-gray-600 dark:text-gray-400">Không tìm thấy tin nhắn</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredChats.map((chat) => (
              <Link
                key={chat.id}
                href={`/chats/${chat.id}`}
                className="block bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
              >
                <div className="flex items-center gap-4 px-4 py-4">
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                      {chat.name.charAt(0).toUpperCase()}
                    </div>
                    {chat.verified && (
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-800">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between mb-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                        {chat.name}
                      </h3>
                      <span className="text-sm text-gray-500 dark:text-gray-400 ml-2 flex-shrink-0">
                        {chat.timestamp}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-base text-gray-600 dark:text-gray-400 truncate">
                        {chat.lastMessage}
                      </p>
                      {chat.unread > 0 && (
                        <span className="ml-2 flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                          {chat.unread}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* FAB - New Chat */}
      <Link
        href="/contacts"
        className="fixed bottom-6 right-6 w-16 h-16 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-110"
        aria-label="New chat"
      >
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </Link>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 safe-area-inset-bottom">
        <div className="max-w-4xl mx-auto flex justify-around py-2">
          <Link href="/chats" className="flex flex-col items-center gap-1 px-4 py-2 text-blue-600 dark:text-blue-400">
            <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span className="text-xs font-medium">Tin nhắn</span>
          </Link>
          
          <Link href="/contacts" className="flex flex-col items-center gap-1 px-4 py-2 text-gray-600 dark:text-gray-400">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span className="text-xs font-medium">Liên hệ</span>
          </Link>
          
          <Link href="/verify" className="flex flex-col items-center gap-1 px-4 py-2 text-gray-600 dark:text-gray-400">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span className="text-xs font-medium">Xác minh</span>
          </Link>
          
          <Link href="/security" className="flex flex-col items-center gap-1 px-4 py-2 text-gray-600 dark:text-gray-400">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span className="text-xs font-medium">Bảo mật</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
