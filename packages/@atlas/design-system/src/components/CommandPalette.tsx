import React, { useState, useEffect, useRef } from 'react';
import { cn } from '../utils/cn';

export interface Command {
  id: string;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  shortcut?: string;
  action: () => void;
  category?: string;
}

export interface CommandPaletteProps {
  commands: Command[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  placeholder?: string;
  className?: string;
}

const CommandPalette = React.forwardRef<HTMLDivElement, CommandPaletteProps>(
  ({ commands, open = false, onOpenChange, placeholder = "Type a command or search...", className }, ref) => {
    const [search, setSearch] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [isOpen, setIsOpen] = useState(open);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    // Filter commands based on search
    const filteredCommands = commands.filter(command =>
      command.title.toLowerCase().includes(search.toLowerCase()) ||
      command.description?.toLowerCase().includes(search.toLowerCase()) ||
      command.category?.toLowerCase().includes(search.toLowerCase())
    );

    // Group commands by category
    const groupedCommands = filteredCommands.reduce((acc, command) => {
      const category = command.category || 'General';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(command);
      return acc;
    }, {} as Record<string, Command[]>);

    // Handle keyboard navigation
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (!isOpen) return;

        switch (e.key) {
          case 'ArrowDown':
            e.preventDefault();
            setSelectedIndex(prev => Math.min(prev + 1, filteredCommands.length - 1));
            break;
          case 'ArrowUp':
            e.preventDefault();
            setSelectedIndex(prev => Math.max(prev - 1, 0));
            break;
          case 'Enter':
            e.preventDefault();
            if (filteredCommands[selectedIndex]) {
              filteredCommands[selectedIndex].action();
              setIsOpen(false);
              onOpenChange?.(false);
            }
            break;
          case 'Escape':
            e.preventDefault();
            setIsOpen(false);
            onOpenChange?.(false);
            break;
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, selectedIndex, filteredCommands, onOpenChange]);

    // Handle global keyboard shortcut (Cmd/Ctrl+K)
    useEffect(() => {
      const handleGlobalKeyDown = (e: KeyboardEvent) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
          e.preventDefault();
          setIsOpen(true);
          onOpenChange?.(true);
        }
      };

      document.addEventListener('keydown', handleGlobalKeyDown);
      return () => document.removeEventListener('keydown', handleGlobalKeyDown);
    }, [onOpenChange]);

    // Focus input when opened
    useEffect(() => {
      if (isOpen && inputRef.current) {
        inputRef.current.focus();
      }
    }, [isOpen]);

    // Reset selection when search changes
    useEffect(() => {
      setSelectedIndex(0);
    }, [search]);

    // Close on outside click
    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (ref && 'current' in ref && ref.current && !ref.current.contains(e.target as Node)) {
          setIsOpen(false);
          onOpenChange?.(false);
        }
      };

      if (isOpen) {
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
      }
    }, [isOpen, ref, onOpenChange]);

    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 z-[var(--z-modal)] bg-black/50 flex items-start justify-center pt-[10vh]">
        <div
          ref={ref}
          className={cn(
            'w-full max-w-2xl mx-4 bg-[var(--bg)] border border-[var(--border)] rounded-lg shadow-lg',
            className
          )}
          role="dialog"
          aria-modal="true"
          aria-label="Command palette"
        >
          <div className="flex items-center border-b border-[var(--border)] px-4 py-3">
            <svg
              className="mr-3 h-4 w-4 text-[var(--fg-secondary)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={placeholder}
              className="flex-1 bg-transparent text-[var(--fg)] placeholder:text-[var(--fg-tertiary)] outline-none"
              aria-label="Search commands"
            />
            <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-[var(--border)] bg-[var(--surface)] px-1.5 font-mono text-[10px] font-medium text-[var(--fg-secondary)]">
              <span>ESC</span>
            </kbd>
          </div>

          <div
            ref={listRef}
            className="max-h-80 overflow-y-auto py-2"
            role="listbox"
            aria-label="Command list"
          >
            {Object.keys(groupedCommands).length === 0 ? (
              <div className="px-4 py-8 text-center text-[var(--fg-secondary)]">
                No commands found.
              </div>
            ) : (
              Object.entries(groupedCommands).map(([category, categoryCommands]) => (
                <div key={category}>
                  <div className="px-4 py-2 text-xs font-medium text-[var(--fg-secondary)] uppercase tracking-wide">
                    {category}
                  </div>
                  {categoryCommands.map((command, index) => {
                    const globalIndex = filteredCommands.findIndex(c => c.id === command.id);
                    const isSelected = globalIndex === selectedIndex;
                    
                    return (
                      <button
                        key={command.id}
                        className={cn(
                          'w-full flex items-center px-4 py-2 text-left hover:bg-[var(--surface)] focus:bg-[var(--surface)] focus:outline-none',
                          isSelected && 'bg-[var(--surface)]'
                        )}
                        onClick={() => {
                          command.action();
                          setIsOpen(false);
                          onOpenChange?.(false);
                        }}
                        onMouseEnter={() => setSelectedIndex(globalIndex)}
                        role="option"
                        aria-selected={isSelected}
                      >
                        {command.icon && (
                          <div className="mr-3 flex h-5 w-5 items-center justify-center text-[var(--fg-secondary)]">
                            {command.icon}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-[var(--fg)] truncate">
                            {command.title}
                          </div>
                          {command.description && (
                            <div className="text-xs text-[var(--fg-secondary)] truncate">
                              {command.description}
                            </div>
                          )}
                        </div>
                        {command.shortcut && (
                          <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-[var(--border)] bg-[var(--surface)] px-1.5 font-mono text-[10px] font-medium text-[var(--fg-secondary)]">
                            {command.shortcut.split('+').map(key => (
                              <span key={key}>{key}</span>
                            ))}
                          </kbd>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }
);

CommandPalette.displayName = 'CommandPalette';

export { CommandPalette };