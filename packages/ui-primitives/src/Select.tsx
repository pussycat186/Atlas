'use client';
import React, { createContext, useContext, useRef, useEffect, KeyboardEvent } from 'react';

interface SelectContextValue {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: string;
  onValueChange: (value: string) => void;
  focusedIndex: number;
  setFocusedIndex: (index: number) => void;
}

const SelectContext = createContext<SelectContextValue | null>(null);

interface SelectProps {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
}

export function Select({ value, onValueChange, children }: SelectProps) {
  const [open, setOpen] = React.useState(false);
  const [focusedIndex, setFocusedIndex] = React.useState(-1);
  
  return (
    <SelectContext.Provider value={{ 
      open, 
      onOpenChange: setOpen, 
      value, 
      onValueChange, 
      focusedIndex, 
      setFocusedIndex 
    }}>
      {children}
    </SelectContext.Provider>
  );
}

interface SelectTriggerProps {
  children: React.ReactNode;
  className?: string;
}

export function SelectTrigger({ children, className }: SelectTriggerProps) {
  const context = useContext(SelectContext);
  if (!context) throw new Error('SelectTrigger must be used within Select');
  
  const { open, onOpenChange } = context;
  
  return (
    <button
      role="combobox"
      aria-expanded={open}
      aria-haspopup="listbox"
      onClick={() => onOpenChange(!open)}
      className={className}
    >
      {children}
    </button>
  );
}

interface SelectContentProps {
  children: React.ReactNode;
  className?: string;
}

export function SelectContent({ children, className }: SelectContentProps) {
  const context = useContext(SelectContext);
  if (!context) throw new Error('SelectContent must be used within Select');
  
  const { open, onOpenChange, focusedIndex, setFocusedIndex } = context;
  const contentRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (open) {
      const handleKeyDown = (e: KeyboardEvent) => {
        const items = contentRef.current?.querySelectorAll('[role="option"]') as NodeListOf<HTMLElement>;
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
      role="listbox"
      className={className}
    >
      {children}
    </div>
  );
}

interface SelectItemProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

export function SelectItem({ value, children, className }: SelectItemProps) {
  const context = useContext(SelectContext);
  if (!context) throw new Error('SelectItem must be used within Select');
  
  const { value: selectedValue, onValueChange, onOpenChange } = context;
  
  return (
    <button
      role="option"
      aria-selected={value === selectedValue}
      onClick={() => {
        onValueChange(value);
        onOpenChange(false);
      }}
      className={className}
      tabIndex={-1}
    >
      {children}
    </button>
  );
}