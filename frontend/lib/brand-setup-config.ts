/**
 * Brand Onboarding Configuration
 * Defines industries, post types, content pillars, and KPI frameworks
 */

export type Industry = 'hvac' | 'fmcg' | 'saas' | 'food' | 'fashion' | 'finance' | 'education' | 'startup';
export type PostType = 'education' | 'infographic' | 'promotion' | 'lifestyle' | 'launch' | 'technical' | 'testimonial' | 'behind-scenes' | 'festive' | 'interactive' | 'webinar' | 'community' | 'trending' | 'repost' | 'milestone';

export interface IndustryTemplate {
  id: Industry;
  name: string;
  description: string;
  primaryChannels: string[];
  defaultPostsPerWeek: number;
  typicalBudgetRange: [number, number]; // HK$
  approvalCycleDays: number;
  recommendedPostTypes: PostType[];
  defaultLanguages: string[];
}

export interface PostTypeConfig {
  id: PostType;
  name: string;
  objective: string;
  applicableIndustries: Industry[];
  formatExamples: string[]; // e.g., "Reel", "Carousel", "Static"
  avgEngagementTarget: number; // percentage
}

export interface ContentPillar {
  name: string;
  description: string;
  allocation: number; // percentage
  postTypes: PostType[];
}

export interface KPIFramework {
  channelKPIs: Record<string, any>;
  postTypeKPIs: Record<PostType, any>;
  conversionFunnel: string[];
  benchmarks: Record<string, number>;
}

// ============================================================================
// INDUSTRY TEMPLATES
// ============================================================================

export const INDUSTRY_TEMPLATES: Record<Industry, IndustryTemplate> = {
  hvac: {
    id: 'hvac',
    name: 'HVAC / Climate Control',
    description: 'Premium B2C - Daikin, LG, Midea style',
    primaryChannels: ['Instagram', 'Facebook'],
    defaultPostsPerWeek: 4,
    typicalBudgetRange: [26000, 35000],
    approvalCycleDays: 1,
    recommendedPostTypes: ['education', 'lifestyle', 'technical', 'testimonial', 'promotion', 'festive'],
    defaultLanguages: ['Traditional Chinese', 'English'],
  },
  fmcg: {
    id: 'fmcg',
    name: 'FMCG / Consumer Goods',
    description: 'Fast-moving, mass market - Unilever, P&G style',
    primaryChannels: ['Instagram', 'TikTok', 'Facebook'],
    defaultPostsPerWeek: 6,
    typicalBudgetRange: [15000, 25000],
    approvalCycleDays: 0.25, // 4-6 hours
    recommendedPostTypes: ['promotion', 'lifestyle', 'trending', 'testimonial', 'community'],
    defaultLanguages: ['Traditional Chinese', 'English'],
  },
  food: {
    id: 'food',
    name: 'F&B / Restaurants',
    description: 'Food-focused, seasonal - Bubble tea, restaurants',
    primaryChannels: ['Instagram', 'TikTok', 'Facebook'],
    defaultPostsPerWeek: 7,
    typicalBudgetRange: [12000, 22000],
    approvalCycleDays: 0.25,
    recommendedPostTypes: ['lifestyle', 'promotion', 'trending', 'behind-scenes', 'community'],
    defaultLanguages: ['Traditional Chinese', 'English'],
  },
  saas: {
    id: 'saas',
    name: 'SaaS / Enterprise Software',
    description: 'B2B, thought leadership - HubSpot, Slack style',
    primaryChannels: ['LinkedIn', 'Instagram', 'YouTube'],
    defaultPostsPerWeek: 3,
    typicalBudgetRange: [30000, 50000],
    approvalCycleDays: 2,
    recommendedPostTypes: ['education', 'technical', 'testimonial', 'webinar', 'community'],
    defaultLanguages: ['English', 'Simplified Chinese'],
  },
  fashion: {
    id: 'fashion',
    name: 'Fashion / Luxury',
    description: 'Lifestyle, aspiration - Premium brands',
    primaryChannels: ['Instagram', 'TikTok', 'Pinterest'],
    defaultPostsPerWeek: 5,
    typicalBudgetRange: [20000, 40000],
    approvalCycleDays: 1.5,
    recommendedPostTypes: ['lifestyle', 'behind-scenes', 'testimonial', 'education', 'community'],
    defaultLanguages: ['English', 'Traditional Chinese'],
  },
  finance: {
    id: 'finance',
    name: 'Financial Services',
    description: 'Trust-focused, regulated - Banks, insurance',
    primaryChannels: ['LinkedIn', 'Facebook'],
    defaultPostsPerWeek: 2,
    typicalBudgetRange: [15000, 30000],
    approvalCycleDays: 3,
    recommendedPostTypes: ['education', 'testimonial', 'technical', 'community'],
    defaultLanguages: ['Traditional Chinese', 'English'],
  },
  education: {
    id: 'education',
    name: 'Education / Institutions',
    description: 'Lead generation focused - Universities, courses',
    primaryChannels: ['Instagram', 'Facebook', 'YouTube'],
    defaultPostsPerWeek: 4,
    typicalBudgetRange: [10000, 25000],
    approvalCycleDays: 2,
    recommendedPostTypes: ['education', 'testimonial', 'lifestyle', 'webinar', 'community'],
    defaultLanguages: ['Traditional Chinese', 'English'],
  },
  startup: {
    id: 'startup',
    name: 'Startup / Growth Stage',
    description: 'Growth hacking, community - Emerging brands',
    primaryChannels: ['Instagram', 'TikTok', 'LinkedIn'],
    defaultPostsPerWeek: 4,
    typicalBudgetRange: [8000, 20000],
    approvalCycleDays: 0.5,
    recommendedPostTypes: ['community', 'trending', 'behind-scenes', 'testimonial', 'education'],
    defaultLanguages: ['English', 'Traditional Chinese'],
  },
};

