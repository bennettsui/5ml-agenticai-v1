/**
 * Google Ads API Health Check
 * Verifies credentials and connectivity to Google Ads API
 */

export interface GoogleAdsHealthCheckResult {
  status: 'connected' | 'error';
  envVarsSet: {
    GOOGLE_ADS_DEVELOPER_TOKEN: boolean;
    GOOGLE_ADS_CLIENT_ID: boolean;
    GOOGLE_ADS_CLIENT_SECRET: boolean;
    GOOGLE_ADS_REFRESH_TOKEN: boolean;
    GOOGLE_ADS_LOGIN_CUSTOMER_ID: boolean;
    GOOGLE_ADS_CUSTOMER_ID: boolean;
  };
  allRequiredVarsSet: boolean;
  oauthStatus: 'success' | 'error' | 'not_tested';
  oauthError?: string;
  accessibleCustomers: string[];
  apiVersion: string;
  checkedAt: string;
  diagnostics?: {
    tokenExchangeMs?: number;
    apiCallMs?: number;
  };
}

interface OAuthTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

const GOOGLE_ADS_API_VERSION = process.env.GOOGLE_ADS_API_VERSION || 'v19';
const GOOGLE_ADS_BASE = `https://googleads.googleapis.com/${GOOGLE_ADS_API_VERSION}`;

/**
 * Exchange a refresh token for a fresh access token via Google OAuth2.
 */
async function getAccessToken(params: {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
}): Promise<{ accessToken: string; durationMs: number }> {
  const startTime = Date.now();

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: params.clientId,
      client_secret: params.clientSecret,
      refresh_token: params.refreshToken,
    }).toString(),
  });

  const durationMs = Date.now() - startTime;

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`OAuth token error ${response.status}: ${errorBody}`);
  }

  const data: OAuthTokenResponse = await response.json();
  return { accessToken: data.access_token, durationMs };
}

/**
 * Call Google Ads API to list accessible customers
 */
