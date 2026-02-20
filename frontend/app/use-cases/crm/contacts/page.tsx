'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Loader2, AlertCircle, Mail, Phone, Linkedin, ExternalLink, Trash2 } from 'lucide-react';
import { crmApi } from '@/lib/crm-kb-api';

interface Contact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  title?: string;
  department?: string;
  linkedin_url?: string;
  linkedin_data?: any;
  research_data?: any;
  created_at?: string;
}

interface Client {
  id: string;
  name: string;
}

export default function ContactsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadClients();
  }, []);

  useEffect(() => {
    if (selectedClientId) {
      loadContacts();
    }
  }, [selectedClientId]);

  const loadClients = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/crm/brands');
      if (!res.ok) throw new Error('Failed to load brands');
      const data = await res.json();
      const brands = data.brands || data.data || [];
      setClients(brands);
      if (brands.length > 0 && !selectedClientId) {
        setSelectedClientId(brands[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load brands');
      console.error('Error loading clients:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadContacts = async () => {
    if (!selectedClientId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/crm/contacts/${selectedClientId}`);
      if (!res.ok) throw new Error('Failed to load contacts');
      const data = await res.json();
      setContacts(data.contacts || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load contacts');
      console.error('Error loading contacts:', err);
    } finally {
      setLoading(false);
    }
  };

  const deleteContact = async (contactId: string) => {
    if (!confirm('Delete this contact?')) return;
    try {
      const res = await fetch(`/api/crm/contacts/${selectedClientId}/${contactId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete contact');
      setContacts(contacts.filter(c => c.id !== contactId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete contact');
    }
  };

  const selectedClient = clients.find(c => c.id === selectedClientId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Contacts</h1>
          <p className="text-sm text-slate-400 mt-1">Manage people and stakeholders</p>
        </div>
        {selectedClientId && (
          <Link
            href={`/use-cases/crm/contacts/new?clientId=${selectedClientId}`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-500 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Contact
          </Link>
        )}
      </div>

      {/* Brand selector */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
        <label className="block text-sm font-medium text-slate-400 mb-2">Select Brand/Client</label>
        <select
          value={selectedClientId}
          onChange={(e) => setSelectedClientId(e.target.value)}
          className="w-full px-3 py-2 bg-slate-900 border border-slate-700/50 rounded-lg text-white focus:outline-none focus:border-emerald-500"
        >
          <option value="">Choose a brand...</option>
          {clients.map(client => (
            <option key={client.id} value={client.id}>
              {client.name}
            </option>
          ))}
        </select>
      </div>

      {/* Error state */}
      {error && (
        <div className="flex items-center gap-3 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
        </div>
      )}

      {/* Contacts list */}
      {!loading && selectedClientId && (
        <>
          {contacts.length === 0 ? (
            <div className="py-12 text-center border border-dashed border-slate-700/50 rounded-lg">
              <p className="text-slate-400 mb-4">No contacts yet for {selectedClient?.name}</p>
              {selectedClientId && (
                <Link
                  href={`/use-cases/crm/contacts/new?clientId=${selectedClientId}`}
                  className="text-emerald-400 hover:underline text-sm"
                >
                  Create the first contact
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {contacts.map(contact => (
                <Link
                  key={contact.id}
                  href={`/use-cases/crm/contacts/detail?id=${contact.id}`}
                  className="block bg-slate-800/60 border border-slate-700/50 rounded-xl p-4 hover:border-slate-600 hover:bg-slate-800 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-white">{contact.name}</h3>
                      {contact.title && (
                        <p className="text-sm text-slate-400 mt-1">
                          {contact.title}
                          {contact.department && ` • ${contact.department}`}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-2 flex-wrap">
                        {contact.email && (
                          <a
                            href={`mailto:${contact.email}`}
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-300"
                          >
                            <Mail className="w-3 h-3" />
                            {contact.email}
                          </a>
                        )}
                        {contact.phone && (
                          <a
                            href={`tel:${contact.phone}`}
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-300"
                          >
                            <Phone className="w-3 h-3" />
                            {contact.phone}
                          </a>
                        )}
                        {contact.linkedin_url && (
                          <a
                            href={contact.linkedin_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300"
                          >
                            <Linkedin className="w-3 h-3" />
                            LinkedIn
                          </a>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        deleteContact(contact.id);
                      }}
                      className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
