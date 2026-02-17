/**
 * RAG (Retrieval-Augmented Generation) Service
 *
 * Provides document indexing and context retrieval for any use case.
 * Uses keyword-based TF-IDF search with optional pgvector upgrade path.
 *
 * Deployment pattern across use cases:
 *   const rag = require('./services/rag-service');
 *   rag.addDocument('id', 'content', { useCase: 'ads' });
 *   const ctx = rag.getContext('budget optimization', 'ads');
 *   // Feed ctx into system prompt before LLM call
 */

class RAGService {
  constructor() {
    this.documents = [];
    this.index = new Map(); // term → Set<docIndex>
    this.idf = new Map();   // term → inverse-document-frequency
    this._dirty = true;
  }

  // ── Document management ──────────────────────────────────

  addDocument(id, content, metadata = {}) {
    const existing = this.documents.findIndex(d => d.id === id);
    if (existing >= 0) {
      this.documents[existing] = { id, content, metadata, terms: this._tokenize(content) };
    } else {
      this.documents.push({ id, content, metadata, terms: this._tokenize(content) });
    }
    this._dirty = true;
    this._rebuildIndex();
  }

  addDocuments(docs) {
    for (const { id, content, metadata } of docs) {
      this.addDocument(id, content, metadata);
    }
  }

  removeDocument(id) {
    this.documents = this.documents.filter(d => d.id !== id);
    this._dirty = true;
    this._rebuildIndex();
  }

  // ── Search & retrieval ───────────────────────────────────

  search(query, { topK = 5, useCase = null, threshold = 0.01 } = {}) {
    if (this._dirty) this._rebuildIndex();

    const queryTerms = this._tokenize(query);
    const scores = new Map();

    for (const term of queryTerms) {
      const docIndices = this.index.get(term);
      if (!docIndices) continue;
      const idf = this.idf.get(term) || 1;

      for (const idx of docIndices) {
        const doc = this.documents[idx];
        // Filter by use case if specified
        if (useCase && doc.metadata.useCase && doc.metadata.useCase !== useCase) continue;
        const tf = doc.terms.filter(t => t === term).length / doc.terms.length;
        scores.set(idx, (scores.get(idx) || 0) + tf * idf);
      }
    }

    return [...scores.entries()]
      .filter(([, score]) => score >= threshold)
      .sort((a, b) => b[1] - a[1])
      .slice(0, topK)
      .map(([idx, score]) => ({ ...this.documents[idx], score }));
  }

  /**
   * Get formatted context string for LLM injection.
   * @param {string} query - User query
   * @param {string} [useCase] - Filter by use case
   * @param {number} [topK] - Max documents to include
   * @returns {string} Formatted context block
   */
  getContext(query, useCase = null, topK = 3) {
    const results = this.search(query, { topK, useCase });
    if (results.length === 0) return '';

    const chunks = results.map((doc, i) =>
      `[Context ${i + 1}] (${doc.metadata.title || doc.id})\n${doc.content}`
    );
    return `--- Retrieved Context (RAG) ---\n${chunks.join('\n\n')}\n--- End Context ---`;
  }

  getStats() {
    const useCases = new Set(this.documents.map(d => d.metadata.useCase).filter(Boolean));
    return {
      totalDocuments: this.documents.length,
      uniqueTerms: this.index.size,
      useCases: [...useCases],
    };
  }

  // ── Internal ─────────────────────────────────────────────

  _tokenize(text) {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(t => t.length > 2 && !STOP_WORDS.has(t));
  }

  _rebuildIndex() {
    this.index.clear();
    this.idf.clear();

    for (let i = 0; i < this.documents.length; i++) {
      const doc = this.documents[i];
      const uniqueTerms = new Set(doc.terms);
      for (const term of uniqueTerms) {
        if (!this.index.has(term)) this.index.set(term, new Set());
        this.index.get(term).add(i);
      }
    }

    // Compute IDF
    const N = this.documents.length || 1;
    for (const [term, docSet] of this.index) {
      this.idf.set(term, Math.log(N / docSet.size) + 1);
    }

    this._dirty = false;
  }
}

