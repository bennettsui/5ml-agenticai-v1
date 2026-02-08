'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Save, X, Loader2, ArrowLeft } from 'lucide-react';
import { crmApi, type ClientCreate, type ClientStatus, type ClientValueTier } from '@/lib/crm-kb-api';

const STATUS_OPTIONS: ClientStatus[] = ['prospect', 'active', 'dormant', 'lost'];
const VALUE_TIER_OPTIONS: ClientValueTier[] = ['A', 'B', 'C', 'D'];

export default function NewClientPage() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [legalName, setLegalName] = useState('');
  const [industry, setIndustry] = useState('');
  const [region, setRegion] = useState('');
  const [status, setStatus] = useState<ClientStatus>('prospect');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [companySize, setCompanySize] = useState('');
  const [valueTier, setValueTier] = useState<ClientValueTier | ''>('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);

  function parseCommaSeparated(value: string): string[] | undefined {
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    return trimmed
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNameError(null);

    // Validate
    if (!name.trim()) {
      setNameError('Client name is required.');
      return;
    }

    const data: ClientCreate = {
      name: name.trim(),
      legal_name: legalName.trim() || null,
      industry: parseCommaSeparated(industry) ?? null,
      region: parseCommaSeparated(region) ?? null,
      status,
      website_url: websiteUrl.trim() || null,
      company_size: companySize.trim() || null,
      client_value_tier: valueTier || null,
    };

    setSubmitting(true);
    try {
      await crmApi.clients.create(data);
      router.push('/use-cases/crm/clients');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create client');
    } finally {
      setSubmitting(false);
    }
  }

  const inputClasses =
    'w-full px-3 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm';
  const labelClasses = 'block text-sm font-medium text-slate-300 mb-1.5';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-slate-400 mb-4">
            <Link
              href="/use-cases/crm/clients"
              className="hover:text-white transition-colors inline-flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Clients
            </Link>
            <span className="text-slate-600">/</span>
            <span className="text-slate-300">New Client</span>
          </nav>

          <h1 className="text-2xl font-bold text-white">Create New Client</h1>
          <p className="text-slate-400 text-sm mt-1">
            Fill in the details below to add a new client to the CRM.
          </p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Banner */}
        {error && (
          <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 mb-6">
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-md p-6 space-y-6">
            {/* Name (required) */}
            <div>
              <label htmlFor="name" className={labelClasses}>
                Name <span className="text-red-400">*</span>
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (nameError) setNameError(null);
                }}
                placeholder="e.g. Acme Corp"
                className={`${inputClasses} ${nameError ? 'ring-2 ring-red-500 border-transparent' : ''}`}
              />
              {nameError && (
                <p className="mt-1 text-xs text-red-400">{nameError}</p>
              )}
            </div>

            {/* Legal Name */}
            <div>
              <label htmlFor="legalName" className={labelClasses}>
                Legal Name
              </label>
              <input
                id="legalName"
                type="text"
                value={legalName}
                onChange={(e) => setLegalName(e.target.value)}
                placeholder="Official registered name (optional)"
                className={inputClasses}
              />
            </div>

            {/* Two-column row: Industry + Region */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label htmlFor="industry" className={labelClasses}>
                  Industry
                </label>
                <input
                  id="industry"
                  type="text"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  placeholder="e.g. Tech, SaaS, Healthcare"
                  className={inputClasses}
                />
                <p className="mt-1 text-xs text-slate-500">Comma-separated</p>
              </div>
              <div>
                <label htmlFor="region" className={labelClasses}>
                  Region
                </label>
                <input
                  id="region"
                  type="text"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  placeholder="e.g. North America, EMEA"
                  className={inputClasses}
                />
                <p className="mt-1 text-xs text-slate-500">Comma-separated</p>
              </div>
            </div>

            {/* Two-column row: Status + Value Tier */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label htmlFor="status" className={labelClasses}>
                  Status
                </label>
                <select
                  id="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ClientStatus)}
                  className={inputClasses}
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="valueTier" className={labelClasses}>
                  Value Tier
                </label>
                <select
                  id="valueTier"
                  value={valueTier}
                  onChange={(e) => setValueTier(e.target.value as ClientValueTier | '')}
                  className={inputClasses}
                >
                  <option value="">-- None --</option>
                  {VALUE_TIER_OPTIONS.map((t) => (
                    <option key={t} value={t}>
                      Tier {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Two-column row: Website URL + Company Size */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label htmlFor="websiteUrl" className={labelClasses}>
                  Website URL
                </label>
                <input
                  id="websiteUrl"
                  type="url"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="https://example.com"
                  className={inputClasses}
                />
              </div>
              <div>
                <label htmlFor="companySize" className={labelClasses}>
                  Company Size
                </label>
                <input
                  id="companySize"
                  type="text"
                  value={companySize}
                  onChange={(e) => setCompanySize(e.target.value)}
                  placeholder="e.g. 50-100, 500+"
                  className={inputClasses}
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 mt-6">
            <Link
              href="/use-cases/crm/clients"
              className="inline-flex items-center gap-2 px-4 py-2.5 border border-slate-600 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors text-sm font-medium"
            >
              <X className="w-4 h-4" />
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Create Client
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
