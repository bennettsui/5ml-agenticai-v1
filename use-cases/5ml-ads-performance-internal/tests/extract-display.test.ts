/**
 * Unit tests for extracting numbers from accounts and displaying them
 * without database insertion
 */

import { describe, it, expect } from 'vitest';

// ==================================================
// Extraction Helper Functions (mirroring routes.js)
// ==================================================

function normalizeAccountId(accountId: string): string {
  return accountId.startsWith('act_') ? accountId : `act_${accountId}`;
}

function extractConversions(actions?: Array<{ action_type: string; value: string }>): number | null {
  if (!actions) return null;
  const purchaseAction = actions.find(
    (a) => a.action_type === 'purchase' || a.action_type === 'offsite_conversion.fb_pixel_purchase'
  );
  return purchaseAction ? parseFloat(purchaseAction.value) : null;
}

function extractRevenue(actionValues?: Array<{ action_type: string; value: string }>): number | null {
  if (!actionValues) return null;
  const purchaseValue = actionValues.find(
    (a) => a.action_type === 'purchase' || a.action_type === 'offsite_conversion.fb_pixel_purchase'
  );
  return purchaseValue ? parseFloat(purchaseValue.value) : null;
}

function extractRoas(roas?: Array<{ action_type: string; value: string }>): number | null {
  if (!roas || roas.length === 0) return null;
  const pr = roas.find((r) => r.action_type === 'offsite_conversion.fb_pixel_purchase');
  return pr ? parseFloat(pr.value) : (roas[0] ? parseFloat(roas[0].value) : null);
}

function normalizeGoogleCustomerId(customerId: string): string {
  return customerId.replace(/-/g, '');
}

function normalizeGoogleCostMicros(costMicros: number): number {
  return costMicros / 1_000_000;
}

// ==================================================
// Display Formatters (no DB, just output formatting)
// ==================================================

interface ExtractedAccountData {
  accountId: string;
  normalizedAccountId: string;
  metrics: {
    impressions: number;
    clicks: number;
    spend: number;
    conversions: number | null;
    revenue: number | null;
    roas: number | null;
  };
}

function extractAndFormatMetaAccount(
  rawAccountId: string,
  rawMetrics: {
    impressions: string;
    clicks: string;
    spend: string;
    actions?: Array<{ action_type: string; value: string }>;
    action_values?: Array<{ action_type: string; value: string }>;
    website_purchase_roas?: Array<{ action_type: string; value: string }>;
  }
): ExtractedAccountData {
  return {
    accountId: rawAccountId,
    normalizedAccountId: normalizeAccountId(rawAccountId),
    metrics: {
      impressions: parseInt(rawMetrics.impressions, 10) || 0,
      clicks: parseInt(rawMetrics.clicks, 10) || 0,
      spend: parseFloat(rawMetrics.spend) || 0,
      conversions: extractConversions(rawMetrics.actions),
      revenue: extractRevenue(rawMetrics.action_values),
      roas: extractRoas(rawMetrics.website_purchase_roas),
    },
  };
}

function extractAndFormatGoogleAccount(
  rawCustomerId: string,
  rawMetrics: {
    impressions: string;
    clicks: string;
    cost_micros: string;
    conversions?: string;
    conversions_value?: string;
  }
): ExtractedAccountData {
  const spend = normalizeGoogleCostMicros(parseInt(rawMetrics.cost_micros, 10) || 0);
  const conversions = rawMetrics.conversions ? parseFloat(rawMetrics.conversions) : null;
  const revenue = rawMetrics.conversions_value ? parseFloat(rawMetrics.conversions_value) : null;
  const roas = spend > 0 && revenue !== null ? revenue / spend : null;

  return {
    accountId: rawCustomerId,
    normalizedAccountId: normalizeGoogleCustomerId(rawCustomerId),
    metrics: {
      impressions: parseInt(rawMetrics.impressions, 10) || 0,
      clicks: parseInt(rawMetrics.clicks, 10) || 0,
      spend,
      conversions,
      revenue,
      roas,
    },
  };
}

function displayExtractedData(data: ExtractedAccountData): string {
  const lines = [
    `Account ID: ${data.accountId}`,
    `Normalized ID: ${data.normalizedAccountId}`,
    `Impressions: ${data.metrics.impressions.toLocaleString()}`,
    `Clicks: ${data.metrics.clicks.toLocaleString()}`,
    `Spend: $${data.metrics.spend.toFixed(2)}`,
    `Conversions: ${data.metrics.conversions ?? 'N/A'}`,
    `Revenue: ${data.metrics.revenue !== null ? '$' + data.metrics.revenue.toFixed(2) : 'N/A'}`,
    `ROAS: ${data.metrics.roas !== null ? data.metrics.roas.toFixed(2) + 'x' : 'N/A'}`,
  ];
  return lines.join('\n');
}

// ==================================================
// Tests
// ==================================================

