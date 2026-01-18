# Layer 4: Knowledge Management

The Knowledge Management layer provides intelligent document ingestion, vectorization, and semantic search capabilities for the 5ML Agentic AI Platform.

## Overview

This layer enables the platform to:
- **Ingest** knowledge from multiple sources (Notion, Web, PDF, Email)
- **Vectorize** content using embeddings for semantic understanding
- **Search** using natural language queries with relevance ranking
- **Store** knowledge with metadata in PostgreSQL with pgvector

## Architecture

```
knowledge/
├── connectors/          # Knowledge source integrations
│   ├── notion-connector.ts     # Notion workspace integration
│   ├── web-crawler.ts          # Web content crawler
│   ├── pdf-parser.ts           # PDF document parser
│   └── email-parser.ts         # Email integration (Gmail/IMAP)
├── embeddings/         # Vector embeddings & search
│   ├── embedding-service.ts    # Text vectorization
│   ├── vector-store.ts         # Vector database operations
│   └── semantic-search.ts      # High-level search API
├── schema/             # Type definitions
│   └── knowledge-types.ts      # TypeScript interfaces
└── index.ts            # Main KnowledgeManager class
```

## Features

### 1. Multi-Source Connectors

#### Notion Connector
```typescript
import { NotionConnector } from './connectors';

const notion = new NotionConnector({
  apiKey: process.env.NOTION_API_KEY!,
  databaseId: 'xxx-yyy-zzz',
  pageIds: ['page-1', 'page-2'],
});

const result = await notion.sync();
```

#### Web Crawler
```typescript
import { WebCrawler } from './connectors';

const crawler = new WebCrawler({
  urls: ['https://example.com'],
  maxDepth: 2,
  followLinks: true,
  allowedDomains: ['example.com'],
});

const result = await crawler.sync();
```

#### PDF Parser
```typescript
import { PDFParser } from './connectors';

const parser = new PDFParser({
  filePaths: ['/path/to/document.pdf'],
});

const result = await parser.sync();
```

#### Email Parser (Gmail)
```typescript
import { EmailParser } from './connectors';

const emailParser = new EmailParser({
  provider: 'gmail',
  credentials: {
    accessToken: process.env.GMAIL_ACCESS_TOKEN,
  },
  filters: {
    from: ['important@example.com'],
    after: new Date('2026-01-01'),
  },
});

const result = await emailParser.sync();
```

### 2. Embedding Service

Supports multiple embedding providers:
- **OpenAI** - text-embedding-3-small (default)
- **Anthropic** - (coming soon)
- **Local** - Simple hash-based (development only)

```typescript
import { EmbeddingService } from './embeddings';

const service = new EmbeddingService({
  provider: 'openai',
  model: 'text-embedding-3-small',
  dimensions: 1536,
  batchSize: 10,
});

const embedding = await service.generateEmbedding('Your text here');
```

### 3. Vector Store

Stores embeddings in PostgreSQL with pgvector extension for efficient similarity search.

```typescript
import { VectorStore } from './embeddings';

const store = new VectorStore(process.env.DATABASE_URL);
await store.initialize();

// Store document with embedding
await store.storeDocument(document, embedding);

// Search for similar documents
const results = await store.search(query, queryEmbedding);
```

**Features:**
- Automatic fallback to in-memory storage (development)
- pgvector similarity search with cosine distance
- Metadata filtering (source, tags, date range)
- Batch operations support

### 4. Semantic Search

High-level API for natural language search.

```typescript
import { SemanticSearch } from './embeddings';

const search = new SemanticSearch(embeddingConfig, databaseUrl);
await search.initialize();

// Simple search
const results = await search.search('machine learning best practices', {
  topK: 10,
  threshold: 0.7,
  filter: {
    source: ['web', 'notion'],
    tags: ['tutorial'],
  },
});

// Multi-query search
const results = await search.multiSearch([
  'AI trends 2026',
  'machine learning applications',
], { topK: 10 });
```

## Complete Example

