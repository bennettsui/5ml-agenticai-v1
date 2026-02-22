# Ziwei 紫微斗數 - Known Knowledge Gaps & Limitations

**Current Status:** Knowledge gaps identified and prioritized for systematic research and scraping

---

## Critical Knowledge Gaps (Unknown/Incomplete)

### 1. All 104 Stars Detailed Meanings 🔴 CRITICAL
- **Gap:** Currently only have ~30 stars documented
- **Missing:** 74 additional secondary & minor stars
- **Required:** Each star with:
  - Chinese name (中文名)
  - English name/translation
  - Five-element classification
  - Yin-Yang property
  - Base characteristics
  - All 12 palace meanings (12 combinations per star)
- **Impact:** Cannot provide complete chart interpretations
- **Severity:** CRITICAL - Core to system functionality
- **Solution:** Phase 1 & 3 scraping (Zhihu, ziwei.asia, Gagan Sarkaria)

### 2. Star-Palace Combinations (1,248 Total) 🔴 CRITICAL
- **Gap:** Only ~50 combinations documented
- **Missing:** 1,198 star-palace interpretation combinations
- **For Each Combination:** Need:
  - Meaning in that specific palace
  - Career implications
  - Wealth implications
  - Relationship implications
  - Health implications
  - Personality manifestations
- **Impact:** Cannot accurately interpret where stars appear in user's chart
- **Severity:** CRITICAL - Core functionality
- **Solution:** Phase 3 scraping (Zi Wei Dou Shu Academy, Fusang Vision)

### 3. Decade Luck System (大運) - Complete Rules 🔴 CRITICAL
- **Gap:** Understand concept but lack:
  - Exact calculation algorithm
  - How stars move through palaces in 10-year periods
  - How transformations apply to decade luck
  - Specific decade luck palace activation
  - Life stage mapping (6, 16, 26, 36, 46, 56, 66, 76, 86 years)
- **Current Knowledge:** "10-year fortune cycles exist"
- **Missing:** "HOW to calculate and interpret them"
- **Impact:** Cannot provide decade fortune predictions
- **Severity:** CRITICAL - High-value feature
- **Solution:** Phase 2 scraping (Inzense - PRIMARY SOURCE)

### 4. Annual Luck System (流年) - Complete Rules 🔴 CRITICAL
- **Gap:** Missing:
  - Yearly calculation algorithm
  - Star positioning for each year
  - Transformation application method
  - Year-to-year progression rules
- **Current Knowledge:** "Annual luck exists"
- **Missing:** "Detailed calculation & interpretation"
- **Impact:** Cannot provide annual forecasts
- **Severity:** CRITICAL
- **Solution:** Phase 2 scraping (Inzense, 科技紫微網)

### 5. Monthly Luck System (流月) - Complete Rules 🟠 HIGH
- **Gap:** Missing complete algorithm
- **Current Knowledge:** "Exists as a concept"
- **Missing:** Calculation method, star movements, palace activation
- **Impact:** Cannot provide monthly forecasts
- **Severity:** HIGH - Value-added feature
- **Solution:** Phase 2 scraping (科技紫微網 - PRIMARY SOURCE)

### 6. Daily Luck System (流日) - Complete Rules 🟡 MEDIUM
- **Gap:** Minimal knowledge
- **Current Knowledge:** "Exists at concept level"
- **Missing:** Complete calculation & interpretation
- **Impact:** Daily forecasting capability
- **Severity:** MEDIUM - Advanced feature
- **Solution:** Phase 2+ research (limited sources available)

### 7. Four Transformations System (四化) - Full Detail 🔴 CRITICAL
- **Gap:** Basic understanding, missing nuance
- **Current Knowledge:**
  - Lu (祿), Quan (權), Ke (科), Ji (忌) exist
  - General associations (wealth, power, success, detriment)
- **Missing:**
  - Each transformation by heavenly stem (10 configurations × 4 types = 40 rules minimum)
  - How transformations interact with stars
  - How transformations affect different palaces
  - Transformation intensity & priority rules
  - Conflicting transformations resolution
  - Star-specific transformation meanings
- **Impact:** Cannot accurately apply transformation layer
- **Severity:** CRITICAL
- **Solution:** Phase 2 scraping (星林學苑, Vocus - PRIMARY SOURCES)

### 8. Flying Stars System (飛星) - Movement Rules 🟠 HIGH
- **Gap:** Concept known, detailed rules unclear
- **Current Knowledge:** "Stars move across palaces over time"
- **Missing:**
  - Specific star movement patterns
  - Activation conditions
  - Time period mappings
  - Palace-specific flying star rules
  - Flying star intensity by period
- **Impact:** Cannot apply flying stars for forecasting
- **Severity:** HIGH
- **Solution:** Phase 1 & 2 scraping (ziwei.asia - PRIMARY SOURCE)