describe('Account ID Extraction', () => {
  describe('Meta Account ID Normalization', () => {
    it('should add act_ prefix when missing', () => {
      expect(normalizeAccountId('123456789')).toBe('act_123456789');
    });

    it('should keep act_ prefix when already present', () => {
      expect(normalizeAccountId('act_123456789')).toBe('act_123456789');
    });

    it('should handle numeric-only account IDs', () => {
      expect(normalizeAccountId('9876543210')).toBe('act_9876543210');
    });
  });

  describe('Google Customer ID Normalization', () => {
    it('should remove dashes from customer ID', () => {
      expect(normalizeGoogleCustomerId('123-456-7890')).toBe('1234567890');
    });

    it('should handle customer ID without dashes', () => {
      expect(normalizeGoogleCustomerId('1234567890')).toBe('1234567890');
    });

    it('should handle multiple dashes', () => {
      expect(normalizeGoogleCustomerId('1-2-3-4-5-6-7-8-9-0')).toBe('1234567890');
    });
  });
});

describe('Numeric Extraction', () => {
  describe('Conversions Extraction', () => {
    it('should extract purchase conversions', () => {
      const actions = [
        { action_type: 'link_click', value: '100' },
        { action_type: 'purchase', value: '25' },
      ];
      expect(extractConversions(actions)).toBe(25);
    });

    it('should extract fb_pixel_purchase conversions', () => {
      const actions = [
        { action_type: 'offsite_conversion.fb_pixel_purchase', value: '12.5' },
      ];
      expect(extractConversions(actions)).toBe(12.5);
    });

    it('should return null for empty actions', () => {
      expect(extractConversions([])).toBeNull();
    });

    it('should return null for undefined actions', () => {
      expect(extractConversions(undefined)).toBeNull();
    });

    it('should return null when no purchase action exists', () => {
      const actions = [
        { action_type: 'link_click', value: '50' },
        { action_type: 'page_view', value: '200' },
      ];
      expect(extractConversions(actions)).toBeNull();
    });
  });

  describe('Revenue Extraction', () => {
    it('should extract purchase revenue', () => {
      const actionValues = [
        { action_type: 'purchase', value: '1500.75' },
      ];
      expect(extractRevenue(actionValues)).toBe(1500.75);
    });

    it('should extract fb_pixel_purchase revenue', () => {
      const actionValues = [
        { action_type: 'offsite_conversion.fb_pixel_purchase', value: '999.99' },
      ];
      expect(extractRevenue(actionValues)).toBe(999.99);
    });

    it('should handle decimal precision', () => {
      const actionValues = [
        { action_type: 'purchase', value: '123.456789' },
      ];
      expect(extractRevenue(actionValues)).toBeCloseTo(123.456789);
    });
  });

  describe('ROAS Extraction', () => {
    it('should extract fb_pixel_purchase ROAS', () => {
      const roas = [
        { action_type: 'offsite_conversion.fb_pixel_purchase', value: '3.45' },
      ];
      expect(extractRoas(roas)).toBe(3.45);
    });

    it('should fallback to first ROAS value when no fb_pixel_purchase', () => {
      const roas = [
        { action_type: 'other_conversion', value: '2.5' },
      ];
      expect(extractRoas(roas)).toBe(2.5);
    });

    it('should return null for empty ROAS array', () => {
      expect(extractRoas([])).toBeNull();
    });

    it('should return null for undefined ROAS', () => {
      expect(extractRoas(undefined)).toBeNull();
    });
  });

  describe('Google Cost Micros Conversion', () => {
    it('should convert micros to standard currency', () => {
      expect(normalizeGoogleCostMicros(5_000_000)).toBe(5);
    });

    it('should handle fractional amounts', () => {
      expect(normalizeGoogleCostMicros(1_234_567)).toBeCloseTo(1.234567);
    });

    it('should handle zero', () => {
      expect(normalizeGoogleCostMicros(0)).toBe(0);
    });

    it('should handle large amounts', () => {
      expect(normalizeGoogleCostMicros(1_000_000_000_000)).toBe(1_000_000);
    });
  });
});

