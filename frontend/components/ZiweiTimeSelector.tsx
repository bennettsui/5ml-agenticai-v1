'use client';

import { useState, useRef, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface ZiweiTimeSelectorProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}

// Hour branches with their corresponding 24-hour time ranges
const hourBranchMap = [
  { branch: '子', display: '子時 (23:00-01:00)', value: '子' },
  { branch: '丑', display: '丑時 (01:00-03:00)', value: '丑' },
  { branch: '寅', display: '寅時 (03:00-05:00)', value: '寅' },
  { branch: '卯', display: '卯時 (05:00-07:00)', value: '卯' },
  { branch: '辰', display: '辰時 (07:00-09:00)', value: '辰' },
  { branch: '巳', display: '巳時 (09:00-11:00)', value: '巳' },
  { branch: '午', display: '午時 (11:00-13:00)', value: '午' },
  { branch: '未', display: '未時 (13:00-15:00)', value: '未' },
  { branch: '申', display: '申時 (15:00-17:00)', value: '申' },
  { branch: '酉', display: '酉時 (17:00-19:00)', value: '酉' },
  { branch: '戌', display: '戌時 (19:00-21:00)', value: '戌' },
  { branch: '亥', display: '亥時 (21:00-23:00)', value: '亥' },
];

export function ZiweiTimeSelector({ value, onChange, label }: ZiweiTimeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const selectedOption = hourBranchMap.find(h => h.value === value);
  const displayText = selectedOption?.display || '時 (time)';

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

      const currentIndex = hourBranchMap.findIndex(h => h.value === value);

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          const nextIndex = Math.min(currentIndex + 1, hourBranchMap.length - 1);
          onChange(hourBranchMap[nextIndex].value);
          break;
        case 'ArrowUp':
          event.preventDefault();
          const prevIndex = Math.max(currentIndex - 1, 0);
          onChange(hourBranchMap[prevIndex].value);
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
  }, [isOpen, value, onChange]);

  return (
    <div ref={containerRef} className="relative">
      {label && (
        <label className="block text-xs font-medium text-slate-400 mb-2">
          {label}
        </label>
      )}

      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-600 text-white text-sm focus:outline-none focus:border-amber-500 flex items-center justify-between hover:border-slate-500 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-500" />
          <span>{displayText}</span>
        </div>
        <span className="text-xs text-slate-500">▼</span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-slate-900 border border-slate-600 rounded-lg shadow-lg max-h-56 overflow-y-auto">
          {hourBranchMap.map((hourOption) => (
            <button
              key={hourOption.value}
              onClick={() => {
                onChange(hourOption.value);
                setIsOpen(false);
              }}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                value === hourOption.value
                  ? 'bg-amber-600/30 text-amber-300 font-medium border-l-2 border-amber-500'
                  : 'text-slate-300 hover:bg-slate-800 border-l-2 border-transparent'
              }`}
            >
              {hourOption.display}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
