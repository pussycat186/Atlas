import React, { createContext, useContext, useRef, KeyboardEvent } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from './ThemeProvider';

// Inline simplified tabs for build compatibility
interface TabsContextValue {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const TabsContext = createContext<TabsContextValue | null>(null);

function Tabs({ value, onValueChange, children }: { value: string; onValueChange: (value: string) => void; children: React.ReactNode }) {
  return (
    <TabsContext.Provider value={{ activeTab: value, setActiveTab: onValueChange }}>
      {children}
    </TabsContext.Provider>
  );
}

function TabsList({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div role="tablist" className={className}>{children}</div>;
}

function TabsTrigger({ value, children, className }: { value: string; children: React.ReactNode; className?: string }) {
  const context = useContext(TabsContext);
  if (!context) throw new Error('TabsTrigger must be used within Tabs');
  const { activeTab, setActiveTab } = context;
  const isSelected = activeTab === value;
  return (
    <button
      role="tab"
      aria-selected={isSelected}
      tabIndex={isSelected ? 0 : -1}
      onClick={() => setActiveTab(value)}
      className={className}
    >
      {children}
    </button>
  );
}

function TabsContent({ value, children }: { value: string; children: React.ReactNode }) {
  const context = useContext(TabsContext);
  if (!context) throw new Error('TabsContent must be used within Tabs');
  const { activeTab } = context;
  if (activeTab !== value) return null;
  return <div role="tabpanel">{children}</div>;
}

interface AtlasTabsProps {
  value: string;
  onValueChange: (value: string) => void;
  tabs: Array<{ value: string; label: string; content: React.ReactNode }>;
  sku?: 'basic' | 'pro';
  theme?: 'dark' | 'light';
  density?: boolean;
  luxury?: boolean;
  className?: string;
}

export function AtlasTabs({ 
  value, 
  onValueChange, 
  tabs, 
  sku = 'basic',
  theme = 'light',
  density = false,
  luxury = false,
  className 
}: AtlasTabsProps) {
  const { reducedMotion } = useTheme();
  const tabListClass = `border-b ${theme === 'dark' ? 'border-gray-800' : 'border-gray-200'}`;
  const containerClass = `container mx-auto px-4`;
  const flexClass = `flex`;
  
  const getTabClass = (isActive: boolean) => {
    const baseClass = `px-6 py-3 font-medium capitalize transition-colors`;
    if (isActive) {
      const activeColor = sku === 'pro' ? 'border-purple-500 text-purple-400' : 'border-blue-500 text-blue-400';
      return `${baseClass} border-b-2 ${activeColor}`;
    }
    return `${baseClass} text-gray-500 hover:text-gray-300`;
  };

  const contentClass = `rounded-2xl p-6 backdrop-blur-sm border ${
    theme === 'dark' 
      ? 'bg-gray-800/50 border-gray-700' 
      : 'bg-white/50 border-gray-200'
  } ${density ? 'min-h-[400px]' : 'min-h-[600px]'}`;

  return (
    <Tabs value={value} onValueChange={onValueChange}>
      <div className={tabListClass}>
        <div className={containerClass}>
          <TabsList className={flexClass}>
            {tabs.map((tab) => (
              <TabsTrigger 
                key={tab.value} 
                value={tab.value}
                className={getTabClass(value === tab.value)}
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-8">
        {tabs.map((tab) => (
          <TabsContent key={tab.value} value={tab.value}>
            <motion.div
              initial={reducedMotion ? {} : { opacity: 0, y: 20 }}
              animate={reducedMotion ? {} : { opacity: 1, y: 0 }}
              transition={reducedMotion ? { duration: 0 } : { duration: luxury ? 0.5 : 0.2 }}
              className={contentClass}
            >
              {tab.content}
            </motion.div>
          </TabsContent>
        ))}
      </div>
    </Tabs>
  );
}