# Ziwei 紫微斗數 Comprehensive Knowledge Scraping Plan

**Objective:** Build a complete 104-star knowledge database with all palace meanings, transformation rules, and luck cycle calculations

**Authority Base:** 王亭之 (Wang Ting Zhi) & 中州派 (Zhongzhou School)

**Total Target Data:** ~115,000 lines of structured knowledge

---

## Executive Summary

We have identified **32 high-quality sources** prioritized by reliability and coverage. The scraping will be done in **4 phases** to systematically build the knowledge base:

1. **Phase 1** - Primary sources (王亭之, authoritative Zhongzhou materials)
2. **Phase 2** - Specialized knowledge (Luck cycles, transformations)
3. **Phase 3** - Educational resources (Star dictionaries, palace meanings)
4. **Phase 4** - Verification & completeness (Practical tools, additional coverage)

---

## Phase 1: Critical Foundation (Priority 1)

### Duration: Weeks 1-2
### Target: 50,000+ lines
### Authority Level: ⭐⭐⭐⭐⭐

#### Sources to Scrape:

**1. Zhihu - Wang Ting Zhi Collection (MOST COMPREHENSIVE)**
- **URL:** https://zhuanlan.zhihu.com/p/690223394
- **Content:** Complete teachings from 王亭之
- **Expected Coverage:**
  - All 104 stars with base meanings
  - All 12 palaces overview
  - Historical context
  - Fundamental theories
- **Extraction Method:**
  - Use web scraper to extract article text
  - Parse markdown/HTML structure
  - Map to star IDs and palace references
- **Priority:** 🔴 CRITICAL - PRIMARY SOURCE

**2. Ziwei.asia - Official Sihua Institute**
- **URL:** https://ziwei.asia/
- **Content:** Official flying stars system & interpretations
- **Expected Coverage:**
  - Star meanings in each palace
  - Flying stars (飛星) rules
  - Official interpretation guidelines
- **Extraction Method:**
  - Scrape all subpages under /ZWDS/
  - Extract tables & interpretation guides
  - Cross-reference with other sources
- **Priority:** 🔴 CRITICAL

**3. Weread - Wang Ting Zhi Complete Books**
- **URL:** https://weread.qq.com/
- **Content:** Complete published works by 王亭之
- **Expected Coverage:**
  - 斗數四書 (Four Books of Doushu)
  - 紫微斗數講義 (Ziwei Doushu Lectures)
  - 中州派紫微斗數初級講義 (Elementary Lectures)
- **Extraction Method:**
  - API access or web scraping with authentication
  - Extract chapter content
  - Organize by topic
- **Priority:** 🔴 CRITICAL - AUTHORITATIVE

**4. Scribd - Wang Ting Zhi Advanced Lectures**
- **URL:** https://www.scribd.com/
- **Content:** 紫薇斗數深造講義 (Advanced Lectures)
- **Expected Coverage:**
  - Advanced star interactions
  - Complex pattern analysis
  - Deep interpretations
- **Extraction Method:**
  - Web scraper or API
  - Convert PDF to text
  - Extract structured data
- **Priority:** 🔴 CRITICAL

#### Phase 1 Deliverables:
- [ ] 104 stars with base meanings (Chinese & English)
- [ ] 12 palaces overview
- [ ] 王亭之 primary teachings documentation
- [ ] Transformation theory foundation
- [ ] Flying stars basic rules

---

## Phase 2: Specialized Knowledge (Priority 2)

### Duration: Weeks 3-4
### Target: 20,000+ lines
### Authority Level: ⭐⭐⭐⭐

#### Sources to Scrape:

**1. Inzense - Decade Luck Complete Guide (大運)**
- **URL:** https://www.inzense.com.tw/en/...
- **Target:** All decade luck (大運) calculation rules
- **Expected Data:**
  - Decade luck calculation algorithm
  - Star positions in decade luck periods
  - Transformations in each decade
  - Case studies & examples
- **Priority:** 🟠 HIGH

**2. 星林學苑 - Four Transformations System (四化)**
- **URL:** https://www.108s.tw/article/info/85
- **Target:** Complete transformation system
- **Expected Data:**
  - Lu (祿) meanings & applications
  - Quan (權) meanings & applications
  - Ke (科) meanings & applications
  - Ji (忌) meanings & applications
  - Transformation by heavenly stem
- **Priority:** 🟠 HIGH

**3. 科技紫微網 - Monthly Luck System (流月)**
- **URL:** https://news.click108.com.tw/2022/01/ziwei/7048/
- **Target:** Monthly luck rules
- **Expected Data:**
  - Monthly luck calculation
  - Star movements per month
  - Activation rules
- **Priority:** 🟠 HIGH

**4. Vocus - Four Transformations Multiple Guides (四化)**
- **URL:** https://vocus.cc/
- **Target:** Comprehensive transformation meanings
- **Expected Data:**
  - Different interpretations of 四化
  - Transformation by palace
  - Real-world applications
- **Priority:** 🟠 HIGH

