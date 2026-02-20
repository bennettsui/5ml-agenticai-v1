'use client';

import { useState, useMemo } from 'react';
import { Palette, Type, Sparkles } from 'lucide-react';

interface BrandIdentityStepProps {
  formState: {
    voiceTone?: string;
    brandPersonality?: string[];
    colorPalette?: { primary: string; secondary: string; accent: string };
    visualStyle?: string;
  };
  onUpdate: (updates: any) => void;
}

const VOICE_TONES = [
  { id: 'professional', label: 'Professional & Trustworthy', emoji: '🎯' },
  { id: 'friendly', label: 'Friendly & Approachable', emoji: '😊' },
  { id: 'witty', label: 'Witty & Conversational', emoji: '💬' },
  { id: 'data-driven', label: 'Data-driven & Authoritative', emoji: '📊' },
  { id: 'playful', label: 'Playful & Vibrant', emoji: '🎨' },
];

const VISUAL_STYLES = [
  { id: 'minimalist', label: 'Minimalist & Clean', emoji: '▢' },
  { id: 'photography', label: 'Photography-heavy', emoji: '📷' },
  { id: 'data', label: 'Data Visualization Focused', emoji: '📈' },
  { id: 'vibrant', label: 'Vibrant & Colorful', emoji: '🌈' },
  { id: 'corporate', label: 'Corporate & Professional', emoji: '🏢' },
];

const PERSONALITIES = [
  'Innovative',
  'Trustworthy',
  'Bold',
  'Warm',
  'Analytical',
  'Creative',
  'Authentic',
  'Playful',
  'Professional',
  'Accessible',
];

export default function BrandIdentityStep({ formState, onUpdate }: BrandIdentityStepProps) {
  const [primaryColor, setPrimaryColor] = useState(formState.colorPalette?.primary || '#000000');
  const [secondaryColor, setSecondaryColor] = useState(formState.colorPalette?.secondary || '#666666');
  const [accentColor, setAccentColor] = useState(formState.colorPalette?.accent || '#0066ff');

  const selectedPersonalities = useMemo(() => formState.brandPersonality || [], [formState.brandPersonality]);

  const handlePersonalityToggle = (personality: string) => {
    const updated = selectedPersonalities.includes(personality)
      ? selectedPersonalities.filter(p => p !== personality)
      : [...selectedPersonalities, personality];
    onUpdate({ brandPersonality: updated });
  };

  const handleColorUpdate = () => {
    onUpdate({
      colorPalette: {
        primary: primaryColor,
        secondary: secondaryColor,
        accent: accentColor,
      },
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-5 h-5 text-purple-400" />
          <h2 className="text-2xl font-bold text-white">Brand Identity</h2>
        </div>
        <p className="text-sm text-slate-400">
          Define your brand voice, personality, and visual style (optional but recommended)
        </p>
      </div>

      {/* Voice & Tone */}
      <div>
        <label className="block text-sm font-semibold mb-3">Brand Voice & Tone</label>
        <div className="grid grid-cols-1 gap-2">
          {VOICE_TONES.map((tone) => (
            <button
              key={tone.id}
              onClick={() => onUpdate({ voiceTone: tone.id })}
              className={`text-left px-4 py-3 rounded-lg border transition-all flex items-center gap-3 ${
                formState.voiceTone === tone.id
                  ? 'bg-purple-600/20 border-purple-500/50 ring-1 ring-purple-500/30'
                  : 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800/60'
              }`}
            >
              <span className="text-lg">{tone.emoji}</span>
              <div className="text-sm font-medium">{tone.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Brand Personality */}
      <div>
        <label className="block text-sm font-semibold mb-3">Brand Personality</label>
        <p className="text-xs text-slate-400 mb-3">Select up to 3 attributes that describe your brand</p>
        <div className="grid grid-cols-2 gap-2">
          {PERSONALITIES.map((personality) => (
            <button
              key={personality}
              onClick={() => handlePersonalityToggle(personality)}
              className={`text-sm px-3 py-2 rounded-lg border transition-all ${
                selectedPersonalities.includes(personality)
                  ? 'bg-emerald-600/20 border-emerald-500/50 text-emerald-300'
                  : 'bg-slate-800/40 border-slate-700/50 text-slate-400 hover:border-slate-600/50'
              }`}
            >
              {personality}
            </button>
          ))}
        </div>
      </div>

      {/* Visual Style */}
      <div>
        <label className="block text-sm font-semibold mb-3">Visual Aesthetic</label>
        <div className="grid grid-cols-1 gap-2">
          {VISUAL_STYLES.map((style) => (
            <button
              key={style.id}
              onClick={() => onUpdate({ visualStyle: style.id })}
              className={`text-left px-4 py-3 rounded-lg border transition-all flex items-center gap-3 ${
                formState.visualStyle === style.id
                  ? 'bg-purple-600/20 border-purple-500/50 ring-1 ring-purple-500/30'
                  : 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800/60'
              }`}
            >
              <span className="text-lg">{style.emoji}</span>
              <div className="text-sm font-medium">{style.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Color Palette */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Palette className="w-4 h-4 text-slate-400" />
          <label className="text-sm font-semibold">Brand Colors</label>
        </div>
        <p className="text-xs text-slate-400 mb-4">Define your primary color palette</p>

        <div className="space-y-4">
          {/* Primary Color */}
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="text-xs font-medium text-slate-300 mb-2 block">Primary Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-16 h-10 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="flex-1 px-3 py-2 rounded bg-slate-800/60 border border-slate-700/50 text-white text-xs font-mono"
                />
              </div>
            </div>
          </div>

          {/* Secondary Color */}
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="text-xs font-medium text-slate-300 mb-2 block">Secondary Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="w-16 h-10 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="flex-1 px-3 py-2 rounded bg-slate-800/60 border border-slate-700/50 text-white text-xs font-mono"
                />
              </div>
            </div>
          </div>

          {/* Accent Color */}
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="text-xs font-medium text-slate-300 mb-2 block">Accent Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="w-16 h-10 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="flex-1 px-3 py-2 rounded bg-slate-800/60 border border-slate-700/50 text-white text-xs font-mono"
                />
              </div>
            </div>
          </div>

          {/* Update Colors Button */}
          <button
            onClick={handleColorUpdate}
            className="w-full px-4 py-2 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition-colors"
          >
            Update Colors
          </button>
        </div>

        {/* Color Preview */}
        <div className="mt-4 flex gap-3">
          <div
            className="w-16 h-16 rounded-lg border border-slate-700/50"
            style={{ backgroundColor: primaryColor }}
            title="Primary"
          />
          <div
            className="w-16 h-16 rounded-lg border border-slate-700/50"
            style={{ backgroundColor: secondaryColor }}
            title="Secondary"
          />
          <div
            className="w-16 h-16 rounded-lg border border-slate-700/50"
            style={{ backgroundColor: accentColor }}
            title="Accent"
          />
        </div>
      </div>

      {/* Help Text */}
      <div className="px-4 py-3 bg-slate-800/40 border border-slate-700/50 rounded-lg">
        <p className="text-xs text-slate-400">
          💡 <strong>Tip:</strong> Leave this step blank to skip it. You can always add brand identity details later in the CRM.
        </p>
      </div>
    </div>
  );
}
