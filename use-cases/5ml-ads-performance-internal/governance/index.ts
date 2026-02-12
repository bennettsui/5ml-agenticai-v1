/**
 * Layer 7: Governance & Compliance
 * Tenant isolation, audit logging, access control, and data retention
 */

import { getDatabase } from '../infrastructure/database';

// ===========================================
// Audit Logging
// ===========================================

export type AuditAction =
  | 'daily_sync'
  | 'weekly_analysis'
  | 'monthly_summary'
  | 'cross_tenant_overview'
  | 'data_fetch'
  | 'credential_access'
  | 'report_generated'
  | 'anomaly_detected'
  | 'recommendation_created'
  | 'config_changed'
  | 'data_exported'
  | 'data_deleted';

export interface AuditLogEntry {
  id?: number;
  tenantId: string;
  action: AuditAction;
  resourceType: string;
  resourceId: string | null;
  details: Record<string, any>;
  performedBy?: string;
  ipAddress?: string;
  timestamp: Date;
}

/**
 * Log an audit event
 */
export async function logAudit(
  tenantId: string,
  action: AuditAction,
  resourceType: string,
  resourceId: string | null,
  details: Record<string, any> = {},
  performedBy?: string,
  ipAddress?: string
): Promise<void> {
  try {
    const db = getDatabase();
    await db.query(
      `INSERT INTO ads_audit_log (tenant_id, action, resource_type, resource_id, details, performed_by, ip_address, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
      [tenantId, action, resourceType, resourceId, JSON.stringify(details), performedBy, ipAddress]
    );
  } catch (error) {
    // Don't let audit failures break the main flow
    console.error('[Governance] Audit log error:', error);
  }
}

/**
 * Query audit logs for a tenant
 */
export async function queryAuditLogs(
  tenantId: string,
  options: {
    action?: AuditAction;
    resourceType?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  } = {}
): Promise<AuditLogEntry[]> {
  const db = getDatabase();
  const conditions: string[] = ['tenant_id = $1'];
  const params: any[] = [tenantId];
  let paramIndex = 2;

  if (options.action) {
    conditions.push(`action = $${paramIndex++}`);
    params.push(options.action);
  }

  if (options.resourceType) {
    conditions.push(`resource_type = $${paramIndex++}`);
    params.push(options.resourceType);
  }

  if (options.startDate) {
    conditions.push(`created_at >= $${paramIndex++}`);
    params.push(options.startDate);
  }

  if (options.endDate) {
    conditions.push(`created_at <= $${paramIndex++}`);
    params.push(options.endDate);
  }

  const limit = options.limit || 100;

  const result = await db.query(
    `SELECT id, tenant_id, action, resource_type, resource_id, details, performed_by, ip_address, created_at
     FROM ads_audit_log
     WHERE ${conditions.join(' AND ')}
     ORDER BY created_at DESC
     LIMIT ${limit}`,
    params
  );

  return result.rows.map((row) => ({
    id: row.id,
    tenantId: row.tenant_id,
    action: row.action,
    resourceType: row.resource_type,
    resourceId: row.resource_id,
    details: row.details,
    performedBy: row.performed_by,
    ipAddress: row.ip_address,
    timestamp: row.created_at,
  }));
}

// ===========================================
// Tenant Isolation
// ===========================================

export interface TenantPermissions {
  canAccessMetaAds: boolean;
  canAccessGoogleAds: boolean;
  canViewCrossTenant: boolean;
  canExportData: boolean;
  canModifyConfig: boolean;
  maxDataRetentionDays: number;
}

const DEFAULT_PERMISSIONS: TenantPermissions = {
  canAccessMetaAds: true,
  canAccessGoogleAds: true,
  canViewCrossTenant: false,
  canExportData: true,
  canModifyConfig: true,
  maxDataRetentionDays: 365,
};

const INTERNAL_PERMISSIONS: TenantPermissions = {
  canAccessMetaAds: true,
  canAccessGoogleAds: true,
  canViewCrossTenant: true,
  canExportData: true,
  canModifyConfig: true,
  maxDataRetentionDays: 730, // 2 years
};

/**
 * Get permissions for a tenant
 */
export async function getTenantPermissions(tenantId: string): Promise<TenantPermissions> {
  // Internal tenant has elevated permissions
  if (tenantId === '5ml-internal') {
    return INTERNAL_PERMISSIONS;
  }

  // In a full implementation, this would check the database
  // For now, return default permissions
  return DEFAULT_PERMISSIONS;
}

/**
 * Check if a tenant can perform an action
 */
export async function checkPermission(
  tenantId: string,
  permission: keyof TenantPermissions
): Promise<boolean> {
  const permissions = await getTenantPermissions(tenantId);
  const value = permissions[permission];
  return typeof value === 'boolean' ? value : value > 0;
}

/**
 * Ensure tenant isolation in queries
 * Returns a SQL condition to add to WHERE clauses
 */
export function getTenantIsolationCondition(
  tenantId: string,
  columnName = 'tenant_id'
): { condition: string; param: string } {
  return {
    condition: `${columnName} = $TENANT_ID`,
    param: tenantId,
  };
}

/**
 * Validate that a tenant can access a resource
 */
export async function validateTenantAccess(
  requestingTenantId: string,
  resourceTenantId: string,
  resourceType: string
): Promise<{ allowed: boolean; reason?: string }> {
  // Same tenant always allowed
  if (requestingTenantId === resourceTenantId) {
    return { allowed: true };
  }

  // Internal tenant can access everything
  if (requestingTenantId === '5ml-internal') {
    const permissions = await getTenantPermissions(requestingTenantId);
    if (permissions.canViewCrossTenant) {
      return { allowed: true };
    }
  }

  return {
    allowed: false,
    reason: `Tenant ${requestingTenantId} cannot access ${resourceType} belonging to ${resourceTenantId}`,
  };
}

// ===========================================
// Data Retention
// ===========================================

export interface RetentionPolicy {
  tableName: string;
  tenantColumn: string;
  dateColumn: string;
  retentionDays: number;
}

const DEFAULT_RETENTION_POLICIES: RetentionPolicy[] = [
  {
    tableName: 'ads_daily_performance',
    tenantColumn: 'tenant_id',
    dateColumn: 'date',
    retentionDays: 365,
  },
  {
    tableName: 'ads_audit_log',
    tenantColumn: 'tenant_id',
    dateColumn: 'created_at',
    retentionDays: 730,
  },
  {
    tableName: 'ads_anomalies',
    tenantColumn: 'tenant_id',
    dateColumn: 'detected_at',
    retentionDays: 180,
  },
  {
    tableName: 'ads_recommendations',
    tenantColumn: 'tenant_id',
    dateColumn: 'created_at',
    retentionDays: 365,
  },
];

/**
 * Apply data retention policy to clean up old data
 */
export async function applyRetentionPolicy(
  tenantId?: string,
  dryRun = false
): Promise<{ table: string; deletedCount: number }[]> {
  const db = getDatabase();
  const results: { table: string; deletedCount: number }[] = [];

  for (const policy of DEFAULT_RETENTION_POLICIES) {
    // Get tenant-specific retention days if applicable
    let retentionDays = policy.retentionDays;
    if (tenantId) {
      const permissions = await getTenantPermissions(tenantId);
      retentionDays = Math.min(retentionDays, permissions.maxDataRetentionDays);
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    let condition = `${policy.dateColumn} < $1`;
    const params: any[] = [cutoffDate];

    if (tenantId) {
      condition += ` AND ${policy.tenantColumn} = $2`;
      params.push(tenantId);
    }

    if (dryRun) {
      const countResult = await db.query(
        `SELECT COUNT(*) as count FROM ${policy.tableName} WHERE ${condition}`,
        params
      );
      results.push({
        table: policy.tableName,
        deletedCount: parseInt(countResult.rows[0].count, 10),
      });
    } else {
      const deleteResult = await db.query(
        `DELETE FROM ${policy.tableName} WHERE ${condition}`,
        params
      );
      results.push({
        table: policy.tableName,
        deletedCount: deleteResult.rowCount || 0,
      });

      // Log the retention action
      await logAudit(
        tenantId || '5ml-internal',
        'data_deleted',
        policy.tableName,
        null,
        {
          retentionDays,
          cutoffDate: cutoffDate.toISOString(),
          deletedCount: deleteResult.rowCount,
        }
      );
    }
  }

  return results;
}

// ===========================================
// Data Export (GDPR/Privacy Compliance)
// ===========================================

export interface ExportedData {
  tenant: {
    tenantId: string;
    config: any;
  };
  performance: any[];
  campaigns: any[];
  anomalies: any[];
  recommendations: any[];
  auditLog: any[];
  exportedAt: string;
}

/**
 * Export all data for a tenant (for GDPR data portability)
 */
export async function exportTenantData(tenantId: string): Promise<ExportedData> {
  const db = getDatabase();

  // Check permission
  const canExport = await checkPermission(tenantId, 'canExportData');
  if (!canExport) {
    throw new Error(`Tenant ${tenantId} does not have permission to export data`);
  }

  const [tenantResult, performanceResult, campaignsResult, anomaliesResult, recommendationsResult, auditResult] =
    await Promise.all([
      db.query('SELECT * FROM tenants WHERE tenant_id = $1', [tenantId]),
      db.query('SELECT * FROM ads_daily_performance WHERE tenant_id = $1 ORDER BY date DESC', [tenantId]),
      db.query('SELECT * FROM ads_campaigns WHERE tenant_id = $1', [tenantId]),
      db.query('SELECT * FROM ads_anomalies WHERE tenant_id = $1 ORDER BY detected_at DESC', [tenantId]),
      db.query('SELECT * FROM ads_recommendations WHERE tenant_id = $1 ORDER BY created_at DESC', [tenantId]),
      db.query('SELECT * FROM ads_audit_log WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT 1000', [tenantId]),
    ]);

  // Log the export
  await logAudit(tenantId, 'data_exported', 'tenant', tenantId, {
    performanceRecords: performanceResult.rows.length,
    campaigns: campaignsResult.rows.length,
    anomalies: anomaliesResult.rows.length,
    recommendations: recommendationsResult.rows.length,
  });

  return {
    tenant: {
      tenantId,
      config: tenantResult.rows[0] || null,
    },
    performance: performanceResult.rows,
    campaigns: campaignsResult.rows,
    anomalies: anomaliesResult.rows,
    recommendations: recommendationsResult.rows,
    auditLog: auditResult.rows,
    exportedAt: new Date().toISOString(),
  };
}

/**
 * Delete all data for a tenant (for GDPR right to erasure)
 */
export async function deleteTenantData(
  tenantId: string,
  confirm: boolean
): Promise<{ success: boolean; deletedTables: string[] }> {
  if (!confirm) {
    throw new Error('Data deletion must be explicitly confirmed');
  }

  // Internal tenant cannot be deleted
  if (tenantId === '5ml-internal') {
    throw new Error('Internal tenant data cannot be deleted');
  }

  const db = getDatabase();
  const deletedTables: string[] = [];

  // Delete in order to respect foreign keys
  const tables = [
    'ads_audit_log',
    'ads_recommendations',
    'ads_anomalies',
    'ads_creatives',
    'ads_adsets',
    'ads_campaigns',
    'ads_daily_performance',
    'client_credentials',
    'tenants',
  ];

  for (const table of tables) {
    try {
      await db.query(`DELETE FROM ${table} WHERE tenant_id = $1`, [tenantId]);
      deletedTables.push(table);
    } catch (error) {
      // Table might not exist or have different column name
      console.warn(`[Governance] Could not delete from ${table}:`, error);
    }
  }

  // Log to a separate system log since tenant audit log is deleted
  console.log(`[Governance] Tenant data deleted: ${tenantId}, tables: ${deletedTables.join(', ')}`);

  return { success: true, deletedTables };
}

// ===========================================
// Access Control Helpers
// ===========================================

export type Role = 'admin' | 'analyst' | 'viewer' | 'api';

export interface AccessPolicy {
  role: Role;
  allowedActions: AuditAction[];
  allowedResources: string[];
}

const ACCESS_POLICIES: AccessPolicy[] = [
  {
    role: 'admin',
    allowedActions: [
      'daily_sync', 'weekly_analysis', 'monthly_summary', 'cross_tenant_overview',
      'data_fetch', 'credential_access', 'report_generated', 'anomaly_detected',
      'recommendation_created', 'config_changed', 'data_exported', 'data_deleted',
    ],
    allowedResources: ['*'],
  },
  {
    role: 'analyst',
    allowedActions: [
      'daily_sync', 'weekly_analysis', 'monthly_summary',
      'data_fetch', 'report_generated', 'anomaly_detected', 'recommendation_created',
    ],
    allowedResources: ['ads_performance', 'reports', 'recommendations'],
  },
  {
    role: 'viewer',
    allowedActions: ['data_fetch', 'report_generated'],
    allowedResources: ['reports'],
  },
  {
    role: 'api',
    allowedActions: ['daily_sync', 'data_fetch'],
    allowedResources: ['ads_performance'],
  },
];

/**
 * Check if a role can perform an action on a resource
 */
export function canRolePerformAction(
  role: Role,
  action: AuditAction,
  resourceType: string
): boolean {
  const policy = ACCESS_POLICIES.find((p) => p.role === role);
  if (!policy) return false;

  const actionAllowed = policy.allowedActions.includes(action);
  const resourceAllowed = policy.allowedResources.includes('*') || policy.allowedResources.includes(resourceType);

  return actionAllowed && resourceAllowed;
}

// ===========================================
// Compliance Report
// ===========================================

export interface ComplianceReport {
  tenantId: string;
  generatedAt: string;
  dataRetention: {
    policy: RetentionPolicy[];
    currentDataAge: { table: string; oldestRecord: string | null; recordCount: number }[];
  };
  accessSummary: {
    totalAccesses: number;
    uniqueActions: string[];
    lastAccess: string | null;
  };
  exportHistory: {
    count: number;
    lastExport: string | null;
  };
}

/**
 * Generate a compliance report for a tenant
 */
export async function generateComplianceReport(tenantId: string): Promise<ComplianceReport> {
  const db = getDatabase();

  // Get data age for each table
  const dataAge: { table: string; oldestRecord: string | null; recordCount: number }[] = [];
  for (const policy of DEFAULT_RETENTION_POLICIES) {
    const result = await db.query(
      `SELECT MIN(${policy.dateColumn}) as oldest, COUNT(*) as count
       FROM ${policy.tableName}
       WHERE ${policy.tenantColumn} = $1`,
      [tenantId]
    );
    dataAge.push({
      table: policy.tableName,
      oldestRecord: result.rows[0]?.oldest?.toISOString() || null,
      recordCount: parseInt(result.rows[0]?.count || '0', 10),
    });
  }

  // Get access summary from audit log
  const accessResult = await db.query(
    `SELECT COUNT(*) as total, array_agg(DISTINCT action) as actions, MAX(created_at) as last_access
     FROM ads_audit_log
     WHERE tenant_id = $1`,
    [tenantId]
  );

  // Get export history
  const exportResult = await db.query(
    `SELECT COUNT(*) as count, MAX(created_at) as last_export
     FROM ads_audit_log
     WHERE tenant_id = $1 AND action = 'data_exported'`,
    [tenantId]
  );

  return {
    tenantId,
    generatedAt: new Date().toISOString(),
    dataRetention: {
      policy: DEFAULT_RETENTION_POLICIES,
      currentDataAge: dataAge,
    },
    accessSummary: {
      totalAccesses: parseInt(accessResult.rows[0]?.total || '0', 10),
      uniqueActions: accessResult.rows[0]?.actions || [],
      lastAccess: accessResult.rows[0]?.last_access?.toISOString() || null,
    },
    exportHistory: {
      count: parseInt(exportResult.rows[0]?.count || '0', 10),
      lastExport: exportResult.rows[0]?.last_export?.toISOString() || null,
    },
  };
}

export default {
  logAudit,
  queryAuditLogs,
  getTenantPermissions,
  checkPermission,
  validateTenantAccess,
  applyRetentionPolicy,
  exportTenantData,
  deleteTenantData,
  canRolePerformAction,
  generateComplianceReport,
};
