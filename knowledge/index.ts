/**
 * Layer 4: Knowledge Management
 * Main entry point for the knowledge management system
 */

// Schema and types
export * from './schema/knowledge-types';

// Connectors
export * from './connectors';

// Embeddings and search
export * from './embeddings';

// Main Knowledge Management orchestrator
import { SemanticSearch } from './embeddings/semantic-search';
import { NotionConnector, WebCrawler, PDFParser, EmailParser } from './connectors';
import { EmbeddingService } from './embeddings/embedding-service';
import { VectorStore } from './embeddings/vector-store';
import {
  KnowledgeDocument,
  KnowledgeConnectorConfig,
  EmbeddingConfig,
  SyncResult,
} from './schema/knowledge-types';

export class KnowledgeManager {
  private semanticSearch: SemanticSearch;
  private embeddingService: EmbeddingService;
  private vectorStore: VectorStore;
  private connectors: Map<string, any> = new Map();

  constructor(
    embeddingConfig: EmbeddingConfig,
    databaseUrl?: string
  ) {
    this.embeddingService = new EmbeddingService(embeddingConfig);
    this.vectorStore = new VectorStore(databaseUrl);
    this.semanticSearch = new SemanticSearch(embeddingConfig, databaseUrl);
  }

  /**
   * Initialize the knowledge management system
   */
  async initialize(): Promise<void> {
    await this.semanticSearch.initialize();
    console.log('✅ Knowledge Management System initialized');
  }

  /**
   * Register a knowledge connector
   */
  registerConnector(name: string, connector: any): void {
    this.connectors.set(name, connector);
  }

  /**
   * Sync knowledge from a specific connector
   */
  async syncConnector(connectorName: string): Promise<SyncResult> {
    const connector = this.connectors.get(connectorName);
    if (!connector) {
      throw new Error(`Connector ${connectorName} not found`);
    }

    return await connector.sync();
  }

  /**
   * Sync all registered connectors
   */
  async syncAll(): Promise<Record<string, SyncResult>> {
    const results: Record<string, SyncResult> = {};

    for (const [name, connector] of this.connectors.entries()) {
      try {
        results[name] = await connector.sync();
      } catch (error: any) {
        results[name] = {
          success: false,
          documentsAdded: 0,
          documentsUpdated: 0,
          documentsFailed: 0,
          errors: [error.message],
        };
      }
    }

    return results;
  }

  /**
   * Add a document to the knowledge base
   */
  async addDocument(document: KnowledgeDocument): Promise<void> {
    const embedding = await this.embeddingService.generateEmbedding(document.content);
    await this.vectorStore.storeDocument(document, embedding);
  }

  /**
   * Search the knowledge base
   */
  async search(query: string, options?: any) {
    return await this.semanticSearch.search(query, options);
  }

  /**
   * Get knowledge base statistics
   */
  async getStats() {
    return await this.semanticSearch.getStats();
  }

  /**
   * Close all connections
   */
  async close(): Promise<void> {
    await this.semanticSearch.close();
  }
}
