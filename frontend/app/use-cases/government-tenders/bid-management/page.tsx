'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function BidManagementRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace('/use-cases/hk-sg-tender-intel'); }, [router]);
  return (
    <div className="flex items-center justify-center min-h-[40vh] gap-3 text-slate-400">
      <Loader2 className="w-5 h-5 animate-spin" />
      <span className="text-sm">Redirecting to Tender Intelligence…</span>
    </div>
  );
}
