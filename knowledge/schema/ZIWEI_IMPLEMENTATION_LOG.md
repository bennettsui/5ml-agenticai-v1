# Ziwei 排盤 Algorithm - Implementation Lock Log

**Purpose**: Track all locked, verified algorithms and prevent unauthorized changes.

**Last Updated**: 2026-02-20 (STEP 4.5 added & locked)

---

## 🔒 Locked Algorithms Registry

### STEP 1: Life Palace (命宮) Calculation
- **Status**: ✅ LOCKED - Verified Correct
- **Formula**: `(month_idx - hour_idx + 10) % 12`
- **Verified Date**: 2026-02-20
- **Test Cases**: All 5 people (Bennett, Brian, Christy, Cherry, Elice)
- **Sources**: Zhongzhou School methodology, verified against 3+ sources
- **Change Approval Required**: YES

### STEP 2: Life Palace Stem (命宮干) - 五虎遁
- **Status**: ✅ LOCKED - Verified Correct
- **Method**: Five Tiger Escaping (五虎遁) lookup table
- **Verified Date**: 2026-02-20
- **Test Cases**: All 5 people ✓
- **Sources**: Zhongzhou School, Sweet Eason Blog
- **Change Approval Required**: YES

### STEP 3: Life Palace Stem-Branch (命宮干支)
- **Status**: ✅ LOCKED - Verified Correct
- **Formula**: `stem + branch` (simple concatenation)
- **Verified Date**: 2026-02-20
- **Test Cases**: All 5 people ✓
- **Change Approval Required**: YES

### STEP 4: Five Element Bureau (五行局)
- **Status**: ✅ LOCKED - Verified Correct
- **Method**: Nayin (納音) system lookup based on 命宮干支
- **Verified Date**: 2026-02-20
- **Test Cases**: All 5 people ✓
- **Bureau Mapping**: 2(水)/3(木)/4(金)/5(土)/6(火)
- **Sources**: 60 Jiazi Nayin table
- **Change Approval Required**: YES

### STEP 4.5: All 12 Palace Stems (12宮天干排列)
- **Status**: ✅ LOCKED - Verified Correct
- **Method**: Start from 寅 position using 五虎遁, count forward through 10-stem cycle
- **Key Principle**: Each stem appears exactly 2x in 12-palace cycle (10 stems ÷ 12 branches)
- **Verified Date**: 2026-02-20
- **Test Cases**: All 5 people ✓
  - Bennett: 寅(丙)→卯(丁)→辰(戊)→...→丑(丁) ✓
  - Brian: 寅(庚)→卯(辛)→辰(壬)→...→丑(辛) ✓
  - Christy: 寅(丙)→卯(丁)→辰(戊)→...→丑(丁) ✓
  - Cherry: 寅(戊)→卯(己)→辰(庚)→...→丑(己) ✓
  - Elice: 寅(壬)→卯(癸)→辰(甲)→...→丑(癸) ✓
- **Sources**: 星林學苑, 紫微斗數排盤教學, iztro methodology
- **Change Approval Required**: YES

### STEP 5A: Ziwei (紫微) Placement
- **Status**: ✅ LOCKED - Verified Correct
- **Method**: **Odd/Even Difference Method** (NOT remainder table!)
- **Formula**:
  ```
  quotient = ceil(day / bureau)
  difference = (quotient × bureau) - day
  if difference % 2 == 0:
      finalNumber = quotient + difference
  else:
      finalNumber = quotient - difference
  ziweiIndex = (finalNumber - 1) % 12
  ```
- **Verified Date**: 2026-02-20
- **Test Cases**: All 5 people ✓
- **❌ WRONG Method**: Simple remainder table (produces incorrect results!)
- **Change Approval Required**: YES

### STEP 5B: Tianfu (天府) Placement
- **Status**: ✅ LOCKED - Verified Correct
- **Method**: **FIXED MNEMONIC MAPPING** (NOT simply opposite!)
- **Mnemonic**: "天府南斗令，常對紫微宮，丑卯相更迭，未酉互為根。往來午與戌，蹀躞子和辰，已亥交馳騁，同位在寅申"
- **Mapping Table**:
  ```
  寅→寅  卯→丑  辰→子  巳→亥
  午→戌  未→酉  申→申  酉→未
  戌→午  亥→巳  子→辰  丑→卯
  ```
- **Verified Date**: 2026-02-20
- **Test Cases**: All 5 people ✓
- **Change Approval Required**: YES

---

## ✅ Verified Test Cases

All algorithms locked after verification against 5 test cases:

| # | Name | Birth Date | Hour | 命宮 | 命宮干支 | Bureau | Ziwei | Tianfu |
|---|------|-----------|------|------|---------|--------|-------|--------|
| 1 | Bennett | Lunar 3 Dec 1984 | 亥時 | 寅 | 丙寅 | 6 | 亥 | 巳 ✓ |
| 2 | Brian | Lunar 17 Dec 1986 | 酉時 | 辰 | 壬辰 | 2 | 酉 | 未 ✓ |
| 3 | Christy | Lunar 2 Dec 1989 | 午時 | 未 | 辛未 | 5 | 亥 | 巳 ✓ |
| 4 | Cherry | Lunar 4 Nov 1990 | 酉時 | 卯 | 己卯 | 5 | 丑 | 卯 ✓ |
| 5 | Elice | Lunar 14 Aug 1982 | 戌時 | 亥 | 辛亥 | 4 | 未 | 酉 ✓ |

---

## 📋 Change Request Process

To request changes to ANY locked algorithm:

1. **Create GitHub Issue** with:
   - Which algorithm/step to change
   - Why the change is needed
   - What the new formula/method should be
   - At least 3 sources verifying the new method
   - Test cases showing it's better

2. **User Reviews** the request and either:
   - ✅ Approves (adds to lock log with new date)
   - ❌ Rejects (keeps existing locked version)

3. **Implementation**: Only after approval, update:
   - ZIWEI_ALGORITHM.md
   - ZIWEI_IMPLEMENTATION_LOG.md
   - Python/JavaScript code
   - All related tests

---

## 🚫 Do NOT Change Without Approval:

The following files contain locked algorithm sections:
- `knowledge/schema/ZIWEI_ALGORITHM.md` (STEP 1-5, STEP 4.5)
- `knowledge/schema/ZIWEI_IMPLEMENTATION_LOG.md` (this file)

Any commits modifying these sections without user approval will be blocked.

---

## Future Steps (NOT yet locked):

- ⏳ STEP 6: 14 Major Stars Placement (pending)
- ⏳ STEP 7: Auxiliary Stars & Calamity Stars (pending)
- ⏳ STEP 8: Four Transformations (四化) (pending)

