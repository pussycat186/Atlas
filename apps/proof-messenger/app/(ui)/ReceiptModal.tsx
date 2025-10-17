// Receipt Modal - Shows JSON receipt and deep-link to /verify
'use client';

import React, { useState } from 'react';

interface Receipt {
  message: string;
  signature: string;
  metadata: {
    kid: string;
    algorithm: string;
    created: number;
    verified?: boolean;
  };
}

interface ReceiptModalProps {
  receipt: Receipt;
  isOpen: boolean;
  onClose: () => void;
}

export function ReceiptModal({ receipt, isOpen, onClose }: ReceiptModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(receipt, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const verifyUrl = `/verify?receipt=${encodeURIComponent(JSON.stringify(receipt))}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Xác minh tin nhắn
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium text-green-700 dark:text-green-400">
                Đã xác minh
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Tin nhắn này đã được xác thực bởi hệ thống Atlas với RFC 9421 Message Signatures
            </p>
          </div>

          {/* Receipt JSON */}
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Receipt JSON
              </span>
              <button
                onClick={handleCopy}
                className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50"
              >
                {copied ? 'Đã sao chép!' : 'Sao chép'}
              </button>
            </div>
            <pre className="text-xs overflow-x-auto text-gray-800 dark:text-gray-200 font-mono">
              {JSON.stringify(receipt, null, 2)}
            </pre>
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600 dark:text-gray-400">Key ID:</span>
              <div className="font-mono text-gray-900 dark:text-white">{receipt.metadata.kid}</div>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Algorithm:</span>
              <div className="font-mono text-gray-900 dark:text-white">{receipt.metadata.algorithm}</div>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Created:</span>
              <div className="font-mono text-gray-900 dark:text-white">
                {new Date(receipt.metadata.created * 1000).toLocaleString('vi-VN')}
              </div>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Status:</span>
              <div className="font-medium text-green-600 dark:text-green-400">
                {receipt.metadata.verified ? 'Verified ✓' : 'Pending'}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <a
            href={verifyUrl}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-center font-medium"
          >
            Xem xác minh đầy đủ
          </a>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 font-medium"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
