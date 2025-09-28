import React, { createContext, useContext, useRef, useEffect, KeyboardEvent } from 'react';

interface TabsContextValue {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  orientation?: 'horizontal' | 'vertical';
}

const TabsContext = createContext<TabsContextValue | null>(null);

interface TabsProps {
  value: string;
  onValueChange: (value: string) => void;
  orientation?: 'horizontal' | 'vertical';
  children: React.ReactNode;
}

export function Tabs({ value, onValueChange, orientation = 'horizontal', children }: TabsProps) {
  return (
    <TabsContext.Provider value={{ activeTab: value, setActiveTab: onValueChange, orientation }}>
      {children}
    </TabsContext.Provider>
  );
}

interface TabsListProps {
  children: React.ReactNode;
  className?: string;
}

export function TabsList({ children, className }: TabsListProps) {
  const context = useContext(TabsContext);
  if (!context) throw new Error('TabsList must be used within Tabs');
  
  const { orientation } = context;
  const listRef = useRef<HTMLDivElement>(null);
  
  const handleKeyDown = (event: KeyboardEvent) => {
    const tabs = listRef.current?.querySelectorAll('[role="tab"]') as NodeListOf<HTMLElement>;
    if (!tabs) return;
    
    const currentIndex = Array.from(tabs).findIndex(tab => tab === event.target);
    let nextIndex = currentIndex;
    
    const isHorizontal = orientation === 'horizontal';
    
    switch (event.key) {
      case isHorizontal ? 'ArrowRight' : 'ArrowDown':
        nextIndex = (currentIndex + 1) % tabs.length;
        break;
      case isHorizontal ? 'ArrowLeft' : 'ArrowUp':
        nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
        break;
      case 'Home':
        nextIndex = 0;
        break;
      case 'End':
        nextIndex = tabs.length - 1;
        break;
      default:
        return;
    }
    
    event.preventDefault();
    tabs[nextIndex]?.focus();
  };
  
  return (
    <div
      ref={listRef}
      role="tablist"
      aria-orientation={orientation}
      onKeyDown={handleKeyDown}
      className={className}
    >
      {children}
    </div>
  );
}

interface TabsTriggerProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

export function TabsTrigger({ value, children, className }: TabsTriggerProps) {
  const context = useContext(TabsContext);
  if (!context) throw new Error('TabsTrigger must be used within Tabs');
  
  const { activeTab, setActiveTab } = context;
  const isSelected = activeTab === value;
  
  return (
    <button
      role="tab"
      aria-selected={isSelected}
      aria-controls={`panel-${value}`}
      id={`tab-${value}`}
      tabIndex={isSelected ? 0 : -1}
      onClick={() => setActiveTab(value)}
      className={className}
    >
      {children}
    </button>
  );
}

interface TabsContentProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

export function TabsContent({ value, children, className }: TabsContentProps) {
  const context = useContext(TabsContext);
  if (!context) throw new Error('TabsContent must be used within Tabs');
  
  const { activeTab } = context;
  const isActive = activeTab === value;
  
  if (!isActive) return null;
  
  return (
    <div
      role="tabpanel"
      id={`panel-${value}`}
      aria-labelledby={`tab-${value}`}
      tabIndex={0}
      className={className}
    >
      {children}
    </div>
  );
}