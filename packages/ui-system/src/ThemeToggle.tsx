import React from 'react';
import { useTheme } from './ThemeProvider';

// Inline button for build compatibility
function Button({ children, onClick, className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button onClick={onClick} className={className} {...props}>{children}</button>;
}

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  
  const toggleTheme = () => {
    if (theme === 'system') {
      setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
    } else {
      setTheme(theme === 'dark' ? 'light' : 'dark');
    }
  };

  return (
    <Button
      onClick={toggleTheme}
      aria-label={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} theme`}
      className="p-2"
    >
      {resolvedTheme === 'dark' ? '☀️' : '🌙'}
    </Button>
  );
}