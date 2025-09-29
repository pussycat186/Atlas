'use client';
import React from 'react';

interface ChatBubbleProps {
  message: string;
  type?: 'user' | 'system' | 'light' | 'dark';
  timestamp?: string;
  delivered?: boolean;
  read?: boolean;
  className?: string;
  'data-testid'?: string;
}

// Luminance-based text color selection
function getTextColor(bgColor: string): string {
  // Simple luminance check - in real implementation would use proper calculation
  const lightBubbles = ['#f0f0f0', '#34c759']; // L >= 0.6
  const darkBubbles = ['#2a2a2a', '#007aff']; // L < 0.6
  
  if (lightBubbles.includes(bgColor)) {
    return 'var(--color-chatTextOnLight)';
  }
  return 'var(--color-chatTextOnDark)';
}

export const ChatBubble = React.forwardRef<HTMLDivElement, ChatBubbleProps>(
  ({ message, type = 'light', timestamp, delivered, read, className, 'data-testid': testId, ...props }, ref) => {
    const getBubbleStyle = () => {
      switch (type) {
        case 'user':
          return {
            backgroundColor: 'var(--color-chatBubbleUser)',
            color: getTextColor('#007aff'),
            marginLeft: 'auto',
            maxWidth: '70%'
          };
        case 'system':
          return {
            backgroundColor: 'var(--color-chatBubbleSystem)',
            color: getTextColor('#34c759'),
            maxWidth: '70%'
          };
        case 'dark':
          return {
            backgroundColor: 'var(--color-chatBubbleDark)',
            color: getTextColor('#2a2a2a'),
            maxWidth: '70%'
          };
        default:
          return {
            backgroundColor: 'var(--color-chatBubbleLight)',
            color: getTextColor('#f0f0f0'),
            maxWidth: '70%'
          };
      }
    };

    return (
      <div
        ref={ref}
        data-testid={testId}
        className={className}
        style={{
          ...getBubbleStyle(),
          padding: 'var(--spacing-sm) var(--spacing-md)',
          borderRadius: 'var(--radius-lg)',
          marginBottom: 'var(--spacing-xs)',
          wordWrap: 'break-word'
        }}
        {...props}
      >
        <div>{message}</div>
        {timestamp && (
          <div 
            style={{ 
              fontSize: 'var(--text-xs)', 
              opacity: 0.7, 
              marginTop: 'var(--spacing-xs)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-xs)'
            }}
          >
            {timestamp}
            {delivered && <span aria-label="Delivered">✓</span>}
            {read && <span aria-label="Read">✓✓</span>}
          </div>
        )}
      </div>
    );
  }
);

ChatBubble.displayName = 'ChatBubble';