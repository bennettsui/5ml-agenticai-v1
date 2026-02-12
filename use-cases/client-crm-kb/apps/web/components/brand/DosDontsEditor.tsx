'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface DosDontsEditorProps {
  doList: string[];
  dontList: string[];
  onDoListChange: (items: string[]) => void;
  onDontListChange: (items: string[]) => void;
  disabled?: boolean;
}

export function DosDontsEditor({
  doList,
  dontList,
  onDoListChange,
  onDontListChange,
  disabled = false,
}: DosDontsEditorProps) {
  const [newDo, setNewDo] = useState('');
  const [newDont, setNewDont] = useState('');

  const addDo = () => {
    const trimmed = newDo.trim();
    if (trimmed && !doList.includes(trimmed)) {
      onDoListChange([...doList, trimmed]);
      setNewDo('');
    }
  };

  const removeDo = (index: number) => {
    onDoListChange(doList.filter((_, i) => i !== index));
  };

  const addDont = () => {
    const trimmed = newDont.trim();
    if (trimmed && !dontList.includes(trimmed)) {
      onDontListChange([...dontList, trimmed]);
      setNewDont('');
    }
  };

  const removeDont = (index: number) => {
    onDontListChange(dontList.filter((_, i) => i !== index));
  };

  const handleDoKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addDo();
    }
  };

  const handleDontKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addDont();
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Do's Column */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-green-700 flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-700 text-sm font-bold">
            +
          </span>
          Do&apos;s
        </h3>
        <div className="flex gap-2">
          <Input
            value={newDo}
            onChange={(e) => setNewDo(e.target.value)}
            onKeyDown={handleDoKeyDown}
            placeholder="Add a do..."
            disabled={disabled}
          />
          <Button
            type="button"
            onClick={addDo}
            disabled={disabled || !newDo.trim()}
            size="sm"
            className="bg-green-600 hover:bg-green-700"
          >
            Add
          </Button>
        </div>
        <ul className="space-y-2">
          {doList.map((item, index) => (
            <li
              key={index}
              className="flex items-center justify-between rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm"
            >
              <span className="flex items-center gap-2">
                <span className="text-green-600 font-bold">&#10003;</span>
                {item}
              </span>
              {!disabled && (
                <button
                  type="button"
                  onClick={() => removeDo(index)}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                  aria-label={`Remove "${item}"`}
                >
                  &#10005;
                </button>
              )}
            </li>
          ))}
          {doList.length === 0 && (
            <li className="text-sm text-gray-400 italic py-2">
              No items added yet.
            </li>
          )}
        </ul>
      </div>

      {/* Don'ts Column */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-red-700 flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-100 text-red-700 text-sm font-bold">
            -
          </span>
          Don&apos;ts
        </h3>
        <div className="flex gap-2">
          <Input
            value={newDont}
            onChange={(e) => setNewDont(e.target.value)}
            onKeyDown={handleDontKeyDown}
            placeholder="Add a don't..."
            disabled={disabled}
          />
          <Button
            type="button"
            onClick={addDont}
            disabled={disabled || !newDont.trim()}
            size="sm"
            variant="destructive"
          >
            Add
          </Button>
        </div>
        <ul className="space-y-2">
          {dontList.map((item, index) => (
            <li
              key={index}
              className="flex items-center justify-between rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm"
            >
              <span className="flex items-center gap-2">
                <span className="text-red-600 font-bold">&#10007;</span>
                {item}
              </span>
              {!disabled && (
                <button
                  type="button"
                  onClick={() => removeDont(index)}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                  aria-label={`Remove "${item}"`}
                >
                  &#10005;
                </button>
              )}
            </li>
          ))}
          {dontList.length === 0 && (
            <li className="text-sm text-gray-400 italic py-2">
              No items added yet.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
