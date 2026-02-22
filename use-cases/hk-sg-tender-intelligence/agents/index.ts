/**
 * HK+SG Tender Intelligence Layer — Agent Registry
 *
 * Agents are listed in pipeline execution order.
 * Each agent file contains the full role definition, I/O spec, and logic.
 */

export { SourceDiscoveryAgent } from './source-discovery-agent';
export { SourceValidatorAgent } from './source-validator-agent';
export { RSSXMLIngestorAgent } from './rss-xml-ingestor-agent';
export { HTMLScraperAgent } from './html-scraper-agent';
export { CSVIngestorAgent } from './csv-ingestor-agent';
export { TenderNormalizerAgent } from './tender-normalizer-agent';
export { DeduplicationAgent } from './deduplication-agent';
export { TenderEvaluatorAgent } from './tender-evaluator-agent';
export { FeedbackLearningAgent } from './feedback-learning-agent';
export { DigestGeneratorAgent } from './digest-generator-agent';
