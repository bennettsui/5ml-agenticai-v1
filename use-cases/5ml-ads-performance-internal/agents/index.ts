/**
 * Layer 3: Agents - Exports
 * All 8 specialized agents for ads performance intelligence
 */

// Base agent class
export * from './base-agent';

// Data Fetcher Agents
export * from './meta-data-fetcher';
export * from './google-data-fetcher';

// Processing Agents
export * from './normalizer-agent';

// Analysis Agents
export * from './anomaly-detector';
export * from './funnel-analyzer';
export * from './budget-planner';

// Report Generation Agents
export * from './recommendation-writer';
export * from './internal-strategy';

// Agent factory
import { MetaDataFetcherAgent, createMetaDataFetcherAgent } from './meta-data-fetcher';
import { GoogleDataFetcherAgent, createGoogleDataFetcherAgent } from './google-data-fetcher';
import { NormalizerAgent, createNormalizerAgent } from './normalizer-agent';
import { AnomalyDetectorAgent, createAnomalyDetectorAgent } from './anomaly-detector';
import { FunnelAnalyzerAgent, createFunnelAnalyzerAgent } from './funnel-analyzer';
import { BudgetPlannerAgent, createBudgetPlannerAgent } from './budget-planner';
import { RecommendationWriterAgent, createRecommendationWriterAgent } from './recommendation-writer';
import { InternalStrategyAgent, createInternalStrategyAgent } from './internal-strategy';

export type AgentType =
  | 'meta-data-fetcher'
  | 'google-data-fetcher'
  | 'normalizer'
  | 'anomaly-detector'
  | 'funnel-analyzer'
  | 'budget-planner'
  | 'recommendation-writer'
  | 'internal-strategy';

export interface AgentRegistry {
  'meta-data-fetcher': MetaDataFetcherAgent;
  'google-data-fetcher': GoogleDataFetcherAgent;
  'normalizer': NormalizerAgent;
  'anomaly-detector': AnomalyDetectorAgent;
  'funnel-analyzer': FunnelAnalyzerAgent;
  'budget-planner': BudgetPlannerAgent;
  'recommendation-writer': RecommendationWriterAgent;
  'internal-strategy': InternalStrategyAgent;
}

/**
 * Create an agent by type
 */
export function createAgent<T extends AgentType>(type: T): AgentRegistry[T] {
  switch (type) {
    case 'meta-data-fetcher':
      return createMetaDataFetcherAgent() as AgentRegistry[T];
    case 'google-data-fetcher':
      return createGoogleDataFetcherAgent() as AgentRegistry[T];
    case 'normalizer':
      return createNormalizerAgent() as AgentRegistry[T];
    case 'anomaly-detector':
      return createAnomalyDetectorAgent() as AgentRegistry[T];
    case 'funnel-analyzer':
      return createFunnelAnalyzerAgent() as AgentRegistry[T];
    case 'budget-planner':
      return createBudgetPlannerAgent() as AgentRegistry[T];
    case 'recommendation-writer':
      return createRecommendationWriterAgent() as AgentRegistry[T];
    case 'internal-strategy':
      return createInternalStrategyAgent() as AgentRegistry[T];
    default:
      throw new Error(`Unknown agent type: ${type}`);
  }
}

/**
 * Get all available agent types
 */
export function getAgentTypes(): AgentType[] {
  return [
    'meta-data-fetcher',
    'google-data-fetcher',
    'normalizer',
    'anomaly-detector',
    'funnel-analyzer',
    'budget-planner',
    'recommendation-writer',
    'internal-strategy',
  ];
}
