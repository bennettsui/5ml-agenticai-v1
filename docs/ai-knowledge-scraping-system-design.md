# AI Knowledge Scraping & Learning System for Ziwei Doushu

**Status**: Design Proposal
**Date**: 2026-02-19
**Purpose**: Enable continuous learning and knowledge aggregation from authoritative Ziwei sources

---

## 1. System Overview

### Goals
1. **Automated Discovery**: Periodically find new information about Ziwei Doushu
2. **Multi-Source Aggregation**: Collect from 10+ authoritative sources
3. **Knowledge Digestion**: Extract, classify, and integrate new information
4. **Conflict Resolution**: Compare and reconcile different interpretations
5. **Quality Control**: Validate against existing knowledge base
6. **Version Control**: Track knowledge evolution and source changes

### Architecture Layers
```
┌─────────────────────────────────────────┐
│   Frontend: API & Dashboard              │
│   (View aggregated knowledge)            │
├─────────────────────────────────────────┤
│   Processing Layer                       │
│   - Aggregation Engine                   │
│   - De-duplication                       │
│   - Conflict Resolution                  │
│   - Quality Scoring                      │
├─────────────────────────────────────────┤
│   Learning Layer                         │
│   - LLM Analysis & Summarization         │
│   - Classification System                │
│   - Cross-reference Linking              │
├─────────────────────────────────────────┤
│   Collection Layer                       │
│   - Web Scrapers (10+ sources)           │
│   - RSS Feed Aggregators                 │
│   - API Connectors                       │
├─────────────────────────────────────────┤
│   Storage Layer                          │
│   - Raw Data (JSON/MD)                   │
│   - Processed Knowledge (Structured)     │
│   - Metadata & Source Tracking           │
│   - Version History                      │
└─────────────────────────────────────────┘
```

---

## 2. Authoritative Sources to Monitor

### Tier 1: Academic & Educational Platforms
```json
{
  "sources": [
    {
      "id": "xinglin-academy",
      "name": "星林學苑",
      "url": "https://www.108s.tw/",
      "update_frequency": "weekly",
      "scrape_type": "article_feed",
      "content_categories": [
        "educational_articles",
        "case_studies",
        "step_by_step_guides"
      ]
    },
    {
      "id": "keji-ziwei",
      "name": "科技紫微網",
      "url": "https://www.click108.com.tw/",
      "update_frequency": "weekly",
      "scrape_type": "course_content + articles",
      "content_categories": [
        "lessons",
        "interpretations",
        "modern_applications"
      ]
    },
    {
      "id": "ziwei-yun",
      "name": "紫微雲科技",
      "url": "https://ziwei-yun.com/",
      "update_frequency": "monthly",
      "scrape_type": "textbook_content",
      "content_categories": [
        "detailed_explanations",
        "technical_definitions"
      ]
    }
  ]
}
```

### Tier 2: Community & Research Sources
```
- Vocus (Medium-like platform with detailed articles)
- Douban (Book reviews and academic discussions)
-知乎 (Zhihu - Q&A with expert answers)
- Wikipedia (Basic reference and historical context)
- Personal blogs from recognized experts
```

### Tier 3: Traditional Sources
```
- Digitized classical texts (via Chinese Text Project)
- Academic papers on metaphysical systems
- Published books by major scholars
```

---

## 3. Data Collection Pipeline

### 3.1 Web Scraping Strategy

```javascript
// Pseudo-code for scraping engine

class ZiweiScraper {

  async scrapeAll() {
    const sources = config.authoritative_sources;
    const results = [];

    for (const source of sources) {
      try {
        const data = await this.scrapeSource(source);
        results.push({
          source_id: source.id,
          timestamp: new Date(),
          content: data,
          metadata: {
            url: source.url,
            scrape_duration_ms: duration,
            content_hash: hash(data)  // for deduplication
          }
        });
      } catch (error) {
        this.log('error', source.id, error);
      }
    }

    return results;
  }

  async scrapeSource(source) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.goto(source.url, { waitUntil: 'networkidle2' });

    // Extract based on source type
    const content = await page.evaluate(async () => {
      return document.body.innerText;  // Simplified
    });

    await browser.close();
    return content;
  }
}
```

### 3.2 RSS Feed Aggregation
- Subscribe to feeds from major platforms
- Parse article metadata (author, date, category)
- Track update frequency per source

### 3.3 Schedule Configuration

```json
{
  "scrape_schedule": {
    "tier1_sources": {
      "frequency": "weekly",
      "day": "Monday",
      "time": "02:00 UTC",
      "timeout": 3600,
      "retry_on_failure": 3
    },
    "tier2_sources": {
      "frequency": "bi-weekly",
      "day": "Monday",
      "time": "03:00 UTC",
      "timeout": 7200
    },
    "tier3_sources": {
      "frequency": "monthly",
      "day": "1st",
      "time": "04:00 UTC",
      "timeout": 10800
    }
  }
}
```

