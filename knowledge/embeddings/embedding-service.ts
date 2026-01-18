/**
 * Layer 4: Knowledge Management - Embedding Service
 * Handles text vectorization for semantic search
 */

import axios from 'axios';
import { EmbeddingConfig } from '../schema/knowledge-types';

export class EmbeddingService {
  private config: EmbeddingConfig;

  constructor(config: EmbeddingConfig) {
    this.config = config;
  }

  /**
   * Generate embeddings for a single text
   */
  async generateEmbedding(text: string): Promise<number[]> {
    if (!text || text.trim().length === 0) {
      throw new Error('Text cannot be empty');
    }

    switch (this.config.provider) {
      case 'openai':
        return this.generateOpenAIEmbedding(text);
      case 'anthropic':
        return this.generateAnthropicEmbedding(text);
      case 'local':
        return this.generateLocalEmbedding(text);
      default:
        throw new Error(`Unsupported embedding provider: ${this.config.provider}`);
    }
  }

  /**
   * Generate embeddings for multiple texts in batches
   */
  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    const batchSize = this.config.batchSize || 10;
    const results: number[][] = [];

    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const batchEmbeddings = await Promise.all(
        batch.map(text => this.generateEmbedding(text))
      );
      results.push(...batchEmbeddings);
    }

    return results;
  }

  /**
   * OpenAI embeddings using text-embedding-3-small
   */
  private async generateOpenAIEmbedding(text: string): Promise<number[]> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    try {
      const response = await axios.post(
        'https://api.openai.com/v1/embeddings',
        {
          input: text,
          model: this.config.model || 'text-embedding-3-small',
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      );

      return response.data.data[0].embedding;
    } catch (error: any) {
      throw new Error(`OpenAI embedding failed: ${error.message}`);
    }
  }

  /**
   * Anthropic embeddings (placeholder - not yet available)
   */
  private async generateAnthropicEmbedding(text: string): Promise<number[]> {
    throw new Error('Anthropic embeddings not yet available');
  }

  /**
   * Local embeddings using simple TF-IDF approximation
   * Note: This is a placeholder. In production, use sentence-transformers or similar
   */
  private async generateLocalEmbedding(text: string): Promise<number[]> {
    // Simple hash-based embedding for demo purposes
    // In production, replace with actual local model (e.g., sentence-transformers)
    const dimensions = this.config.dimensions || 384;
    const embedding = new Array(dimensions).fill(0);

    // Simple character-based hash
    for (let i = 0; i < text.length; i++) {
      const charCode = text.charCodeAt(i);
      embedding[i % dimensions] += charCode;
    }

    // Normalize
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map(val => val / magnitude);
  }

  /**
   * Calculate cosine similarity between two embeddings
   */
  static cosineSimilarity(embeddingA: number[], embeddingB: number[]): number {
    if (embeddingA.length !== embeddingB.length) {
      throw new Error('Embeddings must have the same dimensions');
    }

    let dotProduct = 0;
    let magnitudeA = 0;
    let magnitudeB = 0;

    for (let i = 0; i < embeddingA.length; i++) {
      dotProduct += embeddingA[i] * embeddingB[i];
      magnitudeA += embeddingA[i] * embeddingA[i];
      magnitudeB += embeddingB[i] * embeddingB[i];
    }

    magnitudeA = Math.sqrt(magnitudeA);
    magnitudeB = Math.sqrt(magnitudeB);

    if (magnitudeA === 0 || magnitudeB === 0) {
      return 0;
    }

    return dotProduct / (magnitudeA * magnitudeB);
  }

  /**
   * Chunk text into smaller pieces for better embeddings
   */
  static chunkText(text: string, maxChunkSize = 500, overlap = 50): string[] {
    const words = text.split(/\s+/);
    const chunks: string[] = [];

    for (let i = 0; i < words.length; i += maxChunkSize - overlap) {
      const chunk = words.slice(i, i + maxChunkSize).join(' ');
      if (chunk.trim()) {
        chunks.push(chunk);
      }
    }

    return chunks;
  }
}

export default EmbeddingService;
