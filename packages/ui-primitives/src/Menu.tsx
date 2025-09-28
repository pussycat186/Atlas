import React, { createContext, useContext, useRef, useEffect, KeyboardEvent } from 'react';

interface MenuContextValue {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  focusedIndex: number;
  setFocusedIndex: (index: number) => void;
}

const MenuContext = createContext<MenuContextValue | null>(null);

interface MenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export function Menu({ open, onOpenChange, children }: MenuProps) {
  const [focusedIndex, setFocusedIndex] = React.useState(-1);
  
  return (
    <MenuContext.Provider value={{ open, onOpenChange, focusedIndex, setFocusedIndex }}>
      {children}
    </MenuContext.Provider>
  );
}

interface MenuContentProps {
  children: React.ReactNode;
  className?: string;
}

export function MenuContent({ children, className }: MenuContentProps) {
  const context = useContext(MenuContext);
  if (!context) throw new Error('MenuContent must be used within Menu');
  
  const { open, onOpenChange, focusedIndex, setFocusedIndex } = context;
  const contentRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (open) {
      const handleKeyDown = (e: KeyboardEvent) => {
        const items = contentRef.current?.querySelectorAll('[role="menuitem"]') as NodeListOf<HTMLElement>;
        if (!items) return;
        
        switch (e.key) {
          case 'ArrowDown':
            e.preventDefault();
            const nextIndex = (focusedIndex + 1) % items.length;
            setFocusedIndex(nextIndex);
            items[nextIndex]?.focus();
            break;
          case 'ArrowUp':
            e.preventDefault();
            const prevIndex = (focusedIndex - 1 + items.length) % items.length;
            setFocusedIndex(prevIndex);
            items[prevIndex]?.focus();
            break;
          case 'Escape':
            onOpenChange(false);
            break;
        }
      };
      
      document.addEventListener('keydown', handleKeyDown as any);
      return () => document.removeEventListener('keydown', handleKeyDown as any);
    }
  }, [open, focusedIndex, onOpenChange, setFocusedIndex]);
  
  if (!open) return null;
  
  return (
    <div
      ref={contentRef}
      role="menu"
      className={className}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>
  );
}

interface MenuItemProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export function MenuItem({ children, onClick, className }: MenuItemProps) {
  return (
    <button
      role="menuitem"
      onClick={onClick}
      className={className}
      tabIndex={-1}
    >
      {children}
    </button>
  );
}