#!/usr/bin/env python3
"""
Ziwei Astrology Calculator - Zhongzhou School (中州派)
Steps 1-6: Basic Chart Calculation with Formulas

Verified Formulas (2026-02-20):
- Step 1: 命宮索引 = (月宮索引 - 時辰索引 + 10) % 12
- Step 2: 五虎遁 + Distance Formula for 命宮干
"""

# ============================================================================
# LOOKUP TABLES & CONSTANTS
# ============================================================================

branchOrder = ["寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥", "子", "丑"]
stemOrder = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"]

# 五虎遁 (Five Tiger Escaping): Maps year stem to stem at 寅
wuhuDun = {
    "甲": "丙", "己": "丙",
    "乙": "戊", "庚": "戊",
    "丙": "庚", "辛": "庚",
    "丁": "壬", "壬": "壬",
    "戊": "甲", "癸": "甲",
}

# 納音五行 (Nayin Five Elements): Maps stem-branch to Nayin element
nayinMapping = {
    "丙寅": ("爐中火", "Fire", 6),
    "壬辰": ("長流水", "Water", 2),
    "辛未": ("路旁土", "Earth", 5),
    "己卯": ("城頭土", "Earth", 5),
    "辛亥": ("屋上土", "Earth", 5),
}

# Ziwei position by bureau and lunar day remainder
ziweiPositionTable = {
    2: {0: "亥", 1: "丑", 2: "子"},
    3: {0: "子", 1: "寅", 2: "丑", 3: "子"},
    4: {0: "丑", 1: "卯", 2: "寅", 3: "丑", 4: "卯"},
    5: {0: "寅", 1: "辰", 2: "卯", 3: "寅", 4: "辰", 5: "寅"},
    6: {0: "卯", 1: "巳", 2: "辰", 3: "卯", 4: "巳", 5: "辰", 6: "卯"},
}

# Tianfu position opposite to Ziwei
tianfuOpposite = {
    "子": "午", "丑": "未", "寅": "申", "卯": "酉",
    "辰": "戌", "巳": "亥", "午": "子", "未": "丑",
    "申": "寅", "酉": "卯", "戌": "辰", "亥": "巳"
}

# Major star offsets from Ziwei
ziweiStarOffsets = {
    "紫微": 0, "天機": 1, "太陽": 2, "武曲": -1,
    "天同": -2, "廉貞": 3
}

# Major star offsets from Tianfu
tianfuStarOffsets = {
    "天府": 0, "太陰": -1, "貪狼": -2, "巨門": 1,
    "天相": 2, "天梁": 3, "七殺": -3, "破軍": -4
}

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def branchToIndex(branch):
    """Convert branch to 0-based index"""
    return branchOrder.index(branch)

def indexToBranch(index):
    """Convert 0-based index to branch"""
    return branchOrder[index % 12]

def stemToIndex(stem):
    """Convert stem to 0-based index"""
    return stemOrder.index(stem)

def indexToStem(index):
    """Convert 0-based index to stem"""
    return stemOrder[index % 10]

# ============================================================================
# STEP 1: Calculate Life Palace (命宮)
# ============================================================================

def calculateLifePalace(lunarMonth, hourBranch):
    """
    STEP 1: Calculate 命宮 (Life Palace) Position

    Formula: 命宮索引 = (月宮索引 - 時辰索引 + 10) % 12

    Args:
        lunarMonth: Lunar month (1-12)
        hourBranch: Hour branch string (e.g., "亥")

    Returns:
        Tuple: (lifeHouseBranch, lifeHouseIndex)
    """
    monthHouseIndex = (lunarMonth - 1) % 12
    hourIndex = branchToIndex(hourBranch)

    # VERIFIED FORMULA
    lifeHouseIndex = (monthHouseIndex - hourIndex + 10) % 12
    lifeHouseBranch = indexToBranch(lifeHouseIndex)

    return lifeHouseBranch, lifeHouseIndex

# ============================================================================
# STEP 2: Calculate Life Palace Stem (命宮干)
# ============================================================================

