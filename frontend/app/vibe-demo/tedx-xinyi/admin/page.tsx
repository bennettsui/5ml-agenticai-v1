'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';

const API_BASE = typeof window !== 'undefined'
  ? (process.env.NEXT_PUBLIC_API_URL || '')
  : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080');
const ADMIN_PASSWORD = '5milesLab01@';

type Tab = 'slots' | 'media' | 'social' | 'publish';

interface MediaImage {
  key: string;
  filename: string;
  folder: string;
  localExists: boolean;
  publicUrl?: string;
  alt?: string;
  source?: string;
  description?: string;
  missing?: boolean;
}

interface ImageSlot {
  page: string;
  src: string;
  type: string;
  isExternal: boolean;
  isLocal: boolean;
  metaKey: string | null;
  cdnUrl: string | null;
  localExists: boolean;
  status: 'cdn' | 'local-only' | 'missing' | 'external';
  note?: string;
}

interface SlotSummary {
  total: number;
  missing: number;
  cdnOk: number;
  localOnly: number;
  external: number;
}

interface SocialPost {
  id: string;
  copy: string;
  comment: string;
  imagePrompt: string;
  imageUrl: string | null;
  platform: string;
  createdAt: string;
  updatedAt: string;
}

export default function TEDxXinyiAdmin() {
  const [authed, setAuthed] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('tedx-admin-authed') === '1';
    }
    return false;
  });
  const [pw, setPw] = useState('');
  const [pwError, setPwError] = useState(false);
  const [tab, setTab] = useState<Tab>('slots');

  // Publish state
  const [publishing, setPublishing] = useState(false);
  const [publishMsg, setPublishMsg] = useState('');

  // Media state
  const [media, setMedia] = useState<MediaImage[]>([]);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [mediaLoaded, setMediaLoaded] = useState(false);

  // Social posts state
  const [socialPosts, setSocialPosts] = useState<SocialPost[]>([]);
  const [socialLoading, setSocialLoading] = useState(false);
  const [socialLoaded, setSocialLoaded] = useState(false);
  const [editingCopy, setEditingCopy] = useState<string | null>(null);
  const [editCopyText, setEditCopyText] = useState('');
  const [commentText, setCommentText] = useState<Record<string, string>>({});
  const [generatingCopy, setGeneratingCopy] = useState<string | null>(null);
  const [generatingImagePrompt, setGeneratingImagePrompt] = useState<string | null>(null);
  const [generatingImage, setGeneratingImage] = useState<string | null>(null);
  const [editingImagePrompt, setEditingImagePrompt] = useState<string | null>(null);
  const [editImagePromptText, setEditImagePromptText] = useState('');
  const [promptCommentText, setPromptCommentText] = useState<Record<string, string>>({});
  const [copiedPostId, setCopiedPostId] = useState<string | null>(null);

  // Image Slots state
  const [slots, setSlots] = useState<ImageSlot[]>([]);
  const [slotSummary, setSlotSummary] = useState<SlotSummary | null>(null);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsLoaded, setSlotsLoaded] = useState(false);
  const [slotFilter, setSlotFilter] = useState<string>('all');
  const [slotPageFilter, setSlotPageFilter] = useState<string>('all');

  // Action state
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null);
  const [confirmArchive, setConfirmArchive] = useState<string | null>(null);
  const [confirmRegen, setConfirmRegen] = useState<string | null>(null);
  const [regenInstructions, setRegenInstructions] = useState('');

  // Edit modal state (for any slot or media entry)
  const [editSlot, setEditSlot] = useState<ImageSlot | null>(null);
  const [imagePickerOpen, setImagePickerOpen] = useState(false);
  const [editCdnUrl, setEditCdnUrl] = useState('');
  const [editCdnSaving, setEditCdnSaving] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const downloadRef = useRef<HTMLAnchorElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceTargetRef = useRef<string | null>(null);

  function showToast(msg: string, type: 'ok' | 'err' = 'ok') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  }

  function copyToClipboard(text: string, label: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedKey(label);
      setTimeout(() => setCopiedKey(null), 2000);
      showToast('Copied to clipboard');
    }).catch(() => {
      showToast('Copy failed', 'err');
    });
  }

  async function saveCdnUrl(key: string, url: string) {
    setEditCdnSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/tedx-xinyi/media/metadata`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, publicUrl: url }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      showToast(`Updated CDN URL for ${key}`);
      setEditSlot(null);
      setImagePickerOpen(false);
      if (slotsLoaded) await loadSlots();
      if (mediaLoaded) await loadMedia();
    } catch (err) {
      showToast(`Save failed: ${err instanceof Error ? err.message : 'Unknown'}`, 'err');
    } finally {
      setEditCdnSaving(false);
    }
  }

  async function pushToCdn(key: string) {
    setActionLoading(key);
    try {
      const res = await fetch(`${API_BASE}/api/tedx-xinyi/media/push-to-cdn`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      showToast(`Pushed to CDN: ${data.publicUrl}`);
      setEditSlot(null);
      if (slotsLoaded) await loadSlots();
      if (mediaLoaded) await loadMedia();
    } catch (err) {
      showToast(`Push to CDN failed: ${err instanceof Error ? err.message : 'Unknown'}`, 'err');
    } finally {
      setActionLoading(null);
    }
  }

  function handleLogin() {
    if (pw === ADMIN_PASSWORD) {
      setAuthed(true);
      sessionStorage.setItem('tedx-admin-authed', '1');
      setPwError(false);
    } else {
      setPwError(true);
    }
  }

  async function handlePublish() {
    setPublishing(true);
    setPublishMsg('Building & packaging\u2026 this may take up to 60 seconds.');
    try {
      const res = await fetch(`${API_BASE}/api/tedx-xinyi/publish-html-pack`, { method: 'POST' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = downloadRef.current;
      if (a) {
        a.href = url;
        a.download = `tedx-xinyi-${new Date().toISOString().slice(0, 10)}.zip`;
        a.click();
      }
      setPublishMsg(`Pack downloaded (${(blob.size / 1024).toFixed(0)} KB)`);
    } catch (err: unknown) {
      setPublishMsg(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setPublishing(false);
    }
  }

  // ---- Social media post functions ----
  const loadSocialPosts = useCallback(async () => {
    setSocialLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/tedx-xinyi/social/posts`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setSocialPosts(data.posts || []);
      setSocialLoaded(true);
    } catch (err) {
      showToast(`Failed to load posts: ${err instanceof Error ? err.message : 'Unknown'}`, 'err');
    } finally {
      setSocialLoading(false);
    }
  }, []);

  async function createSocialPost() {
    try {
      const res = await fetch(`${API_BASE}/api/tedx-xinyi/social/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform: 'instagram' }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await loadSocialPosts();
      showToast('New post slot created');
    } catch (err) {
      showToast(`Failed: ${err instanceof Error ? err.message : 'Unknown'}`, 'err');
    }
  }

  async function saveSocialCopy(postId: string, copy: string) {
    try {
      await fetch(`${API_BASE}/api/tedx-xinyi/social/posts/${postId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ copy }),
      });
      setEditingCopy(null);
      await loadSocialPosts();
      showToast('Copy saved');
    } catch (err) {
      showToast(`Save failed: ${err instanceof Error ? err.message : 'Unknown'}`, 'err');
    }
  }

  async function generateCopy(postId: string, existingCopy: string, comment: string) {
    setGeneratingCopy(postId);
    try {
      const res = await fetch(`${API_BASE}/api/tedx-xinyi/social/generate-copy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, existingCopy: existingCopy || undefined, comment: comment || undefined, platform: 'instagram' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setCommentText(prev => ({ ...prev, [postId]: '' }));
      await loadSocialPosts();
      showToast('Copy generated');
    } catch (err) {
      showToast(`Generate failed: ${err instanceof Error ? err.message : 'Unknown'}`, 'err');
    } finally {
      setGeneratingCopy(null);
    }
  }

  async function generateImagePrompt(postId: string, copy: string, comment?: string, existingPrompt?: string) {
    if (!copy) { showToast('Generate copy first before generating an image prompt', 'err'); return; }
    setGeneratingImagePrompt(postId);
    try {
      const res = await fetch(`${API_BASE}/api/tedx-xinyi/social/generate-image-prompt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, copy, comment: comment || undefined, existingPrompt: existingPrompt || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setPromptCommentText(prev => ({ ...prev, [postId]: '' }));
      await loadSocialPosts();
      showToast('Image prompt generated');
    } catch (err) {
      showToast(`Image prompt generation failed: ${err instanceof Error ? err.message : 'Unknown'}`, 'err');
    } finally {
      setGeneratingImagePrompt(null);
    }
  }

  async function saveImagePrompt(postId: string, imagePrompt: string) {
    try {
      await fetch(`${API_BASE}/api/tedx-xinyi/social/posts/${postId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imagePrompt }),
      });
      setEditingImagePrompt(null);
      await loadSocialPosts();
      showToast('Image prompt saved');
    } catch (err) {
      showToast(`Save failed: ${err instanceof Error ? err.message : 'Unknown'}`, 'err');
    }
  }

  async function generateImage(postId: string, copy: string, imagePrompt?: string) {
    if (!copy && !imagePrompt) { showToast('Generate copy or image prompt first', 'err'); return; }
    setGeneratingImage(postId);
    try {
      const res = await fetch(`${API_BASE}/api/tedx-xinyi/social/generate-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, copy, imagePrompt: imagePrompt || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      await loadSocialPosts();
      showToast('Image generated');
    } catch (err) {
      showToast(`Image generation failed: ${err instanceof Error ? err.message : 'Unknown'}`, 'err');
    } finally {
      setGeneratingImage(null);
    }
  }

  async function deleteSocialPost(postId: string) {
    try {
      await fetch(`${API_BASE}/api/tedx-xinyi/social/posts/${postId}`, { method: 'DELETE' });
      await loadSocialPosts();
      showToast('Post removed');
    } catch (err) {
      showToast(`Delete failed: ${err instanceof Error ? err.message : 'Unknown'}`, 'err');
    }
  }

  function copySocialCopy(text: string, postId: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedPostId(postId);
      setTimeout(() => setCopiedPostId(null), 2000);
    });
  }

  const loadMedia = useCallback(async () => {
    setMediaLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/tedx-xinyi/media`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setMedia(data.images || []);
      setMediaLoaded(true);
    } catch (err) {
      setMedia([]);
      showToast(`Load media failed: ${err instanceof Error ? err.message : 'Unknown'}`, 'err');
    } finally {
      setMediaLoading(false);
    }
  }, []);

  const loadSlots = useCallback(async (silent = false) => {
    setSlotsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/tedx-xinyi/image-slots`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setSlots(data.slots || []);
      setSlotSummary(data.summary || null);
      setSlotsLoaded(true);
      if (!silent) {
        const s = data.summary;
        showToast(`Scanned ${s?.total || 0} image slots — ${s?.cdnOk || 0} CDN, ${s?.missing || 0} missing`);
      }
    } catch (err) {
      setSlots([]);
      showToast(`Load slots failed: ${err instanceof Error ? err.message : 'Unknown'}`, 'err');
    } finally {
      setSlotsLoading(false);
    }
  }, []);

  // Auto-load data when switching tabs (silent — no toast)
  useEffect(() => {
    if (authed && tab === 'slots' && !slotsLoaded && !slotsLoading) {
      loadSlots(true);
    }
  }, [authed, tab, slotsLoaded, slotsLoading, loadSlots]);

  useEffect(() => {
    if (authed && tab === 'media' && !mediaLoaded && !mediaLoading) {
      loadMedia();
    }
  }, [authed, tab, mediaLoaded, mediaLoading, loadMedia]);

  useEffect(() => {
    if (authed && tab === 'social' && !socialLoaded && !socialLoading) {
      loadSocialPosts();
    }
  }, [authed, tab, socialLoaded, socialLoading, loadSocialPosts]);

  // Also preload media when opening image picker from slots tab
  useEffect(() => {
    if (imagePickerOpen && !mediaLoaded && !mediaLoading) {
      loadMedia();
    }
  }, [imagePickerOpen, mediaLoaded, mediaLoading, loadMedia]);

  // Upload (replace) handler
  function triggerUpload(key: string) {
    replaceTargetRef.current = key;
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  }

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    const key = replaceTargetRef.current;
    if (!file || !key) return;

    setActionLoading(key);
    try {
      const reader = new FileReader();
      const dataUrl: string = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const res = await fetch(`${API_BASE}/api/tedx-xinyi/media/replace`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, data: dataUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      showToast(`Replaced ${key}. Old version archived as ${data.archiveKey}`);
      setEditSlot(null);
      await loadMedia();
      // Refresh slots to update CDN status
      if (slotsLoaded) await loadSlots();
    } catch (err) {
      showToast(`Upload failed: ${err instanceof Error ? err.message : 'Unknown'}`, 'err');
    } finally {
      setActionLoading(null);
      replaceTargetRef.current = null;
    }
  }

  // Archive (deactivate, keep asset in storage with --archived- prefix)
  async function handleArchive(key: string) {
    setActionLoading(key);
    setConfirmArchive(null);
    try {
      const res = await fetch(`${API_BASE}/api/tedx-xinyi/media/remove`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      showToast(`Archived ${key} as ${data.archiveKey}`);
      await loadMedia();
    } catch (err) {
      showToast(`Archive failed: ${err instanceof Error ? err.message : 'Unknown'}`, 'err');
    } finally {
      setActionLoading(null);
    }
  }

  // Regenerate (AI)
  async function handleRegenerate(key: string, instructions?: string) {
    setActionLoading(key);
    try {
      const res = await fetch(`${API_BASE}/api/tedx-xinyi/media/regenerate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, instructions: instructions || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      showToast(`Regenerated ${key} (${data.dimensions}). Old version archived.`);
      await loadMedia();
    } catch (err) {
      showToast(`Regenerate failed: ${err instanceof Error ? err.message : 'Unknown'}`, 'err');
    } finally {
      setActionLoading(null);
    }
  }

  // Password Gate
  if (!authed) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center px-4">
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 w-full max-w-sm">
          <h1 className="text-white text-xl font-black mb-1">TEDxXinyi Admin</h1>
          <p className="text-neutral-500 text-sm mb-6">Enter password to continue</p>
          <input
            type="password"
            value={pw}
            onChange={e => { setPw(e.target.value); setPwError(false); }}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            placeholder="Password"
            className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm focus:outline-none focus:border-red-500 mb-3"
          />
          {pwError && <p className="text-red-400 text-xs mb-3">Incorrect password</p>}
          <button
            onClick={handleLogin}
            className="w-full py-2.5 bg-red-600 hover:bg-red-500 text-white text-sm font-bold rounded-lg transition-colors"
          >
            Log In
          </button>
        </div>
      </div>
    );
  }

  // Helpers
  const isArchived = (key: string) => key.includes('--archived-') || key.includes('--removed-');

  const statusColor: Record<string, string> = {
    cdn: 'bg-green-900/40 text-green-400',
    'local-only': 'bg-amber-900/40 text-amber-400',
    missing: 'bg-red-900/40 text-red-400',
    external: 'bg-blue-900/40 text-blue-400',
  };

  const typeColor: Record<string, string> = {
    hero: 'bg-purple-900/40 text-purple-300',
    poster: 'bg-indigo-900/40 text-indigo-300',
    visual: 'bg-cyan-900/40 text-cyan-300',
    speaker: 'bg-pink-900/40 text-pink-300',
    external: 'bg-neutral-700/40 text-neutral-400',
    meta: 'bg-neutral-700/40 text-neutral-400',
    other: 'bg-neutral-700/40 text-neutral-400',
  };

  const slotPages = ['all', ...Array.from(new Set(slots.map(s => s.page)))];

  const filteredSlots = slots.filter(s => {
    if (slotFilter !== 'all' && s.status !== slotFilter) return false;
    if (slotPageFilter !== 'all' && s.page !== slotPageFilter) return false;
    return true;
  });

  const tabs: { id: Tab; label: string }[] = [
    { id: 'slots', label: 'Image Slots' },
    { id: 'media', label: 'Media Library' },
    { id: 'social', label: 'Social Media' },
    { id: 'publish', label: 'Publish Site Pack' },
  ];

  // Active (non-archived) media images for image picker
  const pickableMedia = media.filter(m => !isArchived(m.key) && (m.publicUrl || m.localExists));

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      {/* Hidden elements */}
      <a ref={downloadRef} className="hidden" />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileSelected}
      />

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg text-sm font-medium shadow-lg transition-all ${
          toast.type === 'ok' ? 'bg-green-900/90 text-green-200 border border-green-700/50' : 'bg-red-900/90 text-red-200 border border-red-700/50'
        }`}>
          {toast.msg}
        </div>
      )}

      {/* Confirm archive modal */}
      {confirmArchive && (
        <div className="fixed inset-0 z-40 bg-black/60 flex items-center justify-center px-4">
          <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-6 max-w-sm w-full">
            <h3 className="text-white font-bold mb-2">Archive this image?</h3>
            <p className="text-neutral-400 text-sm mb-1">The image will be deactivated but kept in storage for recovery.</p>
            <p className="text-amber-400 text-xs font-mono mb-4 break-all">{confirmArchive}</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setConfirmArchive(null)} className="px-4 py-2 text-sm text-neutral-400 hover:text-white transition-colors">Cancel</button>
              <button onClick={() => handleArchive(confirmArchive)} className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-sm font-bold rounded-lg transition-colors">Archive</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm regenerate modal */}
      {confirmRegen && (
        <div className="fixed inset-0 z-40 bg-black/60 flex items-center justify-center px-4">
          <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-6 max-w-md w-full">
            <h3 className="text-white font-bold mb-2">Regenerate with AI?</h3>
            <p className="text-neutral-400 text-sm mb-1">
              This will use Gemini AI to generate a new image. The current version will be archived.
            </p>
            <p className="text-purple-400 text-xs font-mono mb-4 break-all">{confirmRegen}</p>
            <div className="mb-4">
              <label className="text-xs text-neutral-500 font-bold block mb-1.5">Additional instructions (optional)</label>
              <textarea
                value={regenInstructions}
                onChange={e => setRegenInstructions(e.target.value)}
                placeholder="e.g. more warm tones, add galaxy elements, make it brighter, include subtle red accents..."
                rows={3}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white placeholder-neutral-600 resize-y focus:outline-none focus:border-purple-500"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => { setConfirmRegen(null); setRegenInstructions(''); }} className="px-4 py-2 text-sm text-neutral-400 hover:text-white transition-colors">Cancel</button>
              <button
                onClick={() => { const k = confirmRegen; setConfirmRegen(null); handleRegenerate(k); setRegenInstructions(''); }}
                className="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white text-sm font-bold rounded-lg transition-colors"
              >
                Skip &amp; Generate
              </button>
              <button
                onClick={() => { const k = confirmRegen; const instr = regenInstructions; setConfirmRegen(null); handleRegenerate(k, instr); setRegenInstructions(''); }}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold rounded-lg transition-colors"
              >
                Generate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── EDIT SLOT POPUP ─── */}
      {editSlot && (
        <div className="fixed inset-0 z-40 bg-black/60 flex items-center justify-center px-4" onClick={() => { setEditSlot(null); setImagePickerOpen(false); }}>
          <div className="bg-neutral-900 border border-neutral-700 rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
              <h3 className="text-white font-bold">Image Slot Details</h3>
              <button onClick={() => { setEditSlot(null); setImagePickerOpen(false); }} className="w-8 h-8 flex items-center justify-center text-neutral-500 hover:text-white transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Preview */}
              <div className="flex gap-6">
                <div className="w-40 h-28 rounded-lg bg-neutral-800 overflow-hidden flex items-center justify-center flex-shrink-0">
                  {(() => {
                    const previewUrl = editSlot.cdnUrl || (editSlot.isExternal ? editSlot.src : (editSlot.isLocal ? `${API_BASE}${editSlot.src}` : null));
                    return previewUrl ? (
                      <img src={previewUrl} alt="" className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    ) : (
                      <span className="text-neutral-600 text-xs">No preview</span>
                    );
                  })()}
                </div>
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex gap-2">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${statusColor[editSlot.status] || 'bg-neutral-800 text-neutral-500'}`}>{editSlot.status}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${typeColor[editSlot.type] || typeColor.other}`}>{editSlot.type}</span>
                  </div>
                  <p className="text-xs text-neutral-500">Page: <span className="text-neutral-300 font-mono">{editSlot.page}</span></p>
                  {editSlot.note && <p className="text-[11px] text-neutral-600">{editSlot.note}</p>}
                </div>
              </div>

              {/* Full Image URL */}
              <div>
                <label className="text-[11px] text-neutral-500 font-bold uppercase tracking-wider block mb-1">Image URL / Path</label>
                <div className="bg-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-300 font-mono break-all select-all">{editSlot.src}</div>
              </div>

              {/* Editable CDN URL — always shown */}
              {(() => {
                // Derive a usable key for all entries
                const effectiveKey = editSlot.metaKey || (editSlot.isLocal ? editSlot.src.replace('/tedx-xinyi/', '') : null);
                return (
                  <div>
                    <label className="text-[11px] text-neutral-500 font-bold uppercase tracking-wider block mb-1">CDN URL <span className="text-neutral-600 normal-case">(editable)</span></label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={editCdnUrl}
                        onChange={e => setEditCdnUrl(e.target.value)}
                        placeholder="Paste CDN URL here (e.g. http://5ml.mmdbfiles.com/assets/...)"
                        className="flex-1 bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-blue-400 font-mono focus:outline-none focus:border-blue-500"
                      />
                      {effectiveKey && (
                        <button
                          onClick={() => saveCdnUrl(effectiveKey, editCdnUrl)}
                          disabled={editCdnSaving || !editCdnUrl.trim()}
                          className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-40 flex-shrink-0"
                        >
                          {editCdnSaving ? 'Saving\u2026' : 'Save URL'}
                        </button>
                      )}
                      {editCdnUrl && (
                        <button
                          onClick={() => copyToClipboard(editCdnUrl, 'cdn-edit')}
                          className="px-3 py-2 bg-neutral-700 hover:bg-neutral-600 text-neutral-300 text-xs font-bold rounded-lg transition-colors flex-shrink-0"
                        >
                          {copiedKey === 'cdn-edit' ? 'Copied' : 'Copy'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Meta Key */}
              {(editSlot.metaKey || editSlot.isLocal) && (
                <div>
                  <label className="text-[11px] text-neutral-500 font-bold uppercase tracking-wider block mb-1">Metadata Key</label>
                  <div className="bg-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-300 font-mono break-all">{editSlot.metaKey || editSlot.src.replace('/tedx-xinyi/', '')}</div>
                </div>
              )}

              {/* Actions — always shown */}
              {(() => {
                const effectiveKey = editSlot.metaKey || (editSlot.isLocal ? editSlot.src.replace('/tedx-xinyi/', '') : null);
                const isLoading = actionLoading === effectiveKey;
                return (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {/* Push to CDN — for local-only images */}
                    {effectiveKey && editSlot.localExists && editSlot.status !== 'cdn' && (
                      <button
                        onClick={() => pushToCdn(effectiveKey)}
                        disabled={isLoading}
                        className="px-4 py-2 text-xs font-bold bg-green-600/20 hover:bg-green-600/30 text-green-300 rounded-lg transition-colors disabled:opacity-40"
                      >
                        {isLoading ? 'Uploading\u2026' : 'Push to CDN'}
                      </button>
                    )}
                    {effectiveKey && (
                      <button
                        onClick={() => triggerUpload(effectiveKey)}
                        disabled={isLoading}
                        className="px-4 py-2 text-xs font-bold bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 rounded-lg transition-colors disabled:opacity-40"
                      >
                        {isLoading ? 'Uploading\u2026' : 'Upload Replacement'}
                      </button>
                    )}
                    {effectiveKey && (
                      <button
                        onClick={() => setImagePickerOpen(!imagePickerOpen)}
                        className="px-4 py-2 text-xs font-bold bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 rounded-lg transition-colors"
                      >
                        {imagePickerOpen ? 'Close Picker' : 'Pick from Library'}
                      </button>
                    )}
                    {effectiveKey && (
                      <button
                        onClick={() => { setConfirmRegen(effectiveKey); }}
                        className="px-4 py-2 text-xs font-bold bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 rounded-lg transition-colors"
                      >
                        AI Regenerate
                      </button>
                    )}
                  </div>
                );
              })()}

              {/* Image Picker Grid */}
              {imagePickerOpen && (
                <div className="border-t border-neutral-800 pt-4">
                  <p className="text-xs text-neutral-500 font-bold mb-3">Select an image from the Media Library to use for this slot:</p>
                  {!mediaLoaded ? (
                    <p className="text-xs text-neutral-600">Loading media\u2026</p>
                  ) : pickableMedia.length === 0 ? (
                    <p className="text-xs text-neutral-600">No media available.</p>
                  ) : (
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-60 overflow-y-auto">
                      {pickableMedia.map(img => (
                        <button
                          key={img.key}
                          onClick={async () => {
                            if (!editSlot.metaKey || !img.publicUrl) return;
                            setActionLoading(editSlot.metaKey);
                            try {
                              const res = await fetch(`${API_BASE}/api/tedx-xinyi/media/metadata`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ key: editSlot.metaKey, cdnUrl: img.publicUrl }),
                              });
                              if (!res.ok) throw new Error(`HTTP ${res.status}`);
                              showToast(`Mapped ${editSlot.metaKey} to ${img.key}`);
                              setImagePickerOpen(false);
                              setEditSlot(null);
                              await loadSlots();
                            } catch (err) {
                              showToast(`Map failed: ${err instanceof Error ? err.message : 'Unknown'}`, 'err');
                            } finally {
                              setActionLoading(null);
                            }
                          }}
                          className="aspect-square rounded-lg bg-neutral-800 overflow-hidden hover:ring-2 hover:ring-blue-500 transition-all relative group"
                          title={img.key}
                        >
                          <img
                            src={img.publicUrl || `${API_BASE}/tedx-xinyi/${img.key}`}
                            alt={img.alt || img.key}
                            className="w-full h-full object-cover"
                            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                            <span className="text-white text-[9px] font-bold opacity-0 group-hover:opacity-100 transition-opacity">Select</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="border-b border-neutral-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/vibe-demo/tedx-xinyi" className="text-neutral-500 hover:text-white text-sm transition-colors">
            &larr; Back to site
          </Link>
          <h1 className="text-lg font-black">TEDxXinyi Admin</h1>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-neutral-800 px-6 flex gap-1">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-3 text-sm font-bold transition-colors border-b-2 -mb-px ${
              tab === t.id
                ? 'text-red-400 border-red-500'
                : 'text-neutral-500 border-transparent hover:text-neutral-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content — full width */}
      <div className="px-6 py-8">

        {/* IMAGE SLOTS TAB */}
        {tab === 'slots' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-black">Image Slots</h2>
                <p className="text-neutral-500 text-sm mt-1">Every image URL referenced across all website pages. Click any row to view full details and edit.</p>
              </div>
              <button
                onClick={() => loadSlots()}
                disabled={slotsLoading}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-bold rounded-lg transition-colors"
              >
                {slotsLoading ? 'Scanning\u2026' : slotsLoaded ? 'Re-scan' : 'Scan Pages'}
              </button>
            </div>

            {!slotsLoaded && !slotsLoading && (
              <p className="text-neutral-500 text-sm">Click &quot;Scan Pages&quot; to analyze all image references in the website source code.</p>
            )}

            {/* Summary cards */}
            {slotSummary && (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
                {[
                  { label: 'Total', value: slotSummary.total, color: 'text-white' },
                  { label: 'CDN OK', value: slotSummary.cdnOk, color: 'text-green-400' },
                  { label: 'Local Only', value: slotSummary.localOnly, color: 'text-amber-400' },
                  { label: 'Missing', value: slotSummary.missing, color: 'text-red-400' },
                  { label: 'External', value: slotSummary.external, color: 'text-blue-400' },
                ].map(s => (
                  <div key={s.label} className="bg-neutral-900 border border-neutral-800 rounded-lg p-3 text-center">
                    <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
                    <p className="text-[11px] text-neutral-500 font-bold">{s.label}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Filters */}
            {slotsLoaded && slots.length > 0 && (
              <div className="flex flex-wrap gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-neutral-500">Status:</span>
                  <select value={slotFilter} onChange={e => setSlotFilter(e.target.value)} className="bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-red-500">
                    <option value="all">All</option>
                    <option value="cdn">CDN OK</option>
                    <option value="local-only">Local Only</option>
                    <option value="missing">Missing</option>
                    <option value="external">External</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-neutral-500">Page:</span>
                  <select value={slotPageFilter} onChange={e => setSlotPageFilter(e.target.value)} className="bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-red-500">
                    {slotPages.map(p => (
                      <option key={p} value={p}>{p === 'all' ? 'All pages' : p}</option>
                    ))}
                  </select>
                </div>
                <span className="text-xs text-neutral-600 self-center">{filteredSlots.length} of {slots.length} shown</span>
              </div>
            )}

            {/* Slots table */}
            {filteredSlots.length > 0 && (
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-neutral-800 text-neutral-500 text-xs">
                        <th className="text-left px-4 py-3 font-bold">Preview</th>
                        <th className="text-left px-4 py-3 font-bold">Page</th>
                        <th className="text-left px-4 py-3 font-bold">Type</th>
                        <th className="text-left px-4 py-3 font-bold">Image URL / Path</th>
                        <th className="text-left px-4 py-3 font-bold">Status</th>
                        <th className="text-left px-4 py-3 font-bold">CDN URL</th>
                        <th className="text-left px-4 py-3 font-bold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSlots.map((slot, i) => {
                        const previewUrl = slot.cdnUrl || (slot.isExternal ? slot.src : (slot.isLocal ? `${API_BASE}${slot.src}` : null));
                        return (
                          <tr
                            key={`${slot.page}-${slot.src}-${i}`}
                            className="border-b border-neutral-800/50 hover:bg-white/[0.04] cursor-pointer transition-colors"
                            onClick={() => { setEditSlot(slot); setEditCdnUrl(slot.cdnUrl || ''); setImagePickerOpen(false); }}
                          >
                            <td className="px-4 py-2">
                              <div className="w-16 h-10 rounded bg-neutral-800 overflow-hidden flex items-center justify-center flex-shrink-0">
                                {previewUrl ? (
                                  <img src={previewUrl} alt="" className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                ) : (
                                  <span className="text-neutral-700 text-[9px]">N/A</span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-2">
                              <span className="text-xs text-neutral-300 font-mono">{slot.page}</span>
                            </td>
                            <td className="px-4 py-2">
                              <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${typeColor[slot.type] || typeColor.other}`}>{slot.type}</span>
                            </td>
                            <td className="px-4 py-2">
                              <p className="text-xs text-neutral-400 font-mono break-all" title={slot.src}>{slot.src}</p>
                              {slot.note && <p className="text-[10px] text-neutral-600">{slot.note}</p>}
                            </td>
                            <td className="px-4 py-2">
                              <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${statusColor[slot.status] || 'bg-neutral-800 text-neutral-500'}`}>{slot.status}</span>
                            </td>
                            <td className="px-4 py-2">
                              {slot.cdnUrl ? (
                                <span className="text-[10px] text-blue-400 font-mono break-all" title={slot.cdnUrl}>
                                  {slot.cdnUrl.length > 60 ? slot.cdnUrl.slice(0, 60) + '\u2026' : slot.cdnUrl}
                                </span>
                              ) : slot.isExternal ? (
                                <span className="text-[10px] text-neutral-600">external src</span>
                              ) : (
                                <span className="text-[10px] text-neutral-700">none</span>
                              )}
                            </td>
                            {/* Actions */}
                            <td className="px-4 py-2">
                              {(() => {
                                const effectiveKey = slot.metaKey || (slot.isLocal ? slot.src.replace('/tedx-xinyi/', '') : null);
                                if (!effectiveKey) return null;
                                const loading = actionLoading === effectiveKey;
                                return (
                                  <div className="flex gap-1">
                                    {slot.localExists && slot.status !== 'cdn' && (
                                      <button
                                        onClick={(e) => { e.stopPropagation(); pushToCdn(effectiveKey); }}
                                        disabled={loading}
                                        className="px-2 py-1 text-[10px] font-bold bg-green-600/20 hover:bg-green-600/30 text-green-300 rounded transition-colors disabled:opacity-40 whitespace-nowrap"
                                      >
                                        {loading ? '\u2026' : 'Push to CDN'}
                                      </button>
                                    )}
                                    {slot.status === 'cdn' && (
                                      <span className="text-[10px] text-green-500">on CDN</span>
                                    )}
                                  </div>
                                );
                              })()}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* MEDIA TAB */}
        {tab === 'media' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black">Media Library</h2>
              <button
                onClick={loadMedia}
                disabled={mediaLoading}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-sm font-bold rounded-lg transition-colors"
              >
                {mediaLoading ? 'Loading\u2026' : mediaLoaded ? 'Refresh' : 'Load Media'}
              </button>
            </div>

            {!mediaLoaded && !mediaLoading && (
              <p className="text-neutral-500 text-sm">Click &quot;Load Media&quot; to view images.</p>
            )}

            {mediaLoaded && media.length === 0 && (
              <p className="text-neutral-500 text-sm">No media found.</p>
            )}

            {media.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {media.map(img => {
                  const archived = isArchived(img.key);
                  const loading = actionLoading === img.key;
                  return (
                    <div
                      key={img.key}
                      className={`bg-neutral-900 border rounded-lg overflow-hidden ${
                        archived ? 'border-neutral-800/50 opacity-60' : 'border-neutral-800'
                      }`}
                    >
                      <div className="aspect-video bg-neutral-800 flex items-center justify-center relative group">
                        {(img.publicUrl || img.localExists) ? (
                          <img
                            src={img.publicUrl || `${API_BASE}/tedx-xinyi/${img.key}`}
                            alt={img.alt || img.key}
                            className="w-full h-full object-cover"
                            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                        ) : (
                          <span className="text-neutral-600 text-xs">Missing</span>
                        )}
                        {loading && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          </div>
                        )}
                        {archived && (
                          <div className="absolute top-2 left-2">
                            <span className="text-[10px] px-1.5 py-0.5 bg-amber-900/60 text-amber-300 rounded font-bold">ARCHIVED</span>
                          </div>
                        )}
                        {!loading && !archived && (
                          <button
                            onClick={() => setConfirmArchive(img.key)}
                            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/70 hover:bg-amber-600 text-white/70 hover:text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                            title="Archive image"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 8v13H3V8M1 3h22v5H1zM10 12h4" /></svg>
                          </button>
                        )}
                      </div>

                      <div className="p-3">
                        <p className="text-xs text-neutral-400 truncate font-mono" title={img.key}>{img.key}</p>
                        {img.description && (
                          <p className="text-[11px] text-neutral-500 truncate mt-0.5">{img.description}</p>
                        )}

                        <div className="flex flex-wrap gap-1 mt-2">
                          {img.source && <span className="text-[10px] px-1.5 py-0.5 bg-neutral-800 text-neutral-400 rounded">{img.source}</span>}
                          {img.localExists && <span className="text-[10px] px-1.5 py-0.5 bg-green-900/40 text-green-400 rounded">local</span>}
                          {img.publicUrl && <span className="text-[10px] px-1.5 py-0.5 bg-blue-900/40 text-blue-400 rounded">CDN</span>}
                          {img.missing && <span className="text-[10px] px-1.5 py-0.5 bg-red-900/40 text-red-400 rounded">missing</span>}
                        </div>

                        {/* CDN URL — visible with copy button */}
                        {img.publicUrl && (
                          <div className="mt-2 flex items-start gap-1.5">
                            <a href={img.publicUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-400 hover:text-blue-300 font-mono break-all flex-1 min-w-0">{img.publicUrl}</a>
                            <button
                              onClick={(e) => { e.stopPropagation(); copyToClipboard(img.publicUrl!, img.key); }}
                              className="px-1.5 py-0.5 text-[9px] font-bold bg-neutral-700 hover:bg-neutral-600 text-neutral-300 rounded transition-colors flex-shrink-0"
                              title="Copy CDN URL"
                            >
                              {copiedKey === img.key ? 'Copied' : 'Copy'}
                            </button>
                          </div>
                        )}

                        <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-neutral-800/50">
                          {/* Push to CDN — for local-only images */}
                          {!archived && img.localExists && !img.publicUrl && (
                            <button onClick={() => pushToCdn(img.key)} disabled={loading} className="w-full px-2 py-1.5 text-[11px] font-bold bg-green-600/20 hover:bg-green-600/30 text-green-300 rounded transition-colors disabled:opacity-40 mb-1" title="Upload local file to mmdbfiles CDN">
                              {loading ? 'Uploading\u2026' : 'Push to CDN'}
                            </button>
                          )}
                          {!archived && (
                            <button onClick={() => setConfirmRegen(img.key)} disabled={loading} className="flex-1 px-2 py-1.5 text-[11px] font-bold bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 rounded transition-colors disabled:opacity-40" title="Regenerate with AI">
                              {loading ? 'Generating\u2026' : 'Regenerate'}
                            </button>
                          )}
                          {!archived && (
                            <button onClick={() => triggerUpload(img.key)} disabled={loading} className="flex-1 px-2 py-1.5 text-[11px] font-bold bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 rounded transition-colors disabled:opacity-40" title="Upload new version">
                              Upload New
                            </button>
                          )}
                          {!archived && (
                            <button onClick={() => setConfirmArchive(img.key)} disabled={loading} className="px-2 py-1.5 text-[11px] font-bold bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 rounded transition-colors disabled:opacity-40" title="Archive image">
                              Archive
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* SOCIAL MEDIA TAB */}
        {tab === 'social' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-black">Social Media Posts</h2>
                <p className="text-neutral-500 text-sm mt-1">Create, generate, and manage social media content for TEDxXinyi promotion.</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={loadSocialPosts}
                  disabled={socialLoading}
                  className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-sm font-bold rounded-lg transition-colors"
                >
                  {socialLoading ? 'Loading\u2026' : socialLoaded ? 'Refresh' : 'Load Posts'}
                </button>
                <button
                  onClick={createSocialPost}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-sm font-bold text-white rounded-lg transition-colors"
                >
                  + New Post
                </button>
              </div>
            </div>

            {!socialLoaded && !socialLoading && (
              <p className="text-neutral-500 text-sm">Click &quot;Load Posts&quot; to see existing social media drafts, or &quot;+ New Post&quot; to start creating.</p>
            )}

            {socialLoaded && socialPosts.length === 0 && (
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-8 text-center">
                <p className="text-neutral-500 text-sm mb-3">No posts yet. Create your first social media post.</p>
                <button onClick={createSocialPost} className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-bold rounded-lg transition-colors">
                  + New Post
                </button>
              </div>
            )}

            {/* Post cards */}
            <div className="space-y-4">
              {socialPosts.map(post => {
                const isCopyGen = generatingCopy === post.id;
                const isPromptGen = generatingImagePrompt === post.id;
                const isImgGen = generatingImage === post.id;
                const isEditing = editingCopy === post.id;
                const isEditingPrompt = editingImagePrompt === post.id;
                const postComment = commentText[post.id] || '';
                const promptComment = promptCommentText[post.id] || '';

                return (
                  <div key={post.id} className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800/50">
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] px-2 py-0.5 bg-pink-600/20 text-pink-300 rounded font-bold uppercase">{post.platform}</span>
                        <span className="text-xs text-neutral-500">{new Date(post.createdAt).toLocaleDateString()}</span>
                      </div>
                      <button onClick={() => deleteSocialPost(post.id)} className="text-neutral-600 hover:text-red-400 transition-colors" title="Remove post">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
                      </button>
                    </div>

                    <div className="flex flex-col lg:flex-row">
                      {/* Column 1: Copy */}
                      <div className="flex-1 p-4 border-b lg:border-b-0 lg:border-r border-neutral-800/50 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">1. Copy</h4>
                          <div className="flex gap-1">
                            {post.copy && (
                              <button
                                onClick={() => copySocialCopy(post.copy, post.id)}
                                className="px-2 py-1 text-[10px] font-bold bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded transition-colors"
                              >
                                {copiedPostId === post.id ? 'Copied!' : 'Copy'}
                              </button>
                            )}
                            {post.copy && !isEditing && (
                              <button
                                onClick={() => { setEditingCopy(post.id); setEditCopyText(post.copy); }}
                                className="px-2 py-1 text-[10px] font-bold bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded transition-colors"
                              >
                                Edit
                              </button>
                            )}
                          </div>
                        </div>

                        {isEditing ? (
                          <div>
                            <textarea
                              value={editCopyText}
                              onChange={e => setEditCopyText(e.target.value)}
                              rows={8}
                              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white resize-y focus:outline-none focus:border-red-500"
                            />
                            <div className="flex gap-2 mt-2">
                              <button onClick={() => saveSocialCopy(post.id, editCopyText)} className="px-3 py-1.5 text-xs font-bold bg-green-600/20 hover:bg-green-600/30 text-green-300 rounded transition-colors">Save</button>
                              <button onClick={() => setEditingCopy(null)} className="px-3 py-1.5 text-xs font-bold bg-neutral-800 hover:bg-neutral-700 text-neutral-400 rounded transition-colors">Cancel</button>
                            </div>
                          </div>
                        ) : post.copy ? (
                          <div className="text-sm text-neutral-300 whitespace-pre-wrap leading-relaxed bg-white/[0.02] rounded-lg p-3 max-h-64 overflow-y-auto">
                            {post.copy}
                          </div>
                        ) : (
                          <p className="text-neutral-600 text-sm italic">No copy yet. Click &quot;Generate Copy&quot; below.</p>
                        )}

                        <div className="mt-3 space-y-2">
                          {post.copy && (
                            <input
                              type="text"
                              value={postComment}
                              onChange={e => setCommentText(prev => ({ ...prev, [post.id]: e.target.value }))}
                              placeholder="Feedback for revision (e.g. more casual, add ticket link...)"
                              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-amber-500"
                            />
                          )}
                          <button
                            onClick={() => generateCopy(post.id, post.copy, postComment)}
                            disabled={isCopyGen}
                            className="px-3 py-1.5 text-xs font-bold bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 rounded transition-colors disabled:opacity-40"
                          >
                            {isCopyGen ? 'Generating...' : post.copy && postComment ? 'Revise Copy' : post.copy ? 'Regenerate Copy' : 'Generate Copy'}
                          </button>
                        </div>
                      </div>

                      {/* Column 2: Image Prompt */}
                      <div className="flex-1 p-4 border-b lg:border-b-0 lg:border-r border-neutral-800/50 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">2. Image Prompt</h4>
                          <div className="flex gap-1">
                            {post.imagePrompt && !isEditingPrompt && (
                              <button
                                onClick={() => { setEditingImagePrompt(post.id); setEditImagePromptText(post.imagePrompt); }}
                                className="px-2 py-1 text-[10px] font-bold bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded transition-colors"
                              >
                                Edit
                              </button>
                            )}
                          </div>
                        </div>

                        {isEditingPrompt ? (
                          <div>
                            <textarea
                              value={editImagePromptText}
                              onChange={e => setEditImagePromptText(e.target.value)}
                              rows={8}
                              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white resize-y focus:outline-none focus:border-purple-500"
                            />
                            <div className="flex gap-2 mt-2">
                              <button onClick={() => saveImagePrompt(post.id, editImagePromptText)} className="px-3 py-1.5 text-xs font-bold bg-green-600/20 hover:bg-green-600/30 text-green-300 rounded transition-colors">Save</button>
                              <button onClick={() => setEditingImagePrompt(null)} className="px-3 py-1.5 text-xs font-bold bg-neutral-800 hover:bg-neutral-700 text-neutral-400 rounded transition-colors">Cancel</button>
                            </div>
                          </div>
                        ) : post.imagePrompt ? (
                          <div className="text-sm text-neutral-300 whitespace-pre-wrap leading-relaxed bg-white/[0.02] rounded-lg p-3 max-h-64 overflow-y-auto">
                            {post.imagePrompt}
                          </div>
                        ) : (
                          <p className="text-neutral-600 text-sm italic">No image prompt yet. Generate from copy.</p>
                        )}

                        <div className="mt-3 space-y-2">
                          {post.imagePrompt && (
                            <input
                              type="text"
                              value={promptComment}
                              onChange={e => setPromptCommentText(prev => ({ ...prev, [post.id]: e.target.value }))}
                              placeholder="Feedback for revision (e.g. warmer tones, more cosmic...)"
                              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-purple-500"
                            />
                          )}
                          <button
                            onClick={() => generateImagePrompt(post.id, post.copy, promptComment, post.imagePrompt)}
                            disabled={isPromptGen || !post.copy}
                            className="px-3 py-1.5 text-xs font-bold bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 rounded transition-colors disabled:opacity-40"
                            title={!post.copy ? 'Generate copy first' : 'Generate image prompt from copy'}
                          >
                            {isPromptGen ? 'Generating...' : post.imagePrompt && promptComment ? 'Revise Prompt' : post.imagePrompt ? 'Regenerate Prompt' : 'Generate Image Prompt'}
                          </button>
                        </div>
                      </div>

                      {/* Column 3: Generated Image */}
                      <div className="w-full lg:w-72 p-4 flex-shrink-0">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">3. IG Image</h4>
                        </div>

                        {post.imageUrl ? (
                          <div className="relative group">
                            <div className="aspect-square rounded-lg overflow-hidden bg-neutral-800">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={post.imageUrl} alt="Social post" className="w-full h-full object-cover" />
                            </div>
                            <a
                              href={post.imageUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] text-blue-400 hover:text-blue-300 font-mono break-all mt-1 block"
                            >
                              {post.imageUrl.length > 50 ? post.imageUrl.slice(0, 50) + '\u2026' : post.imageUrl}
                            </a>
                          </div>
                        ) : (
                          <div className="aspect-square rounded-lg bg-neutral-800/50 border border-dashed border-neutral-700 flex items-center justify-center">
                            <span className="text-neutral-600 text-xs">No image yet</span>
                          </div>
                        )}

                        <button
                          onClick={() => generateImage(post.id, post.copy, post.imagePrompt)}
                          disabled={isImgGen || (!post.copy && !post.imagePrompt)}
                          className="w-full mt-2 px-3 py-1.5 text-xs font-bold bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 rounded transition-colors disabled:opacity-40"
                          title={!post.copy && !post.imagePrompt ? 'Generate copy or image prompt first' : post.imagePrompt ? 'Generate image using custom prompt' : 'Generate image from copy'}
                        >
                          {isImgGen ? 'Generating image...' : post.imageUrl ? 'Regenerate Image' : 'Generate Image'}
                        </button>
                        {post.imagePrompt && (
                          <p className="text-[10px] text-neutral-600 mt-1 text-center">Using custom prompt</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* PUBLISH TAB */}
        {tab === 'publish' && (
          <div className="max-w-4xl">
            <h2 className="text-2xl font-black mb-2">Publish Site Pack</h2>
            <p className="text-neutral-400 text-sm mb-8 leading-relaxed">
              Generate a complete static package of the TEDxXinyi website.<br />
              Includes HTML + PHP router + .htaccess — works on any Apache/PHP host. No Python or Node needed.
            </p>

            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 mb-6">
              <h3 className="text-sm font-bold text-neutral-300 mb-4">Package Contents</h3>
              <ul className="text-sm text-neutral-400 space-y-1.5 mb-6">
                <li>&#x2022; <span className="text-neutral-300 font-bold">index.html</span> + 6 sub-pages (about, blog, community, salon, speakers, sustainability)</li>
                <li>&#x2022; <span className="text-neutral-300 font-bold">index.php</span> — PHP router for clean URLs (/salon, /about, etc.)</li>
                <li>&#x2022; <span className="text-neutral-300 font-bold">.htaccess</span> — Apache rewrite rules</li>
                <li>&#x2022; _next/ static assets (JS &amp; CSS chunks)</li>
                <li>&#x2022; tedx-xinyi/ images folder</li>
                <li>&#x2022; manifest.json with build info &amp; deployment instructions</li>
              </ul>

              <button
                onClick={handlePublish}
                disabled={publishing}
                className="px-6 py-3 bg-red-600 hover:bg-red-500 disabled:bg-neutral-700 disabled:text-neutral-500 text-white text-sm font-bold rounded-lg transition-colors"
              >
                {publishing ? 'Building & Packaging\u2026' : 'Build & Download Pack'}
              </button>

              {publishMsg && (
                <p className={`mt-4 text-sm ${publishMsg.startsWith('Error') ? 'text-red-400' : 'text-green-400'}`}>
                  {publishMsg}
                </p>
              )}
            </div>

            <div className="bg-neutral-900/50 border border-neutral-800/50 rounded-xl p-6">
              <h3 className="text-sm font-bold text-neutral-400 mb-3">Deployment Options</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-neutral-300 font-bold mb-1">Apache / PHP hosting (recommended)</p>
                  <p className="text-xs text-neutral-500">Upload the entire unzipped folder to your web root. The .htaccess + index.php handle clean URL routing automatically.</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-300 font-bold mb-1">PHP built-in server (local preview)</p>
                  <p className="text-xs text-neutral-500 font-mono bg-neutral-800/50 px-2 py-1 rounded inline-block">php -S localhost:8000 index.php</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-300 font-bold mb-1">Static hosting (Netlify, Vercel, S3)</p>
                  <p className="text-xs text-neutral-500">Serve the HTML files directly. Clean URLs won&apos;t work without a server-side router — use the .html extension in links.</p>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-neutral-800/50">
                <p className="text-[11px] text-neutral-600">Images with CDN URLs load from mmdbfiles CDN even if local files are missing.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