// ============================================================================
// POST TYPE CONFIGURATIONS
// ============================================================================

export const POST_TYPES: Record<PostType, PostTypeConfig> = {
  education: {
    id: 'education',
    name: 'Education',
    objective: 'Awareness, trust, lead nurturing',
    applicableIndustries: ['hvac', 'fmcg', 'saas', 'food', 'fashion', 'finance', 'education', 'startup'],
    formatExamples: ['Reel (video)', 'Carousel', 'Static post'],
    avgEngagementTarget: 3.5,
  },
  infographic: {
    id: 'infographic',
    name: 'Infographic',
    objective: 'Shareability, reference, engagement',
    applicableIndustries: ['saas', 'finance', 'education', 'fmcg', 'fashion'],
    formatExamples: ['Carousel', 'Static post'],
    avgEngagementTarget: 4.0,
  },
  promotion: {
    id: 'promotion',
    name: 'Promotion / Offer',
    objective: 'Traffic, conversion, lead gen',
    applicableIndustries: ['hvac', 'fmcg', 'saas', 'food', 'fashion', 'education', 'startup'],
    formatExamples: ['Reel', 'Static post', 'Stories'],
    avgEngagementTarget: 5.0,
  },
  lifestyle: {
    id: 'lifestyle',
    name: 'Lifestyle / Showcase',
    objective: 'Engagement, aspiration, emotional connection',
    applicableIndustries: ['hvac', 'fmcg', 'food', 'fashion', 'startup'],
    formatExamples: ['Reel (video)', 'Carousel', 'Static post'],
    avgEngagementTarget: 3.5,
  },
  launch: {
    id: 'launch',
    name: 'New Product Launch',
    objective: 'Excitement, awareness, differentiation',
    applicableIndustries: ['hvac', 'fmcg', 'saas', 'food', 'fashion', 'startup'],
    formatExamples: ['Reel', 'Carousel'],
    avgEngagementTarget: 4.5,
  },
  technical: {
    id: 'technical',
    name: 'Technical / Feature',
    objective: 'Authority, expertise, credibility',
    applicableIndustries: ['hvac', 'saas', 'finance', 'education'],
    formatExamples: ['Carousel', 'Static post', 'Video essay'],
    avgEngagementTarget: 3.8,
  },
  testimonial: {
    id: 'testimonial',
    name: 'Testimonial / UGC',
    objective: 'Social proof, trust, authenticity',
    applicableIndustries: ['hvac', 'fmcg', 'saas', 'food', 'fashion', 'finance', 'education', 'startup'],
    formatExamples: ['Static post', 'Carousel', 'Reel'],
    avgEngagementTarget: 3.5,
  },
  'behind-scenes': {
    id: 'behind-scenes',
    name: 'Behind-the-Scenes / Culture',
    objective: 'Community, brand personality, relatability',
    applicableIndustries: ['fmcg', 'food', 'fashion', 'education', 'startup'],
    formatExamples: ['Reel', 'Stories', 'Static post'],
    avgEngagementTarget: 3.2,
  },
  festive: {
    id: 'festive',
    name: 'Festive / Seasonal',
    objective: 'Seasonal relevance, community connection',
    applicableIndustries: ['hvac', 'fmcg', 'saas', 'food', 'fashion', 'education', 'startup'],
    formatExamples: ['Any format'],
    avgEngagementTarget: 3.0,
  },
  interactive: {
    id: 'interactive',
    name: 'Interactive (Polls, Q&A)',
    objective: 'Engagement, data collection, audience insights',
    applicableIndustries: ['hvac', 'fmcg', 'saas', 'food', 'fashion', 'finance', 'education', 'startup'],
    formatExamples: ['Stories polls', 'Comments', 'Carousel'],
    avgEngagementTarget: 4.2,
  },
  webinar: {
    id: 'webinar',
    name: 'Webinar / Event Promo',
    objective: 'Lead gen, thought leadership, education',
    applicableIndustries: ['saas', 'finance', 'education'],
    formatExamples: ['Carousel', 'Static post'],
    avgEngagementTarget: 3.5,
  },
  community: {
    id: 'community',
    name: 'Community / Collaboration',
    objective: 'Loyalty, word-of-mouth, brand advocacy',
    applicableIndustries: ['hvac', 'fmcg', 'food', 'fashion', 'education', 'startup'],
    formatExamples: ['Static post', 'Reel'],
    avgEngagementTarget: 2.8,
  },
  trending: {
    id: 'trending',
    name: 'Trending / Trend-jacking',
    objective: 'Virality, relevance, algorithm boost',
    applicableIndustries: ['fmcg', 'food', 'fashion', 'startup'],
    formatExamples: ['Reel', 'TikTok video'],
    avgEngagementTarget: 5.5,
  },
  repost: {
    id: 'repost',
    name: 'Repost / Curated Content',
    objective: 'Quick content, brand alignment',
    applicableIndustries: ['hvac', 'fmcg', 'saas', 'food', 'fashion', 'finance', 'education', 'startup'],
    formatExamples: ['Static post'],
    avgEngagementTarget: 2.5,
  },
  milestone: {
    id: 'milestone',
    name: 'Milestone / Internal Wins',
    objective: 'Internal celebration, team morale, engagement',
    applicableIndustries: ['hvac', 'fmcg', 'saas', 'food', 'fashion', 'finance', 'education', 'startup'],
    formatExamples: ['Static post', 'Carousel'],
    avgEngagementTarget: 3.0,
  },
};

