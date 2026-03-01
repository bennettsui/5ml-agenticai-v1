'use client';

import { useState, useEffect, useCallback, useRef, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Loader2,
  AlertCircle,
  FolderKanban,
  Building2,
  Calendar,
  MessageSquare,
  Mail,
  RefreshCw,
  FileText,
  Tag,
  Zap,
  Pencil,
  Check,
  X,
  Plus,
  Trash2,
  ListChecks,
  CheckCircle2,
  Circle,
  Clock,
  Paperclip,
  Upload,
  FileImage,
  Download,
  Sparkles,
  Bot,
} from 'lucide-react';
import { crmApi, type Project, type Brand, type FeedbackEvent, type Deliverable, type ProjectAttachment } from '@/lib/crm-kb-api';
import { useCrmAi } from '../../context';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STATUS_COLORS: Record<string, string> = {
  planning: 'bg-blue-900/40 text-blue-300 border-blue-700',
  in_progress: 'bg-emerald-900/40 text-emerald-300 border-emerald-700',
  on_hold: 'bg-yellow-900/40 text-yellow-300 border-yellow-700',
  completed: 'bg-green-900/40 text-green-300 border-green-700',
  cancelled: 'bg-red-900/40 text-red-300 border-red-700',
};

const SENTIMENT_COLORS: Record<string, string> = {
  positive: 'bg-green-900/40 text-green-300 border-green-700',
  neutral: 'bg-slate-700/40 text-slate-300 border-slate-600',
  negative: 'bg-red-900/40 text-red-300 border-red-700',
};

