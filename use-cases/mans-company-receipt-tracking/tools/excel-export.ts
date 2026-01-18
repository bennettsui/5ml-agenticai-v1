/**
 * Excel Export Tool for Receipt to P&L Automation
 *
 * Phase 1: Generates 2-sheet Excel workbook
 * - Sheet 1: Receipt Details (itemized)
 * - Sheet 2: P&L Summary (by category)
 *
 * Phase 2 will add:
 * - Sheet 3: YoY Comparison
 */

import ExcelJS from 'exceljs';
import path from 'path';
import type { ExtractedData } from '@/infrastructure/agents/receipt-ocr-agent/tools';
import type { CategorizationResult } from '../agents/categorizer-agent';

interface ReceiptRecord {
  extractedData: ExtractedData;
  categorization: CategorizationResult;
  imagePath: string;
}

interface PLSummaryRow {
  accountCode: string;
  category: string;
  totalAmount: number;
  deductibleAmount: number;
  nonDeductibleAmount: number;
  receiptCount: number;
  percentOfTotal: number;
}

export class ExcelExporter {
  private workbook: ExcelJS.Workbook;

  constructor() {
    this.workbook = new ExcelJS.Workbook();
    this.workbook.creator = '5ML Platform - Receipt OCR Agent';
    this.workbook.created = new Date();
  }

  /**
   * Generate complete Excel workbook from receipt records
   *
   * @param records - Array of processed receipts
   * @param outputPath - Path to save Excel file
   * @param options - Export options
   */
  async generateWorkbook(
    records: ReceiptRecord[],
    outputPath: string,
    options: {
      clientName?: string;
      periodStart?: string;
      periodEnd?: string;
      includeImages?: boolean;
    } = {}
  ): Promise<string> {
    // Clear existing workbook
    this.workbook = new ExcelJS.Workbook();

    // Sheet 1: Receipt Details
    await this.createReceiptDetailsSheet(records, options);

    // Sheet 2: P&L Summary
    await this.createPLSummarySheet(records, options);

    // Save workbook
    await this.workbook.xlsx.writeFile(outputPath);
    console.log(`Excel workbook saved: ${outputPath}`);

    return outputPath;
  }

  /**
   * Sheet 1: Detailed receipt list with categorization
   */
  private async createReceiptDetailsSheet(
    records: ReceiptRecord[],
    options: any
  ): Promise<void> {
    const sheet = this.workbook.addWorksheet('Receipt Details', {
      views: [{ state: 'frozen', xSplit: 0, ySplit: 1 }], // Freeze header row
    });

    // Set column widths
    sheet.columns = [
      { key: 'date', width: 12 },
      { key: 'vendor', width: 30 },
      { key: 'description', width: 40 },
      { key: 'amount', width: 12 },
      { key: 'currency', width: 10 },
      { key: 'category', width: 25 },
      { key: 'account_code', width: 12 },
      { key: 'deductible_amount', width: 15 },
      { key: 'non_deductible', width: 15 },
      { key: 'deductible', width: 10 },
      { key: 'confidence', width: 12 },
      { key: 'warnings', width: 50 },
      { key: 'review', width: 10 },
    ];

    // Header row
    const headerRow = sheet.addRow({
      date: 'Date',
      vendor: 'Vendor',
      description: 'Description',
      amount: 'Total Amount',
      currency: 'Currency',
      category: 'Category',
      account_code: 'Account Code',
      deductible_amount: 'Deductible',
      non_deductible: 'Non-Deductible',
      deductible: 'Tax Status',
      confidence: 'Confidence',
      warnings: 'Compliance Warnings',
      review: 'Review?',
    });

    // Style header
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' },
    };
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' };

