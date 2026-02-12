/**
 * Monthly Report Module
 * Exports all report generation functionality
 */

// Types
export * from './types';

// Slide Templates
export * from './slide-templates';

// Report Generator
export {
  MonthlyReportGenerator,
  getReportGenerator,
  generateMonthlyReport,
  getSampleReportData,
} from './report-generator';