def calculateLifePalaceStem(yearStem, lifeHouseBranch):
    """
    STEP 2: Calculate 命宮干 using 五虎遁 (Five Tiger Escaping)

    Formula:
        1. Get stem at 寅 from 五虎遁 table
        2. Calculate distance from 寅 to life palace
        3. Add distance to stem (cycling every 10 stems)

    Args:
        yearStem: Year stem (甲-癸)
        lifeHouseBranch: Life palace branch (from Step 1)

    Returns:
        Tuple: (lifeHouseStem, lifeHouseStemBranch)
    """
    # Step 2.1: Get stem at 寅 using 五虎遁
    stemAtYin = wuhuDun[yearStem]

    # Step 2.2: Calculate distance from 寅(index 0) to life house
    yinIndex = 0
    lifeHouseIndex = branchToIndex(lifeHouseBranch)
    distance = (lifeHouseIndex - yinIndex) % 12

    # Step 2.3: Calculate life house stem by adding distance
    stemAtYinIndex = stemToIndex(stemAtYin)
    lifeHouseStemIndex = (stemAtYinIndex + distance) % 10
    lifeHouseStem = indexToStem(lifeHouseStemIndex)

    # Step 2.4: Create stem-branch pair
    lifeHouseStemBranch = lifeHouseStem + lifeHouseBranch

    return lifeHouseStem, lifeHouseStemBranch

# ============================================================================
# STEP 3: Combine Stem-Branch (already done in Step 2)
# ============================================================================

def getLifePalaceStemBranch(yearStem, lifeHouseBranch):
    """STEP 3 is already completed in Step 2"""
    lifeHouseStem, lifeHouseStemBranch = calculateLifePalaceStem(yearStem, lifeHouseBranch)
    return lifeHouseStemBranch

# ============================================================================
# STEP 4: Determine Five Element Bureau (五行局) via Nayin
# ============================================================================

def calculateFiveElementBureau(lifeHouseStemBranch):
    """
    STEP 4: Determine 五行局 using Nayin (納音) system

    Args:
        lifeHouseStemBranch: Life palace stem-branch (e.g., "丙寅")

    Returns:
        Tuple: (nayinName, element, bureauNumber)
    """
    if lifeHouseStemBranch not in nayinMapping:
        return None, None, None

    nayinName, element, bureauNumber = nayinMapping[lifeHouseStemBranch]
    return nayinName, element, bureauNumber

# ============================================================================
# STEP 5: Place Ziwei (紫微) & Tianfu (天府)
# ============================================================================

def calculateZiweiPosition(lunarDay, fiveElementBureau):
    """
    STEP 5A: Calculate Ziwei (紫微) position

    Formula: Remainder = lunarDay % fiveElementBureau
             Ziwei = ziweiPositionTable[bureau][remainder]

    Args:
        lunarDay: Lunar day of birth (1-30)
        fiveElementBureau: Bureau number (2, 3, 4, 5, 6)

    Returns:
        Ziwei branch string
    """
    remainder = lunarDay % fiveElementBureau
    if remainder == 0:
        remainder = fiveElementBureau

    return ziweiPositionTable[fiveElementBureau].get(remainder, "子")

def calculateTianfuPosition(ziweiPosition):
    """
    STEP 5B: Calculate Tianfu (天府) position

    Tianfu is directly opposite to Ziwei (6 palaces away)

    Args:
        ziweiPosition: Ziwei branch (from Step 5A)

    Returns:
        Tianfu branch string
    """
    return tianfuOpposite[ziweiPosition]

# ============================================================================
# STEP 6: Place Major Stars (十四主星)
# ============================================================================

def placeZiweiStars(ziweiPosition, lifeHouseIndex):
    """
    STEP 6A: Place major stars around Ziwei

    Args:
        ziweiPosition: Ziwei branch
        lifeHouseIndex: Life palace index (0-11)

    Returns:
        Dict of star -> branch mappings
    """
    ziweiIndex = branchToIndex(ziweiPosition)
    stars = {}

    for starName, offset in ziweiStarOffsets.items():
        starIndex = (ziweiIndex + offset) % 12
        stars[starName] = indexToBranch(starIndex)

    return stars

def placeTianfuStars(tianfuPosition):
    """
    STEP 6B: Place major stars around Tianfu

    Args:
        tianfuPosition: Tianfu branch

    Returns:
        Dict of star -> branch mappings
    """
    tianfuIndex = branchToIndex(tianfuPosition)
    stars = {}

    for starName, offset in tianfuStarOffsets.items():
        starIndex = (tianfuIndex + offset) % 12
        stars[starName] = indexToBranch(starIndex)

    return stars

# ============================================================================
# MAIN CALCULATION FUNCTION
# ============================================================================