async function listAccessibleCustomers(
  accessToken: string,
  developerToken: string
): Promise<{ customers: string[]; durationMs: number }> {
  const startTime = Date.now();

  const response = await fetch(
    `${GOOGLE_ADS_BASE}/customers:listAccessibleCustomers`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'developer-token': developerToken,
      },
    }
  );

  const durationMs = Date.now() - startTime;

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Google Ads API error ${response.status}: ${errorBody}`);
  }

  const data = await response.json();
  const resourceNames: string[] = data.resourceNames || [];

  // Extract customer IDs from resource names (format: customers/1234567890)
  const customers = resourceNames.map((rn: string) => {
    const id = rn.replace('customers/', '');
    // Format as XXX-XXX-XXXX if 10 digits
    if (id.length === 10) {
      return `${id.slice(0, 3)}-${id.slice(3, 6)}-${id.slice(6)}`;
    }
    return id;
  });

  return { customers, durationMs };
}

/**
 * Perform a comprehensive health check of Google Ads API connectivity
 */
export async function checkGoogleAdsHealth(): Promise<GoogleAdsHealthCheckResult> {
  const checkedAt = new Date().toISOString();

  // Check which env vars are set
  const envVarsSet = {
    GOOGLE_ADS_DEVELOPER_TOKEN: !!process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
    GOOGLE_ADS_CLIENT_ID: !!process.env.GOOGLE_ADS_CLIENT_ID,
    GOOGLE_ADS_CLIENT_SECRET: !!process.env.GOOGLE_ADS_CLIENT_SECRET,
    GOOGLE_ADS_REFRESH_TOKEN: !!process.env.GOOGLE_ADS_REFRESH_TOKEN,
    GOOGLE_ADS_LOGIN_CUSTOMER_ID: !!process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID,
    GOOGLE_ADS_CUSTOMER_ID: !!process.env.GOOGLE_ADS_CUSTOMER_ID,
  };

  // Required vars for API calls (LOGIN_CUSTOMER_ID and CUSTOMER_ID are optional)
  const requiredVars = [
    'GOOGLE_ADS_DEVELOPER_TOKEN',
    'GOOGLE_ADS_CLIENT_ID',
    'GOOGLE_ADS_CLIENT_SECRET',
    'GOOGLE_ADS_REFRESH_TOKEN',
  ] as const;

  const allRequiredVarsSet = requiredVars.every(
    (varName) => envVarsSet[varName]
  );

  // If required vars are missing, return early
  if (!allRequiredVarsSet) {
    const missingVars = requiredVars.filter((varName) => !envVarsSet[varName]);
    return {
      status: 'error',
      envVarsSet,
      allRequiredVarsSet: false,
      oauthStatus: 'not_tested',
      oauthError: `Missing required environment variables: ${missingVars.join(', ')}`,
      accessibleCustomers: [],
      apiVersion: GOOGLE_ADS_API_VERSION,
      checkedAt,
    };
  }

  // Try OAuth token exchange
  let accessToken: string;
  let tokenExchangeMs: number;

  try {
    const tokenResult = await getAccessToken({
      clientId: process.env.GOOGLE_ADS_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_ADS_CLIENT_SECRET!,
      refreshToken: process.env.GOOGLE_ADS_REFRESH_TOKEN!,
    });
    accessToken = tokenResult.accessToken;
    tokenExchangeMs = tokenResult.durationMs;
  } catch (error) {
    return {
      status: 'error',
      envVarsSet,
      allRequiredVarsSet: true,
      oauthStatus: 'error',
      oauthError: error instanceof Error ? error.message : String(error),
      accessibleCustomers: [],
      apiVersion: GOOGLE_ADS_API_VERSION,
      checkedAt,
    };
  }

  // Try listing accessible customers
  try {
    const { customers, durationMs: apiCallMs } = await listAccessibleCustomers(
      accessToken,
      process.env.GOOGLE_ADS_DEVELOPER_TOKEN!
    );

    return {
      status: 'connected',
      envVarsSet,
      allRequiredVarsSet: true,
      oauthStatus: 'success',
      accessibleCustomers: customers,
      apiVersion: GOOGLE_ADS_API_VERSION,
      checkedAt,
      diagnostics: {
        tokenExchangeMs,
        apiCallMs,
      },
    };
  } catch (error) {
    return {
      status: 'error',
      envVarsSet,
      allRequiredVarsSet: true,
      oauthStatus: 'success', // OAuth worked, but API call failed
      oauthError: error instanceof Error ? error.message : String(error),
      accessibleCustomers: [],
      apiVersion: GOOGLE_ADS_API_VERSION,
      checkedAt,
      diagnostics: {
        tokenExchangeMs,
      },
    };
  }
}

/**
 * Format health check result as human-readable string
 */
export function formatHealthCheckResult(result: GoogleAdsHealthCheckResult): string {
  const lines: string[] = [];

  if (result.status === 'connected') {
    lines.push('✅ Google Ads API connected');
    lines.push(`   API Version: ${result.apiVersion}`);
    lines.push(`   Accessible Customers: ${result.accessibleCustomers.length}`);
    result.accessibleCustomers.forEach((id) => {
      lines.push(`     - ${id}`);
    });
    if (result.diagnostics) {
      lines.push(`   OAuth Token Exchange: ${result.diagnostics.tokenExchangeMs}ms`);
      lines.push(`   API Call: ${result.diagnostics.apiCallMs}ms`);
    }
  } else {
    lines.push('❌ Google Ads API not connected');
    lines.push(`   Error: ${result.oauthError}`);
  }

  lines.push('');
  lines.push('Environment Variables:');
  Object.entries(result.envVarsSet).forEach(([key, isSet]) => {
    lines.push(`   ${isSet ? '✓' : '✗'} ${key}`);
  });

  return lines.join('\n');
}
