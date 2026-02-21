// ─── RecruitAI Studio — centralised site data ────────────────────────────────
// All hardcoded constants live here so page.tsx and section components stay lean.
// Note: icon references use string identifiers; component mapping is done in UI.

export const STATS = [
  { value: '50+',    label: '香港中小企信任我們', sub: 'Hong Kong SMEs' },
  { value: '30–50%', label: '人力節省承諾',        sub: 'Manpower Saving' },
  { value: '3x+',    label: 'ROAS 提升目標',       sub: 'ROAS Improvement' },
  { value: '1週',    label: '完成部署 · 1個月見效', sub: 'Deploy in 1 week' },
];

export const INDUSTRIES = ['零售 Retail', '餐飲 F&B', '金融 Finance', '物流 Logistics', '貿易 Trading', 'IT 服務 IT Services'];

export const PLANS = [
  {
    name: '入門版',
    nameEn: 'Starter',
    price: 'HK$8,000',
    period: '/月',
    tag: null,
    tagBg: '',
    tagText: '',
    desc: '3 個 AI 代理起步，快速驗證 AI 自動化效益，一週內上線',
    highlighted: false,
    cardBg: 'bg-white dark:bg-slate-800/60',
    cardBorder: 'border-slate-200 dark:border-slate-700/50',
    btnClass: 'border border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white dark:border-blue-500 dark:text-blue-400 dark:hover:bg-blue-600 dark:hover:text-white',
    features: [
      '約 3 個 AI 代理（自選組合）',
      '標準工作流程配置',
      '電郵技術支援',
      '每月效能報告',
      '一個月內見到成效保證',
      '最多 5 名用戶',
    ],
    suitFor: '1–10 名員工',
  },
  {
    name: '業務版',
    nameEn: 'Business',
    price: 'HK$18,000',
    period: '/月',
    tag: '最受歡迎',
    tagBg: 'bg-amber-400',
    tagText: 'text-slate-900',
    desc: '約 10 個 AI 代理全面部署，最適合快速成長中的中小企',
    highlighted: true,
    cardBg: 'bg-gradient-to-b from-blue-700 to-blue-900',
    cardBorder: 'border-blue-500',
    btnClass: 'bg-white text-blue-700 hover:bg-blue-50 font-semibold',
    features: [
      '約 10 個 AI 代理（全面配置）',
      '定制工作流程設計',
      '優先技術支援（4 小時內回覆）',
      '每週效能報告 + 洞察',
      'ROAS 提升 3 倍以上承諾',
      '無限用戶數量',
      'API 整合（WhatsApp、ERP 等）',
      '季度策略回顧',
    ],
    suitFor: '10–30 名員工',
  },
  {
    name: '企業版',
    nameEn: 'Enterprise',
    price: '定制報價',
    period: '',
    tag: null,
    tagBg: '',
    tagText: '',
    desc: '全功能定制方案，專屬支援，滿足大型業務需求',
    highlighted: false,
    cardBg: 'bg-white dark:bg-slate-800/60',
    cardBorder: 'border-amber-300 dark:border-amber-600/50',
    btnClass: 'border border-amber-500 text-amber-600 hover:bg-amber-500 hover:text-white dark:text-amber-400 dark:border-amber-500 dark:hover:bg-amber-500 dark:hover:text-white',
    features: [
      '無限 AI 代理',
      '完全定制開發',
      '專屬客戶成功經理',
      '24/7 電話支援',
      '現場部署協助',
      '高級安全合規（ISO 27001）',
      '定期董事會層面匯報',
    ],
    suitFor: '20+ 名員工',
  },
];

export const TESTIMONIALS = [
  {
    quote: '在使用 RecruitAI Studio 後，我們的客戶回應時間減少了 65%，客戶滿意度大幅提升。更驚喜的是，我們的前台人員可以花更多時間在高價值服務上，而非處理重複性查詢。',
    name: '張先生',
    role: '總經理',
    company: '本地貿易公司',
    industry: '貿易 · 20 名員工',
    avatar: '張',
    rating: 5,
    highlight: '回應時間 -65%',
  },
  {
    quote: '最大的優勢是無需技術團隊，3 天內就能上線使用。我們的發票處理從每週花費 12 小時，降到現在自動完成，會計同事非常感謝這個改變。',
    name: '陳女士',
    role: '創辦人',
    company: '本地零售精品店',
    industry: '零售 · 8 名員工',
    avatar: '陳',
    rating: 5,
    highlight: '人工時間 -80%',
  },
  {
    quote: 'AI 商業智能代理幫助我們發掘了 200+ 個潛在客戶線索，並清楚分析哪些服務最有利潤。業績在 3 個月內增長了 3 倍，ROI 遠超預期。',
    name: '李先生',
    role: '創辦人兼 CEO',
    company: '中環 IT 服務商',
    industry: 'IT 服務 · 12 名員工',
    avatar: '李',
    rating: 5,
    highlight: '業績 +300%',
  },
];

