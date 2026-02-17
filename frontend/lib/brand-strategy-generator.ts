/**
 * Brand Strategy Generator
 * Generates content pillars, calendar templates, and KPIs based on user inputs
 */

import {
  INDUSTRY_TEMPLATES,
  GOAL_PILLAR_TEMPLATES,
  POST_TYPES,
  KPI_FRAMEWORKS,
  type Industry,
  type BusinessGoal,
  type ContentPillar,
  type PostType,
} from './brand-setup-config';

export interface BrandFormData {
  brandName: string;
  industry: Industry;
  markets: string[];
  languages: string[];
  primaryChannels: string[];
  businessGoal: BusinessGoal;
  secondaryGoals?: BusinessGoal[];
  postsPerWeek: number;
  monthlyBudgetHKD: number;
  approvalCycleDays: number;
  teamLiaison: string;
  assetProvider?: string;
  approvalAuthority?: string;
}

export interface GeneratedBrandStrategy {
  brandProfile: BrandFormData;
  contentPillars: ContentPillar[];
  recommendedPostTypes: {
    postType: PostType;
    allocation: number; // percentage
    format: string;
  }[];
  monthlyCalendarTemplate: CalendarPost[];
  kpiTargets: KPITargets;
  summary: StrategySummary;
}

export interface CalendarPost {
  date: string; // YYYY-MM-DD
  day: string;
  platform: string;
  format: string;
  postType: PostType;
  pillar: string;
  title: string;
}

export interface KPITargets {
  engagementRate: number;
  reach: number;
  followerGrowth: number;
  conversionRate: number;
  topPostsPerMonth: number;
  adSpend: number;
  adROAS: number;
}

export interface StrategySummary {
  tagline: string;
  keyInsights: string[];
  recommendations: string[];
}

// ============================================================================
// PILLAR GENERATION
// ============================================================================

export function generateContentPillars(
  industry: Industry,
  primaryGoal: BusinessGoal,
  secondaryGoals?: BusinessGoal[]
): ContentPillar[] {
  const primaryTemplate = GOAL_PILLAR_TEMPLATES[primaryGoal];
  if (!primaryTemplate) return [];

  // Start with primary goal pillars
  let pillars = [...primaryTemplate.pillars];

  // If secondary goals exist, blend in their characteristics
  if (secondaryGoals && secondaryGoals.length > 0) {
    for (const goal of secondaryGoals) {
      const secondary = GOAL_PILLAR_TEMPLATES[goal];
      if (secondary) {
        // Slightly boost post types from secondary goals (add 5-10% allocation)
        pillars = pillars.map((p) => {
          const secondaryPostTypes = secondary.pillars
            .flatMap((sp) => sp.postTypes)
            .filter((pt) => p.postTypes.includes(pt));
          if (secondaryPostTypes.length > 0) {
            return { ...p, allocation: Math.min(p.allocation + 5, 40) };
          }
          return p;
        });
      }
    }

    // Normalize allocations to 100%
    const total = pillars.reduce((sum, p) => sum + p.allocation, 0);
    pillars = pillars.map((p) => ({
      ...p,
      allocation: Math.round((p.allocation / total) * 100),
    }));
  }

  return pillars;
}

// ============================================================================
// POST TYPE DISTRIBUTION
// ============================================================================

export function generatePostTypeDistribution(
  industry: Industry,
  pillars: ContentPillar[],
  postsPerWeek: number
) {
  const industryTemplate = INDUSTRY_TEMPLATES[industry];
  const recommendedTypes = industryTemplate.recommendedPostTypes;

  // Aggregate post types from pillars
  const typeAllocation: Record<PostType, number> = {} as any;

  for (const pillar of pillars) {
    const allocPerType = pillar.allocation / pillar.postTypes.length;
    for (const postType of pillar.postTypes) {
      if (recommendedTypes.includes(postType)) {
        typeAllocation[postType] = (typeAllocation[postType] || 0) + allocPerType;
      }
    }
  }

  // Convert to actual post counts
  const postsPerMonth = postsPerWeek * 4;
  const distribution = Object.entries(typeAllocation)
    .map(([type, alloc]) => ({
      postType: type as PostType,
      allocation: Math.round(alloc),
      count: Math.max(1, Math.round((alloc / 100) * postsPerMonth)),
      format: POST_TYPES[type as PostType].formatExamples[0],
    }))
    .filter((d) => d.count > 0)
    .sort((a, b) => b.count - a.count);

  return distribution;
}

// ============================================================================
// CALENDAR TEMPLATE GENERATION
// ============================================================================

