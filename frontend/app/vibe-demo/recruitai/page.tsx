'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {
  CheckCircle,
  ChevronDown,
  ChevronRight,
  ArrowRight,
  Menu,
  X,
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

const RecruitAICarnival = dynamic(
  () => import('./components/RecruitAICarnival'),
  { ssr: false, loading: () => (
    <div className="w-full h-full bg-gradient-to-br from-blue-600 to-blue-900 flex items-center justify-center">
      <div className="text-white text-center">
        <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm opacity-70">Loading AI Carnival...</p>
      </div>
    </div>
  )}
);

// ─── Data ───────────────────────────────────────────────────────────────────

const NAV_LINKS = [
  { label: '功能', href: '#agents' },
  { label: '案例', href: '#cases' },
  { label: '整合', href: '#integrations' },
  { label: '價格', href: '#pricing' },
  { label: '常見問題', href: '#faq' },
];

const STATS = [
  { value: '50+', label: '香港中小企信任我們', sub: 'Hong Kong SMEs' },
  { value: '70%', label: '節省時間成本', sub: 'Time & Cost Saved' },
  { value: '3×', label: '平均業績增長', sub: 'Revenue Growth' },
  { value: '<3天', label: '快速上線', sub: 'Deployment Speed' },
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
    features: [
      'OCR 智能掃描，支援多種格式',
      '自動分類及帳目核對',
      '異常發票即時提醒',
      '與主流會計系統無縫整合',
    ],
    stat: '減少 80% 人工錄入',
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
    features: [
      '多渠道接入：WhatsApp、網頁、電郵',
      '智能常見問題自動回覆',
      '無縫轉接真人客服',
      '客戶滿意度追蹤報告',
    ],
    stat: '24/7 回應，15 分鐘內',
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
    features: [
      '銷售趨勢實時儀表板',
      '每週自動業務報告',
      '客戶行為分析與預測',
      '競爭對手市場洞察',
    ],
    stat: '提升 50% 決策速度',
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
    title: '免費 15 分鐘諮詢',
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
    tagBg: '',
    tagText: '',
    desc: '適合初創及小型企業，快速驗證 AI 自動化價值',
    highlighted: false,
    cardBg: 'bg-white dark:bg-slate-800/60',
    cardBorder: 'border-slate-200 dark:border-slate-700/50',
    btnClass:
      'border border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white dark:border-blue-500 dark:text-blue-400 dark:hover:bg-blue-600 dark:hover:text-white',
    features: [
      '1 個 AI 代理（自選）',
      '標準工作流程配置',
      '電郵技術支援',
      '每月效能報告',
      '最多 5 名用戶',
    ],
    suitFor: '1–5 名員工',
  },
  {
    name: '業務版',
    nameEn: 'Business',
    price: 'HK$18,000',
    period: '/月',
    tag: '最受歡迎',
    tagBg: 'bg-amber-400',
    tagText: 'text-slate-900',
    desc: '三大 AI 代理全配置，最適合快速成長中的中小企',
    highlighted: true,
    cardBg: 'bg-gradient-to-b from-blue-700 to-blue-900',
    cardBorder: 'border-blue-500',
    btnClass:
      'bg-white text-blue-700 hover:bg-blue-50 font-semibold',
    features: [
      '3 個 AI 代理（全套）',
      '定制工作流程設計',
      '優先技術支援（4 小時內回覆）',
      '每週效能報告 + 洞察',
      '無限用戶數量',
      'API 整合（WhatsApp、ERP 等）',
      '季度策略回顧',
    ],
    suitFor: '5–20 名員工',
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
    suitFor: '20+ 名員工',
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

// ─── Case Studies ────────────────────────────────────────────────────────────

const CASE_STUDIES = [
  {
    id: 'retail',
    company: '本地零售精品店',
    industry: '零售 · 8 名員工 · 深水埗',
    logo: '零',
    logoGrad: 'from-pink-500 to-rose-600',
    agents: ['發票處理代理', '客戶服務代理'],
    agentColors: ['bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300', 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'],
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

// ─── Integrations ────────────────────────────────────────────────────────────

const INTEGRATIONS = [
  { category: '會計 & 財務', icon: '💰', items: ['Xero', 'QuickBooks', 'Sage', 'FreshBooks', 'MYOB'] },
  { category: '通訊渠道', icon: '💬', items: ['WhatsApp Business', 'WeChat', 'Gmail', 'Outlook', 'Telegram'] },
  { category: 'CRM & 銷售', icon: '🎯', items: ['Salesforce', 'HubSpot', 'Zoho CRM', 'Monday.com', 'Airtable'] },
  { category: 'ERP & POS', icon: '🏪', items: ['SAP', 'Oracle NetSuite', 'Shopify', 'WooCommerce', '各類 POS'] },
  { category: '雲端文件', icon: '☁️', items: ['Google Drive', 'Dropbox', 'OneDrive', 'Box', 'Notion'] },
  { category: '香港本地', icon: '🇭🇰', items: ['政府 eDDI', 'MPF 系統', 'FPS 轉帳', 'eTax', 'HRMS'] },
];

// ─── Main Component ──────────────────────────────────────────────────────────

export default function RecruitAIPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [activeAgent, setActiveAgent] = useState(0);
  const [activeCaseStudy, setActiveCaseStudy] = useState(0);
  const [expandedWorkflow, setExpandedWorkflow] = useState<number | null>(null);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Cycle through agents automatically
  useEffect(() => {
    const timer = setInterval(() => setActiveAgent(prev => (prev + 1) % 3), 4000);
    return () => clearInterval(timer);
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id.replace('#', ''))?.scrollIntoView({ behavior: 'smooth' });
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans">
      {/* ── Navigation ── */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl shadow-sm border-b border-slate-200/80 dark:border-slate-800/50'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-lg text-slate-900 dark:text-white">
                RecruitAI<span className="text-blue-600">Studio</span>
              </span>
              <span className="hidden sm:inline text-xs text-slate-400 ml-1">by 5ML</span>
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-8">
              {NAV_LINKS.map(link => (
                <button
                  key={link.label}
                  onClick={() => scrollTo(link.href)}
                  className="text-sm text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  {link.label}
                </button>
              ))}
            </div>

            {/* CTA + Mobile Menu */}
            <div className="flex items-center gap-3">
              <Link
                href="/vibe-demo/recruitai/consultation"
                className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                免費諮詢
                <ChevronRight className="w-4 h-4" />
              </Link>
              <button
                className="md:hidden p-2 text-slate-600 dark:text-slate-400"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 px-4 py-4 space-y-3">
            {NAV_LINKS.map(link => (
              <button
                key={link.label}
                onClick={() => scrollTo(link.href)}
                className="block w-full text-left text-sm text-slate-700 dark:text-slate-300 py-2"
              >
                {link.label}
              </button>
            ))}
            <Link
              href="/vibe-demo/recruitai/consultation"
              className="block mt-4 px-4 py-3 bg-blue-600 text-white text-sm font-medium rounded-lg text-center"
            >
              免費 15 分鐘諮詢
            </Link>
          </div>
        )}
      </nav>

      {/* ── Hero: 3D AI Carnival ── */}
      <section
        ref={heroRef}
        className="relative overflow-hidden pt-16"
        style={{ height: '100svh', minHeight: '600px' }}
      >
        {/* 3D World fills the hero */}
        <div className="absolute inset-0 top-16">
          <RecruitAICarnival />
        </div>

        {/* Text overlay — bottom of hero */}
        <div className="absolute bottom-0 left-0 right-0 z-10 pointer-events-none">
          <div className="bg-gradient-to-t from-slate-900/90 via-slate-900/60 to-transparent pt-16 pb-8 px-6 text-center">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight mb-3 text-white drop-shadow-lg">
              讓 AI 代理為您工作
            </h1>
            <p className="text-base sm:text-lg text-white/80 mb-4 max-w-lg mx-auto">
              無需技術團隊 · 3 天上線 · 發票、客服、商業智能全自動
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pointer-events-auto">
              <Link
                href="/vibe-demo/recruitai/consultation"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-base transition-all duration-200 shadow-lg shadow-blue-900/40"
              >
                <Phone className="w-4 h-4" />
                免費 15 分鐘諮詢
              </Link>
              <button
                onClick={() => scrollTo('#agents')}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/15 hover:bg-white/25 text-white border border-white/30 font-medium rounded-xl text-base transition-all duration-200 backdrop-blur-sm"
              >
                了解三大 AI 代理
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
            服務各行業中小企業
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

      {/* ── Stats ── */}
      <section className="py-20 bg-gradient-to-br from-blue-700 via-blue-800 to-blue-900 dark:from-blue-900 dark:via-blue-950 dark:to-slate-950">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {STATS.map(stat => (
              <div key={stat.label} className="text-center">
                <div className="text-4xl sm:text-5xl font-extrabold text-white mb-1">
                  {stat.value}
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
            中小企業主的每日困境
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-lg mb-16 max-w-2xl mx-auto">
            您是否每天都在這些問題上浪費寶貴時間？
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
            {[
              {
                emoji: '📄',
                title: '發票處理佔用大量時間',
                desc: '手動錄入、核對發票，一週花費 10+ 小時，錯誤率高且難以追蹤',
              },
              {
                emoji: '😓',
                title: '客戶查詢回覆不及時',
                desc: '非辦公時間客戶無法獲得回覆，損失訂單及客戶信任',
              },
              {
                emoji: '📊',
                title: '難以掌握業務數據',
                desc: '數據分散各處，難以整合分析，決策缺乏數據支撐',
              },
              {
                emoji: '👥',
                title: '人力成本持續上升',
                desc: '重複性工作消耗員工精力，但又無法縮減人手',
              },
              {
                emoji: '🔄',
                title: '業務流程難以擴展',
                desc: '增加業務量需要等比例增加人手，成本壓力巨大',
              },
              {
                emoji: '⏰',
                title: '老闆親力親為所有事',
                desc: '無法從瑣務中解脫，難以專注於核心業務策略',
              },
            ].map(item => (
              <div
                key={item.title}
                className="p-5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-slate-800/50"
              >
                <div className="text-2xl mb-3">{item.emoji}</div>
                <h3 className="font-semibold text-slate-900 dark:text-white mb-2">{item.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-12 p-6 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/40">
            <p className="text-blue-800 dark:text-blue-200 font-semibold text-lg">
              RecruitAIStudio 的三大 AI 代理，正是為解決這些問題而生 →
            </p>
          </div>
        </div>
      </section>

      {/* ── AI Agents ── */}
      <section id="agents" className="py-24 px-4 bg-slate-50/50 dark:bg-white/[0.02]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              三大 AI 代理，解決您的業務痛點
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-lg max-w-2xl mx-auto">
              每個代理專注於一個核心業務領域，一起工作形成強大的自動化生態系統
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
                {agent.title}
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
                    {agent.title}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-5 leading-relaxed">
                    {agent.description}
                  </p>

                  <ul className="space-y-2 mb-6">
                    {agent.features.map(f => (
                      <li key={f} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                        <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <div className={`text-sm font-bold ${agent.statColor}`}>
                    📈 {agent.stat}
                  </div>

                  {/* Workflow expandable */}
                  <button
                    onClick={e => { e.stopPropagation(); setExpandedWorkflow(expandedWorkflow === idx ? null : idx); }}
                    className={`mt-5 w-full flex items-center justify-between text-xs font-semibold px-3 py-2 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-white/20 text-slate-700 dark:text-slate-200 hover:bg-white/30'
                        : 'bg-slate-100 dark:bg-slate-700/40 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700/60'
                    }`}
                  >
                    <span>查看工作流程（如何運作？）</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expandedWorkflow === idx ? 'rotate-180' : ''}`} />
                  </button>

                  {expandedWorkflow === idx && (
                    <div className="mt-3 space-y-2">
                      {(AGENT_WORKFLOWS[agent.id] ?? []).map((wf, wi) => (
                        <div key={wi} className={`flex items-start gap-2.5 text-xs rounded-lg px-3 py-2 ${
                          isActive ? 'bg-white/15 text-slate-700 dark:text-slate-200' : 'bg-slate-50 dark:bg-slate-700/30 text-slate-600 dark:text-slate-300'
                        }`}>
                          <span className="text-sm mt-0.5 shrink-0">{wf.icon}</span>
                          <span className="leading-relaxed">{wf.step}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="py-24 px-4 bg-white dark:bg-slate-950">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              4 步驟，輕鬆啟動 AI 自動化
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-lg max-w-xl mx-auto">
              從諮詢到上線，全程由我們的專家團隊陪伴支援
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map((step, idx) => {
              const Icon = step.icon;
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
                        {step.badge}
                      </span>
                      <span className="text-2xl font-black text-slate-200 dark:text-white/10">{step.num}</span>
                    </div>

                    {/* Icon */}
                    <div className={`w-12 h-12 rounded-xl bg-white dark:bg-slate-800/60 border ${step.border} flex items-center justify-center mb-4 shadow-sm`}>
                      <Icon className={`w-6 h-6 ${step.color}`} />
                    </div>

                    <h3 className="font-bold text-slate-900 dark:text-white mb-2">{step.title}</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{step.desc}</p>
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
              預約免費第一步諮詢
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Case Studies ── */}
      <section id="cases" className="py-24 px-4 bg-slate-50/50 dark:bg-white/[0.02]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-3">真實案例</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              香港中小企業的實際成果
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-lg max-w-2xl mx-auto">
              不是示例數字，是真實客戶的業務轉型故事
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
                {cs.company}
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
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white">{cs.company}</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{cs.industry}</p>
                    </div>
                  </div>

                  {/* Agents used */}
                  <div className="flex flex-wrap gap-2 mb-6">
                    {cs.agents.map((a, ai) => (
                      <span key={a} className={`text-xs font-semibold px-2.5 py-1 rounded-full ${cs.agentColors[ai]}`}>{a}</span>
                    ))}
                  </div>

                  {/* Problem */}
                  <div className="mb-5">
                    <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-2">業務挑戰</p>
                    <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">{cs.problem}</p>
                  </div>

                  {/* Solution */}
                  <div className="mb-6">
                    <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-2">AI 解決方案</p>
                    <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">{cs.solution}</p>
                  </div>

                  {/* Highlight badge */}
                  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-bold ${cs.highlightBg} ${cs.highlightBorder} ${cs.highlightText}`}>
                    <Trophy className="w-4 h-4" />
                    {cs.highlight}
                  </div>
                </div>

                {/* Right: Results + Quote */}
                <div className="p-8 lg:p-10">
                  <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-6">實際成果</p>

                  {/* Metrics */}
                  <div className="space-y-4 mb-8">
                    {cs.results.map(r => (
                      <div key={r.label} className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-slate-700/40">
                        <div className={`text-2xl font-black ${r.up ? 'text-emerald-600 dark:text-emerald-400' : 'text-blue-600 dark:text-blue-400'} shrink-0 min-w-[120px]`}>
                          {r.metric}
                        </div>
                        <div className="text-sm text-slate-600 dark:text-slate-400 leading-snug">{r.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Quote */}
                  <div className="border-l-4 border-blue-400 pl-5">
                    <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed italic mb-3">
                      &ldquo;{cs.quote}&rdquo;
                    </p>
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${cs.logoGrad} flex items-center justify-center text-white text-xs font-bold`}>
                        {cs.author.charAt(0)}
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-slate-900 dark:text-white">{cs.author}</span>
                        <span className="text-sm text-slate-500 dark:text-slate-400"> · {cs.role}</span>
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
              預約諮詢，了解您行業的 AI 方案
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Key Benefits ── */}
      <section className="py-24 px-4 bg-slate-50/50 dark:bg-white/[0.02]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              選擇 RecruitAIStudio 的理由
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Clock,
                iconBg: 'bg-blue-100 dark:bg-blue-900/40',
                iconColor: 'text-blue-600 dark:text-blue-400',
                stat: '24/7',
                label: '全天候運作',
                desc: 'AI 代理不需休息，永不錯過客戶查詢',
              },
              {
                icon: TrendingUp,
                iconBg: 'bg-emerald-100 dark:bg-emerald-900/40',
                iconColor: 'text-emerald-600 dark:text-emerald-400',
                stat: '3×',
                label: '生產力倍增',
                desc: '員工從重複工作解放，專注高價值任務',
              },
              {
                icon: Users,
                iconBg: 'bg-amber-100 dark:bg-amber-900/40',
                iconColor: 'text-amber-600 dark:text-amber-400',
                stat: '3–6月',
                label: '看到 ROI',
                desc: '大部分客戶在 3–6 個月內收回投資',
              },
              {
                icon: Shield,
                iconBg: 'bg-purple-100 dark:bg-purple-900/40',
                iconColor: 'text-purple-600 dark:text-purple-400',
                stat: '100%',
                label: '本地數據合規',
                desc: '符合香港法規，數據安全有保障',
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
            <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-3">無縫整合</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              與您現有系統直接對接
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-lg max-w-2xl mx-auto">
              無需換掉現有軟件。AI 代理直接連接您正在使用的工具，數天內完成整合。
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
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">{group.category}</h3>
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
              <span className="font-bold">沒有看到您使用的系統？</span>
              {' '}我們支援自定義 API 整合，幾乎任何有 API 的軟件均可對接。
              {' '}<Link href="/vibe-demo/recruitai/consultation" className="underline hover:no-underline">聯絡我們了解詳情</Link>
            </p>
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="py-24 px-4 bg-white dark:bg-slate-950">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              選擇適合您的方案
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-lg max-w-xl mx-auto">
              靈活套餐，隨業務增長而擴展。所有方案均包含免費設置諮詢。
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
                {plan.tag && (
                  <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold ${plan.tagBg} ${plan.tagText}`}>
                    {plan.tag}
                  </div>
                )}

                <div className="mb-6">
                  <div className={`text-xs font-semibold mb-1 ${plan.highlighted ? 'text-blue-200' : 'text-slate-500 dark:text-slate-400'}`}>
                    {plan.nameEn}
                  </div>
                  <div className={`text-xl font-bold mb-1 ${plan.highlighted ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                    {plan.name}
                  </div>
                  <div className={`text-xs mb-4 ${plan.highlighted ? 'text-blue-200' : 'text-slate-500 dark:text-slate-400'}`}>
                    適合 {plan.suitFor}
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className={`text-4xl font-extrabold ${plan.highlighted ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                      {plan.price}
                    </span>
                    {plan.period && (
                      <span className={`text-sm ${plan.highlighted ? 'text-blue-200' : 'text-slate-500 dark:text-slate-400'}`}>
                        {plan.period}
                      </span>
                    )}
                  </div>
                  <p className={`text-sm mt-3 leading-relaxed ${plan.highlighted ? 'text-blue-100' : 'text-slate-600 dark:text-slate-400'}`}>
                    {plan.desc}
                  </p>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map(f => (
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
                  {plan.price === '定制報價' ? '聯絡我們' : '立即開始'}
                </Link>
              </div>
            ))}
          </div>

          <p className="text-center text-sm text-slate-400 dark:text-slate-500 mt-8">
            所有方案均包含免費設置、員工培訓及 30 天成效保證。如不滿意，免費調整直至達標。
          </p>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section id="testimonials" className="py-24 px-4 bg-slate-50/50 dark:bg-white/[0.02]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              香港中小企業的真實評價
            </h2>
            <div className="flex justify-center items-center gap-1 mb-2">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <p className="text-slate-500 dark:text-slate-400">平均 4.9 / 5 分 · 50+ 客戶評價</p>
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
              常見問題
            </h2>
            <p className="text-slate-500 dark:text-slate-400">
              仍有疑問？
              <Link href="/vibe-demo/recruitai/consultation" className="text-blue-600 dark:text-blue-400 underline ml-1">
                與我們直接對話
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
                  <span className="font-medium text-slate-900 dark:text-white pr-4">{faq.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-slate-400 flex-shrink-0 transition-transform duration-200 ${
                      openFaq === idx ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {openFaq === idx && (
                  <div className="px-6 pb-5 text-sm text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800/50 pt-4">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-24 px-4 bg-gradient-to-br from-blue-700 via-blue-800 to-blue-900 dark:from-blue-900 dark:via-blue-950 dark:to-slate-950">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl font-extrabold text-white mb-6 leading-tight">
            今天就開始您的
            <br />
            AI 自動化之旅
          </h2>
          <p className="text-blue-100 text-xl mb-4">
            免費 15 分鐘諮詢，了解 AI 如何為您的業務創造價值
          </p>
          <p className="text-blue-200/70 text-sm mb-10">
            無需信用卡 · 無義務承諾 · 即日預約即可
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/vibe-demo/recruitai/consultation"
              className="inline-flex items-center justify-center gap-2 px-10 py-4 bg-white hover:bg-blue-50 text-blue-700 font-bold rounded-xl text-lg transition-all duration-200 shadow-xl"
            >
              <Calendar className="w-5 h-5" />
              預約免費諮詢
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
              50+ 香港中小企業信任我們
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              Cyberport 成員企業
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              HKSTP 合作夥伴
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
                香港中小企業 AI 自動化平台。三大 AI 代理，一個平台，釋放業務潛能。
              </p>
              <p className="text-slate-500 text-xs">by 5 Miles Lab</p>
            </div>

            {/* Product */}
            <div>
              <h4 className="text-white font-semibold mb-4">產品</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><button onClick={() => scrollTo('#agents')} className="hover:text-white transition-colors">三大 AI 代理</button></li>
                <li><button onClick={() => scrollTo('#how-it-works')} className="hover:text-white transition-colors">運作方式</button></li>
                <li><button onClick={() => scrollTo('#pricing')} className="hover:text-white transition-colors">價格方案</button></li>
                <li><button onClick={() => scrollTo('#faq')} className="hover:text-white transition-colors">常見問題</button></li>
              </ul>
            </div>

            {/* Solutions */}
            <div>
              <h4 className="text-white font-semibold mb-4">解決方案</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li className="hover:text-white transition-colors cursor-default">零售業</li>
                <li className="hover:text-white transition-colors cursor-default">餐飲業</li>
                <li className="hover:text-white transition-colors cursor-default">金融服務</li>
                <li className="hover:text-white transition-colors cursor-default">物流貿易</li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-white font-semibold mb-4">聯絡我們</h4>
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
                    預約免費諮詢
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-slate-500 text-sm">
              © 2025 RecruitAIStudio by 5 Miles Lab. 保留所有權利。
            </p>
            <div className="flex gap-6 text-xs text-slate-500">
              <span className="hover:text-slate-300 cursor-default transition-colors">私隱政策</span>
              <span className="hover:text-slate-300 cursor-default transition-colors">服務條款</span>
              <Link href="/vibe-demo" className="hover:text-slate-300 transition-colors">
                ← Vibe Demo
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