### 9. Complex Star Combinations & Patterns 🟠 HIGH
- **Gap:** Have basic patterns (Sha Po Lang, Fu Xiang), missing:
- **Current:** 25+ rules documented
- **Missing:** 100+ additional pattern combinations
  - Triple star combinations
  - Four-star synergies
  - Opposing star cancellations
  - Star mutual reinforcement
  - Context-dependent pattern meanings
- **Impact:** Cannot analyze complex chart patterns
- **Severity:** HIGH - Advanced interpretation
- **Solution:** Phase 3 & 4 scraping (Academy resources, real chart examples)

### 10. Palace Interactions & Associations 🟠 HIGH
- **Gap:** 12 palaces known, palace relationships unclear
- **Current Knowledge:** Individual palace meanings
- **Missing:**
  - How palaces influence each other
  - Main palace (命宮) relationships
  - Opposition palace effects
  - Trine relationships
  - Quincunx relationships
- **Impact:** Cannot understand chart-wide implications
- **Severity:** HIGH
- **Solution:** Phase 3 scraping (Educational resources)

### 11. Wang Ting Zhi Specific Rules & Nuances 🔴 CRITICAL
- **Gap:** Haven't accessed 王亭之's complete works
- **Current Knowledge:** Basic 中州派 framework
- **Missing:**
  - Specific interpretative nuances from 王亭之
  - His calculation preferences
  - His system-specific refinements
  - Advanced techniques unique to 中州派
  - 王亭之's emphasis on particular stars/palaces
- **Impact:** Using incomplete authoritative source
- **Severity:** CRITICAL - Authority validation
- **Solution:** Phase 1 scraping (Zhihu, Weread, Scribd - CRITICAL)

### 12. Luck Cycle Life Stage Mapping 🟡 MEDIUM
- **Gap:** Age-based mappings unclear
- **Current Knowledge:** Ages exist (6, 16, 26, etc.)
- **Missing:**
  - Exact life stage to age mapping
  - What determines initial decade luck palace
  - Progression algorithm through palaces
  - Individual variations/exceptions
- **Impact:** Cannot map fortune to specific life stages
- **Severity:** MEDIUM
- **Solution:** Phase 2 scraping (Inzense - detailed guides)

### 13. Yin-Yang & Five Element Interactions 🟡 MEDIUM
- **Gap:** Classifications exist, interactions unclear
- **Current Knowledge:** Stars have yin-yang & 五行 properties
- **Missing:**
  - How yin-yang properties interact
  - Five element mutual generation/destruction rules
  - Star strength based on element support
  - Imbalance problems & solutions
- **Impact:** Cannot apply elemental analysis
- **Severity:** MEDIUM - Intermediate feature
- **Solution:** Phase 3 scraping (Educational resources)

### 14. Gender-Specific Interpretations 🟡 MEDIUM
- **Gap:** Whether star meanings differ by gender
- **Current Knowledge:** "Gender field exists in system"
- **Missing:**
  - Do male/female charts interpret differently?
  - Star meanings variation by gender
  - Historical vs modern interpretations
  - Cultural context variations
- **Impact:** May provide gender-biased interpretations
- **Severity:** MEDIUM - Quality issue
- **Solution:** Phase 4 research (Multiple sources comparison)

### 15. Regional/School Variations 🟡 MEDIUM
- **Gap:** Other schools (San He, etc.) vs Zhongzhou
- **Current Knowledge:** "Zhongzhou is authoritative"
- **Missing:**
  - Differences from San He school
  - Taiwan school variations
  - Regional interpretation differences
  - When to use which approach
- **Impact:** May conflict with user's school preference
- **Severity:** MEDIUM - Context awareness
- **Solution:** Phase 4 research (Comparative analysis)

### 16. Calendar Conversion Details 🟡 MEDIUM
- **Gap:** Gregorian to Lunar conversion implementation
- **Current Knowledge:** System field exists
- **Missing:**
  - Exact conversion algorithm
  - Edge cases (leap months, daylight saving)
  - Timezone corrections
  - Historical calendar corrections (pre-1900)
- **Impact:** Cannot accurately convert user input dates
- **Severity:** MEDIUM - Data input quality
- **Solution:** Implementation research (Specialized libraries/research)

### 17. Accuracy Metrics & Validation 🟠 HIGH
- **Gap:** No empirical validation data
- **Current Knowledge:** "Rules exist"
- **Missing:**
  - Accuracy statistics for rules
  - Historical case validation
  - Fortune prediction success rates
  - Rule reliability by category
  - Confidence scores for each rule
- **Impact:** Cannot assess prediction quality
- **Severity:** HIGH - Quality assurance
- **Solution:** Phase 4 & continuous (De Gruyter, real chart analysis)

### 18. Modern vs Classical Interpretations 🟡 MEDIUM
- **Gap:** Whether interpretations differ over time
- **Current Knowledge:** "Have both references"
- **Missing:**
  - Which modern changes are valid?
  - Historical accuracy concerns
  - Cultural shift effects
  - Contemporary relevance vs tradition
