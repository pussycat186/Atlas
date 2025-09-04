/**
 * Chat Message Component
 * Displays individual chat messages with integrity status
 */

import React, { useState } from 'react';
import { format } from 'date-fns';
import { EyeIcon } from '@heroicons/react/24/outline';
import { IntegrityBadge, IntegrityDetails } from './IntegrityBadge';
import { WitnessAttestationsModal } from './WitnessAttestationsModal';
import type { ChatMessage } from '@/lib/atlas-client';
import type { WitnessAttestation, QuorumResult } from '@atlas/fabric-protocol';

interface ChatMessageProps {
  message: ChatMessage;
  showIntegrityDetails?: boolean;
  className?: string;
  attestations?: WitnessAttestation[];
  quorumResult?: QuorumResult;
}

export function ChatMessageComponent({ 
  message, 
  showIntegrityDetails = false, 
  className = '',
  attestations = [],
  quorumResult
}: ChatMessageProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const formatTime = (timestamp: string) => {
    return format(new Date(timestamp), 'HH:mm:ss');
  };

  return (
    <div className={`bg-white rounded-lg p-4 shadow-sm border border-gray-200 ${className}`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-900">
            {message.user_id}
          </span>
          <span className="text-xs text-gray-500">
            {formatTime(message.timestamp)}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <IntegrityBadge 
            status={message.integrity_status}
            showDetails={false}
          />
          {attestations.length > 0 && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-atlas-500"
              title="View witness attestations"
            >
              <EyeIcon className="w-3 h-3 mr-1" />
              Attestations
            </button>
          )}
        </div>
      </div>
      
      <div className="text-gray-800 mb-3">
        {message.content}
      </div>
      
      {showIntegrityDetails && message.quorum_count && (
        <div className="text-xs text-gray-500 space-y-1">
          <div>Quorum: {message.quorum_count}/4 witnesses</div>
          {message.max_skew_ms && (
            <div>Timestamp Skew: {message.max_skew_ms}ms</div>
          )}
        </div>
      )}

      {/* Witness Attestations Modal */}
      {attestations.length > 0 && quorumResult && (
        <WitnessAttestationsModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          recordId={message.id}
          attestations={attestations}
          quorumResult={quorumResult}
        />
      )}
    </div>
  );
}

interface ChatRoomProps {
  roomId: string;
  messages: ChatMessage[];
  onSendMessage: (content: string) => void;
  className?: string;
}

export function ChatRoom({ 
  roomId, 
  messages, 
  onSendMessage, 
  className = '' 
}: ChatRoomProps) {
  const [newMessage, setNewMessage] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isLoading) return;

    setIsLoading(true);
    try {
      await onSendMessage(newMessage.trim());
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Room Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Room: {roomId}
        </h2>
        <p className="text-sm text-gray-500">
          {messages.length} messages • Atlas Secure Fabric
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => (
            <ChatMessageComponent
              key={message.id}
              message={message}
              showIntegrityDetails={true}
            />
          ))
        )}
      </div>

      {/* Message Input */}
      <div className="bg-white border-t border-gray-200 p-4">
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 input-field"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || isLoading}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Sending...' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  );
}
