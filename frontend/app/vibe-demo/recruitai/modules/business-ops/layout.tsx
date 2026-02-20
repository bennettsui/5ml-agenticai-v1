import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI 業務運營模組 | 發票自動化・報表生成 | RecruitAI Studio',
  description:
    'AI 自動處理發票、審批表單及每週業務報告。每月節省 100+ 小時行政時間，Xero 自動入帳，99% 準確率。HK$8,000/月起。',
  keywords: ['發票自動化香港', 'Xero 自動化', '報表自動生成', '企業流程自動化'],
  openGraph: {
    title: 'AI 業務運營模組 | 發票自動化・報表生成 | RecruitAI Studio',
    description:
      'AI 自動處理發票、審批表單及每週業務報告。每月節省 100+ 小時行政時間，Xero 自動入帳，99% 準確率。HK$8,000/月起。',
    type: 'website',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
