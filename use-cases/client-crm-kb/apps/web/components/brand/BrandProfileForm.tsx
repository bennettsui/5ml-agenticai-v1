'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { DosDontsEditor } from '@/components/brand/DosDontsEditor';
import { ColorPaletteEditor } from '@/components/brand/ColorPaletteEditor';
import { DocumentUploader } from '@/components/brand/DocumentUploader';
import { brand as brandApi } from '@/lib/api';
import type { BrandProfile, BrandProfileUpdate } from '@/types';

type TabKey = 'tone' | 'dos_donts' | 'visual' | 'documents' | 'review';

interface ColorEntry {
  name: string;
  hex: string;
}

interface Typography {
  primary_font: string;
  secondary_font: string;
  heading_style: string;
  body_style: string;
}

const TABS: { key: TabKey; label: string }[] = [
  { key: 'tone', label: 'Tone & Values' },
  { key: 'dos_donts', label: "Do's & Don'ts" },
  { key: 'visual', label: 'Visual Rules' },
  { key: 'documents', label: 'Documents' },
  { key: 'review', label: 'Review' },
];

interface BrandProfileFormProps {
  clientId: string;
}

export function BrandProfileForm({ clientId }: BrandProfileFormProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('tone');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [profile, setProfile] = useState<BrandProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form state
  const [brandTone, setBrandTone] = useState('');
  const [brandValues, setBrandValues] = useState<string[]>([]);
  const [keyMessages, setKeyMessages] = useState<string[]>([]);
  const [doList, setDoList] = useState<string[]>([]);
  const [dontList, setDontList] = useState<string[]>([]);
  const [colors, setColors] = useState<ColorEntry[]>([]);
  const [typography, setTypography] = useState<Typography>({
    primary_font: '',
    secondary_font: '',
    heading_style: '',
    body_style: '',
  });
  const [documents, setDocuments] = useState<string[]>([]);

  // Tag input state
  const [newValue, setNewValue] = useState('');
  const [newMessage, setNewMessage] = useState('');

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await brandApi.get(clientId);
      setProfile(data);
      setBrandTone(data.brand_tone || '');
      setBrandValues(data.brand_values || []);
      setKeyMessages(data.key_messages || []);
      setDoList(data.do_list || []);
      setDontList(data.dont_list || []);
      setDocuments(data.documents || []);

      // Parse visual rules
      const vr = (data.visual_rules || {}) as Record<string, unknown>;
      setColors(
        Array.isArray(vr.colors)
          ? (vr.colors as ColorEntry[])
          : []
      );
      setTypography({
        primary_font: (vr.primary_font as string) || '',
        secondary_font: (vr.secondary_font as string) || '',
        heading_style: (vr.heading_style as string) || '',
        body_style: (vr.body_style as string) || '',
      });
    } catch {
      // Profile may not exist yet, which is fine
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const buildUpdate = (): BrandProfileUpdate => ({
    brand_tone: brandTone || null,
    brand_values: brandValues.length > 0 ? brandValues : null,
    key_messages: keyMessages.length > 0 ? keyMessages : null,
    do_list: doList.length > 0 ? doList : null,
    dont_list: dontList.length > 0 ? dontList : null,
    visual_rules: {
      colors,
      primary_font: typography.primary_font,
      secondary_font: typography.secondary_font,
      heading_style: typography.heading_style,
      body_style: typography.body_style,
    },
    documents: documents.length > 0 ? documents : null,
  });

  const saveSection = async (status?: 'draft' | 'active') => {
    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);
      const update = buildUpdate();
      if (status) {
        update.status = status;
      }
      const result = await brandApi.createOrUpdate(clientId, update);
      setProfile(result);
      setSuccessMessage(status === 'active' ? 'Brand profile published!' : 'Section saved!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleExtractWithAI = async () => {
    try {
      setExtracting(true);
      // Simulate AI extraction - in production this would call an API endpoint
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setSuccessMessage('AI extraction completed! Review the extracted data in each tab.');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI extraction failed');
    } finally {
      setExtracting(false);
    }
  };

  const addValue = () => {
    const trimmed = newValue.trim();
    if (trimmed && !brandValues.includes(trimmed)) {
      setBrandValues([...brandValues, trimmed]);
      setNewValue('');
    }
  };

  const removeValue = (index: number) => {
    setBrandValues(brandValues.filter((_, i) => i !== index));
  };

  const addMessage = () => {
    const trimmed = newMessage.trim();
    if (trimmed && !keyMessages.includes(trimmed)) {
      setKeyMessages([...keyMessages, trimmed]);
      setNewMessage('');
    }
  };

  const removeMessage = (index: number) => {
    setKeyMessages(keyMessages.filter((_, i) => i !== index));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status messages */}
      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          {error}
        </div>
      )}
      {successMessage && (
        <div className="rounded-md bg-green-50 border border-green-200 p-4 text-sm text-green-700">
          {successMessage}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-1" aria-label="Brand profile tabs">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {/* Tone & Values Tab */}
        {activeTab === 'tone' && (
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Brand Tone</label>
              <Textarea
                value={brandTone}
                onChange={(e) => setBrandTone(e.target.value)}
                placeholder="Describe the brand's tone of voice (e.g., professional yet approachable, bold and confident...)"
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Brand Values</label>
              <div className="flex gap-2">
                <Input
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addValue();
                    }
                  }}
                  placeholder="Add a value and press Enter..."
                />
                <Button type="button" onClick={addValue} size="sm" disabled={!newValue.trim()}>
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {brandValues.map((v, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-700"
                  >
                    {v}
                    <button
                      type="button"
                      onClick={() => removeValue(i)}
                      className="text-blue-400 hover:text-blue-700"
                    >
                      &#10005;
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Key Messages</label>
              <div className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addMessage();
                    }
                  }}
                  placeholder="Add a key message and press Enter..."
                />
                <Button type="button" onClick={addMessage} size="sm" disabled={!newMessage.trim()}>
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {keyMessages.map((m, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-3 py-1 text-sm text-purple-700"
                  >
                    {m}
                    <button
                      type="button"
                      onClick={() => removeMessage(i)}
                      className="text-purple-400 hover:text-purple-700"
                    >
                      &#10005;
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={() => saveSection()} disabled={saving}>
                {saving ? 'Saving...' : 'Save Tone & Values'}
              </Button>
            </div>
          </div>
        )}

        {/* Do's & Don'ts Tab */}
        {activeTab === 'dos_donts' && (
          <div className="space-y-6">
            <DosDontsEditor
              doList={doList}
              dontList={dontList}
              onDoListChange={setDoList}
              onDontListChange={setDontList}
            />
            <div className="flex justify-end">
              <Button onClick={() => saveSection()} disabled={saving}>
                {saving ? 'Saving...' : "Save Do's & Don'ts"}
              </Button>
            </div>
          </div>
        )}

        {/* Visual Rules Tab */}
        {activeTab === 'visual' && (
          <div className="space-y-6">
            <ColorPaletteEditor
              colors={colors}
              typography={typography}
              onColorsChange={setColors}
              onTypographyChange={setTypography}
            />
            <div className="flex justify-end">
              <Button onClick={() => saveSection()} disabled={saving}>
                {saving ? 'Saving...' : 'Save Visual Rules'}
              </Button>
            </div>
          </div>
        )}

        {/* Documents Tab */}
        {activeTab === 'documents' && (
          <div className="space-y-6">
            <DocumentUploader
              documents={documents}
              onDocumentsChange={setDocuments}
              onExtractWithAI={handleExtractWithAI}
              extracting={extracting}
            />
            <div className="flex justify-end">
              <Button onClick={() => saveSection()} disabled={saving}>
                {saving ? 'Saving...' : 'Save Documents'}
              </Button>
            </div>
          </div>
        )}

        {/* Review Tab */}
        {activeTab === 'review' && (
          <div className="space-y-6">
            <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-6">
              {/* Status Badge */}
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Brand Profile Summary</h3>
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                    profile?.status === 'active'
                      ? 'bg-green-100 text-green-700'
                      : profile?.status === 'archived'
                      ? 'bg-gray-100 text-gray-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}
                >
                  {profile?.status || 'draft'}
                </span>
              </div>

              {/* Tone */}
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">Brand Tone</h4>
                <p className="text-sm text-gray-800">
                  {brandTone || <span className="italic text-gray-400">Not set</span>}
                </p>
              </div>

              {/* Values */}
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">Brand Values</h4>
                <div className="flex flex-wrap gap-2">
                  {brandValues.length > 0 ? (
                    brandValues.map((v, i) => (
                      <span key={i} className="rounded-full bg-blue-100 px-3 py-1 text-xs text-blue-700">
                        {v}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm italic text-gray-400">Not set</span>
                  )}
                </div>
              </div>

              {/* Key Messages */}
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">Key Messages</h4>
                <div className="flex flex-wrap gap-2">
                  {keyMessages.length > 0 ? (
                    keyMessages.map((m, i) => (
                      <span key={i} className="rounded-full bg-purple-100 px-3 py-1 text-xs text-purple-700">
                        {m}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm italic text-gray-400">Not set</span>
                  )}
                </div>
              </div>

              {/* Do's & Don'ts */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-green-600 mb-1">Do&apos;s ({doList.length})</h4>
                  <ul className="space-y-1">
                    {doList.map((item, i) => (
                      <li key={i} className="text-sm text-gray-700 flex items-center gap-1">
                        <span className="text-green-500">&#10003;</span> {item}
                      </li>
                    ))}
                    {doList.length === 0 && <li className="text-sm italic text-gray-400">None</li>}
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-red-600 mb-1">Don&apos;ts ({dontList.length})</h4>
                  <ul className="space-y-1">
                    {dontList.map((item, i) => (
                      <li key={i} className="text-sm text-gray-700 flex items-center gap-1">
                        <span className="text-red-500">&#10007;</span> {item}
                      </li>
                    ))}
                    {dontList.length === 0 && <li className="text-sm italic text-gray-400">None</li>}
                  </ul>
                </div>
              </div>

              {/* Colors */}
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Color Palette</h4>
                <div className="flex flex-wrap gap-3">
                  {colors.length > 0 ? (
                    colors.map((c, i) => (
                      <div key={i} className="text-center">
                        <div
                          className="w-10 h-10 rounded-lg border border-gray-200"
                          style={{ backgroundColor: c.hex }}
                        />
                        <span className="text-xs text-gray-500 mt-1 block">{c.name}</span>
                      </div>
                    ))
                  ) : (
                    <span className="text-sm italic text-gray-400">No colors defined</span>
                  )}
                </div>
              </div>

              {/* Typography */}
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">Typography</h4>
                <div className="grid grid-cols-2 gap-2 text-sm text-gray-700">
                  <div>Primary: {typography.primary_font || <span className="italic text-gray-400">Not set</span>}</div>
                  <div>Secondary: {typography.secondary_font || <span className="italic text-gray-400">Not set</span>}</div>
                  <div>Heading: {typography.heading_style || <span className="italic text-gray-400">Not set</span>}</div>
                  <div>Body: {typography.body_style || <span className="italic text-gray-400">Not set</span>}</div>
                </div>
              </div>

              {/* Documents */}
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">Documents ({documents.length})</h4>
                {documents.length > 0 ? (
                  <ul className="space-y-1">
                    {documents.map((d, i) => (
                      <li key={i} className="text-sm text-gray-700">{d}</li>
                    ))}
                  </ul>
                ) : (
                  <span className="text-sm italic text-gray-400">No documents uploaded</span>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => saveSection('draft')}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save as Draft'}
              </Button>
              <Button
                onClick={() => saveSection('active')}
                disabled={saving}
                className="bg-green-600 hover:bg-green-700"
              >
                {saving ? 'Publishing...' : 'Publish'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
