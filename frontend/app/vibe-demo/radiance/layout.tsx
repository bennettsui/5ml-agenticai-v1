import type { Metadata } from 'next';

export const metadata: Metadata = {
  metadataBase: new URL('https://radiancehk.com'),
  title: {
    template: '%s | Radiance PR & Marketing Hong Kong',
    default: 'Radiance - Integrated PR & Marketing for Hong Kong Brands',
  },
  description:
    'Radiance PR & Marketing delivers integrated public relations, events, and digital strategy for Hong Kong brands. From earned media campaigns to product launches, we build real brand momentum.',
  keywords: [
    'PR agency Hong Kong',
    'public relations Hong Kong',
    'marketing agency Hong Kong',
    'event management Hong Kong',
    'integrated marketing Hong Kong',
    'brand strategy',
    'earned media',
    'thought leadership',
    'product launch PR',
  ],
  authors: [{ name: 'Radiance PR & Marketing' }],
  creator: 'Radiance PR & Marketing',
  publisher: 'Radiance PR & Marketing',
  robots: {
    index: true,
    follow: true,
    'max-snippet': -1,
    'max-image-preview': 'large',
    'max-video-preview': -1,
  },
  openGraph: {
    type: 'website',
    locale: 'en_HK',
    url: 'https://radiancehk.com',
    siteName: 'Radiance PR & Marketing',
    title: 'Radiance - Integrated PR & Marketing for Hong Kong Brands',
    description:
      'Radiance PR & Marketing delivers integrated public relations, events, and digital strategy for Hong Kong brands.',
    images: [
      {
        url: '/images/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Radiance PR & Marketing Hong Kong',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Radiance - Integrated PR & Marketing for Hong Kong Brands',
    description:
      'Radiance PR & Marketing delivers integrated PR, events, and digital marketing for Hong Kong brands.',
    creator: '@radiancehk',
    images: ['/images/twitter-image.png'],
  },
  alternates: {
    canonical: 'https://radiancehk.com',
  },
  verification: {
    google: 'google-site-verification-code',
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
            name: 'Radiance PR & Marketing',
            url: 'https://radiancehk.com',
            logo: 'https://radiancehk.com/logo.png',
            description:
              'Hong Kong-based PR & Marketing agency specializing in integrated public relations, events, social media, KOL marketing, and creative production.',
            foundingDate: '2020',
            areaServed: 'HK',
            contactPoint: {
              '@type': 'ContactPoint',
              contactType: 'Customer Service',
              email: 'hello@radiancehk.com',
              telephone: '+852-XXXX-XXXX',
              availableLanguage: ['en', 'zh-Hant'],
            },
            sameAs: [
              'https://www.linkedin.com/company/radiance-pr',
              'https://www.instagram.com/radiancehk',
              'https://www.facebook.com/radiancehk',
            ],
          }),
        }}
      />
      {children}
    </>
  );
}
