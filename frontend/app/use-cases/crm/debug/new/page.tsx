'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bug,
  ArrowLeft,
  Play,
  Loader2,
  Globe,
  Palette,
  Video,
  Share2,
  Bot,
  FileText,
  Box,
  CheckSquare,
  Square,
} from 'lucide-react';
import {
  crmApi,
  type Brand,
  type Project,
  type DebugModule,
  type DebugSubjectType,
} from '@/lib/crm-kb-api';
import Link from 'next/link';
import { useCrmAi } from '../../context';

// ---------------------------------------------------------------------------
// Subject type config
// ---------------------------------------------------------------------------

const subjectTypes: Array<{
  value: DebugSubjectType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { value: 'web_page', label: 'Web Page', icon: Globe },
  { value: 'design', label: 'Design', icon: Palette },
  { value: 'video', label: 'Video', icon: Video },
  { value: 'social_post', label: 'Social Post', icon: Share2 },
  { value: 'agent_workflow', label: 'Agent Workflow', icon: Bot },
  { value: 'document', label: 'Document', icon: FileText },
  { value: 'other', label: 'Other', icon: Box },
];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function NewDebugSessionPage() {
  const router = useRouter();
  const { setPageState } = useCrmAi();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [modules, setModules] = useState<DebugModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedProject, setSelectedProject] = useState('');
  const [subjectType, setSubjectType] = useState<DebugSubjectType>('web_page');
  const [subjectRef, setSubjectRef] = useState('');
  const [selectedModules, setSelectedModules] = useState<Set<string>>(new Set());
  const [traceEnabled, setTraceEnabled] = useState(false);

  // Load initial data
  useEffect(() => {
    async function load() {
      try {
        const [brandsRes, modulesRes] = await Promise.all([
          crmApi.brands.list({ size: 100 }),
          crmApi.debug.modules(),
        ]);
        setBrands(brandsRes.items);
        setModules(modulesRes);
      } catch (err) {
        setError('Failed to load data. Make sure the CRM API is running.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Load projects when client changes
  useEffect(() => {
    if (!selectedClient) {
      setProjects([]);
      setSelectedProject('');
      return;
    }
    crmApi.brands.projects(selectedClient, { size: 100 }).then((res) => {
      setProjects(res.items);
      if (res.items.length > 0) {
        setSelectedProject(res.items[0].id);
      }
    }).catch(() => {
      setProjects([]);
    });
  }, [selectedClient]);

  // Auto-select applicable modules when subject type changes
  useEffect(() => {
    const applicable = modules
      .filter(
        (m) =>
          m.applicable_subject_types &&
          m.applicable_subject_types.includes(subjectType)
      )
      .map((m) => m.id);
    setSelectedModules(new Set(applicable));
  }, [subjectType, modules]);

  const toggleModule = (moduleId: string) => {
    setSelectedModules((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) {
        next.delete(moduleId);
      } else {
        next.add(moduleId);
      }
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!selectedClient || !selectedProject || selectedModules.size === 0) {
      setError('Please select a client, project, and at least one module.');
      return;
    }

    setRunning(true);
    setError(null);

    try {
      // Create session
      const session = await crmApi.debug.createSession({
        client_id: selectedClient,
        project_id: selectedProject,
        subject_type: subjectType,
        subject_ref: subjectRef || undefined,
        module_ids: Array.from(selectedModules),
        trace_enabled: traceEnabled,
      });

      // Run the session
      await crmApi.debug.runSession(session.id);

      // Navigate to the session detail page
      router.push(`/use-cases/crm/debug/${session.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create debug session');
      setRunning(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/use-cases/crm/debug"
          className="flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Debug Sessions
        </Link>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <Bug className="w-7 h-7 text-amber-400" />
          New Debug Session
        </h1>
        <p className="text-slate-400 mt-1">
          Select a deliverable and choose which QA modules to run
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* Client & Project Selection */}
      <div className="bg-slate-800/60 rounded-xl border border-slate-700/50 p-6 space-y-4">
        <h2 className="text-base font-semibold text-white">1. Select Client & Project</h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1.5">Client</label>
            <select
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500"
            >
              <option value="">Select a client...</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1.5">Project</label>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              disabled={!selectedClient}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500 disabled:opacity-40"
            >
              <option value="">Select a project...</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Subject Type */}
      <div className="bg-slate-800/60 rounded-xl border border-slate-700/50 p-6 space-y-4">
        <h2 className="text-base font-semibold text-white">2. What are you debugging?</h2>

        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {subjectTypes.map((st) => {
            const Icon = st.icon;
            const selected = subjectType === st.value;
            return (
              <button
                key={st.value}
                onClick={() => setSubjectType(st.value)}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border text-sm transition-colors ${
                  selected
                    ? 'bg-amber-600/20 border-amber-500/50 text-amber-300'
                    : 'bg-slate-900/50 border-slate-700/50 text-slate-400 hover:border-slate-600'
                }`}
              >
                <Icon className="w-5 h-5" />
                {st.label}
              </button>
            );
          })}
        </div>

        <div>
          <label className="block text-sm text-slate-400 mb-1.5">
            Reference (URL, file path, or description)
          </label>
          <input
            type="text"
            value={subjectRef}
            onChange={(e) => setSubjectRef(e.target.value)}
            placeholder={subjectType === 'web_page' ? 'https://example.com/page' : 'Enter reference...'}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Module Selection */}
      <div className="bg-slate-800/60 rounded-xl border border-slate-700/50 p-6 space-y-4">
        <h2 className="text-base font-semibold text-white">3. Select Debug Modules</h2>
        <p className="text-xs text-slate-500">Applicable modules are pre-selected based on subject type</p>

        <div className="space-y-2">
          {modules.map((m) => {
            const isApplicable =
              m.applicable_subject_types &&
              m.applicable_subject_types.includes(subjectType);
            const isSelected = selectedModules.has(m.id);
            const CheckIcon = isSelected ? CheckSquare : Square;

            return (
              <button
                key={m.id}
                onClick={() => toggleModule(m.id)}
                className={`w-full flex items-start gap-3 p-3 rounded-lg border text-left transition-colors ${
                  isSelected
                    ? 'bg-amber-600/10 border-amber-500/30'
                    : 'bg-slate-900/30 border-slate-700/30 hover:border-slate-600'
                } ${!isApplicable ? 'opacity-50' : ''}`}
              >
                <CheckIcon
                  className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                    isSelected ? 'text-amber-400' : 'text-slate-600'
                  }`}
                />
                <div>
                  <div className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-slate-400'}`}>
                    {m.name}
                    {!isApplicable && (
                      <span className="ml-2 text-xs text-slate-600">(not applicable for {subjectType.replace(/_/g, ' ')})</span>
                    )}
                  </div>
                  {m.description && (
                    <div className="text-xs text-slate-500 mt-0.5">{m.description}</div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Options */}
      <div className="bg-slate-800/60 rounded-xl border border-slate-700/50 p-6">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={traceEnabled}
            onChange={(e) => setTraceEnabled(e.target.checked)}
            className="w-4 h-4 rounded border-slate-600 bg-slate-900 text-amber-500 focus:ring-amber-500"
          />
          <div>
            <span className="text-sm text-white font-medium">Enable Trace Mode</span>
            <span className="block text-xs text-slate-500">Record detailed execution steps (LLM calls, tool calls) for debugging the debugger</span>
          </div>
        </label>
      </div>

      {/* Submit */}
      <div className="flex items-center justify-end gap-3">
        <Link
          href="/use-cases/crm/debug"
          className="px-4 py-2.5 text-slate-400 hover:text-white text-sm font-medium transition-colors"
        >
          Cancel
        </Link>
        <button
          onClick={handleSubmit}
          disabled={running || !selectedClient || !selectedProject || selectedModules.size === 0}
          className="flex items-center gap-2 px-6 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {running ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Running Debug...
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              Run Debug Session
            </>
          )}
        </button>
      </div>
    </div>
  );
}
