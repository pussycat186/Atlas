'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Overview', href: '/', icon: '🏠' },
  { name: 'API Keys', href: '/keys', icon: '🔑' },
  { name: 'Playground', href: '/playground', icon: '🚀' },
  { name: 'Witness Status', href: '/witness', icon: '👥' },
  { name: 'Metrics', href: '/metrics', icon: '📊' },
  { name: 'Docs', href: '/docs', icon: '📚' },
  { name: 'Settings', href: '/settings', icon: '⚙️' },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="flex space-x-8">
      {navigation.map((item) => (
        <Link
          key={item.name}
          href={item.href}
          className={cn(
            'flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
            pathname === item.href
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground hover:bg-accent'
          )}
        >
          <span>{item.icon}</span>
          <span>{item.name}</span>
        </Link>
      ))}
    </nav>
  );
}
