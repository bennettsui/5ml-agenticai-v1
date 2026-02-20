# 🔴 CRITICAL CORRECTION: 12-Palace Counterclockwise Arrangement

**Date**: 2026-02-20
**Status**: URGENT - All previous 12-palace calculations were WRONG
**Impact**: Backend algorithm needs complete rewrite with COUNTERCLOCKWISE formula

---

## Summary of Discovery

### The Problem
All previous 12-palace palace arrangements were calculated in **CLOCKWISE order**:
```
❌ WRONG: 命宮(寅) → 兄弟宮(卯) → 夫妻宮(辰) → ...
```

### The Correct Solution
The 12 palaces are actually arranged in **COUNTERCLOCKWISE order (逆時針)**, going BACKWARD:
```
✅ CORRECT: 命宮(寅) → 兄弟宮(丑) → 夫妻宮(子) → ...
```

### Evidence
Multiple Chinese astrology sources confirm:
> "逆時針方向排列為：命宮、兄弟宮、夫妻宮、子女宮、財帛宮、疾厄宮..."
> (Counterclockwise direction: Life Palace → Siblings Palace → Spouse Palace → Children Palace → Wealth Palace → Health Palace...)

Sources:
- [星林 學苑 - 兄弟宮](https://www.108s.tw/article/info/43)
- [星林 學苑 - 起盤立十二宮](https://www.108s.tw/article/info/88)

---

## Changes Required

### 1. Algorithm Updates

**File**: `/knowledge/schema/ZIWEI_ALGORITHM.md`

**Changed Section**: STEP 4.5 (Calculate All 12 Palace Stems & Branches)

**Old Formula** (WRONG):
```python
for branchIndex in range(12):  # 0=寅, 1=卯, ..., 11=丑
    palaceStemIndex = (stemAtYinIndex + branchIndex) % 10
    # Assumes clockwise order
```

**New Formula** (CORRECT):
```python
for i in range(12):
    palaceBranchIndex = (lifeHouseIndex - i) % 12  # Go BACKWARD (counterclockwise)
    palaceBranch = branchOrder[palaceBranchIndex]
    palaceStemIndex = (stemAtYinIndex + palaceBranchIndex) % 10
    palaceStem = stemOrder[palaceStemIndex]
```

### 2. Palace Matrices Updates

**Files**:
- `/knowledge/schema/ZIWEI_PALACE_MATRICES.md` → DEPRECATED (kept for reference)
- `/knowledge/schema/ZIWEI_PALACE_MATRICES_CORRECTED.md` → NEW CORRECT VERSION

**All 5 test cases recalculated**:

| Person | Old 兄弟宮 | New 兄弟宮 | Status |
|--------|-----------|-----------|--------|
| Bennett | 卯 (丁卯) | 丑 (丁丑) | ✅ CORRECTED |
| Brian | 巳 (癸巳) | 卯 (辛卯) | ✅ CORRECTED |
| Christy | 申 (壬申) | 午 (庚午) | ✅ CORRECTED |
| Cherry | 辰 (庚辰) | 寅 (戊寅) | ✅ CORRECTED |
| Elice | 子 (壬子) | 戌 (庚戌) | ✅ CORRECTED |

### 3. Backend Code Updates Required

**Files to update**:
- `/services/ziwei-chart-engine.js` - Palace calculation algorithm
- Any code using `ziweiPositionByBureauAndRemainder` or similar palace mappings
- Frontend components displaying palace arrangements

**Key Changes**:
- Replace clockwise palace iteration with counterclockwise
- Update all palace branch assignments
- Recalculate all star positions based on corrected palace locations
- Update test cases and validation data

---

## Root Cause Analysis

**Why This Happened**:
1. Initial interpretation of 12-branch cycle assumed forward/clockwise progression
2. Did not verify against authoritative sources early enough
3. The palace ordering was fundamentally misunderstood
4. Documentation from ZIWEI_PALACE_MATRICES.md propagated the error

**Why It Matters**:
1. Palace positions determine star placements
2. Star positions determine chart interpretations
3. All 5 test case charts are now COMPLETELY DIFFERENT
4. Backend algorithm must be rewritten before any implementation

---

## Verification Checklist

- [x] Discovered counterclockwise requirement from online sources
- [x] Updated STEP 4.5 algorithm documentation
- [x] Recalculated all 5 test cases with correct formula
- [x] Created new ZIWEI_PALACE_MATRICES_CORRECTED.md
- [ ] Update backend algorithm code
- [ ] Run tests to verify calculations match corrected matrices
- [ ] Update frontend visualization
- [ ] Update all documentation references
- [ ] Commit changes to repository

---

## Next Steps

1. **Backend Developer**: Update `ziwei-chart-engine.js` with counterclockwise algorithm
2. **QA/Testing**: Validate all 5 test cases against corrected matrices
3. **Frontend**: Update palace visualization layout if needed
4. **Documentation**: Update any user-facing documentation about palace arrangement

---

## Historical Record

**Previous (INCORRECT) Understanding**:
- Palaces arranged in CLOCKWISE order following natural 12-branch sequence
- 命宮 at 寅 → 兄弟宮 at 卯 → 夫妻宮 at 辰
- ZIWEI_PALACE_MATRICES.md reflected this wrong approach

**Current (CORRECT) Understanding**:
- Palaces arranged in COUNTERCLOCKWISE order (逆時針)
- 命宮 at 寅 → 兄弟宮 at 丑 → 夫妻宮 at 子
- ZIWEI_PALACE_MATRICES_CORRECTED.md reflects the correct approach

---

**Status**: Ready for backend implementation
**Confidence**: High (verified against multiple authoritative sources)
**Action Required**: Algorithm update before any further development
