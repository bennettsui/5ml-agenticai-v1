/**
 * Layer 4: Knowledge Management - Semantic Search
 * High-level API for semantic search across knowledge base
 */

import { EmbeddingService } from './embedding-service';
import { VectorStore } from './vector-store';
import { VectorSearchQuery, VectorSearchResult, EmbeddingConfig } from '../schema/knowledge-types';

export class SemanticSearch {
  private embeddingService: EmbeddingService;
  private vectorStore: VectorStore;

  constructor(embeddingConfig: EmbeddingConfig, databaseUrl?: string) {
    this.embeddingService = new EmbeddingService(embeddingConfig);
    this.vectorStore = new VectorStore(databaseUrl);
  }

  /**
   * Initialize the search system
   */
  async initialize(): Promise<void> {
    await this.vectorStore.initialize();
    console.log('✅ Semantic search system initialized');
  }

  /**
   * Search for relevant documents using natural language query
   */
  async search(query: string, options?: Partial<VectorSearchQuery>): Promise<VectorSearchResult[]> {
    if (!query || query.trim().length === 0) {
      throw new Error('Search query cannot be empty');
    }

    try {
      // Generate embedding for the query
      const queryEmbedding = await this.embeddingService.generateEmbedding(query);

      // Build search query
      const searchQuery: VectorSearchQuery = {
        query,
        topK: options?.topK || 5,
        threshold: options?.threshold || 0.7,
        filter: options?.filter,
      };

      // Perform vector search
      const results = await this.vectorStore.search(searchQuery, queryEmbedding);

      // Enhance results with relevance reasoning
      return results.map(result => ({
        ...result,
        relevanceReason: this.generateRelevanceReason(query, result),
      }));
    } catch (error: any) {
      throw new Error(`Semantic search failed: ${error.message}`);
    }
  }

  /**
   * Get similar documents to a given document ID
   */
  async findSimilar(documentId: string, topK: number = 5): Promise<VectorSearchResult[]> {
    try {
      const document = await this.vectorStore.getDocument(documentId);
      if (!document) {
        throw new Error(`Document ${documentId} not found`);
      }

      // Use document content as query
      return this.search(document.content, { topK: topK + 1 }).then(results =>
        // Exclude the original document
        results.filter(r => r.document.id !== documentId).slice(0, topK)
      );
    } catch (error: any) {
      throw new Error(`Failed to find similar documents: ${error.message}`);
    }
  }

  /**
   * Search with context-aware re-ranking
   */
  async searchWithContext(
    query: string,
    context: string[],
    options?: Partial<VectorSearchQuery>
  ): Promise<VectorSearchResult[]> {
    // Enhance query with context
    const enhancedQuery = `${query}\n\nContext:\n${context.join('\n')}`;
    return this.search(enhancedQuery, options);
  }

  /**
   * Multi-query search (searches multiple queries and merges results)
   */
  async multiSearch(queries: string[], options?: Partial<VectorSearchQuery>): Promise<VectorSearchResult[]> {
    const allResults = await Promise.all(
      queries.map(query => this.search(query, options))
    );

    // Merge and deduplicate results
    const mergedResults = new Map<string, VectorSearchResult>();

    for (const results of allResults) {
      for (const result of results) {
        const existing = mergedResults.get(result.document.id);
        if (!existing || result.score > existing.score) {
          mergedResults.set(result.document.id, result);
        }
      }
    }

    // Sort by score and return
    return Array.from(mergedResults.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, options?.topK || 10);
  }

  /**
   * Generate a simple relevance reason
   */
  private generateRelevanceReason(query: string, result: VectorSearchResult): string {
    const score = result.score;
    if (score >= 0.9) {
      return 'Highly relevant match';
    } else if (score >= 0.8) {
      return 'Strong semantic similarity';
    } else if (score >= 0.7) {
      return 'Moderate relevance';
    } else {
      return 'Potentially relevant';
    }
  }

  /**
   * Get statistics about the knowledge base
   */
  async getStats(): Promise<{
    totalDocuments: number;
    sources: Record<string, number>;
  }> {
    const totalDocuments = await this.vectorStore.getDocumentCount();

    return {
      totalDocuments,
      sources: {},
    };
  }

  /**
   * Close connections
   */
  async close(): Promise<void> {
    await this.vectorStore.close();
  }
}

export default SemanticSearch;
