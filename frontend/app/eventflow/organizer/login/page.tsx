'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL || '';
const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || '';

declare global {
  interface Window { grecaptcha: any; }
}

export default function OrganizerLogin() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!RECAPTCHA_SITE_KEY) return;
    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY}`;
    script.async = true;
    document.head.appendChild(script);
    return () => { document.head.removeChild(script); };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      let recaptcha_token = '';
      if (RECAPTCHA_SITE_KEY && window.grecaptcha) {
        recaptcha_token = await window.grecaptcha.execute(RECAPTCHA_SITE_KEY, { action: 'login' });
      }
      const res = await fetch(`${API}/api/eventflow/organizer/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, recaptcha_token }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Login failed'); setLoading(false); return; }
      localStorage.setItem('ef_token', data.token);
      router.push('/eventflow/organizer/dashboard');
    } catch { setError('Connection error'); setLoading(false); }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex flex-col items-center justify-center px-6">

      {/* Header */}
      <div className="text-center mb-10">
        <Link href="/eventflow/organizer" className="inline-flex items-center gap-2 mb-4">
          <span className="text-3xl">🎟️</span>
          <span className="font-black text-2xl tracking-tight text-gray-900">EventFlow</span>
          <span className="text-xs font-bold text-orange-600 bg-orange-100 border border-orange-200 px-2 py-0.5 rounded-full">For Organizers</span>
        </Link>
        <h1 className="text-3xl font-black text-gray-900 mb-1">Welcome back</h1>
        <p className="text-gray-500 text-sm">Sign in to your organizer account</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm bg-white rounded-3xl border border-orange-100 shadow-xl shadow-orange-500/5 p-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          {[
            { key: 'email',    label: 'Email',    type: 'email',    placeholder: 'you@example.com' },
            { key: 'password', label: 'Password', type: 'password', placeholder: '••••••••' },
          ].map(({ key, label, type, placeholder }) => (
            <div key={key}>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">{label}</label>
              <input type={type} placeholder={placeholder} required
                value={(form as any)[key]} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-300 transition-colors" />
            </div>
          ))}
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition-colors shadow-sm shadow-orange-200 text-sm">
            {loading ? 'Signing in…' : 'Sign in →'}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-gray-100">
          <p className="text-center text-sm text-gray-500">
            Don&apos;t have an account?{' '}
            <Link href="/eventflow/organizer/signup" className="text-orange-600 font-semibold hover:underline">Sign up free</Link>
          </p>
        </div>

        {RECAPTCHA_SITE_KEY && (
          <p className="text-center text-xs text-gray-300 mt-4">
            Protected by reCAPTCHA.{' '}
            <a href="https://policies.google.com/privacy" className="hover:underline" target="_blank" rel="noopener">Privacy</a>
            {' & '}
            <a href="https://policies.google.com/terms" className="hover:underline" target="_blank" rel="noopener">Terms</a>
          </p>
        )}
      </div>

      {/* Back link */}
      <Link href="/eventflow" className="mt-8 text-xs text-gray-400 hover:text-gray-600 transition-colors">
        ← Back to participant view
      </Link>
    </div>
  );
}
