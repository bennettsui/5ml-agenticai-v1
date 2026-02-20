import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI 市場推廣模組 | 社交媒體自動化・EDM 行銷 | RecruitAI Studio',
  description:
    'AI 每日自動生成 Facebook、Instagram 貼文及 EDM。30 篇/月社交內容，內容產出 5 倍提升。香港中小企數字行銷自動化。HK$8,000/月起。',
  keywords: ['社交媒體自動化', 'EDM 自動化', 'AI 內容生成香港', 'Facebook 行銷自動化'],
  openGraph: {
    title: 'AI 市場推廣模組 | 社交媒體自動化・EDM 行銷 | RecruitAI Studio',
    description:
      'AI 每日自動生成 Facebook、Instagram 貼文及 EDM。30 篇/月社交內容，內容產出 5 倍提升。香港中小企數字行銷自動化。HK$8,000/月起。',
    type: 'website',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
