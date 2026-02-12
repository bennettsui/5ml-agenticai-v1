/**
 * Layer 2: Execution Engine - Tenant Context Resolver
 * Resolves credentials and configuration for multi-tenant operations
 */

import { getDatabase } from '../infrastructure/database';

export interface MetaCredentials {
  accountId: string;
  accessToken: string;
}

export interface GoogleCredentials {
  customerId: string;
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  developerToken: string;
  loginCustomerId?: string;
}

export interface TenantConfig {
  tenantId: string;
  displayName: string;
  industry?: string;
  businessModel?: string;
  primaryKpis?: {
    targetRoas?: number;
    targetCpa?: number;
    targetCtr?: number;
    targetCpc?: number;
  };
  brandVoice?: 'professional' | 'conversational' | 'technical' | 'friendly';
}

export interface TenantContext {
  config: TenantConfig;
  meta?: MetaCredentials;
  google?: GoogleCredentials;
}

export class TenantContextResolver {
  private cache: Map<string, TenantContext> = new Map();
  private cacheExpiry: Map<string, number> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Resolve full context for a tenant including credentials
   */
  async resolve(tenantId: string): Promise<TenantContext> {
    // Check cache first
    const cached = this.cache.get(tenantId);
    const expiry = this.cacheExpiry.get(tenantId);

    if (cached && expiry && Date.now() < expiry) {
      return cached;
    }

    const context = await this.loadTenantContext(tenantId);

    // Cache the result
    this.cache.set(tenantId, context);
    this.cacheExpiry.set(tenantId, Date.now() + this.CACHE_TTL);

    return context;
  }

  /**
   * Get Meta credentials for tenant
   */
  async getMetaCredentials(tenantId: string): Promise<MetaCredentials | null> {
    // First check environment variables for default/internal tenant
    if (tenantId === '5ml-internal' || !tenantId) {
      const accountId = process.env.META_AD_ACCOUNT_ID;
      const accessToken = process.env.META_ACCESS_TOKEN;

      if (accountId && accessToken) {
        return { accountId, accessToken };
      }
    }

    // Then check database for client-specific credentials
    const db = getDatabase();
    const result = await db.query(
      `SELECT account_id, access_token FROM client_credentials
       WHERE tenant_id = $1 AND service = 'meta_ads'`,
      [tenantId]
    );

    if (result.rows.length > 0) {
      return {
        accountId: result.rows[0].account_id,
        accessToken: result.rows[0].access_token,
      };
    }

    // Fallback to env vars
    const accountId = process.env.META_AD_ACCOUNT_ID;
    const accessToken = process.env.META_ACCESS_TOKEN;

    if (accountId && accessToken) {
      return { accountId, accessToken };
    }

    return null;
  }

  /**
   * Get Google Ads credentials for tenant
   */
  async getGoogleCredentials(tenantId: string): Promise<GoogleCredentials | null> {
    // First check environment variables for default/internal tenant
    if (tenantId === '5ml-internal' || !tenantId) {
      const creds = this.getGoogleCredsFromEnv();
      if (creds) return creds;
    }

    // Then check database for client-specific credentials
    const db = getDatabase();
    const result = await db.query(
      `SELECT account_id, access_token, refresh_token, extra FROM client_credentials
       WHERE tenant_id = $1 AND service = 'google_ads'`,
      [tenantId]
    );

    if (result.rows.length > 0) {
      const row = result.rows[0];
      const extra = row.extra || {};
      return {
        customerId: row.account_id,
        clientId: extra.clientId || process.env.GOOGLE_ADS_CLIENT_ID || '',
        clientSecret: extra.clientSecret || process.env.GOOGLE_ADS_CLIENT_SECRET || '',
        refreshToken: row.refresh_token || process.env.GOOGLE_ADS_REFRESH_TOKEN || '',
        developerToken: extra.developerToken || process.env.GOOGLE_ADS_DEVELOPER_TOKEN || '',
        loginCustomerId: extra.loginCustomerId || process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID,
      };
    }

    // Fallback to env vars
    return this.getGoogleCredsFromEnv();
  }

