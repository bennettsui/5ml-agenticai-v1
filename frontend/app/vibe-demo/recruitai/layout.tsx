import type { Metadata } from 'next';

export const metadata: Metadata = {
  metadataBase: new URL('https://5ml-agenticai-v1.fly.dev'),
  title: {
    template: '%s | RecruitAIStudio — 香港中小企 AI 自動化',
    default: 'RecruitAIStudio — 香港中小企業 AI 驅動業務增長',
  },
  description:
    'RecruitAIStudio 為香港中小企業提供 AI 自動化平台。三大 AI 代理：發票處理、客戶服務、商業智能。無需技術團隊，3 天內啟動，節省 70% 時間成本。',
  keywords: [
    'AI 自動化 香港',
    '中小企 AI',
    'AI agent 香港',
    '發票處理自動化',
    '客戶服務 AI',
    '商業智能 香港',
    'SME AI Hong Kong',
    'AI automation Hong Kong',
    'RecruitAIStudio',
    '5ML',
    'AI 代理',
    '業務自動化',
  ],
  authors: [{ name: 'RecruitAIStudio by 5ML' }],
  creator: 'RecruitAIStudio',
  publisher: '5 Miles Lab',
  robots: {
    index: true,
    follow: true,
    'max-snippet': -1,
    'max-image-preview': 'large',
    'max-video-preview': -1,
  },
  openGraph: {
    type: 'website',
    locale: 'zh_HK',
    url: '/vibe-demo/recruitai',
    siteName: 'RecruitAIStudio',
    title: 'RecruitAIStudio — 香港中小企業 AI 驅動業務增長',
    description:
      '三大 AI 代理，一個平台。無需技術團隊，3 天內啟動您的 AI 自動化方案。',
    images: [
      {
        url: '/images/og-recruitai.png',
        width: 1200,
        height: 630,
        alt: 'RecruitAIStudio AI 自動化平台 香港',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RecruitAIStudio — 香港中小企業 AI 自動化平台',
    description: '三大 AI 代理，節省 70% 時間，3-6 個月內 ROI。',
    creator: '@recruitaistudio',
    images: ['/images/og-recruitai.png'],
  },
  alternates: {
    canonical: '/vibe-demo/recruitai',
  },
};

export default function RecruitAILayout({
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
            name: 'RecruitAIStudio',
            alternateName: '5ML RecruitAIStudio',
            url: 'https://recruitaistudio.hk',
            description:
              '香港中小企業 AI 自動化平台，提供發票處理、客戶服務及商業智能三大 AI 代理解決方案。',
            foundingDate: '2024',
            areaServed: 'HK',
            serviceType: 'AI Automation',
            contactPoint: {
              '@type': 'ContactPoint',
              contactType: 'Sales',
              email: 'hello@recruitaistudio.hk',
              telephone: '+852-3700-0000',
              availableLanguage: ['zh-Hant', 'en'],
            },
            sameAs: [
              'https://www.linkedin.com/company/recruitaistudio',
              'https://www.instagram.com/recruitaistudio',
              'https://www.facebook.com/recruitaistudio',
            ],
          }),
        }}
      />
      {children}
    </>
  );
}
