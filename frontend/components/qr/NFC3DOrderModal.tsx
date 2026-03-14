'use client';

import { useState } from 'react';
import {
  X, Cpu, Layers, Zap, CheckCircle2, Loader2, ChevronRight,
  Wifi, ShoppingBag, Utensils, CreditCard, BadgeCheck, Star,
} from 'lucide-react';

interface NFC3DOrderModalProps {
  previewData?: { data: string; mimeType: string } | null;
  qrContent?: string;
  onClose: () => void;
}

const USE_CASES = [
  { id: 'business_card', label: 'Smart Business Card', icon: CreditCard, desc: 'Tap to share your vCard / LinkedIn' },
  { id: 'retail_display', label: 'Retail Product Display', icon: ShoppingBag, desc: 'POS stands, shelf labels, packaging' },
  { id: 'restaurant_menu', label: 'Restaurant / Menu', icon: Utensils, desc: 'Table stands, takeaway boxes' },
  { id: 'event_badge', label: 'Event Badge / Lanyard', icon: BadgeCheck, desc: 'Check-in, networking, access control' },
  { id: 'loyalty_card', label: 'Loyalty Card / Keyring', icon: Star, desc: 'Durable rewards cards or keychains' },
  { id: 'smart_signage', label: 'Smart Signage / Plaque', icon: Wifi, desc: 'Wall-mounted, outdoor, hotel rooms' },
];

const MATERIALS = [
  { id: 'pla', label: 'PLA', desc: 'Eco-friendly · indoor use', price: 'Standard' },
  { id: 'abs', label: 'ABS', desc: 'Durable · light weather-resistant', price: '+10%' },
  { id: 'resin', label: 'Resin', desc: 'High detail · premium finish', price: '+35%' },
  { id: 'metal_infill', label: 'Metal-filled', desc: 'Brushed metal look · premium', price: '+60%' },
];

const NFC_CHIPS = [
  { id: 'ntag213', label: 'NTAG213', memory: '144 bytes', range: '~4 cm', note: 'URLs up to ~130 chars', recommended: false },
  { id: 'ntag215', label: 'NTAG215', memory: '504 bytes', range: '~5 cm', note: 'vCards, longer URLs', recommended: true },
  { id: 'ntag216', label: 'NTAG216', memory: '888 bytes', range: '~5 cm', note: 'Rich payloads', recommended: false },
];

const QTY_TIERS = [
  { qty: 1, label: '1 piece', tag: 'Sample', discount: '' },
  { qty: 10, label: '10 pieces', tag: 'Starter', discount: '5% off' },
  { qty: 50, label: '50 pieces', tag: 'Business', discount: '12% off' },
  { qty: 100, label: '100 pieces', tag: 'Enterprise', discount: '20% off' },
];

