/**
 * Layer 4: Knowledge Management - Type Definitions
 * Defines the schema and types for the knowledge management system
 */

export interface KnowledgeDocument {
  id: string;
  title: string;
  content: string;
  metadata: DocumentMetadata;
  embeddings?: number[];
  createdAt: Date;
  updatedAt: Date;
}

export interface DocumentMetadata {
  source: KnowledgeSource;
  sourceId: string;
  sourceUrl?: string;
  author?: string;
  tags?: string[];
  category?: string;
  language?: string;
  customFields?: Record<string, any>;
}

export enum KnowledgeSource {
  NOTION = 'notion',
  WEB = 'web',
  PDF = 'pdf',
  EMAIL = 'email',
  DATABASE = 'database',
  API = 'api',
}

export interface EmbeddingConfig {
  provider: 'openai' | 'anthropic' | 'local';
  model: string;
  dimensions: number;
  batchSize?: number;
}

export interface VectorSearchQuery {
  query: string;
  topK?: number;
  filter?: VectorFilter;
  threshold?: number;
}

export interface VectorFilter {
  source?: KnowledgeSource[];
  tags?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  customFilters?: Record<string, any>;
}

export interface VectorSearchResult {
  document: KnowledgeDocument;
  score: number;
  relevanceReason?: string;
}

export interface KnowledgeConnectorConfig {
  type: KnowledgeSource;
  credentials: Record<string, string>;
  options?: Record<string, any>;
}

export interface SyncResult {
  success: boolean;
  documentsAdded: number;
  documentsUpdated: number;
  documentsFailed: number;
  errors?: string[];
}