const STOP_WORDS = new Set([
  'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had',
  'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his',
  'how', 'its', 'may', 'new', 'now', 'old', 'see', 'way', 'who', 'did',
  'let', 'say', 'she', 'too', 'use', 'this', 'that', 'with', 'have', 'from',
  'they', 'been', 'said', 'each', 'which', 'their', 'will', 'other', 'about',
  'many', 'then', 'them', 'these', 'some', 'would', 'make', 'like', 'into',
  'could', 'time', 'very', 'when', 'come', 'made', 'after', 'back',
]);

// ── Singleton with pre-populated workflow knowledge ────────

const instance = new RAGService();

// Pre-populate with orchestration knowledge
instance.addDocuments([
  {
    id: 'orch-patterns',
    content: `Agent orchestration patterns:
1. Conditional Orchestration: A central orchestrator analyzes input and selectively activates specialist agents based on requirements. Includes quality review feedback loops.
2. Cron-Batch Pipeline: Time-triggered sequential pipeline that processes data through fixed stages. Good for daily/weekly data aggregation and analysis.
3. Sequential State Machine: Each step transitions to the next with tracked state. Used for multi-stage processing with clear checkpoints.
4. Fan-Out/Fan-In: Parallel execution of multiple sources followed by aggregation. Maximizes throughput for independent data collection.
5. Checkpoint Pipeline: Each stage persists results before proceeding. Enables retry and resume on failure.
6. Event-Driven Analysis: Triggered by external events (API calls, file uploads). Reactive processing chains.`,
    metadata: { useCase: 'workflows', title: 'Orchestration Patterns' },
  },
  {
    id: 'rag-deployment',
    content: `RAG deployment strategy across use cases:
1. Index all relevant documents at startup (prompts, schemas, business rules, historical outputs)
2. Before each LLM call, retrieve top-K relevant documents for the user query
3. Inject retrieved context into the system prompt as "reference material"
4. Use the LLM to synthesize an answer grounded in the retrieved context
5. Optionally store new insights back into the knowledge base for future retrieval
Benefits: Reduces hallucination, grounds responses in actual data, enables domain-specific answers without fine-tuning.
Applicable to: Marketing strategy, Ads analysis, Photo booth configuration, Intelligence reports, Receipt categorization rules, CRM knowledge base.`,
    metadata: { useCase: 'workflows', title: 'RAG Deployment Strategy' },
  },
  {
    id: 'agent-design',
    content: `Agent design best practices:
- Single Responsibility: Each agent should have one clear purpose
- Typed I/O: Define clear input/output schemas for inter-agent communication
- Observability: Log decisions, tool calls, and outcomes for debugging
- Graceful Degradation: Agents should handle upstream failures without crashing the pipeline
- Cost Awareness: Route simple tasks to cheaper models (Haiku), complex reasoning to capable ones (Opus)
- Human-in-the-Loop: For high-stakes decisions, include human review checkpoints
- Feedback Loops: Quality review agents that can send work back for revision improve output quality`,
    metadata: { useCase: 'workflows', title: 'Agent Design Best Practices' },
  },
  {
    id: 'business-analysis',
    content: `Business analysis framework for agent workflows:
- ROI Assessment: Compare agent automation cost vs manual labor cost per task
- Bottleneck Identification: Find agents that block the pipeline (sequential dependencies)
- Failure Mode Analysis: What happens when each agent fails? Is there retry logic?
- Scalability: Can the workflow handle 10x load? Which agents become the bottleneck?
- Data Quality: Are there validation steps between agents? How are bad inputs handled?
- Maintainability: How easy is it to modify or replace individual agents?
- Cost Optimization: Which agents use the most expensive models? Can they be downgraded?`,
    metadata: { useCase: 'workflows', title: 'Business Analysis Framework' },
  },
]);

module.exports = instance;