  private getGoogleCredsFromEnv(): GoogleCredentials | null {
    const customerId = process.env.GOOGLE_ADS_CUSTOMER_ID;
    const clientId = process.env.GOOGLE_ADS_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_ADS_CLIENT_SECRET;
    const refreshToken = process.env.GOOGLE_ADS_REFRESH_TOKEN;
    const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;

    if (customerId && clientId && clientSecret && refreshToken && developerToken) {
      return {
        customerId,
        clientId,
        clientSecret,
        refreshToken,
        developerToken,
        loginCustomerId: process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID,
      };
    }

    return null;
  }

  /**
   * Get tenant configuration (KPIs, voice, etc.)
   */
  async getTenantConfig(tenantId: string): Promise<TenantConfig> {
    const db = getDatabase();
    const result = await db.query(
      `SELECT tenant_id, display_name, industry, business_model, primary_kpis, brand_voice
       FROM tenants WHERE tenant_id = $1`,
      [tenantId]
    );

    if (result.rows.length > 0) {
      const row = result.rows[0];
      return {
        tenantId: row.tenant_id,
        displayName: row.display_name,
        industry: row.industry,
        businessModel: row.business_model,
        primaryKpis: row.primary_kpis,
        brandVoice: row.brand_voice,
      };
    }

    // Default config for internal tenant
    return {
      tenantId,
      displayName: tenantId === '5ml-internal' ? '5 Miles Lab' : tenantId,
      industry: 'agency',
      businessModel: 'service',
      primaryKpis: {
        targetRoas: 3.0,
        targetCpa: 50,
        targetCtr: 1.5,
      },
      brandVoice: 'professional',
    };
  }

  private async loadTenantContext(tenantId: string): Promise<TenantContext> {
    const [config, meta, google] = await Promise.all([
      this.getTenantConfig(tenantId),
      this.getMetaCredentials(tenantId),
      this.getGoogleCredentials(tenantId),
    ]);

    return {
      config,
      meta: meta || undefined,
      google: google || undefined,
    };
  }

  /**
   * List all tenants with credentials
   */
  async listTenants(): Promise<TenantConfig[]> {
    const db = getDatabase();

    // Get tenants from database
    const result = await db.query(
      `SELECT DISTINCT t.tenant_id, t.display_name, t.industry, t.business_model, t.primary_kpis, t.brand_voice
       FROM tenants t
       UNION
       SELECT DISTINCT cc.tenant_id, cc.tenant_id as display_name, NULL as industry, NULL as business_model, NULL as primary_kpis, NULL as brand_voice
       FROM client_credentials cc
       WHERE cc.tenant_id NOT IN (SELECT tenant_id FROM tenants)
       ORDER BY tenant_id`
    );

    const tenants: TenantConfig[] = result.rows.map((row) => ({
      tenantId: row.tenant_id,
      displayName: row.display_name || row.tenant_id,
      industry: row.industry,
      businessModel: row.business_model,
      primaryKpis: row.primary_kpis,
      brandVoice: row.brand_voice,
    }));

    // Always include internal tenant
    if (!tenants.find((t) => t.tenantId === '5ml-internal')) {
      tenants.unshift({
        tenantId: '5ml-internal',
        displayName: '5 Miles Lab',
        industry: 'agency',
        businessModel: 'service',
        primaryKpis: { targetRoas: 3.0 },
        brandVoice: 'professional',
      });
    }

    return tenants;
  }

  /**
   * Clear cache for a tenant
   */
  invalidateCache(tenantId?: string): void {
    if (tenantId) {
      this.cache.delete(tenantId);
      this.cacheExpiry.delete(tenantId);
    } else {
      this.cache.clear();
      this.cacheExpiry.clear();
    }
  }
}

// Singleton instance
let resolverInstance: TenantContextResolver | null = null;

export function getTenantContextResolver(): TenantContextResolver {
  if (!resolverInstance) {
    resolverInstance = new TenantContextResolver();
  }
  return resolverInstance;
}

export default TenantContextResolver;
