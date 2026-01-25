/**
 * Handlers Index for Topic Intelligence
 * Exports all handlers from a single entry point
 */

const topicHandlers = require('./topicHandlers');
const sourceHandlers = require('./sourceHandlers');
const scanHandlers = require('./scanHandlers');
const summarizeHandlers = require('./summarizeHandlers');
const newsHandlers = require('./newsHandlers');
const edmHandlers = require('./edmHandlers');

/**
 * Register all handlers with a router
 * @param {Router} router - Express router
 */
function registerAllRoutes(router) {
  topicHandlers.registerRoutes(router);
  sourceHandlers.registerRoutes(router);
  scanHandlers.registerRoutes(router);
  summarizeHandlers.registerRoutes(router);
  newsHandlers.registerRoutes(router);
  edmHandlers.registerRoutes(router);
}

module.exports = {
  // Topic handlers
  createTopic: topicHandlers.createTopic,
  listTopics: topicHandlers.listTopics,
  getTopic: topicHandlers.getTopic,
  updateTopic: topicHandlers.updateTopic,
  deleteTopic: topicHandlers.deleteTopic,
  pauseTopic: topicHandlers.pauseTopic,
  resumeTopic: topicHandlers.resumeTopic,

  // Source handlers
  discoverSources: sourceHandlers.discoverSources,
  getTopicSources: sourceHandlers.getTopicSources,
  addTopicSources: sourceHandlers.addTopicSources,
  deleteSource: sourceHandlers.deleteSource,
  removeTopicSource: sourceHandlers.removeTopicSource,

  // Scan handlers
  startScan: scanHandlers.startScan,
  runScanWithUpdates: scanHandlers.runScanWithUpdates,
  runScheduledScan: scanHandlers.runScheduledScan,

  // Summarize handlers
  summarize: summarizeHandlers.summarize,
  getSummaries: summarizeHandlers.getSummaries,
  generateNewsSummary: summarizeHandlers.generateNewsSummary,

  // News handlers
  getNews: newsHandlers.getNews,
  generateMockNews: newsHandlers.generateMockNews,

  // EDM handlers
  getEdmPreview: edmHandlers.getEdmPreview,
  sendEdm: edmHandlers.sendEdm,
  getEdmHistory: edmHandlers.getEdmHistory,

  // Utilities
  generateMockSources: sourceHandlers.generateMockSources,

  // Shared storage
  inMemoryTopics: topicHandlers.inMemoryTopics,
  inMemorySources: topicHandlers.inMemorySources,

  // Route registration
  registerAllRoutes,
};
