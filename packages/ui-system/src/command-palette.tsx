'use client';

import { useState, useEffect } from 'react';
import { Combobox } from '@atlas/ui-primitives/src/combobox';

interface Command {
  id: string;
  label: string;
  action: () => void;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  commands: Command[];
  'data-testid'?: string;
}

export function CommandPalette({ isOpen, onClose, commands, 'data-testid': testId }: CommandPaletteProps) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredCommands = commands.filter(cmd =>
    cmd.label.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center pt-20"
      data-testid={testId}
    >
      <div 
        className="fixed inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
        <div className="p-4">
          <label htmlFor="command-input" className="sr-only">Type a command</label>
          <input
            id="command-input"
            type="text"
            placeholder="Type a command..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full px-3 py-2 border-0 text-lg focus:outline-none min-h-[44px]"
            aria-label="Type a command"
            autoFocus
          />
        </div>
        <div className="border-t max-h-80 overflow-auto">
          {filteredCommands.map((command) => (
            <button
              key={command.id}
              onClick={() => {
                command.action();
                onClose();
              }}
              className="w-full px-4 py-3 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none min-h-[44px]"
              aria-label={command.label}
            >
              {command.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}