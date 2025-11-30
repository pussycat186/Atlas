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
export declare const ChatBubble: React.ForwardRefExoticComponent<ChatBubbleProps & React.RefAttributes<HTMLDivElement>>;
export {};
