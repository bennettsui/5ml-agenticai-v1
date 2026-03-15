'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useLang } from './context/LangContext';
import Link from 'next/link';
import {
  CheckCircle,
  ChevronDown,
  ChevronRight,
  ArrowRight,
  Zap,
  BarChart3,
  MessageSquare,
  FileText,
  Clock,
  TrendingUp,
  Users,
  Star,
  Shield,
  Calendar,
  Rocket,
  Trophy,
  Phone,
} from 'lucide-react';
import RecruitNav from './components/RecruitNav';

// ─── Data ───────────────────────────────────────────────────────────────────


const STATS = [
  { value: '50+', label: '香港中小企信任我們', sub: 'Hong Kong SMEs' },
  { value: '30–50%', label: '人力節省承諾', sub: 'Manpower Saving' },
  { value: '3x+', label: 'ROAS 提升目標', sub: 'ROAS Improvement' },
  { value: '1週', label: '完成部署 · 1個月見效', sub: 'Deploy in 1 week' },
];

const AGENTS = [
  {
    id: 'invoice',
    icon: FileText,
    color: 'blue',
    gradFrom: 'from-blue-500',
    gradTo: 'to-blue-700',
    bgLight: 'bg-blue-50',
    bgDark: 'dark:bg-blue-950/30',
    borderColor: 'border-blue-200 dark:border-blue-800/50',
    iconBg: 'bg-blue-100 dark:bg-blue-900/40',
    iconColor: 'text-blue-600 dark:text-blue-400',
    badgeBg: 'bg-blue-100 dark:bg-blue-900/30',
    badgeText: 'text-blue-700 dark:text-blue-300',
    title: '發票處理代理',
    titleEn: 'Invoice Processing Agent',
    description: '自動掃描、分類及核對發票與收據，消除人工錄入錯誤，節省財務團隊 80% 的時間。',
    descriptionEn: 'Auto-scan, classify and reconcile invoices and receipts. Eliminate manual entry errors and save your finance team 80% of their time.',
    features: [
      'OCR 智能掃描，支援多種格式',
      '自動分類及帳目核對',
      '異常發票即時提醒',
      '與主流會計系統無縫整合',
    ],
    featuresEn: [
      'OCR scanning for all formats',
      'Auto-categorisation & reconciliation',
      'Instant alerts for anomalies',
      'Seamless accounting system integration',
    ],
    stat: '減少 80% 人工錄入',
    statEn: '80% less manual entry',
    statColor: 'text-blue-600 dark:text-blue-400',
  },
  {
    id: 'customer',
    icon: MessageSquare,
    color: 'green',
    gradFrom: 'from-emerald-500',
    gradTo: 'to-emerald-700',
    bgLight: 'bg-emerald-50',
    bgDark: 'dark:bg-emerald-950/30',
    borderColor: 'border-emerald-200 dark:border-emerald-800/50',
    iconBg: 'bg-emerald-100 dark:bg-emerald-900/40',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    badgeBg: 'bg-emerald-100 dark:bg-emerald-900/30',
    badgeText: 'text-emerald-700 dark:text-emerald-300',
    title: '客戶服務代理',
    titleEn: 'Customer Service Agent',
    description: '24/7 全天候回應客戶查詢，自動處理常見問題、預約排程及售後跟進，回應時間縮短至 15 分鐘。',
    descriptionEn: '24/7 responses to customer enquiries, auto-handling FAQs, booking and after-sales follow-up. Response time under 15 minutes.',
    features: [
      '多渠道接入：WhatsApp、網頁、電郵',
      '智能常見問題自動回覆',
      '無縫轉接真人客服',
      '客戶滿意度追蹤報告',
    ],
    featuresEn: [
      'Multi-channel: WhatsApp, web, email',
      'Smart auto-replies for common questions',
      'Seamless handoff to human agents',
      'Customer satisfaction tracking',
    ],
    stat: '24/7 回應，15 分鐘內',
    statEn: '24/7 response in <15 min',
    statColor: 'text-emerald-600 dark:text-emerald-400',
  },
  {
    id: 'bi',
    icon: BarChart3,
    color: 'amber',
    gradFrom: 'from-amber-500',
    gradTo: 'to-orange-600',
    bgLight: 'bg-amber-50',
    bgDark: 'dark:bg-amber-950/30',
    borderColor: 'border-amber-200 dark:border-amber-800/50',
    iconBg: 'bg-amber-100 dark:bg-amber-900/40',
    iconColor: 'text-amber-600 dark:text-amber-400',
    badgeBg: 'bg-amber-100 dark:bg-amber-900/30',
    badgeText: 'text-amber-700 dark:text-amber-300',
    title: '商業智能代理',
    titleEn: 'Business Intelligence Agent',
    description: '實時整合銷售、庫存及客戶數據，生成每週自動報告，提供可執行的業務洞察，讓您的決策更有依據。',
    descriptionEn: 'Real-time integration of sales, inventory and customer data — auto-generates weekly reports with actionable insights for faster decision-making.',
    features: [
      '銷售趨勢實時儀表板',
      '每週自動業務報告',
      '客戶行為分析與預測',
      '競爭對手市場洞察',
    ],
    featuresEn: [
      'Real-time sales trend dashboard',
      'Auto weekly business reports',
      'Customer behaviour analysis & prediction',
      'Competitor market insights',
    ],
    stat: '提升 50% 決策速度',
    statEn: '50% faster decisions',
    statColor: 'text-amber-600 dark:text-amber-400',
  },
];

const STEPS = [
  {
    num: '01',
    icon: Calendar,
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-950/40',
    border: 'border-blue-200 dark:border-blue-800/40',
    title: '免費 30 分鐘諮詢',
    desc: '與我們的 AI 顧問深入了解您的業務痛點，量身定制自動化方向。完全免費，無任何義務。',
    badge: '免費',
    badgeBg: 'bg-blue-100 dark:bg-blue-900/40',
    badgeText: 'text-blue-700 dark:text-blue-300',
  },
  {
    num: '02',
    icon: Zap,
    color: 'text-purple-600 dark:text-purple-400',
    bg: 'bg-purple-50 dark:bg-purple-950/40',
    border: 'border-purple-200 dark:border-purple-800/40',
    title: '定制工作流程設計',
    desc: '我們的工程師根據您的業務流程，設計專屬 AI 代理工作流程，確保與現有系統完美整合。',
    badge: '第 1 週',
    badgeBg: 'bg-purple-100 dark:bg-purple-900/40',
    badgeText: 'text-purple-700 dark:text-purple-300',
  },
  {
    num: '03',
    icon: Rocket,
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    border: 'border-emerald-200 dark:border-emerald-800/40',
    title: 'AI 代理部署上線',
    desc: '完成測試後正式上線，我們提供全程技術支援及員工培訓，確保團隊能輕鬆使用。',
    badge: '第 2-3 週',
    badgeBg: 'bg-emerald-100 dark:bg-emerald-900/40',
    badgeText: 'text-emerald-700 dark:text-emerald-300',
  },
  {
    num: '04',
    icon: Trophy,
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    border: 'border-amber-200 dark:border-amber-800/40',
    title: '上線增長，見證 ROI',
    desc: '持續監控 AI 代理效能，每月提供優化報告。大部分客戶在第 1 個月即看到明顯業務改善。',
    badge: '第 1 個月',
    badgeBg: 'bg-amber-100 dark:bg-amber-900/40',
    badgeText: 'text-amber-700 dark:text-amber-300',
  },
];

const PLANS = [
  {
    name: '入門版',
    nameEn: 'Starter',
    price: 'HK$8,000',
    period: '/月',
    tag: null,
    tagEn: null,
    tagBg: '',
    tagText: '',
    desc: '3 個 AI 代理起步，快速驗證 AI 自動化效益，一週內上線',
    descEn: '3 AI agents to start — rapidly validate AI automation benefits, live in 1 week',
    highlighted: false,
    cardBg: 'bg-white dark:bg-slate-800/60',
    cardBorder: 'border-slate-200 dark:border-slate-700/50',
    btnClass:
      'border border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white dark:border-blue-500 dark:text-blue-400 dark:hover:bg-blue-600 dark:hover:text-white',
    features: [
      '約 3 個 AI 代理（自選組合）',
      '標準工作流程配置',
      '電郵技術支援',
      '每月效能報告',
      '一個月內見到成效保證',
      '最多 5 名用戶',
    ],
    featuresEn: [
      '~3 AI agents (your choice)',
      'Standard workflow configuration',
      'Email technical support',
      'Monthly performance report',
      '1-month results guarantee',
      'Up to 5 users',
    ],
    suitFor: '1–10 名員工',
    suitForEn: '1–10 employees',
  },
  {
    name: '業務版',
    nameEn: 'Business',
    price: 'HK$18,000',
    period: '/月',
    tag: '最受歡迎',
    tagEn: 'Most Popular',
    tagBg: 'bg-amber-400',
    tagText: 'text-slate-900',
    desc: '約 10 個 AI 代理全面部署，最適合快速成長中的中小企',
    descEn: '~10 AI agents fully deployed — ideal for rapidly growing SMEs',
    highlighted: true,
    cardBg: 'bg-gradient-to-b from-blue-700 to-blue-900',
    cardBorder: 'border-blue-500',
    btnClass:
      'bg-white text-blue-700 hover:bg-blue-50 font-semibold',
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
    featuresEn: [
      '~10 AI agents (full deployment)',
      'Custom workflow design',
      'Priority support (4-hr response)',
      'Weekly performance report + insights',
      '3× ROAS improvement commitment',
      'Unlimited users',
      'API integration (WhatsApp, ERP etc.)',
      'Quarterly strategy review',
    ],
    suitFor: '10–30 名員工',
    suitForEn: '10–30 employees',
  },
  {
    name: '企業版',
    nameEn: 'Enterprise',
    price: '定制報價',
    priceEn: 'Custom Quote',
    period: '',
    tag: null,
    tagEn: null,
    tagBg: '',
    tagText: '',
    desc: '全功能定制方案，專屬支援，滿足大型業務需求',
    descEn: 'Fully customised solution, dedicated support, built for larger operations',
    highlighted: false,
    cardBg: 'bg-white dark:bg-slate-800/60',
    cardBorder: 'border-amber-300 dark:border-amber-600/50',
    btnClass:
      'border border-amber-500 text-amber-600 hover:bg-amber-500 hover:text-white dark:text-amber-400 dark:border-amber-500 dark:hover:bg-amber-500 dark:hover:text-white',
    features: [
      '無限 AI 代理',
      '完全定制開發',
      '專屬客戶成功經理',
      '24/7 電話支援',
      '現場部署協助',
      '高級安全合規（ISO 27001）',
      '定期董事會層面匯報',
    ],
    featuresEn: [
      'Unlimited AI agents',
      'Full custom development',
      'Dedicated customer success manager',
      '24/7 phone support',
      'On-site deployment assistance',
      'Advanced security compliance (ISO 27001)',
      'Regular board-level reporting',
    ],
    suitFor: '20+ 名員工',
    suitForEn: '20+ employees',
  },
];

const TESTIMONIALS = [
  {
    quote:
      '在使用 RecruitAIStudio 後，我們的客戶回應時間減少了 65%，客戶滿意度大幅提升。更驚喜的是，我們的前台人員可以花更多時間在高價值服務上，而非處理重複性查詢。',
    name: '張先生',
    role: '總經理',
    company: '本地貿易公司',
    industry: '貿易 · 20 名員工',
    avatar: '張',
    rating: 5,
    highlight: '回應時間 -65%',
  },
  {
    quote:
      '最大的優勢是無需技術團隊，3 天內就能上線使用。我們的發票處理從每週花費 12 小時，降到現在自動完成，會計同事非常感謝這個改變。',
    name: '陳女士',
    role: '創辦人',
    company: '本地零售精品店',
    industry: '零售 · 8 名員工',
    avatar: '陳',
    rating: 5,
    highlight: '人工時間 -80%',
  },
  {
    quote:
      'AI 商業智能代理幫助我們發掘了 200+ 個潛在客戶線索，並清楚分析哪些服務最有利潤。業績在 3 個月內增長了 3 倍，ROI 遠超預期。',
    name: '李先生',
    role: '創辦人兼 CEO',
    company: '中環 IT 服務商',
    industry: 'IT 服務 · 12 名員工',
    avatar: '李',
    rating: 5,
    highlight: '業績 +300%',
  },
];