// ============================================================================
// BUSINESS GOALS & PILLAR TEMPLATES
// ============================================================================

export type BusinessGoal = 'growth' | 'retention' | 'launch' | 'authority' | 'community' | 'crisis' | 'seasonal' | 'positioning';

export interface GoalPillarTemplate {
  goal: BusinessGoal;
  name: string;
  description: string;
  pillars: ContentPillar[];
}

export const GOAL_PILLAR_TEMPLATES: Record<BusinessGoal, GoalPillarTemplate> = {
  growth: {
    goal: 'growth',
    name: 'Market Share Growth',
    description: 'Expand customer base and market presence',
    pillars: [
      { name: 'Educate', description: 'Position as expert', allocation: 35, postTypes: ['education', 'infographic', 'technical'] },
      { name: 'Showcase', description: 'Build social proof', allocation: 25, postTypes: ['lifestyle', 'testimonial', 'launch'] },
      { name: 'Authority', description: 'Reinforce premium positioning', allocation: 20, postTypes: ['technical', 'testimonial', 'webinar'] },
      { name: 'Conversion', description: 'Drive leads and sales', allocation: 15, postTypes: ['promotion', 'interactive'] },
      { name: 'Community', description: 'Build affinity', allocation: 5, postTypes: ['community', 'behind-scenes'] },
    ],
  },
  retention: {
    goal: 'retention',
    name: 'Customer Retention & Loyalty',
    description: 'Deepen engagement with existing customers',
    pillars: [
      { name: 'Community', description: 'Foster loyal fan base', allocation: 30, postTypes: ['community', 'behind-scenes', 'testimonial'] },
      { name: 'Education', description: 'Help customers succeed', allocation: 25, postTypes: ['education', 'infographic'] },
      { name: 'Exclusive', description: 'VIP/loyalty content', allocation: 20, postTypes: ['promotion', 'milestone'] },
      { name: 'Engagement', description: 'Interactive touchpoints', allocation: 15, postTypes: ['interactive', 'lifestyle'] },
      { name: 'Celebration', description: 'Celebrate milestones', allocation: 10, postTypes: ['milestone', 'festive'] },
    ],
  },
  launch: {
    goal: 'launch',
    name: 'Product Launch',
    description: 'Introduce new offering to market',
    pillars: [
      { name: 'Tease', description: 'Build anticipation', allocation: 30, postTypes: ['trending', 'interactive'] },
      { name: 'Showcase', description: 'Product benefits', allocation: 35, postTypes: ['lifestyle', 'launch', 'testimonial'] },
      { name: 'Conversion', description: 'Drive immediate sales', allocation: 20, postTypes: ['promotion', 'webinar'] },
      { name: 'Social Proof', description: 'Early adopter stories', allocation: 10, postTypes: ['testimonial', 'community'] },
      { name: 'Education', description: 'How-to guides', allocation: 5, postTypes: ['education', 'infographic'] },
    ],
  },
  authority: {
    goal: 'authority',
    name: 'Thought Leadership & Authority',
    description: 'Establish expertise in industry',
    pillars: [
      { name: 'Education', description: 'Share expertise', allocation: 30, postTypes: ['education', 'infographic', 'technical'] },
      { name: 'Authority', description: 'Industry trends & insights', allocation: 30, postTypes: ['technical', 'testimonial', 'webinar'] },
      { name: 'Testimonial', description: 'Client success stories', allocation: 20, postTypes: ['testimonial', 'infographic'] },
      { name: 'Events', description: 'Webinars & speaking', allocation: 15, postTypes: ['webinar'] },
      { name: 'Community', description: 'Industry dialogue', allocation: 5, postTypes: ['community', 'interactive'] },
    ],
  },
  community: {
    goal: 'community',
    name: 'Community Building',
    description: 'Grow engaged, vocal fan base',
    pillars: [
      { name: 'Community', description: 'Shared values & belonging', allocation: 30, postTypes: ['community', 'behind-scenes', 'interactive'] },
      { name: 'Lifestyle', description: 'Aspirational content', allocation: 25, postTypes: ['lifestyle', 'testimonial'] },
      { name: 'Behind-Scenes', description: 'Team & culture', allocation: 20, postTypes: ['behind-scenes', 'milestone'] },
      { name: 'Engagement', description: 'Interactive moments', allocation: 15, postTypes: ['interactive', 'community'] },
      { name: 'Celebration', description: 'UGC & fan moments', allocation: 10, postTypes: ['testimonial', 'milestone'] },
    ],
  },
  crisis: {
    goal: 'crisis',
    name: 'Crisis / Reputation Management',
    description: 'Rebuild trust and reputation',
    pillars: [
      { name: 'Transparency', description: 'Open communication', allocation: 35, postTypes: ['education', 'testimonial'] },
      { name: 'Action', description: 'Concrete improvements', allocation: 30, postTypes: ['technical', 'lifestyle'] },
      { name: 'Community', description: 'Dialogue with audience', allocation: 20, postTypes: ['community', 'interactive'] },
      { name: 'Authority', description: 'Restore credibility', allocation: 10, postTypes: ['testimonial', 'webinar'] },
      { name: 'Healing', description: 'Show positive direction', allocation: 5, postTypes: ['festive', 'milestone'] },
    ],
  },
  seasonal: {
    goal: 'seasonal',
    name: 'Seasonal Sales Push',
    description: 'Capitalize on seasonal demand',
    pillars: [
      { name: 'Promotion', description: 'Drive conversions', allocation: 35, postTypes: ['promotion', 'interactive'] },
      { name: 'Lifestyle', description: 'Seasonal appeal', allocation: 25, postTypes: ['lifestyle', 'testimonial'] },
      { name: 'Trending', description: 'Stay relevant', allocation: 20, postTypes: ['trending', 'community'] },
      { name: 'Community', description: 'Build excitement', allocation: 15, postTypes: ['community', 'behind-scenes'] },
      { name: 'Scarcity', description: 'Urgency signals', allocation: 5, postTypes: ['promotion'] },
    ],
  },
  positioning: {
    goal: 'positioning',
    name: 'Brand Repositioning',
    description: 'Change market perception and audience',
    pillars: [
      { name: 'New Narrative', description: 'Fresh brand story', allocation: 30, postTypes: ['education', 'testimonial', 'lifestyle'] },
      { name: 'Behind-Scenes', description: 'Transparency in change', allocation: 25, postTypes: ['behind-scenes', 'community'] },
      { name: 'Education', description: 'Explain the shift', allocation: 20, postTypes: ['education', 'infographic'] },
      { name: 'Testimonial', description: 'Authentic voices', allocation: 15, postTypes: ['testimonial', 'community'] },
      { name: 'Celebration', description: 'Milestone moments', allocation: 10, postTypes: ['milestone', 'festive'] },
    ],
  },
};