def calculateZiweiChart(name, year, yearStem, lunarMonth, lunarDay, hourBranch):
    """
    Calculate complete Ziwei chart up to Step 6

    Args:
        name: Person's name
        year: Birth year
        yearStem: Year stem (甲-癸)
        lunarMonth: Lunar month (1-12)
        lunarDay: Lunar day (1-30)
        hourBranch: Hour branch (子-亥)

    Returns:
        Dict with all calculation results
    """
    result = {
        "name": name,
        "year": year,
        "yearStem": yearStem,
        "lunarMonth": lunarMonth,
        "lunarDay": lunarDay,
        "hourBranch": hourBranch,
    }

    # STEP 1: Calculate Life Palace
    lifeHouseBranch, lifeHouseIndex = calculateLifePalace(lunarMonth, hourBranch)
    result["step1_lifeHouseBranch"] = lifeHouseBranch
    result["step1_lifeHouseIndex"] = lifeHouseIndex

    # STEP 2: Calculate Life Palace Stem
    lifeHouseStem, lifeHouseStemBranch = calculateLifePalaceStem(yearStem, lifeHouseBranch)
    result["step2_lifeHouseStem"] = lifeHouseStem
    result["step2_stemAtYin"] = wuhuDun[yearStem]
    result["step2_lifeHouseStemBranch"] = lifeHouseStemBranch

    # STEP 4: Determine Five Element Bureau
    nayinName, element, bureauNumber = calculateFiveElementBureau(lifeHouseStemBranch)
    result["step4_nayin"] = nayinName
    result["step4_element"] = element
    result["step4_fiveElementBureau"] = bureauNumber

    # STEP 5A: Calculate Ziwei Position
    ziweiPosition = calculateZiweiPosition(lunarDay, bureauNumber)
    result["step5_ziweiPosition"] = ziweiPosition

    # STEP 5B: Calculate Tianfu Position
    tianfuPosition = calculateTianfuPosition(ziweiPosition)
    result["step5_tianfuPosition"] = tianfuPosition

    # STEP 6A: Place Ziwei Stars
    ziweiStars = placeZiweiStars(ziweiPosition, lifeHouseIndex)
    result["step6_ziweiStars"] = ziweiStars

    # STEP 6B: Place Tianfu Stars
    tianfuStars = placeTianfuStars(tianfuPosition)
    result["step6_tianfuStars"] = tianfuStars

    return result

# ============================================================================
# MAIN EXECUTION
# ============================================================================

if __name__ == "__main__":
    people = [
        {"name": "Bennett", "year": 1984, "yearStem": "甲", "month": 12, "day": 3, "hour": "亥"},
        {"name": "Brian", "year": 1986, "yearStem": "丙", "month": 12, "day": 17, "hour": "酉"},
        {"name": "Christy", "year": 1989, "yearStem": "己", "month": 12, "day": 2, "hour": "午"},
        {"name": "Cherry", "year": 1990, "yearStem": "庚", "month": 11, "day": 4, "hour": "酉"},
        {"name": "Elice", "year": 1982, "yearStem": "壬", "month": 8, "day": 14, "hour": "戌"},
    ]

    print("=" * 100)
    print("ZIWEI ASTROLOGY CALCULATOR - STEPS 1-6")
    print("=" * 100)
    print()

    results = []
    for person in people:
        result = calculateZiweiChart(
            person["name"],
            person["year"],
            person["yearStem"],
            person["month"],
            person["day"],
            person["hour"]
        )
        results.append(result)

        print(f"{result['name']} ({person['year']}{person['yearStem']}, Lunar {person['month']}/{person['day']}, {person['hour']}時)")
        print(f"  STEP 1 - 命宮: {result['step1_lifeHouseBranch']} (Index {result['step1_lifeHouseIndex']})")
        print(f"  STEP 2 - 命宮干: {result['step2_lifeHouseStem']} (Stem@寅={result['step2_stemAtYin']})")
        print(f"  STEP 2 - 命宮干支: {result['step2_lifeHouseStemBranch']}")
        print(f"  STEP 4 - 五行局: {result['step4_fiveElementBureau']} ({result['step4_nayin']}, {result['step4_element']})")
        print(f"  STEP 5 - Ziwei: {result['step5_ziweiPosition']}, Tianfu: {result['step5_tianfuPosition']}")
        print(f"  STEP 6 - Ziwei Stars: {result['step6_ziweiStars']}")
        print(f"  STEP 6 - Tianfu Stars: {result['step6_tianfuStars']}")
        print()

    # Summary table
    print("=" * 100)
    print("SUMMARY TABLE")
    print("=" * 100)
    print()
    print(f"{'Name':<10} {'Year':<6} {'命宮':<4} {'命宮干':<4} {'命宮干支':<6} {'五行局':<8} {'Ziwei':<4} {'Tianfu':<4}")
    print("-" * 100)
    for r in results:
        print(f"{r['name']:<10} {r['year']:<6} {r['step1_lifeHouseBranch']:<4} {r['step2_lifeHouseStem']:<4} {r['step2_lifeHouseStemBranch']:<6} {r['step4_fiveElementBureau']}({r['step4_nayin']}) {r['step5_ziweiPosition']:<4} {r['step5_tianfuPosition']:<4}")