- **Impact:** May provide outdated advice
- **Severity:** MEDIUM - Relevance
- **Solution:** Phase 4 research (Multiple sources, forums)

### 19. Edge Cases & Special Situations 🟡 MEDIUM
- **Gap:** What about unusual charts?
- **Current Knowledge:** Standard 12-palace system
- **Missing:**
  - Multiple stars in same palace rules
  - Missing stars in palace meanings
  - Intercepted palaces (if applicable)
  - Retrograde effects (if applicable)
  - Special day/time conditions
- **Impact:** Errors on unusual charts
- **Severity:** MEDIUM - Error prevention
- **Solution:** Phase 4 research (Forum discussions, case studies)

### 20. User Context & Questions 🟠 HIGH
- **Gap:** What do actual users want?
- **Current Knowledge:** Basic chart interpretation
- **Missing:**
  - Most asked questions
  - Interpretation depth desired
  - Decision-making support needed
  - Career/wealth/relationship priorities
  - Compatibility analysis methods
- **Impact:** Providing unwanted information
- **Severity:** HIGH - User relevance
- **Solution:** User feedback loop (Post-launch)

---

## Summary: Coverage By Category

| Category | Known % | Gap % | Severity | Priority |
|----------|---------|-------|----------|----------|
| 14 Main Stars | 85% | 15% | CRITICAL | 1 |
| 90 Secondary/Minor Stars | 0% | 100% | CRITICAL | 1 |
| Star-Palace Combinations | 4% | 96% | CRITICAL | 1 |
| Decade Luck (大運) | 20% | 80% | CRITICAL | 1 |
| Annual Luck (流年) | 30% | 70% | CRITICAL | 1 |
| Monthly Luck (流月) | 10% | 90% | CRITICAL | 1 |
| Daily Luck (流日) | 5% | 95% | HIGH | 2 |
| Four Transformations (四化) | 25% | 75% | CRITICAL | 1 |
| Flying Stars (飛星) | 30% | 70% | HIGH | 2 |
| Complex Patterns | 20% | 80% | HIGH | 2 |
| Palace Interactions | 40% | 60% | HIGH | 2 |
| Accuracy Metrics | 0% | 100% | HIGH | 3 |

---

## Impact on Current System

### What WORKS Now:
✅ Basic chart calculation (positions of 14 main stars)
✅ Chart visualization (4×3 grid display)
✅ Basic palace meanings for main stars
✅ 25+ pattern rules
✅ Rule evaluation system
✅ UI/UX for input

### What DOESN'T WORK:
❌ Complete star interpretations (74/104 stars missing)
❌ Decade fortune predictions (algorithm not implemented)
❌ Annual/monthly/daily forecasts (not implemented)
❌ Transformation layer (not fully applied)
❌ Flying stars analysis (not implemented)
❌ Complex pattern matching (limited rules)
❌ Accuracy validation (no metrics)
❌ User question handling (limited context)

---

## Resolution Plan: 9-Week Timeline

| Week | Phase | Task | Closes |
|------|-------|------|--------|
| 1-2 | 1 | Scrape primary sources | Gaps 1,2,11 (partially) |
| 3-4 | 2 | Scrape luck cycles & transformations | Gaps 3,4,5,6,7,8 |
| 5-7 | 3 | Scrape complete star dictionary | Gaps 1,2,9,10 |
| 8-9 | 4 | Verify & complete | Gaps 12-19 (partially) |
| 10+ | Continuous | User feedback & refinement | Gap 20 (ongoing) |

---

## Knowledge Gap Risk Assessment

**HIGH RISK (Immediate addressing needed):**
- All 104 stars meanings (Risk: Incomplete interpretations)
- Decade luck system (Risk: Cannot predict fortunes)
- Four transformations (Risk: Missing important layer)

**MEDIUM RISK (Address in phases 3-4):**
- Complex patterns (Risk: Miss valuable insights)
- Palace interactions (Risk: Incomplete analysis)
- Accuracy metrics (Risk: False confidence)

**LOW RISK (Address continuously):**
- Gender variations (Risk: Biased interpretations)
- Regional variations (Risk: School conflicts)
- Edge cases (Risk: Occasional errors)

---

## Continuous Knowledge Improvement

### During Phase 1-4 Scraping:
- Track all sources and confidence levels
- Document all conflicts/variations
- Create "research TODO" for unclear areas
- Build empirical validation dataset

### Post-Launch (Ongoing):
- Collect user questions → identify knowledge gaps
- Validate predictions against real outcomes
- User feedback on interpretation accuracy
- Iteratively improve confidence scores
- Add new patterns/rules as discovered

---

**Document Date:** 2026-02-18
**Current Knowledge Completeness:** ~15%
**Target After Phase 4:** ~85%
**Target After 1 Year:** 95%+
