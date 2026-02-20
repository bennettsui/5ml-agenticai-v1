'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Loader2, AlertCircle, Mail, Phone, Linkedin, Edit2, Save, X } from 'lucide-react';
import Link from 'next/link';

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
  notes?: string;
  created_at?: string;
}

interface LinkedInData {
  headline?: string;
  about?: string;
  followers?: number;
  experience?: any[];
  education?: any[];
}

interface ResearchData {
  bio?: string;
  recentNews?: any[];
  onlinePresence?: string[];
  summary?: string;
}

function ContactDetailPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const contactId = searchParams.get('id') as string;

  const [contact, setContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Contact | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadContact();
  }, [contactId]);

  const loadContact = async () => {
    try {
      setLoading(true);
      setError(null);

      // First try to get from URL without clientId
      const res = await fetch(`/api/crm/contacts/unknown/${contactId}`);
      if (!res.ok && res.status === 404) {
        // Try alternative endpoint
        const allContactsRes = await fetch(`/api/crm/brands`);
        if (allContactsRes.ok) {
          const brandsData = await allContactsRes.json();
          const brands = brandsData.brands || brandsData.data || [];

          for (const brand of brands) {
            const contactRes = await fetch(`/api/crm/contacts/${brand.id}/${contactId}`);
            if (contactRes.ok) {
              const contactData = await contactRes.json();
              setContact(contactData);
              setFormData(contactData);
              return;
            }
          }
          throw new Error('Contact not found');
        }
      } else if (res.ok) {
        const data = await res.json();
        setContact(data);
        setFormData(data);
      } else {
        throw new Error('Failed to load contact');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load contact');
      console.error('Error loading contact:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!formData) return;
    const { name, value } = e.target;
    setFormData(prev => prev ? { ...prev, [name]: value } : null);
  };

  const handleSave = async () => {
    if (!contact || !formData) return;

    try {
      setIsSaving(true);
      setError(null);

      // We need to find the client ID - try common patterns
      const res = await fetch(`/api/crm/contacts/unknown/${contactId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error('Failed to update contact');

      setContact(formData);
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update contact');
      console.error('Error updating contact:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData(contact);
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="max-w-2xl mx-auto">
        <Link
          href="/use-cases/crm/contacts"
          className="flex items-center gap-2 text-slate-400 hover:text-white mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Contacts
        </Link>
        <div className="flex items-center gap-3 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error || 'Contact not found'}
        </div>
      </div>
    );
  }

  const linkedinData: LinkedInData = typeof contact.linkedin_data === 'string'
    ? JSON.parse(contact.linkedin_data)
    : contact.linkedin_data || {};

  const researchData: ResearchData = typeof contact.research_data === 'string'
    ? JSON.parse(contact.research_data)
    : contact.research_data || {};

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/use-cases/crm/contacts"
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">{contact.name}</h1>
            {contact.title && (
              <p className="text-sm text-slate-400 mt-1">{contact.title}</p>
            )}
          </div>
        </div>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={handleCancel}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="p-2 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded-lg transition-colors disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            </button>
          </div>
        )}
      </div>

      {/* Error state */}
      {error && (
        <div className="flex items-center gap-3 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Contact Info Card */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-6 space-y-4">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Contact Information</h2>

        {isEditing && formData ? (
          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2">Full Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700/50 rounded-lg text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Email & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700/50 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2">Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700/50 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Title & Department */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2">Job Title</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700/50 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2">Department</label>
                <input
                  type="text"
                  name="department"
                  value={formData.department || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700/50 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* LinkedIn URL */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2">LinkedIn URL</label>
              <input
                type="url"
                name="linkedin_url"
                value={formData.linkedin_url || ''}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700/50 rounded-lg text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2">Notes</label>
              <textarea
                name="notes"
                value={formData.notes || ''}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700/50 rounded-lg text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 flex-wrap">
              {contact.email && (
                <a
                  href={`mailto:${contact.email}`}
                  className="flex items-center gap-2 px-3 py-1.5 bg-slate-900/50 rounded-lg text-slate-300 hover:text-white text-sm transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  {contact.email}
                </a>
              )}
              {contact.phone && (
                <a
                  href={`tel:${contact.phone}`}
                  className="flex items-center gap-2 px-3 py-1.5 bg-slate-900/50 rounded-lg text-slate-300 hover:text-white text-sm transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  {contact.phone}
                </a>
              )}
              {contact.linkedin_url && (
                <a
                  href={contact.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-1.5 bg-blue-900/50 rounded-lg text-blue-300 hover:text-blue-100 text-sm transition-colors"
                >
                  <Linkedin className="w-4 h-4" />
                  LinkedIn
                </a>
              )}
            </div>

            {contact.title && (
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Job Title</p>
                <p className="text-sm text-white">{contact.title}</p>
              </div>
            )}

            {contact.department && (
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Department</p>
                <p className="text-sm text-white">{contact.department}</p>
              </div>
            )}

            {contact.notes && (
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Notes</p>
                <p className="text-sm text-slate-300">{contact.notes}</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* LinkedIn Data */}
      {Object.keys(linkedinData).length > 0 && !isEditing && (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-6 space-y-4">
          <h2 className="text-sm font-semibold text-blue-400 uppercase tracking-wider">LinkedIn Profile</h2>

          {linkedinData.headline && (
            <div>
              <p className="text-xs text-slate-400 mb-1">Headline</p>
              <p className="text-sm text-white">{linkedinData.headline}</p>
            </div>
          )}

          {linkedinData.about && (
            <div>
              <p className="text-xs text-slate-400 mb-1">About</p>
              <p className="text-sm text-slate-300 line-clamp-3">{linkedinData.about}</p>
            </div>
          )}

          {linkedinData.experience && linkedinData.experience.length > 0 && (
            <div>
              <p className="text-xs text-slate-400 mb-2">Recent Experience</p>
              <div className="space-y-2">
                {linkedinData.experience.slice(0, 2).map((exp: any, idx: number) => (
                  <div key={idx} className="text-xs bg-slate-900/50 p-2 rounded">
                    <p className="font-medium text-white">{exp.title}</p>
                    <p className="text-slate-400">{exp.company}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Research Data */}
      {Object.keys(researchData).length > 0 && !isEditing && (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-6 space-y-4">
          <h2 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider">Online Research</h2>

          {researchData.summary && (
            <div>
              <p className="text-xs text-slate-400 mb-1">Research Summary</p>
              <p className="text-sm text-slate-300">{researchData.summary}</p>
            </div>
          )}

          {researchData.onlinePresence && researchData.onlinePresence.length > 0 && (
            <div>
              <p className="text-xs text-slate-400 mb-2">Online Presence</p>
              <div className="flex flex-wrap gap-2">
                {researchData.onlinePresence.map((url: string, idx: number) => (
                  <a
                    key={idx}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs px-2 py-1 bg-emerald-900/50 text-emerald-300 rounded hover:text-emerald-100"
                  >
                    View
                  </a>
                ))}
              </div>
            </div>
          )}

          {researchData.recentNews && researchData.recentNews.length > 0 && (
            <div>
              <p className="text-xs text-slate-400 mb-2">Recent News</p>
              <div className="space-y-2">
                {researchData.recentNews.slice(0, 3).map((news: any, idx: number) => (
                  <div key={idx} className="text-xs bg-slate-900/50 p-2 rounded">
                    <p className="font-medium text-white line-clamp-2">{news.title}</p>
                    <p className="text-slate-500 text-[10px]">{news.date}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ContactDetailPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 text-emerald-400 animate-spin" /></div>}>
      <ContactDetailPageContent />
    </Suspense>
  );
}