const FAQS = [
  {
    q: '我的公司沒有 IT 部門，可以使用嗎？',
    a: '完全可以！RecruitAIStudio 專為沒有技術團隊的中小企業設計。我們負責所有技術配置和整合工作，您只需按照我們提供的簡單操作指南使用即可。我們亦提供員工培訓，確保您的團隊能快速上手。',
    qEn: 'We have no IT department — can we still use it?',
    aEn: "Absolutely. RecruitAIStudio is designed specifically for businesses without a tech team. We handle all configuration and integration. You just follow our simple user guide. We also provide staff training so your team gets up to speed fast.",
  },
  {
    q: '上線需要多長時間？',
    a: '標準部署週期為 2-3 週，包含需求分析、定制配置及測試。部分基本方案甚至可以在 3 個工作天內完成基礎功能上線。我們的目標是讓您儘快看到業務改善。',
    qEn: 'How long does it take to go live?',
    aEn: "Standard deployment takes 2–3 weeks, covering requirements, configuration and testing. Basic plans can go live with core features in as little as 3 working days. Our goal is to get you seeing business improvements as fast as possible.",
  },
  {
    q: 'AI 代理的數據安全如何保障？',
    a: '我們採用企業級安全標準，包括端對端加密、資料本地化選項及定期安全審計。所有數據均在香港或您指定地區的伺服器處理，完全符合《個人資料（私隱）條例》要求。',
    qEn: 'How is our data kept secure?',
    aEn: "We use enterprise-grade security including end-to-end encryption, data localisation options and regular security audits. All data is processed in Hong Kong (or your specified region), fully compliant with the PDPO.",
  },
  {
    q: '可以只試用其中一個 AI 代理嗎？',
    a: '可以！入門版允許您選擇最適合當前業務痛點的一個 AI 代理開始。待您驗證了業務價值後，可隨時升級至業務版，享用完整的三大代理套件。',
    qEn: 'Can we start with just one AI agent?',
    aEn: "Yes! The Starter plan lets you choose the AI agent that best addresses your current pain point. Once you've validated the business value, upgrade to Business for the full suite at any time.",
  },
  {
    q: '如果 AI 代理效果不理想，怎麼辦？',
    a: '我們提供 30 天成效保證。如果在 30 天內您對 AI 代理的表現不滿意，我們將免費進行全面優化調整，直到達到您的預期效果為止。我們的成功就是您的成功。',
    qEn: "What if the AI agents don't perform as expected?",
    aEn: "We offer a 30-day results guarantee. If you're not satisfied with agent performance within 30 days, we'll optimise at no charge until you hit your targets. Your success is our success.",
  },
];

const INDUSTRIES = ['零售 Retail', '餐飲 F&B', '金融 Finance', '物流 Logistics', '貿易 Trading', 'IT 服務 IT Services'];

// ─── Agent Workflow Steps ────────────────────────────────────────────────────

