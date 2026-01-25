/**
 * EDM (Email Direct Marketing) Service for Topic Intelligence
 * Handles EDM caching and HTML generation for newsletters
 */

// Simple in-memory KV cache with TTL for EDM content
const edmCache = new Map();
const EDM_CACHE_TTL = 60 * 60 * 1000; // 1 hour TTL

/**
 * Get EDM from cache
 * @param {string} key - Cache key (e.g., 'edm:topic123:2026-01-24')
 * @returns {object|null} Cached EDM data or null if not found/expired
 */
function getEdmFromCache(key) {
  const cached = edmCache.get(key);
  if (!cached) return null;

  if (Date.now() > cached.expiresAt) {
    edmCache.delete(key);
    return null;
  }

  console.log(`[EDM Cache] HIT: ${key}`);
  return cached.data;
}

/**
 * Set EDM in cache
 * @param {string} key - Cache key
 * @param {object} data - EDM data to cache
 * @param {number} ttl - Time to live in milliseconds (default: 1 hour)
 */
function setEdmInCache(key, data, ttl = EDM_CACHE_TTL) {
  edmCache.set(key, {
    data,
    expiresAt: Date.now() + ttl,
    createdAt: Date.now(),
  });
  console.log(`[EDM Cache] SET: ${key} (TTL: ${ttl / 1000}s)`);

  // Clean up old entries
  if (edmCache.size > 100) {
    const now = Date.now();
    for (const [k, v] of edmCache.entries()) {
      if (now > v.expiresAt) {
        edmCache.delete(k);
      }
    }
  }
}

/**
 * Generate cache key for EDM
 * @param {string} topicId - Topic ID
 * @param {Date} date - Date for the EDM (defaults to today)
 * @returns {string} Cache key
 */
function getEdmCacheKey(topicId, date = new Date()) {
  const dateKey = date.toISOString().split('T')[0];
  return `edm:${topicId}:${dateKey}`;
}

/**
 * Get cache statistics
 */
function getEdmCacheStats() {
  const now = Date.now();
  let validCount = 0;
  let expiredCount = 0;

  for (const [, v] of edmCache.entries()) {
    if (now > v.expiresAt) {
      expiredCount++;
    } else {
      validCount++;
    }
  }

  return {
    totalEntries: edmCache.size,
    validEntries: validCount,
    expiredEntries: expiredCount,
  };
}

/**
 * Generate EDM HTML
 * @param {object} input - EDM input data
 * @returns {string} Generated HTML
 */
