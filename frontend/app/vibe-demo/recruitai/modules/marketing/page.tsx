'use client';

import ModulePage, { type ModuleConfig } from '../../components/ModulePage';

const config: ModuleConfig = {
  slug: 'marketing',
  moduleEmoji: '✨',
  moduleName: '市場推廣',
  moduleNameEn: 'Marketing',
  tagline: 'AI 內容工廠：一鍵生成社交貼文、EDM 及品牌物料',
  subtagline: '告別人手撰文、設計繁瑣。AI 代理每天自動產出高質素內容，維持品牌曝光，節省 60% 製作時間。',
  heroGrad: 'from-violet-700 via-purple-600 to-pink-500',
  kpis: [
    { value: '60%', label: '內容製作時間節省' },
    { value: '5x', label: '內容產出量' },
    { value: '2.5x', label: '社交互動提升' },
    { value: '1 週', label: '完成部署' },
  ],
  features: [
    {
      icon: '📝',
      title: '社交媒體內容自動化',
      desc: '每日自動生成 Facebook、Instagram、LinkedIn 貼文，配以合適 hashtag 及發布排程。',
    },
    {
      icon: '📧',
      title: 'EDM 智能撰寫',
      desc: 'AI 根據客戶分群自動撰寫個性化電郵行銷內容，提升開信率及點擊率。',
    },
    {
      icon: '🖼️',
      title: '品牌物料生成',
      desc: '自動生成產品介紹、報價單、簡報範本等業務物料，保持品牌一致性。',
    },
    {
      icon: '🎬',
      title: '短片文案腳本',
      desc: '生成 Reels、TikTok、YouTube Shorts 短片文案及配音腳本，快速執行視頻策略。',
    },
    {
      icon: '📅',
      title: '內容日曆管理',
      desc: '自動規劃每月內容日曆，按節日、促銷活動智能安排發布節奏。',
    },
    {
      icon: '📊',
      title: '內容效益分析',
      desc: '追蹤每篇內容的觸及、互動及轉換數據，AI 自動識別最高效的內容類型。',
    },
  ],
  useCases: [
    {
      title: '社交媒體內容批量生成',
      desc: '每月一次提供主題方向，AI 全自動生成 30 天內容並排程發布',
      workflow: [
        { icon: '🗓️', title: '月度主題輸入', detail: '每月初輸入品牌重點、促銷主題及目標受眾，AI 即時規劃內容策略' },
        { icon: '✍️', title: '批量內容生成', detail: 'AI 按平台特性（Facebook/Instagram/LinkedIn）生成各異的貼文文案、表情符號及 hashtag' },
        { icon: '📸', title: '配圖建議', detail: '提供配圖風格建議及 AI 生成圖片提示詞，交設計師快速產圖或直接 AI 生成' },
        { icon: '🚀', title: '自動排程發布', detail: '整合 Buffer 或 Meta Business Suite，按最佳發布時間自動排程' },
      ],
      kpis: [
        { value: '30 篇', label: '月均生成貼文' },
        { value: '90%', label: '製作時間節省' },
        { value: '2.5x', label: '互動率提升' },
      ],
    },
    {
      title: 'EDM 個性化行銷自動化',
      desc: '根據客戶行為自動觸發個性化電郵，提升轉換率',
      workflow: [
        { icon: '👤', title: '客戶分群', detail: '根據購買歷史、瀏覽行為、詢問紀錄自動將客戶分組' },
        { icon: '📝', title: '個性化內容', detail: 'AI 為每個分群生成針對性電郵內容，包括標題、正文及 CTA' },
        { icon: '⏰', title: '智能觸發', detail: '根據客戶行為（7 天未購買、棄置購物車、生日等）自動發送對應電郵' },
        { icon: '📈', title: 'A/B 測試', detail: 'AI 自動進行標題 A/B 測試，識別最高效版本並自動優化' },
      ],
      kpis: [
        { value: '+35%', label: '開信率提升' },
        { value: '+50%', label: '點擊率提升' },
        { value: '3x', label: '電郵 ROI' },
      ],
    },
    {
      title: '業務物料自動生成系統',
      desc: '報價單、產品介紹、簡報，輸入參數即時生成品牌物料',
      workflow: [
        { icon: '📋', title: '參數輸入', detail: '銷售人員輸入客戶名稱、需求範圍、價格，AI 即時生成定制報價單' },
        { icon: '🎨', title: '品牌模板套用', detail: 'AI 自動套用公司品牌顏色、字型、Logo，確保視覺一致性' },
        { icon: '📄', title: 'PDF 生成', detail: '一鍵生成專業 PDF 文件，可直接傳送客戶或 WhatsApp 分享' },
        { icon: '📁', title: '版本追蹤', detail: '所有物料自動存入雲端資料庫，方便日後查閱及更新' },
      ],
      kpis: [
        { value: '5 分鐘', label: '報價單生成' },
        { value: '80%', label: '製作時間節省' },
        { value: '品牌一致', label: '所有物料' },
      ],
    },
  ],
  integrations: [
    'Facebook Business', 'Instagram', 'LinkedIn', 'Buffer', 'Hootsuite',
    'Mailchimp', 'HubSpot Email', 'Canva API', 'Google Workspace',
    'WhatsApp Business', 'Notion', 'Airtable',
  ],
  priceHint: '市場推廣模組適合需要大量內容產出的品牌，入門方案已包含社交及 EDM 自動化。',
};

export default function MarketingModulePage() {
  return <ModulePage config={config} />;
}
