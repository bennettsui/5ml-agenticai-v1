/**
 * Slide Templates for Monthly Social Media Reports
 * Each function creates a specific slide following 5 Miles Lab's design framework
 */

import PptxGenJS from 'pptxgenjs';
import {
  DesignSystem,
  DEFAULT_DESIGN_SYSTEM,
  MonthlyReportData,
  KPITile,
  PerformanceMetric,
  CampaignData,
  SEMGDNData,
} from './types';

// ===========================================
// Helper Functions
// ===========================================

function getChangeColor(change: number, design: DesignSystem): string {
  if (change > 0) return design.colors.highlightGreen;
  if (change < 0) return design.colors.highlightRed;
  return design.colors.textLight;
}

function formatChange(change: number): string {
  const sign = change >= 0 ? '+' : '';
  return `${sign}${change.toFixed(1)}%`;
}

function getTagEmoji(tag: 'strong' | 'monitor' | 'underperform'): string {
  switch (tag) {
    case 'strong': return '✅';
    case 'monitor': return '⚠️';
    case 'underperform': return '❌';
  }
}

function formatNumber(num: number | string): string {
  const n = typeof num === 'string' ? parseFloat(num) : num;
  if (isNaN(n)) return String(num);
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toLocaleString();
}

function formatCurrency(num: number): string {
  return `$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ===========================================
// Slide 1: Cover
// ===========================================

export function createCoverSlide(
  pptx: PptxGenJS,
  data: MonthlyReportData,
  design: DesignSystem = DEFAULT_DESIGN_SYSTEM
): void {
  const slide = pptx.addSlide();

  // Background gradient effect (using a colored rectangle)
  slide.addShape('rect', {
    x: 0,
    y: 0,
    w: '100%',
    h: '100%',
    fill: { color: design.colors.background },
  });

  // Accent band at bottom
  slide.addShape('rect', {
    x: 0,
    y: 5.0,
    w: '100%',
    h: 0.5,
    fill: { color: design.colors.primary },
  });

  // Client logo placeholder (top-left)
  if (data.config.clientLogo) {
    slide.addImage({
      path: data.config.clientLogo,
      x: 0.5,
      y: 0.3,
      w: 1.5,
      h: 0.8,
    });
  } else {
    slide.addText('[CLIENT_LOGO]', {
      x: 0.5,
      y: 0.3,
      w: 1.5,
      h: 0.8,
      fontSize: 10,
      color: design.colors.textLight,
      align: 'left',
    });
  }

  // Main title (centered)
  slide.addText(`${data.config.brandName}\nSocial Media Monthly Report`, {
    x: 0.5,
    y: 1.8,
    w: 9,
    h: 1.5,
    fontSize: design.sizes.h1,
    fontFace: design.fonts.title,
    color: design.colors.primary,
    align: 'center',
    bold: true,
  });

  // Month/Year subtitle
  slide.addText(data.config.monthYear, {
    x: 0.5,
    y: 3.3,
    w: 9,
    h: 0.5,
    fontSize: design.sizes.h2,
    fontFace: design.fonts.title,
    color: design.colors.secondary,
    align: 'center',
  });

  // By 5 Miles Lab (bottom-left)
  slide.addText('By 5 Miles Lab', {
    x: 0.5,
    y: 4.8,
    w: 3,
    h: 0.3,
    fontSize: 10,
    color: design.colors.textLight,
    align: 'left',
  });

  // Report date (bottom-right)
  slide.addText(`Report date: ${data.config.reportDate}`, {
    x: 6.5,
    y: 4.8,
    w: 3,
    h: 0.3,
    fontSize: 10,
    color: design.colors.textLight,
    align: 'right',
  });
}

// ===========================================
// Slide 2: Executive Summary
// ===========================================

export function createExecutiveSummarySlide(
  pptx: PptxGenJS,
  data: MonthlyReportData,
  design: DesignSystem = DEFAULT_DESIGN_SYSTEM
): void {
  const slide = pptx.addSlide();

  // Title
  slide.addText('Executive Summary & Next Month Focus', {
    x: 0.5,
    y: 0.3,
    w: 9,
    h: 0.5,
    fontSize: design.sizes.h1,
    fontFace: design.fonts.title,
    color: design.colors.primary,
    bold: true,
  });

  // KPI Tiles (2x2 grid on left side - 60% width)
  const kpis = data.executiveSummary.kpis.slice(0, 4);
  const tileWidth = 2.5;
  const tileHeight = 1.2;
  const startX = 0.5;
  const startY = 1.0;
  const gap = 0.2;

  kpis.forEach((kpi, index) => {
    const row = Math.floor(index / 2);
    const col = index % 2;
    const x = startX + col * (tileWidth + gap);
    const y = startY + row * (tileHeight + gap);

    // Tile background
    slide.addShape('rect', {
      x,
      y,
      w: tileWidth,
      h: tileHeight,
      fill: { color: design.colors.cardBackground },
      line: { color: design.colors.secondary, width: 0.5 },
    });

    // Top accent bar (colored by change)
    const accentColor = kpi.change !== undefined
      ? getChangeColor(kpi.change, design)
      : design.colors.primary;
    slide.addShape('rect', {
      x,
      y,
      w: tileWidth,
      h: 0.08,
      fill: { color: accentColor },
    });

    // KPI Label
    slide.addText(kpi.label, {
      x,
      y: y + 0.15,
      w: tileWidth,
      h: 0.3,
      fontSize: 10,
      color: design.colors.textLight,
      align: 'center',
    });

    // KPI Value
    slide.addText(String(kpi.value), {
      x,
      y: y + 0.4,
      w: tileWidth,
      h: 0.4,
      fontSize: 18,
      fontFace: design.fonts.title,
      color: design.colors.textDark,
      align: 'center',
      bold: true,
    });

    // Change percentage
    if (kpi.change !== undefined) {
      slide.addText(formatChange(kpi.change), {
        x,
        y: y + 0.85,
        w: tileWidth,
        h: 0.25,
        fontSize: 10,
        color: accentColor,
        align: 'center',
        bold: true,
      });
    }
  });

  // Right column: Key Highlights
  const rightX = 5.8;
  slide.addText('Key Highlights', {
    x: rightX,
    y: 1.0,
    w: 4,
    h: 0.35,
    fontSize: 14,
    fontFace: design.fonts.title,
    color: design.colors.primary,
    bold: true,
  });

  const highlights = data.executiveSummary.keyHighlights.map((h) => `• ${h}`).join('\n');
  slide.addText(highlights, {
    x: rightX,
    y: 1.4,
    w: 4,
    h: 1.5,
    fontSize: design.sizes.body,
    color: design.colors.textDark,
    valign: 'top',
  });

  // Right column: Next Month Focus
  slide.addText('Next Month Focus', {
    x: rightX,
    y: 3.0,
    w: 4,
    h: 0.35,
    fontSize: 14,
    fontFace: design.fonts.title,
    color: design.colors.primary,
    bold: true,
  });

  const focus = data.executiveSummary.nextMonthFocus.map((f) => `• ${f}`).join('\n');
  slide.addText(focus, {
    x: rightX,
    y: 3.4,
    w: 4,
    h: 1.5,
    fontSize: design.sizes.body,
    color: design.colors.textDark,
    valign: 'top',
  });
}

// ===========================================
// Slide 3 & 4: Channel Overview (FB/IG)
// ===========================================

export function createChannelOverviewSlide(
  pptx: PptxGenJS,
  channelName: 'Facebook' | 'Instagram',
  channelData: {
    kpis: KPITile[];
    followersHistory: Array<{ month: string; followers: number }>;
    performanceTable: PerformanceMetric[];
  },
  design: DesignSystem = DEFAULT_DESIGN_SYSTEM
): void {
  const slide = pptx.addSlide();

  // Title
  slide.addText(`Performance Summary of ${channelName}`, {
    x: 0.5,
    y: 0.3,
    w: 9,
    h: 0.5,
    fontSize: design.sizes.h1,
    fontFace: design.fonts.title,
    color: design.colors.primary,
    bold: true,
  });

  // KPI Tiles (3 horizontal)
  const kpis = channelData.kpis.slice(0, 3);
  const tileWidth = 2.8;
  const tileHeight = 0.9;
  const startX = 0.5;
  const startY = 0.95;
  const gap = 0.3;

  kpis.forEach((kpi, index) => {
    const x = startX + index * (tileWidth + gap);

    slide.addShape('rect', {
      x,
      y: startY,
      w: tileWidth,
      h: tileHeight,
      fill: { color: design.colors.cardBackground },
      line: { color: design.colors.secondary, width: 0.5 },
    });

    slide.addText(kpi.label, {
      x,
      y: startY + 0.1,
      w: tileWidth,
      h: 0.25,
      fontSize: 10,
      color: design.colors.textLight,
      align: 'center',
    });

    slide.addText(String(kpi.value), {
      x,
      y: startY + 0.35,
      w: tileWidth,
      h: 0.35,
      fontSize: 16,
      fontFace: design.fonts.title,
      color: design.colors.textDark,
      align: 'center',
      bold: true,
    });

    if (kpi.change !== undefined) {
      slide.addText(formatChange(kpi.change), {
        x,
        y: startY + 0.65,
        w: tileWidth,
        h: 0.2,
        fontSize: 9,
        color: getChangeColor(kpi.change, design),
        align: 'center',
      });
    }
  });

  // Followers Trend Chart (left side, lower half)
  slide.addText('Followers Trend', {
    x: 0.5,
    y: 2.1,
    w: 4.5,
    h: 0.3,
    fontSize: 12,
    color: design.colors.primary,
    bold: true,
  });

  // Chart data for line chart
  const chartData = [
    {
      name: 'Followers',
      labels: channelData.followersHistory.map((d) => d.month),
      values: channelData.followersHistory.map((d) => d.followers),
    },
  ];

  slide.addChart(pptx.ChartType.line, chartData, {
    x: 0.5,
    y: 2.4,
    w: 4.5,
    h: 2.3,
    showLegend: false,
    lineDataSymbol: 'circle',
    lineDataSymbolSize: 6,
    chartColors: [design.colors.primary],
    catAxisLabelFontSize: 8,
    valAxisLabelFontSize: 8,
  });

  // Performance Summary Table (right side, lower half)
  slide.addText('Performance Summary', {
    x: 5.3,
    y: 2.1,
    w: 4.5,
    h: 0.3,
    fontSize: 12,
    color: design.colors.primary,
    bold: true,
  });

  const tableRows: PptxGenJS.TableRow[] = [
    // Header row
    [
      { text: 'Metric', options: { bold: true, fill: { color: design.colors.primary }, color: 'FFFFFF', fontSize: design.sizes.table } },
      { text: 'Last Month', options: { bold: true, fill: { color: design.colors.primary }, color: 'FFFFFF', fontSize: design.sizes.table, align: 'right' } },
      { text: 'This Month', options: { bold: true, fill: { color: design.colors.primary }, color: 'FFFFFF', fontSize: design.sizes.table, align: 'right' } },
      { text: 'Change', options: { bold: true, fill: { color: design.colors.primary }, color: 'FFFFFF', fontSize: design.sizes.table, align: 'right' } },
    ],
  ];

  channelData.performanceTable.forEach((row, index) => {
    const bgColor = index % 2 === 0 ? design.colors.cardBackground : design.colors.background;
    const changeColor = getChangeColor(row.change, design);

    tableRows.push([
      { text: row.metric, options: { fill: { color: bgColor }, fontSize: design.sizes.table } },
      { text: formatNumber(row.lastMonth), options: { fill: { color: bgColor }, fontSize: design.sizes.table, align: 'right' } },
      { text: formatNumber(row.thisMonth), options: { fill: { color: bgColor }, fontSize: design.sizes.table, align: 'right' } },
      { text: formatChange(row.change), options: { fill: { color: bgColor }, fontSize: design.sizes.table, align: 'right', color: changeColor } },
    ]);
  });

  slide.addTable(tableRows, {
    x: 5.3,
    y: 2.4,
    w: 4.5,
    colW: [1.5, 1, 1, 1],
    border: { type: 'solid', color: design.colors.secondary, pt: 0.5 },
  });
}

// ===========================================
// Slide 5: Top & Bottom Posts
// ===========================================

export function createContentPerformanceSlide(
  pptx: PptxGenJS,
  data: MonthlyReportData,
  design: DesignSystem = DEFAULT_DESIGN_SYSTEM
): void {
  if (!data.contentPerformance) return;

  const slide = pptx.addSlide();

  slide.addText('Top & Bottom Posts – Facebook', {
    x: 0.5,
    y: 0.3,
    w: 9,
    h: 0.4,
    fontSize: design.sizes.h1,
    fontFace: design.fonts.title,
    color: design.colors.primary,
    bold: true,
  });

  // Top Posts section
  slide.addText('Top 5 Posts', {
    x: 0.5,
    y: 0.8,
    w: 7,
    h: 0.3,
    fontSize: 12,
    color: design.colors.highlightGreen,
    bold: true,
  });

  const topPostsTable: PptxGenJS.TableRow[] = [
    [
      { text: 'Date', options: { bold: true, fill: { color: design.colors.highlightGreen }, color: 'FFFFFF', fontSize: 8 } },
      { text: 'Format', options: { bold: true, fill: { color: design.colors.highlightGreen }, color: 'FFFFFF', fontSize: 8 } },
      { text: 'Caption', options: { bold: true, fill: { color: design.colors.highlightGreen }, color: 'FFFFFF', fontSize: 8 } },
      { text: 'Impr.', options: { bold: true, fill: { color: design.colors.highlightGreen }, color: 'FFFFFF', fontSize: 8, align: 'right' } },
      { text: 'ER', options: { bold: true, fill: { color: design.colors.highlightGreen }, color: 'FFFFFF', fontSize: 8, align: 'right' } },
      { text: 'Clicks', options: { bold: true, fill: { color: design.colors.highlightGreen }, color: 'FFFFFF', fontSize: 8, align: 'right' } },
    ],
  ];

  data.contentPerformance.topPosts.slice(0, 5).forEach((post, i) => {
    const bg = i % 2 === 0 ? design.colors.cardBackground : design.colors.background;
    topPostsTable.push([
      { text: post.date, options: { fill: { color: bg }, fontSize: 8 } },
      { text: post.format, options: { fill: { color: bg }, fontSize: 8 } },
      { text: post.caption.substring(0, 40) + '...', options: { fill: { color: bg }, fontSize: 8 } },
      { text: formatNumber(post.impressions), options: { fill: { color: bg }, fontSize: 8, align: 'right' } },
      { text: `${post.engagementRate.toFixed(2)}%`, options: { fill: { color: bg }, fontSize: 8, align: 'right' } },
      { text: formatNumber(post.linkClicks), options: { fill: { color: bg }, fontSize: 8, align: 'right' } },
    ]);
  });

  slide.addTable(topPostsTable, {
    x: 0.5,
    y: 1.1,
    w: 7,
    colW: [0.8, 0.8, 2.4, 0.8, 0.6, 0.6],
    border: { type: 'solid', color: design.colors.secondary, pt: 0.5 },
  });

  // Bottom Posts section
  slide.addText('Bottom 5 Posts', {
    x: 0.5,
    y: 2.8,
    w: 7,
    h: 0.3,
    fontSize: 12,
    color: design.colors.highlightRed,
    bold: true,
  });

  const bottomPostsTable: PptxGenJS.TableRow[] = [
    [
      { text: 'Date', options: { bold: true, fill: { color: design.colors.highlightRed }, color: 'FFFFFF', fontSize: 8 } },
      { text: 'Format', options: { bold: true, fill: { color: design.colors.highlightRed }, color: 'FFFFFF', fontSize: 8 } },
      { text: 'Caption', options: { bold: true, fill: { color: design.colors.highlightRed }, color: 'FFFFFF', fontSize: 8 } },
      { text: 'Impr.', options: { bold: true, fill: { color: design.colors.highlightRed }, color: 'FFFFFF', fontSize: 8, align: 'right' } },
      { text: 'ER', options: { bold: true, fill: { color: design.colors.highlightRed }, color: 'FFFFFF', fontSize: 8, align: 'right' } },
      { text: 'Clicks', options: { bold: true, fill: { color: design.colors.highlightRed }, color: 'FFFFFF', fontSize: 8, align: 'right' } },
    ],
  ];

  data.contentPerformance.bottomPosts.slice(0, 5).forEach((post, i) => {
    const bg = i % 2 === 0 ? design.colors.cardBackground : design.colors.background;
    bottomPostsTable.push([
      { text: post.date, options: { fill: { color: bg }, fontSize: 8 } },
      { text: post.format, options: { fill: { color: bg }, fontSize: 8 } },
      { text: post.caption.substring(0, 40) + '...', options: { fill: { color: bg }, fontSize: 8 } },
      { text: formatNumber(post.impressions), options: { fill: { color: bg }, fontSize: 8, align: 'right' } },
      { text: `${post.engagementRate.toFixed(2)}%`, options: { fill: { color: bg }, fontSize: 8, align: 'right' } },
      { text: formatNumber(post.linkClicks), options: { fill: { color: bg }, fontSize: 8, align: 'right' } },
    ]);
  });

  slide.addTable(bottomPostsTable, {
    x: 0.5,
    y: 3.1,
    w: 7,
    colW: [0.8, 0.8, 2.4, 0.8, 0.6, 0.6],
    border: { type: 'solid', color: design.colors.secondary, pt: 0.5 },
  });

  // Insights box (right side)
  slide.addShape('rect', {
    x: 7.8,
    y: 1.1,
    w: 2,
    h: 1.5,
    fill: { color: design.colors.cardBackground },
    line: { color: design.colors.primary, width: 1 },
  });

  slide.addText('What This Means', {
    x: 7.9,
    y: 1.2,
    w: 1.8,
    h: 0.25,
    fontSize: 10,
    color: design.colors.primary,
    bold: true,
  });

  const insights = data.contentPerformance.insights.map((i) => `• ${i}`).join('\n');
  slide.addText(insights, {
    x: 7.9,
    y: 1.45,
    w: 1.8,
    h: 1.1,
    fontSize: 8,
    color: design.colors.textDark,
    valign: 'top',
  });

  // Actions box
  slide.addShape('rect', {
    x: 7.8,
    y: 2.8,
    w: 2,
    h: 1.5,
    fill: { color: design.colors.cardBackground },
    line: { color: design.colors.highlightGreen, width: 1 },
  });

  slide.addText('Actions', {
    x: 7.9,
    y: 2.9,
    w: 1.8,
    h: 0.25,
    fontSize: 10,
    color: design.colors.highlightGreen,
    bold: true,
  });

  const actions = data.contentPerformance.actions.map((a) => `• ${a}`).join('\n');
  slide.addText(actions, {
    x: 7.9,
    y: 3.15,
    w: 1.8,
    h: 1.1,
    fontSize: 8,
    color: design.colors.textDark,
    valign: 'top',
  });
}

// ===========================================
// Slide 6: Content Themes
// ===========================================

export function createContentThemesSlide(
  pptx: PptxGenJS,
  data: MonthlyReportData,
  design: DesignSystem = DEFAULT_DESIGN_SYSTEM
): void {
  if (!data.contentThemes) return;

  const slide = pptx.addSlide();

  slide.addText('Content Themes Performance', {
    x: 0.5,
    y: 0.3,
    w: 9,
    h: 0.4,
    fontSize: design.sizes.h1,
    fontFace: design.fonts.title,
    color: design.colors.primary,
    bold: true,
  });

  // Table (left side)
  const tableRows: PptxGenJS.TableRow[] = [
    [
      { text: 'Theme', options: { bold: true, fill: { color: design.colors.primary }, color: 'FFFFFF', fontSize: design.sizes.table } },
      { text: 'Posts', options: { bold: true, fill: { color: design.colors.primary }, color: 'FFFFFF', fontSize: design.sizes.table, align: 'right' } },
      { text: 'Avg ER', options: { bold: true, fill: { color: design.colors.primary }, color: 'FFFFFF', fontSize: design.sizes.table, align: 'right' } },
      { text: 'Avg Clicks', options: { bold: true, fill: { color: design.colors.primary }, color: 'FFFFFF', fontSize: design.sizes.table, align: 'right' } },
      { text: 'Note', options: { bold: true, fill: { color: design.colors.primary }, color: 'FFFFFF', fontSize: design.sizes.table } },
    ],
  ];

  data.contentThemes.themes.forEach((theme, i) => {
    const bg = i % 2 === 0 ? design.colors.cardBackground : design.colors.background;
    tableRows.push([
      { text: theme.theme, options: { fill: { color: bg }, fontSize: design.sizes.table } },
      { text: String(theme.numPosts), options: { fill: { color: bg }, fontSize: design.sizes.table, align: 'right' } },
      { text: `${theme.avgEngagementRate.toFixed(2)}%`, options: { fill: { color: bg }, fontSize: design.sizes.table, align: 'right' } },
      { text: formatNumber(theme.avgClicks), options: { fill: { color: bg }, fontSize: design.sizes.table, align: 'right' } },
      { text: theme.note || '', options: { fill: { color: bg }, fontSize: design.sizes.table } },
    ]);
  });

  slide.addTable(tableRows, {
    x: 0.5,
    y: 1.0,
    w: 5,
    colW: [1.5, 0.6, 0.8, 0.9, 1.2],
    border: { type: 'solid', color: design.colors.secondary, pt: 0.5 },
  });

  // Bar chart (right side)
  const chartData = [
    {
      name: 'Avg ER',
      labels: data.contentThemes.themes.map((t) => t.theme),
      values: data.contentThemes.themes.map((t) => t.avgEngagementRate),
    },
  ];

  slide.addChart(pptx.ChartType.bar, chartData, {
    x: 5.8,
    y: 1.0,
    w: 4,
    h: 3.5,
    showLegend: false,
    barDir: 'bar',
    chartColors: [design.colors.primary],
    catAxisLabelFontSize: 9,
    valAxisLabelFontSize: 9,
    dataLabelPosition: 'outEnd',
    showValue: true,
    dataLabelFontSize: 8,
  });
}

// ===========================================
// Slide 7: Social Ads Overview
// ===========================================

export function createSocialAdsOverviewSlide(
  pptx: PptxGenJS,
  data: MonthlyReportData,
  design: DesignSystem = DEFAULT_DESIGN_SYSTEM
): void {
  if (!data.socialAds) return;

  const slide = pptx.addSlide();

  slide.addText('Paid Social Overview', {
    x: 0.5,
    y: 0.3,
    w: 9,
    h: 0.4,
    fontSize: design.sizes.h1,
    fontFace: design.fonts.title,
    color: design.colors.primary,
    bold: true,
  });

  // Three bar charts side by side
  const chartWidth = 2.9;
  const chartHeight = 2.2;
  const startY = 0.9;

  // Spend by Platform
  const spendData = [
    {
      name: 'Spend',
      labels: data.socialAds.spendByPlatform.map((p) => p.platform),
      values: data.socialAds.spendByPlatform.map((p) => p.spend),
    },
  ];

  slide.addText('Spend by Platform', {
    x: 0.5,
    y: startY,
    w: chartWidth,
    h: 0.25,
    fontSize: 10,
    color: design.colors.primary,
    bold: true,
    align: 'center',
  });

  slide.addChart(pptx.ChartType.bar, spendData, {
    x: 0.5,
    y: startY + 0.3,
    w: chartWidth,
    h: chartHeight,
    showLegend: false,
    chartColors: [design.colors.primary],
    catAxisLabelFontSize: 8,
    valAxisLabelFontSize: 8,
  });

  // Clicks by Platform
  const clicksData = [
    {
      name: 'Clicks',
      labels: data.socialAds.clicksByPlatform.map((p) => p.platform),
      values: data.socialAds.clicksByPlatform.map((p) => p.clicks),
    },
  ];

  slide.addText('Clicks by Platform', {
    x: 3.6,
    y: startY,
    w: chartWidth,
    h: 0.25,
    fontSize: 10,
    color: design.colors.primary,
    bold: true,
    align: 'center',
  });

  slide.addChart(pptx.ChartType.bar, clicksData, {
    x: 3.6,
    y: startY + 0.3,
    w: chartWidth,
    h: chartHeight,
    showLegend: false,
    chartColors: [design.colors.highlightGreen],
    catAxisLabelFontSize: 8,
    valAxisLabelFontSize: 8,
  });

  // CPC by Platform
  const cpcData = [
    {
      name: 'CPC',
      labels: data.socialAds.cpcByPlatform.map((p) => p.platform),
      values: data.socialAds.cpcByPlatform.map((p) => p.cpc),
    },
  ];

  slide.addText('Avg CPC by Platform', {
    x: 6.7,
    y: startY,
    w: chartWidth,
    h: 0.25,
    fontSize: 10,
    color: design.colors.primary,
    bold: true,
    align: 'center',
  });

  slide.addChart(pptx.ChartType.bar, cpcData, {
    x: 6.7,
    y: startY + 0.3,
    w: chartWidth,
    h: chartHeight,
    showLegend: false,
    chartColors: [design.colors.secondary],
    catAxisLabelFontSize: 8,
    valAxisLabelFontSize: 8,
  });

  // Summary bullets
  slide.addShape('rect', {
    x: 0.5,
    y: 3.6,
    w: 9,
    h: 1.2,
    fill: { color: design.colors.cardBackground },
    line: { color: design.colors.primary, width: 1 },
  });

  slide.addText('Key Takeaways', {
    x: 0.6,
    y: 3.7,
    w: 8.8,
    h: 0.25,
    fontSize: 11,
    color: design.colors.primary,
    bold: true,
  });

  const summary = data.socialAds.summary.map((s) => `• ${s}`).join('\n');
  slide.addText(summary, {
    x: 0.6,
    y: 4.0,
    w: 8.8,
    h: 0.7,
    fontSize: design.sizes.body,
    color: design.colors.textDark,
    valign: 'top',
  });
}

// ===========================================
// Slide 8: Social Ads Campaign Table
// ===========================================

export function createCampaignTableSlide(
  pptx: PptxGenJS,
  data: MonthlyReportData,
  design: DesignSystem = DEFAULT_DESIGN_SYSTEM
): void {
  if (!data.socialAds?.campaigns) return;

  const slide = pptx.addSlide();

  slide.addText('Facebook Ads – Campaign Performance', {
    x: 0.5,
    y: 0.3,
    w: 9,
    h: 0.4,
    fontSize: design.sizes.h1,
    fontFace: design.fonts.title,
    color: design.colors.primary,
    bold: true,
  });

  const tableRows: PptxGenJS.TableRow[] = [
    [
      { text: 'Campaign', options: { bold: true, fill: { color: design.colors.primary }, color: 'FFFFFF', fontSize: 8 } },
      { text: 'Objective', options: { bold: true, fill: { color: design.colors.primary }, color: 'FFFFFF', fontSize: 8 } },
      { text: 'Period', options: { bold: true, fill: { color: design.colors.primary }, color: 'FFFFFF', fontSize: 8 } },
      { text: 'Budget', options: { bold: true, fill: { color: design.colors.primary }, color: 'FFFFFF', fontSize: 8, align: 'right' } },
      { text: 'Spent', options: { bold: true, fill: { color: design.colors.primary }, color: 'FFFFFF', fontSize: 8, align: 'right' } },
      { text: 'Impr.', options: { bold: true, fill: { color: design.colors.primary }, color: 'FFFFFF', fontSize: 8, align: 'right' } },
      { text: 'CTR', options: { bold: true, fill: { color: design.colors.primary }, color: 'FFFFFF', fontSize: 8, align: 'right' } },
      { text: 'CPC', options: { bold: true, fill: { color: design.colors.primary }, color: 'FFFFFF', fontSize: 8, align: 'right' } },
      { text: 'CPM', options: { bold: true, fill: { color: design.colors.primary }, color: 'FFFFFF', fontSize: 8, align: 'right' } },
      { text: 'Tag', options: { bold: true, fill: { color: design.colors.primary }, color: 'FFFFFF', fontSize: 8, align: 'center' } },
    ],
  ];

  data.socialAds.campaigns.forEach((camp) => {
    let bgColor = design.colors.background;
    if (camp.tag === 'strong') bgColor = '#e6ffed';
    else if (camp.tag === 'underperform') bgColor = '#ffe6e6';

    tableRows.push([
      { text: camp.campaign, options: { fill: { color: bgColor }, fontSize: 8 } },
      { text: camp.objective, options: { fill: { color: bgColor }, fontSize: 8 } },
      { text: camp.period, options: { fill: { color: bgColor }, fontSize: 8 } },
      { text: formatCurrency(camp.budget), options: { fill: { color: bgColor }, fontSize: 8, align: 'right' } },
      { text: formatCurrency(camp.spent), options: { fill: { color: bgColor }, fontSize: 8, align: 'right' } },
      { text: formatNumber(camp.impressions), options: { fill: { color: bgColor }, fontSize: 8, align: 'right' } },
      { text: `${camp.ctr.toFixed(2)}%`, options: { fill: { color: bgColor }, fontSize: 8, align: 'right' } },
      { text: formatCurrency(camp.cpc), options: { fill: { color: bgColor }, fontSize: 8, align: 'right' } },
      { text: formatCurrency(camp.cpm), options: { fill: { color: bgColor }, fontSize: 8, align: 'right' } },
      { text: getTagEmoji(camp.tag), options: { fill: { color: bgColor }, fontSize: 10, align: 'center' } },
    ]);
  });

  slide.addTable(tableRows, {
    x: 0.3,
    y: 0.85,
    w: 9.4,
    colW: [1.8, 0.9, 0.9, 0.8, 0.8, 0.8, 0.6, 0.7, 0.7, 0.4],
    border: { type: 'solid', color: design.colors.secondary, pt: 0.5 },
  });

  // Legend
  slide.addText('Legend: ✅ Strong   ⚠️ Monitor   ❌ Underperform', {
    x: 0.5,
    y: 4.8,
    w: 5,
    h: 0.25,
    fontSize: 9,
    color: design.colors.textLight,
  });
}

// ===========================================
// Slide 11: Audience & Behaviour
// ===========================================

export function createAudienceSlide(
  pptx: PptxGenJS,
  data: MonthlyReportData,
  design: DesignSystem = DEFAULT_DESIGN_SYSTEM
): void {
  if (!data.audience) return;

  const slide = pptx.addSlide();

  slide.addText('Audience & Behaviour', {
    x: 0.5,
    y: 0.3,
    w: 9,
    h: 0.4,
    fontSize: design.sizes.h1,
    fontFace: design.fonts.title,
    color: design.colors.primary,
    bold: true,
  });

  // Age Distribution (top-left)
  slide.addText('Age Distribution', {
    x: 0.5,
    y: 0.85,
    w: 4.5,
    h: 0.25,
    fontSize: 11,
    color: design.colors.primary,
    bold: true,
  });

  const ageData = [
    {
      name: 'Age',
      labels: data.audience.ageDistribution.map((a) => a.age),
      values: data.audience.ageDistribution.map((a) => a.percentage),
    },
  ];

  slide.addChart(pptx.ChartType.bar, ageData, {
    x: 0.5,
    y: 1.1,
    w: 4.3,
    h: 1.5,
    showLegend: false,
    chartColors: [design.colors.primary],
    catAxisLabelFontSize: 8,
    valAxisLabelFontSize: 8,
  });

  // Gender Split (top-right)
  slide.addText('Gender Split', {
    x: 5.2,
    y: 0.85,
    w: 4.5,
    h: 0.25,
    fontSize: 11,
    color: design.colors.primary,
    bold: true,
  });

  const genderData = [
    {
      name: 'Gender',
      labels: ['Male', 'Female'],
      values: [data.audience.genderSplit.male, data.audience.genderSplit.female],
    },
  ];

  slide.addChart(pptx.ChartType.doughnut, genderData, {
    x: 5.5,
    y: 1.1,
    w: 2,
    h: 1.5,
    showLegend: true,
    legendPos: 'r',
    chartColors: [design.colors.primary, design.colors.highlightGreen],
  });

  // Top Locations (bottom-left)
  slide.addText('Top Locations', {
    x: 0.5,
    y: 2.8,
    w: 4.5,
    h: 0.25,
    fontSize: 11,
    color: design.colors.primary,
    bold: true,
  });

  const locationRows: PptxGenJS.TableRow[] = data.audience.topLocations.slice(0, 5).map((loc, i) => {
    const bg = i % 2 === 0 ? design.colors.cardBackground : design.colors.background;
    return [
      { text: loc.location, options: { fill: { color: bg }, fontSize: 9 } },
      { text: `${loc.percentage.toFixed(1)}%`, options: { fill: { color: bg }, fontSize: 9, align: 'right' } },
    ];
  });

  slide.addTable(locationRows, {
    x: 0.5,
    y: 3.1,
    w: 4.3,
    colW: [3.3, 1],
    border: { type: 'solid', color: design.colors.secondary, pt: 0.5 },
  });

  // Device Breakdown (bottom-right)
  slide.addText('Device Breakdown', {
    x: 5.2,
    y: 2.8,
    w: 4.5,
    h: 0.25,
    fontSize: 11,
    color: design.colors.primary,
    bold: true,
  });

  const deviceData = [
    {
      name: 'Device',
      labels: ['Mobile', 'Desktop'],
      values: [data.audience.deviceBreakdown.mobile, data.audience.deviceBreakdown.desktop],
    },
  ];

  slide.addChart(pptx.ChartType.pie, deviceData, {
    x: 5.5,
    y: 3.0,
    w: 2,
    h: 1.4,
    showLegend: true,
    legendPos: 'r',
    chartColors: [design.colors.highlightGreen, design.colors.secondary],
  });

  // Insights box at bottom
  slide.addShape('rect', {
    x: 0.5,
    y: 4.5,
    w: 9,
    h: 0.8,
    fill: { color: design.colors.cardBackground },
    line: { color: design.colors.primary, width: 1 },
  });

  slide.addText('Audience Insights', {
    x: 0.6,
    y: 4.55,
    w: 2,
    h: 0.2,
    fontSize: 10,
    color: design.colors.primary,
    bold: true,
  });

  const insightsText = data.audience.insights.concat(data.audience.recommendations).map((i) => `• ${i}`).join('  ');
  slide.addText(insightsText, {
    x: 0.6,
    y: 4.8,
    w: 8.8,
    h: 0.4,
    fontSize: 9,
    color: design.colors.textDark,
  });
}

// ===========================================
// Slide 14: Next Month Plan
// ===========================================

export function createNextMonthSlide(
  pptx: PptxGenJS,
  data: MonthlyReportData,
  design: DesignSystem = DEFAULT_DESIGN_SYSTEM
): void {
  const slide = pptx.addSlide();

  slide.addText('Next Month Plan & Testing Roadmap', {
    x: 0.5,
    y: 0.3,
    w: 9,
    h: 0.4,
    fontSize: design.sizes.h1,
    fontFace: design.fonts.title,
    color: design.colors.primary,
    bold: true,
  });

  // Strategic Priorities (left)
  slide.addText('Strategic Priorities', {
    x: 0.5,
    y: 0.9,
    w: 4.5,
    h: 0.3,
    fontSize: 14,
    color: design.colors.primary,
    bold: true,
  });

  const priorities = data.nextMonth.strategicPriorities.map((p, i) => `${i + 1}. ${p}`).join('\n\n');
  slide.addText(priorities, {
    x: 0.5,
    y: 1.3,
    w: 4.5,
    h: 2.5,
    fontSize: design.sizes.body,
    color: design.colors.textDark,
    valign: 'top',
  });

  // Experiment Roadmap (right)
  slide.addText('Experiment Roadmap', {
    x: 5.3,
    y: 0.9,
    w: 4.5,
    h: 0.3,
    fontSize: 14,
    color: design.colors.primary,
    bold: true,
  });

  const roadmapRows: PptxGenJS.TableRow[] = [
    [
      { text: 'Test', options: { bold: true, fill: { color: design.colors.primary }, color: 'FFFFFF', fontSize: 10 } },
      { text: 'Status', options: { bold: true, fill: { color: design.colors.primary }, color: 'FFFFFF', fontSize: 10, align: 'center' } },
    ],
  ];

  data.nextMonth.experimentRoadmap.forEach((exp, i) => {
    const bg = i % 2 === 0 ? design.colors.cardBackground : design.colors.background;
    let statusIcon = '⬜';
    if (exp.status === 'in_progress') statusIcon = '🔄';
    if (exp.status === 'completed') statusIcon = '✅';

    roadmapRows.push([
      { text: exp.test, options: { fill: { color: bg }, fontSize: 10 } },
      { text: statusIcon, options: { fill: { color: bg }, fontSize: 12, align: 'center' } },
    ]);
  });

  slide.addTable(roadmapRows, {
    x: 5.3,
    y: 1.3,
    w: 4.2,
    colW: [3.4, 0.8],
    border: { type: 'solid', color: design.colors.secondary, pt: 0.5 },
  });

  // Thank you section at bottom
  slide.addShape('rect', {
    x: 0,
    y: 4.5,
    w: '100%',
    h: 1,
    fill: { color: design.colors.primary },
  });

  slide.addText('Thank you', {
    x: 0.5,
    y: 4.7,
    w: 4,
    h: 0.5,
    fontSize: 20,
    color: 'FFFFFF',
    bold: true,
  });

  slide.addText(`${data.config.brandName} × 5 Miles Lab`, {
    x: 5.5,
    y: 4.85,
    w: 4,
    h: 0.3,
    fontSize: 12,
    color: 'FFFFFF',
    align: 'right',
  });
}