    // Add data rows
    records.forEach(record => {
      const row = sheet.addRow({
        date: record.extractedData.date,
        vendor: record.extractedData.vendor,
        description: record.extractedData.description,
        amount: record.extractedData.amount,
        currency: record.extractedData.currency,
        category: record.categorization.category_name,
        account_code: record.categorization.category_id,
        deductible_amount: record.categorization.deductible_amount,
        non_deductible: record.categorization.non_deductible_amount,
        deductible: record.categorization.deductible ? 'Yes' : 'No',
        confidence: `${(record.categorization.confidence * 100).toFixed(0)}%`,
        warnings: record.categorization.compliance_warnings.join('; '),
        review: record.categorization.requires_review ? 'YES' : 'No',
      });

      // Format numbers
      row.getCell('amount').numFmt = '#,##0.00';
      row.getCell('deductible_amount').numFmt = '#,##0.00';
      row.getCell('non_deductible').numFmt = '#,##0.00';

      // Conditional formatting - highlight review required
      if (record.categorization.requires_review) {
        row.getCell('review').fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFC7CE' },
        };
        row.getCell('review').font = { color: { argb: 'FF9C0006' }, bold: true };
      }

      // Highlight low confidence
      if (record.categorization.confidence < 0.7) {
        row.getCell('confidence').fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFEB9C' },
        };
      }
    });

    // Add totals row
    const totalRow = sheet.addRow({
      date: '',
      vendor: '',
      description: 'TOTAL',
      amount: { formula: `SUM(D2:D${records.length + 1})` },
      currency: '',
      category: '',
      account_code: '',
      deductible_amount: { formula: `SUM(H2:H${records.length + 1})` },
      non_deductible: { formula: `SUM(I2:I${records.length + 1})` },
      deductible: '',
      confidence: '',
      warnings: '',
      review: '',
    });

    totalRow.font = { bold: true };
    totalRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE7E6E6' },
    };
    totalRow.getCell('amount').numFmt = '#,##0.00';
    totalRow.getCell('deductible_amount').numFmt = '#,##0.00';
    totalRow.getCell('non_deductible').numFmt = '#,##0.00';

    // Add filters to header row
    sheet.autoFilter = {
      from: 'A1',
      to: `M1`,
    };

    // Add title (above header)
    sheet.spliceRows(1, 0, [
      [
        `Receipt Details - ${options.clientName || 'Man\'s Accounting Firm'}`,
      ],
    ]);
    sheet.spliceRows(2, 0, [
      [
        `Period: ${options.periodStart || 'N/A'} to ${options.periodEnd || 'N/A'}`,
      ],
    ]);
    sheet.spliceRows(3, 0, [['']]); // Empty row

    // Style title
    const titleCell = sheet.getCell('A1');
    titleCell.font = { bold: true, size: 14 };
    sheet.getCell('A2').font = { italic: true, size: 10 };
  }

  /**
   * Sheet 2: P&L Summary by category
   */
  private async createPLSummarySheet(
    records: ReceiptRecord[],
    options: any
  ): Promise<void> {
    const sheet = this.workbook.addWorksheet('P&L Summary', {
      views: [{ state: 'frozen', xSplit: 0, ySplit: 1 }],
    });

    // Calculate summary data
    const summaryData = this.calculatePLSummary(records);

    // Set column widths
    sheet.columns = [
      { key: 'account_code', width: 12 },
      { key: 'category', width: 30 },
      { key: 'count', width: 12 },
      { key: 'total_amount', width: 15 },
      { key: 'deductible', width: 15 },
      { key: 'non_deductible', width: 15 },
      { key: 'percent', width: 12 },
    ];

    // Header row
    const headerRow = sheet.addRow({
      account_code: 'Account Code',
      category: 'Category',
      count: 'Receipt Count',
      total_amount: 'Total Amount',
      deductible: 'Deductible',
      non_deductible: 'Non-Deductible',
      percent: '% of Total',
    });

    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF70AD47' },
    };
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' };

    // Add summary rows
    summaryData.forEach(row => {
      const dataRow = sheet.addRow({
        account_code: row.accountCode,
        category: row.category,
        count: row.receiptCount,
        total_amount: row.totalAmount,
        deductible: row.deductibleAmount,
        non_deductible: row.nonDeductibleAmount,
        percent: row.percentOfTotal / 100, // Excel will format as percentage
      });

      dataRow.getCell('total_amount').numFmt = '#,##0.00';
      dataRow.getCell('deductible').numFmt = '#,##0.00';
      dataRow.getCell('non_deductible').numFmt = '#,##0.00';
      dataRow.getCell('percent').numFmt = '0.0%';
    });

    // Add totals row
    const totalRow = sheet.addRow({
      account_code: '',
      category: 'TOTAL',
      count: summaryData.reduce((sum, r) => sum + r.receiptCount, 0),
      total_amount: { formula: `SUM(D2:D${summaryData.length + 1})` },
      deductible: { formula: `SUM(E2:E${summaryData.length + 1})` },
      non_deductible: { formula: `SUM(F2:F${summaryData.length + 1})` },
      percent: 1.0, // 100%
    });

    totalRow.font = { bold: true };
    totalRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE7E6E6' },
    };
    totalRow.getCell('total_amount').numFmt = '#,##0.00';
    totalRow.getCell('deductible').numFmt = '#,##0.00';
    totalRow.getCell('non_deductible').numFmt = '#,##0.00';
    totalRow.getCell('percent').numFmt = '0.0%';

    // Add title
    sheet.spliceRows(1, 0, [
      [`P&L Summary - ${options.clientName || 'Man\'s Accounting Firm'}`],
    ]);
    sheet.spliceRows(2, 0, [
      [`Period: ${options.periodStart || 'N/A'} to ${options.periodEnd || 'N/A'}`],
    ]);
    sheet.spliceRows(3, 0, [['']]); // Empty row

    const titleCell = sheet.getCell('A1');
    titleCell.font = { bold: true, size: 14 };
    sheet.getCell('A2').font = { italic: true, size: 10 };
  }

  /**
   * Calculate P&L summary from receipt records
   */
  private calculatePLSummary(records: ReceiptRecord[]): PLSummaryRow[] {
    const categoryMap = new Map<string, PLSummaryRow>();

    // Aggregate by category
    records.forEach(record => {
      const key = `${record.categorization.category_id}-${record.categorization.category_name}`;

      if (!categoryMap.has(key)) {
        categoryMap.set(key, {
          accountCode: record.categorization.category_id,
          category: record.categorization.category_name,
          totalAmount: 0,
          deductibleAmount: 0,
          nonDeductibleAmount: 0,
          receiptCount: 0,
          percentOfTotal: 0,
        });
      }

      const row = categoryMap.get(key)!;
      row.totalAmount +=
        record.categorization.deductible_amount +
        record.categorization.non_deductible_amount;
      row.deductibleAmount += record.categorization.deductible_amount;
      row.nonDeductibleAmount += record.categorization.non_deductible_amount;
      row.receiptCount++;
    });

    // Convert to array and calculate percentages
    const summary = Array.from(categoryMap.values());
    const grandTotal = summary.reduce((sum, row) => sum + row.totalAmount, 0);

    summary.forEach(row => {
      row.percentOfTotal = grandTotal > 0 ? (row.totalAmount / grandTotal) * 100 : 0;
    });

    // Sort by account code
    summary.sort((a, b) => a.accountCode.localeCompare(b.accountCode));

    return summary;
  }

  /**
   * Generate quick summary report (text format)
   */
  generateTextSummary(records: ReceiptRecord[]): string {
    const summary = this.calculatePLSummary(records);
    const totalAmount = summary.reduce((sum, r) => sum + r.totalAmount, 0);
    const totalDeductible = summary.reduce((sum, r) => sum + r.deductibleAmount, 0);
    const totalNonDeductible = summary.reduce(
      (sum, r) => sum + r.nonDeductibleAmount,
      0
    );
    const reviewCount = records.filter(r => r.categorization.requires_review).length;

    const lines = [
      '='.repeat(60),
      'RECEIPT PROCESSING SUMMARY',
      '='.repeat(60),
      '',
      `Total Receipts: ${records.length}`,
      `Requires Review: ${reviewCount}`,
      '',
      `Total Amount: HKD ${totalAmount.toFixed(2)}`,
      `  - Deductible: HKD ${totalDeductible.toFixed(2)}`,
      `  - Non-Deductible: HKD ${totalNonDeductible.toFixed(2)}`,
      '',
      'CATEGORY BREAKDOWN:',
      '-'.repeat(60),
    ];

    summary.forEach(row => {
      lines.push(
        `${row.accountCode} - ${row.category}:`.padEnd(40) +
        `HKD ${row.totalAmount.toFixed(2).padStart(12)} (${row.receiptCount} receipts)`
      );
    });

    lines.push('='.repeat(60));

    return lines.join('\n');
  }
}

// Export singleton instance
export const excelExporter = new ExcelExporter();

// Export class for testing and custom instances
export default ExcelExporter;
