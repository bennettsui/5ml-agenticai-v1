/**
 * Bridge file: delegates to TypeScript-compiled output in dist/
 * routes.js imports '../reports/report-generator.js' — this file satisfies that path.
 */
const path = require('path');

const distPath = path.resolve(
  __dirname, '..', '..', '..', '..', 'dist',
  'use-cases', '5ml-ads-performance-internal', 'reports', 'report-generator'
);

let compiled;
try {
  compiled = require(distPath);
} catch (err) {
  console.error('[report-generator] Could not load compiled TS from', distPath, err.message);
  // Provide stub so the server doesn't crash
  compiled = {
    generateMonthlyReport: async () => ({ success: false, error: 'Report generator not compiled — run npx tsc' }),
    getSampleReportData: () => ({ config: {}, executiveSummary: {}, nextMonth: {} }),
    MonthlyReportGenerator: class { async generate() { return { success: false, error: 'Not compiled' }; } },
    getReportGenerator: () => new compiled.MonthlyReportGenerator(),
  };
}

module.exports = compiled;
