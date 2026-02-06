/**
 * Monthly Report Generator
 * Generates PPTX and PDF reports for social media performance
 */

import PptxGenJS from 'pptxgenjs';
import * as fs from 'fs';
import * as path from 'path';
import {
  MonthlyReportData,
  ExportOptions,
  ExportResult,
  DesignSystem,
  DEFAULT_DESIGN_SYSTEM,
} from './types';
import {
  createCoverSlide,
  createExecutiveSummarySlide,
  createChannelOverviewSlide,
  createContentPerformanceSlide,
  createContentThemesSlide,
  createSocialAdsOverviewSlide,
  createCampaignTableSlide,
  createAudienceSlide,
  createNextMonthSlide,
} from './slide-templates';

// ===========================================
// Report Generator Class
// ===========================================

export class MonthlyReportGenerator {
  private design: DesignSystem;

  constructor(design?: Partial<DesignSystem>) {
    this.design = { ...DEFAULT_DESIGN_SYSTEM, ...design };
  }

  /**
   * Generate a complete monthly report
   */
  async generate(data: MonthlyReportData, options: ExportOptions): Promise<ExportResult> {
    try {
      // Create PowerPoint presentation
      const pptx = new PptxGenJS();

      // Set presentation properties
      pptx.author = '5 Miles Lab';
      pptx.title = `${data.config.brandName} Social Media Monthly Report - ${data.config.monthYear}`;
      pptx.subject = 'Monthly Social Media Performance Report';
      pptx.company = '5 Miles Lab';

      // Set slide dimensions (16:9 widescreen)
      pptx.defineLayout({ name: 'LAYOUT_16x9', width: 10, height: 5.625 });
      pptx.layout = 'LAYOUT_16x9';

      // Apply custom colors if provided
      if (data.config.primaryColor) {
        this.design.colors.primary = data.config.primaryColor;
      }
      if (data.config.secondaryColor) {
        this.design.colors.secondary = data.config.secondaryColor;
      }

      // Generate slides
      this.buildSlides(pptx, data, options.includeSlides);

      // Determine output paths
      const outputDir = options.outputDir || process.cwd();
      const baseFilename = options.filename || `${data.config.brandName.replace(/\s+/g, '_')}_Report_${data.config.monthYear.replace(/\s+/g, '_')}`;

      const result: ExportResult = { success: true };

      // Export PPTX
      if (options.format === 'pptx' || options.format === 'both') {
        const pptxPath = path.join(outputDir, `${baseFilename}.pptx`);
        await pptx.writeFile({ fileName: pptxPath });
        result.pptxPath = pptxPath;
        console.log(`[ReportGenerator] PPTX saved to: ${pptxPath}`);
      }

      // Export PDF (using pptx's built-in if available, or placeholder)
      if (options.format === 'pdf' || options.format === 'both') {
        const pdfPath = path.join(outputDir, `${baseFilename}.pdf`);
        // Note: pptxgenjs doesn't natively support PDF export
        // For PDF, we'd typically use LibreOffice, Puppeteer, or a cloud service
        // Here we save the PPTX and note that PDF conversion is needed
        await this.exportToPdf(pptx, pptxPath, pdfPath, data);
        result.pdfPath = pdfPath;
      }

      return result;
    } catch (error) {
      console.error('[ReportGenerator] Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Build all slides based on data availability
   */
  private buildSlides(
    pptx: PptxGenJS,
    data: MonthlyReportData,
    includeSlides?: number[]
  ): void {
    const slideBuilders = [
      { num: 1, fn: () => createCoverSlide(pptx, data, this.design) },
      { num: 2, fn: () => createExecutiveSummarySlide(pptx, data, this.design) },
      { num: 3, fn: () => data.facebook && createChannelOverviewSlide(pptx, 'Facebook', data.facebook, this.design) },
      { num: 4, fn: () => data.instagram && createChannelOverviewSlide(pptx, 'Instagram', data.instagram, this.design) },
      { num: 5, fn: () => createContentPerformanceSlide(pptx, data, this.design) },
      { num: 6, fn: () => createContentThemesSlide(pptx, data, this.design) },
      { num: 7, fn: () => createSocialAdsOverviewSlide(pptx, data, this.design) },
      { num: 8, fn: () => createCampaignTableSlide(pptx, data, this.design) },
      // Slides 9-10: SEM & GDN (can be added similarly)
      { num: 11, fn: () => createAudienceSlide(pptx, data, this.design) },
      // Slide 12: Conversions (can be added)
      // Slide 13: Promotions (can be added)
      { num: 14, fn: () => createNextMonthSlide(pptx, data, this.design) },
    ];

    for (const builder of slideBuilders) {
      if (!includeSlides || includeSlides.includes(builder.num)) {
        builder.fn();
      }
    }
  }

  /**
   * Export to PDF
   * Note: This is a placeholder - actual PDF conversion requires external tools
   */
  private async exportToPdf(
    pptx: PptxGenJS,
    pptxPath: string,
    pdfPath: string,
    data: MonthlyReportData
  ): Promise<void> {
    // Option 1: Use LibreOffice (if installed)
    // soffice --headless --convert-to pdf --outdir /output /input.pptx

    // Option 2: Use a PDF generation library directly (html-pdf, puppeteer, etc.)
    // For now, we'll create a simple HTML-based PDF as a fallback

    try {
      // Check if LibreOffice is available
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);

      // First ensure PPTX is saved
      if (!pptxPath) {
        const tempPptxPath = pdfPath.replace('.pdf', '.pptx');
        await pptx.writeFile({ fileName: tempPptxPath });
        pptxPath = tempPptxPath;
      }

      // Try LibreOffice conversion
      const outputDir = path.dirname(pdfPath);
      try {
        await execAsync(`soffice --headless --convert-to pdf --outdir "${outputDir}" "${pptxPath}"`);
        console.log(`[ReportGenerator] PDF converted via LibreOffice: ${pdfPath}`);
        return;
      } catch {
        console.log('[ReportGenerator] LibreOffice not available, creating HTML-based PDF...');
      }

      // Fallback: Create an HTML summary that can be converted to PDF
      await this.createHtmlPdfFallback(pdfPath, data);
    } catch (error) {
      console.error('[ReportGenerator] PDF export error:', error);
      // Create a placeholder note
      fs.writeFileSync(
        pdfPath.replace('.pdf', '_PDF_INSTRUCTIONS.txt'),
        `PDF Export Instructions:\n\n` +
        `To convert the PPTX to PDF:\n` +
        `1. Open the PPTX file in PowerPoint/LibreOffice\n` +
        `2. File > Export/Save As > PDF\n\n` +
        `Or use command line:\n` +
        `soffice --headless --convert-to pdf --outdir . "${pptxPath}"\n`
      );
    }
  }

  /**
   * Create HTML-based PDF fallback using basic HTML
   */
  private async createHtmlPdfFallback(pdfPath: string, data: MonthlyReportData): Promise<void> {
    const html = this.generateHtmlReport(data);
    const htmlPath = pdfPath.replace('.pdf', '.html');
    fs.writeFileSync(htmlPath, html);
    console.log(`[ReportGenerator] HTML report saved to: ${htmlPath}`);
    console.log(`[ReportGenerator] Open in browser and print to PDF, or use: npx puppeteer print ${htmlPath} ${pdfPath}`);
  }

  /**
   * Generate HTML version of the report
   */
  private generateHtmlReport(data: MonthlyReportData): string {
    const { primary, secondary, highlightGreen, highlightRed, textDark, cardBackground } = this.design.colors;

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.config.brandName} - Monthly Report ${data.config.monthYear}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; color: ${textDark}; line-height: 1.5; }
    .page { page-break-after: always; padding: 40px; min-height: 100vh; }
    .page:last-child { page-break-after: avoid; }
    h1 { font-size: 28px; color: ${primary}; margin-bottom: 20px; }
    h2 { font-size: 20px; color: ${primary}; margin-bottom: 15px; }
    h3 { font-size: 16px; color: ${secondary}; margin-bottom: 10px; }
    .kpi-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 30px; }
    .kpi-tile { background: ${cardBackground}; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; text-align: center; }
    .kpi-tile .label { font-size: 12px; color: ${secondary}; margin-bottom: 5px; }
    .kpi-tile .value { font-size: 24px; font-weight: bold; color: ${textDark}; }
    .kpi-tile .change { font-size: 12px; margin-top: 5px; }
    .change.positive { color: ${highlightGreen}; }
    .change.negative { color: ${highlightRed}; }
    .section { margin-bottom: 30px; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    th, td { border: 1px solid #e2e8f0; padding: 8px; text-align: left; }
    th { background: ${primary}; color: white; font-weight: bold; }
    tr:nth-child(even) { background: ${cardBackground}; }
    .highlight-box { background: ${cardBackground}; border-left: 4px solid ${primary}; padding: 15px; margin: 15px 0; }
    ul { padding-left: 20px; }
    li { margin-bottom: 5px; }
    .cover { text-align: center; display: flex; flex-direction: column; justify-content: center; align-items: center; }
    .cover h1 { font-size: 36px; margin-bottom: 10px; }
    .cover .subtitle { font-size: 24px; color: ${secondary}; }
    .footer { position: fixed; bottom: 20px; width: 100%; text-align: center; font-size: 10px; color: ${secondary}; }
    @media print {
      .page { page-break-after: always; }
      body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <!-- Cover -->
  <div class="page cover">
    <h1>${data.config.brandName}</h1>
    <div class="subtitle">Social Media Monthly Report</div>
    <div class="subtitle">${data.config.monthYear}</div>
    <p style="margin-top: 50px; color: ${secondary};">By 5 Miles Lab</p>
    <p style="color: ${secondary};">Report date: ${data.config.reportDate}</p>
  </div>

  <!-- Executive Summary -->
  <div class="page">
    <h1>Executive Summary</h1>

    <div class="kpi-grid">
      ${data.executiveSummary.kpis.map(kpi => `
        <div class="kpi-tile">
          <div class="label">${kpi.label}</div>
          <div class="value">${kpi.value}</div>
          ${kpi.change !== undefined ? `
            <div class="change ${kpi.change >= 0 ? 'positive' : 'negative'}">
              ${kpi.change >= 0 ? '+' : ''}${kpi.change.toFixed(1)}% vs last month
            </div>
          ` : ''}
        </div>
      `).join('')}
    </div>

    <div class="section">
      <h2>Key Highlights</h2>
      <ul>
        ${data.executiveSummary.keyHighlights.map(h => `<li>${h}</li>`).join('')}
      </ul>
    </div>

    <div class="section">
      <h2>Next Month Focus</h2>
      <ul>
        ${data.executiveSummary.nextMonthFocus.map(f => `<li>${f}</li>`).join('')}
      </ul>
    </div>
  </div>

  ${data.facebook ? `
  <!-- Facebook Overview -->
  <div class="page">
    <h1>Performance Summary of Facebook</h1>

    <div class="kpi-grid" style="grid-template-columns: repeat(3, 1fr);">
      ${data.facebook.kpis.slice(0, 3).map(kpi => `
        <div class="kpi-tile">
          <div class="label">${kpi.label}</div>
          <div class="value">${kpi.value}</div>
          ${kpi.change !== undefined ? `
            <div class="change ${kpi.change >= 0 ? 'positive' : 'negative'}">
              ${kpi.change >= 0 ? '+' : ''}${kpi.change.toFixed(1)}%
            </div>
          ` : ''}
        </div>
      `).join('')}
    </div>

    <div class="section">
      <h2>Performance Table</h2>
      <table>
        <tr>
          <th>Metric</th>
          <th>Last Month</th>
          <th>This Month</th>
          <th>Change</th>
        </tr>
        ${data.facebook.performanceTable.map(row => `
          <tr>
            <td>${row.metric}</td>
            <td>${row.lastMonth}</td>
            <td>${row.thisMonth}</td>
            <td class="${row.change >= 0 ? 'positive' : 'negative'}">${row.change >= 0 ? '+' : ''}${row.change.toFixed(1)}%</td>
          </tr>
        `).join('')}
      </table>
    </div>
  </div>
  ` : ''}

  ${data.socialAds ? `
  <!-- Social Ads -->
  <div class="page">
    <h1>Paid Social Overview</h1>

    <div class="highlight-box">
      <h3>Key Takeaways</h3>
      <ul>
        ${data.socialAds.summary.map(s => `<li>${s}</li>`).join('')}
      </ul>
    </div>

    ${data.socialAds.campaigns ? `
    <div class="section">
      <h2>Campaign Performance</h2>
      <table>
        <tr>
          <th>Campaign</th>
          <th>Objective</th>
          <th>Spent</th>
          <th>Impressions</th>
          <th>CTR</th>
          <th>CPC</th>
          <th>Tag</th>
        </tr>
        ${data.socialAds.campaigns.map(c => `
          <tr style="background: ${c.tag === 'strong' ? '#e6ffed' : c.tag === 'underperform' ? '#ffe6e6' : 'inherit'}">
            <td>${c.campaign}</td>
            <td>${c.objective}</td>
            <td>$${c.spent.toLocaleString()}</td>
            <td>${c.impressions.toLocaleString()}</td>
            <td>${c.ctr.toFixed(2)}%</td>
            <td>$${c.cpc.toFixed(2)}</td>
            <td>${c.tag === 'strong' ? '✅' : c.tag === 'monitor' ? '⚠️' : '❌'}</td>
          </tr>
        `).join('')}
      </table>
    </div>
    ` : ''}
  </div>
  ` : ''}

  <!-- Next Month -->
  <div class="page">
    <h1>Next Month Plan</h1>

    <div class="section">
      <h2>Strategic Priorities</h2>
      <ol>
        ${data.nextMonth.strategicPriorities.map(p => `<li>${p}</li>`).join('')}
      </ol>
    </div>

    <div class="section">
      <h2>Experiment Roadmap</h2>
      <table>
        <tr>
          <th>Test</th>
          <th>Status</th>
        </tr>
        ${data.nextMonth.experimentRoadmap.map(e => `
          <tr>
            <td>${e.test}</td>
            <td>${e.status === 'completed' ? '✅' : e.status === 'in_progress' ? '🔄' : '⬜'} ${e.status.replace('_', ' ')}</td>
          </tr>
        `).join('')}
      </table>
    </div>

    <div class="highlight-box" style="text-align: center; margin-top: 50px; background: ${primary}; color: white;">
      <h2 style="color: white;">Thank You</h2>
      <p>${data.config.brandName} × 5 Miles Lab</p>
    </div>
  </div>
</body>
</html>`;
  }
}

// ===========================================
// Factory Function
// ===========================================

let generatorInstance: MonthlyReportGenerator | null = null;

export function getReportGenerator(design?: Partial<DesignSystem>): MonthlyReportGenerator {
  if (!generatorInstance || design) {
    generatorInstance = new MonthlyReportGenerator(design);
  }
  return generatorInstance;
}

// ===========================================
// Convenience Functions
// ===========================================

/**
 * Quick generate function for common use cases
 */
export async function generateMonthlyReport(
  data: MonthlyReportData,
  options: ExportOptions = { format: 'both' }
): Promise<ExportResult> {
  const generator = getReportGenerator();
  return generator.generate(data, options);
}

/**
 * Generate sample report with placeholder data
 */
export function getSampleReportData(): MonthlyReportData {
  return {
    config: {
      clientName: 'Sample Client',
      brandName: 'Sample Brand',
      monthYear: 'January 2025',
      reportDate: '2025-02-05',
    },
    executiveSummary: {
      kpis: [
        { label: 'Total Reach', value: '1.2M', change: 15.3 },
        { label: 'Engagement Rate', value: '4.5%', change: -2.1 },
        { label: 'Link Clicks', value: '45.2K', change: 22.8 },
        { label: 'New Fans', value: '3,421', change: 8.5 },
      ],
      keyHighlights: [
        'Video content drove 3x more engagement than static posts',
        'Holiday campaign exceeded reach targets by 25%',
        'Instagram Reels showing strong organic growth',
      ],
      nextMonthFocus: [
        'Launch CNY campaign with interactive elements',
        'A/B test carousel vs video ad formats',
        'Expand audience targeting to new demographics',
      ],
    },
    facebook: {
      kpis: [
        { label: 'Impressions', value: '2.5M', change: 12.5 },
        { label: 'Reach', value: '1.1M', change: 18.2 },
        { label: 'Engagement Rate', value: '3.8%', change: -5.0 },
      ],
      followersHistory: [
        { month: 'Aug', followers: 45000 },
        { month: 'Sep', followers: 46200 },
        { month: 'Oct', followers: 47800 },
        { month: 'Nov', followers: 49500 },
        { month: 'Dec', followers: 52100 },
        { month: 'Jan', followers: 55521 },
      ],
      performanceTable: [
        { metric: 'No. of Posts', lastMonth: 28, thisMonth: 32, change: 14.3 },
        { metric: 'Fans', lastMonth: 52100, thisMonth: 55521, change: 6.6 },
        { metric: 'New Fans', lastMonth: 2600, thisMonth: 3421, change: 31.6 },
        { metric: 'Impressions', lastMonth: 2200000, thisMonth: 2500000, change: 13.6 },
        { metric: 'Reach', lastMonth: 950000, thisMonth: 1100000, change: 15.8 },
        { metric: 'Engagement', lastMonth: 85000, thisMonth: 95000, change: 11.8 },
        { metric: 'ER', lastMonth: 3.9, thisMonth: 3.8, change: -2.6 },
        { metric: 'Clicks', lastMonth: 38000, thisMonth: 45200, change: 18.9 },
      ],
    },
    contentPerformance: {
      topPosts: [
        { date: '2025-01-15', format: 'Video', caption: 'New Year celebration highlights featuring...', impressions: 150000, engagementRate: 8.5, linkClicks: 5200 },
        { date: '2025-01-08', format: 'Carousel', caption: 'Product showcase: Winter collection launch...', impressions: 125000, engagementRate: 6.2, linkClicks: 4800 },
        { date: '2025-01-22', format: 'Reel', caption: 'Behind the scenes at our workshop...', impressions: 118000, engagementRate: 7.1, linkClicks: 3200 },
        { date: '2025-01-12', format: 'Image', caption: 'Customer spotlight: Thank you for...', impressions: 95000, engagementRate: 5.8, linkClicks: 2800 },
        { date: '2025-01-28', format: 'Video', caption: 'Upcoming CNY preview special...', impressions: 88000, engagementRate: 5.5, linkClicks: 3500 },
      ],
      bottomPosts: [
        { date: '2025-01-03', format: 'Image', caption: 'Store hours reminder for the week...', impressions: 15000, engagementRate: 0.8, linkClicks: 120 },
        { date: '2025-01-07', format: 'Link', caption: 'Read our latest blog post about...', impressions: 18000, engagementRate: 1.1, linkClicks: 280 },
        { date: '2025-01-17', format: 'Image', caption: 'Throwback Thursday to our...', impressions: 22000, engagementRate: 1.3, linkClicks: 150 },
        { date: '2025-01-24', format: 'Text', caption: 'Quick update on shipping times...', impressions: 25000, engagementRate: 1.5, linkClicks: 320 },
        { date: '2025-01-30', format: 'Image', caption: 'Office closure notice for...', impressions: 28000, engagementRate: 1.2, linkClicks: 180 },
      ],
      insights: [
        'Video content consistently outperforms static images',
        'Posts with product showcases drive higher clicks',
        'Informational posts see lower engagement',
      ],
      actions: [
        'Increase video content to 40% of posts',
        'Add CTA to all informational posts',
        'Test UGC content for higher authenticity',
      ],
    },
    contentThemes: {
      themes: [
        { theme: 'Product Showcase', numPosts: 8, avgEngagementRate: 5.2, avgClicks: 3200, note: 'Top performer' },
        { theme: 'Behind the Scenes', numPosts: 5, avgEngagementRate: 6.8, avgClicks: 1800, note: 'High ER' },
        { theme: 'Customer Stories', numPosts: 4, avgEngagementRate: 4.5, avgClicks: 2100 },
        { theme: 'Educational', numPosts: 6, avgEngagementRate: 3.2, avgClicks: 2800, note: 'Good clicks' },
        { theme: 'Promotional', numPosts: 9, avgEngagementRate: 2.8, avgClicks: 4500, note: 'Highest clicks' },
      ],
    },
    socialAds: {
      spendByPlatform: [
        { platform: 'Facebook', spend: 15000 },
        { platform: 'Instagram', spend: 12000 },
      ],
      clicksByPlatform: [
        { platform: 'Facebook', clicks: 28500 },
        { platform: 'Instagram', clicks: 22000 },
      ],
      cpcByPlatform: [
        { platform: 'Facebook', cpc: 0.53 },
        { platform: 'Instagram', cpc: 0.55 },
      ],
      summary: [
        'Overall ROAS improved 15% compared to last month',
        'Instagram CPC remains competitive with Facebook',
        'Video ads showing 2x better CTR than image ads',
      ],
      campaigns: [
        { campaign: 'CNY Awareness', objective: 'Reach', period: 'Jan 1-15', budget: 5000, spent: 4850, impressions: 850000, ctr: 2.8, cpc: 0.45, cpm: 5.71, tag: 'strong' },
        { campaign: 'Winter Sale', objective: 'Conversions', period: 'Jan 1-31', budget: 8000, spent: 7200, impressions: 620000, ctr: 1.9, cpc: 0.62, cpm: 11.61, conversions: 245, roas: 3.2, tag: 'strong' },
        { campaign: 'Brand Awareness', objective: 'Reach', period: 'Ongoing', budget: 3000, spent: 2950, impressions: 520000, ctr: 1.2, cpc: 0.85, cpm: 5.67, tag: 'monitor' },
        { campaign: 'Product Launch', objective: 'Traffic', period: 'Jan 15-31', budget: 4000, spent: 3800, impressions: 280000, ctr: 0.8, cpc: 1.35, cpm: 13.57, tag: 'underperform' },
      ],
    },
    audience: {
      ageDistribution: [
        { age: '18-24', percentage: 15 },
        { age: '25-34', percentage: 35 },
        { age: '35-44', percentage: 28 },
        { age: '45-54', percentage: 15 },
        { age: '55+', percentage: 7 },
      ],
      genderSplit: { male: 35, female: 65 },
      topLocations: [
        { location: 'Hong Kong', percentage: 72 },
        { location: 'Kowloon', percentage: 18 },
        { location: 'New Territories', percentage: 8 },
        { location: 'Others', percentage: 2 },
      ],
      deviceBreakdown: { mobile: 78, desktop: 22 },
      insights: [
        '25-44 age group represents 63% of audience',
        'Female audience shows higher engagement rates',
      ],
      recommendations: [
        'Consider mobile-first creative formats',
        'Test content targeted at 45+ demographic',
      ],
    },
    nextMonth: {
      strategicPriorities: [
        'Launch CNY campaign with 20% higher budget allocation',
        'Implement new audience segmentation strategy',
        'Increase video content production to meet demand',
      ],
      experimentRoadmap: [
        { test: 'A/B test: Carousel vs Video ads', status: 'planned' },
        { test: 'New audience: Parents 35-50', status: 'planned' },
        { test: 'Stories vs Reels placement test', status: 'in_progress' },
        { test: 'UGC content integration', status: 'planned' },
      ],
    },
  };
}

export default MonthlyReportGenerator;
