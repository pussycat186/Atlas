import React from 'react';
import { useTheme } from './ThemeProvider';
import { ThemeToggle } from './ThemeToggle';

interface AtlasNavbarProps {
  title: string;
  children?: React.ReactNode;
  className?: string;
}

export function AtlasNavbar({ title, children, className = '' }: AtlasNavbarProps) {
  const { resolvedTheme } = useTheme();
  
  const baseClass = 'flex items-center justify-between px-6 py-4 border-b transition-colors';
  const themeClass = resolvedTheme === 'dark'
    ? 'bg-gray-900 border-gray-800 text-white'
    : 'bg-white border-gray-200 text-gray-900';
  
  return (
    <nav className={`${baseClass} ${themeClass} ${className}`}>
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-semibold">{title}</h1>
        {children}
      </div>
      <ThemeToggle />
    </nav>
  );
}