import React from 'react';

interface AtlasMinimapProps {
  items: Array<{ id: string; label: string; active?: boolean }>;
  onItemClick?: (id: string) => void;
  className?: string;
}

export function AtlasMinimap({ items, onItemClick, className = '' }: AtlasMinimapProps) {
  return (
    <nav className={`flex flex-col gap-1 ${className}`} aria-label="Page navigation">
      {items.map(item => (
        <button
          key={item.id}
          onClick={() => onItemClick?.(item.id)}
          className={`text-left px-2 py-1 text-sm rounded transition-colors ${
            item.active 
              ? 'bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100' 
              : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
          }`}
          aria-current={item.active ? 'page' : undefined}
        >
          {item.label}
        </button>
      ))}
    </nav>
  );
}