```typescript
import { KnowledgeManager } from './knowledge';
import { NotionConnector, WebCrawler } from './knowledge/connectors';

// Initialize knowledge manager
const km = new KnowledgeManager(
  {
    provider: 'openai',
    model: 'text-embedding-3-small',
    dimensions: 1536,
  },
  process.env.DATABASE_URL
);

await km.initialize();

// Register connectors
km.registerConnector('notion', new NotionConnector({
  apiKey: process.env.NOTION_API_KEY!,
  databaseId: process.env.NOTION_DATABASE_ID,
}));

km.registerConnector('web', new WebCrawler({
  urls: ['https://docs.example.com'],
  maxDepth: 2,
}));

// Sync all sources
const results = await km.syncAll();
console.log('Sync results:', results);

// Search knowledge base
const searchResults = await km.search('How to deploy AI models?', {
  topK: 5,
  threshold: 0.75,
});

for (const result of searchResults) {
  console.log(`[${result.score.toFixed(2)}] ${result.document.title}`);
  console.log(result.document.content.substring(0, 200));
}

// Get statistics
const stats = await km.getStats();
console.log('Knowledge base stats:', stats);

await km.close();
```

## Environment Variables

```bash
# Required for OpenAI embeddings
OPENAI_API_KEY=sk-...

# Optional: Notion integration
NOTION_API_KEY=secret_...
NOTION_DATABASE_ID=xxx-yyy-zzz

# Optional: Gmail integration
GMAIL_ACCESS_TOKEN=ya29....
GMAIL_CLIENT_ID=xxx.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=GOCSPX-xxx

# Required for persistent storage
DATABASE_URL=postgresql://user:pass@host:5432/dbname
```

## Database Setup

The vector store requires PostgreSQL with the pgvector extension:

```sql
-- Install pgvector extension
CREATE EXTENSION vector;

-- Tables are created automatically by VectorStore.initialize()
-- But you can create them manually:

CREATE TABLE knowledge_documents (
  id VARCHAR(255) PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB NOT NULL,
  embedding vector(1536),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX knowledge_documents_embedding_idx
ON knowledge_documents
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

CREATE INDEX knowledge_documents_metadata_idx
ON knowledge_documents
USING GIN (metadata);
```

## Testing

```typescript
// In-memory mode (no database required)
const km = new KnowledgeManager({
  provider: 'local',
  model: 'simple-hash',
  dimensions: 384,
});

await km.initialize();

// Add test document
await km.addDocument({
  id: 'test-1',
  title: 'Test Document',
  content: 'This is a test document about machine learning.',
  metadata: {
    source: 'test',
    sourceId: 'test-1',
    tags: ['test', 'ml'],
  },
  createdAt: new Date(),
  updatedAt: new Date(),
});

// Search
const results = await km.search('machine learning');
console.log(results);
```

## Integration with Agents

Agents can now query the knowledge base for context:

```typescript
// In creative-agent.ts
import { knowledgeManager } from '../knowledge';

async function analyzeWithContext(brief: string) {
  // Search knowledge base for relevant context
  const context = await knowledgeManager.search(brief, { topK: 3 });

  // Include context in prompt
  const contextText = context
    .map(r => r.document.content)
    .join('\n\n');

  const prompt = `
    Context from knowledge base:
    ${contextText}

    Brief: ${brief}

    Generate creative analysis...
  `;

  // Call AI model with enhanced prompt
  return await analyzeCreative(prompt);
}
```

## Performance Considerations

- **Batch embeddings**: Process multiple documents at once
- **Chunking**: Split large documents into smaller chunks (max 500 words)
- **Caching**: Consider caching frequently accessed embeddings
- **Index tuning**: Adjust IVFFlat lists parameter based on dataset size
- **Rate limits**: Respect API rate limits for embedding providers

## Future Enhancements

- [ ] Support for more embedding providers (Cohere, HuggingFace)
- [ ] Hybrid search (vector + keyword)
- [ ] Document deduplication
- [ ] Automatic re-indexing on source updates
- [ ] GraphQL API for knowledge queries
- [ ] Support for images and multimodal content
- [ ] Knowledge graph relationships
- [ ] Automatic tagging using LLMs

## License

Part of the 5ML Agentic AI Platform v1