describe('Extract and Display (No DB)', () => {
  describe('Meta Account Extraction', () => {
    it('should extract and format Meta account data', () => {
      const extracted = extractAndFormatMetaAccount('123456789', {
        impressions: '10000',
        clicks: '500',
        spend: '250.50',
        actions: [{ action_type: 'purchase', value: '20' }],
        action_values: [{ action_type: 'purchase', value: '800.00' }],
        website_purchase_roas: [{ action_type: 'offsite_conversion.fb_pixel_purchase', value: '3.19' }],
      });

      expect(extracted.accountId).toBe('123456789');
      expect(extracted.normalizedAccountId).toBe('act_123456789');
      expect(extracted.metrics.impressions).toBe(10000);
      expect(extracted.metrics.clicks).toBe(500);
      expect(extracted.metrics.spend).toBe(250.50);
      expect(extracted.metrics.conversions).toBe(20);
      expect(extracted.metrics.revenue).toBe(800);
      expect(extracted.metrics.roas).toBe(3.19);
    });

    it('should handle missing optional metrics', () => {
      const extracted = extractAndFormatMetaAccount('act_999', {
        impressions: '5000',
        clicks: '100',
        spend: '50.00',
      });

      expect(extracted.normalizedAccountId).toBe('act_999');
      expect(extracted.metrics.impressions).toBe(5000);
      expect(extracted.metrics.conversions).toBeNull();
      expect(extracted.metrics.revenue).toBeNull();
      expect(extracted.metrics.roas).toBeNull();
    });
  });

  describe('Google Account Extraction', () => {
    it('should extract and format Google account data', () => {
      const extracted = extractAndFormatGoogleAccount('123-456-7890', {
        impressions: '20000',
        clicks: '1000',
        cost_micros: '500000000',
        conversions: '50',
        conversions_value: '2000.00',
      });

      expect(extracted.accountId).toBe('123-456-7890');
      expect(extracted.normalizedAccountId).toBe('1234567890');
      expect(extracted.metrics.impressions).toBe(20000);
      expect(extracted.metrics.clicks).toBe(1000);
      expect(extracted.metrics.spend).toBe(500);
      expect(extracted.metrics.conversions).toBe(50);
      expect(extracted.metrics.revenue).toBe(2000);
      expect(extracted.metrics.roas).toBe(4); // 2000 / 500
    });

    it('should calculate ROAS from spend and revenue', () => {
      const extracted = extractAndFormatGoogleAccount('111-222-3333', {
        impressions: '1000',
        clicks: '50',
        cost_micros: '100000000', // $100
        conversions: '10',
        conversions_value: '350.00',
      });

      expect(extracted.metrics.spend).toBe(100);
      expect(extracted.metrics.revenue).toBe(350);
      expect(extracted.metrics.roas).toBe(3.5); // 350 / 100
    });

    it('should return null ROAS when spend is zero', () => {
      const extracted = extractAndFormatGoogleAccount('000-000-0000', {
        impressions: '100',
        clicks: '5',
        cost_micros: '0',
        conversions: '1',
        conversions_value: '50.00',
      });

      expect(extracted.metrics.spend).toBe(0);
      expect(extracted.metrics.roas).toBeNull();
    });
  });

  describe('Display Formatting', () => {
    it('should format extracted data for display', () => {
      const data: ExtractedAccountData = {
        accountId: '123456789',
        normalizedAccountId: 'act_123456789',
        metrics: {
          impressions: 10000,
          clicks: 500,
          spend: 250.50,
          conversions: 20,
          revenue: 800.00,
          roas: 3.19,
        },
      };

      const display = displayExtractedData(data);

      expect(display).toContain('Account ID: 123456789');
      expect(display).toContain('Normalized ID: act_123456789');
      expect(display).toContain('Impressions: 10,000');
      expect(display).toContain('Clicks: 500');
      expect(display).toContain('Spend: $250.50');
      expect(display).toContain('Conversions: 20');
      expect(display).toContain('Revenue: $800.00');
      expect(display).toContain('ROAS: 3.19x');
    });

    it('should display N/A for null values', () => {
      const data: ExtractedAccountData = {
        accountId: 'act_999',
        normalizedAccountId: 'act_999',
        metrics: {
          impressions: 5000,
          clicks: 100,
          spend: 50.00,
          conversions: null,
          revenue: null,
          roas: null,
        },
      };

      const display = displayExtractedData(data);

      expect(display).toContain('Conversions: N/A');
      expect(display).toContain('Revenue: N/A');
      expect(display).toContain('ROAS: N/A');
    });
  });
});

describe('Multiple Accounts Batch Extraction', () => {
  it('should extract and display multiple Meta accounts', () => {
    const accounts = [
      { id: '111', impressions: '1000', clicks: '50', spend: '25.00' },
      { id: '222', impressions: '2000', clicks: '100', spend: '50.00' },
      { id: '333', impressions: '3000', clicks: '150', spend: '75.00' },
    ];

    const results = accounts.map((acc) =>
      extractAndFormatMetaAccount(acc.id, {
        impressions: acc.impressions,
        clicks: acc.clicks,
        spend: acc.spend,
      })
    );

    expect(results).toHaveLength(3);
    expect(results[0].normalizedAccountId).toBe('act_111');
    expect(results[1].normalizedAccountId).toBe('act_222');
    expect(results[2].normalizedAccountId).toBe('act_333');

    // Verify numeric extraction
    expect(results[0].metrics.impressions).toBe(1000);
    expect(results[1].metrics.spend).toBe(50);
    expect(results[2].metrics.clicks).toBe(150);
  });

  it('should extract and display multiple Google accounts', () => {
    const accounts = [
      { id: '111-111-1111', impressions: '5000', clicks: '250', cost_micros: '50000000' },
      { id: '222-222-2222', impressions: '10000', clicks: '500', cost_micros: '100000000' },
    ];

    const results = accounts.map((acc) =>
      extractAndFormatGoogleAccount(acc.id, {
        impressions: acc.impressions,
        clicks: acc.clicks,
        cost_micros: acc.cost_micros,
      })
    );

    expect(results).toHaveLength(2);
    expect(results[0].normalizedAccountId).toBe('1111111111');
    expect(results[1].normalizedAccountId).toBe('2222222222');

    // Verify cost_micros conversion
    expect(results[0].metrics.spend).toBe(50);
    expect(results[1].metrics.spend).toBe(100);
  });
});