export default function NFC3DOrderModal({ previewData, qrContent, onClose }: NFC3DOrderModalProps) {
  const [step, setStep] = useState<'configure' | 'contact' | 'success'>('configure');
  const [useCase, setUseCase] = useState('business_card');
  const [material, setMaterial] = useState('abs');
  const [nfcChip, setNfcChip] = useState('ntag215');
  const [qtyTier, setQtyTier] = useState(1);
  const [customColour, setCustomColour] = useState('#1a1a2e');
  const [accentColour, setAccentColour] = useState('#4f46e5');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submitOrder() {
    if (!name.trim() || !email.trim()) { setError('Name and email are required'); return; }
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/qr/nfc-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          useCase, material, nfcChip, quantity: qtyTier,
          customColour, accentColour,
          name: name.trim(), email: email.trim(), phone: phone.trim(),
          notes: notes.trim(), qrContent,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Submission failed');
      setStep('success');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Submission failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/60 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="relative px-8 pt-7 pb-5 border-b border-slate-700/50 shrink-0 bg-gradient-to-r from-violet-900/30 to-indigo-900/20">
          <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.07] transition-colors">
            <X size={18} />
          </button>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex -space-x-1">
              <div className="w-9 h-9 bg-violet-600/30 border border-violet-500/40 rounded-xl flex items-center justify-center">
                <Layers size={18} className="text-violet-300" />
              </div>
              <div className="w-9 h-9 bg-indigo-600/30 border border-indigo-500/40 rounded-xl flex items-center justify-center">
                <Cpu size={18} className="text-indigo-300" />
              </div>
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">3D Print + NFC Chip</h2>
              <p className="text-xs text-slate-400">Physical QR object — scan or tap to trigger your URL</p>
            </div>
          </div>
          {/* Feature pills */}
          <div className="flex flex-wrap gap-1.5 mt-3">
            {['Weatherproof', 'NFC tap support', 'Custom colours', 'Bulk discounts', 'Scan + Tap dual-mode'].map(f => (
              <span key={f} className="text-xs bg-white/[0.05] border border-slate-700/50 text-slate-400 px-2 py-0.5 rounded-full">{f}</span>
            ))}
          </div>
        </div>

        {/* Body — scrollable */}
        <div className="overflow-y-auto flex-1">
          {step === 'success' ? (
            <div className="flex flex-col items-center justify-center py-14 px-8 text-center">
              <div className="w-16 h-16 bg-emerald-500/15 rounded-full flex items-center justify-center mb-5">
                <CheckCircle2 size={32} className="text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Order Received!</h3>
              <p className="text-slate-400 max-w-sm">
                Thank you <strong className="text-white">{name}</strong>. We&apos;ll send a quote and design proof to <strong className="text-white">{email}</strong> within 24 hours.
              </p>
              <div className="mt-6 p-4 bg-white/[0.03] border border-slate-700/40 rounded-xl text-left text-sm text-slate-400 w-full max-w-xs space-y-1.5">
                <p><span className="text-slate-500 w-20 inline-block">Use case:</span> <span className="text-slate-200">{USE_CASES.find(u => u.id === useCase)?.label}</span></p>
                <p><span className="text-slate-500 w-20 inline-block">Material:</span> <span className="text-slate-200">{MATERIALS.find(m => m.id === material)?.label}</span></p>
                <p><span className="text-slate-500 w-20 inline-block">NFC chip:</span> <span className="text-slate-200">{NFC_CHIPS.find(c => c.id === nfcChip)?.label}</span></p>
                <p><span className="text-slate-500 w-20 inline-block">Quantity:</span> <span className="text-slate-200">{qtyTier} pcs</span></p>
              </div>
              <button onClick={onClose} className="mt-6 px-8 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl text-sm transition-colors">
                Done
              </button>
            </div>
          ) : step === 'configure' ? (
            <div className="px-8 py-6 space-y-6">
              {/* Use case */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2">Use Case</label>
                <div className="grid grid-cols-2 gap-2">
                  {USE_CASES.map(u => (
                    <button
                      key={u.id} onClick={() => setUseCase(u.id)}
                      className={`text-left flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all ${useCase === u.id ? 'bg-indigo-600/15 border-indigo-500/60' : 'bg-slate-800/40 border-slate-700/50 hover:border-slate-600'}`}
                    >
                      <u.icon size={16} className={useCase === u.id ? 'text-indigo-300' : 'text-slate-500'} />
                      <div>
                        <p className={`text-xs font-medium ${useCase === u.id ? 'text-indigo-200' : 'text-slate-300'}`}>{u.label}</p>
                        <p className="text-xs text-slate-600 mt-0.5">{u.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Material */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2">Material</label>
                <div className="grid grid-cols-2 gap-2">
                  {MATERIALS.map(m => (
                    <button
                      key={m.id} onClick={() => setMaterial(m.id)}
                      className={`text-left px-3 py-2.5 rounded-xl border transition-all ${material === m.id ? 'bg-violet-600/15 border-violet-500/60' : 'bg-slate-800/40 border-slate-700/50 hover:border-slate-600'}`}
                    >
                      <div className="flex items-center justify-between">
                        <p className={`text-xs font-semibold ${material === m.id ? 'text-violet-200' : 'text-slate-300'}`}>{m.label}</p>
                        <span className={`text-xs ${material === m.id ? 'text-violet-300' : 'text-slate-600'}`}>{m.price}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{m.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* NFC chip */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2">NFC Chip</label>
                <div className="space-y-2">
                  {NFC_CHIPS.map(c => (
                    <button
                      key={c.id} onClick={() => setNfcChip(c.id)}
                      className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${nfcChip === c.id ? 'bg-indigo-600/15 border-indigo-500/60' : 'bg-slate-800/40 border-slate-700/50 hover:border-slate-600'}`}
                    >
                      <Cpu size={16} className={nfcChip === c.id ? 'text-indigo-300 shrink-0' : 'text-slate-500 shrink-0'} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-semibold ${nfcChip === c.id ? 'text-indigo-200' : 'text-slate-300'}`}>{c.label}</span>
                          {c.recommended && <span className="text-xs bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded-full">Recommended</span>}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{c.memory} · {c.range} read range · {c.note}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Colours */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2">Custom Colours</label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-500 mb-1.5">Body colour</p>
                    <div className="flex gap-2 items-center">
                      <input type="color" value={customColour} onChange={e => setCustomColour(e.target.value)} className="w-10 h-9 rounded cursor-pointer bg-transparent border-0" />
                      <input type="text" value={customColour} onChange={e => setCustomColour(e.target.value)} className="flex-1 bg-slate-800/60 border border-slate-700/60 rounded-lg px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-indigo-500" />
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1.5">Accent / QR colour</p>
                    <div className="flex gap-2 items-center">
                      <input type="color" value={accentColour} onChange={e => setAccentColour(e.target.value)} className="w-10 h-9 rounded cursor-pointer bg-transparent border-0" />
                      <input type="text" value={accentColour} onChange={e => setAccentColour(e.target.value)} className="flex-1 bg-slate-800/60 border border-slate-700/60 rounded-lg px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-indigo-500" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2">Quantity</label>
                <div className="grid grid-cols-4 gap-2">
                  {QTY_TIERS.map(q => (
                    <button
                      key={q.qty} onClick={() => setQtyTier(q.qty)}
                      className={`text-center px-2 py-3 rounded-xl border transition-all ${qtyTier === q.qty ? 'bg-indigo-600/20 border-indigo-500/70' : 'bg-slate-800/40 border-slate-700/50 hover:border-slate-600'}`}
                    >
                      <p className={`text-sm font-bold ${qtyTier === q.qty ? 'text-indigo-200' : 'text-slate-200'}`}>{q.qty}</p>
                      <p className="text-xs text-slate-500">{q.tag}</p>
                      {q.discount && <p className="text-xs text-emerald-400 mt-0.5">{q.discount}</p>}
                    </button>
                  ))}
                </div>
              </div>

              {/* QR preview strip */}
              {previewData && (
                <div className="flex items-center gap-4 p-3 bg-white/[0.02] border border-slate-700/40 rounded-xl">
                  <div className="bg-white p-2 rounded-lg shrink-0">
                    <img src={`data:${previewData.mimeType};base64,${previewData.data}`} alt="QR" className="w-14 h-14 object-contain" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-300">Your QR design will be embedded</p>
                    <p className="text-xs text-slate-500 mt-0.5 truncate max-w-xs">{qrContent || 'QR content attached'}</p>
                    <p className="text-xs text-emerald-400 mt-1">NFC chip programmed to the same URL/content</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Contact step */
            <div className="px-8 py-6 space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-white mb-1">Your contact details</h3>
                <p className="text-xs text-slate-400">We&apos;ll send a quote, design proof, and lead time within 24 hours.</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Full Name *</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Jane Smith" className="w-full bg-slate-800/60 border border-slate-700/60 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Email *</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" className="w-full bg-slate-800/60 border border-slate-700/60 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Phone (optional)</label>
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+852 9123 4567" className="w-full bg-slate-800/60 border border-slate-700/60 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Additional notes</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Logo files, mounting requirements, branding guidelines, deadline…" className="w-full bg-slate-800/60 border border-slate-700/60 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none transition-colors" />
              </div>

              {/* Summary */}
              <div className="grid grid-cols-3 gap-2 pt-1">
                {[
                  { label: 'Material', value: MATERIALS.find(m => m.id === material)?.label },
                  { label: 'NFC', value: NFC_CHIPS.find(c => c.id === nfcChip)?.label },
                  { label: 'Quantity', value: `${qtyTier} pcs` },
                ].map(s => (
                  <div key={s.label} className="text-center p-2.5 bg-white/[0.02] border border-slate-700/30 rounded-xl">
                    <p className="text-xs text-slate-500">{s.label}</p>
                    <p className="text-sm font-semibold text-slate-200 mt-0.5">{s.value}</p>
                  </div>
                ))}
              </div>

              {error && <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2.5 text-sm text-red-400">{error}</div>}
            </div>
          )}
        </div>

        {/* Footer buttons */}
        {step !== 'success' && (
          <div className="px-8 py-5 border-t border-slate-700/50 shrink-0 flex items-center justify-between gap-3">
            {step === 'contact' ? (
              <>
                <button onClick={() => setStep('configure')} className="px-5 py-2.5 border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 rounded-xl text-sm transition-colors">
                  Back
                </button>
                <button
                  onClick={submitOrder} disabled={loading}
                  className="flex items-center gap-2 px-6 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-60 text-white font-semibold text-sm rounded-xl transition-colors"
                >
                  {loading ? <Loader2 size={15} className="animate-spin" /> : <Zap size={15} />}
                  {loading ? 'Submitting…' : 'Request Quote'}
                </button>
              </>
            ) : (
              <>
                <div className="text-xs text-slate-500">No payment now — you&apos;ll receive a quote first</div>
                <button
                  onClick={() => setStep('contact')}
                  className="flex items-center gap-2 px-6 py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm rounded-xl transition-colors"
                >
                  Continue <ChevronRight size={15} />
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
