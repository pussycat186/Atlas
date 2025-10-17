// Contacts Page - Add contacts by alias/email with QR placeholder
'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface Contact {
  id: string;
  name: string;
  email: string;
  verified: boolean;
}

export default function ContactsPage() {
  const [contacts] = useState<Contact[]>([
    { id: '1', name: 'Gia đình', email: 'family@atlas.com', verified: true },
    { id: '2', name: 'Nhóm công việc', email: 'work@atlas.com', verified: true },
  ]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newContact, setNewContact] = useState({ name: '', email: '' });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Liên hệ
        </h1>

        {/* Add Contact Button */}
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="w-full mb-6 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Thêm liên hệ
        </button>

        {showAddForm && (
          <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Thêm liên hệ mới</h3>
            <input
              type="text"
              placeholder="Tên"
              value={newContact.name}
              onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
              className="w-full mb-3 px-4 py-2 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg border border-gray-300 dark:border-gray-600"
            />
            <input
              type="email"
              placeholder="Email hoặc alias"
              value={newContact.email}
              onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
              className="w-full mb-4 px-4 py-2 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg border border-gray-300 dark:border-gray-600"
            />
            
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center mb-4">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
              <p className="text-gray-600 dark:text-gray-400">Quét QR code</p>
              <p className="text-sm text-gray-500 dark:text-gray-500">(Chức năng sẽ có sớm)</p>
            </div>

            <div className="flex gap-3">
              <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Thêm
              </button>
              <button 
                onClick={() => setShowAddForm(false)}
                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Hủy
              </button>
            </div>
          </div>
        )}

        {/* Contacts List */}
        <div className="space-y-2">
          {contacts.map((contact) => (
            <Link
              key={contact.id}
              href={`/chats/${contact.id}`}
              className="block bg-white dark:bg-gray-800 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {contact.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white">{contact.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{contact.email}</p>
                </div>
                {contact.verified && (
                  <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
