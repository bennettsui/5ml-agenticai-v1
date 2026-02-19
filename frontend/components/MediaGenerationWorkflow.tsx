'use client';

import { useState } from 'react';
import {
  Image, Film, Sparkles, FileText, CheckCircle2, Clock,
  ChevronRight, Plus, Trash2, Loader2, Copy, CheckCheck,
  Wand2, Play, Eye, Upload, AlertCircle, RefreshCw, Pencil, X, Save,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface MediaProject {
  id: number;
  name: string;
  client: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface PromptRecord {
  id: number;
  project_id: number;
  deliverable_type: 'image' | 'video';
  format: string;
  status: 'draft' | 'approved' | 'archived';
  version: string;
  prompt_json: {
    image?: { positive: string; negative: string; suggestedSampler?: string; suggestedCfg?: number; suggestedSteps?: number };
    video?: { positive: string; negative: string; motionKeywords?: string[]; recommendedFrames?: number; recommendedFps?: number };
  };
  image_workflow_json: Record<string, unknown> | null;
  video_workflow_json: Record<string, unknown> | null;
  qc_json: { passed: boolean; summary: string; checks: { type: string; message: string }[] } | null;
  created_at: string;
}

interface ProjectState {
  project: MediaProject & { brief_text?: string; brief_spec_json?: Record<string, unknown> };
  prompts: PromptRecord[];
  assets: Array<{
    id: number; type: string; url: string; status: string;
    qc_json?: { approved: boolean; overallScore?: number; revisionNotes?: string };
  }>;
}

// ─── Status badge ─────────────────────────────────────────────────────────────

const STATUS_STYLE: Record<string, string> = {
  brief_pending:       'bg-slate-500/20 text-slate-400 border-slate-500/30',
  translating_brief:   'bg-blue-500/20 text-blue-400 border-blue-500/30',
  building_style_guide:'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
  prompt_design:       'bg-purple-500/20 text-purple-400 border-purple-500/30',
  generating_prompts:  'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  prompts_ready:       'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  in_review:           'bg-orange-500/20 text-orange-400 border-orange-500/30',
  approved:            'bg-green-500/20 text-green-400 border-green-500/30',
  draft:               'bg-slate-500/20 text-slate-400 border-slate-500/30',
  archived:            'bg-slate-600/20 text-slate-500 border-slate-600/30',
  pending_review:      'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  needs_revision:      'bg-red-500/20 text-red-400 border-red-500/30',
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${STATUS_STYLE[status] || STATUS_STYLE.draft}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}

// ─── Copy button ──────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy} className="p-1 text-slate-500 hover:text-slate-300 transition-colors">
      {copied ? <CheckCheck className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

// ─── Prompt card ──────────────────────────────────────────────────────────────

function PromptCard({ prompt, onApprove, onEdit }: {
  prompt: PromptRecord;
  onApprove: (id: number) => void;
  onEdit: (id: number, newPromptJson: PromptRecord['prompt_json']) => Promise<void>;
  projectId: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const img = prompt.prompt_json?.image;
  const vid = prompt.prompt_json?.video;

  // Editable state
  const [editPos, setEditPos] = useState(img?.positive || '');
  const [editNeg, setEditNeg] = useState(img?.negative || '');
  const [editVidPos, setEditVidPos] = useState(vid?.positive || '');

  const handleSave = async () => {
    setSaving(true);
    const newJson: PromptRecord['prompt_json'] = {};
    if (img) {
      newJson.image = { ...img, positive: editPos, negative: editNeg };
    }
    if (vid) {
      newJson.video = { ...vid, positive: editVidPos };
    }
    await onEdit(prompt.id, newJson);
    setSaving(false);
    setEditMode(false);
  };

  const enterEdit = () => {
    setEditPos(img?.positive || '');
    setEditNeg(img?.negative || '');
    setEditVidPos(vid?.positive || '');
    setEditMode(true);
    setExpanded(true);
  };

  return (
    <div className="rounded-xl border border-slate-700/50 bg-slate-800/60 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-700/40">
        {prompt.deliverable_type === 'video'
          ? <Film className="w-4 h-4 text-rose-400 shrink-0" />
          : <Image className="w-4 h-4 text-blue-400 shrink-0" />
        }
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-white">{prompt.format}</span>
            <span className="text-[10px] text-slate-500">{prompt.version}</span>
            <StatusBadge status={prompt.status} />
          </div>
          {prompt.qc_json && (
            <p className={`text-[11px] mt-0.5 ${prompt.qc_json.passed ? 'text-emerald-400' : 'text-red-400'}`}>
              {prompt.qc_json.summary}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {prompt.status === 'draft' && !editMode && (
            <button
              onClick={() => onApprove(prompt.id)}
              className="text-[10px] px-2.5 py-1 rounded-lg bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/30 transition-colors"
            >
              Approve
            </button>
          )}
          {!editMode ? (
            <button
              onClick={enterEdit}
              className="p-1.5 text-slate-500 hover:text-amber-400 transition-colors"
              title="Edit prompt"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          ) : (
            <>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-lg bg-rose-600/20 text-rose-400 border border-rose-500/30 hover:bg-rose-600/30 transition-colors disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Save
              </button>
              <button
                onClick={() => setEditMode(false)}
                className="p-1.5 text-slate-500 hover:text-white transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </>
          )}
          <button
            onClick={() => setExpanded(v => !v)}
            className="p-1.5 text-slate-500 hover:text-white transition-colors"
          >
            <ChevronRight className={`w-4 h-4 transition-transform ${expanded ? 'rotate-90' : ''}`} />
          </button>
        </div>
      </div>

      {/* Expanded body */}
      {expanded && (
        <div className="p-4 space-y-4">
          {/* Edit mode */}
          {editMode ? (
            <div className="space-y-3">
              {img !== undefined && (
                <>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-green-400 uppercase tracking-wider">✓ Positive Prompt</label>
                    <textarea
                      value={editPos}
                      onChange={e => setEditPos(e.target.value)}
                      rows={4}
                      className="w-full bg-white/[0.03] border border-green-500/30 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-green-500/60 resize-y leading-relaxed"
                      placeholder="Describe the image you want to generate..."
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-red-400 uppercase tracking-wider">✗ Negative Prompt</label>
                    <textarea
                      value={editNeg}
                      onChange={e => setEditNeg(e.target.value)}
                      rows={2}
                      className="w-full bg-white/[0.03] border border-red-500/30 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-red-500/60 resize-y leading-relaxed"
                      placeholder="worst quality, low quality, blurry..."
                    />
                  </div>
                </>
              )}
              {vid !== undefined && (
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-rose-400 uppercase tracking-wider">✓ Video Prompt</label>
                  <textarea
                    value={editVidPos}
                    onChange={e => setEditVidPos(e.target.value)}
                    rows={3}
                    className="w-full bg-white/[0.03] border border-rose-500/30 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-rose-500/60 resize-y leading-relaxed"
                    placeholder="Video motion prompt..."
                  />
                </div>
              )}
            </div>
          ) : (
            <>
              {img && (
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Image Prompt</p>
                  <div className="rounded-lg bg-white/[0.02] border border-slate-700/40 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs text-green-300 leading-relaxed flex-1">✓ {img.positive}</p>
                      <CopyButton text={img.positive} />
                    </div>
                    {img.negative && (
                      <div className="flex items-start justify-between gap-2 mt-2 pt-2 border-t border-slate-700/30">
                        <p className="text-xs text-red-400/80 leading-relaxed flex-1">✗ {img.negative}</p>
                        <CopyButton text={img.negative} />
                      </div>
                    )}
                  </div>
                  <div className="flex gap-3 text-[11px] text-slate-500">
                    {img.suggestedSampler && <span>Sampler: <span className="text-slate-300">{img.suggestedSampler}</span></span>}
                    {img.suggestedSteps   && <span>Steps: <span className="text-slate-300">{img.suggestedSteps}</span></span>}
                    {img.suggestedCfg    && <span>CFG: <span className="text-slate-300">{img.suggestedCfg}</span></span>}
                  </div>
                </div>
              )}

              {vid && (
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Video Prompt (AnimateDiff / SVD)</p>
                  <div className="rounded-lg bg-white/[0.02] border border-slate-700/40 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs text-rose-300 leading-relaxed flex-1">✓ {vid.positive}</p>
                      <CopyButton text={vid.positive} />
                    </div>
                  </div>
                  {vid.motionKeywords?.length ? (
                    <div className="flex flex-wrap gap-1.5">
                      {vid.motionKeywords.map((kw, i) => (
                        <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
                          {kw}
                        </span>
                      ))}
                    </div>
                  ) : null}
                  <div className="flex gap-3 text-[11px] text-slate-500">
                    {vid.recommendedFrames && <span>Frames: <span className="text-slate-300">{vid.recommendedFrames}</span></span>}
                    {vid.recommendedFps    && <span>FPS: <span className="text-slate-300">{vid.recommendedFps}</span></span>}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Workflow config */}
          {prompt.image_workflow_json && (
            <details className="group">
              <summary className="text-[11px] text-slate-500 cursor-pointer hover:text-slate-300 flex items-center gap-1">
                <ChevronRight className="w-3 h-3 group-open:rotate-90 transition-transform" /> ComfyUI Workflow Config
              </summary>
              <pre className="mt-2 text-[10px] text-slate-400 bg-white/[0.02] rounded-lg p-3 overflow-x-auto border border-slate-700/40 leading-relaxed">
                {JSON.stringify(prompt.image_workflow_json, null, 2)}
              </pre>
            </details>
          )}

          {prompt.video_workflow_json && (
            <details className="group">
              <summary className="text-[11px] text-slate-500 cursor-pointer hover:text-slate-300 flex items-center gap-1">
                <ChevronRight className="w-3 h-3 group-open:rotate-90 transition-transform" /> AnimateDiff / SVD Workflow Config
              </summary>
              <pre className="mt-2 text-[10px] text-slate-400 bg-white/[0.02] rounded-lg p-3 overflow-x-auto border border-slate-700/40 leading-relaxed">
                {JSON.stringify(prompt.video_workflow_json, null, 2)}
              </pre>
            </details>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function MediaGenerationWorkflow() {
  // Project list
  const [projects, setProjects] = useState<MediaProject[]>([]);
  const [projectsLoaded, setProjectsLoaded] = useState(false);
  const [projectsLoading, setProjectsLoading] = useState(false);

  // Selected project + state
  const [selectedProject, setSelectedProject] = useState<ProjectState | null>(null);
  const [projectLoading, setProjectLoading] = useState(false);
  const [activePane, setActivePane] = useState<'brief' | 'prompts' | 'assets'>('brief');

  // Create project form
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', client: '' });
  const [creating, setCreating] = useState(false);

  // Brief form
  const [briefText, setBriefText] = useState('');
  const [briefLoading, setBriefLoading] = useState(false);
  const [briefError, setBriefError] = useState('');

  // Prompt generation
  const [promptsGenerating, setPromptsGenerating] = useState(false);

  // Manual prompt form
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualForm, setManualForm] = useState({
    deliverable_type: 'image' as 'image' | 'video',
    format: 'instagram_post',
    positive: '',
    negative: 'worst quality, low quality, blurry, deformed, watermark, text, signature',
    vidPositive: '',
  });
  const [manualSaving, setManualSaving] = useState(false);

  // Register asset form
  const [assetForm, setAssetForm] = useState({ type: 'image', url: '' });
  const [assetLoading, setAssetLoading] = useState(false);

  const [error, setError] = useState('');

  // ── Load project list ────────────────────────────────────────────────────
  const loadProjects = async () => {
    setProjectsLoading(true);
    setError('');
    try {
      const resp = await fetch('/api/media/projects');
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Failed to load projects');
      setProjects(data.projects || []);
      setProjectsLoaded(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setProjectsLoading(false);
    }
  };

  // ── Select project → load full state ─────────────────────────────────────
  const selectProject = async (id: number) => {
    setProjectLoading(true);
    setError('');
    try {
      const resp = await fetch(`/api/media/projects/${id}`);
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Failed to load project');
      setSelectedProject(data);
      setBriefText(data.project.brief_text || '');
      setActivePane(data.project.brief_text ? 'prompts' : 'brief');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setProjectLoading(false);
    }
  };

  // ── Create project ────────────────────────────────────────────────────────
  const createProject = async () => {
    if (!newProject.name.trim()) return;
    setCreating(true);
    try {
      const resp = await fetch('/api/media/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProject),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error);
      setProjects(p => [data.project, ...p]);
      setShowCreateForm(false);
      setNewProject({ name: '', client: '' });
      await selectProject(data.project.id);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setCreating(false);
    }
  };

  // ── Submit brief ──────────────────────────────────────────────────────────
  const submitBrief = async () => {
    if (!selectedProject || !briefText.trim()) return;
    setBriefLoading(true);
    setBriefError('');
    try {
      const resp = await fetch(`/api/media/projects/${selectedProject.project.id}/brief`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brief: briefText }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error);
      await selectProject(selectedProject.project.id);
      setActivePane('prompts');
    } catch (err: unknown) {
      setBriefError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setBriefLoading(false);
    }
  };

  // ── Generate prompts ──────────────────────────────────────────────────────
  const generatePrompts = async () => {
    if (!selectedProject) return;
    setPromptsGenerating(true);
    setError('');
    try {
      const resp = await fetch(`/api/media/projects/${selectedProject.project.id}/generate-prompts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error);
      await selectProject(selectedProject.project.id);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setPromptsGenerating(false);
    }
  };

  // ── Approve prompt ────────────────────────────────────────────────────────
  const approvePrompt = async (promptId: number) => {
    if (!selectedProject) return;
    try {
      await fetch(`/api/media/prompts/${promptId}/approve`, { method: 'PATCH' });
      await selectProject(selectedProject.project.id);
    } catch { /* silent */ }
  };

  // ── Edit prompt ───────────────────────────────────────────────────────────
  const editPrompt = async (promptId: number, newPromptJson: PromptRecord['prompt_json']) => {
    if (!selectedProject) return;
    try {
      await fetch(`/api/media/prompts/${promptId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt_json: newPromptJson }),
      });
      await selectProject(selectedProject.project.id);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save prompt');
    }
  };

  // ── Create manual prompt ──────────────────────────────────────────────────
  const createManualPrompt = async () => {
    if (!selectedProject || !manualForm.positive.trim()) return;
    setManualSaving(true);
    try {
      const promptJson: PromptRecord['prompt_json'] = {};
      if (manualForm.deliverable_type === 'image' || manualForm.deliverable_type === 'video') {
        promptJson.image = { positive: manualForm.positive, negative: manualForm.negative };
      }
      if (manualForm.deliverable_type === 'video' && manualForm.vidPositive.trim()) {
        promptJson.video = { positive: manualForm.vidPositive, negative: '' };
      }
      await fetch(`/api/media/projects/${selectedProject.project.id}/prompts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deliverable_type: manualForm.deliverable_type,
          format: manualForm.format,
          prompt_json: promptJson,
        }),
      });
      setManualForm({
        deliverable_type: 'image',
        format: 'instagram_post',
        positive: '',
        negative: 'worst quality, low quality, blurry, deformed, watermark, text, signature',
        vidPositive: '',
      });
      setShowManualForm(false);
      await selectProject(selectedProject.project.id);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create prompt');
    } finally {
      setManualSaving(false);
    }
  };

  // ── Register asset ────────────────────────────────────────────────────────
  const registerAsset = async () => {
    if (!selectedProject || !assetForm.url.trim()) return;
    setAssetLoading(true);
    try {
      const resp = await fetch(`/api/media/projects/${selectedProject.project.id}/assets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assetForm),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error);
      setAssetForm({ type: 'image', url: '' });
      await selectProject(selectedProject.project.id);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setAssetLoading(false);
    }
  };

  // ── Run asset QC ──────────────────────────────────────────────────────────
  const runAssetQc = async (assetId: number) => {
    if (!selectedProject) return;
    try {
      await fetch(`/api/media/assets/${assetId}/qc`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: selectedProject.project.id }),
      });
      await selectProject(selectedProject.project.id);
    } catch { /* silent */ }
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-rose-400" />
            AI Media Generation
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Agency workflow: brief → prompts → ComfyUI / AnimateDiff configs → QC → delivery
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!projectsLoaded ? (
            <button
              onClick={loadProjects}
              disabled={projectsLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600/30 transition-colors text-sm disabled:opacity-50"
            >
              {projectsLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              Load Projects
            </button>
          ) : (
            <button
              onClick={loadProjects}
              disabled={projectsLoading}
              className="p-1.5 text-slate-500 hover:text-white transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${projectsLoading ? 'animate-spin' : ''}`} />
            </button>
          )}
          <button
            onClick={() => setShowCreateForm(v => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600/20 text-rose-400 border border-rose-500/30 hover:bg-rose-600/30 transition-colors text-sm"
          >
            <Plus className="w-3.5 h-3.5" /> New Project
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* ── Create project form ─────────────────────────────────────────── */}
      {showCreateForm && (
        <div className="rounded-xl border border-slate-700/50 bg-slate-800/60 p-4 space-y-3">
          <h3 className="text-sm font-semibold text-white">New Project</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-slate-400 mb-1 block">Project Name *</label>
              <input
                value={newProject.name}
                onChange={e => setNewProject(p => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Brand Refresh Q1"
                className="w-full bg-white/[0.04] border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-500/50"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 mb-1 block">Client</label>
              <input
                value={newProject.client}
                onChange={e => setNewProject(p => ({ ...p, client: e.target.value }))}
                placeholder="e.g. Acme Corp"
                className="w-full bg-white/[0.04] border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-500/50"
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowCreateForm(false)} className="px-3 py-1.5 text-sm text-slate-400 hover:text-white transition-colors">Cancel</button>
            <button
              onClick={createProject}
              disabled={creating || !newProject.name.trim()}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-sm font-medium transition-colors disabled:opacity-50"
            >
              {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              Create
            </button>
          </div>
        </div>
      )}

      {/* ── Main layout: project list + detail ─────────────────────────── */}
      <div className="grid grid-cols-[260px_1fr] gap-4">

        {/* Project sidebar */}
        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-1">
            Projects {projects.length > 0 && `(${projects.length})`}
          </p>
          {!projectsLoaded && (
            <div className="rounded-xl border border-slate-700/40 bg-white/[0.02] p-4 text-center">
              <p className="text-xs text-slate-500">Click "Load Projects" to begin</p>
            </div>
          )}
          {projectsLoaded && projects.length === 0 && (
            <div className="rounded-xl border border-slate-700/40 bg-white/[0.02] p-4 text-center">
              <p className="text-xs text-slate-500">No projects yet</p>
              <p className="text-[11px] text-slate-600 mt-1">Create your first project above</p>
            </div>
          )}
          {projects.map(p => (
            <button
              key={p.id}
              onClick={() => selectProject(p.id)}
              className={`w-full text-left px-3 py-2.5 rounded-xl border transition-colors ${
                selectedProject?.project.id === p.id
                  ? 'bg-rose-500/10 border-rose-500/30 text-white'
                  : 'bg-white/[0.02] border-slate-700/40 text-slate-300 hover:bg-white/[0.04] hover:border-slate-600/50'
              }`}
            >
              <p className="text-sm font-medium leading-tight truncate">{p.name}</p>
              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                {p.client && <span className="text-[10px] text-slate-500 truncate">{p.client}</span>}
                <StatusBadge status={p.status} />
              </div>
            </button>
          ))}
        </div>

        {/* Detail panel */}
        <div>
          {projectLoading && (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="w-6 h-6 text-rose-400 animate-spin" />
            </div>
          )}

          {!projectLoading && !selectedProject && (
            <div className="rounded-xl border border-slate-700/40 bg-white/[0.02] p-8 text-center">
              <Sparkles className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 font-medium">Select a project to begin</p>
              <p className="text-sm text-slate-500 mt-1">
                Or create a new one to start the agency workflow.
              </p>
            </div>
          )}

          {!projectLoading && selectedProject && (
            <div className="space-y-4">
              {/* Project header */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white">{selectedProject.project.name}</h3>
                  {selectedProject.project.client && (
                    <p className="text-sm text-slate-400">{selectedProject.project.client}</p>
                  )}
                </div>
                <StatusBadge status={selectedProject.project.status} />
              </div>

              {/* Pane tabs */}
              <div className="flex gap-1 border-b border-slate-700/40 pb-0">
                {(['brief', 'prompts', 'assets'] as const).map(pane => (
                  <button
                    key={pane}
                    onClick={() => setActivePane(pane)}
                    className={`px-3 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
                      activePane === pane
                        ? 'border-rose-500 text-rose-400'
                        : 'border-transparent text-slate-400 hover:text-white'
                    }`}
                  >
                    {pane === 'brief'   && <span className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" />Brief</span>}
                    {pane === 'prompts' && <span className="flex items-center gap-1.5"><Wand2 className="w-3.5 h-3.5" />Prompts{selectedProject.prompts.length > 0 && ` (${selectedProject.prompts.length})`}</span>}
                    {pane === 'assets'  && <span className="flex items-center gap-1.5"><Eye className="w-3.5 h-3.5" />Assets{selectedProject.assets.length > 0 && ` (${selectedProject.assets.length})`}</span>}
                  </button>
                ))}
              </div>

              {/* ── Brief pane ─────────────────────────────────────────── */}
              {activePane === 'brief' && (
                <div className="space-y-4">
                  <div className="rounded-xl border border-slate-700/40 bg-white/[0.02] p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-slate-400" />
                      <p className="text-sm font-semibold text-white">Agency Workflow</p>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-[11px]">
                      {[
                        ['1', 'Brief', 'Strategist submits client brief'],
                        ['2', 'Translate', 'AI extracts structured spec + style guide'],
                        ['3', 'Prompts', 'AI generates SD/SDXL + AnimateDiff prompts'],
                        ['4', 'Generate', 'Operator runs ComfyUI / AnimateDiff on GPU'],
                      ].map(([num, label, desc]) => (
                        <div key={num} className="rounded-lg bg-white/[0.03] border border-slate-700/40 p-2.5">
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="w-4 h-4 rounded-full bg-rose-500/20 text-rose-400 text-[10px] flex items-center justify-center font-bold">{num}</span>
                            <span className="font-semibold text-slate-300">{label}</span>
                          </div>
                          <p className="text-slate-500">{desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Creative Brief
                    </label>
                    <p className="text-[11px] text-slate-500">
                      Describe the campaign, brand, deliverables, style, and channel. The AI will extract a structured spec.
                    </p>
                    <textarea
                      value={briefText}
                      onChange={e => setBriefText(e.target.value)}
                      rows={10}
                      placeholder={`Example:

Client: Acme Sportswear
Campaign: Summer Collection launch for IG + TikTok
Deliverables:
  - 4 Instagram posts (1:1, product hero shots)
  - 2 Instagram Stories (9:16, lifestyle feel)
  - 1 TikTok hook video (15s, energetic)

Brand: Bold, energetic, premium athletic. Palette: Electric blue (#0066FF), white, black.
Avoid: red, food imagery, logos of competitors.

Style: Clean studio product shots + outdoor lifestyle. Camera: Sony A7R IV, 35mm, shallow DOF.
Mood: Aspirational, high-energy summer.`}
                      className="w-full bg-white/[0.03] border border-slate-700/50 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-rose-500/50 resize-none leading-relaxed"
                    />
                    {briefError && (
                      <p className="text-xs text-red-400 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" /> {briefError}
                      </p>
                    )}
                    <button
                      onClick={submitBrief}
                      disabled={briefLoading || !briefText.trim()}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-sm font-medium transition-colors disabled:opacity-50"
                    >
                      {briefLoading
                        ? <><Loader2 className="w-4 h-4 animate-spin" /> Translating Brief…</>
                        : <><Sparkles className="w-4 h-4" /> Translate Brief & Build Style Guide</>
                      }
                    </button>
                  </div>

                  {/* Show parsed spec if exists */}
                  {selectedProject.project.brief_spec_json && (
                    <details className="group">
                      <summary className="text-[11px] text-slate-500 cursor-pointer hover:text-slate-300 flex items-center gap-1">
                        <ChevronRight className="w-3 h-3 group-open:rotate-90 transition-transform" /> Parsed Brief Spec (JSON)
                      </summary>
                      <pre className="mt-2 text-[10px] text-slate-400 bg-white/[0.02] rounded-lg p-3 overflow-x-auto border border-slate-700/40 leading-relaxed">
                        {JSON.stringify(selectedProject.project.brief_spec_json, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              {/* ── Prompts pane ──────────────────────────────────────── */}
              {activePane === 'prompts' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <p className="text-sm text-slate-300">
                      {selectedProject.prompts.length === 0
                        ? 'No prompts yet — generate from brief or write manually.'
                        : `${selectedProject.prompts.length} prompt set${selectedProject.prompts.length !== 1 ? 's' : ''} · ${selectedProject.prompts.filter(p => p.status === 'approved').length} approved`
                      }
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowManualForm(v => !v)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700/50 text-slate-300 border border-slate-600/50 hover:bg-slate-700 transition-colors text-sm"
                      >
                        <Pencil className="w-3.5 h-3.5" /> Write Manually
                      </button>
                      <button
                        onClick={generatePrompts}
                        disabled={promptsGenerating || !selectedProject.project.brief_spec_json}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600/20 text-purple-400 border border-purple-500/30 hover:bg-purple-600/30 transition-colors text-sm disabled:opacity-50"
                        title={!selectedProject.project.brief_spec_json ? 'Submit a brief first to use AI generation' : ''}
                      >
                        {promptsGenerating
                          ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating…</>
                          : <><Wand2 className="w-3.5 h-3.5" /> Generate with AI</>
                        }
                      </button>
                    </div>
                  </div>

                  {!selectedProject.project.brief_spec_json && !showManualForm && (
                    <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-4 text-sm text-yellow-400">
                      No brief translated yet. You can <button onClick={() => setShowManualForm(true)} className="underline hover:text-yellow-300">write prompts manually</button>, or go to the Brief tab to submit a brief first.
                    </div>
                  )}

                  {/* Manual prompt form */}
                  {showManualForm && (
                    <div className="rounded-xl border border-slate-600/50 bg-slate-800/60 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-white flex items-center gap-2">
                          <Pencil className="w-4 h-4 text-slate-400" /> Write Prompt Manually
                        </p>
                        <button onClick={() => setShowManualForm(false)} className="p-1 text-slate-500 hover:text-white transition-colors">
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] text-slate-400 mb-1 block">Type</label>
                          <select
                            value={manualForm.deliverable_type}
                            onChange={e => setManualForm(f => ({ ...f, deliverable_type: e.target.value as 'image' | 'video' }))}
                            className="w-full bg-white/[0.04] border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500/50"
                          >
                            <option value="image">Image</option>
                            <option value="video">Video</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[11px] text-slate-400 mb-1 block">Format</label>
                          <select
                            value={manualForm.format}
                            onChange={e => setManualForm(f => ({ ...f, format: e.target.value }))}
                            className="w-full bg-white/[0.04] border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500/50"
                          >
                            <option value="instagram_post">Instagram Post</option>
                            <option value="instagram_story">Instagram Story</option>
                            <option value="tiktok">TikTok</option>
                            <option value="youtube_shorts">YouTube Shorts</option>
                            <option value="key_visual">Key Visual</option>
                            <option value="product_video">Product Video</option>
                            <option value="custom">Custom</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-green-400 uppercase tracking-wider">✓ Positive Prompt *</label>
                        <textarea
                          value={manualForm.positive}
                          onChange={e => setManualForm(f => ({ ...f, positive: e.target.value }))}
                          rows={4}
                          placeholder="Describe what you want to generate: subject, style, lighting, camera, mood..."
                          className="w-full bg-white/[0.03] border border-green-500/30 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-green-500/60 resize-y leading-relaxed"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-red-400 uppercase tracking-wider">✗ Negative Prompt</label>
                        <textarea
                          value={manualForm.negative}
                          onChange={e => setManualForm(f => ({ ...f, negative: e.target.value }))}
                          rows={2}
                          className="w-full bg-white/[0.03] border border-red-500/30 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-red-500/60 resize-y leading-relaxed"
                        />
                      </div>

                      {manualForm.deliverable_type === 'video' && (
                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-rose-400 uppercase tracking-wider">✓ Video Motion Prompt</label>
                          <textarea
                            value={manualForm.vidPositive}
                            onChange={e => setManualForm(f => ({ ...f, vidPositive: e.target.value }))}
                            rows={2}
                            placeholder="slow dolly in, gentle pan left, subtle breathing motion..."
                            className="w-full bg-white/[0.03] border border-rose-500/30 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-rose-500/60 resize-y leading-relaxed"
                          />
                        </div>
                      )}

                      <button
                        onClick={createManualPrompt}
                        disabled={manualSaving || !manualForm.positive.trim()}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-sm font-medium transition-colors disabled:opacity-50"
                      >
                        {manualSaving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : <><Save className="w-4 h-4" /> Save Prompt</>}
                      </button>
                    </div>
                  )}

                  <div className="space-y-3">
                    {selectedProject.prompts.map(p => (
                      <PromptCard
                        key={p.id}
                        prompt={p}
                        onApprove={approvePrompt}
                        onEdit={editPrompt}
                        projectId={selectedProject.project.id}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* ── Assets pane ───────────────────────────────────────── */}
              {activePane === 'assets' && (
                <div className="space-y-4">
                  {/* Register asset form */}
                  <div className="rounded-xl border border-slate-700/50 bg-slate-800/60 p-4 space-y-3">
                    <p className="text-sm font-semibold text-white flex items-center gap-2">
                      <Upload className="w-4 h-4 text-slate-400" /> Register GPU Output
                    </p>
                    <p className="text-[11px] text-slate-500">
                      After generating in ComfyUI / AnimateDiff, register the asset URL here for QC and tracking.
                    </p>
                    <div className="flex gap-3">
                      <select
                        value={assetForm.type}
                        onChange={e => setAssetForm(f => ({ ...f, type: e.target.value }))}
                        className="bg-white/[0.04] border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500/50"
                      >
                        <option value="image">Image</option>
                        <option value="video">Video</option>
                      </select>
                      <input
                        value={assetForm.url}
                        onChange={e => setAssetForm(f => ({ ...f, url: e.target.value }))}
                        placeholder="https://… or /outputs/filename.png"
                        className="flex-1 bg-white/[0.04] border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-500/50"
                      />
                      <button
                        onClick={registerAsset}
                        disabled={assetLoading || !assetForm.url.trim()}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600/30 transition-colors text-sm disabled:opacity-50"
                      >
                        {assetLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                        Add
                      </button>
                    </div>
                  </div>

                  {/* Asset list */}
                  {selectedProject.assets.length === 0 ? (
                    <div className="rounded-xl border border-slate-700/40 bg-white/[0.02] p-8 text-center">
                      <Image className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                      <p className="text-sm text-slate-500">No assets registered yet</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {selectedProject.assets.map(asset => (
                        <div key={asset.id} className="rounded-xl border border-slate-700/50 bg-slate-800/60 p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-2 min-w-0">
                              {asset.type === 'video'
                                ? <Film className="w-4 h-4 text-rose-400 shrink-0" />
                                : <Image className="w-4 h-4 text-blue-400 shrink-0" />
                              }
                              <div className="min-w-0">
                                <p className="text-xs text-slate-300 truncate">{asset.url}</p>
                                {asset.qc_json && (
                                  <p className={`text-[11px] mt-0.5 ${asset.qc_json.approved ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {asset.qc_json.approved ? '✓ Approved' : '✗ Needs revision'}
                                    {asset.qc_json.overallScore != null && ` · Score: ${asset.qc_json.overallScore}/10`}
                                  </p>
                                )}
                                {asset.qc_json?.revisionNotes && (
                                  <p className="text-[11px] text-slate-500 mt-0.5">{asset.qc_json.revisionNotes}</p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <StatusBadge status={asset.status} />
                              <button
                                onClick={() => runAssetQc(asset.id)}
                                className="text-[10px] px-2 py-1 rounded-lg bg-purple-600/20 text-purple-400 border border-purple-500/30 hover:bg-purple-600/30 transition-colors"
                              >
                                Run QC
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Agency best practices panel ─────────────────────────────── */}
      <div className="rounded-xl border border-slate-700/40 bg-white/[0.02] p-5">
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Agency Workflow Guide
        </h3>
        <div className="grid grid-cols-3 gap-4 text-[11px] text-slate-400">
          <div className="space-y-2">
            <p className="font-semibold text-slate-300 flex items-center gap-1.5"><Image className="w-3.5 h-3.5 text-blue-400" /> Image Generation</p>
            <ul className="space-y-1 list-none">
              <li className="flex gap-1.5"><ChevronRight className="w-3 h-3 text-blue-400 mt-0.5 shrink-0" />SD 1.5 for 512px drafts, SDXL for 1024px finals</li>
              <li className="flex gap-1.5"><ChevronRight className="w-3 h-3 text-blue-400 mt-0.5 shrink-0" />20 steps preview → 50 steps final with SDXL refiner</li>
              <li className="flex gap-1.5"><ChevronRight className="w-3 h-3 text-blue-400 mt-0.5 shrink-0" />Pin seed after approving a variant</li>
              <li className="flex gap-1.5"><ChevronRight className="w-3 h-3 text-blue-400 mt-0.5 shrink-0" />LoRA weight: 0.6–0.8 for style, 0.8–1.0 for character</li>
            </ul>
          </div>
          <div className="space-y-2">
            <p className="font-semibold text-slate-300 flex items-center gap-1.5"><Film className="w-3.5 h-3.5 text-rose-400" /> Video Generation</p>
            <ul className="space-y-1 list-none">
              <li className="flex gap-1.5"><ChevronRight className="w-3 h-3 text-rose-400 mt-0.5 shrink-0" />AnimateDiff: 16 frames @ 8fps = 2s clip (VRAM safe)</li>
              <li className="flex gap-1.5"><ChevronRight className="w-3 h-3 text-rose-400 mt-0.5 shrink-0" />SVD-XT: image-to-video, 25 frames @ 6fps</li>
              <li className="flex gap-1.5"><ChevronRight className="w-3 h-3 text-rose-400 mt-0.5 shrink-0" />Keep motion subtle for brand work</li>
              <li className="flex gap-1.5"><ChevronRight className="w-3 h-3 text-rose-400 mt-0.5 shrink-0" />Assemble clips in Premiere / Resolve; add music + subs</li>
            </ul>
          </div>
          <div className="space-y-2">
            <p className="font-semibold text-slate-300 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-purple-400" /> Roles & Approval</p>
            <ul className="space-y-1 list-none">
              <li className="flex gap-1.5"><ChevronRight className="w-3 h-3 text-purple-400 mt-0.5 shrink-0" />Strategist: submits brief, approves final</li>
              <li className="flex gap-1.5"><ChevronRight className="w-3 h-3 text-purple-400 mt-0.5 shrink-0" />Art Director: reviews prompts + style guide</li>
              <li className="flex gap-1.5"><ChevronRight className="w-3 h-3 text-purple-400 mt-0.5 shrink-0" />AI Operator: runs ComfyUI / AnimateDiff</li>
              <li className="flex gap-1.5"><ChevronRight className="w-3 h-3 text-purple-400 mt-0.5 shrink-0" />QC: Claude Sonnet vision check before delivery</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
