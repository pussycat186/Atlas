'use client';

import { useState, useRef, useEffect } from 'react';

interface ComboboxProps {
  options: string[];
  placeholder?: string;
  onSelect?: (value: string) => void;
  'data-testid'?: string;
}

export function Combobox({ options, placeholder = 'Search...', onSelect, 'data-testid': testId }: ComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [value, setValue] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const comboboxId = `combobox-${Math.random().toString(36).substr(2, 9)}`;
  const listboxId = `listbox-${Math.random().toString(36).substr(2, 9)}`;

  const filteredOptions = options.filter(option => 
    option.toLowerCase().includes(value.toLowerCase())
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setActiveIndex(prev => Math.min(prev + 1, filteredOptions.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setActiveIndex(prev => Math.max(prev - 1, -1));
          break;
        case 'Enter':
          e.preventDefault();
          if (activeIndex >= 0) {
            handleSelect(filteredOptions[activeIndex]);
          }
          break;
        case 'Escape':
          setIsOpen(false);
          setActiveIndex(-1);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, activeIndex, filteredOptions]);

  const handleSelect = (option: string) => {
    setValue(option);
    setIsOpen(false);
    setActiveIndex(-1);
    onSelect?.(option);
  };

  return (
    <div className="relative" data-testid={testId}>
      <input
        ref={inputRef}
        id={comboboxId}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setTimeout(() => setIsOpen(false), 150)}
        placeholder={placeholder}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-autocomplete="list"
        aria-owns={listboxId}
        aria-label={placeholder}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
      />
      {isOpen && filteredOptions.length > 0 && (
        <ul
          ref={listRef}
          id={listboxId}
          role="listbox"
          aria-labelledby={comboboxId}
          className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto"
        >
          {filteredOptions.map((option, index) => (
            <li
              key={option}
              role="option"
              aria-selected={index === activeIndex}
              className={`px-3 py-2 cursor-pointer hover:bg-gray-100 min-h-[44px] flex items-center ${
                index === activeIndex ? 'bg-blue-100' : ''
              }`}
              onClick={() => handleSelect(option)}
            >
              {option}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}