const AGENT_WORKFLOWS: Record<string, { icon: string; step: string }[]> = {
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

const AGENT_WORKFLOWS_EN: Record<string, { icon: string; step: string }[]> = {
  invoice: [
    { icon: '📧', step: 'Supplier sends invoice via email / WhatsApp (PDF, photo, or scan)' },
    { icon: '🔍', step: 'OCR + AI extracts: supplier name, amount, tax, date, line items' },
    { icon: '✅', step: 'Auto-reconcile against PO and inventory; flag discrepancies instantly' },
    { icon: '📂', step: 'Categorise by account type and push to Xero / QuickBooks / Sage' },
    { icon: '👤', step: 'Normal invoices: zero-touch. Only exceptions need 30-second human confirmation' },
  ],
  customer: [
    { icon: '💬', step: 'Customer sends enquiry via WhatsApp Business / Website Widget / Email' },
    { icon: '🤖', step: 'AI analyses intent: general query / complaint / booking / order tracking' },
    { icon: '📚', step: 'Searches product knowledge base + FAQ database for contextually accurate reply' },
    { icon: '✉️', step: 'Reply sent in <3 seconds, CRM updated with conversation history' },
    { icon: '👤', step: 'Complex or sensitive cases auto-escalated to human with full conversation summary' },
  ],
  bi: [
    { icon: '🔄', step: 'Daily auto-sync of all business data: POS / Sales / CRM / Inventory / Finance' },
    { icon: '📊', step: 'AI analyses trends, anomalies, seasonal patterns, and customer behaviour shifts' },
    { icon: '📝', step: 'Weekly management report auto-generated: summary + KPIs + visual charts' },
    { icon: '🎯', step: 'Top 3 growth opportunities identified (e.g. high-margin products, churn risks) with action plan' },
    { icon: '📱', step: 'Report pushed to Email, Slack / Teams and management dashboard' },
  ],
};

// ─── Case Studies ────────────────────────────────────────────────────────────

const CASE_STUDIES = [
  {
    id: 'retail',
    company: '本地零售精品店',
    companyEn: 'Local Retail Boutique',
    industry: '零售 · 8 名員工 · 深水埗',
    industryEn: 'Retail · 8 staff · Sham Shui Po',
    logo: '零',
    logoGrad: 'from-pink-500 to-rose-600',
    agents: ['發票處理代理', '客戶服務代理'],
    agentsEn: ['Invoice Processing Agent', 'Customer Service Agent'],
    agentColors: ['bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300', 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'],
    problem: '每月 200+ 張供應商發票需人手錄入，每週耗費 12 小時；非辦公時間 WhatsApp 查詢無人回覆，每月估計流失 15–20 個訂單。',
    problemEn: '200+ supplier invoices per month required manual entry — 12 hours/week. WhatsApp enquiries went unanswered after hours, losing an estimated 15–20 orders per month.',
    solution: '發票代理接入 Xero，自動掃描、分類、推送帳目，異常才提醒。客服代理接管 WhatsApp Business，24/7 回覆查詢、確認訂單及安排取件。',
    solutionEn: 'Invoice agent integrated with Xero — auto-scan, categorise, post. Customer service agent took over WhatsApp Business 24/7 for enquiries, order confirmations and pickup arrangements.',
    results: [
      { metric: '12 小時 → 0.5 小時', metricEn: '12 hrs → 0.5 hrs', label: '每週發票處理', labelEn: 'Weekly invoice processing', up: false },
      { metric: '-65%', metricEn: '-65%', label: '客戶回覆等待時間', labelEn: 'Customer response wait time', up: false },
      { metric: '+25%', metricEn: '+25%', label: '3 個月業績增長', labelEn: 'Revenue growth in 3 months', up: true },
    ],
    quote: '現在我終於可以專注做買手，而不是每天對帳。AI 幫我省了一個兼職會計的薪水，而且再沒有漏單了。',
    quoteEn: "I can finally focus on buying, not bookkeeping. AI saved me a part-time accountant's salary — and I never miss an order now.",
    author: '陳女士',
    role: '創辦人',
    roleEn: 'Founder',
    highlight: '月省 HK$12,000 人力成本',
    highlightEn: 'HK$12,000/mo labour cost saved',
    highlightBg: 'bg-emerald-50 dark:bg-emerald-950/30',
    highlightBorder: 'border-emerald-200 dark:border-emerald-800/40',
    highlightText: 'text-emerald-700 dark:text-emerald-300',
  },
  {
    id: 'fnb',
    company: '本地連鎖餐廳集團',
    companyEn: 'Local Restaurant Group',
    industry: '餐飲 F&B · 15 名員工 · 3 間分店',
    industryEn: 'F&B · 15 staff · 3 locations',
    logo: '食',
    logoGrad: 'from-red-500 to-orange-600',
    agents: ['客戶服務代理', '發票處理代理', '商業智能代理'],
    agentsEn: ['Customer Service Agent', 'Invoice Processing Agent', 'Business Intelligence Agent'],
    agentColors: [
      'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
      'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
      'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    ],
    problem: '3 間分店食材發票人手核對混亂，月底對帳錯誤頻發；電話及 WhatsApp 訂位繁忙時經常無人接聽；老闆不知道哪些菜式最有利潤。',
    problemEn: 'Invoice reconciliation across 3 locations was chaotic with frequent month-end errors. Phone and WhatsApp bookings missed during peak hours. Owner had no visibility on which dishes were most profitable.',
    solution: '三大代理全套部署。客服代理接管電話訂位及 WhatsApp；發票代理整合 3 間分店供應商發票；BI 代理每週生成菜式毛利 + 食材成本報告。',
    solutionEn: 'Full three-agent deployment. Customer service agent handles phone bookings and WhatsApp; invoice agent consolidates supplier invoices across all 3 locations; BI agent generates weekly dish margin + ingredient cost reports.',
    results: [
      { metric: '零遺漏', metricEn: 'Zero missed', label: '訂位紀錄（以往每月出錯 8–10 次）', labelEn: 'Reservations (prev. 8–10 errors/mo)', up: true },
      { metric: '-40%', metricEn: '-40%', label: '食材浪費（精準預測用量）', labelEn: 'Food waste (precise usage forecasting)', up: false },
      { metric: '3 個', metricEn: '3 dishes', label: '高利潤菜式被發現，即時調整推廣', labelEn: 'High-margin items discovered, menu updated', up: true },
    ],
    quote: '以前月底對帳要花 2 天，現在 AI 每週出報告。我第一次知道原來燒鵝比龍蝦賺錢，當月就調整了菜單。',
    quoteEn: 'Month-end reconciliation used to take 2 days. Now AI produces a weekly report. First time I knew roast goose was more profitable than lobster — adjusted the menu that very month.',
    author: '王先生',
    role: '創辦人',
    roleEn: 'Founder',
    highlight: '首月找到 HK$8 萬隱藏成本',
    highlightEn: 'HK$80k hidden costs found in month 1',
    highlightBg: 'bg-red-50 dark:bg-red-950/30',
    highlightBorder: 'border-red-200 dark:border-red-800/40',
    highlightText: 'text-red-700 dark:text-red-300',
  },
  {
    id: 'it',
    company: '中環 IT 服務商',
    companyEn: 'Central IT Services Company',
    industry: 'IT 服務 · 12 名員工 · 中環',
    industryEn: 'IT Services · 12 staff · Central',
    logo: 'IT',
    logoGrad: 'from-blue-500 to-violet-600',
    agents: ['商業智能代理', '客戶服務代理'],
    agentsEn: ['Business Intelligence Agent', 'Customer Service Agent'],
    agentColors: [
      'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
      'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    ],
    problem: '銷售線索散落在多個電郵信箱和 Excel，跟進率不足 30%；每份客戶報告需業務員手動整合，耗時 2 天；難以預判哪些客戶有流失風險。',
    problemEn: 'Sales leads scattered across multiple email inboxes and spreadsheets — follow-up rate under 30%. Each client report took a salesperson 2 days to compile manually. No way to predict client churn risk.',
    solution: 'BI 代理自動整合 CRM、電郵、財務數據，每週生成客戶健康報告及線索優先排序；客服代理接管標準查詢及報告請求自動化。',
    solutionEn: 'BI agent auto-integrates CRM, email and financial data — generates weekly client health reports and lead priority ranking. Customer service agent handles standard enquiries and automates report requests.',
    results: [
      { metric: '200+', metricEn: '200+', label: '從現有數據中發現的新線索', labelEn: 'New leads discovered from existing data', up: true },
      { metric: '2 天 → 15 分鐘', metricEn: '2 days → 15 min', label: '客戶報告生成時間', labelEn: 'Client report generation time', up: false },
      { metric: '+300%', metricEn: '+300%', label: '3 個月業績增長', labelEn: 'Revenue growth in 3 months', up: true },
    ],
    quote: 'BI 代理發現了我們一直忽略的舊客戶升級機會，第一個月回本，ROI 達到 450%。這是我做過最值得的投資。',
    quoteEn: "The BI agent uncovered upsell opportunities we'd been ignoring for years. We recouped the cost in month one — ROI hit 450%. Best investment I've ever made.",
    author: '李先生',
    role: '創辦人兼 CEO',
    roleEn: 'Founder & CEO',
    highlight: '首月 ROI 達 450%',
    highlightEn: '450% ROI in Month 1',
    highlightBg: 'bg-blue-50 dark:bg-blue-950/30',
    highlightBorder: 'border-blue-200 dark:border-blue-800/40',
    highlightText: 'text-blue-700 dark:text-blue-300',
  },
];

// ─── Integrations ────────────────────────────────────────────────────────────

const INTEGRATIONS = [
  { category: '會計 & 財務', categoryEn: 'Accounting & Finance', icon: '💰', items: ['Xero', 'QuickBooks', 'Sage', 'FreshBooks', 'MYOB'] },
  { category: '通訊渠道', categoryEn: 'Communication Channels', icon: '💬', items: ['WhatsApp Business', 'WeChat', 'Gmail', 'Outlook', 'Telegram'] },
  { category: 'CRM & 銷售', categoryEn: 'CRM & Sales', icon: '🎯', items: ['Salesforce', 'HubSpot', 'Zoho CRM', 'Monday.com', 'Airtable'] },
  { category: 'ERP & POS', categoryEn: 'ERP & POS', icon: '🏪', items: ['SAP', 'Oracle NetSuite', 'Shopify', 'WooCommerce', '各類 POS'] },
  { category: '雲端文件', categoryEn: 'Cloud Documents', icon: '☁️', items: ['Google Drive', 'Dropbox', 'OneDrive', 'Box', 'Notion'] },
  { category: '香港本地', categoryEn: 'HK Local Systems', icon: '🇭🇰', items: ['政府 eDDI', 'MPF 系統', 'FPS 轉帳', 'eTax', 'HRMS'] },
];

// ─── Bilingual text ───────────────────────────────────────────────────────────

const LANG: Record<'zh' | 'en', Record<string, string>> = {
  zh: {
    heroTag:      '香港中小企 AI 自動化平台',
    heroH1:       '讓 AI 代理為您工作',
    heroSub:      '無需技術團隊 · 節省 30–50% 人力 · 發票、客服、商業智能全自動',
    heroBadge1:   '✅ 一週內完成部署',
    heroBadge2:   '✅ 一個月內見成效',
    heroCta:      '免費 30 分鐘諮詢',
    heroModules:  '了解各功能模組',
    urgency:      '🔥 本週限時優惠 · 首月 AI 代理免費試用 · 名額有限',
    roiTitle:     'AI 自動化 ROI 試算器',
    roiSub:       '輸入您的業務情況，即時估算每月可節省的人力成本',
    beforeAfter:  '部署前 vs 部署後',
    // Industries
    industriesLabel: '服務各行業中小企業',
    // Pain points
    painTitle:   '中小企業主的每日困境',
    painSub:     '您是否每天都在這些問題上浪費寶貴時間？',
    painCta:     'RecruitAIStudio 的 5 大 AI 模組，正是為解決這些問題而生 →',
    // Pain cards
    pain1Title: '發票處理佔用大量時間',
    pain1Desc:  '手動錄入、核對發票，一週花費 10+ 小時，錯誤率高且難以追蹤',
    pain2Title: '客戶查詢回覆不及時',
    pain2Desc:  '非辦公時間客戶無法獲得回覆，損失訂單及客戶信任',
    pain3Title: '難以掌握業務數據',
    pain3Desc:  '數據分散各處，難以整合分析，決策缺乏數據支撐',
    pain4Title: '人力成本持續上升',
    pain4Desc:  '重複性工作消耗員工精力，但又無法縮減人手',
    pain5Title: '業務流程難以擴展',
    pain5Desc:  '增加業務量需要等比例增加人手，成本壓力巨大',
    pain6Title: '老闆親力親為所有事',
    pain6Desc:  '無法從瑣務中解脫，難以專注於核心業務策略',
    // 5 Modules
    modulesTag:      '5 大功能模組',
    modulesH1:       'AI 代理為您的業務',
    modulesH1b:      '全方位打工',
    modulesSub1:     '5 個 AI 模組覆蓋業務全流程，每個模組均可獨立部署。',
    modulesSub2:     '一週內上線，一個月內見成效。',
    modulesStat1L:   '部署上線',
    modulesStat2L:   '人力節省',
    modulesStat3L:   'ROAS 提升',
    modulesStat4L:   'AI 代理可用',
    moduleMoreLabel: '+ 更多',
    moduleLearnMore: '詳細了解',
    modulesBotCta1:  '不確定從哪裡開始？',
    modulesBotCta2:  '30 分鐘免費評估，顧問為您量身推薦最適合的模組組合',
    modulesBotBtn:   '免費 30 分鐘模組評估',
    // How It Works
    stepsH2:   '4 步驟，輕鬆啟動 AI 自動化',
    stepsSub:  '從諮詢到上線，全程由我們的專家團隊陪伴支援',
    stepsBtn:  '預約免費第一步諮詢',
    // Before/After
    beforeAfterTag: '部署成果對比',
    // ROI
    roiTag: 'ROI 試算',
    // Case Studies
    casesTag:          '真實案例',
    casesH2:           '香港中小企業的實際成果',
    casesSub:          '不是示例數字，是真實客戶的業務轉型故事',
    casesCta:          '預約諮詢，了解您行業的 AI 方案',
    casesChallengeLabel: '業務挑戰',
    casesSolutionLabel:  'AI 解決方案',
    casesResultsLabel:   '實際成果',
    // AI Agents
    agentsTag: 'AI 代理生態系統',
    agentsH2:  '200+ AI 代理，覆蓋業務全流程',
    agentsSub: '200+ 個預建 AI 代理，即插即用。3 個起步，按業務成長無限擴展，永遠不需要人手重複工作',
    agentsWorkflowBtn: '查看 AI 工作流程',
    // Benefits
    benefitsH2:   '選擇 RecruitAIStudio 的理由',
    ben1Label:    '全天候運作',
    ben1Desc:     'AI 代理不需休息，永不錯過客戶查詢',
    ben2Label:    '生產力倍增',
    ben2Desc:     '員工從重複工作解放，專注高價值任務',
    ben3Label:    '看到 ROI',
    ben3Desc:     '大部分客戶在 3–6 個月內收回投資',
    ben4Label:    '本地數據合規',
    ben4Desc:     '符合香港法規，數據安全有保障',
    // Integrations
    integrationsTag:    '無縫整合',
    integrationsH2:     '與您現有系統直接對接',
    integrationsSub:    '無需換掉現有軟件。AI 代理直接連接您正在使用的工具，數天內完成整合。',
    integrationsCustom: '沒有看到您使用的系統？我們支援自定義 API 整合，幾乎任何有 API 的軟件均可對接。',
    integrationsCustomLink: '聯絡我們了解詳情',
    // Pricing
    pricingH2:      '選擇適合您的方案',
    pricingSub:     '靈活套餐，隨業務增長而擴展。所有方案均包含免費設置諮詢。',
    pricingPeriod:  '/月',
    pricingSuitFor: '適合',
    pricingContact: '聯絡我們',
    pricingStart:   '立即開始',
    pricingFooter:  '所有方案均包含免費設置、員工培訓及 30 天成效保證。如不滿意，免費調整直至達標。',
    // Testimonials
    testimonialsH2:     '香港中小企業的真實評價',
    testimonialsRating: '平均 4.9 / 5 分 · 50+ 客戶評價',
    // FAQ
    faqH2:     '常見問題',
    faqStillQ: '仍有疑問？',
    faqChat:   '與我們直接對話',
    // Carnival
    carnivalTag:    '限定互動體驗',
    carnivalH2b:    'AI嘉年華 3D 世界',
    carnivalSub:    '化身機器人 RAIBOT，漫遊香港風格 3D AI嘉年華場景，探索 5 個 AI 展位。叮叮電車穿梭、獅子頭舞動、AI 代理逐一揭秘——用遊戲方式了解業務自動化的真正威力。',
    carnivalCta:    '🚀 進入 3D 世界',
    carnivalNoDl:   '無需下載 · 瀏覽器即玩',
    carnivalF1Title: 'RAIBOT 角色扮演',
    carnivalF1Desc:  'WASD 或方向鍵操控 AI 機器人自由漫遊',
    carnivalF2Title: '5 個 AI 展位',
    carnivalF2Desc:  '發票忍者、客服咖啡館、BI 水晶球等主題展位',
    carnivalF3Title: '香港元素',
    carnivalF3Desc:  '叮叮電車、霓虹招牌、獅子頭舞、竹棚點綴場景',
    carnivalF4Title: '探索全部有驚喜',
    carnivalF4Desc:  '集齊 5 個展位解鎖限定慶祝動畫',
    // Final CTA
    ctaH2a:   '今天就開始您的',
    ctaH2b:   'AI 自動化之旅',
    ctaSub:   '免費 30 分鐘諮詢，了解 AI 如何為您的業務創造價值',
    ctaSub2:  '無需信用卡 · 無義務承諾 · 即日預約即可',
    ctaBtn:   '預約免費諮詢',
    ctaTrust1: '50+ 香港中小企業信任我們',
    ctaTrust2: 'Cyberport 成員企業',
    ctaTrust3: 'HKSTP 合作夥伴',
    // Footer
    footerDesc:         '香港中小企業 AI 自動化平台。200+ AI 代理，5 大功能模組，一週部署，全面釋放業務潛能。',
    footerBy:           'by 5 Miles Lab',
    footerProduct:      '產品',
    footerModulesLink:  '5 大功能模組',
    footerHowItWorks:   '運作方式',
    footerPricing:      '價格方案',
    footerFaq:          '常見問題',
    footerSolutions:    '解決方案',
    footerRetail:       '零售業',
    footerFnb:          '餐飲業',
    footerFinance:      '金融服務',
    footerLogistics:    '物流貿易',
    footerContact:      '聯絡我們',
    footerBook:         '預約免費諮詢',
    footerRights:       '保留所有權利。',
    footerContactLink:  '聯絡我們',
    // Anti-consultant
    antiTag:    '為什麼選擇我們',
    antiH2:     '不是顧問公司，是您的 AI 開發夥伴',
    antiSub:    'NDN、Green Tomato、Accenture 報 HK$50 萬、做 6 個月。我們 1 週上線，月費訂閱，成效不達標免費調整。',
    antiBot:    '⚡ 我們的優勢：創意思維 + AI 技術 + 極速原型開發',
  },
  en: {
    heroTag:      'AI Automation Platform for HK SMEs',
    heroH1:       'Let AI Agents Work For You',
    heroSub:      'No tech team needed · Save 30–50% manpower · Invoice, CS & BI on autopilot',
    heroBadge1:   '✅ Live in 1 week',
    heroBadge2:   '✅ ROI in 1 month',
    heroCta:      'Free 30-min Consultation',
    heroModules:  'Explore Modules',
    urgency:      '🔥 This week only · First month free trial · Limited spots',
    roiTitle:     'AI Automation ROI Calculator',
    roiSub:       'Enter your business details to estimate monthly savings',
    beforeAfter:  'Before vs After Deployment',
    // Industries
    industriesLabel: 'Serving SMEs Across All Industries',
    // Pain points
    painTitle:   'The Daily Struggles of SME Owners',
    painSub:     'Are you wasting precious hours on these problems every day?',
    painCta:     "RecruitAIStudio's 5 AI Modules are built to solve exactly these problems →",
    // Pain cards
    pain1Title: 'Invoice Processing Eats Your Time',
    pain1Desc:  'Manual data entry and invoice reconciliation takes 10+ hours/week with high error rates',
    pain2Title: 'Slow Customer Response Loses Orders',
    pain2Desc:  'Customers get no reply outside office hours — you lose orders and trust',
    pain3Title: 'Flying Blind on Business Data',
    pain3Desc:  'Data scattered across systems — no unified view, decisions based on gut feel',
    pain4Title: 'Rising Staff Costs, Shrinking Margins',
    pain4Desc:  "Repetitive tasks drain your team's energy, but you can't afford to cut headcount",
    pain5Title: "Can't Scale Without Hiring More",
    pain5Desc:  "Every new customer means hiring another person — the economics don't work",
    pain6Title: 'Owner Stuck In Daily Operations',
    pain6Desc:  "Can't escape the operational grind to focus on growth strategy",
    // 5 Modules
    modulesTag:      '5 AI Modules',
    modulesH1:       'AI Agents Working',
    modulesH1b:      'Full-Time For Your Business',
    modulesSub1:     '5 AI modules covering your entire business. Each deploys independently.',
    modulesSub2:     'Live in 1 week. Results in 1 month.',
    modulesStat1L:   'Time to Live',
    modulesStat2L:   'Labour Saved',
    modulesStat3L:   'ROAS Uplift',
    modulesStat4L:   'AI Agents Ready',
    moduleMoreLabel: '+ more',
    moduleLearnMore: 'Learn More',
    modulesBotCta1:  'Not sure where to start?',
    modulesBotCta2:  'Free 30-min assessment — our consultant recommends the right module mix for you',
    modulesBotBtn:   'Free 30-Min Module Assessment',
    // How It Works
    stepsH2:   '4 Steps to Launch AI Automation',
    stepsSub:  'From consultation to go-live, our experts support you every step of the way',
    stepsBtn:  'Book Your Free First Step',
    // Before/After
    beforeAfterTag: 'Results Comparison',
    // ROI
    roiTag: 'ROI Calculator',
    // Case Studies
    casesTag:          'Real Results',
    casesH2:           'Real Outcomes from HK SMEs',
    casesSub:          "Not made-up numbers — real business transformation stories from real clients",
    casesCta:          "Book a Consultation for Your Industry's AI Solution",
    casesChallengeLabel: 'Business Challenge',
    casesSolutionLabel:  'AI Solution',
    casesResultsLabel:   'Actual Results',
    // AI Agents
    agentsTag: 'AI Agent Ecosystem',
    agentsH2:  '200+ AI Agents Covering Every Business Process',
    agentsSub: '200+ pre-built AI agents, plug-and-play. Start with 3, scale infinitely as your business grows. No repetitive manual work ever again.',
    agentsWorkflowBtn: 'View AI Workflow',
    // Benefits
    benefitsH2:   'Why SMEs Choose RecruitAIStudio',
    ben1Label:    'Always On',
    ben1Desc:     'AI agents never sleep — zero missed enquiries, 24/7',
    ben2Label:    '3× Productivity',
    ben2Desc:     'Free your team from repetitive work to focus on high-value tasks',
    ben3Label:    'Proven ROI',
    ben3Desc:     'Most clients see return on investment within 3–6 months',
    ben4Label:    'HK Data Compliant',
    ben4Desc:     'Hong Kong PDPO compliant — your data stays in HK',
    // Integrations
    integrationsTag:    'Seamless Integrations',
    integrationsH2:     'Connect Directly to Your Existing Tools',
    integrationsSub:    'No need to replace existing software. AI agents connect to your current tools in days.',
    integrationsCustom: "Don't see your system? We support custom API integrations — virtually any software with an API.",
    integrationsCustomLink: 'Contact us to find out more',
    // Pricing
    pricingH2:      'Choose Your Plan',
    pricingSub:     'Flexible plans that scale with your business. All plans include a free setup consultation.',
    pricingPeriod:  '/mo',
    pricingSuitFor: 'Best for',
    pricingContact: 'Contact Us',
    pricingStart:   'Get Started',
    pricingFooter:  "All plans include free setup, staff training, and a 30-day results guarantee. Not satisfied? We adjust for free until you are.",
    // Testimonials
    testimonialsH2:     'Real Reviews from HK SMEs',
    testimonialsRating: 'Average 4.9 / 5 · 50+ client reviews',
    // FAQ
    faqH2:     'Frequently Asked Questions',
    faqStillQ: 'Still have questions?',
    faqChat:   'Chat with us directly',
    // Carnival
    carnivalTag:    'Exclusive Interactive Experience',
    carnivalH2b:    'AI Carnival 3D World',
    carnivalSub:    'Become RAIBOT, explore a Hong Kong-style 3D AI Carnival. Discover 5 AI booths, ride the tram, watch the lion dance — learn business automation through play.',
    carnivalCta:    '🚀 Enter the 3D World',
    carnivalNoDl:   'No download · Play in browser',
    carnivalF1Title: 'Play as RAIBOT',
    carnivalF1Desc:  'Control the AI robot with WASD or arrow keys',
    carnivalF2Title: '5 AI Booths',
    carnivalF2Desc:  'Invoice Ninja, Customer Café, BI Crystal Ball and more',
    carnivalF3Title: 'Hong Kong Vibes',
    carnivalF3Desc:  'Trams, neon signs, lion dance, bamboo scaffolding',
    carnivalF4Title: 'Explore Everything',
    carnivalF4Desc:  'Complete all 5 booths to unlock exclusive celebration animation',
    // Final CTA
    ctaH2a:   'Start Your',
    ctaH2b:   'AI Automation Journey Today',
    ctaSub:   'Free 30-min consultation — discover how AI can transform your business',
    ctaSub2:  'No credit card · No commitment · Book today',
    ctaBtn:   'Book Free Consultation',
    ctaTrust1: '50+ HK SMEs trust us',
    ctaTrust2: 'Cyberport Member',
    ctaTrust3: 'HKSTP Partner',
    // Footer
    footerDesc:         'AI automation platform for HK SMEs. 200+ agents, 5 modules, deployed in 1 week.',
    footerBy:           'by 5 Miles Lab',
    footerProduct:      'Product',
    footerModulesLink:  '5 AI Modules',
    footerHowItWorks:   'How It Works',
    footerPricing:      'Pricing',
    footerFaq:          'FAQ',
    footerSolutions:    'Solutions',
    footerRetail:       'Retail',
    footerFnb:          'F&B',
    footerFinance:      'Financial Services',
    footerLogistics:    'Logistics & Trading',
    footerContact:      'Contact Us',
    footerBook:         'Book Free Consultation',
    footerRights:       'All rights reserved.',
    footerContactLink:  'Contact',
    // Anti-consultant
    antiTag:    'Why Choose Us',
    antiH2:     'Not a Consultancy. Your AI Build Partner.',
    antiSub:    'Big agencies quote HK$500k+ for 6-month projects. We go live in 1 week, subscription pricing, free adjustments if results miss the mark.',
    antiBot:    '⚡ Our edge: Creative thinking + AI-native tech + Rapid prototyping',
  },
};

// ─── AnimatedCounter ─────────────────────────────────────────────────────────

function AnimatedCounter({ target, suffix = '', duration = 1800 }: { target: number; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const startTime = performance.now();
          const step = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const ease = 1 - Math.pow(1 - progress, 3);
            setCount(Math.round(ease * target));
            if (progress < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [target, duration]);

  return <span ref={ref}>{count}{suffix}</span>;
}

// ─── ROI Calculator ──────────────────────────────────────────────────────────

function RoiCalculator({ lang }: { lang: 'zh' | 'en' }) {
  const [staff, setStaff] = useState(10);
  const [avgSalary, setAvgSalary] = useState(18000);
  const [adminPct, setAdminPct] = useState(30);

  const monthlyAdmin   = (staff * avgSalary * adminPct) / 100;
  const aiSavingPct    = 0.65;
  const monthlySaving  = Math.round(monthlyAdmin * aiSavingPct);
  const platformCost   = staff <= 10 ? 8000 : staff <= 30 ? 18000 : 28000;
  const netGain        = monthlySaving - platformCost;
  const roi            = platformCost > 0 ? Math.round((netGain / platformCost) * 100) : 0;

  const isZh = lang === 'zh';
  const slider = 'w-full h-2 rounded-full appearance-none bg-slate-700 accent-blue-500 cursor-pointer';
  const labelCls = 'text-xs text-slate-400 mb-1 block';
  const valCls = 'text-sm font-bold text-white';

  return (
    <div className="bg-slate-900 border border-slate-700/50 rounded-3xl p-6 sm:p-8 max-w-4xl mx-auto">
      <div className="grid sm:grid-cols-3 gap-6 mb-8">
        {/* Sliders */}
        <div className="space-y-2">
          <label className={labelCls}>{isZh ? '員工人數' : 'Headcount'}</label>
          <input type="range" min={3} max={100} step={1} value={staff}
            onChange={e => setStaff(+e.target.value)} className={slider} />
          <span className={valCls}>{staff} {isZh ? '人' : 'staff'}</span>
        </div>
        <div className="space-y-2">
          <label className={labelCls}>{isZh ? '平均月薪 (HK$)' : 'Avg Monthly Salary (HK$)'}</label>
          <input type="range" min={12000} max={50000} step={1000} value={avgSalary}
            onChange={e => setAvgSalary(+e.target.value)} className={slider} />
          <span className={valCls}>HK${avgSalary.toLocaleString()}</span>
        </div>
        <div className="space-y-2">
          <label className={labelCls}>{isZh ? '行政重複工作佔比' : 'Admin/Repetitive Work %'}</label>
          <input type="range" min={10} max={70} step={5} value={adminPct}
            onChange={e => setAdminPct(+e.target.value)} className={slider} />
          <span className={valCls}>{adminPct}%</span>
        </div>
      </div>

      {/* Results */}
      <div className="grid sm:grid-cols-4 gap-4">
        {[
          { label: isZh ? '月行政人力成本' : 'Monthly Admin Cost', value: `HK$${monthlyAdmin.toLocaleString()}`, color: 'text-slate-300' },
          { label: isZh ? 'AI 可節省 (65%)' : 'AI Saving (65%)', value: `HK$${monthlySaving.toLocaleString()}`, color: 'text-emerald-400' },
          { label: isZh ? '平台月費' : 'Platform Cost', value: `HK$${platformCost.toLocaleString()}`, color: 'text-amber-400' },
          { label: isZh ? '每月淨收益' : 'Net Monthly Gain', value: `HK$${netGain.toLocaleString()}`, color: netGain > 0 ? 'text-blue-400' : 'text-red-400' },
        ].map(item => (
          <div key={item.label} className="bg-white/[0.04] rounded-2xl p-4 border border-slate-700/40 text-center">
            <div className={`text-xl font-black mb-1 ${item.color}`}>{item.value}</div>
            <div className="text-xs text-slate-500">{item.label}</div>
          </div>
        ))}
      </div>

      {netGain > 0 && (
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 bg-emerald-950/40 border border-emerald-800/40 rounded-2xl px-6 py-4">
          <div>
            <p className="text-emerald-300 font-bold text-lg">
              {isZh ? `每月節省 HK$${netGain.toLocaleString()}，ROI ${roi}%` : `Monthly net saving HK$${netGain.toLocaleString()}, ROI ${roi}%`}
            </p>
            <p className="text-emerald-500 text-sm mt-0.5">
              {isZh ? '以上為保守估算，實際節省因業務而異' : 'Conservative estimate; actual savings vary by business'}
            </p>
          </div>
          <Link href="/vibe-demo/recruitai/consultation"
            className="flex-none px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm transition-colors whitespace-nowrap">
            {isZh ? '免費驗證試算 →' : 'Verify with a Free Audit →'}
          </Link>
        </div>
      )}
    </div>
  );
}

// ─── Before/After Timeline ───────────────────────────────────────────────────

function BeforeAfterTimeline({ lang }: { lang: 'zh' | 'en' }) {
  const isZh = lang === 'zh';
  const rows = [
    {
      area:    isZh ? '發票處理' : 'Invoice Processing',
      before:  isZh ? '每週 12 小時人手錄入，錯誤率 8%' : '12 hrs/week manual entry, 8% error rate',
      after:   isZh ? '全自動 OCR，每週僅 0.5 小時例外確認' : 'Full OCR auto-entry, 0.5 hr/week exception review',
      gain:    '-96%',
      gainColor: 'text-emerald-400',
    },
    {
      area:    isZh ? '客戶服務回覆' : 'Customer Service',
      before:  isZh ? '辦公時間才能回覆，平均等待 4–8 小時' : 'Office-hours only, 4–8 hr avg wait',
      after:   isZh ? '24/7 即時回覆，< 30 秒，客滿度 +40%' : '24/7 instant reply <30s, CSAT +40%',
      gain:    '-98%',
      gainColor: 'text-blue-400',
    },
    {
      area:    isZh ? '業務報告生成' : 'Business Reports',
      before:  isZh ? '月底人手整合數據，需 2–3 天完成' : 'Month-end manual data gathering, 2–3 days',
      after:   isZh ? '每週 AI 自動報告，週一早晨送到收件箱' : 'Weekly AI report auto-delivered Monday morning',
      gain:    '-95%',
      gainColor: 'text-violet-400',
    },
    {
      area:    isZh ? '銷售線索跟進' : 'Sales Follow-up',
      before:  isZh ? '線索跟進率不足 30%，大量潛在客戶流失' : 'Under 30% lead follow-up rate, large leak',
      after:   isZh ? '5 分鐘內自動跟進，跟進率提升至 95%+' : 'Auto follow-up in 5 min, 95%+ follow-up rate',
      gain:    '+300%',
      gainColor: 'text-amber-400',
    },
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px]">
        <thead>
          <tr className="border-b border-slate-700/50">
            <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider w-32">{isZh ? '業務流程' : 'Process'}</th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-red-400 uppercase tracking-wider">
              ❌ {isZh ? '未使用 AI 前' : 'Before AI'}
            </th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-emerald-400 uppercase tracking-wider">
              ✅ {isZh ? '部署 AI 後' : 'After AI'}
            </th>
            <th className="text-center py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider w-20">{isZh ? '改善' : 'Gain'}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-slate-800/60 hover:bg-white/[0.02] transition-colors">
              <td className="py-4 px-4 text-sm font-semibold text-white">{row.area}</td>
              <td className="py-4 px-4 text-sm text-slate-400 leading-snug">{row.before}</td>
              <td className="py-4 px-4 text-sm text-emerald-300 leading-snug">{row.after}</td>
              <td className="py-4 px-4 text-center">
                <span className={`text-base font-black ${row.gainColor}`}>{row.gain}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Exit Intent Popup ───────────────────────────────────────────────────────

function ExitIntentPopup({ lang, onClose }: { lang: 'zh' | 'en'; onClose: () => void }) {
  const isZh = lang === 'zh';
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-gradient-to-br from-slate-900 to-blue-950 border border-blue-700/50 rounded-3xl p-8 max-w-md w-full shadow-2xl relative"
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
        <div className="text-4xl mb-4">🎁</div>
        <h3 className="text-2xl font-black text-white mb-2">
          {isZh ? '限時優惠：首月免費' : 'Limited Offer: First Month Free'}
        </h3>
        <p className="text-slate-300 mb-6 leading-relaxed text-sm">
          {isZh
            ? '現在預約 30 分鐘免費諮詢，即可獲得首月 AI 代理免費試用資格。名額有限，今日截止。'
            : 'Book a free 30-min consultation now and get your first month of AI agents free. Limited slots, ends today.'}
        </p>
        <div className="space-y-3">
          <Link
            href="/vibe-demo/recruitai/consultation"
            onClick={onClose}
            className="block w-full text-center py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors"
          >
            {isZh ? '立即領取優惠 →' : 'Claim Offer Now →'}
          </Link>
          <button onClick={onClose} className="block w-full text-center py-2 text-slate-500 hover:text-slate-400 text-sm transition-colors">
            {isZh ? '不，我不需要優惠' : 'No thanks'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Urgency Ticker ──────────────────────────────────────────────────────────

function UrgencyTicker({ lang }: { lang: 'zh' | 'en' }) {
  const isZh = lang === 'zh';
  const msgs = isZh
    ? ['🔥 本週限時：首月免費試用', '✅ 今日已有 3 家企業預約諮詢', '⚡ 平均 1 週內完成部署上線', '🏆 50+ 香港中小企正在使用']
    : ['🔥 This week: First month free', '✅ 3 companies booked today', '⚡ Average 1-week deployment', '🏆 50+ HK SMEs already using'];
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % msgs.length), 3500);
    return () => clearInterval(t);
  }, [msgs.length]);
  return (
    <div className="bg-blue-600/20 border border-blue-500/30 rounded-full px-5 py-1.5 inline-block text-sm text-blue-200 font-medium backdrop-blur-sm transition-all duration-500">
      {msgs[idx]}
    </div>
  );
}

// ─── Workflow Visualizer ─────────────────────────────────────────────────────

function WorkflowViz({ agentId, lang }: { agentId: 'invoice' | 'customer' | 'bi'; lang: 'zh' | 'en' }) {
  const workflows = lang === 'zh' ? AGENT_WORKFLOWS : AGENT_WORKFLOWS_EN;
  const steps = workflows[agentId];
  return (
    <div className="space-y-2">
      {steps.map((s, i) => (
        <div key={i} className="flex items-start gap-3 group">
          {/* Step line */}
          <div className="flex flex-col items-center flex-none">
            <div className="w-9 h-9 rounded-xl bg-blue-900/40 border border-blue-700/40 flex items-center justify-center text-base group-hover:scale-110 transition-transform">
              {s.icon}
            </div>
            {i < steps.length - 1 && (
              <div className="w-px flex-1 bg-gradient-to-b from-blue-700/40 to-transparent my-1 min-h-[16px]" />
            )}
          </div>
          <div className="pt-2 pb-2 flex-1">
            <p className="text-sm text-slate-300 leading-snug">{s.step}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function RecruitAIPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [activeAgent, setActiveAgent] = useState(0);
  const [activeCaseStudy, setActiveCaseStudy] = useState(0);
  const [expandedWorkflow, setExpandedWorkflow] = useState<number | null>(null);
  const { lang } = useLang();
  const [showExitIntent, setShowExitIntent] = useState(false);
  const exitShown = useRef(false);

  // Cycle through agents automatically
  useEffect(() => {
    const timer = setInterval(() => setActiveAgent(prev => (prev + 1) % 3), 4000);
    return () => clearInterval(timer);
  }, []);

  // Exit intent: trigger when mouse leaves the top of the viewport
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (exitShown.current) return;
      if (e.clientY < 5) {
        exitShown.current = true;
        setShowExitIntent(true);
      }
    };
    // Delay by 15s to avoid immediate trigger
    const timer = setTimeout(() => {
      document.addEventListener('mouseleave', handler);
    }, 15000);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mouseleave', handler);
    };
  }, []);

  const t = useCallback((key: string) => LANG[lang][key] ?? key, [lang]);

  const scrollTo = (id: string) => {
    document.getElementById(id.replace('#', ''))?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans">
      {showExitIntent && <ExitIntentPopup lang={lang} onClose={() => setShowExitIntent(false)} />}
      <RecruitNav />


      {/* ── Hero ── */}
      <section className="pt-16">
        <div className="py-32 lg:py-48 px-4 bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900 text-white relative overflow-hidden">
          {/* subtle radial glow */}
          <div className="absolute inset-0 pointer-events-none" style={{background:'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(99,179,237,0.18) 0%, transparent 70%)'}} />
          <div className="max-w-4xl mx-auto text-center relative z-10">
            {/* Urgency ticker */}
            <div className="flex justify-center mb-5">
              <UrgencyTicker lang={lang} />
            </div>

            <p className="text-xs font-semibold text-blue-200 uppercase tracking-widest mb-4">
              {t('heroTag')}
            </p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black mb-5 leading-tight">
              {t('heroH1')}
            </h1>
            <p className="text-blue-100 text-lg sm:text-xl max-w-2xl mx-auto mb-3 leading-relaxed">
              {t('heroSub')}
            </p>
            <p className="text-blue-200/80 text-sm mb-8">
              {t('heroBadge1')} &nbsp;·&nbsp; {t('heroBadge2')}
            </p>
            {lang === 'en' && (
              <p className="hidden sm:block text-blue-200/60 text-sm mb-6">
                Trusted by HK retail, F&amp;B, IT &amp; logistics businesses. No technical team needed.
              </p>
            )}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/vibe-demo/recruitai/consultation"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-white hover:bg-blue-50 text-blue-700 font-bold rounded-xl text-base transition-all duration-200 shadow-lg"
              >
                <Phone className="w-4 h-4" />
                {t('heroCta')}
              </Link>
              <button
                type="button"
                onClick={() => scrollTo('#modules')}
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-white/15 hover:bg-white/25 text-white border border-white/30 font-medium rounded-xl text-base transition-all duration-200 backdrop-blur-sm"
              >
                {t('heroModules')}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Industries Served ── */}
      <section className="py-16 border-y border-slate-100 dark:border-slate-800/50 bg-slate-50/50 dark:bg-white/[0.02]">
        <div className="max-w-6xl mx-auto px-4">
          <p className="text-center text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-8">
            {t('industriesLabel')}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {INDUSTRIES.map(ind => (
              <span
                key={ind}
                className="px-4 py-2 rounded-full bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 text-sm text-slate-700 dark:text-slate-300 shadow-sm"
              >
                {ind}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats (animated on scroll) ── */}
      <section className="py-20 bg-gradient-to-br from-blue-700 via-blue-800 to-blue-900 dark:from-blue-900 dark:via-blue-950 dark:to-slate-950">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { target: 50, suffix: '+',  label: lang === 'zh' ? '香港中小企信任我們' : 'HK SMEs Trust Us',        sub: 'Hong Kong SMEs' },
              { target: 65, suffix: '%',  label: lang === 'zh' ? '平均人力節省'        : 'Avg Manpower Saved',      sub: 'Manpower Saving' },
              { target: 3,  suffix: 'x+', label: lang === 'zh' ? 'ROAS 提升目標'       : 'ROAS Improvement Target', sub: 'ROAS Improvement' },
              { target: 1,  suffix: lang === 'zh' ? '週' : 'wk', label: lang === 'zh' ? '完成部署·1個月見效' : 'Deploy Time', sub: 'Deploy in 1 week' },
            ].map(stat => (
              <div key={stat.label} className="text-center">
                <div className="text-4xl sm:text-5xl font-extrabold text-white mb-1">
                  <AnimatedCounter target={stat.target} suffix={stat.suffix} />
                </div>
                <div className="text-blue-200 text-sm font-medium">{stat.label}</div>
                <div className="text-blue-300/60 text-xs mt-0.5">{stat.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pain Points ── */}
      <section className="py-24 px-4 bg-white dark:bg-slate-950">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4">
            {t('painTitle')}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-lg mb-16 max-w-2xl mx-auto">
            {t('painSub')}
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
            {[
              {
                emoji: '📄',
                title: t('pain1Title'),
                desc: t('pain1Desc'),
                accent: 'group-hover:bg-blue-50 dark:group-hover:bg-blue-950/20',
              },
              {
                emoji: '😓',
                title: t('pain2Title'),
                desc: t('pain2Desc'),
                accent: 'group-hover:bg-emerald-50 dark:group-hover:bg-emerald-950/20',
              },
              {
                emoji: '📊',
                title: t('pain3Title'),
                desc: t('pain3Desc'),
                accent: 'group-hover:bg-violet-50 dark:group-hover:bg-violet-950/20',
              },
              {
                emoji: '👥',
                title: t('pain4Title'),
                desc: t('pain4Desc'),
                accent: 'group-hover:bg-amber-50 dark:group-hover:bg-amber-950/20',
              },
              {
                emoji: '🔄',
                title: t('pain5Title'),
                desc: t('pain5Desc'),
                accent: 'group-hover:bg-rose-50 dark:group-hover:bg-rose-950/20',
              },
              {
                emoji: '⏰',
                title: t('pain6Title'),
                desc: t('pain6Desc'),
                accent: 'group-hover:bg-cyan-50 dark:group-hover:bg-cyan-950/20',
              },
            ].map(item => (
              <div
                key={item.title}
                className={`group p-5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-slate-800/50 cursor-default transition-all duration-300 hover:-translate-y-1 hover:shadow-lg dark:hover:shadow-slate-900/50 ${item.accent}`}
              >
                <div className="text-3xl mb-3 inline-block transition-transform duration-300 group-hover:scale-125 group-hover:-rotate-6">{item.emoji}</div>
                <h3 className="font-semibold text-slate-900 dark:text-white mb-2 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">{item.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-12 p-6 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/40">
            <p className="text-blue-800 dark:text-blue-200 font-semibold text-lg">
              {t('painCta')}
            </p>
          </div>
        </div>
      </section>

      {/* ── 5 Module Cards ── */}
      <section id="modules" className="py-28 px-4 bg-white dark:bg-slate-950">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-4">{t('modulesTag')}</p>
            <h2 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white mb-6 leading-tight">
              {t('modulesH1')}
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-violet-600">
                {t('modulesH1b')}
              </span>
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-xl max-w-3xl mx-auto leading-relaxed">
              {t('modulesSub1')}
              <strong className="text-slate-700 dark:text-slate-300"> {t('modulesSub2')}</strong>
            </p>
            <div className="flex flex-wrap justify-center gap-10 mt-10">
              {[
                { v: lang === 'zh' ? '1 週' : '1 wk', l: t('modulesStat1L') },
                { v: '30–50%', l: t('modulesStat2L') },
                { v: '3x+', l: t('modulesStat3L') },
                { v: '200+', l: t('modulesStat4L') },
              ].map(k => (
                <div key={k.l} className="text-center">
                  <div className="text-2xl font-black text-blue-600 dark:text-blue-400">{k.v}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{k.l}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {[
              {
                emoji: '🚀', name: '增長模組', nameEn: 'Growth',
                href: '/vibe-demo/recruitai/modules/growth',
                tagline: '讓 AI 替你搵客、追客、留客，廣告 ROAS 3 倍飆升',
                taglineEn: 'AI finds, nurtures and retains clients for you — ROAS 3x uplift',
                kpi: '3x+', kpiLabel: 'ROAS 提升', kpiLabelEn: 'ROAS Uplift',
                features: ['Google Ads 智能出價', 'SEO 落地頁自動生成', '潛在客戶 5 分鐘內跟進', 'CRM 自動記錄更新'],
                featuresEn: ['Google Ads smart bidding', 'Auto SEO landing page creation', 'Lead follow-up in 5 minutes', 'Auto CRM record updates'],
                integrations: ['Google Ads', 'GA4', 'HubSpot', 'WhatsApp'],
                grad: 'from-blue-500 to-cyan-400',
              },
              {
                emoji: '✨', name: '市場推廣', nameEn: 'Marketing',
                href: '/vibe-demo/recruitai/modules/marketing',
                tagline: 'AI 內容工廠每日自動生產，社交互動率提升 2.5 倍',
                taglineEn: 'AI content factory produces daily — 2.5× social engagement uplift',
                kpi: '5x', kpiLabel: '內容產出', kpiLabelEn: 'Content Output',
                features: ['30 篇/月社交貼文自動生成', 'EDM 個性化分眾行銷', '品牌物料一鍵生成', '最佳時間自動排程發布'],
                featuresEn: ['30 social posts/month auto-generated', 'Personalised EDM segmented marketing', 'Brand materials one-click creation', 'Auto-scheduled at optimal times'],
                integrations: ['Meta Business', 'Buffer', 'Mailchimp', 'Canva'],
                grad: 'from-violet-500 to-pink-400',
              },
              {
                emoji: '💬', name: '客戶服務', nameEn: 'Customer Service',
                href: '/vibe-demo/recruitai/modules/customer-service',
                tagline: 'WhatsApp AI 客服 24/7 秒回，客戶滿意度提升 40%',
                taglineEn: 'WhatsApp AI CS replies instantly 24/7 — CSAT up 40%',
                kpi: '< 30秒', kpiLabel: '平均回覆', kpiLabelEn: 'Avg Response',
                features: ['WhatsApp 全天候 AI 回覆', '多渠道統一收件管理', '智能預約自動確認提醒', '投訴情緒識別即時升級'],
                featuresEn: ['WhatsApp 24/7 AI replies', 'Unified multi-channel inbox', 'Smart booking auto-confirmation', 'Complaint sentiment escalation'],
                integrations: ['WhatsApp API', 'Zendesk', 'Calendly', 'HubSpot CRM'],
                grad: 'from-emerald-500 to-teal-400',
              },
              {
                emoji: '⚙️', name: '業務運營', nameEn: 'Business Ops',
                href: '/vibe-demo/recruitai/modules/business-ops',
                tagline: '發票、表單、報告全自動，每月解放 100+ 小時行政時間',
                taglineEn: 'Invoices, forms & reports fully automated — free 100+ admin hours/month',
                kpi: '100+', kpiLabel: '月省工時', kpiLabelEn: 'Hrs Saved/Mo',
                features: ['發票 OCR 自動入帳 Xero', '審批流程自動路由', '管理層週報準時送達', '跨系統數據零誤差同步'],
                featuresEn: ['Invoice OCR auto-posts to Xero', 'Approval workflow auto-routing', 'Weekly management report on time', 'Cross-system zero-error data sync'],
                integrations: ['Xero', 'Google Sheets', 'DocuSign', 'Zapier'],
                grad: 'from-orange-500 to-amber-400',
              },
              {
                emoji: '📊', name: '業務分析', nameEn: 'Analytics',
                href: '/vibe-demo/recruitai/modules/analytics',
                tagline: '整合全渠道廣告及業務數據，AI 洞察讓決策快 3 倍',
                taglineEn: 'Unified ad & business data — AI insights make decisions 3× faster',
                kpi: lang === 'zh' ? '實時' : 'Real-time', kpiLabel: '數據洞察', kpiLabelEn: 'Data Insights',
                features: ['全渠道 BI 儀表板實時更新', '多平台廣告數據整合', 'AI 異常警報 5 分鐘內通知', '客戶流失風險提前 30 天預測'],
                featuresEn: ['Omni-channel BI dashboard live', 'Multi-platform ad data unified', 'AI anomaly alerts in 5 min', 'Churn risk 30-day early warning'],
                integrations: ['Google Analytics', 'Meta Ads', 'BigQuery', 'Looker Studio'],
                grad: 'from-slate-700 to-indigo-600',
              },
            ].map(mod => (
              <Link
                key={mod.name}
                href={mod.href}
                className="group block rounded-3xl border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-800/60 hover:shadow-2xl hover:border-blue-200 dark:hover:border-blue-800/50 hover:-translate-y-0.5 transition-all duration-300 overflow-hidden"
              >
                <div className="flex flex-col lg:flex-row">
                  {/* Left identity panel */}
                  <div className={`flex-none lg:w-52 p-6 lg:p-8 bg-gradient-to-br ${mod.grad} flex lg:flex-col gap-4 items-center lg:items-start justify-between lg:justify-start`}>
                    <div className="flex items-center lg:flex-col lg:items-start gap-3">
                      <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-3xl shadow-sm group-hover:scale-110 transition-transform duration-300 flex-none">
                        {mod.emoji}
                      </div>
                      <div className="lg:mt-4">
                        <h3 className="text-lg font-bold text-white leading-tight">{mod.name}</h3>
                        <p className="text-xs text-white/70 font-medium mt-0.5">{mod.nameEn}</p>
                      </div>
                    </div>
                    <div className="text-right lg:text-left lg:mt-auto">
                      <div className="text-3xl font-black text-white">{mod.kpi}</div>
                      <div className="text-xs text-white/70 mt-0.5">{lang === 'zh' ? mod.kpiLabel : mod.kpiLabelEn}</div>
                    </div>
                  </div>

                  {/* Right content */}
                  <div className="flex-1 p-6 lg:p-8">
                    <p className="text-slate-700 dark:text-slate-300 font-medium mb-5 text-base leading-relaxed">{lang === 'zh' ? mod.tagline : mod.taglineEn}</p>
                    <div className="grid sm:grid-cols-2 gap-y-2.5 gap-x-6 mb-5">
                      {(lang === 'zh' ? mod.features : mod.featuresEn).map(f => (
                        <div key={f} className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-400">
                          <CheckCircle className="w-4 h-4 text-emerald-500 flex-none" />
                          {f}
                        </div>
                      ))}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {mod.integrations.map(intg => (
                        <span key={intg} className="text-xs px-2.5 py-1 rounded-full bg-slate-100 dark:bg-white/[0.06] text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700/40">{intg}</span>
                      ))}
                      <span className="text-xs text-slate-400 dark:text-slate-500 ml-1">{t('moduleMoreLabel')}</span>
                    </div>
                  </div>

                  {/* Arrow CTA */}
                  <div className="flex-none flex items-center px-6 lg:px-8 py-4 lg:py-0 border-t lg:border-t-0 lg:border-l border-slate-100 dark:border-slate-700/40">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-400 dark:text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      <span className="hidden lg:inline">{t('moduleLearnMore')}</span>
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Bottom CTA */}
          <div className="mt-14 rounded-3xl bg-gradient-to-br from-blue-600 to-violet-600 p-8 sm:p-12 text-center text-white">
            <h3 className="text-2xl sm:text-3xl font-bold mb-3">{t('modulesBotCta1')}</h3>
            <p className="text-blue-100 mb-8 text-lg">{t('modulesBotCta2')}</p>
            <Link
              href="/vibe-demo/recruitai/consultation"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-blue-700 font-bold rounded-2xl text-lg shadow-xl hover:shadow-2xl hover:scale-105 transition-all"
            >
              {t('modulesBotBtn')} <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Anti-Consultant Positioning ── */}
      <section className="py-24 px-4 bg-slate-900 dark:bg-slate-950">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold text-blue-400 uppercase tracking-widest mb-3">{t('antiTag')}</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">{t('antiH2')}</h2>
            <p className="text-slate-400 text-lg max-w-3xl mx-auto">{t('antiSub')}</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-6 mb-10">
            {/* Big Agency */}
            <div className="rounded-2xl border border-slate-700/50 bg-slate-800/60 p-7 flex flex-col">
              <div className="text-slate-400 text-sm font-semibold mb-5">{lang === 'zh' ? '大型顧問公司' : 'Big Agency'}</div>
              <div className="space-y-4 flex-1">
                <div>
                  <div className="text-red-400 font-black text-2xl">HK$300k–800k</div>
                  <div className="text-slate-500 text-xs mt-0.5">{lang === 'zh' ? '前期設置費' : 'Upfront setup fee'}</div>
                </div>
                <div>
                  <div className="text-slate-300 font-bold">{lang === 'zh' ? '4–8 個月' : '4–8 months'}</div>
                  <div className="text-slate-500 text-xs mt-0.5">{lang === 'zh' ? '部署週期' : 'Deployment timeline'}</div>
                </div>
                <div>
                  <div className="text-slate-300 font-bold">{lang === 'zh' ? '龐大文件需求' : 'Heavy documentation'}</div>
                  <div className="text-slate-500 text-xs mt-0.5">{lang === 'zh' ? '大量會議及審批流程' : 'Endless meetings & approvals'}</div>
                </div>
              </div>
            </div>

            {/* RecruitAIStudio — highlighted */}
            <div className="relative rounded-2xl border-2 border-blue-500 bg-gradient-to-b from-blue-700 to-blue-900 p-7 flex flex-col shadow-2xl shadow-blue-900/50 ring-1 ring-blue-400/20">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-blue-400 text-slate-900 text-xs font-black rounded-full">RecruitAIStudio ✓</div>
              <div className="text-blue-200 text-sm font-semibold mb-5 mt-2">RecruitAIStudio</div>
              <div className="space-y-4 flex-1">
                <div>
                  <div className="text-white font-black text-2xl">HK$8,000{lang === 'zh' ? '/月' : '/mo'}</div>
                  <div className="text-blue-300 text-xs mt-0.5">{lang === 'zh' ? '月費訂閱，即時可用' : 'Monthly subscription, start immediately'}</div>
                </div>
                <div>
                  <div className="text-white font-bold">{lang === 'zh' ? '1 週上線' : '1 week live'}</div>
                  <div className="text-blue-300 text-xs mt-0.5">{lang === 'zh' ? '見效即付' : 'Pay when it works'}</div>
                </div>
                <ul className="space-y-1.5 mt-3">
                  {(lang === 'zh'
                    ? ['月費訂閱，即時可用', '1 週上線，見效即付', 'AI 原生，持續進化', '免費試用首月']
                    : ['Monthly subscription, start immediately', 'Live in 1 week — pay when it works', 'AI-native, continuously evolving', 'First month free trial']
                  ).map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm text-blue-100">
                      <CheckCircle className="w-4 h-4 text-emerald-300 flex-none" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* In-house AI Team */}
            <div className="rounded-2xl border border-slate-700/50 bg-slate-800/60 p-7 flex flex-col">
              <div className="text-slate-400 text-sm font-semibold mb-5">{lang === 'zh' ? '自建 AI 團隊' : 'In-house AI Team'}</div>
              <div className="space-y-4 flex-1">
                <div>
                  <div className="text-red-400 font-black text-2xl">HK$50k+{lang === 'zh' ? '/月' : '/mo'}</div>
                  <div className="text-slate-500 text-xs mt-0.5">{lang === 'zh' ? '薪資成本' : 'Salary costs'}</div>
                </div>
                <div>
                  <div className="text-slate-300 font-bold">{lang === 'zh' ? '6–12 個月' : '6–12 months'}</div>
                  <div className="text-slate-500 text-xs mt-0.5">{lang === 'zh' ? '招聘及培訓週期' : 'Hiring & training period'}</div>
                </div>
                <div>
                  <div className="text-slate-300 font-bold">{lang === 'zh' ? '需 IT 基礎設施' : 'IT infrastructure needed'}</div>
                  <div className="text-slate-500 text-xs mt-0.5">{lang === 'zh' ? '伺服器、工具、維護成本高' : 'Servers, tools, high maintenance cost'}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center">
            <p className="text-blue-300 font-semibold text-lg">{t('antiBot')}</p>
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="py-24 px-4 bg-white dark:bg-slate-950">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              {t('stepsH2')}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-lg max-w-xl mx-auto">
              {t('stepsSub')}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map((step, idx) => {
              const Icon = step.icon;
              const stepTitles = ['Free 30-Min Consultation', 'Custom Workflow Design', 'AI Agents Go Live', 'Scale & See Your ROI'];
              const stepDescs = [
                'Our AI consultant digs deep into your business pain points to design a customised automation roadmap. Completely free, zero obligation.',
                'Our engineers design bespoke AI agent workflows tailored to your processes, ensuring perfect integration with your existing systems.',
                'After testing, we deploy your agents with full technical support and staff training so your team hits the ground running.',
                'We continuously monitor agent performance and deliver monthly optimisation reports. Most clients see measurable business improvement within month 1.',
              ];
              const stepBadges = ['FREE', 'Week 1', 'Weeks 2–3', 'Month 1'];
              return (
                <div key={step.num} className="relative">
                  {/* Connector line */}
                  {idx < STEPS.length - 1 && (
                    <div className="hidden lg:block absolute top-10 left-full w-6 z-10">
                      <ChevronRight className="w-5 h-5 text-slate-300 dark:text-slate-600 -translate-x-1" />
                    </div>
                  )}

                  <div className={`rounded-2xl border p-6 ${step.bg} ${step.border} h-full`}>
                    {/* Step number */}
                    <div className="flex items-center justify-between mb-4">
                      <span className={`text-xs font-bold px-2 py-1 rounded ${step.badgeBg} ${step.badgeText}`}>
                        {lang === 'zh' ? step.badge : stepBadges[idx]}
                      </span>
                      <span className="text-2xl font-black text-slate-200 dark:text-white/10">{step.num}</span>
                    </div>

                    {/* Icon */}
                    <div className={`w-12 h-12 rounded-xl bg-white dark:bg-slate-800/60 border ${step.border} flex items-center justify-center mb-4 shadow-sm`}>
                      <Icon className={`w-6 h-6 ${step.color}`} />
                    </div>

                    <h3 className="font-bold text-slate-900 dark:text-white mb-2">{lang === 'zh' ? step.title : stepTitles[idx]}</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{lang === 'zh' ? step.desc : stepDescs[idx]}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/vibe-demo/recruitai/consultation"
              className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-lg transition-all duration-200 shadow-lg shadow-blue-600/20"
            >
              {t('stepsBtn')}
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Before / After Timeline ── */}
      <section className="py-24 px-4 bg-slate-950">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold text-blue-400 uppercase tracking-widest mb-3">{t('beforeAfterTag')}</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              {t('beforeAfter')}
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              {lang === 'zh' ? '數字不說謊，看看部署 RecruitAI Studio 前後的真實差異' : 'Numbers don\'t lie — see the real difference before and after RecruitAI Studio'}
            </p>
          </div>
          <div className="bg-slate-900 border border-slate-700/50 rounded-3xl overflow-hidden">
            <BeforeAfterTimeline lang={lang} />
          </div>
        </div>
      </section>

      {/* ── ROI Calculator ── */}
      <section id="roi" className="py-24 px-4 bg-slate-950">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold text-emerald-400 uppercase tracking-widest mb-3">{t('roiTag')}</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              {t('roiTitle')}
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              {t('roiSub')}
            </p>
          </div>
          <RoiCalculator lang={lang} />
        </div>
      </section>

      {/* ── Case Studies ── */}
      <section id="case-studies" className="py-24 px-4 bg-slate-50/50 dark:bg-white/[0.02]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-3">{t('casesTag')}</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              {t('casesH2')}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-lg max-w-2xl mx-auto">
              {t('casesSub')}
            </p>
          </div>

          {/* Case Study Tabs */}
          <div className="flex flex-wrap justify-center gap-3 mb-10">
            {CASE_STUDIES.map((cs, idx) => (
              <button
                key={cs.id}
                onClick={() => setActiveCaseStudy(idx)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  activeCaseStudy === idx
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-white dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700/50 hover:border-blue-300 dark:hover:border-blue-700'
                }`}
              >
                <span className={`w-6 h-6 rounded-full bg-gradient-to-br ${cs.logoGrad} flex items-center justify-center text-white text-xs font-bold`}>
                  {cs.logo.charAt(0)}
                </span>
                {lang === 'zh' ? cs.company : cs.companyEn}
              </button>
            ))}
          </div>

          {/* Active Case Study */}
          {CASE_STUDIES.map((cs, idx) => idx !== activeCaseStudy ? null : (
            <div key={cs.id} className="bg-white dark:bg-slate-800/60 rounded-3xl border border-slate-200 dark:border-slate-700/50 shadow-lg overflow-hidden">
              <div className="grid lg:grid-cols-2">
                {/* Left: Story */}
                <div className="p-8 lg:p-10 border-b lg:border-b-0 lg:border-r border-slate-100 dark:border-slate-700/50">
                  {/* Header */}
                  <div className="flex items-center gap-4 mb-6">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${cs.logoGrad} flex items-center justify-center text-white font-black text-lg shadow-md`}>
                      {cs.logo}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white">{lang === 'zh' ? cs.company : cs.companyEn}</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{lang === 'zh' ? cs.industry : cs.industryEn}</p>
                    </div>
                  </div>

                  {/* Agents used */}
                  <div className="flex flex-wrap gap-2 mb-6">
                    {(lang === 'zh' ? cs.agents : cs.agentsEn).map((a, ai) => (
                      <span key={a} className={`text-xs font-semibold px-2.5 py-1 rounded-full ${cs.agentColors[ai]}`}>{a}</span>
                    ))}
                  </div>

                  {/* Problem */}
                  <div className="mb-5">
                    <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-2">{t('casesChallengeLabel')}</p>
                    <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">{lang === 'zh' ? cs.problem : cs.problemEn}</p>
                  </div>

                  {/* Solution */}
                  <div className="mb-6">
                    <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-2">{t('casesSolutionLabel')}</p>
                    <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">{lang === 'zh' ? cs.solution : cs.solutionEn}</p>
                  </div>

                  {/* Highlight badge */}
                  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-bold ${cs.highlightBg} ${cs.highlightBorder} ${cs.highlightText}`}>
                    <Trophy className="w-4 h-4" />
                    {lang === 'zh' ? cs.highlight : cs.highlightEn}
                  </div>
                </div>

                {/* Right: Results + Quote */}
                <div className="p-8 lg:p-10">
                  <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-6">{t('casesResultsLabel')}</p>

                  {/* Metrics */}
                  <div className="space-y-4 mb-8">
                    {cs.results.map((r, ri) => (
                      <div key={ri} className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-slate-700/40">
                        <div className={`text-2xl font-black ${r.up ? 'text-emerald-600 dark:text-emerald-400' : 'text-blue-600 dark:text-blue-400'} shrink-0 min-w-[120px]`}>
                          {lang === 'zh' ? r.metric : r.metricEn}
                        </div>
                        <div className="text-sm text-slate-600 dark:text-slate-400 leading-snug">{lang === 'zh' ? r.label : r.labelEn}</div>
                      </div>
                    ))}
                  </div>

                  {/* Quote */}
                  <div className="border-l-4 border-blue-400 pl-5">
                    <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed italic mb-3">
                      &ldquo;{lang === 'zh' ? cs.quote : cs.quoteEn}&rdquo;
                    </p>
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${cs.logoGrad} flex items-center justify-center text-white text-xs font-bold`}>
                        {cs.author.charAt(0)}
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-slate-900 dark:text-white">{cs.author}</span>
                        <span className="text-sm text-slate-500 dark:text-slate-400"> · {lang === 'zh' ? cs.role : cs.roleEn}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          <div className="mt-10 text-center">
            <Link
              href="/vibe-demo/recruitai/consultation"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-blue-600/20"
            >
              {t('casesCta')}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── AI Agents ── */}
      <section id="agents" className="py-24 px-4 bg-slate-50/50 dark:bg-white/[0.02]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-3">{t('agentsTag')}</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              {t('agentsH2')}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-lg max-w-2xl mx-auto">
              {t('agentsSub')}
            </p>
          </div>

          {/* Agent Tabs */}
          <div className="flex justify-center gap-2 mb-10">
            {AGENTS.map((agent, idx) => (
              <button
                key={agent.id}
                onClick={() => setActiveAgent(idx)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeAgent === idx
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-white dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700/50 hover:border-blue-300 dark:hover:border-blue-700'
                }`}
              >
                {lang === 'zh' ? agent.title : agent.titleEn}
              </button>
            ))}
          </div>

          {/* Agent Cards */}
          <div className="grid lg:grid-cols-3 gap-6">
            {AGENTS.map((agent, idx) => {
              const Icon = agent.icon;
              const isActive = activeAgent === idx;
              return (
                <div
                  key={agent.id}
                  onClick={() => setActiveAgent(idx)}
                  className={`relative rounded-2xl border p-8 cursor-pointer transition-all duration-300 ${
                    isActive
                      ? `${agent.bgLight} ${agent.bgDark} ${agent.borderColor} shadow-lg scale-[1.02]`
                      : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/50 hover:shadow-md'
                  }`}
                >
                  {/* Number */}
                  <span className="absolute top-4 right-4 text-4xl font-black text-slate-100 dark:text-white/5 select-none">
                    {String(idx + 1).padStart(2, '0')}
                  </span>

                  {/* Icon */}
                  <div className={`w-12 h-12 rounded-xl ${agent.iconBg} flex items-center justify-center mb-5`}>
                    <Icon className={`w-6 h-6 ${agent.iconColor}`} />
                  </div>

                  <div className={`inline-block text-xs font-semibold px-2 py-1 rounded ${agent.badgeBg} ${agent.badgeText} mb-3`}>
                    {agent.titleEn}
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                    {lang === 'zh' ? agent.title : agent.titleEn}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-5 leading-relaxed">
                    {lang === 'zh' ? agent.description : agent.descriptionEn}
                  </p>

                  <ul className="space-y-2 mb-6">
                    {(lang === 'zh' ? agent.features : agent.featuresEn).map(f => (
                      <li key={f} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                        <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <div className={`text-sm font-bold ${agent.statColor}`}>
                    📈 {lang === 'zh' ? agent.stat : agent.statEn}
                  </div>

                  {/* Workflow visualizer */}
                  <button
                    onClick={e => { e.stopPropagation(); setExpandedWorkflow(expandedWorkflow === idx ? null : idx); }}
                    className={`mt-5 w-full flex items-center justify-between text-xs font-semibold px-3 py-2 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-white/20 text-slate-700 dark:text-slate-200 hover:bg-white/30'
                        : 'bg-slate-100 dark:bg-slate-700/40 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700/60'
                    }`}
                  >
                    <span>{t('agentsWorkflowBtn')}</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expandedWorkflow === idx ? 'rotate-180' : ''}`} />
                  </button>

                  {expandedWorkflow === idx && AGENT_WORKFLOWS[agent.id] && (
                    <div className="mt-4 pl-1">
                      <WorkflowViz agentId={agent.id as 'invoice' | 'customer' | 'bi'} lang={lang} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Key Benefits ── */}
      <section className="py-24 px-4 bg-slate-50/50 dark:bg-white/[0.02]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              {t('benefitsH2')}
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Clock,
                iconBg: 'bg-blue-100 dark:bg-blue-900/40',
                iconColor: 'text-blue-600 dark:text-blue-400',
                stat: '24/7',
                label: t('ben1Label'),
                desc: t('ben1Desc'),
              },
              {
                icon: TrendingUp,
                iconBg: 'bg-emerald-100 dark:bg-emerald-900/40',
                iconColor: 'text-emerald-600 dark:text-emerald-400',
                stat: '3×',
                label: t('ben2Label'),
                desc: t('ben2Desc'),
              },
              {
                icon: Users,
                iconBg: 'bg-amber-100 dark:bg-amber-900/40',
                iconColor: 'text-amber-600 dark:text-amber-400',
                stat: lang === 'zh' ? '3–6月' : '3–6 mo',
                label: t('ben3Label'),
                desc: t('ben3Desc'),
              },
              {
                icon: Shield,
                iconBg: 'bg-purple-100 dark:bg-purple-900/40',
                iconColor: 'text-purple-600 dark:text-purple-400',
                stat: '100%',
                label: t('ben4Label'),
                desc: t('ben4Desc'),
              },
            ].map(item => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="text-center p-8 rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 shadow-sm">
                  <div className={`w-14 h-14 rounded-2xl ${item.iconBg} flex items-center justify-center mx-auto mb-5`}>
                    <Icon className={`w-7 h-7 ${item.iconColor}`} />
                  </div>
                  <div className="text-3xl font-extrabold text-slate-900 dark:text-white mb-1">{item.stat}</div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200 mb-2">{item.label}</div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Integrations ── */}
      <section id="integrations" className="py-24 px-4 bg-white dark:bg-slate-950">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-3">{t('integrationsTag')}</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              {t('integrationsH2')}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-lg max-w-2xl mx-auto">
              {t('integrationsSub')}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {INTEGRATIONS.map(group => (
              <div
                key={group.category}
                className="bg-slate-50/80 dark:bg-white/[0.03] border border-slate-200 dark:border-slate-800/50 rounded-2xl p-6"
              >
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xl">{group.icon}</span>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">{lang === 'zh' ? group.category : group.categoryEn}</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {group.items.map(item => (
                    <span
                      key={item}
                      className="text-xs px-2.5 py-1.5 bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 rounded-lg text-slate-700 dark:text-slate-300 shadow-sm"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 p-6 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/40 text-center">
            <p className="text-blue-800 dark:text-blue-200 text-sm">
              {t('integrationsCustom')}
              {' '}<Link href="/vibe-demo/recruitai/consultation" className="underline hover:no-underline">{t('integrationsCustomLink')}</Link>
            </p>
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="py-24 px-4 bg-white dark:bg-slate-950">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              {t('pricingH2')}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-lg max-w-xl mx-auto">
              {t('pricingSub')}
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 items-start">
            {PLANS.map(plan => (
              <div
                key={plan.name}
                className={`relative rounded-2xl border p-8 ${plan.cardBg} ${plan.cardBorder} ${
                  plan.highlighted ? 'text-white shadow-2xl shadow-blue-900/30' : 'shadow-sm'
                }`}
              >
                {/* Popular tag */}
                {(lang === 'zh' ? plan.tag : plan.tagEn) && (
                  <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold ${plan.tagBg} ${plan.tagText}`}>
                    {lang === 'zh' ? plan.tag : plan.tagEn}
                  </div>
                )}

                <div className="mb-6">
                  <div className={`text-xs font-semibold mb-1 ${plan.highlighted ? 'text-blue-200' : 'text-slate-500 dark:text-slate-400'}`}>
                    {plan.nameEn}
                  </div>
                  <div className={`text-xl font-bold mb-1 ${plan.highlighted ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                    {lang === 'zh' ? plan.name : plan.nameEn}
                  </div>
                  <div className={`text-xs mb-4 ${plan.highlighted ? 'text-blue-200' : 'text-slate-500 dark:text-slate-400'}`}>
                    {t('pricingSuitFor')} {lang === 'zh' ? plan.suitFor : plan.suitForEn}
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className={`text-4xl font-extrabold ${plan.highlighted ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                      {lang === 'zh' ? plan.price : (plan.priceEn ?? plan.price)}
                    </span>
                    {plan.period && (
                      <span className={`text-sm ${plan.highlighted ? 'text-blue-200' : 'text-slate-500 dark:text-slate-400'}`}>
                        {t('pricingPeriod')}
                      </span>
                    )}
                  </div>
                  <p className={`text-sm mt-3 leading-relaxed ${plan.highlighted ? 'text-blue-100' : 'text-slate-600 dark:text-slate-400'}`}>
                    {lang === 'zh' ? plan.desc : plan.descEn}
                  </p>
                </div>

                <ul className="space-y-3 mb-8">
                  {(lang === 'zh' ? plan.features : plan.featuresEn).map(f => (
                    <li key={f} className={`flex items-start gap-2 text-sm ${plan.highlighted ? 'text-blue-100' : 'text-slate-700 dark:text-slate-300'}`}>
                      <CheckCircle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${plan.highlighted ? 'text-emerald-300' : 'text-emerald-500'}`} />
                      {f}
                    </li>
                  ))}
                </ul>

                <Link
                  href="/vibe-demo/recruitai/consultation"
                  className={`block w-full text-center py-3 px-6 rounded-xl font-semibold text-sm transition-all duration-200 ${plan.btnClass}`}
                >
                  {(lang === 'zh' ? plan.price : (plan.priceEn ?? plan.price)) === (lang === 'zh' ? '定制報價' : 'Custom Quote') ? t('pricingContact') : t('pricingStart')}
                </Link>
              </div>
            ))}
          </div>

          <p className="text-center text-sm text-slate-400 dark:text-slate-500 mt-8">
            {t('pricingFooter')}
          </p>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section id="testimonials" className="py-24 px-4 bg-slate-50/50 dark:bg-white/[0.02]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              {t('testimonialsH2')}
            </h2>
            <div className="flex justify-center items-center gap-1 mb-2">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <p className="text-slate-500 dark:text-slate-400">{t('testimonialsRating')}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map(t => (
              <div
                key={t.name}
                className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 rounded-2xl p-6 shadow-sm flex flex-col"
              >
                {/* Stars */}
                <div className="flex gap-1 mb-4">
                  {[...Array(t.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>

                {/* Highlight badge */}
                <div className="inline-block text-xs font-bold px-2 py-1 rounded bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 mb-4">
                  ✓ {t.highlight}
                </div>

                {/* Quote */}
                <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed flex-1 mb-6">
                  &ldquo;{t.quote}&rdquo;
                </p>

                {/* Author */}
                <div className="flex items-center gap-3 border-t border-slate-100 dark:border-slate-700/50 pt-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {t.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-slate-900 dark:text-white">{t.name}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{t.role} · {t.company}</div>
                    <div className="text-xs text-slate-400 dark:text-slate-500">{t.industry}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="py-24 px-4 bg-white dark:bg-slate-950">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              {t('faqH2')}
            </h2>
            <p className="text-slate-500 dark:text-slate-400">
              {t('faqStillQ')}
              <Link href="/vibe-demo/recruitai/consultation" className="text-blue-600 dark:text-blue-400 underline ml-1">
                {t('faqChat')}
              </Link>
            </p>
          </div>

          <div className="space-y-4">
            {FAQS.map((faq, idx) => (
              <div
                key={idx}
                className="border border-slate-200 dark:border-slate-800/50 rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors"
                >
                  <span className="font-medium text-slate-900 dark:text-white pr-4">{lang === 'zh' ? faq.q : faq.qEn}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-slate-400 flex-shrink-0 transition-transform duration-200 ${
                      openFaq === idx ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {openFaq === idx && (
                  <div className="px-6 pb-5 text-sm text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800/50 pt-4">
                    {lang === 'zh' ? faq.a : faq.aEn}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Carnival Teaser ── */}
      <section className="py-20 px-4 bg-gradient-to-br from-slate-900 to-slate-950 relative overflow-hidden">
        {/* Animated confetti dots */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {['bg-yellow-400','bg-blue-400','bg-pink-400','bg-emerald-400','bg-orange-400'].map((c, i) => (
            <div key={i} className={`absolute rounded-full opacity-20 animate-pulse ${c}`}
              style={{ width: 12 + i*6, height: 12 + i*6, top: `${15 + i*14}%`, left: `${8 + i*18}%`, animationDelay: `${i*0.4}s` }}
            />
          ))}
        </div>

        <div className="max-w-5xl mx-auto relative z-10">
          <div className="rounded-3xl border border-yellow-400/30 bg-white/[0.03] overflow-hidden">
            <div className="grid lg:grid-cols-2 gap-0">
              {/* Left — text */}
              <div className="p-10 lg:p-14 flex flex-col justify-center">
                <div className="text-5xl mb-4 select-none">🎪</div>
                <p className="text-xs font-bold text-yellow-400 uppercase tracking-widest mb-3">{t('carnivalTag')}</p>
                <h2 className="text-3xl sm:text-4xl font-black text-white mb-4 leading-tight">
                  RecruitAI
                  <span className="block text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400">
                    {t('carnivalH2b')}
                  </span>
                </h2>
                <p className="text-slate-400 text-lg leading-relaxed mb-8">
                  {t('carnivalSub')}
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/vibe-demo/recruitai/carnival"
                    className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-300 hover:to-orange-400 text-slate-900 font-black rounded-2xl text-lg shadow-xl shadow-yellow-400/20 hover:scale-105 transition-all duration-200"
                  >
                    {t('carnivalCta')}
                  </Link>
                  <span className="inline-flex items-center text-slate-500 text-sm">
                    {t('carnivalNoDl')}
                  </span>
                </div>
              </div>

              {/* Right — feature tiles */}
              <div className="p-8 lg:p-10 border-t lg:border-t-0 lg:border-l border-white/[0.06] flex flex-col justify-center gap-4">
                {[
                  { emoji: '🤖', titleKey: 'carnivalF1Title', descKey: 'carnivalF1Desc' },
                  { emoji: '🎠', titleKey: 'carnivalF2Title', descKey: 'carnivalF2Desc' },
                  { emoji: '🦁', titleKey: 'carnivalF3Title', descKey: 'carnivalF3Desc' },
                  { emoji: '🎉', titleKey: 'carnivalF4Title', descKey: 'carnivalF4Desc' },
                ].map(f => (
                  <div key={f.titleKey} className="flex items-start gap-3.5 p-4 rounded-2xl bg-white/[0.04] border border-white/[0.06]">
                    <span className="text-2xl mt-0.5 shrink-0">{f.emoji}</span>
                    <div>
                      <p className="text-sm font-semibold text-white mb-0.5">{t(f.titleKey)}</p>
                      <p className="text-xs text-slate-400 leading-relaxed">{t(f.descKey)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-24 px-4 bg-gradient-to-br from-blue-700 via-blue-800 to-blue-900 dark:from-blue-900 dark:via-blue-950 dark:to-slate-950">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl font-extrabold text-white mb-6 leading-tight">
            {t('ctaH2a')}
            <br />
            {t('ctaH2b')}
          </h2>
          <p className="text-blue-100 text-xl mb-4">
            {t('ctaSub')}
          </p>
          <p className="text-blue-200/70 text-sm mb-10">
            {t('ctaSub2')}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/vibe-demo/recruitai/consultation"
              className="inline-flex items-center justify-center gap-2 px-10 py-4 bg-white hover:bg-blue-50 text-blue-700 font-bold rounded-xl text-lg transition-all duration-200 shadow-xl"
            >
              <Calendar className="w-5 h-5" />
              {t('ctaBtn')}
            </Link>
            <a
              href="tel:+85237000000"
              className="inline-flex items-center justify-center gap-2 px-10 py-4 border-2 border-white/40 hover:border-white text-white font-semibold rounded-xl text-lg transition-all duration-200"
            >
              <Phone className="w-5 h-5" />
              +852 3700 0000
            </a>
          </div>

          <div className="mt-12 flex flex-wrap justify-center gap-6 text-blue-200 text-sm">
            <span className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              {t('ctaTrust1')}
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              {t('ctaTrust2')}
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              {t('ctaTrust3')}
            </span>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-slate-900 dark:bg-slate-950 border-t border-slate-800 py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-white">
                  RecruitAI<span className="text-blue-400">Studio</span>
                </span>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed mb-4">
                {t('footerDesc')}
              </p>
              <p className="text-slate-500 text-xs">{t('footerBy')}</p>
            </div>

            {/* Product */}
            <div>
              <h4 className="text-white font-semibold mb-4">{t('footerProduct')}</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><button onClick={() => scrollTo('#modules')} className="hover:text-white transition-colors">{t('footerModulesLink')}</button></li>
                <li><button onClick={() => scrollTo('#how-it-works')} className="hover:text-white transition-colors">{t('footerHowItWorks')}</button></li>
                <li><button onClick={() => scrollTo('#pricing')} className="hover:text-white transition-colors">{t('footerPricing')}</button></li>
                <li><button onClick={() => scrollTo('#faq')} className="hover:text-white transition-colors">{t('footerFaq')}</button></li>
              </ul>
            </div>

            {/* Solutions */}
            <div>
              <h4 className="text-white font-semibold mb-4">{t('footerSolutions')}</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li className="hover:text-white transition-colors cursor-default">{t('footerRetail')}</li>
                <li className="hover:text-white transition-colors cursor-default">{t('footerFnb')}</li>
                <li className="hover:text-white transition-colors cursor-default">{t('footerFinance')}</li>
                <li className="hover:text-white transition-colors cursor-default">{t('footerLogistics')}</li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-white font-semibold mb-4">{t('footerContact')}</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li>
                  <a href="mailto:hello@recruitaistudio.hk" className="hover:text-white transition-colors">
                    hello@recruitaistudio.hk
                  </a>
                </li>
                <li>
                  <a href="tel:+85237000000" className="hover:text-white transition-colors">
                    +852 3700 0000
                  </a>
                </li>
                <li className="pt-2">
                  <Link
                    href="/vibe-demo/recruitai/consultation"
                    className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors"
                  >
                    {t('footerBook')}
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-slate-500 text-sm">
              © 2026 RecruitAI Studio by 5 Miles Lab. {t('footerRights')}
            </p>
            <div className="flex gap-6 text-xs text-slate-500">
              <Link href="/vibe-demo/recruitai/contact" className="hover:text-slate-300 transition-colors">{t('footerContactLink')}</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
