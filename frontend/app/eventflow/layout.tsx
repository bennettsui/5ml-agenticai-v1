import type { Metadata, Viewport } from 'next';
import ProfilingBanner from './ProfilingBanner';
import AppBottomNav from './AppBottomNav';

export const metadata: Metadata = {
  title: 'EventFlow — Where great events begin',
  description: 'Create, manage, and grow your events. Every RSVP is a relationship.',
  manifest: '/eventflow-manifest.json',
  appleWebApp: {
    capable: true,
    title: 'EventFlow',
    statusBarStyle: 'default',
  },
  openGraph: {
    title: 'EventFlow',
    description: 'Where great events begin — and relationships last.',
    type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: '#f97316',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function EventFlowLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <AppBottomNav />
      <ProfilingBanner />
    </>
  );
}
