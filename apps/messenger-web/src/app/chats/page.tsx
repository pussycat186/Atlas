'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Chat {
  id: string;
  name: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
  avatar: string;
}

export default function ChatsPage() {
  const [chats] = useState<Chat[]>([
    {
      id: '1',
      name: 'Alice Nguyen',
      lastMessage: 'Hẹn gặp bạn sau nhé! 👋',
      timestamp: '10:30',
      unread: 2,
      avatar: '👩',
    },
    {
      id: '2',
      name: 'Bob Tran',
      lastMessage: 'File đã được mã hóa và gửi',
      timestamp: 'Hôm qua',
      unread: 0,
      avatar: '👨',
    },
  ]);

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-bold">Trò chuyện</h1>
        <div className="flex gap-2">
          <Link href="/settings" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </Link>
        </div>
      </header>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {chats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <div className="text-6xl mb-4">💬</div>
            <h2 className="text-xl font-semibold mb-2">Chưa có cuộc trò chuyện</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Bắt đầu cuộc trò chuyện mới để kết nối với bạn bè
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-800">
            {chats.map((chat) => (
              <Link
                key={chat.id}
                href={`/chats/${chat.id}`}
                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
              >
                <div className="flex-shrink-0 w-12 h-12 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center text-2xl">
                  {chat.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold truncate">{chat.name}</h3>
                    <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 ml-2">
                      {chat.timestamp}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                    {chat.lastMessage}
                  </p>
                </div>
                {chat.unread > 0 && (
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                    {chat.unread}
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* New Chat Button */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-800">
        <button className="btn-primary w-full">
          Cuộc trò chuyện mới
        </button>
      </div>
    </div>
  );
}
