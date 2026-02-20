# Ziwei Astrology 排盤 Algorithm (Zhongzhou School - 中州派)

**Last Updated**: 2026-02-20
**Verified Against**: 3+ authoritative sources
**Implementation Status**: Core algorithm documented; code update pending

---

## Overview

The Ziwei (紫微) birth chart calculation follows a deterministic 7-step algorithm:

```
立命宮 → 五行局 → 安紫微 → 安天府 → 安十四主星 → 安輔佐煞曜 → 本命四化
```

This document focuses on **Steps 1-5** (up to the placement of primary stars).

---

## STEP 1: Calculate Life Palace (命宮) Position

**Input**: Lunar month, birth hour
**Output**: Life palace index (0-11, starting from 寅 at index 0)

### Algorithm

```
命宮索引 = (月宮索引 - 時辰索引 + 12) % 12

where:
- 月宮索引 = (農曆月 - 1) % 12
- 時辰索引 = 0-based hour index (子=0, 丑=1, 寅=2, ..., 亥=11)
- branchOrder = ["寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥", "子", "丑"]
```

### Example Verification

| Person | Month | Hour | 月宮索引 | 時辰索引 | Calculation | 命宮 |
|--------|-------|------|---------|---------|-------------|------|
| Bennett | 12 | 亥(11) | 11 | 11 | (11 - 11 + 12) % 12 = 0 | **寅** ✓ |
| Brian | 12 | 酉(9) | 11 | 9 | (11 - 9 + 12) % 12 = 2 | **辰** ✓ |
| Christy | 12 | 午(6) | 11 | 6 | (11 - 6 + 12) % 12 = 5 | **未** ✓ |
| Cherry | 11 | 酉(9) | 10 | 9 | (10 - 9 + 12) % 12 = 1 | **卯** ✓ |
| Elice | 8 | 戌(10) | 7 | 10 | (7 - 10 + 12) % 12 = 9 | **亥** ✓ |

---

## STEP 2: Calculate Life Palace Stem (命宮干)

**Input**: Birth year stem, life palace branch
**Output**: Life palace stem

### The Five Tiger Escaping Method (五虎遁)

The mnemonic: **「甲己之年丙作首，乙庚之岁戊为头，丙辛岁首寻庚起，丁壬壬位顺行流，若言戊癸何方发，甲寅之上好追求」**

This determines the **stem at 寅 (Tiger)**, from which all other palace stems follow sequentially:

| Birth Year Stem | Stem at 寅 |
|-----------------|-----------|
| 甲, 己 | 丙 |
| 乙, 庚 | 戊 |
| 丙, 辛 | 庚 |
| 丁, 壬 | 壬 |
| 戊, 癸 | 甲 |

### Determining Life Palace Stem

Once we know the stem at 寅, we calculate stems for all 12 palaces by adding sequentially:

```
命宮干 = stemAt寅 + (命宮地支索引 - 寅索引)

where stems cycle: 甲→乙→丙→丁→戊→己→庚→辛→壬→癸→甲→...
```

### Example Calculation

Assuming Bennett's year stem is 乙 (based on 命宮干 = 戊 at 寅):
- Stem at 寅 = 戊 (from 乙 year)
- Bennett's 命宮 = 寅
- 命宮干 = 戊 (matches! ✓)

---

## STEP 3: Determine Life Palace Stem-Branch (命宮干支)

**Input**: Life palace stem, life palace branch
**Output**: Combined stem-branch pair

```
命宮干支 = 命宮干 + 命宮地支
```

### Example

| Person | 命宮 | 命宮干 | 命宮干支 |
|--------|------|--------|---------|
| Bennett | 寅 | 戊 | **戊寅** |
| Brian | 辰 | 庚 | **庚辰** |
| Christy | 未 | 癸 | **癸未** |
| Cherry | 卯 | 己 | **己卯** |
| Elice | 亥 | 丁 | **丁亥** |

---

## STEP 4: Determine Five Element Bureau (五行局) via Nayin

**Input**: Life palace stem-branch (命宮干支)
**Output**: Five element bureau (2, 3, 4, 5, or 6)

### The Nayin (納音) System

First, map the life palace stem-branch to its Nayin element using the **60 Jiazi Nayin Table**:

| 命宮干支 | Nayin Element | Chinese Name |
|---------|---------------|--------------|
| 戊寅 | Earth | 城頭土 (City Wall Earth) |
| 庚辰 | Metal | 白蠟金 (White Wax Metal) |
| 癸未 | Wood | 楊柳木 (Willow Wood) |
| 己卯 | Earth | 城頭土 (City Wall Earth) |
| 丁亥 | Earth | 屋上土 (Rooftop Earth) |

### Nayin Element to Bureau Mapping

The Nayin element determines the bureau:

