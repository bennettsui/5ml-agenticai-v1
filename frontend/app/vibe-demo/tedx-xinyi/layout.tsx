import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'TEDxXinyi — Ideas Worth Spreading from Taipei Xinyi District',
  description:
    'TEDxXinyi is an independently organized TEDx community in Taipei\u2019s Xinyi District. Explore our salon events, speaker talks, sustainability initiatives, and community gatherings that bring bold ideas to life.',
  openGraph: {
    title: 'TEDxXinyi — Ideas Worth Spreading from Taipei Xinyi District',
    description:
      'TEDxXinyi is an independently organized TEDx community in Taipei\u2019s Xinyi District. Explore our salon events, speaker talks, sustainability initiatives, and community gatherings.',
    url: 'https://5ml-agenticai-v1.fly.dev/vibe-demo/tedx-xinyi',
    siteName: 'TEDxXinyi',
    locale: 'zh_TW',
    type: 'website',
    images: [
      {
        url: 'https://5ml-agenticai-v1.fly.dev/tedx-xinyi/hero-home.png',
        width: 1200,
        height: 630,
        alt: 'TEDxXinyi — Ideas Worth Spreading',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TEDxXinyi — Ideas Worth Spreading from Taipei Xinyi District',
    description:
      'TEDxXinyi is an independently organized TEDx community in Taipei\u2019s Xinyi District. Explore our salon events, speaker talks, and community gatherings.',
    images: ['https://5ml-agenticai-v1.fly.dev/tedx-xinyi/hero-home.png'],
  },
  alternates: {
    canonical: 'https://5ml-agenticai-v1.fly.dev/vibe-demo/tedx-xinyi',
  },
};

export default function TEDxXinyiLayout({
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
            name: 'TEDxXinyi',
            url: 'https://5ml-agenticai-v1.fly.dev/vibe-demo/tedx-xinyi',
            logo: 'https://5ml-agenticai-v1.fly.dev/tedx-xinyi/hero-home.png',
            description:
              'An independently organized TEDx event in Taipei\'s Xinyi District, bringing ideas worth spreading to the local community.',
            sameAs: [
              'https://www.youtube.com/channel/UCCa-iL8BoZvPOXazJyUqF7A',
              'https://www.facebook.com/TEDxXinyi-107091491148122',
              'https://www.instagram.com/tedxxinyi/',
            ],
            event: {
              '@type': 'Event',
              name: 'TEDxXinyi We are Becoming — AI趨勢沙龍',
              startDate: '2026-03-31',
              location: {
                '@type': 'Place',
                name: '台北藝術表演中心 藍盒子',
                address: {
                  '@type': 'PostalAddress',
                  addressLocality: 'Taipei',
                  addressCountry: 'TW',
                },
              },
              description:
                '探究我們跟 AI 的距離，我們跟自己的距離。',
              organizer: {
                '@type': 'Organization',
                name: 'TEDxXinyi',
              },
            },
          }),
        }}
      />
      {children}
    </>
  );
}