export const FAQS = [
  {
    q: '我的公司沒有 IT 部門，可以使用嗎？',
    a: '完全可以！RecruitAI Studio 專為沒有技術團隊的中小企業設計。我們負責所有技術配置和整合工作，您只需按照我們提供的簡單操作指南使用即可。我們亦提供員工培訓，確保您的團隊能快速上手。',
  },
  {
    q: '上線需要多長時間？',
    a: '標準部署週期為 2-3 週，包含需求分析、定制配置及測試。部分基本方案甚至可以在 3 個工作天內完成基礎功能上線。我們的目標是讓您儘快看到業務改善。',
  },
  {
    q: 'AI 代理的數據安全如何保障？',
    a: '我們採用企業級安全標準，包括端對端加密、資料本地化選項及定期安全審計。所有數據均在香港或您指定地區的伺服器處理，完全符合《個人資料（私隱）條例》要求。',
  },
  {
    q: '可以只試用其中一個 AI 代理嗎？',
    a: '可以！入門版允許您選擇最適合當前業務痛點的一個 AI 代理開始。待您驗證了業務價值後，可隨時升級至業務版，享用完整的三大代理套件。',
  },
  {
    q: '如果 AI 代理效果不理想，怎麼辦？',
    a: '我們提供 30 天成效保證。如果在 30 天內您對 AI 代理的表現不滿意，我們將免費進行全面優化調整，直到達到您的預期效果為止。我們的成功就是您的成功。',
  },
];

