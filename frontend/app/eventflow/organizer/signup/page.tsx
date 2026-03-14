'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL || '';
const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || '';

declare global {
  interface Window { grecaptcha: any; }
}

export default function OrganizerSignup() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
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
        recaptcha_token = await window.grecaptcha.execute(RECAPTCHA_SITE_KEY, { action: 'signup' });
      }
      const res = await fetch(`${API}/api/eventflow/organizer/signup`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, recaptcha_token }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Signup failed'); setLoading(false); return; }
      localStorage.setItem('ef_token', data.token);
      router.push('/eventflow/organizer/dashboard');
    } catch { setError('Connection error'); setLoading(false); }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center px-6">
      <Link href="/eventflow" className="flex items-center gap-2 mb-10">
        <span className="text-2xl">🎟</span>
        <span className="font-black text-2xl tracking-tight">EventFlow</span>
      </Link>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black mb-2">Create your account</h1>
          <p className="text-slate-400 text-sm">Free to start. Always free for your attendees.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { key: 'name',     label: 'Your name',  type: 'text',     placeholder: 'Jane Smith' },
            { key: 'email',    label: 'Email',       type: 'email',    placeholder: 'you@example.com' },
            { key: 'password', label: 'Password',    type: 'password', placeholder: 'Min. 8 characters' },
          ].map(({ key, label, type, placeholder }) => (
            <div key={key}>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">{label}</label>
              <input type={type} placeholder={placeholder} required
                value={(form as any)[key]} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                className="w-full px-4 py-3 bg-slate-800/60 border border-white/[0.08] rounded-xl text-white text-sm focus:outline-none focus:border-amber-500/50 transition-colors" />
            </div>
          ))}
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold py-3.5 rounded-xl transition-colors">
            {loading ? 'Creating account…' : 'Get started free →'}
          </button>
          <p className="text-center text-xs text-slate-600">
            By signing up you agree to our Terms and Privacy Policy.
          </p>
        </form>
        <p className="text-center text-sm text-slate-500 mt-6">
          Already have an account?{' '}
          <Link href="/eventflow/organizer/login" className="text-amber-400 hover:underline">Sign in</Link>
        </p>
        {RECAPTCHA_SITE_KEY && (
          <p className="text-center text-xs text-slate-700 mt-4">
            Protected by reCAPTCHA.{' '}
            <a href="https://policies.google.com/privacy" className="hover:underline" target="_blank" rel="noopener">Privacy</a>
            {' & '}
            <a href="https://policies.google.com/terms" className="hover:underline" target="_blank" rel="noopener">Terms</a>
          </p>
        )}
      </div>
    </div>
  );
}