#### Phase 2 Deliverables:
- [ ] Complete 大運 (Decade Luck) system rules
- [ ] Complete 流年 (Annual Luck) system rules
- [ ] Complete 流月 (Monthly Luck) system rules
- [ ] Complete 四化 (Four Transformations) system
  - [ ] Lu (祿) - Wealth transformation
  - [ ] Quan (權) - Power transformation
  - [ ] Ke (科) - Success transformation
  - [ ] Ji (忌) - Detriment transformation
- [ ] Flying stars (飛星) movement rules

---

## Phase 3: Comprehensive Dictionary & Palace Meanings (Priority 2)

### Duration: Weeks 5-7
### Target: 30,000+ lines
### Authority Level: ⭐⭐⭐⭐

#### Sources to Scrape:

**1. Zi Wei Dou Shu Academy**
- **URL:** https://ziweidoushuacademy.com/
- **Target:** All 104 stars with palace meanings
- **Expected Coverage:**
  - 14 main stars × 12 palaces = 168 combinations
  - Secondary stars × 12 palaces
  - Minor stars × 12 palaces
- **Data Structure:**
  ```
  Star: [Name]
  Palace: [Name]
  Meaning: [Interpretation]
  Career: [Impact]
  Wealth: [Impact]
  Relationship: [Impact]
  Health: [Impact]
  ```
- **Priority:** 🟠 HIGH

**2. Fusang Vision - 14 Main Stars Dictionary**
- **URL:** https://fusang-vision.com/
- **Target:** 14 primary stars detailed meanings
- **Expected Data:**
  - Deep character analysis for each star
  - Palace-specific meanings
  - Star combinations
- **Priority:** 🟠 HIGH

**3. Gagan Sarkaria - All 104 Stars Reference**
- **URL:** https://gagansarkaria.com/zi-wei-dou-shu-stars/
- **Target:** Complete 104 stars definitions
- **Expected Coverage:**
  - Each star's meaning
  - Palace-specific interpretations
  - Flying stars information
- **Priority:** 🟠 HIGH

**4. Flourish Astrology - Star Dictionary**
- **URL:** https://flourishastrology.com/
- **Target:** Detailed star interpretations
- **Expected Data:**
  - Star characteristics
  - Palace associations
  - Practical applications
- **Priority:** 🟠 MEDIUM

**5. Click108 - 紫微教學 (Comprehensive Teaching Portal)**
- **URL:** https://www.click108.com.tw/
- **Target:** All teaching materials
- **Expected Data:**
  - Star meanings
  - Palace analysis
  - System rules
- **Priority:** 🟠 MEDIUM

#### Phase 3 Deliverables:
- [ ] All 104 stars × 12 palaces = 1,248 star-palace combinations
- [ ] Each combination with:
  - [ ] Chinese meaning
  - [ ] English translation
  - [ ] Career impact
  - [ ] Wealth impact
  - [ ] Relationship impact
  - [ ] Health impact
- [ ] Star interaction rules
- [ ] Star combination meanings

---

## Phase 4: Verification & Completeness (Priority 3)

### Duration: Weeks 8+
### Target: 15,000+ lines
### Authority Level: ⭐⭐⭐

#### Sources to Scrape:

**1. Ming Ming Guan Zhi - Tools & Verification**
- **URL:** https://mingming3.com/
- **Target:** Practical applications & verification
- **Data:** Real chart examples, forecast validations

**2. Sean Chan's School - Practical Interpretations**
- **URL:** https://www.masterseanchan.com/
- **Target:** Real-world chart analysis

**3. Wikipedia - Historical Context & Schools Comparison**
- **URL:** https://en.wikipedia.org/wiki/Ziwei_doushu
- **Target:** System overview, school differences

**4. De Gruyter Brill - Academic Validation**
- **URL:** https://www.degruyterbrill.com/
- **Target:** Scholarly research & empirical validation

#### Phase 4 Deliverables:
- [ ] Cross-validation with multiple sources
- [ ] Conflict resolution & reconciliation
- [ ] Accuracy metrics
- [ ] Gap identification & supplementation
- [ ] Final knowledge base verification

---

## Data Structure & Schema

### 1. Stars Table (104 entries)
```json
{
  "star_id": "star_001",
  "chinese_name": "紫微",
  "english_name": "Ziwei (Purple Celestial Worthy)",
  "star_type": "major",
  "five_element": "water",
  "yin_yang": "yin",
  "base_meaning_zh": "...",
  "base_meaning_en": "...",
  "character_traits": ["dominant", "authoritative"],
  "source_ids": ["source-002", "source-001"],
  "wang_ting_zhi_reference": true,
  "confidence_level": 0.95
}
```

