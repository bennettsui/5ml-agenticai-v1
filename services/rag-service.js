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

// Pre-populate with 5ML company context (powers all chatbot RAG)
instance.addDocuments([
  {
    id: '5ml-identity',
    content: `5 Miles Lab (5ML) is a Hong Kong-based agentic AI solutions agency.
Positioning: We are not an HR tech or generic AI tool vendor; we are an AI solutions agency that builds agentic workflow automation on top of our own 5ML Agentic OS infrastructure, competing with agencies like NDN and Fimmick.
Core infra: 5ml-agenticai-v1 Node.js stack, deployed on Fly.io and AWS (EC2 + PostgreSQL/RDS), used as the backbone for all agentic workflows and client projects.
Design: 7-layer agentic architecture (infrastructure, execution engine, knowledge, tools, tasks, orchestration, governance) designed for multi-tenant, multi-agent workflows.
Markets: Core = Hong Kong; expansion = GBA, Mainland China (via partners and alternative LLMs), SEA.
Pricing: Enterprise project fees (~HK$500k) plus retainers at 10-20% below NDN/Fimmick. SME HK$2k-5k/month subscriptions with optional profit-sharing.`,
    metadata: { useCase: 'company', title: '5ML Company Identity' },
  },
  {
    id: '5ml-solution-lines',
    content: `5ML Solution Lines:
1. Enterprise / Big Corp (攻 side): Listed companies, banks, property developers, large brands. Enterprise-grade agentic workflows and C-Suite intelligence (CEO/CMO/CFO/COO/CTO agents) at 10-20% below NDN/Fimmick pricing, with 3-7 day pilot deployment.
2. SME / Quick-win (守 side): HK/GBA/Mainland/SEA SMEs (clinics, insurance brokers, ecommerce). Pre-packaged agentic workflows (RecruitAIStudio, Man's Accounting, social media & ads performance, website health, AI photo booth) at subscription price points with 3-day launch and clear ROI.
Model Routing: DeepSeek primary ($0.14/$0.28 per 1M tokens), Claude Haiku fallback ($0.25/$1.25 per 1M), Perplexity for web research ($3/$15 per 1M), Claude Sonnet for vision/complex only ($3/$15 per 1M).`,
    metadata: { useCase: 'company', title: '5ML Solution Lines & Pricing' },
  },
  {
    id: '5ml-use-cases',
    content: `5ML Existing Use Cases:
Growth/Media: Social Media Team Agent (campaign research, brand config), Ads Performance Intelligence (Meta + Google multi-tenant analysis), Social reporting with visual monthly reports.
Exec & Intelligence: AI Executive Council / C-Suite (5 AI executives: CEO, CMO, CFO, COO, CTO) thinking independently across growth, finance, ops and tech, summarised into a cockpit.
Ops & Finance: Man's Accounting (receipt OCR, categorisation, P&L tracking), Internal finance automation (invoice tracking, client chasing).
Talent/HR: RecruitAIStudio (dual-track agentic AI strategy for recruitment workflows and SME automation).
Experience/Events: AI video/content pipelines, AI photo booth concept, TEDx salon site and visual prompts.
All use cases built on the same 7-layer infra and often re-use agents.`,
    metadata: { useCase: 'company', title: '5ML Use Cases' },
  },
  {
    id: 'crm-architecture',
    content: `CRM Marketing Intelligence 8-Phase Architecture:
Phase 0 - Pre-CRM Setup & Research: Brand Discovery Agent, Market Research Agent, Competitor Analysis Agent, LinkedIn Network Analyzer, Initial Relationship Mapper, Brand Hierarchy Builder, Initial Knowledge Base Populator. Purpose: Set up brand/client intelligence BEFORE ongoing CRM. Triggered by new client onboarding or brand research request.
Phase 1 - Data Ingestion & Ongoing Research: Brand Monitor (news, mentions), Market Intelligence Collector, Competitor Tracker, Social Listening Agent, Industry Trend Researcher, CRM Data Collector, Marketing Platform Fetcher.
Phase 2 - Data Processing & Normalization: Clean, deduplicate, and normalize incoming data streams.
Phase 3 - Knowledge Synthesis & Graph Building: Knowledge Graph Builder integrates findings, Relationship Mapper connects people/companies, Hierarchy Builder creates organizational structure.
Phase 4 - Domain Intelligence Application: Client Intelligence Agent creates intelligence profiles, applies domain-specific analysis.
Phase 5 - Action Planning & Strategy: Campaign strategy synthesis, budget optimization, resource allocation.
Phase 6 - Execution & System Updates: CRM Updater populates systems, Alert Setup configures monitoring, action execution.
Phase 7 - User Interface & Interaction: Client-facing AI chat, dashboards, reports, feedback collection.

Orchestration Patterns:
Pattern A (Quick Setup - Low Priority): Basic web search, key contacts only, minimal CRM fields, basic monitoring.
Pattern B (Comprehensive Setup - Key Client): Full Layer 0 research, deep competitor analysis, 2nd/3rd degree relationship mapping, custom alert configuration.
Pattern C (Ongoing Research Refresh): Quarterly review trigger, market updates, competitor changes, knowledge graph refresh.

Critical: Brand setup is NOT one-time. Research needs periodic refresh. Setup quality affects everything downstream.`,
    metadata: { useCase: 'crm', title: 'CRM 8-Phase Architecture' },
  },
]);

module.exports = instance;
