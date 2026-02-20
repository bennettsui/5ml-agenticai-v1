import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI 增長模組 | 廣告自動化・SEO・潛在客戶追蹤 | RecruitAI Studio',
  description:
    '香港中小企 AI 增長解決方案。Google Ads 智能出價、SEO 自動生成、潛在客戶 5 分鐘自動跟進。ROAS 提升 3 倍，一週部署。HK$8,000/月起。',
  keywords: ['AI 廣告自動化', 'Google Ads AI', 'SEO 自動化香港', '潛在客戶追蹤', 'ROAS 提升'],
  openGraph: {
    title: 'AI 增長模組 | 廣告自動化・SEO・潛在客戶追蹤 | RecruitAI Studio',
    description:
      '香港中小企 AI 增長解決方案。Google Ads 智能出價、SEO 自動生成、潛在客戶 5 分鐘自動跟進。ROAS 提升 3 倍，一週部署。HK$8,000/月起。',
    type: 'website',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
