'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import RecruitNav from '../components/RecruitNav';

// Three.js uses browser APIs — load client-side only
const RecruitAICarnival = dynamic(
  () => import('../components/RecruitAICarnival'),
  { ssr: false, loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-sky-900">
      <div className="text-center">
        <div className="text-6xl mb-4 animate-bounce">🎪</div>
        <p className="text-white text-xl font-semibold">載入AI嘉年華...</p>
        <p className="text-blue-300 text-sm mt-2">Loading 3D World</p>
      </div>
    </div>
  )}
);

export default function CarnivalPage() {
  return (
    <div className="flex flex-col bg-sky-900" style={{ height: '100dvh' }}>
      {/* Fixed nav */}
      <RecruitNav />

      {/* 3D canvas — fills remaining viewport height */}
      <div className="flex-1 pt-16 overflow-hidden">
        <div className="w-full h-full">
          <RecruitAICarnival />
        </div>
      </div>

      {/* CTA strip at bottom */}
      <div className="absolute bottom-0 inset-x-0 z-10 pointer-events-none">
        <div className="flex items-center gap-4 px-6 py-5 bg-gradient-to-t from-slate-950/90 via-slate-950/60 to-transparent">
          <span className="text-white/60 text-sm hidden sm:block">探索後準備好了？</span>
          <Link
            href="/vibe-demo/recruitai/consultation"
            className="pointer-events-auto px-6 py-3 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-xl shadow-blue-900/40 whitespace-nowrap"
          >
            免費 30 分鐘諮詢 →
          </Link>
        </div>
      </div>
    </div>
  );
}
