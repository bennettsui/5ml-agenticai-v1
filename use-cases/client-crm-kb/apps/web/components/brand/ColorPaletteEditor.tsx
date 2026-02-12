'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ColorEntry {
  name: string;
  hex: string;
}

interface ColorPaletteEditorProps {
  colors: ColorEntry[];
  typography: {
    primary_font: string;
    secondary_font: string;
    heading_style: string;
    body_style: string;
  };
  onColorsChange: (colors: ColorEntry[]) => void;
  onTypographyChange: (typography: {
    primary_font: string;
    secondary_font: string;
    heading_style: string;
    body_style: string;
  }) => void;
  disabled?: boolean;
}

export function ColorPaletteEditor({
  colors,
  typography,
  onColorsChange,
  onTypographyChange,
  disabled = false,
}: ColorPaletteEditorProps) {
  const [newColorName, setNewColorName] = useState('');
  const [newColorHex, setNewColorHex] = useState('#000000');

  const addColor = () => {
    const trimmedName = newColorName.trim();
    if (trimmedName && newColorHex) {
      onColorsChange([...colors, { name: trimmedName, hex: newColorHex }]);
      setNewColorName('');
      setNewColorHex('#000000');
    }
  };

  const removeColor = (index: number) => {
    onColorsChange(colors.filter((_, i) => i !== index));
  };

  const updateColor = (index: number, field: keyof ColorEntry, value: string) => {
    const updated = colors.map((c, i) =>
      i === index ? { ...c, [field]: value } : c
    );
    onColorsChange(updated);
  };

  return (
    <div className="space-y-8">
      {/* Color Palette */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Color Palette</h3>

        {/* Color swatches grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {colors.map((color, index) => (
            <div key={index} className="space-y-2">
              <div
                className="w-full h-20 rounded-lg border border-gray-200 shadow-sm"
                style={{ backgroundColor: color.hex }}
              />
              <Input
                value={color.name}
                onChange={(e) => updateColor(index, 'name', e.target.value)}
                placeholder="Name"
                disabled={disabled}
                className="text-xs h-8"
              />
              <div className="flex items-center gap-1">
                <input
                  type="color"
                  value={color.hex}
                  onChange={(e) => updateColor(index, 'hex', e.target.value)}
                  disabled={disabled}
                  className="w-8 h-8 rounded border border-gray-200 cursor-pointer"
                />
                <Input
                  value={color.hex}
                  onChange={(e) => updateColor(index, 'hex', e.target.value)}
                  placeholder="#000000"
                  disabled={disabled}
                  className="text-xs h-8 font-mono"
                />
              </div>
              {!disabled && (
                <Button
                  type="button"
                  onClick={() => removeColor(index)}
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  Remove
                </Button>
              )}
            </div>
          ))}
        </div>

        {/* Add new color */}
        {!disabled && (
          <div className="flex items-end gap-3 p-4 rounded-lg border border-dashed border-gray-300 bg-gray-50">
            <div className="flex-1 space-y-1">
              <label className="text-xs font-medium text-gray-600">Color Name</label>
              <Input
                value={newColorName}
                onChange={(e) => setNewColorName(e.target.value)}
                placeholder="e.g., Primary Blue"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600">Hex Value</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={newColorHex}
                  onChange={(e) => setNewColorHex(e.target.value)}
                  className="w-10 h-10 rounded border border-gray-200 cursor-pointer"
                />
                <Input
                  value={newColorHex}
                  onChange={(e) => setNewColorHex(e.target.value)}
                  placeholder="#000000"
                  className="w-28 font-mono"
                />
              </div>
            </div>
            <Button
              type="button"
              onClick={addColor}
              disabled={!newColorName.trim()}
              size="sm"
            >
              Add Color
            </Button>
          </div>
        )}

        {colors.length === 0 && (
          <p className="text-sm text-gray-400 italic">No colors defined yet.</p>
        )}
      </div>

      {/* Typography Settings */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Typography</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Primary Font</label>
            <Input
              value={typography.primary_font}
              onChange={(e) =>
                onTypographyChange({ ...typography, primary_font: e.target.value })
              }
              placeholder="e.g., Inter, Helvetica Neue"
              disabled={disabled}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Secondary Font</label>
            <Input
              value={typography.secondary_font}
              onChange={(e) =>
                onTypographyChange({ ...typography, secondary_font: e.target.value })
              }
              placeholder="e.g., Georgia, Times New Roman"
              disabled={disabled}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Heading Style</label>
            <Input
              value={typography.heading_style}
              onChange={(e) =>
                onTypographyChange({ ...typography, heading_style: e.target.value })
              }
              placeholder="e.g., Bold, uppercase, 1.2em letter-spacing"
              disabled={disabled}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Body Style</label>
            <Input
              value={typography.body_style}
              onChange={(e) =>
                onTypographyChange({ ...typography, body_style: e.target.value })
              }
              placeholder="e.g., Regular, 16px, 1.6 line-height"
              disabled={disabled}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
