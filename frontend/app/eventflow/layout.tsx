import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'EventFlow — Where great events begin',
  description: 'Create, manage, and grow your events. Every RSVP is a relationship.',
  openGraph: {
    title: 'EventFlow',
    description: 'Where great events begin — and relationships last.',
    type: 'website',
  },
};

export default function EventFlowLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
