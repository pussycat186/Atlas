'use client';
import React, { useRef, useEffect, useState } from 'react';

interface MinimapProps {
  enabled?: boolean;
  items: Array<{ id: string; label: string; position: number }>;
  onItemClick?: (id: string) => void;
  className?: string;
  'data-testid'?: string;
}

export const Minimap = React.forwardRef<HTMLDivElement, MinimapProps>(
  ({ enabled = true, items, onItemClick, className, 'data-testid': testId, ...props }, ref) => {
    const [focusedIndex, setFocusedIndex] = useState(-1);
    const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
    
    // Respect prefers-reduced-motion
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
    
    useEffect(() => {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReducedMotion(mediaQuery.matches);
      
      const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }, []);

    // Use requestAnimationFrame for smooth updates
    const scrollToItem = (position: number) => {
      if (prefersReducedMotion) {
        window.scrollTo({ top: position });
      } else {
        const startTime = performance.now();
        const startPosition = window.scrollY;
        const distance = position - startPosition;
        const duration = 300;

        const animate = (currentTime: number) => {
          const elapsed = currentTime - startTime;
          const progress = Math.min(elapsed / duration, 1);
          
          // Easing function
          const easeProgress = 1 - Math.pow(1 - progress, 3);
          
          window.scrollTo({ top: startPosition + distance * easeProgress });
          
          if (progress < 1) {
            requestAnimationFrame(animate);
          }
        };
        
        requestAnimationFrame(animate);
      }
    };

    const handleItemClick = (item: typeof items[0], index: number) => {
      scrollToItem(item.position);
      onItemClick?.(item.id);
      setFocusedIndex(index);
    };

    const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          const nextIndex = Math.min(index + 1, items.length - 1);
          itemRefs.current[nextIndex]?.focus();
          setFocusedIndex(nextIndex);
          break;
        case 'ArrowUp':
          e.preventDefault();
          const prevIndex = Math.max(index - 1, 0);
          itemRefs.current[prevIndex]?.focus();
          setFocusedIndex(prevIndex);
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          handleItemClick(items[index], index);
          break;
      }
    };

    if (!enabled) return null;

    return (
      <div
        ref={ref}
        data-testid={testId}
        className={className}
        role="navigation"
        aria-label="Page minimap"
        style={{
          position: 'fixed',
          right: 'var(--spacing-md)',
          top: '50%',
          transform: 'translateY(-50%)',
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          padding: 'var(--spacing-sm)',
          maxHeight: '60vh',
          overflowY: 'auto',
          zIndex: 'var(--z-dropdown)'
        }}
        {...props}
      >
        {items.map((item, index) => (
          <button
            key={item.id}
            ref={el => itemRefs.current[index] = el}
            onClick={() => handleItemClick(item, index)}
            onKeyDown={e => handleKeyDown(e, index)}
            aria-label={`Navigate to ${item.label}`}
            data-testid={`minimap-item-${item.id}`}
            style={{
              display: 'block',
              width: '100%',
              padding: 'var(--spacing-xs)',
              margin: '2px 0',
              backgroundColor: focusedIndex === index ? 'var(--color-primary)' : 'transparent',
              color: focusedIndex === index ? 'white' : 'var(--color-text)',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              fontSize: 'var(--text-xs)',
              textAlign: 'left',
              cursor: 'pointer',
              transition: prefersReducedMotion ? 'none' : 'all var(--duration-fast) var(--easing-ease)'
            }}
          >
            {item.label}
          </button>
        ))}
      </div>
    );
  }
);

Minimap.displayName = 'Minimap';