/**
 * Topic Intelligence Use Case
 * Entry point for the topic-based news intelligence system
 */

// L2: Tools
export * from './tools';

// L3: Agents
export * from './agents';

// L4: Knowledge
export { TopicDatabaseInitializer, createTopicDatabaseInitializer } from './scripts/init-topic-databases';

// L5: Workflows
export * from './workflows';

// L6: Orchestration
export {
  TopicBasedNewsOrchestrator,
  createTopicNewsOrchestrator,
  type Topic,
  type HealthStatus,
  type OrchestratorConfig,
} from './orchestration/topic-news-orchestrator';

// L7: WebSocket
export {
  ScanWebSocketServer,
  createScanWebSocketServer,
  getScanWebSocketServer,
} from './websocket/scan-server';

// API
export { getRouter, initializeOrchestrator } from './api/routes';
