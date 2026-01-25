'use client';

import { useState, useEffect, useRef } from 'react';
import { Save, Trash2, Plus, Eye, EyeOff, RefreshCw, ChevronDown, ChevronUp, Loader2, AlertCircle, CheckCircle2, GripVertical, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';
import ThemePreview from '../components/ThemePreview';

interface Theme {
  id: number;
  theme_id: string;
  name: string;
  country: string;
  description: string;
  era: string;
  image_url: string;
  prompt: string;
  is_enabled: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

const API_BASE = typeof window !== 'undefined' && window.location.hostname === 'localhost'
  ? (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080')
  : '';

export default function PhotoBoothAdminPage() {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [expandedTheme, setExpandedTheme] = useState<string | null>(null);
  const [editingPrompt, setEditingPrompt] = useState<{ [key: string]: string }>({});
  const [newTheme, setNewTheme] = useState<Partial<Theme> | null>(null);

  // Drag and drop state
  const [draggedTheme, setDraggedTheme] = useState<string | null>(null);
  const [dragOverTheme, setDragOverTheme] = useState<string | null>(null);

  useEffect(() => {
    fetchThemes();
  }, []);

  const fetchThemes = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_BASE}/api/photo-booth/admin/themes`);
      const data = await response.json();
      if (data.success) {
        setThemes(data.themes);
        // Initialize editing prompts
        const prompts: { [key: string]: string } = {};
        data.themes.forEach((t: Theme) => {
          prompts[t.theme_id] = t.prompt;
        });
        setEditingPrompt(prompts);
      } else {
        setError(data.error || 'Failed to fetch themes');
      }
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const seedThemes = async () => {
    try {
      setSaving('seed');
      const response = await fetch(`${API_BASE}/api/photo-booth/admin/themes/seed`, {
        method: 'POST',
      });
      const data = await response.json();
      if (data.success) {
        setSuccess(data.message);
        fetchThemes();
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to seed themes');
    } finally {
      setSaving(null);
    }
  };

  const toggleTheme = async (themeId: string) => {
    try {
      setSaving(themeId);
      const response = await fetch(`${API_BASE}/api/photo-booth/admin/themes/${themeId}/toggle`, {
        method: 'POST',
      });
      const data = await response.json();
      if (data.success) {
        setThemes(themes.map(t => t.theme_id === themeId ? data.theme : t));
        setSuccess(`Theme "${data.theme.name}" ${data.theme.is_enabled ? 'enabled' : 'disabled'}`);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to toggle theme');
    } finally {
      setSaving(null);
    }
  };

  const saveTheme = async (theme: Theme) => {
    try {
      setSaving(theme.theme_id);
      const response = await fetch(`${API_BASE}/api/photo-booth/admin/themes/${theme.theme_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...theme,
          prompt: editingPrompt[theme.theme_id] || theme.prompt,
        }),
      });
      const data = await response.json();
      if (data.success) {
        setThemes(themes.map(t => t.theme_id === theme.theme_id ? data.theme : t));
        setSuccess(`Theme "${data.theme.name}" saved`);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to save theme');
    } finally {
      setSaving(null);
    }
  };

  const deleteTheme = async (themeId: string) => {
    if (!confirm('Are you sure you want to delete this theme?')) return;

    try {
      setSaving(themeId);
      const response = await fetch(`${API_BASE}/api/photo-booth/admin/themes/${themeId}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (data.success) {
        setThemes(themes.filter(t => t.theme_id !== themeId));
        setSuccess(`Theme deleted`);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to delete theme');
    } finally {
      setSaving(null);
    }
  };

  const createTheme = async () => {
    if (!newTheme?.theme_id || !newTheme?.name || !newTheme?.prompt) {
      setError('Theme ID, Name, and Prompt are required');
      return;
    }

    try {
      setSaving('new');
      const response = await fetch(`${API_BASE}/api/photo-booth/admin/themes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTheme),
      });
      const data = await response.json();
      if (data.success) {
        setThemes([...themes, data.theme]);
        setEditingPrompt({ ...editingPrompt, [data.theme.theme_id]: data.theme.prompt });
        setNewTheme(null);
        setSuccess(`Theme "${data.theme.name}" created`);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to create theme');
    } finally {
      setSaving(null);
    }
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, themeId: string) => {
    setDraggedTheme(themeId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, themeId: string) => {
    e.preventDefault();
    if (draggedTheme !== themeId) {
      setDragOverTheme(themeId);
    }
  };

  const handleDragLeave = () => {
    setDragOverTheme(null);
  };

  const handleDrop = async (e: React.DragEvent, targetThemeId: string) => {
    e.preventDefault();
    setDragOverTheme(null);

    if (!draggedTheme || draggedTheme === targetThemeId) {
      setDraggedTheme(null);
      return;
    }

    // Reorder themes
    const draggedIndex = themes.findIndex(t => t.theme_id === draggedTheme);
    const targetIndex = themes.findIndex(t => t.theme_id === targetThemeId);

    const newThemes = [...themes];
    const [removed] = newThemes.splice(draggedIndex, 1);
    newThemes.splice(targetIndex, 0, removed);

    // Update display_order for all themes
    const updatedThemes = newThemes.map((t, index) => ({ ...t, display_order: index }));
    setThemes(updatedThemes);

    // Save new order to database
    try {
      setSaving('reorder');
      for (const theme of updatedThemes) {
        await fetch(`${API_BASE}/api/photo-booth/admin/themes/${theme.theme_id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ display_order: theme.display_order }),
        });
      }
      setSuccess('Theme order updated');
    } catch (err) {
      setError('Failed to save theme order');
      fetchThemes(); // Revert on error
    } finally {
      setSaving(null);
    }

    setDraggedTheme(null);
  };

  const handleDragEnd = () => {
    setDraggedTheme(null);
    setDragOverTheme(null);
  };

  // Clear messages after 3 seconds
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess(null);
        setError(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  const enabledCount = themes.filter(t => t.is_enabled).length;

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Photo Booth CMS</h1>
            <p className="text-sm text-gray-400">
              Manage themes and prompts • {enabledCount} of {themes.length} enabled
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/photo-booth/admin/library"
              className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 flex items-center gap-2 text-sm"
            >
              <ImageIcon className="w-4 h-4" />
              Photo Library
            </Link>
            <button
              onClick={seedThemes}
              disabled={saving === 'seed'}
              className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 flex items-center gap-2 text-sm"
            >
              {saving === 'seed' ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Seed from Config
            </button>
            <button
              onClick={() => setNewTheme({ theme_id: '', name: '', prompt: '', is_enabled: true, display_order: themes.length })}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2 text-sm"
            >
              <Plus className="w-4 h-4" />
              Add Theme
            </button>
          </div>
        </div>
      </header>

      {/* Notifications */}
      {(error || success) && (
        <div className="max-w-6xl mx-auto px-4 mt-4">
          {error && (
            <div className="p-3 bg-red-900/50 text-red-300 rounded-lg flex items-center gap-2 border border-red-800">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}
          {success && (
            <div className="p-3 bg-green-900/50 text-green-300 rounded-lg flex items-center gap-2 border border-green-800">
              <CheckCircle2 className="w-4 h-4" />
              {success}
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      <div className="max-w-6xl mx-auto px-4 mt-4">
        <div className="bg-slate-800/50 rounded-lg p-3 text-sm text-gray-400 border border-slate-700">
          <span className="font-medium text-gray-300">Tip:</span> Drag themes by the handle (⋮⋮) to reorder. Only enabled themes appear in the photo booth.
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
          </div>
        ) : themes.length === 0 ? (
          <div className="text-center py-12 bg-slate-800 rounded-lg border border-slate-700">
            <p className="text-gray-400 mb-4">No themes found in database</p>
            <button
              onClick={seedThemes}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Seed Default Themes
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {/* New Theme Form */}
            {newTheme && (
              <div className="bg-slate-800 rounded-lg border border-purple-500 p-4 mb-4">
                <h3 className="text-lg font-semibold text-white mb-4">New Theme</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <input
                    type="text"
                    placeholder="Theme ID (e.g., my-theme)"
                    value={newTheme.theme_id || ''}
                    onChange={(e) => setNewTheme({ ...newTheme, theme_id: e.target.value })}
                    className="bg-slate-700 text-white px-3 py-2 rounded-lg border border-slate-600 focus:border-purple-500 outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Name"
                    value={newTheme.name || ''}
                    onChange={(e) => setNewTheme({ ...newTheme, name: e.target.value })}
                    className="bg-slate-700 text-white px-3 py-2 rounded-lg border border-slate-600 focus:border-purple-500 outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Country"
                    value={newTheme.country || ''}
                    onChange={(e) => setNewTheme({ ...newTheme, country: e.target.value })}
                    className="bg-slate-700 text-white px-3 py-2 rounded-lg border border-slate-600 focus:border-purple-500 outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Era"
                    value={newTheme.era || ''}
                    onChange={(e) => setNewTheme({ ...newTheme, era: e.target.value })}
                    className="bg-slate-700 text-white px-3 py-2 rounded-lg border border-slate-600 focus:border-purple-500 outline-none"
                  />
                </div>
                <textarea
                  placeholder="Description"
                  value={newTheme.description || ''}
                  onChange={(e) => setNewTheme({ ...newTheme, description: e.target.value })}
                  className="w-full bg-slate-700 text-white px-3 py-2 rounded-lg border border-slate-600 focus:border-purple-500 outline-none mb-4"
                  rows={2}
                />
                <textarea
                  placeholder="AI Prompt (required)"
                  value={newTheme.prompt || ''}
                  onChange={(e) => setNewTheme({ ...newTheme, prompt: e.target.value })}
                  className="w-full bg-slate-700 text-white px-3 py-2 rounded-lg border border-slate-600 focus:border-purple-500 outline-none font-mono text-sm"
                  rows={6}
                />
                <div className="flex justify-end gap-2 mt-4">
                  <button
                    onClick={() => setNewTheme(null)}
                    className="px-4 py-2 text-gray-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={createTheme}
                    disabled={saving === 'new'}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    {saving === 'new' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    Create Theme
                  </button>
                </div>
              </div>
            )}

            {/* Theme List */}
            {themes.map((theme, index) => (
              <div
                key={theme.theme_id}
                draggable
                onDragStart={(e) => handleDragStart(e, theme.theme_id)}
                onDragOver={(e) => handleDragOver(e, theme.theme_id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, theme.theme_id)}
                onDragEnd={handleDragEnd}
                className={`bg-slate-800 rounded-lg border transition-all ${
                  dragOverTheme === theme.theme_id
                    ? 'border-purple-500 bg-purple-900/20'
                    : theme.is_enabled
                    ? 'border-slate-600'
                    : 'border-slate-700 opacity-60'
                } ${draggedTheme === theme.theme_id ? 'opacity-50' : ''}`}
              >
                {/* Theme Header */}
                <div className="p-4 flex items-center gap-3">
                  {/* Drag Handle */}
                  <div className="cursor-grab active:cursor-grabbing text-gray-500 hover:text-gray-300">
                    <GripVertical className="w-5 h-5" />
                  </div>

                  {/* Order Number */}
                  <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-sm font-medium text-gray-400">
                    {index + 1}
                  </div>

                  {/* Theme Preview Thumbnail */}
                  <div className="w-16 h-20 rounded-lg overflow-hidden flex-shrink-0">
                    <ThemePreview
                      themeId={theme.theme_id}
                      themeName={theme.name}
                      size="sm"
                      className="w-full h-full"
                    />
                  </div>

                  {/* Theme Info */}
                  <div className="flex-1">
                    <h3 className="font-semibold text-white">{theme.name}</h3>
                    <p className="text-sm text-gray-400">
                      {theme.theme_id} • {theme.country || 'No country'} • {theme.era || 'No era'}
                    </p>
                  </div>

                  {/* Enable/Disable Toggle */}
                  <button
                    onClick={() => toggleTheme(theme.theme_id)}
                    disabled={saving === theme.theme_id}
                    className={`px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-colors ${
                      theme.is_enabled
                        ? 'bg-green-600 text-white hover:bg-green-700'
                        : 'bg-slate-700 text-gray-400 hover:bg-slate-600'
                    }`}
                  >
                    {saving === theme.theme_id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : theme.is_enabled ? (
                      <Eye className="w-4 h-4" />
                    ) : (
                      <EyeOff className="w-4 h-4" />
                    )}
                    {theme.is_enabled ? 'Enabled' : 'Disabled'}
                  </button>

                  {/* Expand Button */}
                  <button
                    onClick={() => setExpandedTheme(expandedTheme === theme.theme_id ? null : theme.theme_id)}
                    className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-slate-700"
                  >
                    {expandedTheme === theme.theme_id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </button>
                </div>

                {/* Expanded Content */}
                {expandedTheme === theme.theme_id && (
                  <div className="px-4 pb-4 border-t border-slate-700 pt-4 ml-16">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Name</label>
                        <input
                          type="text"
                          value={theme.name}
                          onChange={(e) => setThemes(themes.map(t => t.theme_id === theme.theme_id ? { ...t, name: e.target.value } : t))}
                          className="w-full bg-slate-700 text-white px-3 py-2 rounded-lg border border-slate-600 focus:border-purple-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                        <input
                          type="text"
                          value={theme.description}
                          onChange={(e) => setThemes(themes.map(t => t.theme_id === theme.theme_id ? { ...t, description: e.target.value } : t))}
                          className="w-full bg-slate-700 text-white px-3 py-2 rounded-lg border border-slate-600 focus:border-purple-500 outline-none"
                        />
                      </div>
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-300 mb-1">AI Prompt</label>
                      <textarea
                        value={editingPrompt[theme.theme_id] || ''}
                        onChange={(e) => setEditingPrompt({ ...editingPrompt, [theme.theme_id]: e.target.value })}
                        className="w-full bg-slate-700 text-white px-3 py-2 rounded-lg border border-slate-600 focus:border-purple-500 outline-none font-mono text-sm"
                        rows={12}
                      />
                    </div>
                    <div className="flex justify-between">
                      <button
                        onClick={() => deleteTheme(theme.theme_id)}
                        disabled={saving === theme.theme_id}
                        className="px-4 py-2 text-red-400 hover:text-red-300 flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                      <button
                        onClick={() => saveTheme(theme)}
                        disabled={saving === theme.theme_id}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
                      >
                        {saving === theme.theme_id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Save Changes
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="text-center py-4 text-sm text-gray-500">
        Photo Booth CMS • 5ML AI
      </footer>
    </div>
  );
}
