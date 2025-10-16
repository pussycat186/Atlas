import React from 'react';
import { render, screen } from '@testing-library/react';
import { ChatBubble } from '../ChatBubble';

describe('ChatBubble', () => {
  it('renders message correctly', () => {
    render(<ChatBubble message="Hello world" data-testid="chat-bubble" />);
    expect(screen.getByTestId('chat-bubble')).toHaveTextContent('Hello world');
  });

  it('applies correct text color for light bubbles', () => {
    render(<ChatBubble message="Test" type="light" data-testid="light-bubble" />);
    const bubble = screen.getByTestId('light-bubble');
    expect(bubble).toHaveStyle({ color: 'var(--color-chatTextOnLight)' });
  });

  it('applies correct text color for dark bubbles', () => {
    render(<ChatBubble message="Test" type="dark" data-testid="dark-bubble" />);
    const bubble = screen.getByTestId('dark-bubble');
    expect(bubble).toHaveStyle({ color: 'var(--color-chatTextOnDark)' });
  });

  it('shows delivery status icons', () => {
    render(
      <ChatBubble 
        message="Test" 
        delivered={true} 
        read={true} 
        timestamp="12:34"
        data-testid="status-bubble" 
      />
    );
    expect(screen.getByLabelText('Delivered')).toBeInTheDocument();
    expect(screen.getByLabelText('Read')).toBeInTheDocument();
  });

  it('maintains WCAG contrast requirements', () => {
    const { container } = render(<ChatBubble message="Test" type="user" />);
    const bubble = container.firstChild as HTMLElement;
    
    expect(bubble).toHaveStyle({ 
      backgroundColor: 'var(--color-chatBubbleUser)',
      color: 'var(--color-chatTextOnDark)'
    });
  });
});