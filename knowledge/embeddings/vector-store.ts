/**
 * Layer 4: Knowledge Management - Vector Store
 * Handles storage and retrieval of vector embeddings
 * Supports PostgreSQL with pgvector extension or Redis
 */

import { Pool } from 'pg';
import { KnowledgeDocument, VectorSearchQuery, VectorSearchResult, VectorFilter } from '../schema/knowledge-types';
import { EmbeddingService } from './embedding-service';

export class VectorStore {
  private pool: Pool | null = null;
  private useRedis: boolean = false;
  private inMemoryStore: Map<string, { document: KnowledgeDocument; embedding: number[] }> = new Map();

  constructor(databaseUrl?: string) {
    if (databaseUrl) {
      this.pool = new Pool({
        connectionString: databaseUrl,
        ssl: databaseUrl.includes('localhost') ? false : { rejectUnauthorized: false },
      });
    } else {
      console.log('⚠️ No database URL provided, using in-memory vector store');
      // Fallback to in-memory storage for development
      this.useRedis = false;
    }
  }

  /**
   * Initialize vector store and create necessary tables/indexes
   */
  async initialize(): Promise<void> {
    if (!this.pool) {
      console.log('Using in-memory vector store (no persistence)');
      return;
    }

    try {
      // Create pgvector extension if not exists
      await this.pool.query('CREATE EXTENSION IF NOT EXISTS vector;');

      // Create knowledge documents table with vector support
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS knowledge_documents (
          id VARCHAR(255) PRIMARY KEY,
          title TEXT NOT NULL,
          content TEXT NOT NULL,
          metadata JSONB NOT NULL,
          embedding vector(384),
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `);

      // Create index for vector similarity search
      await this.pool.query(`
        CREATE INDEX IF NOT EXISTS knowledge_documents_embedding_idx
        ON knowledge_documents
        USING ivfflat (embedding vector_cosine_ops)
        WITH (lists = 100);
      `);

      // Create GIN index for metadata search
      await this.pool.query(`
        CREATE INDEX IF NOT EXISTS knowledge_documents_metadata_idx
        ON knowledge_documents
        USING GIN (metadata);
      `);

      console.log('✅ Vector store initialized with pgvector');
    } catch (error: any) {
      console.error('Failed to initialize vector store:', error.message);
      console.log('⚠️ Falling back to in-memory vector store');
      this.pool = null;
    }
  }

  /**
   * Store a document with its embedding
   */
  async storeDocument(document: KnowledgeDocument, embedding: number[]): Promise<void> {
    if (!this.pool) {
      // In-memory storage
      this.inMemoryStore.set(document.id, { document, embedding });
      return;
    }

    try {
      await this.pool.query(
        `INSERT INTO knowledge_documents
         (id, title, content, metadata, embedding, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id)
         DO UPDATE SET
           title = EXCLUDED.title,
           content = EXCLUDED.content,
           metadata = EXCLUDED.metadata,
           embedding = EXCLUDED.embedding,
           updated_at = EXCLUDED.updated_at`,
        [
          document.id,
          document.title,
          document.content,
          JSON.stringify(document.metadata),
          `[${embedding.join(',')}]`,
          document.createdAt,
          document.updatedAt,
        ]
      );
    } catch (error: any) {
      throw new Error(`Failed to store document: ${error.message}`);
    }
  }

  /**
   * Store multiple documents in batch
   */
  async storeDocuments(documents: KnowledgeDocument[], embeddings: number[][]): Promise<void> {
    if (documents.length !== embeddings.length) {
      throw new Error('Documents and embeddings arrays must have the same length');
    }

    for (let i = 0; i < documents.length; i++) {
      await this.storeDocument(documents[i], embeddings[i]);
    }
  }

  /**
   * Search for similar documents using vector similarity
   */
  async search(query: VectorSearchQuery, queryEmbedding: number[]): Promise<VectorSearchResult[]> {
    const topK = query.topK || 5;
    const threshold = query.threshold || 0.7;

    if (!this.pool) {
      // In-memory search
      return this.inMemorySearch(queryEmbedding, topK, threshold, query.filter);
    }

    try {
      let sql = `
        SELECT
          id, title, content, metadata,
          1 - (embedding <=> $1) as similarity
        FROM knowledge_documents
        WHERE 1 - (embedding <=> $1) > $2
      `;

      const params: any[] = [`[${queryEmbedding.join(',')}]`, threshold];
      let paramIndex = 3;

      // Add metadata filters
      if (query.filter) {
        if (query.filter.source && query.filter.source.length > 0) {
          sql += ` AND metadata->>'source' = ANY($${paramIndex})`;
          params.push(query.filter.source);
          paramIndex++;
        }

        if (query.filter.tags && query.filter.tags.length > 0) {
          sql += ` AND metadata->'tags' ?| $${paramIndex}`;
          params.push(query.filter.tags);
          paramIndex++;
        }
      }

      sql += ` ORDER BY similarity DESC LIMIT $${paramIndex}`;
      params.push(topK);

      const result = await this.pool.query(sql, params);

      return result.rows.map(row => ({
        document: {
          id: row.id,
          title: row.title,
          content: row.content,
          metadata: row.metadata,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        },
        score: row.similarity,
      }));
    } catch (error: any) {
      throw new Error(`Vector search failed: ${error.message}`);
    }
  }

  /**
   * In-memory search fallback
   */
  private inMemorySearch(
    queryEmbedding: number[],
    topK: number,
    threshold: number,
    filter?: VectorFilter
  ): VectorSearchResult[] {
    const results: VectorSearchResult[] = [];

    for (const [id, { document, embedding }] of this.inMemoryStore.entries()) {
      // Apply filters
      if (filter) {
        if (filter.source && !filter.source.includes(document.metadata.source)) {
          continue;
        }
        if (filter.tags && filter.tags.length > 0) {
          const docTags = document.metadata.tags || [];
          const hasTag = filter.tags.some(tag => docTags.includes(tag));
          if (!hasTag) continue;
        }
      }

      const similarity = EmbeddingService.cosineSimilarity(queryEmbedding, embedding);

      if (similarity >= threshold) {
        results.push({ document, score: similarity });
      }
    }

    // Sort by score descending and take top K
    results.sort((a, b) => b.score - a.score);
    return results.slice(0, topK);
  }

  /**
   * Get a document by ID
   */
  async getDocument(id: string): Promise<KnowledgeDocument | null> {
    if (!this.pool) {
      const item = this.inMemoryStore.get(id);
      return item ? item.document : null;
    }

    try {
      const result = await this.pool.query(
        'SELECT * FROM knowledge_documents WHERE id = $1',
        [id]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return {
        id: row.id,
        title: row.title,
        content: row.content,
        metadata: row.metadata,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    } catch (error: any) {
      throw new Error(`Failed to get document: ${error.message}`);
    }
  }

  /**
   * Delete a document
   */
  async deleteDocument(id: string): Promise<boolean> {
    if (!this.pool) {
      return this.inMemoryStore.delete(id);
    }

    try {
      const result = await this.pool.query(
        'DELETE FROM knowledge_documents WHERE id = $1',
        [id]
      );
      return result.rowCount ? result.rowCount > 0 : false;
    } catch (error: any) {
      throw new Error(`Failed to delete document: ${error.message}`);
    }
  }

  /**
   * Get total document count
   */
  async getDocumentCount(): Promise<number> {
    if (!this.pool) {
      return this.inMemoryStore.size;
    }

    try {
      const result = await this.pool.query('SELECT COUNT(*) FROM knowledge_documents');
      return parseInt(result.rows[0].count);
    } catch (error: any) {
      throw new Error(`Failed to get document count: ${error.message}`);
    }
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
    }
  }
}

export default VectorStore;