---

## 4. Content Processing Pipeline

### 4.1 De-duplication Engine

```json
{
  "deduplication": {
    "method": "semantic_hash + content_hash",
    "algorithm": {
      "exact_match": "MD5(content)",
      "semantic_match": "embedding_similarity(content)",
      "threshold": 0.85,
      "consider_paraphrasing": true
    }
  }
}
```

### 4.2 Content Classification

```json
{
  "classification": {
    "primary_categories": [
      "foundations",         // Level 1 content
      "basic_system",       // Level 2 content
      "auxiliary_stars",    // Level 3 content
      "four_transformations", // Level 4 content (PRIORITY)
      "patterns",           // Level 5 content
      "practical_reading",  // Level 6 content
      "case_studies",       // Real examples
      "news",              // Recent discoveries/discussions
      "technical"          // Software/tools
    ],
    "secondary_tags": [
      "school_zhongzhou",
      "school_other",
      "academic",
      "practical",
      "controversial",
      "needs_verification"
    ]
  }
}
```

### 4.3 Conflict Detection & Resolution

```javascript
class ConflictResolver {

  async detectConflicts(newContent, existingKB) {
    const conflicts = [];

    for (const claim of newContent.claims) {
      const existing = existingKB.findClaim(claim.topic);

      if (existing && !this.isSemanticallyEquivalent(claim, existing)) {
        conflicts.push({
          topic: claim.topic,
          new_content: claim,
          existing_content: existing,
          sources: [newContent.source, existing.source],
          confidence_new: claim.confidence,
          confidence_existing: existing.confidence,
          requires_review: true
        });
      }
    }

    return conflicts;
  }

  async resolveConflicts(conflicts) {
    for (const conflict of conflicts) {
      const resolution = await this.aiAnalyze(conflict);

      // Store with version history
      await this.kb.updateClaim({
        topic: conflict.topic,
        content: resolution.preferred,
        versions: [conflict.new_content, conflict.existing_content],
        reasoning: resolution.reasoning,
        reviewed_by: 'ai_resolver',
        timestamp: new Date()
      });
    }
  }
}
```

### 4.4 AI Learning & Summarization

```
Process Flow:
1. Raw Content → Extract Key Claims
2. Extract Key Claims → Semantic Analysis (Claude)
3. Semantic Analysis → Knowledge Units
4. Knowledge Units + Existing KB → Conflict Check
5. Conflict Check → Resolution/Integration
6. Integration → Updated KB Structure
```

---

## 5. Knowledge Base Structure

### 5.1 Storage Format

```json
{
  "knowledge_entry": {
    "id": "ziwei-0001",
    "topic": "四化星 - 化祿",
    "level": 4,
    "content": {
      "definition": "...",
      "characteristics": [
        "主財富",
        "溫和敦厚",
        "..."
      ],
      "applications": [
        "..."
      ]
    },
    "sources": [
      {
        "source_id": "wang_tingzhi",
        "source_name": "王亭之談星系列",
        "quote": "...",
        "url": "...",
        "confidence": 0.95,
        "date_accessed": "2026-02-19"
      },
      {
        "source_id": "xinglin_academy",
        "source_name": "星林學苑",
        "quote": "...",
        "url": "https://www.108s.tw/article/info/85",
        "confidence": 0.90,
        "date_accessed": "2026-02-19"
      }
    ],
    "conflicts": [],
    "status": "verified",
    "version": 2,
    "last_updated": "2026-02-19",
    "change_log": [
      {
        "version": 1,
        "timestamp": "2026-01-15",
        "change": "Initial entry"
      },
      {
        "version": 2,
        "timestamp": "2026-02-19",
        "change": "Added Xinglin Academy perspective"
      }
    ]
  }
}
```

### 5.2 Metadata Tracking

```json
{
  "metadata": {
    "source_reliability_score": 0.95,
    "information_freshness": "2 weeks old",
    "source_conflicts": 1,
    "cross_references": 12,
    "citations_count": 3,
    "community_consensus": "high",
    "requires_expert_review": false,
    "update_history": [...]
  }
}
```

---

## 6. Implementation Roadmap

### Phase 1: Foundation (Weeks 1-2)
- [ ] Design scraper architecture
- [ ] Implement RSS feed aggregation
- [ ] Set up storage structure
- [ ] Create deduplication engine
- [ ] Test on 3 primary sources

### Phase 2: Learning Integration (Weeks 3-4)
- [ ] Integrate Claude API for content analysis
- [ ] Build classification system
- [ ] Implement conflict detection
- [ ] Create knowledge base API
- [ ] Add versioning system