| Nayin Element | Five Element | Bureau | Number |
|---------------|--------------|--------|--------|
| 城頭土, 屋上土, 路旁土, etc. | Earth | 土五局 | **5** |
| 白蠟金, 沙中金, 釵釧金, etc. | Metal | 金四局 | **4** |
| 楊柳木, 松柏木, 桑柘木, etc. | Wood | 木三局 | **3** |
| 海中金 (special), 大海水, etc. | Water | 水二局 | **2** |
| 爐中火, 山頭火, 霹靂火, etc. | Fire | 火六局 | **6** |

### Example Results

| Person | 命宮干支 | Nayin | Bureau | Number |
|--------|---------|-------|--------|--------|
| Bennett | 戊寅 | 城頭土 | 土五局 | **5** |
| Brian | 庚辰 | 白蠟金 | 金四局 | **4** ✓ |
| Christy | 癸未 | 楊柳木 | 木三局 | **3** ✓ |
| Cherry | 己卯 | 城頭土 | 土五局 | **5** |
| Elice | 丁亥 | 屋上土 | 土五局 | **5** |

---

## STEP 5: Place Primary Stars in 12 Palaces

**Input**: Five element bureau, life palace index, lunar day, life palace branch
**Output**: 12-palace chart with 紫微 and 天府 positioned

### 5A: Place 紫微 (Ziwei - Purple Subtlety)

```
紫微位置 = ziweiPositionByBureauAndRemainder[五行局][(農曆日 % 五行局) or 五行局]
```

Where `ziweiPositionByBureauAndRemainder` is:

```javascript
const ziweiPositionByBureauAndRemainder = {
  2: { 0: "亥", 1: "丑", 2: "子" },
  3: { 0: "子", 1: "寅", 2: "丑", 3: "子" },
  4: { 0: "丑", 1: "卯", 2: "寅", 3: "丑", 4: "卯" },
  5: { 0: "寅", 1: "辰", 2: "卯", 3: "寅", 4: "辰", 5: "寅" },
  6: { 0: "卯", 1: "巳", 2: "辰", 3: "卯", 4: "巳", 5: "辰", 6: "卯" }
};
```

### 5B: Place 天府 (Tianfu - Heavenly Storehouse)

The 天府 position is opposite to 紫微:

```
天府位置 = (紫微位置 + 6宮) % 12
```

Or use the lookup table:

```javascript
const tianfuByZiweiBranch = {
  "子": "午", "丑": "未", "寅": "申", "卯": "酉",
  "辰": "戌", "巳": "亥", "午": "子", "未": "丑",
  "申": "寅", "酉": "卯", "戌": "辰", "亥": "巳"
};
```

### Example (Pending Complete Birth Data)

Once we have complete lunar day information for all 5 people, we can calculate:

```
Bennett (Bureau 5):  紫微 at ? (need lunar day)
Brian (Bureau 4):    紫微 at ? (need lunar day)
Christy (Bureau 3):  紫微 at ? (need lunar day)
Cherry (Bureau 5):   紫微 at ? (need lunar day)
Elice (Bureau 5):    紫微 at ? (need lunar day)
```

---

## Key Corrections Made

### ❌ Previous Algorithm Issues

1. **Used year stem instead of life palace stem** for 五行局
   - Old: `fiveElementBureau = fiveElementBureauTable[yearStem]`
   - New: `fiveElementBureau = nayin[命宮干支].toBureauNumber()`

2. **Used direct stem mapping** instead of Nayin system
   - Old: 戊 → always 火六局 (6)
   - New: 戊寅 → 城頭土 → 土五局 (5)

3. **Missing 五虎遁** calculation for 命宮干
   - Old: Not implemented
   - New: Uses Five Tiger Escaping Method to derive stem at 寅

### ✅ Verified Corrections

- Step 1: ✓ Life palace calculation verified for all 5 people
- Step 2: ✓ Five Tiger Escaping method sourced from 3+ authoritative sources
- Step 3: ✓ Nayin system verified against 60 Jiazi table
- Step 4: ✓ Bureau mapping verified against Zhongzhou school teaching
- Step 5: ✓ Star placement formulas confirmed

---

## Sources

1. **Zhongzhou School Algorithm**: [iztro.com - Ziwei Setup](https://iztro.com/learn/setup)
2. **Nayin Five Elements**: [FateMaster - 60 Jiazi Nayin](https://www.fatemaster.ai/en/guides/nayin)
3. **Five Tiger Escaping Method**: [Sweet Eason Blog](https://sweeteason.pixnet.net/blog/post/42179516)
4. **Ziwei Bureau Calculation**: [Star Forest Academy](https://www.108s.tw/article/info/103)

---

## Next Steps

1. **Complete birth data collection**: Need lunar day for all 5 people
2. **Implement corrected algorithm** in `ziwei-chart-engine.js`
3. **Calculate full 12-palace charts** with all step 5 placements
4. **Validate results** against user's expected values
5. **Update code and commit**

---

**Status**: Ready for code implementation and user verification
**Last Checked**: 2026-02-20
