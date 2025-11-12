'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
// Luminance-based text color selection
function getTextColor(bgColor) {
    // Simple luminance check - in real implementation would use proper calculation
    const lightBubbles = ['#f0f0f0', '#34c759']; // L >= 0.6
    const darkBubbles = ['#2a2a2a', '#007aff']; // L < 0.6
    if (lightBubbles.includes(bgColor)) {
        return 'var(--color-chatTextOnLight)';
    }
    return 'var(--color-chatTextOnDark)';
}
export const ChatBubble = React.forwardRef(({ message, type = 'light', timestamp, delivered, read, className, 'data-testid': testId, ...props }, ref) => {
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
    return (_jsxs("div", { ref: ref, "data-testid": testId, className: className, style: {
            ...getBubbleStyle(),
            padding: 'var(--spacing-sm) var(--spacing-md)',
            borderRadius: 'var(--radius-lg)',
            marginBottom: 'var(--spacing-xs)',
            wordWrap: 'break-word'
        }, ...props, children: [_jsx("div", { children: message }), timestamp && (_jsxs("div", { style: {
                    fontSize: 'var(--text-xs)',
                    opacity: 0.7,
                    marginTop: 'var(--spacing-xs)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--spacing-xs)'
                }, children: [timestamp, delivered && _jsx("span", { "aria-label": "Delivered", children: "\u2713" }), read && _jsx("span", { "aria-label": "Read", children: "\u2713\u2713" })] }))] }));
});
ChatBubble.displayName = 'ChatBubble';
