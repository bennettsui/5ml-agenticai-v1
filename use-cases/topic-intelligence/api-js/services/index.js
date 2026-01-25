/**
 * Services Index for Topic Intelligence
 * Exports all services from a single entry point
 */

const llmService = require('./llmService');
const contentService = require('./contentService');
const edmService = require('./edmService');

module.exports = {
  // LLM Service
  LLM_CONFIGS: llmService.LLM_CONFIGS,
  getLLMConfig: llmService.getLLMConfig,
  callLLM: llmService.callLLM,
  parseJSONResponse: llmService.parseJSONResponse,
  getAvailableLLMs: llmService.getAvailableLLMs,
  getLLMStatus: llmService.getLLMStatus,

  // Content Service
  fetchPageContent: contentService.fetchPageContent,
  extractArticleLinks: contentService.extractArticleLinks,
  analyzeArticleContent: contentService.analyzeArticleContent,
  generateKeywordBasedAnalysis: contentService.generateKeywordBasedAnalysis,
  sleep: contentService.sleep,

  // EDM Service
  EDM_CACHE_TTL: edmService.EDM_CACHE_TTL,
  getEdmFromCache: edmService.getEdmFromCache,
  setEdmInCache: edmService.setEdmInCache,
  getEdmCacheKey: edmService.getEdmCacheKey,
  getEdmCacheStats: edmService.getEdmCacheStats,
  generateEdmHtml: edmService.generateEdmHtml,
};
