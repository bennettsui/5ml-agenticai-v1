-- Multi-tenant Ads Performance Schema
-- Extends the base schema from 5ml-ads-performance-internal with multi-tenant support
-- Both use cases share the same tables: ads_daily_performance and client_credentials

-- Note: The base tables are created by the internal use case schema.
-- This file documents the multi-tenant extensions.

-- Ensure tenant_id column exists (should already be there from base schema)
-- ALTER TABLE ads_daily_performance ADD COLUMN IF NOT EXISTS tenant_id TEXT NOT NULL DEFAULT '5ml-internal';

-- The client_credentials table enables per-tenant credential storage:
-- - tenant_id: unique identifier per client (e.g., 'client-epd', 'client-mans-company')
-- - service: 'meta_ads' or 'google_ads'
-- - account_id: the ad account ID or Google Ads customer ID
-- - access_token: Meta long-lived token
-- - refresh_token: Google Ads OAuth refresh token
-- - extra: JSONB for developer_token, login_customer_id, client_id, client_secret

-- Usage example: Insert Meta credentials for a new client
-- INSERT INTO client_credentials (tenant_id, service, account_id, access_token)
-- VALUES ('client-demo', 'meta_ads', 'act_123456789', 'EAAxxxx...');

-- Usage example: Insert Google Ads credentials for a new client
-- INSERT INTO client_credentials (tenant_id, service, account_id, refresh_token, extra)
-- VALUES ('client-demo', 'google_ads', '123-456-7890', 'refresh_token_here',
--         '{"developer_token": "xxx", "client_id": "xxx", "client_secret": "xxx"}');
