# Ziwei Knowledge - Continuous Improvement Agent Architecture

**Based on:** 5ML Platform's 7-Layer Architecture
**Objective:** Continuously expand, validate, and improve Ziwei knowledge database
**Cost Model:** Prioritized by value/cost ratio with automated stopping conditions

---

## 7-Layer Architecture Integration

```
Layer 7: Interface Layer (UI/UX)
         ↓
Layer 6: Orchestration Layer (Agent Coordinator)
         ↓ (directs)
Layer 5: Workflow Agents (Knowledge Building Agents)
         ├─ 搜索Agent (Search Agent)
         ├─ 驗證Agent (Validation Agent)
         ├─ 分析Agent (Analysis Agent)
         └─ 擁護者Agent (Devil's Advocate Agent)
         ↓
Layer 4: Knowledge Layer (Ziwei Database)
         ├─ Stars Database
         ├─ Palace Meanings
         ├─ Rules Database
         └─ Accuracy Metrics
         ↓
Layer 3: Service Layer (Calculations)
         ├─ Chart Calculator
         ├─ Rule Evaluator
         └─ Luck Cycle Engine
         ↓
Layer 2: Data Layer (Storage)
         ├─ PostgreSQL
         ├─ Vector Store (embeddings)
         └─ Source Registry
         ↓
Layer 1: Infrastructure Layer (Deployment)
```

---

## Agentic Workflow for Continuous Knowledge Building

### 🎯 Overall Flow

```
Orchestration Agent (Layer 6)
    ↓ Evaluates knowledge gaps
    ├─→ Knowledge Gap Detector (identifies gaps)
    ├─→ Priority Scorer (ranks by value/cost)
    ├─→ Search Agent (Layer 5) - Searches online
    ├─→ Validation Agent (Layer 5) - Cross-validates
    ├─→ Devil's Advocate (Layer 5) - Critiques findings
    └─→ Integration Agent (Layer 5) - Updates KB

    ↓ Continuous Loop (Daily/Weekly/Monthly)
    └─→ Metrics Engine → Confidence Scores
        ↓
        Triggers re-evaluation if scores drop
```

---

## Individual Agents & Specifications

### 1. **Orchestration Agent (Layer 6) - Coordinator**

**Role:** Directs all knowledge-building activities

**Responsibilities:**
- Monitor knowledge gap priorities
- Allocate token budgets to workflow agents
- Coordinate search, validation, and critique
- Decide when to integrate new knowledge
- Track cost vs. benefit metrics
- Stop unnecessary agents when target confidence reached

**Decision Rules:**
```
IF knowledge_gap.confidence < 0.8 AND cost_budget_remaining > 0:
    TRIGGER → Search Agent
    WAIT → Results + Devil's Advocate critique
    IF devil_advocate.confidence >= 0.7:
        TRIGGER → Integration Agent
    ELSE:
        REFINE search parameters
        RETRY up to 3 times
ELSE:
    SKIP (too expensive or sufficiently confident)
```

**Cost/Benefit Calculation:**
```
priority_score = (gap_severity × value_weight) / (estimated_cost × cost_weight)

gap_severity: 1-5 (CRITICAL=5, HIGH=4, MEDIUM=3, LOW=2, TRIVIAL=1)
value_weight: Impact on system (0.0-1.0)
estimated_cost: API calls, tokens, compute time
cost_weight: Budget sensitivity (0.5-2.0 based on budget)
```

**Token Budget:**
- Daily: 50,000 tokens for continuous improvement
- Weekly: Additional 100,000 for deep research
- Monthly: 200,000 for comprehensive validation
- Unused budget carries over (up to 500K max)

---

### 2. **Search Agent (Layer 5) - Knowledge Discovery**

**Role:** Find new knowledge from online sources

**Trigger Conditions:**
- Knowledge gap identified (confidence < 0.8)
- New source discovered
- User feedback indicates missing knowledge
- Quarterly scheduled search

**Search Strategy:**
```
Phase 1: Authoritative Sources (Priority 1)
├─ Zhihu 王亭之 articles
├─ Ziwei.asia official content
├─ Academic databases (if accessible)
└─ Cost: 5,000-10,000 tokens

Phase 2: Specialized Resources (Priority 2)
├─ Educational platforms
├─ Practitioner blogs
├─ Forum discussions
└─ Cost: 3,000-5,000 tokens

Phase 3: Supporting References (Priority 3)
├─ Wikipedia-style resources
├─ YouTube transcripts
├─ Community discussions
└─ Cost: 1,000-3,000 tokens
```

**Output:**
- Structured findings
- Source credibility scores
- Confidence levels
- Conflicting interpretations noted
- Ready for Devil's Advocate critique

**Stopping Conditions:**
- Reached target confidence (0.85+)
- Covered all Priority 1 sources
- Token budget exhausted
- 3 consecutive searches with no new info
- Time limit (2 hours max per search)

