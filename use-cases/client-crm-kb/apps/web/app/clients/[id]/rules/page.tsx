'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RuleCard } from '@/components/rules/RuleCard';
import { rules as rulesApi, clients as clientsApi } from '@/lib/api';
import type {
  Client,
  ClientRule,
  ClientRuleCreate,
  RuleType,
  RuleStatus,
} from '@/types';

const RULE_TYPES: RuleType[] = ['hard', 'soft'];
const RULE_STATUSES: RuleStatus[] = ['active', 'deprecated'];

export default function ClientRulesPage() {
  const params = useParams();
  const clientId = params.id as string;
  const [client, setClient] = useState<Client | null>(null);
  const [rulesList, setRulesList] = useState<ClientRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // Filters
  const [filterType, setFilterType] = useState<RuleType | ''>('');
  const [filterStatus, setFilterStatus] = useState<RuleStatus | ''>('active');

  // New rule form
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newDescription, setNewDescription] = useState('');
  const [newRuleType, setNewRuleType] = useState<RuleType>('soft');
  const [newAppliesTo, setNewAppliesTo] = useState('');
  const [newPriority, setNewPriority] = useState(5);

  // Edit/deprecate state
  const [deprecatingId, setDeprecatingId] = useState<string | null>(null);
  const [deprecateReason, setDeprecateReason] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDescription, setEditDescription] = useState('');
  const [editRuleType, setEditRuleType] = useState<RuleType>('soft');
  const [editAppliesTo, setEditAppliesTo] = useState('');
  const [editPriority, setEditPriority] = useState(5);

  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [clientData, rulesData] = await Promise.all([
        clientsApi.get(clientId),
        rulesApi.list({
          client_id: clientId,
          rule_type: filterType || undefined,
          status: filterStatus || undefined,
          page,
          size: pageSize,
        }),
      ]);
      setClient(clientData);
      setRulesList(rulesData.items);
      setTotal(rulesData.total);
    } catch {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [clientId, filterType, filterStatus, page]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateRule = async () => {
    if (!newDescription.trim()) {
      setError('Description is required');
      return;
    }
    try {
      setSubmitting(true);
      setError(null);
      const data: ClientRuleCreate = {
        client_id: clientId,
        description: newDescription,
        rule_type: newRuleType,
        applies_to: newAppliesTo
          ? newAppliesTo.split(',').map((t) => t.trim()).filter(Boolean)
          : undefined,
        priority: newPriority,
      };
      await rulesApi.create(data);
      setShowForm(false);
      setNewDescription('');
      setNewAppliesTo('');
      setNewPriority(5);
      setNewRuleType('soft');
      setSuccessMessage('Rule created!');
      setTimeout(() => setSuccessMessage(null), 3000);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create rule');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeprecate = async () => {
    if (!deprecatingId) return;
    try {
      setError(null);
      await rulesApi.deprecate(deprecatingId, deprecateReason);
      setDeprecatingId(null);
      setDeprecateReason('');
      setSuccessMessage('Rule deprecated.');
      setTimeout(() => setSuccessMessage(null), 3000);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to deprecate rule');
    }
  };

  const handleEdit = async () => {
    if (!editingId || !editDescription.trim()) return;
    try {
      setError(null);
      await rulesApi.update(editingId, {
        description: editDescription,
        rule_type: editRuleType,
        applies_to: editAppliesTo
          ? editAppliesTo.split(',').map((t) => t.trim()).filter(Boolean)
          : undefined,
        priority: editPriority,
      });
      setEditingId(null);
      setSuccessMessage('Rule updated.');
      setTimeout(() => setSuccessMessage(null), 3000);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update rule');
    }
  };

  const openEdit = (rule: ClientRule) => {
    setEditingId(rule.id);
    setEditDescription(rule.description);
    setEditRuleType(rule.rule_type);
    setEditAppliesTo(rule.applies_to?.join(', ') || '');
    setEditPriority(rule.priority);
  };

  const totalPages = Math.ceil(total / pageSize);

  if (loading && !rulesList.length) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/clients" className="hover:text-blue-600 transition-colors">
          Clients
        </Link>
        <span>/</span>
        <Link href={`/clients/${clientId}`} className="hover:text-blue-600 transition-colors">
          {client?.name || 'Client'}
        </Link>
        <span>/</span>
        <span className="text-gray-800 font-medium">Rules</span>
      </nav>

      {/* Messages */}
      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 p-4 text-sm text-red-700 mb-6">
          {error}
        </div>
      )}
      {successMessage && (
        <div className="rounded-md bg-green-50 border border-green-200 p-4 text-sm text-green-700 mb-6">
          {successMessage}
        </div>
      )}

      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Client Rules</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage rules for {client?.name || 'this client'} — {total} total rules.
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : 'Add New Rule'}
        </Button>
      </div>

      {/* Add New Rule Form */}
      {showForm && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-6 mb-6 space-y-4">
          <h3 className="font-semibold text-gray-800">New Rule</h3>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Description</label>
            <Textarea
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Describe the rule..."
              rows={3}
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Type</label>
              <select
                value={newRuleType}
                onChange={(e) => setNewRuleType(e.target.value as RuleType)}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
              >
                {RULE_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Priority (1-10)</label>
              <Input
                type="number"
                min={1}
                max={10}
                value={newPriority}
                onChange={(e) => setNewPriority(Number(e.target.value))}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Applies To</label>
              <Input
                value={newAppliesTo}
                onChange={(e) => setNewAppliesTo(e.target.value)}
                placeholder="social, video, copy"
              />
              <span className="text-xs text-gray-400">Comma-separated</span>
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleCreateRule} disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Rule'}
            </Button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-600">Type:</label>
          <select
            value={filterType}
            onChange={(e) => {
              setFilterType(e.target.value as RuleType | '');
              setPage(1);
            }}
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm"
          >
            <option value="">All</option>
            {RULE_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-600">Status:</label>
          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value as RuleStatus | '');
              setPage(1);
            }}
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm"
          >
            <option value="">All</option>
            {RULE_STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Rules List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
        </div>
      ) : rulesList.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-12 text-center">
          <p className="text-gray-500 text-sm">No rules found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rulesList.map((rule) => (
            <RuleCard
              key={rule.id}
              rule={rule}
              onEdit={() => openEdit(rule)}
              onDeprecate={() => {
                setDeprecatingId(rule.id);
                setDeprecateReason('');
              }}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-gray-500">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
          >
            Next
          </Button>
        </div>
      )}

      {/* Deprecate Modal */}
      {deprecatingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl mx-4">
            <h2 className="text-lg font-semibold mb-4">Deprecate Rule</h2>
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Reason</label>
                <Textarea
                  value={deprecateReason}
                  onChange={(e) => setDeprecateReason(e.target.value)}
                  placeholder="Why is this rule being deprecated?"
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setDeprecatingId(null)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleDeprecate}>
                  Deprecate
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl mx-4">
            <h2 className="text-lg font-semibold mb-4">Edit Rule</h2>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Description</label>
                <Textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Type</label>
                  <select
                    value={editRuleType}
                    onChange={(e) => setEditRuleType(e.target.value as RuleType)}
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                  >
                    {RULE_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Priority</label>
                  <Input
                    type="number"
                    min={1}
                    max={10}
                    value={editPriority}
                    onChange={(e) => setEditPriority(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Applies To</label>
                  <Input
                    value={editAppliesTo}
                    onChange={(e) => setEditAppliesTo(e.target.value)}
                    placeholder="social, video, copy"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setEditingId(null)}>
                  Cancel
                </Button>
                <Button onClick={handleEdit}>Save Changes</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
