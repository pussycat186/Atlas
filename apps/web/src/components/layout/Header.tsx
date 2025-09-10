'use client';

import React from 'react';
import { Navigation } from './Navigation';
import { Button } from '@/components/ui/Button';

export function Header() {
  return (
    <header className="border-b bg-background">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">A</span>
              </div>
              <div>
                <h1 className="text-xl font-bold">Atlas</h1>
                <p className="text-xs text-muted-foreground">Zero-crypto platform</p>
              </div>
            </div>
            <Navigation />
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Demo Mode</span>
            </div>
            <Button variant="outline" size="sm">
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