const DELIVERABLE_STATUS_CYCLE: Record<Deliverable['status'], Deliverable['status']> = {
  pending: 'in_progress',
  in_progress: 'done',
  done: 'pending',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatDeadline(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  if (diff < 0) return `${label} (overdue)`;
  if (diff === 0) return `${label} (today)`;
  if (diff <= 7) return `${label} (in ${diff}d)`;
  return label;
}

function deadlineColor(iso: string | null): string {
  if (!iso) return 'text-slate-500';
  const d = new Date(iso);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return 'text-red-400';
  if (diff <= 3) return 'text-orange-400';
  if (diff <= 7) return 'text-yellow-400';
  return 'text-slate-400';
}

function nanoid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ---------------------------------------------------------------------------
// Inner component
// ---------------------------------------------------------------------------

function ProjectDetailInner() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get('id');
  const { setPageState, sendFileToChat } = useCrmAi();

  const [project, setProject] = useState<Project | null>(null);
  const [brand, setBrand] = useState<Brand | null>(null);
  const [feedback, setFeedback] = useState<FeedbackEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);

  // Brief editing
  const [editingBrief, setEditingBrief] = useState(false);
  const [briefDraft, setBriefDraft] = useState('');
  const [savingBrief, setSavingBrief] = useState(false);

  // Deliverables
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [savingDeliverables, setSavingDeliverables] = useState(false);
  // New deliverable form
  const [showAddDeliverable, setShowAddDeliverable] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDeadline, setNewDeadline] = useState('');
  const newTitleRef = useRef<HTMLInputElement>(null);

  // Attachments
  const [attachments, setAttachments] = useState<ProjectAttachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [summarizingId, setSummarizingId] = useState<string | null>(null);
  const [sendingToAiId, setSendingToAiId] = useState<string | null>(null);
  const [attachDragging, setAttachDragging] = useState(false);
  const attachDragCounterRef = useRef(0);
  const attachFileInputRef = useRef<HTMLInputElement>(null);

  const fetchData = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setError(null);
    try {
      const projectRes = await fetch('/api/projects/' + projectId);
      if (!projectRes.ok) throw new Error('Failed to load project');
      const projectData: Project = await projectRes.json();
      setProject(projectData);
      setDeliverables(projectData.deliverables ?? []);

      if (projectData.client_id) {
        try {
          const brandRes = await fetch('/api/brands/' + projectData.client_id);
          if (brandRes.ok) setBrand(await brandRes.json());
        } catch { /* non-critical */ }
      }
      try {
        const feedbackRes = await fetch('/api/feedback?project_id=' + projectId);
        if (feedbackRes.ok) {
          const fd = await feedbackRes.json();
          setFeedback(fd.items ?? fd);
        }
      } catch { /* non-critical */ }

      try {
        const attList = await crmApi.projects.attachments.list(projectId);
        setAttachments(attList);
      } catch { /* non-critical */ }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load project');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Memoize the serialized attachment list so the setPageState effect only
  // re-runs when attachment data actually changes, not on every render.
  const attachmentContext = useMemo(
    () => attachments.map(a => ({ name: a.original_name, type: a.mime_type, summary: a.summary ?? null })),
    [attachments]
  );

  // Keep AI page context in sync with project + attachments
  useEffect(() => {
    if (!project) return;
    setPageState({
      pageType: 'project-detail',
      pageTitle: project.name,
      formData: { projectId: project.id, projectName: project.name, attachments: attachmentContext },
    });
  }, [project, attachmentContext, setPageState]);

  // Focus the new-deliverable title input when form opens
  useEffect(() => {
    if (showAddDeliverable) {
      setTimeout(() => newTitleRef.current?.focus(), 50);
    }
  }, [showAddDeliverable]);

  // -----------------------------------------------------------------------
  // Brief save
  // -----------------------------------------------------------------------
  const handleSaveBrief = async () => {
    if (!projectId) return;
    setSavingBrief(true);
    try {
      const updated = await crmApi.projects.update(projectId, { brief: briefDraft || null });
      setProject(updated);
      setEditingBrief(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save brief');
    } finally {
      setSavingBrief(false);
    }
  };

  const startEditBrief = () => {
    setBriefDraft(project?.brief ?? '');
    setEditingBrief(true);
  };

  // -----------------------------------------------------------------------
  // Deliverables helpers (all local mutations → save to API)
  // -----------------------------------------------------------------------
  const saveDeliverables = useCallback(async (next: Deliverable[]) => {
    if (!projectId) return;
    setSavingDeliverables(true);
    try {
      const updated = await crmApi.projects.update(projectId, { deliverables: next });
      setProject(updated);
      setDeliverables(updated.deliverables ?? next);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save deliverables');
    } finally {
      setSavingDeliverables(false);
    }
  }, [projectId]);

  const handleAddDeliverable = async () => {
    const title = newTitle.trim();
    if (!title) return;
    const item: Deliverable = {
      id: nanoid(),
      title,
      deadline: newDeadline || null,
      status: 'pending',
    };
    const next = [...deliverables, item];
    setDeliverables(next);
    setNewTitle('');
    setNewDeadline('');
    setShowAddDeliverable(false);
    await saveDeliverables(next);
  };

  const handleCycleStatus = async (id: string) => {
    const next = deliverables.map((d) =>
      d.id === id ? { ...d, status: DELIVERABLE_STATUS_CYCLE[d.status] } : d
    );
    setDeliverables(next);
    await saveDeliverables(next);
  };

  const handleDeleteDeliverable = async (id: string) => {
    const next = deliverables.filter((d) => d.id !== id);
    setDeliverables(next);
    await saveDeliverables(next);
  };

  // -----------------------------------------------------------------------
  // Email sync
  // -----------------------------------------------------------------------
  const handleSyncEmails = async () => {
    if (!projectId) return;
    setSyncing(true);
    setSyncResult(null);
    try {
      const result = await crmApi.gmail.sync();
      setSyncResult(`Synced ${result.synced_count} emails, ${result.new_feedback_count} new feedback items created.`);
      const feedbackRes = await fetch('/api/feedback?project_id=' + projectId);
      if (feedbackRes.ok) {
        const fd = await feedbackRes.json();
        setFeedback(fd.items ?? fd);
      }
    } catch (err) {
      setSyncResult(err instanceof Error ? err.message : 'Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  // -----------------------------------------------------------------------
  // Attachments
  // -----------------------------------------------------------------------
  const handleAttachmentUpload = async (file: File) => {
    if (!projectId || uploading) return;
    setUploading(true);
    try {
      const att = await crmApi.projects.attachments.upload(projectId, file);
      setAttachments((prev) => [att, ...prev]);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteAttachment = async (id: string) => {
    if (!projectId) return;
    try {
      await crmApi.projects.attachments.delete(projectId, id);
      setAttachments((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  const handleSummarize = async (att: ProjectAttachment) => {
    if (!projectId || summarizingId) return;
    setSummarizingId(att.id);
    try {
      const updated = await crmApi.projects.attachments.summarize(projectId, att.id);
      setAttachments((prev) => prev.map((a) => (a.id === att.id ? updated : a)));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Summarization failed');
    } finally {
      setSummarizingId(null);
    }
  };

  const handleSendToAi = async (att: ProjectAttachment) => {
    if (!projectId || sendingToAiId) return;
    setSendingToAiId(att.id);
    try {
      const res = await fetch(`/api/crm/projects/${projectId}/attachments/${att.id}/download`);
      if (!res.ok) throw new Error('File not available');
      const blob = await res.blob();
      const file = new File([blob], att.original_name, { type: att.mime_type || blob.type });
      sendFileToChat(file);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not send file to AI');
    } finally {
      setSendingToAiId(null);
    }
  };

  const handleAttachDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    attachDragCounterRef.current += 1;
    if (e.dataTransfer.types.includes('Files')) setAttachDragging(true);
  }, []);

  const handleAttachDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    attachDragCounterRef.current -= 1;
    if (attachDragCounterRef.current === 0) setAttachDragging(false);
  }, []);

  const handleAttachDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    attachDragCounterRef.current = 0;
    setAttachDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleAttachmentUpload(file);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, uploading]);

  // -----------------------------------------------------------------------
  // Guard states
  // -----------------------------------------------------------------------
  if (!projectId) {
    return (
      <div className="py-12 text-center">
        <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
        <p className="text-red-300 mb-4">No project ID provided</p>
        <Link href="/use-cases/crm/projects" className="text-emerald-400 hover:text-emerald-300 text-sm">Back to Projects</Link>
      </div>
    );
  }
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
        <span className="ml-3 text-slate-400 text-sm">Loading project...</span>
      </div>
    );
  }
  if (error || !project) {
    return (
      <div className="py-12 text-center">
        <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
        <p className="text-red-300 mb-4">{error || 'Project not found'}</p>
        <button onClick={fetchData} className="px-4 py-2 bg-slate-700 text-slate-200 rounded-lg text-sm hover:bg-slate-600 transition-colors">Retry</button>
      </div>
    );
  }

  const doneCount = deliverables.filter((d) => d.status === 'done').length;

  return (
    <div className="space-y-6">
      {/* ---- Breadcrumb + Header ---- */}
      <div>
        <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-4 flex-wrap">
          <Link href="/use-cases/crm/brands" className="hover:text-white transition-colors">Brands</Link>
          {brand && (
            <>
              <span className="text-slate-700">/</span>
              <Link href={`/use-cases/crm/brands/detail?id=${brand.id}`} className="hover:text-white transition-colors text-slate-400">{brand.name}</Link>
            </>
          )}
          <span className="text-slate-700">/</span>
          <Link href="/use-cases/crm/projects" className="hover:text-white transition-colors">Projects</Link>
          <span className="text-slate-700">/</span>
          <span className="text-slate-300">{project.name}</span>
        </nav>

        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-white">{project.name}</h1>
            {brand && (
              <Link
                href={`/use-cases/crm/brands/detail?id=${brand.id}`}
                className="inline-flex items-center gap-1.5 mt-1 text-sm text-slate-400 hover:text-emerald-400 transition-colors"
              >
                <Building2 className="w-3.5 h-3.5" />
                {brand.name}
              </Link>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${STATUS_COLORS[project.status] ?? 'bg-slate-700 text-slate-300 border-slate-600'}`}>
              {project.status.replace(/_/g, ' ')}
            </span>
            <span className="inline-block px-3 py-1 rounded-full text-xs font-medium border bg-slate-700/50 text-slate-300 border-slate-600 capitalize">
              {project.type.replace(/_/g, ' ')}
            </span>
            <button
              onClick={fetchData}
              className="p-1.5 rounded text-slate-500 hover:text-white hover:bg-slate-700/50 transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ---- Info Cards ---- */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Building2 className="w-4 h-4 text-purple-400" />
            <span className="text-xs text-slate-400">Brand</span>
          </div>
          {brand ? (
            <Link href={`/use-cases/crm/brands/detail?id=${brand.id}`} className="text-base font-bold text-emerald-400 hover:text-emerald-300 transition-colors">
              {brand.name}
            </Link>
          ) : (
            <span className="text-base font-bold text-slate-500">--</span>
          )}
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <FolderKanban className="w-4 h-4 text-blue-400" />
            <span className="text-xs text-slate-400">Status</span>
          </div>
          <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[project.status] ?? 'bg-slate-700 text-slate-300 border-slate-600'}`}>
            {project.status.replace(/_/g, ' ')}
          </span>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Tag className="w-4 h-4 text-amber-400" />
            <span className="text-xs text-slate-400">Type</span>
          </div>
          <span className="text-base font-bold text-white capitalize">{project.type.replace(/_/g, ' ')}</span>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-slate-400">Dates</span>
          </div>
          <div className="space-y-0.5">
            {project.start_date && <p className="text-xs text-slate-300"><span className="text-slate-500">Start:</span> {formatDate(project.start_date)}</p>}
            {project.end_date && <p className="text-xs text-slate-300"><span className="text-slate-500">End:</span> {formatDate(project.end_date)}</p>}
            {!project.start_date && !project.end_date && <span className="text-base font-bold text-slate-500">--</span>}
          </div>
        </div>
      </div>

      {/* ---- Project Brief (editable) ---- */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-400" />
            <h2 className="text-sm font-semibold text-white">Project Brief</h2>
          </div>
          {!editingBrief && (
            <button
              onClick={startEditBrief}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-slate-700/60 transition-colors"
            >
              <Pencil className="w-3 h-3" />
              {project.brief ? 'Edit' : 'Add Brief'}
            </button>
          )}
        </div>

        {editingBrief ? (
          <div>
            <textarea
              value={briefDraft}
              onChange={(e) => setBriefDraft(e.target.value)}
              rows={6}
              placeholder="Describe the project scope, goals, target audience, key deliverables..."
              className="w-full bg-slate-700/40 border border-slate-600/50 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 resize-y transition-colors"
            />
            <div className="flex items-center gap-2 mt-2.5">
              <button
                onClick={handleSaveBrief}
                disabled={savingBrief}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
              >
                {savingBrief ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                Save Brief
              </button>
              <button
                onClick={() => setEditingBrief(false)}
                disabled={savingBrief}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-xs font-medium transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                Cancel
              </button>
            </div>
          </div>
        ) : project.brief ? (
          <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">{project.brief}</p>
        ) : (
          <button
            onClick={startEditBrief}
            className="w-full text-left py-6 text-sm text-slate-500 italic hover:text-slate-400 transition-colors"
          >
            No brief yet — click to add one
          </button>
        )}
      </div>

      {/* ---- Deliverables ---- */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ListChecks className="w-4 h-4 text-slate-400" />
            <h2 className="text-sm font-semibold text-white">Deliverables</h2>
            {deliverables.length > 0 && (
              <span className="text-xs text-slate-500 bg-slate-700/60 px-2 py-0.5 rounded-full">
                {doneCount}/{deliverables.length} done
              </span>
            )}
            {savingDeliverables && <Loader2 className="w-3.5 h-3.5 text-slate-500 animate-spin" />}
          </div>
          <button
            onClick={() => setShowAddDeliverable((v) => !v)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-slate-700/60 transition-colors"
          >
            <Plus className="w-3 h-3" />
            Add
          </button>
        </div>

        {/* Progress bar */}
        {deliverables.length > 0 && (
          <div className="w-full h-1 bg-slate-700/60 rounded-full overflow-hidden mb-4">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all"
              style={{ width: `${Math.round((doneCount / deliverables.length) * 100)}%` }}
            />
          </div>
        )}

        {/* Deliverables list */}
        {deliverables.length === 0 && !showAddDeliverable && (
          <div className="text-center py-6">
            <ListChecks className="w-8 h-8 text-slate-700 mx-auto mb-2" />
            <p className="text-sm text-slate-500">No deliverables yet</p>
            <button
              onClick={() => setShowAddDeliverable(true)}
              className="mt-2 text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              + Add first deliverable
            </button>
          </div>
        )}

        {deliverables.length > 0 && (
          <div className="space-y-1.5 mb-3">
            {deliverables.map((d) => (
              <div
                key={d.id}
                className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-colors ${
                  d.status === 'done'
                    ? 'bg-emerald-900/10 border-emerald-800/30'
                    : d.status === 'in_progress'
                    ? 'bg-blue-900/10 border-blue-800/30'
                    : 'bg-slate-700/20 border-slate-700/40'
                }`}
              >
                {/* Status toggle button */}
                <button
                  onClick={() => handleCycleStatus(d.id)}
                  className="flex-shrink-0 transition-colors"
                  title={`Status: ${d.status} — click to advance`}
                >
                  {d.status === 'done' ? (
                    <CheckCircle2 className="w-4.5 h-4.5 text-emerald-400" />
                  ) : d.status === 'in_progress' ? (
                    <Clock className="w-4.5 h-4.5 text-blue-400" />
                  ) : (
                    <Circle className="w-4.5 h-4.5 text-slate-500 group-hover:text-slate-300 transition-colors" />
                  )}
                </button>

                {/* Title */}
                <span
                  className={`flex-1 text-sm leading-tight ${
                    d.status === 'done' ? 'line-through text-slate-500' : 'text-slate-200'
                  }`}
                >
                  {d.title}
                </span>

                {/* Status badge */}
                {d.status === 'in_progress' && (
                  <span className="text-[10px] text-blue-400 font-medium flex-shrink-0">In Progress</span>
                )}

                {/* Deadline */}
                {d.deadline && (
                  <span className={`text-[11px] flex-shrink-0 ${deadlineColor(d.deadline)}`}>
                    {formatDeadline(d.deadline)}
                  </span>
                )}

                {/* Delete */}
                <button
                  onClick={() => handleDeleteDeliverable(d.id)}
                  className="opacity-0 group-hover:opacity-100 flex-shrink-0 p-1 rounded text-slate-600 hover:text-red-400 hover:bg-red-400/10 transition-all"
                  title="Delete deliverable"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add deliverable form */}
        {showAddDeliverable && (
          <div className="mt-3 p-3 bg-slate-700/30 border border-slate-600/50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <input
                ref={newTitleRef}
                type="text"
                placeholder="Deliverable title..."
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAddDeliverable(); if (e.key === 'Escape') setShowAddDeliverable(false); }}
                className="flex-1 bg-slate-700/50 border border-slate-600/50 rounded-lg px-3 py-1.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 transition-colors"
              />
              <input
                type="date"
                value={newDeadline}
                onChange={(e) => setNewDeadline(e.target.value)}
                className="w-36 bg-slate-700/50 border border-slate-600/50 rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500/50 transition-colors"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleAddDeliverable}
                disabled={!newTitle.trim()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-40"
              >
                <Plus className="w-3.5 h-3.5" />
                Add
              </button>
              <button
                onClick={() => { setShowAddDeliverable(false); setNewTitle(''); setNewDeadline(''); }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-600 hover:bg-slate-500 text-slate-300 rounded-lg text-xs font-medium transition-colors"
              >
                Cancel
              </button>
              <span className="text-[11px] text-slate-500 ml-1">Enter to add · Esc to cancel</span>
            </div>
          </div>
        )}
      </div>

      {/* ---- Attachments ---- */}
      <div
        className={`relative bg-slate-800/50 border rounded-xl p-5 transition-colors ${
          attachDragging ? 'border-emerald-500/60 bg-emerald-900/10' : 'border-slate-700/50'
        }`}
        onDragEnter={handleAttachDragEnter}
        onDragLeave={handleAttachDragLeave}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleAttachDrop}
      >
        {/* Drag overlay */}
        {attachDragging && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-xl bg-emerald-900/20 border-2 border-dashed border-emerald-500 pointer-events-none">
            <Upload className="w-7 h-7 text-emerald-400" />
            <p className="text-sm text-emerald-300 font-medium">Drop to attach</p>
          </div>
        )}

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Paperclip className="w-4 h-4 text-slate-400" />
            <h2 className="text-sm font-semibold text-white">Attachments</h2>
            {attachments.length > 0 && (
              <span className="text-xs text-slate-500 bg-slate-700/60 px-2 py-0.5 rounded-full">
                {attachments.length}
              </span>
            )}
            {uploading && <Loader2 className="w-3.5 h-3.5 text-slate-500 animate-spin" />}
          </div>
          <button
            onClick={() => attachFileInputRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-slate-700/60 transition-colors disabled:opacity-50"
          >
            <Upload className="w-3 h-3" />
            Upload
          </button>
          <input
            ref={attachFileInputRef}
            type="file"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleAttachmentUpload(file);
              e.target.value = '';
            }}
          />
        </div>

        {attachments.length === 0 && !uploading ? (
          <div className="text-center py-8">
            <Paperclip className="w-8 h-8 text-slate-700 mx-auto mb-2" />
            <p className="text-sm text-slate-500">No attachments yet</p>
            <p className="text-xs text-slate-600 mt-1">Drag & drop files here or click Upload</p>
          </div>
        ) : (
          <div className="space-y-3">
            {attachments.map((att) => (
              <div key={att.id} className="group bg-slate-700/30 border border-slate-700/40 rounded-lg p-3.5">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {att.mime_type?.startsWith('image/') ? (
                      <FileImage className="w-4 h-4 text-blue-400" />
                    ) : (
                      <FileText className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-slate-200 truncate">{att.original_name}</span>
                      {att.size && (
                        <span className="text-[11px] text-slate-500 flex-shrink-0">{formatFileSize(att.size)}</span>
                      )}
                      {att.mime_type && (
                        <span className="text-[10px] text-slate-600 flex-shrink-0 uppercase">{att.mime_type.split('/')[1]}</span>
                      )}
                    </div>
                    {att.summary ? (
                      <div className="mt-2 flex items-start gap-1.5">
                        <Sparkles className="w-3 h-3 text-purple-400 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-slate-400 leading-relaxed">{att.summary}</p>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleSummarize(att)}
                        disabled={!!summarizingId}
                        className="mt-2 inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-purple-400 transition-colors disabled:opacity-40"
                      >
                        {summarizingId === att.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Sparkles className="w-3 h-3" />
                        )}
                        {summarizingId === att.id ? 'Generating summary…' : 'Generate summary'}
                      </button>
                    )}
                    <p className="text-[11px] text-slate-600 mt-1.5">
                      {new Date(att.uploaded_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {att.summary && (
                      <button
                        onClick={() => handleSummarize(att)}
                        disabled={!!summarizingId}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded text-slate-500 hover:text-purple-400 hover:bg-purple-400/10 transition-all disabled:opacity-40"
                        title="Regenerate summary"
                      >
                        {summarizingId === att.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Sparkles className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                    <button
                      onClick={() => handleSendToAi(att)}
                      disabled={!!sendingToAiId}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded text-slate-500 hover:text-emerald-400 hover:bg-emerald-400/10 transition-all disabled:opacity-40"
                      title="Send to AI assistant"
                    >
                      {sendingToAiId === att.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Bot className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <a
                      href={`/api/crm/projects/${projectId}/attachments/${att.id}/download`}
                      download={att.original_name}
                      className="p-1.5 rounded text-slate-500 hover:text-white hover:bg-slate-600/60 transition-colors"
                      title="Download"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>
                    <button
                      onClick={() => handleDeleteAttachment(att.id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded text-slate-600 hover:text-red-400 hover:bg-red-400/10 transition-all"
                      title="Delete attachment"
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

      {/* ---- Social Content Ops callout ---- */}
      {(project.type === 'social_campaign' || project.type === 'content_production') && (
        <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-700/30 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <Zap className="w-4 h-4 text-purple-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-white mb-1">Social Content Ops Available</h3>
              <p className="text-xs text-slate-400 mb-3">
                This {project.type === 'social_campaign' ? 'social campaign' : 'content production'} project can be connected to Social Content Ops for automated content calendar, publishing workflows, and performance tracking.
              </p>
              <div className="flex flex-wrap gap-2">
                {['Content Calendar', 'Auto Publishing', 'Performance Tracking', 'Brand Guidelines'].map((feature) => (
                  <span key={feature} className="px-2 py-0.5 bg-purple-500/10 border border-purple-700/30 rounded text-xs text-purple-300">{feature}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---- Feedback ---- */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-semibold text-white">Feedback ({feedback.length})</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSyncEmails}
              disabled={syncing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 text-slate-200 rounded-lg text-xs font-medium hover:bg-slate-600 disabled:opacity-50 transition-colors"
            >
              {syncing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
              Sync Emails
            </button>
            <button
              onClick={fetchData}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 text-slate-200 rounded-lg text-xs font-medium hover:bg-slate-600 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </button>
          </div>
        </div>

        {syncResult && (
          <div className="mb-4 px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-xs text-slate-300">{syncResult}</div>
        )}

        {feedback.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 mb-2">No feedback recorded yet</p>
            <p className="text-xs text-slate-500">Sync emails or add feedback through the AI assistant.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {feedback.map((item) => (
              <div key={item.id} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 capitalize">{item.source}</span>
                    <span className="text-xs text-slate-600">|</span>
                    <span className="text-xs text-slate-500">{formatDate(item.date)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.sentiment && (
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium border ${SENTIMENT_COLORS[item.sentiment] ?? 'bg-slate-700 text-slate-300 border-slate-600'}`}>
                        {item.sentiment}
                      </span>
                    )}
                    <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-slate-700/50 text-slate-400 border border-slate-600">{item.status}</span>
                  </div>
                </div>
                <p className="text-sm text-slate-300 line-clamp-3">{item.raw_text}</p>
                {item.topics && item.topics.length > 0 && (
                  <div className="flex items-center gap-1.5 mt-2">
                    {item.topics.map((topic, idx) => (
                      <span key={idx} className="px-2 py-0.5 bg-slate-700 text-slate-300 rounded text-xs">{topic}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page wrapper
// ---------------------------------------------------------------------------
export default function ProjectDetailPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
        <span className="ml-3 text-slate-400 text-sm">Loading...</span>
      </div>
    }>
      <ProjectDetailInner />
    </Suspense>
  );
}
