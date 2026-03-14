'use client';

import { useState, useEffect } from 'react';
import { ShieldCheck, X } from 'lucide-react';

const STORAGE_KEY = 'arrisonapps_age_verified';

export default function AgeGate({ children }: { children: React.ReactNode }) {
  // null = not yet checked (SSR), true = verified, false = blocked/unverified
  const [verified, setVerified] = useState<boolean | null>(null);
  const [declining, setDeclining] = useState(false);

  useEffect(() => {
    setVerified(localStorage.getItem(STORAGE_KEY) === '1');
  }, []);

  const confirm = () => {
    localStorage.setItem(STORAGE_KEY, '1');
    setVerified(true);
  };

  const decline = () => setDeclining(true);

  // Still hydrating — render nothing to avoid flicker
  if (verified === null) return null;

  // Already verified — render site normally
  if (verified) return <>{children}</>;

  // Declined — show a gentle exit message
  if (declining) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: '#0a0807', fontFamily: "'Georgia', serif" }}>
        <div className="text-center max-w-sm px-6">
          <div className="text-4xl mb-6">🚫</div>
          <p className="text-base font-light mb-2" style={{ color: '#e8dcc8' }}>
            This site is restricted to adults aged 18 and above.
          </p>
          <p className="text-sm" style={{ color: '#5c5040', fontFamily: 'sans-serif' }}>
            We&apos;re sorry, but we cannot grant you access to this content.
          </p>
          <button
            onClick={() => setDeclining(false)}
            className="mt-8 text-xs underline"
            style={{ color: '#5c5040', fontFamily: 'sans-serif' }}>
            Go back
          </button>
        </div>
      </div>
    );
  }

  // Age gate overlay
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ background: '#0a0807' }}>

      {/* Ambient radial glow */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 40%, rgba(212,175,55,0.07) 0%, transparent 70%)' }} />

      <div className="relative w-full max-w-md mx-4 text-center">
        {/* Logo / brand mark */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-5"
            style={{ border: '1px solid rgba(212,175,55,0.3)', background: 'rgba(212,175,55,0.06)' }}>
            <ShieldCheck className="w-7 h-7" style={{ color: '#D4AF37' }} />
          </div>
          <div className="text-xs tracking-[0.25em] uppercase mb-2"
            style={{ color: '#9b8c72', fontFamily: 'sans-serif' }}>
            Arrisonapps
          </div>
          <h1 className="text-2xl font-light" style={{ color: '#e8dcc8' }}>
            Fine Cigars
          </h1>
        </div>

        {/* Gate card */}
        <div className="rounded-2xl p-8"
          style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(212,175,55,0.15)' }}>

          <p className="text-sm mb-1" style={{ color: '#9b8c72', fontFamily: 'sans-serif', letterSpacing: '0.05em' }}>
            AGE VERIFICATION
          </p>
          <p className="text-lg font-light mb-5" style={{ color: '#e8dcc8' }}>
            You must be 18 or older to enter
          </p>
          <p className="text-xs mb-8 leading-relaxed" style={{ color: '#5c5040', fontFamily: 'sans-serif' }}>
            This website contains content related to tobacco products.
            By entering, you confirm that you are of legal smoking age
            in your country or region.
          </p>

          <div className="space-y-3">
            <button
              onClick={confirm}
              className="w-full py-3 rounded-lg text-sm font-medium tracking-wider transition-opacity hover:opacity-90"
              style={{ background: '#D4AF37', color: '#0a0807', fontFamily: 'sans-serif', letterSpacing: '0.08em' }}>
              I AM 18 OR OLDER — ENTER
            </button>
            <button
              onClick={decline}
              className="w-full py-3 rounded-lg text-sm transition-all"
              style={{
                background: 'transparent',
                color: '#5c5040',
                border: '1px solid rgba(255,255,255,0.06)',
                fontFamily: 'sans-serif',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = '#9b8c72')}
              onMouseLeave={e => (e.currentTarget.style.color = '#5c5040')}>
              I am under 18 — Exit
            </button>
          </div>
        </div>

        <p className="mt-6 text-xs leading-relaxed" style={{ color: '#3a3028', fontFamily: 'sans-serif' }}>
          Tobacco products are harmful to health. Smoking causes cancer,
          heart disease, and stroke. We do not sell to minors.
        </p>
      </div>
    </div>
  );
}
