'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL || '';

export default function OrganizerLogin() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await fetch(`${API}/api/eventflow/organizer/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Login failed'); setLoading(false); return; }
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
          <h1 className="text-3xl font-black mb-2">Welcome back</h1>
          <p className="text-slate-400 text-sm">Sign in to your organizer account</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { key: 'email',    label: 'Email',    type: 'email',    placeholder: 'you@example.com' },
            { key: 'password', label: 'Password', type: 'password', placeholder: '••••••••' },
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
            {loading ? 'Signing in…' : 'Sign in →'}
          </button>
        </form>
        <p className="text-center text-sm text-slate-500 mt-6">
          Don&apos;t have an account?{' '}
          <Link href="/eventflow/organizer/signup" className="text-amber-400 hover:underline">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
