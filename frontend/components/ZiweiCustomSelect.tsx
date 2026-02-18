'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface SelectOption {
  value: string | number;
  label: string;
}

interface ZiweiCustomSelectProps {
  value: string | number;
  onChange: (value: string | number) => void;
  options: SelectOption[];
  label?: string;
  disabled?: boolean;
}

export function ZiweiCustomSelect({ value, onChange, options, label, disabled }: ZiweiCustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Find the label for the current value
  const selectedLabel = options.find(opt => opt.value === value)?.label || '';

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (!isOpen) {
        if (event.key === 'Enter' || event.key === ' ') {
          setIsOpen(true);
        }
        return;
      }

      const currentIndex = options.findIndex(opt => opt.value === value);

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          const nextIndex = Math.min(currentIndex + 1, options.length - 1);
          onChange(options[nextIndex].value);
          break;
        case 'ArrowUp':
          event.preventDefault();
          const prevIndex = Math.max(currentIndex - 1, 0);
          onChange(options[prevIndex].value);
          break;
        case 'Enter':
          event.preventDefault();
          setIsOpen(false);
          break;
        case 'Escape':
          event.preventDefault();
          setIsOpen(false);
          break;
        default:
          break;
      }
    }

    if (isOpen && buttonRef.current) {
      buttonRef.current.addEventListener('keydown', handleKeyDown);
      return () => buttonRef.current?.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, value, options, onChange]);

  return (
    <div ref={containerRef} className="relative">
      {label && (
        <label className="block text-xs font-medium text-slate-400 mb-2">
          {label}
        </label>
      )}

      <button
        ref={buttonRef}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-600 text-white text-sm focus:outline-none focus:border-amber-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between hover:border-slate-500 transition-colors"
      >
        <span>{selectedLabel}</span>
        <ChevronDown
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-slate-900 border border-slate-600 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                value === option.value
                  ? 'bg-amber-600/30 text-amber-300 font-medium'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