### 2. Star-Palace Meanings (1,248 combinations)
```json
{
  "star_palace_id": "sp_001_001",
  "star_id": "star_001",
  "palace_id": 1,
  "palace_name": "命宮",
  "meaning_zh": "紫微在命宮：為君臨天下之象。性格堅強，喜掌權，領導力強。",
  "meaning_en": "Ziwei in Life Palace: Symbol of imperial authority...",
  "career_impact": "Excellent leadership positions",
  "wealth_impact": "Moderate to good wealth accumulation",
  "relationship_impact": "Tends toward commanding roles",
  "health_impact": "Generally good",
  "source_ids": ["source-002", "source-004"],
  "confidence_level": 0.92
}
```

### 3. Transformation Rules (440+ entries)
```json
{
  "transformation_id": "tf_001",
  "stem_id": "jia",
  "star_id": "star_001",
  "transformation_type": "lu",
  "transformation_meaning_zh": "祿化：增進、順利、收獲",
  "transformation_meaning_en": "Lu Transformation: Progress, smoothness, abundance",
  "affects_palace_id": 5,
  "effect_description": "When Ziwei 祿化 appears in Wealth Palace...",
  "source_ids": ["source-008", "source-011"]
}
```

### 4. Luck Cycle Rules
```json
{
  "luck_type": "decade",
  "luck_id": "decade_01_10",
  "calculation_method_zh": "大運以十年為一期，從生日地支順排...",
  "star_movements": [...],
  "palace_activation_rules": [...],
  "transformation_rules": [...],
  "source_ids": ["source-007"]
}
```

---

## Implementation Timeline

| Phase | Duration | Target Lines | Status | Start | End |
|-------|----------|--------------|--------|-------|-----|
| Phase 1 | 2 weeks | 50,000 | 🟢 Ready | 2/18 | 3/4 |
| Phase 2 | 2 weeks | 20,000 | 🟡 Pending | 3/4 | 3/18 |
| Phase 3 | 3 weeks | 30,000 | 🔴 Pending | 3/18 | 4/8 |
| Phase 4 | 2+ weeks | 15,000 | 🔴 Pending | 4/8 | 4/22 |
| **Total** | **~9 weeks** | **~115,000** | | 2/18 | 4/22 |

---

## Quality Assurance

### Conflict Resolution Strategy
When sources disagree on a star or palace meaning:
1. **Priority Order:**
   - 王亭之 (Wang Ting Zhi) / Zhongzhou School materials
   - Official institutes (ziwei.asia)
   - Multiple educational sources agreement
   - Individual practitioner sources

2. **Documentation:**
   - Record all sources for each interpretation
   - Note conflicts explicitly
   - Include confidence scores
   - Flag for manual review if needed

### Validation Checklist
- [ ] All 104 stars documented
- [ ] All 1,248 star-palace combinations covered
- [ ] All 四化 transformations mapped
- [ ] All luck cycles explained
- [ ] Cross-source conflicts resolved
- [ ] Wang Ting Zhi authoritative reference confirmed
- [ ] Confidence scores assigned
- [ ] Gap analysis completed

---

## Estimated Database Size

| Component | Entries | Avg Size | Total |
|-----------|---------|----------|-------|
| Stars | 104 | 500 chars | 52 KB |
| Star-Palace | 1,248 | 800 chars | 1.0 MB |
| Transformations | 440 | 600 chars | 264 KB |
| Luck Cycles | 10+ | 5,000 chars | 50+ KB |
| Flying Stars | 100+ | 2,000 chars | 200+ KB |
| **Total** | | | **~1.5 MB** |

---

## Next Steps

1. ✅ **Identify & prioritize sources** (COMPLETED)
2. 🟡 **Begin Phase 1 scraping** (NEXT - Priority 1 sources)
3. 🔴 **Build automated scraper** (Weeks 1-2)
4. 🔴 **Process & structure data** (Weeks 2-3)
5. 🔴 **Cross-validate & reconcile** (Ongoing)
6. 🔴 **Integrate into database** (Weeks 4-9)
7. 🔴 **Build API endpoints** (Weeks 7-9)
8. 🔴 **Update UI components** (Weeks 8-9)

---

## Success Criteria

✅ **Phase 1 Success:**
- 104 stars documented
- 王亭之 teachings verified
- Flying stars system understood
- Database schema validated

✅ **Phase 2 Success:**
- 大運/流年/流月 rules complete
- 四化 system fully mapped
- Transformation effects documented

✅ **Phase 3 Success:**
- 1,248 star-palace combinations filled
- All palace meanings documented
- Career/wealth/relationship impacts defined

✅ **Phase 4 Success:**
- Cross-source validation complete
- Conflicts resolved with confidence scores
- Final knowledge base ready for production

---

## Maintenance & Updates

- **Frequency:** Quarterly reviews
- **Triggers:** New source discovery, user feedback, accuracy improvements
- **Process:** Evaluate new sources, integrate relevant content, update confidence scores
- **Version Control:** Track all updates with timestamps and sources

---

**Prepared:** 2026-02-18
**Authority Base:** 王亭之 (Wang Ting Zhi) & 中州派 (Zhongzhou School)
**Total Sources:** 32
**Target Knowledge:** All 104 stars + 1,248 palace combinations + Complete luck cycle system
