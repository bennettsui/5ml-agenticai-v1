/**
 * Monthly Report Types
 * Type definitions for the social media monthly report generator
 */

// ===========================================
// Design System
// ===========================================

export interface DesignSystem {
  colors: {
    primary: string;
    secondary: string;
    highlightGreen: string;
    highlightRed: string;
    highlightYellow: string;
    textDark: string;
    textLight: string;
    background: string;
    cardBackground: string;
  };
  fonts: {
    title: string;
    body: string;
  };
  sizes: {
    h1: number;
    h2: number;
    body: number;
    small: number;
    table: number;
  };
}

export const DEFAULT_DESIGN_SYSTEM: DesignSystem = {
  colors: {
    primary: '#1a365d',      // Deep blue
    secondary: '#4a5568',    // Gray
    highlightGreen: '#48bb78',
    highlightRed: '#f56565',
    highlightYellow: '#ecc94b',
    textDark: '#1a202c',
    textLight: '#718096',
    background: '#ffffff',
    cardBackground: '#f7fafc',
  },
  fonts: {
    title: 'Arial',
    body: 'Arial',
  },
  sizes: {
    h1: 28,
    h2: 20,
    body: 11,
    small: 9,
    table: 9,
  },
};

// ===========================================
// Report Data Structures
// ===========================================

export interface ReportConfig {
  clientName: string;
  brandName: string;
  monthYear: string;
  reportDate: string;
  clientLogo?: string;
  primaryColor?: string;
  secondaryColor?: string;
}

export interface KPITile {
  label: string;
  value: string | number;
  change?: number;  // Percentage change
  icon?: 'eye' | 'heart' | 'click' | 'users' | 'dollar' | 'chart';
}

export interface PerformanceMetric {
  metric: string;
  lastMonth: number | string;
  thisMonth: number | string;
  change: number;
}

export interface PostData {
  thumbnail?: string;
  date: string;
  format: string;
  caption: string;
  impressions: number;
  engagementRate: number;
  linkClicks: number;
}

export interface ContentTheme {
  theme: string;
  numPosts: number;
  avgEngagementRate: number;
  avgClicks: number;
  note?: string;
}

export interface CampaignData {
  campaign: string;
  objective: string;
  period: string;
  budget: number;
  spent: number;
  impressions: number;
  ctr: number;
  cpc: number;
  cpm: number;
  conversions?: number;
  roas?: number;
  tag: 'strong' | 'monitor' | 'underperform';
}

export interface SEMGDNData {
  campaignSet: string;
  medium: 'SEM' | 'GDN';
  spend: number;
  impressions: number;
  cpm: number;
  clicks: number;
  cpc: number;
}

export interface AudienceData {
  ageDistribution: Array<{ age: string; percentage: number }>;
  genderSplit: { male: number; female: number; other?: number };
  topLocations: Array<{ location: string; percentage: number }>;
  deviceBreakdown: { mobile: number; desktop: number };
  placementBreakdown?: { feed: number; stories: number; reels: number };
}

export interface ConversionData {
  channel: string;
  sessionsFromSocial: number;
  conversions: number;
  conversionRate: number;
  revenue?: number;
  roas?: number;
}

export interface PromotionCard {
  image?: string;
  name: string;
  mechanic: string;
  keyMetric: string;
  keyValue: string | number;
}

// ===========================================
// Full Report Data
// ===========================================

export interface MonthlyReportData {
  config: ReportConfig;

  // Slide 2: Executive Summary
  executiveSummary: {
    kpis: KPITile[];
    keyHighlights: string[];
    nextMonthFocus: string[];
  };

  // Slide 3: Facebook Overview
  facebook?: {
    kpis: KPITile[];
    followersHistory: Array<{ month: string; followers: number }>;
    performanceTable: PerformanceMetric[];
  };

  // Slide 4: Instagram Overview
  instagram?: {
    kpis: KPITile[];
    followersHistory: Array<{ month: string; followers: number }>;
    performanceTable: PerformanceMetric[];
  };

  // Slide 5: Top & Bottom Posts
  contentPerformance?: {
    topPosts: PostData[];
    bottomPosts: PostData[];
    insights: string[];
    actions: string[];
  };

  // Slide 6: Content Themes
  contentThemes?: {
    themes: ContentTheme[];
  };

  // Slide 7-8: Social Ads
  socialAds?: {
    spendByPlatform: Array<{ platform: string; spend: number }>;
    clicksByPlatform: Array<{ platform: string; clicks: number }>;
    cpcByPlatform: Array<{ platform: string; cpc: number }>;
    summary: string[];
    campaigns: CampaignData[];
  };

  // Slide 9-10: SEM & GDN
  semGdn?: {
    semData: Array<{ month: string; spend: number; clicks: number; cpc: number }>;
    gdnData: Array<{ month: string; spend: number; clicks: number; cpc: number }>;
    table: SEMGDNData[];
    keyFindings: string[];
  };

  // Slide 11: Audience
  audience?: AudienceData & {
    insights: string[];
    recommendations: string[];
  };

  // Slide 12: Conversions
  conversions?: {
    funnelData: { social: number; sessions: number; conversions: number };
    table: ConversionData[];
    commentary: string[];
  };

  // Slide 13: Promotions
  promotions?: {
    cards: PromotionCard[];
    mostImpactful?: string[];
  };

  // Slide 14: Next Month
  nextMonth: {
    strategicPriorities: string[];
    experimentRoadmap: Array<{ test: string; status: 'planned' | 'in_progress' | 'completed' }>;
  };
}

// ===========================================
// Export Options
// ===========================================

export type ExportFormat = 'pptx' | 'pdf' | 'both';

export interface ExportOptions {
  format: ExportFormat;
  outputDir?: string;
  filename?: string;
  includeSlides?: number[];  // If specified, only include these slides
}

export interface ExportResult {
  success: boolean;
  pptxPath?: string;
  pdfPath?: string;
  error?: string;
}
