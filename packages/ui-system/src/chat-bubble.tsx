'use client';

interface ChatBubbleProps {
  message: string;
  timestamp: string;
  isOwn?: boolean;
  status?: 'sent' | 'delivered' | 'read';
  'data-testid'?: string;
}

export function ChatBubble({ message, timestamp, isOwn = false, status = 'sent', 'data-testid': testId }: ChatBubbleProps) {
  const getStatusIcon = () => {
    switch (status) {
      case 'sent': return '✓';
      case 'delivered': return '✓✓';
      case 'read': return '✓✓';
      default: return '';
    }
  };

  return (
    <div 
      className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}
      data-testid={testId}
    >
      <div 
        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
          isOwn 
            ? 'bg-blue-600 text-white' 
            : 'bg-gray-200 text-gray-900'
        }`}
        role="article"
        aria-label={`Message: ${message}`}
      >
        <p className="text-sm">{message}</p>
        <div className={`flex items-center justify-between mt-1 text-xs ${
          isOwn ? 'text-blue-100' : 'text-gray-500'
        }`}>
          <time dateTime={timestamp}>{new Date(timestamp).toLocaleTimeString()}</time>
          {isOwn && (
            <span 
              className="ml-2"
              aria-label={`Message status: ${status}`}
            >
              {getStatusIcon()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}