export function generateMonthlyCalendarTemplate(
  industry: Industry,
  pillars: ContentPillar[],
  postsPerWeek: number,
  channels: string[],
  startDate: Date = new Date()
): CalendarPost[] {
  const industryTemplate = INDUSTRY_TEMPLATES[industry];
  const calendar: CalendarPost[] = [];

  // Get post type distribution
  const distribution = generatePostTypeDistribution(industry, pillars, postsPerWeek);

  // Map channels to realistic posting patterns
  const channelSchedule: Record<string, { daysOfWeek: number[]; postsPerWeek: number }> = {
    Instagram: { daysOfWeek: [1, 3, 5], postsPerWeek: 3 },
    Facebook: { daysOfWeek: [1, 4], postsPerWeek: 2 },
    TikTok: { daysOfWeek: [1, 2, 3, 4, 5], postsPerWeek: 4 },
    LinkedIn: { daysOfWeek: [1, 3, 5], postsPerWeek: 3 },
    YouTube: { daysOfWeek: [3], postsPerWeek: 1 },
    Pinterest: { daysOfWeek: [2, 4], postsPerWeek: 2 },
  };

  let postIndex = 0;
  let currentDate = new Date(startDate);
  currentDate.setDate(currentDate.getDate() - currentDate.getDay()); // Start on Sunday

  // Generate calendar for first 4 weeks
  for (let week = 0; week < 4; week++) {
    for (let day = 1; day <= 7; day++) {
      const date = new Date(currentDate);
      date.setDate(date.getDate() + day - 1);

      // Select which channels post this day
      for (const channel of channels) {
        const schedule = channelSchedule[channel];
        if (!schedule) continue;

        const dayOfWeek = date.getDay();
        if (schedule.daysOfWeek.includes(dayOfWeek)) {
          // Select post type cyclically
          const dist = distribution[postIndex % distribution.length];

          // Select pillar cyclically
          const pillar = pillars[Math.floor(postIndex / distribution.length) % pillars.length];

          calendar.push({
            date: date.toISOString().split('T')[0],
            day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayOfWeek],
            platform: channel,
            format: dist.format,
            postType: dist.postType,
            pillar: pillar.name,
            title: `[${pillar.name}] ${POST_TYPES[dist.postType].name}`,
          });

          postIndex++;
        }
      }
    }
  }

  return calendar;
}

// ============================================================================
// KPI TARGET GENERATION
// ============================================================================

export function generateKPITargets(
  industry: Industry,
  postsPerWeek: number,
  monthlyBudgetHKD: number,
  primaryGoal: BusinessGoal
): KPITargets {
  const industryTemplate = INDUSTRY_TEMPLATES[industry];
  const framework = KPI_FRAMEWORKS[industry];

  // Base engagement rate from framework
  const baseEngagement = framework.benchmarks.engagementRate || 3.5;
  const engagementBoost = primaryGoal === 'growth' ? 1.2 : primaryGoal === 'seasonal' ? 1.3 : 1.0;

  // Calculate reach based on budget
  const reachPerDollar = 50; // Conservative estimate
  const expectedReach = monthlyBudgetHKD * 0.7 * reachPerDollar; // Assume 70% spent on paid reach

  return {
    engagementRate: Math.round(baseEngagement * engagementBoost * 10) / 10,
    reach: Math.round(expectedReach / 100) * 100,
    followerGrowth: industry === 'startup' ? 8 : industry === 'saas' ? 3 : 5,
    conversionRate:
      framework.benchmarks.conversionRate ||
      (industry === 'hvac' ? 15 : industry === 'saas' ? 25 : industry === 'food' ? 8 : 10),
    topPostsPerMonth: postsPerWeek * 2, // Expect 2 top performers per week
    adSpend: monthlyBudgetHKD,
    adROAS: industry === 'hvac' ? 3.5 : industry === 'saas' ? 5 : industry === 'food' ? 4 : 3,
  };
}

// ============================================================================
// STRATEGY SUMMARY GENERATION
// ============================================================================

export function generateStrategySummary(
  brandName: string,
  industry: Industry,
  pillars: ContentPillar[],
  businessGoal: BusinessGoal,
  kpis: KPITargets
): StrategySummary {
  const industryTemplate = INDUSTRY_TEMPLATES[industry];
  const goalTemplate = GOAL_PILLAR_TEMPLATES[businessGoal];

  const topPillar = pillars[0];
  const secondPillar = pillars[1];

  return {
    tagline: `${brandName} — ${industryTemplate.name} | Focus: ${goalTemplate.name}`,
    keyInsights: [
      `Your primary pillar is "${topPillar.name}" (${topPillar.allocation}%), focused on ${topPillar.description.toLowerCase()}`,
      `Secondary pillar "${secondPillar.name}" (${secondPillar.allocation}%) supports ${secondPillar.description.toLowerCase()}`,
      `Expected engagement rate: ${kpis.engagementRate}% across all posts`,
      `Monthly reach target: ${(kpis.reach / 1000).toFixed(0)}K with HK$${kpis.adSpend.toLocaleString()} budget`,
      `Projected ad ROAS: ${kpis.adROAS}x — HK$${(kpis.adSpend * kpis.adROAS).toLocaleString()} revenue impact`,
    ],
    recommendations: [
      `Post ${Math.round((100 / pillars.length) * (topPillar.allocation / 100))} times weekly to "${topPillar.name}" pillar`,
      `Test "${topPillar.postTypes[0]}" format first — highest engagement potential`,
      `Allocate ${Math.round(kpis.adSpend * 0.6)} HK$ to proven performers, ${Math.round(kpis.adSpend * 0.4)} HK$ to new tests`,
      `Expect ${Math.round(kpis.topPostsPerMonth)} high-performing posts monthly`,
      `Monitor pillar performance weekly and adjust mix by 5-10% as needed`,
    ],
  };
}

// ============================================================================
// MAIN GENERATION FUNCTION
// ============================================================================

export function generateCompleteStrategy(formData: BrandFormData): GeneratedBrandStrategy {
  const pillars = generateContentPillars(formData.industry, formData.businessGoal, formData.secondaryGoals);
  const distribution = generatePostTypeDistribution(formData.industry, pillars, formData.postsPerWeek);
  const calendar = generateMonthlyCalendarTemplate(
    formData.industry,
    pillars,
    formData.postsPerWeek,
    formData.primaryChannels
  );
  const kpis = generateKPITargets(formData.industry, formData.postsPerWeek, formData.monthlyBudgetHKD, formData.businessGoal);
  const summary = generateStrategySummary(formData.brandName, formData.industry, pillars, formData.businessGoal, kpis);

  return {
    brandProfile: formData,
    contentPillars: pillars,
    recommendedPostTypes: distribution,
    monthlyCalendarTemplate: calendar,
    kpiTargets: kpis,
    summary,
  };
}
