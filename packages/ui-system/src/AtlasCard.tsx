import React from 'react';
import { useTheme } from './ThemeProvider';

interface AtlasCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'elevated' | 'outlined';
}

export function AtlasCard({ children, className = '', variant = 'default' }: AtlasCardProps) {
  const { resolvedTheme } = useTheme();
  
  const baseClass = 'rounded-lg p-6 transition-colors';
  const variantClasses = {
    default: resolvedTheme === 'dark' 
      ? 'bg-gray-800 border border-gray-700' 
      : 'bg-white border border-gray-200',
    elevated: resolvedTheme === 'dark'
      ? 'bg-gray-800 shadow-lg border border-gray-700'
      : 'bg-white shadow-lg border border-gray-200',
    outlined: resolvedTheme === 'dark'
      ? 'border-2 border-gray-600 bg-transparent'
      : 'border-2 border-gray-300 bg-transparent'
  };
  
  return (
    <div className={`${baseClass} ${variantClasses[variant]} ${className}`}>
      {children}
    </div>
  );
}