### Phase 3: Automation (Weeks 5-6)
- [ ] Deploy scheduled scrapers
- [ ] Set up automated notifications for conflicts
- [ ] Create dashboard for monitoring
- [ ] Implement automated learning triggers
- [ ] Test end-to-end pipeline

### Phase 4: Optimization (Weeks 7-8)
- [ ] Fine-tune extraction accuracy
- [ ] Optimize de-duplication
- [ ] Improve conflict resolution
- [ ] Add expert review workflows
- [ ] Performance optimization

---

## 7. Technology Stack

```
Frontend:
  - React/Vue for dashboard
  - Real-time updates with WebSocket

Backend:
  - Node.js + Express for API
  - Python + BeautifulSoup/Scrapy for scraping
  - Claude API for AI analysis

Database:
  - PostgreSQL for structured knowledge
  - JSON/MongoDB for flexible schema
  - Redis for caching & deduplication

Monitoring:
  - Prometheus + Grafana
  - Error tracking (Sentry)
  - Log aggregation (ELK Stack)

Deployment:
  - Docker + Kubernetes
  - CI/CD: GitHub Actions
  - Cloud: AWS/GCP
```

---

## 8. Data Quality Measures

### 8.1 Verification Levels

```
Level 1: Raw Content
  - Just collected, no processing
  - Confidence: 0.5

Level 2: Processed & Classified
  - Extracted claims, categorized
  - Confidence: 0.7

Level 3: Conflict-Checked
  - Verified against KB, resolved
  - Confidence: 0.85

Level 4: Expert Reviewed
  - Manually verified by human expert
  - Confidence: 0.98
```

### 8.2 Quality Scoring

```json
{
  "quality_score": {
    "source_credibility": 0.95,
    "information_age": 0.80,
    "community_consensus": 0.90,
    "expert_verification": 0.85,
    "cross_references": 0.88,
    "overall_score": 0.88
  }
}
```

---

## 9. API Endpoints for Learning System

```
GET  /api/knowledge/search?topic=四化星&level=4
GET  /api/knowledge/{id}/sources
GET  /api/conflicts/pending
POST /api/conflicts/{id}/resolve
GET  /api/scraping/status
GET  /api/scraping/last-run
POST /api/scraping/trigger-now
GET  /api/learning/stats
GET  /api/learning/recent-discoveries
```

---

## 10. Challenges & Mitigation

| Challenge | Mitigation |
|-----------|-----------|
| Source availability changes | Monitor HTTP status; fallback sources |
| Content duplicate variations | Semantic similarity + hashing |
| Interpretation conflicts | AI conflict resolver + expert queue |
| Rate limiting | Respectful scraping intervals |
| Language diversity | Support both Traditional & Simplified Chinese |
| Knowledge explosion | Automated summarization & categorization |
| False positives | Multiple verification levels & human review |
| Performance at scale | Caching, pagination, async processing |

---

## 11. Expected Benefits

1. **Continuous Learning**: System improves knowledge base automatically
2. **Early Discovery**: New insights detected before human review
3. **Conflict Resolution**: Different schools' perspectives systematically reconciled
4. **Quality Assurance**: Multi-layer verification ensures accuracy
5. **Time Efficiency**: Humans focus on synthesis, not data collection
6. **Scalability**: Can monitor 50+ sources without manual effort
7. **Transparency**: Full provenance and source tracking
8. **Research Value**: Enables academic study of Ziwei interpretation evolution

---

## 12. Success Metrics

```
- Sources monitored: 10+ → 50+
- Information freshness: < 1 week average
- Deduplication accuracy: > 99%
- Conflict detection accuracy: > 95%
- Knowledge base growth: +10% new insights monthly
- Expert review time: -60% through automation
- Source coverage: All major platforms monthly
```

---

## 13. Privacy & Ethical Considerations

✅ **Do**:
- Respect robots.txt and Terms of Service
- Cache aggressively to minimize requests
- Attribute all sources clearly
- Use public data only
- Preserve original author attribution

❌ **Don't**:
- Scrape behind paywalls
- Redistribute copyrighted content
- Ignore rate limiting
- Claim AI-generated content as original
- Store personal user data from sources

---

## Next Steps

1. **Approval**: Get stakeholder approval for system design
2. **Resource Allocation**: Assign engineering team
3. **Prototype**: Build MVP with 3 sources
4. **Validation**: Test accuracy and performance
5. **Expansion**: Scale to full source set
6. **Integration**: Connect to main backend system

---

**Prepared by**: Claude AI Knowledge System
**For**: 5ML Agentic AI Platform - Ziwei Doushu Backend
**Revision**: 1.0