---

### 3. **Validation Agent (Layer 5) - Cross-Validation**

**Role:** Verify knowledge against multiple sources

**Validation Process:**
```
For each new knowledge item:

1. Multi-source validation
   ├─ Check against existing database
   ├─ Compare with other sources
   ├─ Validate mathematical consistency
   └─ Check real-world applicability

2. Conflict detection
   ├─ Different sources contradict?
   ├─ Identify primary vs secondary sources
   ├─ Document all variations
   └─ Score confidence by source priority

3. Consistency checks
   ├─ Does it fit system logic?
   ├─ Conflicts with established rules?
   ├─ Edge cases handled?
   └─ Complete vs partial information?

4. Score assignment
   ├─ Source credibility (0.0-1.0)
   ├─ Consensus across sources (0.0-1.0)
   ├─ Internal consistency (0.0-1.0)
   └─ Final confidence = average
```

**Output:**
- Validation report
- Confidence scores
- Source attribution
- Identified conflicts (for Devil's Advocate)
- Ready for integration or rejection

**Stopping Conditions:**
- Confidence threshold met (0.80+)
- All available sources checked
- Clear consensus reached
- Irreconcilable conflicts documented

---

### 4. **Devil's Advocate Agent (Layer 5) - Quality Control**

**Role:** Critique findings and challenge assumptions

**Mission:** Ensure accuracy, identify gaps, recommend improvements

**Scope & Constraints:**
```
Engagement Scope:
├─ ALWAYS active for: Confidence < 0.7 or conflicting sources
├─ Optional for: Confidence 0.7-0.85
├─ Skip for: Confidence 0.85+ (unless user requests)
└─ Max engagement: 5 minutes per item (can extend if critical)

Length Constraints:
├─ Critical issues: Up to 10 critique points
├─ High priority: Up to 5 critique points
├─ Medium priority: Up to 3 critique points
└─ Low priority: Up to 1 critique point

Cost Constraints:
├─ Max tokens per critique: 2,000
├─ If exceeds → Summarize & escalate to Orchestration
└─ Can skip if daily token budget exhausted
```

**Devil's Advocate Process:**

**Phase 1: Challenge Assumptions**
```
Questions to ask:
1. "Is this based on 王亭之 (authoritative source)?"
   → If NO: Risk flagged, source credibility questioned

2. "How many sources confirm this interpretation?"
   → If only 1: Single-source risk

3. "Does this contradict established rules?"
   → If YES: Conflict documented, requires resolution

4. "Is there alternative interpretation?"
   → If YES: Documented as competing theory

5. "What's the empirical basis?"
   → If unknown: Confidence score reduced
```

**Phase 2: Identify Knowledge Gaps**
```
For each new knowledge item, ask:
- "What assumptions underlie this?"
- "What could prove this wrong?"
- "What's NOT being said?"
- "Are there edge cases?"
- "Does this apply universally?"
```

**Phase 3: Recommend Improvements**
```
Priority recommendations:
1. CRITICAL: Must address before integration
2. HIGH: Address before production use
3. MEDIUM: Address in next phase
4. LOW: Consider for future improvement
```

**Phase 4: Confidence Adjustment**
```
Base confidence from Validation Agent
↓
Devil's Advocate applies modifiers:
├─ Source quality issues: -0.05 to -0.25
├─ Unresolved conflicts: -0.10 to -0.30
├─ Missing empirical data: -0.05 to -0.15
├─ Edge cases not handled: -0.05 to -0.10
└─ Strong theoretical backing: +0.05 to +0.10
↓
Final confidence score (0.0-1.0)
```

**Critique Output Example:**
```json
{
  "knowledge_item": "Ziwei in 命宮 = Imperial authority",
  "source_confidence": 0.85,
  "devil_advocate_critique": {
    "challenges": [
      {
        "level": "HIGH",
        "issue": "Only 王亭之 as authoritative source; needs cross-validation",
        "risk": "Single-source bias"
      },
      {
        "level": "MEDIUM",
        "issue": "Modern context differences - imperial authority no longer relevant in 2026",
        "recommendation": "Reframe as 'leadership authority' for contemporary use"
      },
      {
        "level": "LOW",
        "issue": "No documented empirical validation",
        "recommendation": "Track accuracy metrics over time"
      }
    ],
    "adjusted_confidence": 0.75,
    "recommendation": "INTEGRATE with modern interpretation update",
    "follow_up_research": ["Collect real chart examples", "Track prediction accuracy"]
  }
}
```

**Stopping Conditions:**
- Time limit reached (5 minutes default)
- All major concerns addressed
- Contradiction cannot be resolved without escalation
- Token budget for this item exhausted
- Sufficient confidence achieved (0.80+)

---

### 5. **Integration Agent (Layer 5) - Database Update**

**Role:** Add validated knowledge to live database

**Integration Process:**
```
1. Pre-integration validation
   ├─ Final confidence check (0.75+ required)
   ├─ Source attribution confirmed
   ├─ No conflicting entries
   └─ Schema validation passed

2. Database update
   ├─ Insert/update records
   ├─ Version control (timestamp + source)
   ├─ Confidence score assignment
   └─ Source attribution

3. Post-integration
   ├─ Cache invalidation
   ├─ API endpoint refresh
   ├─ Notification to UI layer
   └─ Metrics update

4. Verification
   ├─ Query newly integrated data
   ├─ Validate consistency
   ├─ Test in interpretation engine
   └─ Log integration event
```

**Stopping Condition:**
- Successful integration OR rollback on error

---

## Workflow Examples

### Example 1: Star Meanings Discovery (High Priority)

```
Orchestration Agent:
├─ Detects: "104 stars missing complete palace meanings (Gap #2)"
├─ Calculates: priority = (CRITICAL × 1.0) / (8000 tokens × 0.8) = 0.156 (HIGH)
├─ Budget check: Has 45,000 tokens available ✓
└─ TRIGGERS: Search Agent

Search Agent:
├─ Phase 1: Queries Ziwei.asia (official source)
│  └─ Finds: 14 main stars × 12 palaces = 168 combinations
├─ Phase 2: Queries Gagan Sarkaria database
│  └─ Finds: All 104 stars reference list
├─ Phase 3: Queries Fusang Vision star dictionary
│  └─ Finds: Detailed palace meanings for 14 stars
└─ Returns: 3,500 findings → 12,000 tokens used

Validation Agent:
├─ Checks: 168 combinations against sources
├─ Conflict resolution: Prioritize 王亭之 > Official > Educational
├─ Assigns confidence: avg 0.82
└─ Reports: Ready for Devil's Advocate

Devil's Advocate:
├─ Challenge: "All from current sources?"
│  └─ Issue: MEDIUM - No 王亭之 original text verification
├─ Recommend: "Add official 王亭之 source check"
├─ Adjust confidence: 0.82 → 0.76
└─ Decision: INTEGRATE with high priority follow-up research

Integration Agent:
├─ Inserts: 168 star-palace combinations
├─ Version tags: "2026-02-18_phase-1-scraping_conf-0.76"
├─ Updates: Orchestration Agent priority queue
└─ Result: SUCCESS - Ready for Phase 2

Total tokens used: 12,000
Budget remaining: 33,000
New knowledge: 168 star-palace combinations added
```

### Example 2: Transformation Rules Discovery (Critical)

```
Orchestration Agent:
├─ Detects: "Four Transformations incomplete (Gap #7, Confidence 0.25)"
├─ Calculates: priority = (CRITICAL × 1.0) / (6000 tokens × 0.8) = 0.208 (CRITICAL)
├─ Budget check: 33,000 tokens available ✓
└─ TRIGGERS: Search Agent

Search Agent:
├─ Phase 1: Queries 星林學苑 (Four Transformations specialist) PRIMARY SOURCE
│  └─ Finds: Complete 四化 system documentation
├─ Phase 2: Queries Vocus transformation guides
│  └─ Finds: Multiple interpretations of each transformation type
└─ Returns: 850 findings → 8,500 tokens used

Validation Agent:
├─ Maps: 10 stems × 4 transformation types = 40 base rules
├─ Cross-validates: Multiple sources for each rule
├─ Checks: Consistency with existing database
├─ Assigns: avg confidence 0.88
└─ Reports: High-quality findings, ready for review

Devil's Advocate:
├─ Challenge 1: "Is this 王亭之 endorsed?"
│  └─ Finding: YES - 星林學苑 uses 中州派 framework ✓
├─ Challenge 2: "Any conflicting interpretations?"
│  └─ Finding: Minor variations between sources → documented
├─ Challenge 3: "Empirical validation?"
│  └─ Issue: MEDIUM - No historical case studies
├─ Recommend: "Add empirical tracking post-launch"
├─ Adjust confidence: 0.88 → 0.85
└─ Decision: INTEGRATE + FLAG FOR VALIDATION TRACKING

Integration Agent:
├─ Inserts: 40 transformation rules
├─ Links: To affected stars and palaces
├─ Updates: Rule evaluation engine
└─ Result: SUCCESS - 四化 layer now functional

Total tokens used: 8,500
Budget remaining: 24,500
New knowledge: 40 transformation rules
Next phase: Validation tracking setup
```

---

## Cost & Benefit Analysis

### Cost Model

| Agent Activity | Tokens | Frequency | Monthly Cost |
|---|---|---|---|
| Search (Priority 1 sources) | 10,000 | 2/month | 20,000 |
| Search (Priority 2 sources) | 5,000 | 4/month | 20,000 |
| Search (Priority 3 sources) | 2,000 | 8/month | 16,000 |
| Validation runs | 3,000 | 12/month | 36,000 |
| Devil's Advocate reviews | 2,000 | 15/month | 30,000 |
| Integration & updates | 1,000 | 20/month | 20,000 |
| **Monthly total** | | | **142,000 tokens** |

**Cost at $0.01 per 1,000 tokens:** ~$1.42/month (minimal)
**Cost at $0.50 per 1,000 tokens (higher rate):** ~$71/month

---

### Benefit Model (Per Knowledge Item Added)

| Item Type | Knowledge Value | System Impact | User Value |
|---|---|---|---|
| Single star meaning | 1 point | Low | Medium |
| Star-palace combination | 5 points | Medium | Medium |
| Transformation rule | 10 points | High | High |
| Luck cycle algorithm | 50 points | Critical | High |
| Pattern rule | 8 points | High | Medium |
| Accuracy metric | 20 points | Critical | Low |

**Benefits of completing knowledge base:**
- ✅ Serve 100% of user charts accurately
- ✅ Provide 大運/流年 predictions (high-value feature)
- ✅ Apply 四化 transformations (essential layer)
- ✅ Reduce error rates by ~60%
- ✅ Enable advanced pattern recognition
- ✅ Support decision-making (career/wealth/relationship)

---

## Continuous Improvement Loop

```
Weekly Loop:
├─ Monday: Orchestration evaluates gaps
├─ Tuesday: Search Agent runs scheduled searches
├─ Wednesday: Validation Agent cross-checks findings
├─ Thursday: Devil's Advocate reviews critiques
├─ Friday: Integration Agent updates database
└─ Weekend: Metrics analysis & plan next week

Monthly Loop:
├─ Week 1-2: Focus on HIGH priority gaps
├─ Week 3: Focus on MEDIUM priority gaps
├─ Week 4: Validation & accuracy metrics
└─ Summary: Report coverage increase % to user

Quarterly Loop:
├─ Deep research on Priority 1 sources (王亭之)
├─ Empirical validation against real charts
├─ Accuracy metrics compilation
└─ Decision: Adjust priorities based on results

Annual Loop:
├─ Complete target knowledge base (95%+)
├─ Publish accuracy statistics
├─ Update user-facing documentation
└─ Plan next-year improvements
```

---

## Orchestration Agent Decision Rules

### When to Activate Search Agent:
```python
def should_search(gap):
    if gap.confidence < 0.8 and budget_remaining > gap.estimated_cost:
        if gap.severity in ['CRITICAL', 'HIGH']:
            return True  # Activate search
        elif gap.severity == 'MEDIUM' and budget_ratio > 0.05:
            return True  # Activate if good value/cost
    return False
```

### When to Activate Devil's Advocate:
```python
def should_critique(findings):
    if findings.confidence < 0.70:
        return True  # Always critique low confidence
    elif findings.confidence < 0.85 and findings.has_conflicts:
        return True  # Critique if conflicts exist
    elif findings.severity == 'CRITICAL':
        return True  # Always critique critical items
    return False  # Skip for high-confidence items
```

### When to Stop and Integrate:
```python
def should_integrate(validated_knowledge):
    if validated_knowledge.final_confidence >= 0.75:
        return True  # Meet minimum threshold
    if validated_knowledge.sources >= 3 and all_agree:
        return True  # Strong consensus
    if token_budget_exhausted or time_limit_reached:
        return True  # Stop researching
    return False  # Need more validation
```

---

## Addressing User Feedback & Iteration

### Feedback Loop:
```
User asks question → System cannot answer
    ↓
Log as knowledge gap (highest priority)
    ↓
Orchestration Agent evaluates (priority = CRITICAL)
    ↓
Search → Validate → Critique → Integrate
    ↓
Next query has answer
```

### Quality Improvement:
```
Track user satisfaction with interpretations
    ↓
0-1 month: Track predictions accuracy
    ↓
3 months: Compile metrics, identify weak areas
    ↓
6 months: Adjust confidence scores based on real outcomes
    ↓
12 months: Publish accuracy report, plan improvements
```

---

## Summary: Value Proposition

✅ **Automated knowledge expansion** - No manual research needed
✅ **Quality control** - Devil's Advocate ensures accuracy
✅ **Cost-effective** - ~$1-70/month depending on token rates
✅ **Scalable** - Handles continuous improvement indefinitely
✅ **Transparent** - Source attribution and confidence scores visible
✅ **User-focused** - Prioritizes gaps that matter to users
✅ **Measurable** - Tracks coverage % and accuracy metrics

---

**Document Date:** 2026-02-18
**Next Review:** 2026-02-25 (weekly)
**Target Implementation:** Week 1 of Phase 2 (March 4-18)