function generateEdmHtml(input) {
  const { topicId, topicName, articles, startDate, endDate, totalArticlesThisWeek, highImportanceCount, summary, keyVisualUrl } = input;

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return `${d.getMonth() + 1}月${d.getDate()}日`;
  };
  const formatYear = (dateStr) => new Date(dateStr).getFullYear();
  const dateRangeStr = `${formatYear(endDate)}年 ${formatDate(startDate)} - ${formatDate(endDate)}`;

  const dashboardUrl = `https://dashboard.5ml.io/intelligence/dashboard?topic=${topicId}`;

  const generateKeyVisual = () => {
    if (keyVisualUrl) {
      return `
          <tr>
            <td style="padding:0;">
              <img src="${keyVisualUrl}" alt="${topicName} Weekly Brief" style="width:100%;height:auto;display:block;" />
            </td>
          </tr>`;
    }

    return `
          <tr>
            <td style="padding:0;">
              <table role="presentation" style="width:100%;border:none;border-spacing:0;background:linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0d9488 100%);">
                <tr>
                  <td style="padding:40px 30px;text-align:center;">
                    <div style="position:relative;">
                      <table role="presentation" style="width:100%;border:none;border-spacing:0;">
                        <tr>
                          <td style="text-align:center;padding-bottom:15px;">
                            <span style="display:inline-block;padding:8px 16px;background:rgba(255,255,255,0.15);border-radius:20px;color:rgba(255,255,255,0.9);font-size:12px;letter-spacing:1px;">5ML INTELLIGENCE</span>
                          </td>
                        </tr>
                      </table>
                      <h1 style="margin:0 0 10px;color:#ffffff;font-size:32px;font-weight:bold;text-shadow:0 2px 10px rgba(0,0,0,0.3);">${topicName}</h1>
                      <p style="margin:0 0 5px;color:#5eead4;font-size:18px;font-weight:600;">每週情報快報</p>
                      <table role="presentation" style="width:100%;border:none;border-spacing:0;margin-top:15px;">
                        <tr>
                          <td style="text-align:center;">
                            <span style="display:inline-block;padding:10px 20px;background:rgba(94,234,212,0.2);border:1px solid rgba(94,234,212,0.4);border-radius:25px;color:#5eead4;font-size:14px;font-weight:500;">
                              📅 ${dateRangeStr}
                            </span>
                          </td>
                        </tr>
                      </table>
                      <table role="presentation" style="width:100%;border:none;border-spacing:0;margin-top:25px;">
                        <tr>
                          <td style="text-align:center;">
                            <table role="presentation" style="margin:0 auto;border:none;border-spacing:0;">
                              <tr>
                                <td style="padding:0 15px;text-align:center;">
                                  <div style="color:#ffffff;font-size:28px;font-weight:bold;">${totalArticlesThisWeek}</div>
                                  <div style="color:rgba(255,255,255,0.7);font-size:11px;letter-spacing:0.5px;">篇文章</div>
                                </td>
                                <td style="padding:0 15px;border-left:1px solid rgba(255,255,255,0.2);text-align:center;">
                                  <div style="color:#f97316;font-size:28px;font-weight:bold;">${highImportanceCount}</div>
                                  <div style="color:rgba(255,255,255,0.7);font-size:11px;letter-spacing:0.5px;">高優先</div>
                                </td>
                                <td style="padding:0 15px;border-left:1px solid rgba(255,255,255,0.2);text-align:center;">
                                  <div style="color:#a78bfa;font-size:28px;font-weight:bold;">${articles.slice(0, 3).length}</div>
                                  <div style="color:rgba(255,255,255,0.7);font-size:11px;letter-spacing:0.5px;">精選頭條</div>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>`;
  };

  const generateSummaryHtml = () => {
    if (!summary) return '';

    let html = '';

    if (summary.overallTrend) {
      html += `
          <tr>
            <td style="padding:0 30px 20px;">
              <div style="background:linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%);border-radius:8px;padding:20px;">
                <h3 style="margin:0 0 10px;color:#ffffff;font-size:16px;font-weight:bold;">📈 本週趨勢</h3>
                <p style="margin:0;color:rgba(255,255,255,0.95);font-size:14px;line-height:1.6;">${summary.overallTrend}</p>
              </div>
            </td>
          </tr>`;
    }

    if (summary.breakingNews && summary.breakingNews.length > 0) {
      html += `
          <tr>
            <td style="padding:0 30px 20px;">
              <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:20px;">
                <h3 style="margin:0 0 15px;color:#dc2626;font-size:16px;font-weight:bold;">⚡ 重要快訊</h3>
                <ul style="margin:0;padding:0 0 0 20px;color:#7f1d1d;font-size:14px;line-height:1.8;">
                  ${summary.breakingNews.slice(0, 3).map(item => `<li style="margin-bottom:8px;">${typeof item === 'string' ? item : item.text || ''}</li>`).join('')}
                </ul>
              </div>
            </td>
          </tr>`;
    }

    if (summary.practicalTips && summary.practicalTips.length > 0) {
      html += `
          <tr>
            <td style="padding:0 30px 20px;">
              <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:20px;">
                <h3 style="margin:0 0 15px;color:#d97706;font-size:16px;font-weight:bold;">💡 實用建議</h3>
                <ul style="margin:0;padding:0 0 0 20px;color:#78350f;font-size:14px;line-height:1.8;">
                  ${summary.practicalTips.slice(0, 3).map(item => `<li style="margin-bottom:8px;">${typeof item === 'string' ? item : item.text || ''}</li>`).join('')}
                </ul>
              </div>
            </td>
          </tr>`;
    }

    if (summary.keyPoints && summary.keyPoints.length > 0) {
      html += `
          <tr>
            <td style="padding:0 30px 20px;">
              <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:20px;">
                <h3 style="margin:0 0 15px;color:#1d4ed8;font-size:16px;font-weight:bold;">📋 重點摘要</h3>
                <ul style="margin:0;padding:0 0 0 20px;color:#1e3a8a;font-size:14px;line-height:1.8;">
                  ${summary.keyPoints.slice(0, 4).map(item => `<li style="margin-bottom:8px;">${typeof item === 'string' ? item : item.text || ''}</li>`).join('')}
                </ul>
              </div>
            </td>
          </tr>`;
    }

    return html;
  };

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${topicName} 每週情報</title>
</head>
<body style="margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;background-color:#f4f4f4;">
  <table role="presentation" style="width:100%;border:none;border-spacing:0;">
    <tr>
      <td align="center" style="padding:20px 0;">
        <table role="presentation" style="width:600px;border:none;border-spacing:0;background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1);">

          ${generateKeyVisual()}

          <tr>
            <td style="padding:25px 30px 15px;">
              <p style="margin:0;color:#64748b;font-size:15px;line-height:1.6;">
                👋 嗨！這是你的每週情報摘要，涵蓋 <strong style="color:#0d9488;">${topicName}</strong> 的最新動態。
                我們已經幫你分析好了，重點都在這裡，喝杯咖啡慢慢看吧！
              </p>
            </td>
          </tr>

          ${generateSummaryHtml()}

          ${summary ? `
          <tr>
            <td style="padding:10px 30px 20px;">
              <div style="border-bottom:2px solid #e2e8f0;"></div>
              <p style="margin:15px 0 0;color:#94a3b8;font-size:13px;text-align:center;">📰 本週精選文章</p>
            </td>
          </tr>
          ` : ''}

          ${articles.slice(0, 3).map((article, i) => `
          <tr>
            <td style="padding:0 30px 20px;">
              <table style="width:100%;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
                <tr>
                  <td style="padding:20px;">
                    <div style="display:flex;align-items:center;margin-bottom:10px;">
                      <span style="display:inline-block;padding:4px 10px;background:linear-gradient(135deg, #0d9488 0%, #14b8a6 100%);color:#fff;font-size:11px;font-weight:bold;border-radius:4px;">精選 #${i + 1}</span>
                    </div>
                    <h3 style="margin:10px 0;color:#1e293b;font-size:16px;line-height:1.4;">${article.title}</h3>
                    <p style="margin:0 0 15px;color:#64748b;font-size:14px;line-height:1.5;">${article.content_summary}</p>
                    <table style="width:100%;margin-bottom:15px;">
                      <tr>
                        <td style="color:#94a3b8;font-size:12px;">
                          📊 重要性：<span style="color:#0d9488;font-weight:bold;">${article.importance_score}/100</span>
                        </td>
                        <td style="color:#94a3b8;font-size:12px;text-align:right;">
                          👤 ${article.source_name}
                        </td>
                      </tr>
                    </table>
                    <a href="${article.source_url}" style="display:inline-block;padding:10px 24px;background:linear-gradient(135deg, #0d9488 0%, #14b8a6 100%);color:#ffffff;text-decoration:none;border-radius:6px;font-size:14px;font-weight:500;">閱讀全文 →</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          `).join('')}

          ${articles.length > 3 ? `
          <tr>
            <td style="padding:0 30px 30px;">
              <h3 style="margin:0 0 15px;color:#1e293b;font-size:18px;">📚 本週更多文章</h3>
              ${articles.slice(3).map(article => `
              <div style="padding:15px 0;border-bottom:1px solid #e2e8f0;">
                <a href="${article.source_url}" style="color:#1e293b;text-decoration:none;font-size:14px;font-weight:600;line-height:1.4;display:block;">${article.title}</a>
                <p style="margin:5px 0 0;color:#94a3b8;font-size:12px;">
                  ${article.source_name} • 重要性：${article.importance_score}/100
                  ${article.tags && article.tags.length > 0 ? ` • ${article.tags.slice(0, 2).join(', ')}` : ''}
                </p>
              </div>
              `).join('')}
            </td>
          </tr>
          ` : ''}

          <tr>
            <td style="padding:30px;background-color:#f8fafc;text-align:center;">
              <p style="margin:0 0 15px;color:#64748b;font-size:14px;">想了解更多？</p>
              <a href="${dashboardUrl}" style="display:inline-block;padding:15px 40px;background:linear-gradient(135deg, #0d9488 0%, #14b8a6 100%);color:#ffffff;text-decoration:none;border-radius:8px;font-size:16px;font-weight:bold;box-shadow:0 4px 12px rgba(13,148,136,0.3);">探索更多新聞 →</a>
            </td>
          </tr>

          <tr>
            <td style="padding:30px;text-align:center;border-top:1px solid #e2e8f0;">
              <p style="margin:0 0 10px;color:#94a3b8;font-size:12px;">
                您收到此郵件是因為您訂閱了 ${topicName} 的情報更新。
              </p>
              <p style="margin:0;color:#94a3b8;font-size:12px;">
                <a href="#" style="color:#64748b;">取消訂閱</a> | <a href="#" style="color:#64748b;">管理偏好設定</a>
              </p>
              <p style="margin:15px 0 0;color:#cbd5e1;font-size:11px;">© 2026 5ML. 保留所有權利。</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

module.exports = {
  EDM_CACHE_TTL,
  getEdmFromCache,
  setEdmInCache,
  getEdmCacheKey,
  getEdmCacheStats,
  generateEdmHtml,
};
