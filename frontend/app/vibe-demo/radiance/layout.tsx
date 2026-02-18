import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Radiance PR & Martech | Hong Kong PR, Events & Digital',
  description:
    'Radiance is a Hong Kong-based PR & Martech agency specializing in integrated public relations, events, social media, KOL marketing, and creative production.',
  openGraph: {
    title: 'Radiance PR & Martech | Hong Kong PR, Events & Digital',
    description:
      'Integrated PR, events, and digital marketing solutions for brands and institutions in Hong Kong.',
    url: 'https://5ml-agenticai-v1.fly.dev/vibe-demo/radiance',
    siteName: 'Radiance PR & Martech',
    locale: 'en_HK',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Radiance PR & Martech | Hong Kong PR, Events & Digital',
    description:
      'Integrated PR, events, and digital marketing solutions for Hong Kong brands.',
  },
  alternates: {
    canonical: 'https://5ml-agenticai-v1.fly.dev/vibe-demo/radiance',
  },
};

export default function RadianceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: 'Radiance PR & Martech',
            url: 'https://5ml-agenticai-v1.fly.dev/vibe-demo/radiance',
            description:
              'Hong Kong-based PR & Martech hybrid agency providing public relations, events, social media, KOL marketing, and creative production.',
            foundingDate: '2020',
            areaServed: 'HK',
            contactPoint: {
              '@type': 'ContactPoint',
              contactType: 'Customer Service',
              email: 'hello@radiancehk.com',
            },
          }),
        }}
      />
      {children}
    </>
  );
}
