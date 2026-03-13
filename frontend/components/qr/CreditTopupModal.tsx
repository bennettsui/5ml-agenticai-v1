'use client';

import { useState, useEffect } from 'react';
import { X, Loader2, Zap, Star, CheckCircle2, CreditCard } from 'lucide-react';

interface Package {
  id: string;
  name: string;
  credits: number;
  price: number;
  popular: boolean;
  description: string;
}

interface CreditTopupModalProps {
  token: string;
  currentCredits: number;
  onClose: () => void;
  onSuccess: (newCredits: number) => void;
}

export default function CreditTopupModal({ token, currentCredits, onClose, onSuccess }: CreditTopupModalProps) {
  const [packages, setPackages] = useState<Package[]>([]);
  const [selected, setSelected] = useState<string>('popular');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [addedCredits, setAddedCredits] = useState(0);

  useEffect(() => {
    fetch('/api/qr/topup/packages')
      .then(r => r.json())
      .then(d => { setPackages(d.packages); setFetching(false); })
      .catch(() => setFetching(false));
  }, []);

  async function handleTopup() {
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/qr/topup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ packageId: selected }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Top-up failed');
      setAddedCredits(data.creditsAdded);
      setSuccess(true);
      onSuccess(data.totalCredits);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Top-up failed');
    } finally {
      setLoading(false);
    }
  }

  const selectedPkg = packages.find(p => p.id === selected);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-lg mx-4 bg-slate-900 border border-slate-700/60 rounded-2xl shadow-2xl overflow-hidden">
        <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/[0.05] transition-colors z-10">
          <X size={18} />
        </button>

        {success ? (
          <div className="p-10 text-center">
            <div className="w-16 h-16 bg-emerald-500/15 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={32} className="text-emerald-400" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Credits Added!</h2>
            <p className="text-slate-400 mb-1">{addedCredits} credits have been added to your account.</p>
            <p className="text-2xl font-bold text-emerald-400 mt-4">{currentCredits + addedCredits} <span className="text-sm font-normal text-slate-400">total credits</span></p>
            <button onClick={onClose} className="mt-6 px-8 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl text-sm transition-colors">
              Start Generating
            </button>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="px-8 pt-8 pb-5 border-b border-slate-700/50">
              <div className="flex items-center gap-3 mb-1">
                <div className="p-2 bg-indigo-600/20 rounded-lg">
                  <Zap size={18} className="text-indigo-400" />
                </div>
                <h2 className="text-xl font-semibold text-white">Top Up Credits</h2>
              </div>
              <p className="text-sm text-slate-400">
                Current balance: <span className="text-white font-semibold">{currentCredits} credits</span>
              </p>
            </div>

            {/* Credit usage guide */}
            <div className="px-8 py-4 bg-white/[0.02] border-b border-slate-700/30">
              <p className="text-xs font-medium text-slate-400 mb-2">What credits are used for:</p>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { label: 'Basic generation (after free limit)', cost: '1 credit' },
                  { label: 'High resolution (>500px)', cost: '1 credit' },
                  { label: 'Logo embedding', cost: '2 credits' },
                  { label: 'SVG format', cost: '1 credit' },
                  { label: 'Batch export (per item)', cost: '1 credit' },
                  { label: 'Free daily allowance', cost: '10 free/day' },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between text-xs bg-white/[0.02] rounded-lg px-2.5 py-1.5">
                    <span className="text-slate-400">{item.label}</span>
                    <span className="text-amber-400 font-medium ml-2 shrink-0">{item.cost}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Packages */}
            <div className="px-8 py-5">
              {fetching ? (
                <div className="flex justify-center py-8"><Loader2 size={24} className="text-indigo-400 animate-spin" /></div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {packages.map(pkg => (
                    <button
                      key={pkg.id} onClick={() => setSelected(pkg.id)}
                      className={`relative text-left p-4 rounded-xl border transition-all ${
                        selected === pkg.id
                          ? 'bg-indigo-600/15 border-indigo-500/70 shadow-lg shadow-indigo-500/10'
                          : 'bg-slate-800/40 border-slate-700/50 hover:border-slate-600'
                      }`}
                    >
                      {pkg.popular && (
                        <div className="absolute -top-2 left-1/2 -translate-x-1/2">
                          <span className="flex items-center gap-1 bg-amber-500 text-amber-950 text-xs font-bold px-2 py-0.5 rounded-full">
                            <Star size={9} fill="currentColor" /> Popular
                          </span>
                        </div>
                      )}
                      <p className="font-semibold text-white text-sm">{pkg.name}</p>
                      <p className="text-2xl font-bold text-indigo-400 mt-1">{pkg.credits.toLocaleString()}</p>
                      <p className="text-xs text-slate-500">credits</p>
                      <p className="text-lg font-semibold text-white mt-2">${pkg.price.toFixed(2)}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{pkg.description}</p>
                      <p className="text-xs text-emerald-400 mt-1 font-medium">${(pkg.price / pkg.credits * 100).toFixed(1)}¢ per credit</p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-8 pb-6 space-y-3">
              {error && <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2.5 text-sm text-red-400">{error}</div>}

              <div className="flex items-center gap-2 text-xs text-slate-500 bg-white/[0.02] border border-slate-700/30 rounded-lg px-3 py-2.5">
                <CreditCard size={14} className="text-slate-600 shrink-0" />
                <span>Demo mode: no real payment processed. Stripe integration coming soon.</span>
              </div>

              <button
                onClick={handleTopup} disabled={loading || !selectedPkg}
                className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-sm rounded-xl transition-colors"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
                {loading ? 'Processing…' : selectedPkg ? `Add ${selectedPkg.credits} credits — $${selectedPkg.price.toFixed(2)}` : 'Select a package'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
