import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI 客戶服務模組 | WhatsApp AI 客服 24/7 | RecruitAI Studio',
  description:
    'WhatsApp AI 客服代理，24/7 全天候自動回覆。平均回覆 < 30 秒，自動解決率 70%，客戶滿意度提升 40%。HK$8,000/月起。',
  keywords: ['WhatsApp AI 客服', 'AI 客服香港', '24/7 自動回覆', 'WhatsApp Business API'],
  openGraph: {
    title: 'AI 客戶服務模組 | WhatsApp AI 客服 24/7 | RecruitAI Studio',
    description:
      'WhatsApp AI 客服代理，24/7 全天候自動回覆。平均回覆 < 30 秒，自動解決率 70%，客戶滿意度提升 40%。HK$8,000/月起。',
    type: 'website',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
