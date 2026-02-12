'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { BrandProfileForm } from '@/components/brand/BrandProfileForm';
import { clients as clientsApi } from '@/lib/api';
import type { Client } from '@/types';

export default function BrandProfilePage() {
  const params = useParams();
  const clientId = params.id as string;
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadClient() {
      try {
        const data = await clientsApi.get(clientId);
        setClient(data);
      } catch {
        // Client not found
      } finally {
        setLoading(false);
      }
    }
    loadClient();
  }, [clientId]);

  if (loading) {
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
        <Link
          href={`/clients/${clientId}`}
          className="hover:text-blue-600 transition-colors"
        >
          {client?.name || 'Client'}
        </Link>
        <span>/</span>
        <span className="text-gray-800 font-medium">Brand Profile</span>
      </nav>

      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Brand Profile Setup</h1>
        <p className="mt-1 text-sm text-gray-500">
          Define the brand guidelines, tone, visual rules, and reference documents for{' '}
          {client?.name || 'this client'}.
        </p>
      </div>

      {/* Brand Profile Form */}
      <BrandProfileForm clientId={clientId} />
    </div>
  );
}
