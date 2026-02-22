'use client';

import ModulePage, { type ModuleConfig } from '../../components/ModulePage';

const config: ModuleConfig = {
  slug: 'business-ops',
  moduleEmoji: '⚙️',
  moduleName: '業務運營',
  moduleNameEn: 'Business Ops',
  tagline: '後台自動化：發票、表單、報告，全部交給 AI 處理',
  subtagline: '每月節省 100+ 小時人手行政工作。AI 代理自動處理發票錄入、表單分發、報告生成，讓您的團隊專注真正重要的事。',
  heroGrad: 'from-orange-700 via-amber-600 to-yellow-500',
  kpis: [
    { value: '100+', label: '每月節省小時' },
    { value: '99%', label: '數據錄入準確率' },
    { value: '50%', label: '行政成本節省' },
    { value: '1 週', label: '完成部署' },
  ],
  features: [
    {
      icon: '🧾',
      title: '智能發票處理',
      desc: '掃描或拍照發票，AI 自動提取金額、日期、供應商，直接寫入 Xero/QuickBooks，準確率 99%。',
    },
    {
      icon: '📝',
      title: '表單自動化',
      desc: '員工申請、客戶問卷、審批流程全自動化，自動分發、提醒、整合數據，無需人手跟進。',
    },
    {
      icon: '📊',
      title: '自動報告生成',
      desc: '每日/週/月自動生成業務報告，整合各系統數據，圖表清晰，直接發送至管理層。',
    },
    {
      icon: '✅',
      title: '審批流程自動化',
      desc: '採購申請、假期審批、報銷等，AI 自動路由至對應審批人，追蹤狀態，減少積壓。',
    },
    {
      icon: '📁',
      title: '文件智能整理',
      desc: 'AI 自動分類、命名、歸檔上傳文件，建立可搜尋的數位文件庫，告別文件失蹤。',
    },
    {
      icon: '🔄',
      title: '跨系統數據同步',
      desc: '自動同步 Xero、CRM、ERP、Google Sheets 之間的數據，消除人手複製貼上錯誤。',
    },
  ],
  useCases: [
    {
      title: '智能發票處理與會計自動化',
      desc: '從收到發票到入帳 Xero，全程無需人手，準確率 99%',
      workflow: [
        { icon: '📸', title: '發票接收', detail: '員工 WhatsApp 拍照發票，或供應商直接電郵，AI 自動識別並開始處理' },
        { icon: '🔍', title: 'OCR 數據提取', detail: 'AI 精準提取發票號碼、供應商、金額、稅款、日期等所有關鍵資訊' },
        { icon: '✅', title: '智能核對', detail: '自動比對採購訂單，識別差異，超出預算或異常金額自動提示審核' },
        { icon: '📊', title: '自動入帳', detail: '核對通過後自動寫入 Xero，分類費用，生成月度財務報告' },
      ],
      kpis: [
        { value: '5 分鐘', label: '每張發票處理' },
        { value: '99%', label: '數據準確率' },
        { value: '70%', label: '節省會計時間' },
      ],
    },
    {
      title: '員工申請表單全自動化',
      desc: '假期、報銷、採購申請，提交即自動路由、審批、通知',
      workflow: [
        { icon: '📱', title: '表單提交', detail: '員工通過 WhatsApp 或網頁提交申請，AI 自動接收並分類' },
        { icon: '🔀', title: '智能路由', detail: '根據申請類型、金額、部門，自動路由至正確審批人並發送通知' },
        { icon: '⏰', title: '自動催辦', detail: '超過 24 小時未審批自動提醒，確保申請不積壓' },
        { icon: '✅', title: '結果通知', detail: '審批完成後自動通知申請人，並更新相關系統（薪酬、財務等）' },
      ],
      kpis: [
        { value: '80%', label: '審批時間縮短' },
        { value: '100%', label: '申請可追蹤' },
        { value: '0', label: '遺漏申請' },
      ],
    },
    {
      title: '管理層報告自動生成',
      desc: '每週一早上自動生成業務週報，老闆 10 分鐘了解全局',
      workflow: [
        { icon: '🔌', title: '數據整合', detail: 'AI 自動連接 Xero、CRM、Google Analytics、廣告平台，拉取最新數據' },
        { icon: '🧮', title: '智能分析', detail: '計算關鍵業務指標，識別趨勢、異常及機會，生成洞察摘要' },
        { icon: '📊', title: '圖表生成', detail: '自動生成美觀圖表，清晰展示收入、成本、客戶、廣告等關鍵數據' },
        { icon: '📨', title: '自動發送', detail: '每週一 8:00 自動 WhatsApp 或電郵發送週報至管理層，格式統一專業' },
      ],
      kpis: [
        { value: '週報', label: '自動生成' },
        { value: '10 分鐘', label: '閱讀即知全局' },
        { value: '0 人手', label: '報告製作' },
      ],
    },
  ],
  integrations: [
    'Xero', 'QuickBooks', 'MYOB', 'Google Sheets', 'Microsoft Excel',
    'HubSpot', 'Salesforce', 'Notion', 'Airtable', 'Zapier',
    'WhatsApp Business', 'Google Drive', 'Dropbox', 'DocuSign',
  ],
  priceHint: '業務運營模組按自動化流程數量計費，大多數中小企 3–5 個核心流程即可顯著提升效率。',
};

export default function BusinessOpsModulePage() {
  return <ModulePage config={config} />;
}
