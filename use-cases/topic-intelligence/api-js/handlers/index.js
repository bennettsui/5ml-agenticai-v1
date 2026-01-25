/**
 * Handlers Index for Topic Intelligence
 * Exports all handlers from a single entry point
 */

const topicHandlers = require('./topicHandlers');
const sourceHandlers = require('./sourceHandlers');
const scanHandlers = require('./scanHandlers');

/**
 * Register all handlers with a router
 * @param {Router} router - Express router
 */
function registerAllRoutes(router) {
  topicHandlers.registerRoutes(router);
  sourceHandlers.registerRoutes(router);
  scanHandlers.registerRoutes(router);
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

  // Utilities
  generateMockSources: sourceHandlers.generateMockSources,

  // Shared storage
  inMemoryTopics: topicHandlers.inMemoryTopics,
  inMemorySources: topicHandlers.inMemorySources,

  // Route registration
  registerAllRoutes,
};
