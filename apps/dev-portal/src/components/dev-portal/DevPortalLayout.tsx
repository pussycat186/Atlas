'use client';

import { ReactNode } from 'react';
import { DevPortalHeader } from './DevPortalHeader';
import { DevPortalSidebar } from './DevPortalSidebar';
import { DevPortalFooter } from './DevPortalFooter';

interface DevPortalLayoutProps {
  children: ReactNode;
  showSidebar?: boolean;
}

export function DevPortalLayout({ children, showSidebar = false }: DevPortalLayoutProps) {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <DevPortalHeader />
      
      <div className="flex">
        {showSidebar && (
          <div className="hidden lg:block lg:w-64 lg:flex-shrink-0">
            <DevPortalSidebar />
          </div>
        )}
        
        <main className={`flex-1 ${showSidebar ? 'lg:pl-0' : ''}`}>
          {children}
        </main>
      </div>
      
      <DevPortalFooter />
    </div>
  );
}