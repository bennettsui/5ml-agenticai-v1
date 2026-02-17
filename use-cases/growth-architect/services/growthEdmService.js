/**
 * Growth EDM Service
 * Generates HTML emails for growth campaigns.
 * Extends the topic-intelligence EDM pattern — same cache structure, growth-specific HTML.
 *
 * Reuses: cache pattern from use-cases/topic-intelligence/api-js/services/edmService.js
 */

// In-memory cache (same pattern as topic-intelligence edmService)
const edmCache = new Map();
const EDM_CACHE_TTL = 60 * 60 * 1000; // 1 hour

function getFromCache(key) {
  const cached = edmCache.get(key);
  if (!cached) return null;
  if (Date.now() > cached.expiresAt) { edmCache.delete(key); return null; }
  return cached.data;
}

function setInCache(key, data, ttl = EDM_CACHE_TTL) {
  edmCache.set(key, { data, expiresAt: Date.now() + ttl });
  if (edmCache.size > 100) {
    const now = Date.now();
    for (const [k, v] of edmCache.entries()) {
      if (now > v.expiresAt) edmCache.delete(k);
    }
  }
}

function getEdmCacheKey(brandName, campaignType) {
  const today = new Date().toISOString().split('T')[0];
  return `growth-edm:${brandName}:${campaignType}:${today}`;
}

/**
 * Generate growth campaign EDM HTML
 * @param {object} input
 * @returns {string} Full HTML email
 */
function generateGrowthEdmHtml(input) {
  const {
    brand_name,
    campaign_name,
    subject,
    hero_headline,
    hero_subheadline = '',
    sections = [],
    footer_note = '',
    accent_color = '#10b981',
  } = input;

  const today = new Date();
  const dateStr = today.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  const generateSections = () =>
    sections
      .map(
        (s, i) => `
      <tr>
        <td style="padding:0 30px 24px;">
          <table role="presentation" style="width:100%;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
            <tr>
              <td style="padding:24px;">
                <div style="display:inline-block;padding:4px 10px;background:${accent_color};color:#fff;font-size:11px;font-weight:bold;border-radius:4px;margin-bottom:12px;">
                  ${i === 0 ? 'KEY INSIGHT' : i === 1 ? 'HOW IT WORKS' : 'NEXT STEP'}
                </div>
                <h3 style="margin:0 0 10px;color:#1e293b;font-size:17px;line-height:1.4;">${s.title || ''}</h3>
                <p style="margin:0 0 16px;color:#64748b;font-size:14px;line-height:1.6;">${s.body || ''}</p>
                ${s.cta_text ? `<a href="${s.cta_url || '#'}" style="display:inline-block;padding:10px 24px;background:${accent_color};color:#ffffff;text-decoration:none;border-radius:6px;font-size:14px;font-weight:600;">${s.cta_text} →</a>` : ''}
              </td>
            </tr>
          </table>
        </td>
      </tr>`
      )
      .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;background-color:#f4f4f4;">
  <table role="presentation" style="width:100%;border:none;border-spacing:0;">
    <tr>
      <td align="center" style="padding:24px 0;">
        <table role="presentation" style="width:600px;border:none;border-spacing:0;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

          <!-- Hero -->
          <tr>
            <td style="padding:0;">
              <table role="presentation" style="width:100%;background:linear-gradient(135deg,#0f172a 0%,#1e293b 60%,${accent_color}22 100%);">
                <tr>
                  <td style="padding:44px 30px 36px;text-align:center;">
                    <span style="display:inline-block;padding:6px 14px;background:rgba(255,255,255,0.12);border-radius:20px;color:rgba(255,255,255,0.85);font-size:11px;letter-spacing:1px;margin-bottom:18px;">5ML GROWTH ARCHITECT</span>
                    <h1 style="margin:0 0 12px;color:#ffffff;font-size:30px;font-weight:bold;line-height:1.25;">${hero_headline}</h1>
                    ${hero_subheadline ? `<p style="margin:0 0 20px;color:rgba(255,255,255,0.75);font-size:16px;line-height:1.5;">${hero_subheadline}</p>` : ''}
                    <span style="display:inline-block;padding:8px 18px;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);border-radius:20px;color:rgba(255,255,255,0.7);font-size:13px;">📅 ${dateStr}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Intro -->
          <tr>
            <td style="padding:28px 30px 20px;">
              <p style="margin:0;color:#64748b;font-size:15px;line-height:1.65;">
                Hi, this is your growth update from <strong style="color:#1e293b;">${brand_name}</strong>. Below you'll find the latest insights and next steps from your growth system.
              </p>
            </td>
          </tr>

          <!-- Content Sections -->
          ${generateSections()}

          <!-- Footer CTA -->
          <tr>
            <td style="padding:28px 30px;background:#f8fafc;text-align:center;">
              <p style="margin:0 0 14px;color:#64748b;font-size:14px;">Powered by 5ML Growth Architect</p>
              <a href="#" style="display:inline-block;padding:14px 36px;background:${accent_color};color:#ffffff;text-decoration:none;border-radius:8px;font-size:15px;font-weight:bold;">View Full Growth Dashboard →</a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 30px;text-align:center;border-top:1px solid #e2e8f0;">
              <p style="margin:0 0 8px;color:#94a3b8;font-size:12px;">
                ${campaign_name} · ${brand_name}
              </p>
              ${footer_note ? `<p style="margin:0 0 8px;color:#94a3b8;font-size:12px;">${footer_note}</p>` : ''}
              <p style="margin:0;color:#cbd5e1;font-size:11px;">
                <a href="#" style="color:#94a3b8;">Unsubscribe</a> · <a href="#" style="color:#94a3b8;">Manage Preferences</a>
              </p>
              <p style="margin:10px 0 0;color:#e2e8f0;font-size:10px;">© ${today.getFullYear()} 5 Miles Lab. All rights reserved.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

module.exports = { generateGrowthEdmHtml, getFromCache, setInCache, getEdmCacheKey };
