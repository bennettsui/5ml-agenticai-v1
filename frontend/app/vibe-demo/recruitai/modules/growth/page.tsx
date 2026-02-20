'use client';

import ModulePage, { type ModuleConfig } from '../../components/ModulePage';

const config: ModuleConfig = {
  slug: 'growth',
  moduleEmoji: '🚀',
  moduleName: '增長',
  moduleNameEn: 'Growth',
  tagline: '自動化增長引擎：讓 AI 替你搵客、追客、留客',
  subtagline: '整合 Google Ads、SEO 及 CRM，AI 代理 24 小時自動捕獲潛在客戶，並在最佳時機跟進，大幅提升成交率。',
  heroGrad: 'from-blue-700 via-blue-600 to-cyan-500',
  kpis: [
    { value: '3x+', label: 'ROAS 提升目標' },
    { value: '50%↑', label: '潛在客戶增長' },
    { value: '30%↓', label: '客戶獲取成本' },
    { value: '1 週', label: '完成部署' },
  ],
  features: [
    {
      icon: '🎯',
      title: 'Google Ads 智能出價',
      desc: 'AI 代理實時監控廣告表現，自動調整出價策略及受眾分組，讓每分廣告費發揮最大效益。',
    },
    {
      icon: '🔍',
      title: 'SEO 內容自動化',
      desc: '根據關鍵字趨勢自動生成 SEO 優化文章及落地頁，持續提升自然搜尋排名。',
    },
    {
      icon: '💬',
      title: '潛在客戶自動跟進',
      desc: 'WhatsApp + 電郵雙管道自動跟進，在 5 分鐘內回覆詢問，轉換率提升 3 倍。',
    },
    {
      icon: '📊',
      title: 'CRM 自動更新',
      desc: '新詢問自動記入 CRM，分派跟進人員，設定提醒，確保無一客戶流失。',
    },
    {
      icon: '📈',
      title: '廣告效益即時報告',
      desc: '每日自動生成廣告成效報告，清晰顯示 ROAS、CPL、轉換率，助您快速決策。',
    },
    {
      icon: '🌐',
      title: '多渠道統一管理',
      desc: '整合 Google、Facebook、Instagram 廣告數據，單一儀表板一覽全局。',
    },
  ],
  useCases: [
    {
      title: 'Google Ads 智能優化 + 自動報告',
      desc: '每日自動分析廣告數據，調整出價並生成成效報告，無需人手操作',
      workflow: [
        { icon: '📥', title: '數據抓取', detail: 'AI 代理每日拉取 Google Ads API 數據，包括點擊率、轉換、ROAS 等核心指標' },
        { icon: '🧠', title: '智能分析', detail: '分析各廣告組表現，識別出價機會及低效廣告，自動生成優化建議' },
        { icon: '⚙️', title: '自動執行', detail: '根據規則自動調整出價上限、暫停低效廣告、擴展高效受眾' },
        { icon: '📨', title: '報告發送', detail: '每日早上 9:00 自動 WhatsApp/電郵發送簡報，一頁掌握廣告效益' },
      ],
      kpis: [
        { value: '3x', label: 'ROAS 提升' },
        { value: '40%', label: '節省管理時間' },
        { value: '24/7', label: '自動監控' },
      ],
    },
    {
      title: '潛在客戶捕獲與即時跟進',
      desc: '網站表單、WhatsApp 詢問、廣告點擊，全渠道 5 分鐘內自動回覆',
      workflow: [
        { icon: '🎣', title: '多渠道捕獲', detail: '整合網站、Facebook Lead Ads、WhatsApp Business，統一接收詢問' },
        { icon: '⚡', title: '即時回覆', detail: 'AI 代理在 5 分鐘內自動回覆詢問，提供初步方案資訊，保持客戶溫度' },
        { icon: '📋', title: 'CRM 自動入資料', detail: '詢問資訊自動寫入 CRM，生成潛在客戶卡片，分派給對應銷售' },
        { icon: '🔔', title: '跟進提醒', detail: '依據客戶回應自動設定跟進時間，避免任何詢問被遺漏' },
      ],
      kpis: [
        { value: '5 分鐘', label: '首次回覆' },
        { value: '3x', label: '轉換率提升' },
        { value: '0%', label: '詢問遺漏率' },
      ],
    },
    {
      title: 'SEO 落地頁自動生成',
      desc: '根據關鍵字排名需求，AI 每週自動生成 SEO 優化落地頁內容',
      workflow: [
        { icon: '🔎', title: '關鍵字研究', detail: 'AI 每週掃描行業關鍵字趨勢，識別高價值低競爭的搜尋機會' },
        { icon: '✍️', title: '內容生成', detail: '自動撰寫 1,500+ 字 SEO 優化文章，包括標題、H 標籤、Meta Description' },
        { icon: '🔗', title: '內部連結', detail: '智能建議內部連結結構，提升網站整體 SEO 權重' },
        { icon: '📊', title: '排名追蹤', detail: '每月報告關鍵字排名變化，識別進步及需優化的頁面' },
      ],
      kpis: [
        { value: '月 +8', label: '新 SEO 頁面' },
        { value: '6 個月', label: 'ROI 回本期' },
        { value: '50%', label: '自然流量增長' },
      ],
    },
  ],
  integrations: [
    'Google Ads', 'Google Analytics 4', 'Facebook Ads', 'Instagram',
    'WhatsApp Business', 'HubSpot', 'Salesforce', 'Mailchimp',
    'Google Search Console', 'Ahrefs', 'Zapier',
  ],
  priceHint: '增長模組可配置 3–10 個 AI 代理，按業務需求靈活調整，首月免費試用核心功能。',
};

export default function GrowthModulePage() {
  return <ModulePage config={config} />;
}
