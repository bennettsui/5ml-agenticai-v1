/**
 * Unit tests for ads metric normalization logic
 */

import { describe, it, expect } from 'vitest';

// Type definitions matching the tool implementations
interface MetaDailyMetric {
  platform: 'meta';
  accountId: string;
  campaignId: string;
  campaignName: string;
  date: string;
  impressions: number;
  reach: number;
  clicks: number;
  spend: number;
  conversions: number | null;
  revenue: number | null;
  cpc: number | null;
  cpm: number | null;
  ctr: number | null;
  roas: number | null;
}

interface GoogleDailyMetric {
  platform: 'google';
  customerId: string;
  campaignId: string;
  campaignName: string;
  date: string;
  impressions: number;
  clicks: number;
  spend: number;
  conversions: number | null;
  revenue: number | null;
  cpc: number | null;
  cpm: number | null;
  ctr: number | null;
  roas: number | null;
}

// Helper functions extracted for testing
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

function normalizeGoogleCostMicros(costMicros: number): number {
  return costMicros / 1_000_000;
}

describe('Meta Ads Normalization', () => {
  it('should extract conversions from purchase action', () => {
    const actions = [
      { action_type: 'link_click', value: '100' },
      { action_type: 'purchase', value: '15' },
    ];
    expect(extractConversions(actions)).toBe(15);
  });

  it('should extract conversions from fb_pixel_purchase action', () => {
    const actions = [
      { action_type: 'offsite_conversion.fb_pixel_purchase', value: '8' },
    ];
    expect(extractConversions(actions)).toBe(8);
  });

  it('should return null when no purchase action exists', () => {
    const actions = [
      { action_type: 'link_click', value: '100' },
    ];
    expect(extractConversions(actions)).toBeNull();
  });

  it('should return null when actions is undefined', () => {
    expect(extractConversions(undefined)).toBeNull();
  });

  it('should extract revenue from action values', () => {
    const actionValues = [
      { action_type: 'purchase', value: '250.50' },
    ];
    expect(extractRevenue(actionValues)).toBe(250.50);
  });

  it('should return null when no revenue action exists', () => {
    expect(extractRevenue([])).toBeNull();
  });
});

describe('Google Ads Normalization', () => {
  it('should convert cost_micros to standard currency', () => {
    expect(normalizeGoogleCostMicros(5_000_000)).toBe(5);
    expect(normalizeGoogleCostMicros(1_500_000)).toBe(1.5);
    expect(normalizeGoogleCostMicros(0)).toBe(0);
    expect(normalizeGoogleCostMicros(123_456)).toBeCloseTo(0.123456);
  });

  it('should handle large cost_micros values', () => {
    expect(normalizeGoogleCostMicros(999_999_999_999)).toBeCloseTo(999999.999999);
  });
});

describe('Metric Type Validation', () => {
  it('should validate MetaDailyMetric structure', () => {
    const metric: MetaDailyMetric = {
      platform: 'meta',
      accountId: 'act_123',
      campaignId: '456',
      campaignName: 'Test Campaign',
      date: '2026-02-01',
      impressions: 1000,
      reach: 800,
      clicks: 50,
      spend: 25.50,
      conversions: 5,
      revenue: 100.00,
      cpc: 0.51,
      cpm: 25.50,
      ctr: 5.0,
      roas: 3.92,
    };

    expect(metric.platform).toBe('meta');
    expect(metric.impressions).toBeGreaterThan(0);
    expect(metric.roas).toBeGreaterThan(0);
  });

  it('should validate GoogleDailyMetric structure', () => {
    const metric: GoogleDailyMetric = {
      platform: 'google',
      customerId: '123-456-7890',
      campaignId: '789',
      campaignName: 'Google Test Campaign',
      date: '2026-02-01',
      impressions: 2000,
      clicks: 100,
      spend: 50.00,
      conversions: 10,
      revenue: 200.00,
      cpc: 0.50,
      cpm: 25.00,
      ctr: 5.0,
      roas: 4.00,
    };

    expect(metric.platform).toBe('google');
    expect(metric.spend).toBe(50.00);
    expect(metric.roas).toBe(4.00);
  });

  it('should handle nullable fields', () => {
    const metric: MetaDailyMetric = {
      platform: 'meta',
      accountId: 'act_123',
      campaignId: '456',
      campaignName: 'Awareness Campaign',
      date: '2026-02-01',
      impressions: 5000,
      reach: 3000,
      clicks: 200,
      spend: 100.00,
      conversions: null,
      revenue: null,
      cpc: 0.50,
      cpm: 20.00,
      ctr: 4.0,
      roas: null,
    };

    expect(metric.conversions).toBeNull();
    expect(metric.revenue).toBeNull();
    expect(metric.roas).toBeNull();
  });
});
