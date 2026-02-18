import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Radiance PR & Martech | Hong Kong PR, Events & Digital',
  description: 'Radiance is a Hong Kong-based PR & Martech agency specializing in integrated public relations, events, social media, KOL marketing, and creative production.',
  viewport: 'width=device-width, initial-scale=1',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