// ============================================================================
// KPI FRAMEWORKS
// ============================================================================

export const KPI_FRAMEWORKS: Record<Industry, KPIFramework> = {
  hvac: {
    channelKPIs: {
      instagram: ['Reach', 'Engagement Rate', 'Link Clicks', 'Followers', 'Saves'],
      facebook: ['Reach', 'Engagement Rate', 'Link Clicks', 'Shares'],
    },
    postTypeKPIs: {
      education: { target: 4.3, metric: 'Saves + Engagement' },
      promotion: { target: 5.2, metric: 'CTR + Conversions' },
      lifestyle: { target: 3.8, metric: 'Engagement + Saves' },
      testimonial: { target: 3.5, metric: 'Comments + Engagement' },
      technical: { target: 4.1, metric: 'Engagement + Saves' },
    },
    conversionFunnel: ['Social Reach', 'Click to Website', 'Form Submission', 'Free Audit', 'Sales Call', 'Customer'],
    benchmarks: {
      engagementRate: 3.5,
      clickThroughRate: 3.0,
      conversionRate: 15,
      signupVolume: 80,
      monthlyRevenue: 150000,
    },
  },
  fmcg: {
    channelKPIs: {
      instagram: ['Reach', 'Engagement Rate', 'Link Clicks', 'Followers'],
      tiktok: ['Views', 'Engagement Rate', 'Shares'],
      facebook: ['Reach', 'Clicks', 'Conversions'],
    },
    postTypeKPIs: {
      promotion: { target: 5.5, metric: 'Clicks + Conversions' },
      lifestyle: { target: 4.2, metric: 'Engagement + Saves' },
      trending: { target: 6.0, metric: 'Reach + Virality' },
    },
    conversionFunnel: ['Social Reach', 'Click to App', 'In-App Purchase', 'Repeat Order'],
    benchmarks: {
      engagementRate: 4.5,
      clickThroughRate: 5.0,
      conversionRate: 8,
      monthlyOrderVolume: 300,
    },
  },
  saas: {
    channelKPIs: {
      linkedin: ['Engagement Rate', 'Clicks', 'Profile Views', 'Impressions'],
      instagram: ['Reach', 'Followers', 'Engagement'],
    },
    postTypeKPIs: {
      education: { target: 4.5, metric: 'Engagement' },
      authority: { target: 5.0, metric: 'Engagement + Reach' },
      testimonial: { target: 3.8, metric: 'Comments + Engagement' },
    },
    conversionFunnel: ['Social Reach', 'Click to Website', 'Free Trial Signup', 'Demo Booked', 'Customer Acquired'],
    benchmarks: {
      engagementRate: 4.5,
      leadQuality: 'qualified',
      conversionRate: 25,
      signupVolume: 40,
      monthlyRecurringRevenue: 50000,
    },
  },
  food: {
    channelKPIs: {
      instagram: ['Reach', 'Engagement Rate', 'Clicks', 'Followers'],
      tiktok: ['Views', 'Engagement Rate', 'Shares', 'Followers'],
    },
    postTypeKPIs: {
      promotion: { target: 5.8, metric: 'Clicks + Orders' },
      lifestyle: { target: 4.5, metric: 'Engagement + Saves' },
      trending: { target: 6.5, metric: 'Views + Engagement' },
    },
    conversionFunnel: ['Social Reach', 'Click to Ordering App', 'Order Placed', 'Repeat Order'],
    benchmarks: {
      engagementRate: 5.0,
      clickThroughRate: 6.0,
      monthlyOrderVolume: 500,
      averageOrderValue: 60,
    },
  },
  fashion: {
    channelKPIs: {
      instagram: ['Reach', 'Engagement Rate', 'Saves', 'Clicks', 'Followers'],
      tiktok: ['Views', 'Engagement Rate', 'Shares'],
      pinterest: ['Clicks', 'Saves', 'Outbound Clicks'],
    },
    postTypeKPIs: {
      lifestyle: { target: 4.2, metric: 'Engagement + Saves' },
      'behind-scenes': { target: 3.8, metric: 'Engagement' },
    },
    conversionFunnel: ['Social Reach', 'Click to Store', 'Product View', 'Add to Cart', 'Purchase'],
    benchmarks: {
      engagementRate: 3.8,
      saveRate: 8.0,
      socialRevenue: 25000,
      roas: 3.5,
    },
  },
  finance: {
    channelKPIs: {
      linkedin: ['Engagement Rate', 'Clicks', 'Profile Views'],
      facebook: ['Reach', 'Engagement Rate', 'Clicks'],
    },
    postTypeKPIs: {
      education: { target: 3.5, metric: 'Engagement' },
      testimonial: { target: 3.2, metric: 'Engagement' },
    },
    conversionFunnel: ['Social Reach', 'Click to Website', 'Consultation Signup', 'Call Booked', 'Customer Onboarded'],
    benchmarks: {
      engagementRate: 2.8,
      qualifiedLeads: 12,
      conversionRate: 20,
    },
  },
  education: {
    channelKPIs: {
      instagram: ['Reach', 'Engagement Rate', 'Clicks', 'Followers'],
      facebook: ['Reach', 'Clicks', 'Leads'],
    },
    postTypeKPIs: {
      education: { target: 4.0, metric: 'Engagement + Clicks' },
      testimonial: { target: 3.5, metric: 'Engagement' },
    },
    conversionFunnel: ['Social Reach', 'Click to Website', 'Course Interest', 'Inquiry Submitted', 'Enrollment'],
    benchmarks: {
      engagementRate: 3.8,
      clickThroughRate: 4.0,
      monthlyInquiries: 20,
      conversionRate: 15,
    },
  },
  startup: {
    channelKPIs: {
      instagram: ['Followers', 'Engagement Rate', 'Reach'],
      tiktok: ['Followers', 'Views', 'Engagement Rate'],
    },
    postTypeKPIs: {
      community: { target: 3.2, metric: 'Engagement' },
      trending: { target: 5.5, metric: 'Reach + Virality' },
    },
    conversionFunnel: ['Social Reach', 'Community Engagement', 'Newsletter Signup', 'Funding/Partnerships'],
    benchmarks: {
      engagementRate: 4.2,
      followerGrowth: 8,
      communitySize: 5000,
    },
  },
};
