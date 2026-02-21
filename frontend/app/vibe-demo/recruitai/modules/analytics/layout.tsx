import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI 業務分析模組 | 實時 BI 儀表板・廣告歸因分析 | RecruitAI Studio',
  description:
    '整合全渠道廣告數據，實時 BI 儀表板，AI 異常警報。80% 報告時間節省，決策速度提升 3 倍。香港中小企數據分析方案。HK$8,000/月起。',
  keywords: ['BI 儀表板香港', '廣告效益分析', 'AI 數據分析', '多渠道數據整合'],
  openGraph: {
    title: 'AI 業務分析模組 | 實時 BI 儀表板・廣告歸因分析 | RecruitAI Studio',
    description:
      '整合全渠道廣告數據，實時 BI 儀表板，AI 異常警報。80% 報告時間節省，決策速度提升 3 倍。香港中小企數據分析方案。HK$8,000/月起。',
    type: 'website',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