export const CASE_STUDIES = [
  {
    id: 'retail',
    company: '本地零售精品店',
    industry: '零售 · 8 名員工 · 深水埗',
    logo: '零',
    logoGrad: 'from-pink-500 to-rose-600',
    agents: ['發票處理代理', '客戶服務代理'],
    agentColors: [
      'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
      'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    ],
    problem: '每月 200+ 張供應商發票需人手錄入，每週耗費 12 小時；非辦公時間 WhatsApp 查詢無人回覆，每月估計流失 15–20 個訂單。',
    solution: '發票代理接入 Xero，自動掃描、分類、推送帳目，異常才提醒。客服代理接管 WhatsApp Business，24/7 回覆查詢、確認訂單及安排取件。',
    results: [
      { metric: '12 小時 → 0.5 小時', label: '每週發票處理', up: false },
      { metric: '-65%', label: '客戶回覆等待時間', up: false },
      { metric: '+25%', label: '3 個月業績增長', up: true },
    ],
    quote: '現在我終於可以專注做買手，而不是每天對帳。AI 幫我省了一個兼職會計的薪水，而且再沒有漏單了。',
    author: '陳女士',
    role: '創辦人',
    highlight: '月省 HK$12,000 人力成本',
    highlightBg: 'bg-emerald-50 dark:bg-emerald-950/30',
    highlightBorder: 'border-emerald-200 dark:border-emerald-800/40',
    highlightText: 'text-emerald-700 dark:text-emerald-300',
  },
  {
    id: 'fnb',
    company: '本地連鎖餐廳集團',
    industry: '餐飲 F&B · 15 名員工 · 3 間分店',
    logo: '食',
    logoGrad: 'from-red-500 to-orange-600',
    agents: ['客戶服務代理', '發票處理代理', '商業智能代理'],
    agentColors: [
      'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
      'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
      'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    ],
    problem: '3 間分店食材發票人手核對混亂，月底對帳錯誤頻發；電話及 WhatsApp 訂位繁忙時經常無人接聽；老闆不知道哪些菜式最有利潤。',
    solution: '三大代理全套部署。客服代理接管電話訂位及 WhatsApp；發票代理整合 3 間分店供應商發票；BI 代理每週生成菜式毛利 + 食材成本報告。',
    results: [
      { metric: '零遺漏', label: '訂位紀錄（以往每月出錯 8–10 次）', up: true },
      { metric: '-40%', label: '食材浪費（精準預測用量）', up: false },
      { metric: '3 個', label: '高利潤菜式被發現，即時調整推廣', up: true },
    ],
    quote: '以前月底對帳要花 2 天，現在 AI 每週出報告。我第一次知道原來燒鵝比龍蝦賺錢，當月就調整了菜單。',
    author: '王先生',
    role: '創辦人',
    highlight: '首月找到 HK$8 萬隱藏成本',
    highlightBg: 'bg-red-50 dark:bg-red-950/30',
    highlightBorder: 'border-red-200 dark:border-red-800/40',
    highlightText: 'text-red-700 dark:text-red-300',
  },
  {
    id: 'it',
    company: '中環 IT 服務商',
    industry: 'IT 服務 · 12 名員工 · 中環',
    logo: 'IT',
    logoGrad: 'from-blue-500 to-violet-600',
    agents: ['商業智能代理', '客戶服務代理'],
    agentColors: [
      'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
      'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    ],
    problem: '銷售線索散落在多個電郵信箱和 Excel，跟進率不足 30%；每份客戶報告需業務員手動整合，耗時 2 天；難以預判哪些客戶有流失風險。',
    solution: 'BI 代理自動整合 CRM、電郵、財務數據，每週生成客戶健康報告及線索優先排序；客服代理接管標準查詢及報告請求自動化。',
    results: [
      { metric: '200+', label: '從現有數據中發現的新線索', up: true },
      { metric: '2 天 → 15 分鐘', label: '客戶報告生成時間', up: false },
      { metric: '+300%', label: '3 個月業績增長', up: true },
    ],
    quote: 'BI 代理發現了我們一直忽略的舊客戶升級機會，第一個月回本，ROI 達到 450%。這是我做過最值得的投資。',
    author: '李先生',
    role: '創辦人兼 CEO',
    highlight: '首月 ROI 達 450%',
    highlightBg: 'bg-blue-50 dark:bg-blue-950/30',
    highlightBorder: 'border-blue-200 dark:border-blue-800/40',
    highlightText: 'text-blue-700 dark:text-blue-300',
  },
];

export const INTEGRATIONS = [
  {
    category: 'CRM 客戶管理',
    icon: '👥',
    items: ['HubSpot', 'Salesforce', 'Zoho CRM', 'Monday.com'],
  },
  {
    category: '會計財務',
    icon: '💰',
    items: ['Xero', 'QuickBooks', 'Sage', 'FreshBooks'],
  },
  {
    category: '通訊渠道',
    icon: '💬',
    items: ['WhatsApp Business', 'Gmail', 'Outlook', 'Slack'],
  },
  {
    category: '電商平台',
    icon: '🛒',
    items: ['Shopify', 'WooCommerce', 'OpenCart', 'Magento'],
  },
  {
    category: '廣告分析',
    icon: '📊',
    items: ['Google Ads', 'Meta Ads', 'Google Analytics 4', 'Looker Studio'],
  },
  {
    category: '自動化工具',
    icon: '⚡',
    items: ['Zapier', 'Make (Integromat)', 'Airtable', 'Notion'],
  },
];

export const AGENT_WORKFLOWS: Record<string, { icon: string; step: string }[]> = {
  invoice: [
    { icon: '📧', step: '供應商電郵 / WhatsApp 發送發票（PDF、照片、掃描件均可）' },
    { icon: '🔍', step: 'OCR + AI 自動提取：供應商名稱、金額、稅額、日期、品項明細' },
    { icon: '✅', step: '自動核對採購訂單及庫存，差異即時標記並通知負責人' },
    { icon: '📂', step: '按帳目類別分類，一鍵推送至 Xero / QuickBooks / Sage' },
    { icon: '👤', step: '正常發票零觸碰全自動；僅異常項目需人工 30 秒確認' },
  ],
  customer: [
    { icon: '💬', step: '客戶透過 WhatsApp Business / 網站 Widget / 電郵發送查詢' },
    { icon: '🤖', step: 'AI 即時分析意圖：一般查詢 / 投訴 / 預約 / 訂單追蹤' },
    { icon: '📚', step: '搜索產品知識庫 + FAQ 資料庫，生成語境準確的個人化回覆' },
    { icon: '✉️', step: '< 3 秒發送回覆，同步更新 CRM 客戶紀錄與對話歷史' },
    { icon: '👤', step: '複雜或敏感問題自動轉接人工客服，並附帶完整對話摘要' },
  ],
  bi: [
    { icon: '🔄', step: '每日自動同步所有業務數據：POS / 銷售 / CRM / 庫存 / 財務' },
    { icon: '📊', step: 'AI 分析趨勢、異常波動、季節性模式及客戶行為變化' },
    { icon: '📝', step: '每週自動生成中文管理層報告：摘要 + 關鍵指標 + 視覺化圖表' },
    { icon: '🎯', step: '識別前 3 大增長機會（如高利潤產品、流失風險客戶），附可執行建議' },
    { icon: '📱', step: '報告同步推送至 Email、Slack / Teams 及管理層儀表板' },
  ],
};

export const MODULES_NAV = [
  { emoji: '🚀', name: '增長模組', nameEn: 'Growth',           href: '/vibe-demo/recruitai/modules/growth',           desc: '廣告・SEO・潛客自動化', grad: 'from-blue-500 to-cyan-400' },
  { emoji: '✨', name: '市場推廣', nameEn: 'Marketing',        href: '/vibe-demo/recruitai/modules/marketing',        desc: '社交內容・EDM 生成', grad: 'from-violet-500 to-pink-400' },
  { emoji: '💬', name: '客戶服務', nameEn: 'Customer Service', href: '/vibe-demo/recruitai/modules/customer-service', desc: 'WhatsApp AI・24/7 客服', grad: 'from-emerald-500 to-teal-400' },
  { emoji: '⚙️', name: '業務運營', nameEn: 'Business Ops',    href: '/vibe-demo/recruitai/modules/business-ops',    desc: '發票・表單・報告自動化', grad: 'from-orange-500 to-amber-400' },
  { emoji: '📊', name: '業務分析', nameEn: 'Analytics',        href: '/vibe-demo/recruitai/modules/analytics',        desc: '全渠道數據・BI 儀表板', grad: 'from-slate-700 to-indigo-600' },
];
