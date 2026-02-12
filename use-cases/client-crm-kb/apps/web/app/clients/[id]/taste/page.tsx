'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { taste as tasteApi, clients as clientsApi } from '@/lib/api';
import type {
  Client,
  TasteExample,
  TasteExampleCreate,
  TasteExampleType,
  TasteExampleCategory,
} from '@/types';

const TYPES: TasteExampleType[] = [
  'campaign',
  'KV',
  'video',
  'social_post',
  'website',
  'copy',
];

const CATEGORIES: TasteExampleCategory[] = ['likes', 'dislikes'];

const TYPE_STYLES: Record<string, string> = {
  campaign: 'bg-orange-100 text-orange-700',
  KV: 'bg-pink-100 text-pink-700',
  video: 'bg-purple-100 text-purple-700',
  social_post: 'bg-blue-100 text-blue-700',
  website: 'bg-teal-100 text-teal-700',
  copy: 'bg-gray-100 text-gray-700',
};

export default function TasteExamplesPage() {
  const params = useParams();
  const clientId = params.id as string;
  const [client, setClient] = useState<Client | null>(null);
  const [examples, setExamples] = useState<TasteExample[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<TasteExampleType | ''>('');
  const [filterCategory, setFilterCategory] = useState<TasteExampleCategory | ''>('');
  const [showModal, setShowModal] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // New example form state
  const [newType, setNewType] = useState<TasteExampleType>('campaign');
  const [newCategory, setNewCategory] = useState<TasteExampleCategory>('likes');
  const [newMediaRef, setNewMediaRef] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newWhy, setNewWhy] = useState('');
  const [newTags, setNewTags] = useState('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [clientData, examplesData] = await Promise.all([
        clientsApi.get(clientId),
        tasteApi.list(clientId, filterCategory || undefined),
      ]);
      setClient(clientData);
      setExamples(examplesData);
    } catch {
      // Handle error
    } finally {
      setLoading(false);
    }
  }, [clientId, filterCategory]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredExamples = examples.filter((ex) => {
    if (filterType && ex.type !== filterType) return false;
    return true;
  });

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      const data: TasteExampleCreate = {
        client_id: clientId,
        type: newType,
        category: newCategory,
        media_ref: newMediaRef || null,
        description: newDescription || null,
        why_client_likes_or_dislikes: newWhy || null,
        tags: newTags
          ? newTags.split(',').map((t) => t.trim()).filter(Boolean)
          : null,
      };
      await tasteApi.create(clientId, data);
      setShowModal(false);
      resetForm();
      await loadData();
    } catch {
      // Handle error
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (exampleId: string) => {
    if (!confirm('Are you sure you want to delete this example?')) return;
    try {
      await tasteApi.delete(clientId, exampleId);
      await loadData();
    } catch {
      // Handle error
    }
  };

  const resetForm = () => {
    setNewType('campaign');
    setNewCategory('likes');
    setNewMediaRef('');
    setNewDescription('');
    setNewWhy('');
    setNewTags('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/clients" className="hover:text-blue-600 transition-colors">
          Clients
        </Link>
        <span>/</span>
        <Link
          href={`/clients/${clientId}`}
          className="hover:text-blue-600 transition-colors"
        >
          {client?.name || 'Client'}
        </Link>
        <span>/</span>
        <span className="text-gray-800 font-medium">Taste Examples</span>
      </nav>

      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Taste Examples</h1>
          <p className="mt-1 text-sm text-gray-500">
            Gallery of examples the client likes and dislikes for reference.
          </p>
        </div>
        <Button onClick={() => setShowModal(true)}>Add Example</Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-600">Type:</label>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as TasteExampleType | '')}
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Types</option>
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {t.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-600">Category:</label>
          <select
            value={filterCategory}
            onChange={(e) =>
              setFilterCategory(e.target.value as TasteExampleCategory | '')
            }
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <span className="text-sm text-gray-400">
          {filteredExamples.length} example{filteredExamples.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Grid */}
      {filteredExamples.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-12 text-center">
          <p className="text-gray-500 text-sm">
            No taste examples found. Add your first example to get started.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredExamples.map((example) => (
            <div
              key={example.id}
              className="rounded-lg border border-gray-200 bg-white overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Thumbnail area */}
              <div
                className="h-40 bg-gray-100 flex items-center justify-center cursor-pointer"
                onClick={() =>
                  setExpandedId(expandedId === example.id ? null : example.id)
                }
              >
                {example.media_ref ? (
                  <div className="text-center p-4">
                    <div className="text-2xl text-gray-400 mb-1">&#128247;</div>
                    <span className="text-xs text-gray-500 break-all">
                      {example.media_ref}
                    </span>
                  </div>
                ) : (
                  <div className="text-gray-300 text-4xl">&#128444;</div>
                )}
              </div>

              <div className="p-4 space-y-2">
                {/* Badges */}
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      TYPE_STYLES[example.type] || 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {example.type.replace(/_/g, ' ')}
                  </span>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      example.category === 'likes'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {example.category === 'likes' ? 'Like' : 'Dislike'}
                  </span>
                </div>

                {/* Description */}
                {example.description && (
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {example.description}
                  </p>
                )}

                {/* Tags */}
                {example.tags && example.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {example.tags.map((tag, i) => (
                      <span
                        key={i}
                        className="inline-block rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-500"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Expanded Details */}
                {expandedId === example.id && (
                  <div className="border-t border-gray-100 pt-3 mt-3 space-y-2">
                    {example.why_client_likes_or_dislikes && (
                      <div>
                        <h4 className="text-xs font-medium text-gray-500">
                          Why the client {example.category === 'likes' ? 'likes' : 'dislikes'} this
                        </h4>
                        <p className="text-sm text-gray-700">
                          {example.why_client_likes_or_dislikes}
                        </p>
                      </div>
                    )}
                    <div className="text-xs text-gray-400">
                      Added: {new Date(example.added_at).toLocaleDateString()}
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(example.id)}
                      className="w-full"
                    >
                      Delete Example
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Example Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Add Taste Example</h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                &#10005;
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Type</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as TasteExampleType)}
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t.replace(/_/g, ' ')}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) =>
                      setNewCategory(e.target.value as TasteExampleCategory)
                    }
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">
                  Media Reference (URL)
                </label>
                <Input
                  value={newMediaRef}
                  onChange={(e) => setNewMediaRef(e.target.value)}
                  placeholder="https://example.com/image.png"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Description</label>
                <Textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Describe this example..."
                  rows={3}
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">
                  Why does the client {newCategory === 'likes' ? 'like' : 'dislike'} this?
                </label>
                <Textarea
                  value={newWhy}
                  onChange={(e) => setNewWhy(e.target.value)}
                  placeholder="Explain the reason..."
                  rows={2}
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">
                  Tags (comma-separated)
                </label>
                <Input
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                  placeholder="minimal, bold, colorful"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={submitting}>
                  {submitting ? 'Adding...' : 'Add Example'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
