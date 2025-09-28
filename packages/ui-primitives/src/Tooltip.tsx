import React, { createContext, useContext, useRef, useEffect } from 'react';

interface TooltipContextValue {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TooltipContext = createContext<TooltipContextValue | null>(null);

interface TooltipProps {
  children: React.ReactNode;
  delayDuration?: number;
}

export function Tooltip({ children, delayDuration = 700 }: TooltipProps) {
  const [open, setOpen] = React.useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();
  
  const onOpenChange = (newOpen: boolean) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    if (newOpen) {
      timeoutRef.current = setTimeout(() => setOpen(true), delayDuration);
    } else {
      setOpen(false);
    }
  };
  
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
  
  return (
    <TooltipContext.Provider value={{ open, onOpenChange }}>
      {children}
    </TooltipContext.Provider>
  );
}

interface TooltipTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
}

export function TooltipTrigger({ children, asChild }: TooltipTriggerProps) {
  const context = useContext(TooltipContext);
  if (!context) throw new Error('TooltipTrigger must be used within Tooltip');
  
  const { onOpenChange } = context;
  
  const handleMouseEnter = () => onOpenChange(true);
  const handleMouseLeave = () => onOpenChange(false);
  const handleFocus = () => onOpenChange(true);
  const handleBlur = () => onOpenChange(false);
  
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      onMouseEnter: handleMouseEnter,
      onMouseLeave: handleMouseLeave,
      onFocus: handleFocus,
      onBlur: handleBlur,
    });
  }
  
  return (
    <button
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
    >
      {children}
    </button>
  );
}

interface TooltipContentProps {
  children: React.ReactNode;
  className?: string;
}

export function TooltipContent({ children, className }: TooltipContentProps) {
  const context = useContext(TooltipContext);
  if (!context) throw new Error('TooltipContent must be used within Tooltip');
  
  const { open } = context;
  
  if (!open) return null;
  
  return (
    <div
      role="tooltip"
      className={className}
    >
      {children}
    </div>
  );
}