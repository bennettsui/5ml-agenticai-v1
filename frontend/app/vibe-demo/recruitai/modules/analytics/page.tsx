'use client';

import ModulePage, { type ModuleConfig } from '../../components/ModulePage';

const config: ModuleConfig = {
  slug: 'analytics',
  moduleEmoji: '📊',
  moduleName: '業務分析',
  moduleNameEn: 'Analytics',
  tagline: 'AI 數據洞察：實時儀表板，讓數據自己說話',
  subtagline: '整合 Google Analytics、多渠道廣告平台及各業務系統，AI 每日自動分析，將數據轉化為可執行的商業洞察。',
  heroGrad: 'from-slate-800 via-blue-900 to-indigo-700',
  kpis: [
    { value: '實時', label: '數據更新頻率' },
    { value: '10+', label: '數據源整合' },
    { value: '80%', label: '報告製作時間節省' },
    { value: '3x', label: '決策速度提升' },
  ],
  features: [
    {
      icon: '📈',
      title: '統一業務儀表板',
      desc: '整合所有業務系統數據，單一儀表板實時掌握收入、客戶、廣告、運營等核心指標。',
    },
    {
      icon: '🔗',
      title: '廣告平台數據整合',
      desc: '直接對接多個香港及國際數字廣告平台 API，自動同步廣告效益及媒體投放數據。',
    },
    {
      icon: '🧠',
      title: 'AI 洞察與預測',
      desc: 'AI 自動識別業績趨勢、異常波動及增長機會，主動推送行動建議而非只呈現數字。',
    },
    {
      icon: '🎯',
      title: '廣告效益歸因',
      desc: '多觸點歸因分析，清晰識別每個渠道的真實貢獻，優化廣告預算分配。',
    },
    {
      icon: '⚡',
      title: '異常警報系統',
      desc: '業績突然下跌、廣告費用異常、轉換率驟降，AI 即時偵測並發送警報，防患於未然。',
    },
    {
      icon: '📋',
      title: '定制報告自動化',
      desc: '按管理層、銷售、行銷等不同受眾，自動生成對應格式的報告，每日/週/月準時送達。',
    },
  ],
  useCases: [
    {
      title: '全渠道廣告效益歸因分析',
      desc: '整合 Google、Facebook 及多個廣告平台數據，清晰識別每分錢的回報',
      workflow: [
        { icon: '🔌', title: '多平台數據接入', detail: '自動連接 Google Ads、Facebook Ads、Instagram、LinkedIn 等平台 API，每日同步最新數據' },
        { icon: '🧮', title: '多觸點歸因計算', detail: 'AI 分析客戶轉換路徑，應用線性、時間衰減、數據驅動等歸因模型，識別真實貢獻' },
        { icon: '📊', title: '跨渠道 ROAS 計算', detail: '統一計算各渠道 ROAS、CPA、CPL，生成可比較的效益排行榜' },
        { icon: '💡', title: '預算優化建議', detail: 'AI 根據歸因結果，自動生成廣告預算調整建議，最大化整體 ROAS' },
      ],
      kpis: [
        { value: '10+', label: '整合數據源' },
        { value: '3x', label: 'ROAS 優化潛力' },
        { value: '實時', label: '數據更新' },
      ],
    },
    {
      title: 'AI 業務健康度儀表板',
      desc: '老闆每天打開手機，即時掌握業務全局，異常 5 分鐘內收到警報',
      workflow: [
        { icon: '📱', title: '行動優化儀表板', detail: '手機友好的儀表板設計，隨時隨地掌握業務狀況，支援 iOS/Android' },
        { icon: '🚨', title: '異常即時警報', detail: 'AI 持續監控關鍵指標，收入下跌 20%、廣告費飆升、退貨率異常，即時 WhatsApp 通知' },
        { icon: '📅', title: '每日業務摘要', detail: '每天早上 8:00 自動發送業務摘要，前日數據一目了然，重點事項加粗標示' },
        { icon: '🤖', title: 'AI 問答查詢', detail: '直接問 AI「上週廣告表現如何」「哪個產品最賺錢」，即時獲得數據回答' },
      ],
      kpis: [
        { value: '5 分鐘', label: '異常警報時間' },
        { value: '每日', label: '自動報告' },
        { value: '100%', label: '數據可視化' },
      ],
    },
    {
      title: '客戶行為分析與 LTV 預測',
      desc: 'AI 分析客戶購買行為，預測客戶終身價值，識別高風險流失客戶',
      workflow: [
        { icon: '👥', title: '客戶數據整合', detail: '整合 CRM、電商、POS 系統數據，建立完整客戶 360° 視圖' },
        { icon: '🔬', title: '行為模式分析', detail: 'AI 分析購買頻率、金額、品類偏好，識別 VIP、普通及低價值客戶群' },
        { icon: '⚠️', title: '流失風險預測', detail: '根據行為訊號（沉默期、購買減少等）預測流失風險，提前 30 天識別高危客戶' },
        { icon: '🎯', title: '個性化挽留策略', detail: 'AI 為高危客戶自動生成個性化挽留方案（折扣、專屬優惠、VIP 邀請），主動出擊' },
      ],
      kpis: [
        { value: '30%', label: '客戶流失率下降' },
        { value: '+45%', label: 'LTV 提升' },
        { value: '85%', label: '流失預測準確率' },
      ],
    },
  ],
  integrations: [
    'Google Analytics 4', 'Google Ads', 'Meta Ads',
    'Facebook Ads', 'Instagram Insights', 'Xero', 'Shopify',
    'HubSpot', 'Salesforce', 'BigQuery', 'Looker Studio',
    'Power BI', 'Tableau', 'Airtable',
  ],
  priceHint: '業務分析模組按數據源及使用者數量計費，整合越多數據源，洞察越全面。',
};

export default function AnalyticsModulePage() {
  return <ModulePage config={config} />;
}
