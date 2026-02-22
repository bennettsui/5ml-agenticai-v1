/**
 * Export utilities for brand strategies
 * Generate PDF, JSON, or CSV downloads
 */

import type { GeneratedBrandStrategy } from './brand-strategy-generator';

/**
 * Export strategy as JSON file
 */
export function exportAsJSON(strategy: GeneratedBrandStrategy) {
  const dataStr = JSON.stringify(strategy, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${strategy.brandProfile.brandName}-strategy.json`;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Export strategy as CSV (simplified)
 */
export function exportAsCSV(strategy: GeneratedBrandStrategy) {
  const lines: string[] = [];

  // Header
  lines.push('5ML BRAND STRATEGY EXPORT');
  lines.push(`Brand,${strategy.brandProfile.brandName}`);
  lines.push(`Industry,${strategy.brandProfile.industry}`);
  lines.push(`Created,${new Date().toLocaleString()}`);
  lines.push('');

  // Profile
  lines.push('BRAND PROFILE');
  lines.push(
    `Markets,"${strategy.brandProfile.markets.join(', ')}"`,
    `Channels,"${strategy.brandProfile.primaryChannels.join(', ')}"`,
    `Languages,"${strategy.brandProfile.languages.join(', ')}"`,
    `Business Goal,${strategy.brandProfile.businessGoal}`,
    `Posts Per Week,${strategy.brandProfile.postsPerWeek}`,
    `Monthly Budget,HK$${strategy.brandProfile.monthlyBudgetHKD.toLocaleString()}`,
    `Approval Cycle,${strategy.brandProfile.approvalCycleDays * 24} hours`
  );
  lines.push('');

  // Pillars
  lines.push('CONTENT PILLARS');
  lines.push('Pillar,Allocation %,Post Types');
  strategy.contentPillars.forEach((pillar) => {
    lines.push(
      `"${pillar.name}",${pillar.allocation},"${pillar.postTypes.join(', ')}"`
    );
  });
  lines.push('');

  // Post Types
  lines.push('POST TYPE DISTRIBUTION');
  lines.push('Post Type,Frequency,Allocation %');
  strategy.recommendedPostTypes.forEach((type) => {
    lines.push(`"${type.postType}",${type.count}x,${type.allocation}%`);
  });
  lines.push('');

  // KPIs
  lines.push('KPI TARGETS');
  lines.push(`Engagement Rate,${strategy.kpiTargets.engagementRate}%`);
  lines.push(`Monthly Reach,"${(strategy.kpiTargets.reach / 1000).toFixed(0)}K"`);
  lines.push(`Ad ROAS,${strategy.kpiTargets.adROAS}x`);
  lines.push(`Conversion Rate,${strategy.kpiTargets.conversionRate}%`);
  lines.push(`Top Posts Per Month,${strategy.kpiTargets.topPostsPerMonth}`);
  lines.push('');

  // Calendar
  lines.push('SAMPLE CALENDAR (First 10 posts)');
  lines.push('Date,Day,Platform,Format,Post Type,Pillar,Title');
  strategy.monthlyCalendarTemplate.slice(0, 10).forEach((post) => {
    lines.push(
      `${post.date},${post.day},${post.platform},${post.format},"${post.postType}","${post.pillar}","${post.title}"`
    );
  });

  const csv = lines.join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${strategy.brandProfile.brandName}-strategy.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Export strategy as formatted text file
 */
export function exportAsText(strategy: GeneratedBrandStrategy) {
  const sections: string[] = [];

  // Header
  sections.push('╔════════════════════════════════════════════════════════════╗');
  sections.push('║         5ML BRAND STRATEGY EXPORT                          ║');
  sections.push('╚════════════════════════════════════════════════════════════╝');
  sections.push('');

  // Summary
  sections.push(`BRAND: ${strategy.brandProfile.brandName}`);
  sections.push(`INDUSTRY: ${strategy.brandProfile.industry}`);
  sections.push(`STRATEGY TAGLINE: ${strategy.summary.tagline}`);
  sections.push(`EXPORTED: ${new Date().toLocaleString()}`);
  sections.push('');

  // Profile
  sections.push('┌─ BRAND PROFILE ─────────────────────────────────────────┐');
  sections.push(`│ Markets:        ${strategy.brandProfile.markets.join(', ')}`);
  sections.push(
    `│ Channels:       ${strategy.brandProfile.primaryChannels.join(', ')}`
  );
  sections.push(
    `│ Languages:      ${strategy.brandProfile.languages.join(', ')}`
  );
  sections.push(`│ Business Goal:  ${strategy.brandProfile.businessGoal}`);
  sections.push(`│ Posts/Week:     ${strategy.brandProfile.postsPerWeek}`);
  sections.push(
    `│ Budget/Month:   HK$${strategy.brandProfile.monthlyBudgetHKD.toLocaleString()}`
  );
  sections.push(
    `│ Approval Cycle: ${strategy.brandProfile.approvalCycleDays * 24} hours`
  );
  sections.push(`│ Team Liaison:   ${strategy.brandProfile.teamLiaison}`);
  sections.push('└─────────────────────────────────────────────────────────┘');
  sections.push('');

  // Content Pillars
  sections.push('┌─ CONTENT PILLARS ───────────────────────────────────────┐');
  strategy.contentPillars.forEach((pillar) => {
    sections.push(`│ ${pillar.name.padEnd(25)} (${pillar.allocation}%)`);
    sections.push(`│   ${pillar.description}`);
    sections.push(`│   Post Types: ${pillar.postTypes.join(', ')}`);
    sections.push('│');
  });
  sections.push('└─────────────────────────────────────────────────────────┘');
  sections.push('');

  // Post Distribution
  sections.push('┌─ POST TYPE DISTRIBUTION (Monthly) ──────────────────────┐');
  strategy.recommendedPostTypes.slice(0, 8).forEach((type) => {
    const bar = '█'.repeat(Math.ceil(type.allocation / 5));
    sections.push(
      `│ ${type.postType.padEnd(15)} ${type.count}x ${bar.padEnd(20)} ${type.allocation}%`
    );
  });
  sections.push('└─────────────────────────────────────────────────────────┘');
  sections.push('');

  // KPI Targets
  sections.push('┌─ KPI TARGETS ───────────────────────────────────────────┐');
  sections.push(`│ Engagement Rate:       ${strategy.kpiTargets.engagementRate}%`);
  sections.push(
    `│ Monthly Reach:         ${(strategy.kpiTargets.reach / 1000).toFixed(0)}K`
  );
  sections.push(`│ Ad ROAS:               ${strategy.kpiTargets.adROAS}x`);
  sections.push(`│ Conversion Rate:       ${strategy.kpiTargets.conversionRate}%`);
  sections.push(
    `│ Top Posts Per Month:   ${strategy.kpiTargets.topPostsPerMonth}`
  );
  sections.push('└─────────────────────────────────────────────────────────┘');
  sections.push('');

  // Key Insights
  sections.push('┌─ KEY INSIGHTS ──────────────────────────────────────────┐');
  strategy.summary.keyInsights.forEach((insight) => {
    sections.push(`│ • ${insight.substring(0, 55)}`);
    if (insight.length > 55) {
      const rest = insight.substring(55);
      sections.push(`│   ${rest}`);
    }
  });
  sections.push('└─────────────────────────────────────────────────────────┘');
  sections.push('');

  // Recommendations
  sections.push('┌─ RECOMMENDED ACTIONS ──────────────────────────────────┐');
  strategy.summary.recommendations.forEach((rec) => {
    const wrapped = rec.match(/.{1,55}/g) || [];
    wrapped.forEach((line, i) => {
      if (i === 0) {
        sections.push(`│ → ${line}`);
      } else {
        sections.push(`│   ${line}`);
      }
    });
  });
  sections.push('└─────────────────────────────────────────────────────────┘');
  sections.push('');

  // Sample Calendar
  sections.push('┌─ SAMPLE CALENDAR (First 15 posts) ────────────────────┐');
  strategy.monthlyCalendarTemplate.slice(0, 15).forEach((post) => {
    sections.push(
      `│ ${post.date} | ${post.platform.padEnd(10)} | ${post.postType.padEnd(12)} | ${post.pillar}`
    );
  });
  sections.push('└─────────────────────────────────────────────────────────┘');
  sections.push('');

  sections.push('═'.repeat(60));
  sections.push('Generated by 5ML Agentic AI Platform');
  sections.push('═'.repeat(60));

  const text = sections.join('\n');
  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${strategy.brandProfile.brandName}-strategy.txt`;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Copy strategy to clipboard as JSON
 */
export async function copyToClipboard(strategy: GeneratedBrandStrategy) {
  const text = JSON.stringify(strategy, null, 2);
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy:', err);
    return false;
  }
}

/**
 * Generate shareable link (base64 encoded)
 */
export function generateShareableLink(strategy: GeneratedBrandStrategy): string {
  const data = JSON.stringify(strategy);
  const encoded = btoa(unescape(encodeURIComponent(data)));
  const baseUrl =
    typeof window !== 'undefined' ? window.location.origin : '';
  return `${baseUrl}/brand-setup?shared=${encoded}`;
}
