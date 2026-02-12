'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  feedback as feedbackApi,
  clients as clientsApi,
  projects as projectsApi,
} from '@/lib/api';
import type { Client, Project, FeedbackSource, FeedbackCreate } from '@/types';

const SOURCES: { value: FeedbackSource; label: string }[] = [
  { value: 'email', label: 'Email' },
  { value: 'meeting_notes', label: 'Meeting Notes' },
  { value: 'form', label: 'Form' },
  { value: 'chat', label: 'Chat' },
  { value: 'phone', label: 'Phone' },
  { value: 'other', label: 'Other' },
];

export default function NewFeedbackPage() {
  const router = useRouter();
  const [allClients, setAllClients] = useState<Client[]>([]);
  const [clientProjects, setClientProjects] = useState<Project[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form fields
  const [clientId, setClientId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [source, setSource] = useState<FeedbackSource>('email');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [rawText, setRawText] = useState('');
  const [analyzeAfterSubmit, setAnalyzeAfterSubmit] = useState(false);

  useEffect(() => {
    async function loadClients() {
      try {
        const res = await clientsApi.list({ size: 100 });
        setAllClients(res.items);
      } catch {
        // Handle error
      } finally {
        setLoadingClients(false);
      }
    }
    loadClients();
  }, []);

  const loadProjects = useCallback(async (selectedClientId: string) => {
    if (!selectedClientId) {
      setClientProjects([]);
      return;
    }
    try {
      setLoadingProjects(true);
      const res = await projectsApi.list({ client_id: selectedClientId, size: 100 });
      setClientProjects(res.items);
    } catch {
      setClientProjects([]);
    } finally {
      setLoadingProjects(false);
    }
  }, []);

  const handleClientChange = (newClientId: string) => {
    setClientId(newClientId);
    setProjectId('');
    loadProjects(newClientId);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!clientId) {
      setError('Please select a client.');
      return;
    }
    if (!rawText.trim()) {
      setError('Please enter the feedback text.');
      return;
    }

    try {
      setSubmitting(true);
      const data: FeedbackCreate = {
        client_id: clientId,
        project_id: projectId || null,
        source,
        date,
        raw_text: rawText,
      };
      const created = await feedbackApi.create(data);

      if (analyzeAfterSubmit) {
        try {
          await feedbackApi.analyze(created.id);
        } catch {
          // Analysis may fail but feedback was still created
        }
      }

      router.push(`/feedback/${created.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/feedback" className="hover:text-blue-600 transition-colors">
          Feedback
        </Link>
        <span>/</span>
        <span className="text-gray-800 font-medium">Log New Feedback</span>
      </nav>

      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Log New Feedback</h1>
        <p className="mt-1 text-sm text-gray-500">
          Record client feedback from any source for analysis and rule extraction.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 p-4 text-sm text-red-700 mb-6">
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Client Selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Client <span className="text-red-500">*</span>
          </label>
          {loadingClients ? (
            <div className="h-10 rounded-md border border-gray-200 bg-gray-50 animate-pulse" />
          ) : (
            <select
              value={clientId}
              onChange={(e) => handleClientChange(e.target.value)}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select a client...</option>
              {allClients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Project Selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Project <span className="text-gray-400">(optional)</span>
          </label>
          {loadingProjects ? (
            <div className="h-10 rounded-md border border-gray-200 bg-gray-50 animate-pulse" />
          ) : (
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={!clientId}
            >
              <option value="">No project / General</option>
              {clientProjects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          )}
          {!clientId && (
            <p className="text-xs text-gray-400">Select a client first to see projects.</p>
          )}
        </div>

        {/* Source */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Source</label>
          <select
            value={source}
            onChange={(e) => setSource(e.target.value as FeedbackSource)}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {SOURCES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        {/* Date */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Date</label>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>

        {/* Raw Text */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Feedback Text <span className="text-red-500">*</span>
          </label>
          <Textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder="Paste or type the full feedback text here..."
            rows={10}
            required
          />
          <p className="text-xs text-gray-400">
            Include the full content of the feedback. This will be used for AI analysis.
          </p>
        </div>

        {/* Analyze checkbox */}
        <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
          <input
            type="checkbox"
            id="analyze"
            checked={analyzeAfterSubmit}
            onChange={(e) => setAnalyzeAfterSubmit(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="analyze" className="text-sm text-gray-700">
            Analyze with AI after submitting
          </label>
          <span className="text-xs text-gray-400">
            Automatically run sentiment analysis and extract requirements
          </span>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
          <Link href="/feedback">
            <Button variant="outline" type="button">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={submitting}>
            {submitting ? (
              <span className="flex items-center gap-2">
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Submitting...
              </span>
            ) : (
              'Submit Feedback'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
