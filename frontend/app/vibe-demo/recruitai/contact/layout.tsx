import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '聯絡 RecruitAI Studio | 免費 30 分鐘 AI 評估諮詢',
  description:
    '聯絡 RecruitAI Studio，預約免費 30 分鐘 AI 評估。我們在 1 個工作天內回覆，幫您規劃最適合的 AI 自動化方案。',
  keywords: ['AI 諮詢香港', 'AI 自動化諮詢', '香港 AI 顧問'],
  openGraph: {
    title: '聯絡 RecruitAI Studio | 免費 30 分鐘 AI 評估諮詢',
    description:
      '聯絡 RecruitAI Studio，預約免費 30 分鐘 AI 評估。我們在 1 個工作天內回覆，幫您規劃最適合的 AI 自動化方案。',
    type: 'website',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
