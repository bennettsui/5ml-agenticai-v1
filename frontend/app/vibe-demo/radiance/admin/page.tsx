'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Lock, RefreshCw, ChevronDown, ChevronUp,
  Users, Mail, Clock, Search, Star, Upload, Trash2, Copy,
  Check, Image as ImageIcon, FileText, BookOpen, Wand2, X,
} from 'lucide-react';

const API_BASE = typeof window !== 'undefined'
  ? (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080')
  : 'http://localhost:8080';
const ADMIN_PASSWORD = '5milesLab01@';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Submission {
  id: number;
  enquiry_id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  industry: string | null;
  service_interest: string | null;
  message: string | null;
  source_lang: string | null;
  status: string | null;
  created_at: string;
}

interface MediaItem {
  id: number;
  filename: string;
  original_name: string;
  url: string;
  mime_type: string;
  size: number;
  uploaded_at: string;
}

interface BlogPost {
  slug: string;
  title_en: string | null;
  title_zh: string | null;
  date_en: string | null;
  date_zh: string | null;
  category_en: string | null;
  category_zh: string | null;
  read_time: string | null;
  excerpt_en: string | null;
  excerpt_zh: string | null;
  hero_image: string | null;
  content_en: string | null;
  content_zh: string | null;
  updated_at: string | null;
}

interface CaseStudy {
  slug: string;
  title_en: string | null;
  title_zh: string | null;
  client: string | null;
  excerpt_en: string | null;
  excerpt_zh: string | null;
  featured_image: string | null;
  content_html_en: string | null;
  content_html_zh: string | null;
  updated_at: string | null;
}

const BLOG_SLUGS = [
  'earned-media-strategy', 'integrated-campaigns', 'product-launch-pr',
  'event-media-strategy', 'thought-leadership', 'ngos-reputation',
  'cultural-pr', 'social-media-strategy',
];

const CASE_STUDY_SLUGS = [
  'daikin', 'filorga', 'gp-batteries', 'her-own-words-sport',
  'lung-fu-shan', 'richmond-fellowship', 'venice-biennale-hk',
  'chinese-culture-exhibition',
];

// ─── Password Gate ────────────────────────────────────────────────────────────

function PasswordGate({ onAuth }: { onAuth: () => void }) {
  const [pw, setPw] = useState('');
  const [error, setError] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pw === ADMIN_PASSWORD) {
      localStorage.setItem('radiance_admin_auth', '1');
      onAuth();
    } else {
      setError('Incorrect password, please try again.');
      setPw('');
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-2xl p-8 w-full max-w-sm shadow-2xl border border-slate-700">
        <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-purple-600/20 mb-6 mx-auto">
          <Lock className="w-7 h-7 text-purple-400" />
        </div>
        <h1 className="text-2xl font-bold text-white text-center mb-2">Radiance Admin</h1>
        <p className="text-slate-400 text-sm text-center mb-6">Enter admin password to continue</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={pw}
            onChange={e => setPw(e.target.value)}
            placeholder="Password..."
            autoFocus
            className="w-full px-4 py-3 rounded-xl bg-slate-700 border border-slate-600 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-slate-500"
          />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl transition-colors"
          >
            Enter
          </button>
        </form>
        <div className="mt-6 text-center">
          <Link href="/vibe-demo/radiance" className="text-slate-500 hover:text-slate-400 text-xs">
            Back to Radiance
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Submission Row ───────────────────────────────────────────────────────────

function SubmissionRow({ sub }: { sub: Submission }) {
  const [expanded, setExpanded] = useState(false);

  const statusColor =
    sub.status === 'replied' ? 'bg-emerald-900/40 text-emerald-400 border-emerald-800/50' :
    sub.status === 'in_progress' ? 'bg-amber-900/40 text-amber-400 border-amber-800/50' :
    'bg-slate-700/40 text-slate-400 border-slate-600/40';

  return (
    <>
      <tr
        className="border-b border-slate-700/50 hover:bg-slate-800/40 cursor-pointer transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <td className="px-4 py-3 text-slate-300 text-sm font-medium">{sub.name}</td>
        <td className="px-4 py-3 text-sm">
          <a
            href={`mailto:${sub.email}`}
            className="text-purple-400 hover:text-purple-300"
            onClick={e => e.stopPropagation()}
          >
            {sub.email}
          </a>
        </td>
        <td className="px-4 py-3 text-slate-400 text-sm">{sub.phone || '—'}</td>
        <td className="px-4 py-3 text-slate-400 text-sm">{sub.company || '—'}</td>
        <td className="px-4 py-3 text-slate-400 text-sm">{sub.service_interest || '—'}</td>
        <td className="px-4 py-3">
          <span className={`inline-flex items-center text-xs px-2 py-1 rounded-full border ${statusColor}`}>
            {sub.status || 'new'}
          </span>
        </td>
        <td className="px-4 py-3 text-slate-500 text-xs">
          {new Date(sub.created_at).toLocaleDateString('en-HK', {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
          })}
        </td>
        <td className="px-4 py-3 text-slate-500">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </td>
      </tr>
      {expanded && (
        <tr className="bg-slate-800/60">
          <td colSpan={8} className="px-4 py-4">
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Message / Goals</p>
                <p className="text-slate-300 leading-relaxed whitespace-pre-line">{sub.message || '(none)'}</p>
              </div>
              <div className="space-y-1.5 text-xs text-slate-500">
                <p>Industry: <span className="text-slate-400">{sub.industry || '—'}</span></p>
                <p>Language: <span className="text-slate-400">{sub.source_lang === 'zh' ? 'Chinese (繁中)' : 'English'}</span></p>
                <p>Enquiry ID: <span className="text-slate-400 font-mono">{sub.enquiry_id}</span></p>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ─── Media Library Tab ────────────────────────────────────────────────────────

function MediaLibraryTab() {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { loadMedia(); }, []); // eslint-disable-line

  async function loadMedia() {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/radiance/admin/media?password=${encodeURIComponent(ADMIN_PASSWORD)}`);
      const data = await res.json();
      if (data.success) setMedia(data.media);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(
        `${API_BASE}/api/radiance/admin/media/upload?password=${encodeURIComponent(ADMIN_PASSWORD)}`,
        { method: 'POST', body: formData }
      );
      const data = await res.json();
      if (data.success) await loadMedia();
    } catch { /* ignore */ }
    finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this image?')) return;
    setDeletingId(id);
    try {
      await fetch(
        `${API_BASE}/api/radiance/admin/media/${id}?password=${encodeURIComponent(ADMIN_PASSWORD)}`,
        { method: 'DELETE' }
      );
      setMedia(prev => prev.filter(m => m.id !== id));
    } catch { /* ignore */ }
    finally { setDeletingId(null); }
  }

  function copyUrl(item: MediaItem) {
    const fullUrl = `${API_BASE}${item.url}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Media Library</h2>
        <div className="flex items-center gap-3">
          <button
            onClick={loadMedia}
            disabled={loading}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700/80 border border-slate-700/50 text-slate-400 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <label className={`flex items-center gap-2 px-4 py-2 rounded-xl cursor-pointer font-medium text-sm transition-colors ${
            uploading ? 'bg-purple-800 text-purple-200 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700 text-white'
          }`}>
            <Upload className="w-4 h-4" />
            {uploading ? 'Uploading...' : 'Upload Image'}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleUpload}
              disabled={uploading}
            />
          </label>
        </div>
      </div>

      {loading && media.length === 0 ? (
        <div className="text-center py-16 text-slate-500">Loading...</div>
      ) : media.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <ImageIcon className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p>No images uploaded yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {media.map(item => (
            <div key={item.id} className="group bg-slate-800/60 border border-slate-700/50 rounded-xl overflow-hidden">
              <div className="aspect-square bg-slate-900 relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`${API_BASE}${item.url}`} alt={item.original_name} className="w-full h-full object-cover" />
              </div>
              <div className="p-2.5 space-y-2">
                <p className="text-xs text-slate-400 truncate" title={item.original_name}>{item.original_name}</p>
                <p className="text-xs text-slate-600">{(item.size / 1024).toFixed(0)} KB</p>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => copyUrl(item)}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs bg-slate-700/60 hover:bg-slate-700 text-slate-300 transition-colors"
                  >
                    {copiedId === item.id
                      ? <><Check className="w-3 h-3 text-emerald-400" /> Copied</>
                      : <><Copy className="w-3 h-3" /> Copy URL</>}
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    disabled={deletingId === item.id}
                    className="p-1.5 rounded-lg bg-red-900/30 hover:bg-red-900/60 text-red-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Media Picker Modal ───────────────────────────────────────────────────────

function MediaPickerModal({ onSelect, onClose }: { onSelect: (url: string) => void; onClose: () => void }) {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/api/radiance/admin/media?password=${encodeURIComponent(ADMIN_PASSWORD)}`)
      .then(r => r.json())
      .then(d => { if (d.success) setMedia(d.media); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/50">
          <h3 className="font-semibold text-white">Choose from Media Library</h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="overflow-y-auto p-4 flex-1">
          {loading ? (
            <div className="text-center py-10 text-slate-500">Loading...</div>
          ) : media.length === 0 ? (
            <div className="text-center py-10 text-slate-500">No images in library</div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {media.map(item => (
                <button
                  key={item.id}
                  onClick={() => { onSelect(`${API_BASE}${item.url}`); onClose(); }}
                  className="group aspect-square bg-slate-900 rounded-lg overflow-hidden border border-slate-700/50 hover:border-purple-500 transition-colors"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`${API_BASE}${item.url}`}
                    alt={item.original_name}
                    className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Blog Editor ──────────────────────────────────────────────────────────────

function BlogEditor({
  slug, onClose,
}: { slug: string; onClose: () => void }) {
  const [editData, setEditData] = useState<Partial<BlogPost>>({ slug });
  const [lang, setLang] = useState<'en' | 'zh'>('en');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    fetch(`${API_BASE}/api/radiance/blog/${slug}`)
      .then(r => r.json())
      .then(d => { if (d.post) setEditData(d.post); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  function field(key: keyof BlogPost) { return (editData[key] as string) || ''; }
  function setField(key: keyof BlogPost, value: string) {
    setEditData(prev => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    setSaveError('');
    try {
      const res = await fetch(
        `${API_BASE}/api/radiance/admin/blog/${slug}?password=${encodeURIComponent(ADMIN_PASSWORD)}`,
        { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editData) }
      );
      const data = await res.json();
      if (data.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        setSaveError(data.error || 'Save failed');
      }
    } catch (err) {
      setSaveError((err as Error).message);
    } finally { setSaving(false); }
  }

  async function handleAiFormat() {
    const content = lang === 'en' ? editData.content_en : editData.content_zh;
    if (!content) return;
    setAiLoading(true);
    try {
      const res = await fetch(
        `${API_BASE}/api/radiance/admin/blog/${slug}/ai-format?password=${encodeURIComponent(ADMIN_PASSWORD)}`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content, lang }) }
      );
      const data = await res.json();
      if (data.success) {
        if (lang === 'en') setField('content_en', data.content);
        else setField('content_zh', data.content);
      }
    } catch { /* ignore */ }
    finally { setAiLoading(false); }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500">
        <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Loading post data…
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {showMediaPicker && (
        <MediaPickerModal
          onSelect={url => setField('hero_image', url)}
          onClose={() => setShowMediaPicker(false)}
        />
      )}

      {/* Editor header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-700/50">
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-0.5">Blog Post</p>
          <h3 className="text-base font-semibold text-white font-mono">{slug}</h3>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg overflow-hidden border border-slate-700/50">
            <button
              onClick={() => setLang('en')}
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${lang === 'en' ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-300'}`}
            >EN</button>
            <button
              onClick={() => setLang('zh')}
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${lang === 'zh' ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-300'}`}
            >ZH</button>
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-slate-400 mb-1.5">Title ({lang.toUpperCase()})</label>
          <input
            value={field(lang === 'en' ? 'title_en' : 'title_zh')}
            onChange={e => setField(lang === 'en' ? 'title_en' : 'title_zh', e.target.value)}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700/50 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1.5">Date ({lang.toUpperCase()})</label>
          <input
            value={field(lang === 'en' ? 'date_en' : 'date_zh')}
            onChange={e => setField(lang === 'en' ? 'date_en' : 'date_zh', e.target.value)}
            placeholder="e.g. 18 Feb 2026"
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700/50 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1.5">Category ({lang.toUpperCase()})</label>
          <input
            value={field(lang === 'en' ? 'category_en' : 'category_zh')}
            onChange={e => setField(lang === 'en' ? 'category_en' : 'category_zh', e.target.value)}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700/50 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1.5">Read Time</label>
          <input
            value={field('read_time')}
            onChange={e => setField('read_time', e.target.value)}
            placeholder="e.g. 5 min read"
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700/50 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs text-slate-400 mb-1.5">Excerpt ({lang.toUpperCase()})</label>
        <textarea
          value={field(lang === 'en' ? 'excerpt_en' : 'excerpt_zh')}
          onChange={e => setField(lang === 'en' ? 'excerpt_en' : 'excerpt_zh', e.target.value)}
          rows={3}
          className="w-full px-3 py-2 bg-slate-800 border border-slate-700/50 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 resize-none"
        />
      </div>

      <div>
        <label className="block text-xs text-slate-400 mb-1.5">Hero Image URL</label>
        <div className="flex gap-2">
          <input
            value={field('hero_image')}
            onChange={e => setField('hero_image', e.target.value)}
            placeholder="https://..."
            className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700/50 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
          <button
            onClick={() => setShowMediaPicker(true)}
            className="px-3 py-2 bg-slate-700/60 hover:bg-slate-700 border border-slate-700/50 rounded-lg text-slate-300 text-sm transition-colors whitespace-nowrap"
          >
            <ImageIcon className="w-4 h-4 inline mr-1.5" />Library
          </button>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs text-slate-400">Content HTML ({lang.toUpperCase()})</label>
          <button
            onClick={handleAiFormat}
            disabled={aiLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 rounded-lg transition-colors disabled:opacity-50"
          >
            <Wand2 className="w-3.5 h-3.5" />
            {aiLoading ? 'Formatting...' : 'AI Format'}
          </button>
        </div>
        <textarea
          value={field(lang === 'en' ? 'content_en' : 'content_zh')}
          onChange={e => setField(lang === 'en' ? 'content_en' : 'content_zh', e.target.value)}
          rows={16}
          className="w-full px-3 py-2 bg-slate-800 border border-slate-700/50 rounded-lg text-white text-sm font-mono focus:outline-none focus:ring-1 focus:ring-purple-500 resize-y"
        />
      </div>

      <div className="flex items-center gap-3 pt-2 border-t border-slate-700/50">
        {saveSuccess && (
          <span className="flex items-center gap-1 text-emerald-400 text-sm">
            <Check className="w-4 h-4" /> Saved
          </span>
        )}
        {saveError && <span className="text-red-400 text-sm">{saveError}</span>}
        <div className="flex gap-3 ml-auto">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-400 hover:text-white border border-slate-700/50 rounded-xl transition-colors">
            Back
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-sm font-semibold bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Blog CMS Tab ─────────────────────────────────────────────────────────────

function BlogCmsTab() {
  const [editingSlug, setEditingSlug] = useState<string | null>(null);

  if (editingSlug) {
    return <BlogEditor slug={editingSlug} onClose={() => setEditingSlug(null)} />;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-white">Blog CMS</h2>
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-700/50">
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Slug</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {BLOG_SLUGS.map(slug => (
              <tr key={slug} className="border-b border-slate-700/50 last:border-0 hover:bg-slate-800/40 transition-colors">
                <td className="px-4 py-3">
                  <span className="text-sm font-mono text-slate-300">{slug}</span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => setEditingSlug(slug)}
                    className="px-3 py-1.5 text-xs font-medium bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 border border-purple-500/30 rounded-lg transition-colors"
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Case Study Editor ────────────────────────────────────────────────────────

function CaseStudyEditor({
  slug, onClose,
}: { slug: string; onClose: () => void }) {
  const [editData, setEditData] = useState<Partial<CaseStudy>>({ slug });
  const [lang, setLang] = useState<'en' | 'zh'>('en');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    fetch(`${API_BASE}/api/radiance/case-studies/${slug}`)
      .then(r => r.json())
      .then(d => { if (d.study) setEditData(d.study); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  function field(key: keyof CaseStudy) { return (editData[key] as string) || ''; }
  function setField(key: keyof CaseStudy, value: string) {
    setEditData(prev => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    setSaveError('');
    try {
      const res = await fetch(
        `${API_BASE}/api/radiance/admin/case-studies/${slug}?password=${encodeURIComponent(ADMIN_PASSWORD)}`,
        { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editData) }
      );
      const data = await res.json();
      if (data.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        setSaveError(data.error || 'Save failed');
      }
    } catch (err) {
      setSaveError((err as Error).message);
    } finally { setSaving(false); }
  }

  async function handleAiFormat() {
    const content = lang === 'en' ? editData.content_html_en : editData.content_html_zh;
    if (!content) return;
    setAiLoading(true);
    try {
      const res = await fetch(
        `${API_BASE}/api/radiance/admin/blog/${slug}/ai-format?password=${encodeURIComponent(ADMIN_PASSWORD)}`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content, lang }) }
      );
      const data = await res.json();
      if (data.success) {
        if (lang === 'en') setField('content_html_en', data.content);
        else setField('content_html_zh', data.content);
      }
    } catch { /* ignore */ }
    finally { setAiLoading(false); }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500">
        <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Loading study data…
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {showMediaPicker && (
        <MediaPickerModal
          onSelect={url => setField('featured_image', url)}
          onClose={() => setShowMediaPicker(false)}
        />
      )}

      {/* Editor header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-700/50">
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-0.5">Case Study</p>
          <h3 className="text-base font-semibold text-white font-mono">{slug}</h3>
        </div>
        <div className="flex rounded-lg overflow-hidden border border-slate-700/50">
          <button
            onClick={() => setLang('en')}
            className={`px-3 py-1.5 text-sm font-medium transition-colors ${lang === 'en' ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-300'}`}
          >EN</button>
          <button
            onClick={() => setLang('zh')}
            className={`px-3 py-1.5 text-sm font-medium transition-colors ${lang === 'zh' ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-300'}`}
          >ZH</button>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-slate-400 mb-1.5">Title (EN)</label>
          <input value={field('title_en')} onChange={e => setField('title_en', e.target.value)}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700/50 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-purple-500" />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1.5">Title (ZH)</label>
          <input value={field('title_zh')} onChange={e => setField('title_zh', e.target.value)}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700/50 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-purple-500" />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1.5">Client</label>
          <input value={field('client')} onChange={e => setField('client', e.target.value)}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700/50 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-purple-500" />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-slate-400 mb-1.5">Excerpt (EN)</label>
          <textarea value={field('excerpt_en')} onChange={e => setField('excerpt_en', e.target.value)}
            rows={3} className="w-full px-3 py-2 bg-slate-800 border border-slate-700/50 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 resize-none" />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1.5">Excerpt (ZH)</label>
          <textarea value={field('excerpt_zh')} onChange={e => setField('excerpt_zh', e.target.value)}
            rows={3} className="w-full px-3 py-2 bg-slate-800 border border-slate-700/50 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 resize-none" />
        </div>
      </div>

      <div>
        <label className="block text-xs text-slate-400 mb-1.5">Featured Image URL</label>
        <div className="flex gap-2">
          <input value={field('featured_image')} onChange={e => setField('featured_image', e.target.value)}
            placeholder="https://..."
            className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700/50 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-purple-500" />
          <button onClick={() => setShowMediaPicker(true)}
            className="px-3 py-2 bg-slate-700/60 hover:bg-slate-700 border border-slate-700/50 rounded-lg text-slate-300 text-sm transition-colors whitespace-nowrap">
            <ImageIcon className="w-4 h-4 inline mr-1.5" />Library
          </button>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs text-slate-400">Content HTML ({lang.toUpperCase()})</label>
          <button onClick={handleAiFormat} disabled={aiLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 rounded-lg transition-colors disabled:opacity-50">
            <Wand2 className="w-3.5 h-3.5" />
            {aiLoading ? 'Formatting...' : 'AI Format'}
          </button>
        </div>
        <textarea
          value={field(lang === 'en' ? 'content_html_en' : 'content_html_zh')}
          onChange={e => setField(lang === 'en' ? 'content_html_en' : 'content_html_zh', e.target.value)}
          rows={16}
          className="w-full px-3 py-2 bg-slate-800 border border-slate-700/50 rounded-lg text-white text-sm font-mono focus:outline-none focus:ring-1 focus:ring-purple-500 resize-y"
        />
      </div>

      <div className="flex items-center gap-3 pt-2 border-t border-slate-700/50">
        {saveSuccess && (
          <span className="flex items-center gap-1 text-emerald-400 text-sm">
            <Check className="w-4 h-4" /> Saved
          </span>
        )}
        {saveError && <span className="text-red-400 text-sm">{saveError}</span>}
        <div className="flex gap-3 ml-auto">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-400 hover:text-white border border-slate-700/50 rounded-xl transition-colors">
            Back
          </button>
          <button onClick={handleSave} disabled={saving}
            className="px-4 py-2 text-sm font-semibold bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-colors disabled:opacity-50">
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Case Studies CMS Tab ─────────────────────────────────────────────────────

function CaseStudiesCmsTab() {
  const [editingSlug, setEditingSlug] = useState<string | null>(null);

  if (editingSlug) {
    return <CaseStudyEditor slug={editingSlug} onClose={() => setEditingSlug(null)} />;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-white">Case Studies CMS</h2>
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-700/50">
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Slug</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {CASE_STUDY_SLUGS.map(slug => (
              <tr key={slug} className="border-b border-slate-700/50 last:border-0 hover:bg-slate-800/40 transition-colors">
                <td className="px-4 py-3">
                  <span className="text-sm font-mono text-slate-300">{slug}</span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => setEditingSlug(slug)}
                    className="px-3 py-1.5 text-xs font-medium bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 border border-purple-500/30 rounded-lg transition-colors"
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Enquiries Tab ────────────────────────────────────────────────────────────

function EnquiriesTab({
  submissions, loading, search, onSearch, onRefresh,
}: {
  submissions: Submission[];
  loading: boolean;
  search: string;
  onSearch: (v: string) => void;
  onRefresh: () => void;
}) {
  const filtered = submissions.filter(s =>
    !search || [s.name, s.email, s.phone, s.company, s.industry, s.service_interest].some(
      v => v?.toLowerCase().includes(search.toLowerCase())
    )
  );
  const thisWeek = submissions.filter(s => new Date(s.created_at) > new Date(Date.now() - 7 * 86400000));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Consultation Enquiries</h2>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={e => onSearch(e.target.value)}
              placeholder="Search..."
              className="pl-9 pr-4 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-purple-500 w-44"
            />
          </div>
          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-slate-300 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: Users, label: 'Total', value: submissions.length, color: 'text-purple-400' },
          { icon: Clock, label: 'This Week', value: thisWeek.length, color: 'text-amber-400' },
          { icon: Mail, label: 'New', value: submissions.filter(s => !s.status || s.status === 'new').length, color: 'text-blue-400' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
            <Icon className={`w-4 h-4 ${color} mb-2`} />
            <div className="text-2xl font-bold text-white">{value}</div>
            <div className="text-xs text-slate-500 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            {submissions.length === 0 ? 'No enquiries yet' : 'No results match your search'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700/50">
                  {['Name', 'Email', 'Phone', 'Company', 'Service', 'Status', 'Submitted', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(sub => <SubmissionRow key={sub.id} sub={sub} />)}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Admin Panel ─────────────────────────────────────────────────────────

type AdminTab = 'enquiries' | 'media' | 'blog' | 'case-studies';

const NAV_ITEMS: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
  { id: 'enquiries', label: 'Enquiries', icon: <Mail className="w-4 h-4" /> },
  { id: 'media', label: 'Media Library', icon: <ImageIcon className="w-4 h-4" /> },
  { id: 'blog', label: 'Blog CMS', icon: <FileText className="w-4 h-4" /> },
  { id: 'case-studies', label: 'Case Studies', icon: <BookOpen className="w-4 h-4" /> },
];

export default function RadianceAdminPage() {
  const [authed, setAuthed] = useState(false);
  const [activeTab, setActiveTab] = useState<AdminTab>('enquiries');
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (localStorage.getItem('radiance_admin_auth') === '1') setAuthed(true);
  }, []);

  useEffect(() => {
    if (authed) loadSubmissions();
  }, [authed]); // eslint-disable-line

  async function loadSubmissions() {
    setLoading(true);
    try {
      const res = await fetch(
        `${API_BASE}/api/radiance/contact/submissions?password=${encodeURIComponent(ADMIN_PASSWORD)}&limit=200`
      );
      const data = await res.json();
      if (data.success) setSubmissions(data.submissions);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }

  if (!authed) return <PasswordGate onAuth={() => setAuthed(true)} />;

  return (
    <div className="h-screen bg-slate-900 text-white flex flex-col overflow-hidden">

      {/* Top nav bar */}
      <header className="shrink-0 bg-slate-900/95 backdrop-blur border-b border-slate-700/50 z-10">
        <div className="px-5 h-13 flex items-center justify-between" style={{ height: '52px' }}>
          <div className="flex items-center gap-3">
            <Link href="/vibe-demo/radiance" className="text-slate-400 hover:text-slate-300 flex items-center gap-1 text-sm">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-purple-400" />
              <h1 className="font-bold text-white text-sm">Radiance Admin</h1>
            </div>
          </div>
          <button
            onClick={() => { localStorage.removeItem('radiance_admin_auth'); setAuthed(false); }}
            className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-300 border border-slate-700 rounded-lg hover:bg-slate-800 transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Body: sidebar + content */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left sidebar */}
        <aside className="w-48 shrink-0 border-r border-slate-700/50 bg-slate-900 flex flex-col p-3 gap-0.5 overflow-y-auto">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-left transition-colors ${
                activeTab === item.id
                  ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </aside>

        {/* Right working area */}
        <main className="flex-1 overflow-y-auto p-6">
          {activeTab === 'enquiries' && (
            <EnquiriesTab
              submissions={submissions}
              loading={loading}
              search={search}
              onSearch={setSearch}
              onRefresh={loadSubmissions}
            />
          )}
          {activeTab === 'media' && <MediaLibraryTab />}
          {activeTab === 'blog' && <BlogCmsTab />}
          {activeTab === 'case-studies' && <CaseStudiesCmsTab />}
        </main>
      </div>
    </div>
  );
}
