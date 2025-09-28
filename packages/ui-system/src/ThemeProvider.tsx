import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'high-contrast' | 'system';

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: 'light' | 'dark' | 'high-contrast';
  reducedMotion: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}

export function ThemeProvider({ 
  children, 
  defaultTheme = 'system',
  storageKey = 'atlas-theme'
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme);
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark' | 'high-contrast'>('light');
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    // Load theme from localStorage on mount
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(storageKey) as Theme;
      if (stored) {
        setThemeState(stored);
      }
    }
  }, [storageKey]);

  useEffect(() => {
    const updateResolvedTheme = () => {
      if (theme === 'system') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const prefersHighContrast = window.matchMedia('(prefers-contrast: high)').matches;
        
        if (prefersHighContrast) {
          setResolvedTheme('high-contrast');
        } else {
          setResolvedTheme(prefersDark ? 'dark' : 'light');
        }
      } else {
        setResolvedTheme(theme as 'light' | 'dark' | 'high-contrast');
      }
    };

    const updateReducedMotion = () => {
      setReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    };

    updateResolvedTheme();
    updateReducedMotion();

    const colorQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    if (theme === 'system') {
      colorQuery.addEventListener('change', updateResolvedTheme);
    }
    motionQuery.addEventListener('change', updateReducedMotion);
    
    return () => {
      colorQuery.removeEventListener('change', updateResolvedTheme);
      motionQuery.removeEventListener('change', updateReducedMotion);
    };
  }, [theme]);

  useEffect(() => {
    // Apply theme to document
    const root = document.documentElement;
    root.setAttribute('data-theme', resolvedTheme);
    root.classList.remove('light', 'dark', 'high-contrast');
    root.classList.add(resolvedTheme);
  }, [resolvedTheme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    if (typeof window !== 'undefined') {
      localStorage.setItem(storageKey, newTheme);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme, reducedMotion }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}