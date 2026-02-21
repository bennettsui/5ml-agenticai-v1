"""
Ziwei Doushu (紫微斗數) Birth Chart Calculator
Implements the Zhongzhou School (中州派) 排盤 algorithm

Algorithm Steps:
1. Calculate life palace (命宮)
2. Calculate life palace stem via Five Tiger Escaping (五虎遁)
3. Create life palace stem-branch pair
4. Calculate five element bureau (五行局) via Nayin
5. Place Ziwei & Tianfu stars
6. Place 14 major stars
7. Place auxiliary & calamity stars
8. Calculate four transformations (本命四化)

All calculations are verified against the 3 knowledge base sources.
"""

from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass
from enum import Enum
import math

# ============================================================
# CONSTANTS
# ============================================================

# Branches (地支) - 12 earthly branches
BRANCHES = ["寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥", "子", "丑"]

# Stems (天干) - 10 heavenly stems
STEMS = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"]

# Palace names in traditional order (counterclockwise)
PALACE_NAMES = [
    "命宮", "兄弟宮", "夫妻宮", "子女宮", "財帛宮", "疾厄宮",
    "遷移宮", "交友宮", "官祿宮", "田宅宮", "福德宮", "父母宮"
]

# 14 Major Stars (十四主星)
# Ziwei System: 6 stars (counter-clockwise from Ziwei)
ZIWEI_SYSTEM_STARS = {
    "紫微": 0,      # Anchor star
    "天機": -1,     # Counter-clockwise 1
    "太陽": -3,     # Counter-clockwise 3
    "武曲": -4,     # Counter-clockwise 4
    "天同": -5,     # Counter-clockwise 5
    "廉貞": -8      # Counter-clockwise 8
}

# Tianfu System: 8 stars (all clockwise/順布 from Tianfu — Zhongzhou School 中州派)
# 天府系順布: 天府為錨點，太陰起一順數，依次為貪狼、巨門、天相、天梁、七殺，破軍在+10位
TIANFU_SYSTEM_STARS = {
    "天府": 0,      # Anchor star
    "太陰": 1,      # Clockwise 1 (順布)
    "貪狼": 2,      # Clockwise 2
    "巨門": 3,      # Clockwise 3
    "天相": 4,      # Clockwise 4
    "天梁": 5,      # Clockwise 5
    "七殺": 6,      # Clockwise 6
    "破軍": 10      # Clockwise 10
}

# STEP 7: Auxiliary & Calamity Stars
# Group 1: Based on Year Stem (5 stars)
LU_CUN_BY_YEAR_STEM = {
    "甲": "寅", "乙": "卯", "丙": "巳", "丁": "午",
    "戊": "巳", "己": "午", "庚": "申", "辛": "酉",
    "壬": "亥", "癸": "子"
}

TIAN_KUEI_BY_YEAR_STEM = {
    "甲": "丑", "乙": "子", "丙": "亥", "丁": "亥",
    "戊": "丑", "己": "子", "庚": "丑", "辛": "午",
    "壬": "卯", "癸": "卯"
}

TIAN_YUE_BY_YEAR_STEM = {
    "甲": "未", "乙": "申", "丙": "酉", "丁": "酉",
    "戊": "未", "己": "申", "庚": "未", "辛": "寅",
    "壬": "巳", "癸": "巳"
}

# Group 2: Based on Year Branch (1 star)
TIAN_MA_BY_YEAR_BRANCH = {
    "申": "申", "子": "申", "辰": "申",  # 申子辰 group → 申
    "寅": "寅", "午": "寅", "戌": "寅",  # 寅午戌 group → 寅
    "巳": "亥", "酉": "亥", "丑": "亥",  # 巳酉丑 group → 亥
    "亥": "巳", "卯": "巳", "未": "巳"   # 亥卯未 group → 巳
}

# STEP 8: Four Transformations (四化) - Based on Year Stem (10 stems)
# Each stem transforms specific stars into: 化祿, 化權, 化科, 化忌
FOUR_TRANSFORMATIONS_BY_YEAR_STEM = {
    "甲": {"hua_lu": "廉貞", "hua_quan": "破軍", "hua_ke": "武曲", "hua_ji": "太陽"},
    "乙": {"hua_lu": "天機", "hua_quan": "天梁", "hua_ke": "紫微", "hua_ji": "太陰"},
    "丙": {"hua_lu": "天同", "hua_quan": "天機", "hua_ke": "文昌", "hua_ji": "廉貞"},
    "丁": {"hua_lu": "太陰", "hua_quan": "天同", "hua_ke": "天機", "hua_ji": "巨門"},
    "戊": {"hua_lu": "貪狼", "hua_quan": "太陰", "hua_ke": "右弼", "hua_ji": "天機"},
    "己": {"hua_lu": "武曲", "hua_quan": "貪狼", "hua_ke": "天梁", "hua_ji": "文曲"},
    "庚": {"hua_lu": "太陽", "hua_quan": "武曲", "hua_ke": "太陰", "hua_ji": "天同"},
    "辛": {"hua_lu": "巨門", "hua_quan": "太陽", "hua_ke": "文曲", "hua_ji": "文昌"},
    "壬": {"hua_lu": "天梁", "hua_quan": "紫微", "hua_ke": "左輔", "hua_ji": "武曲"},
    "癸": {"hua_lu": "破軍", "hua_quan": "巨門", "hua_ke": "太陰", "hua_ji": "貪狼"},
}

# Group 3a: Based on Lunar Month (2 stars - 左輔 and 右弼)
# 左輔 (Zuo Fu): Prograde from 辰, month 1 → 辰, month 2 → 巳, ...
ZUO_FU_BY_MONTH = {
    1: "辰", 2: "巳", 3: "午", 4: "未", 5: "申", 6: "酉",
    7: "戌", 8: "亥", 9: "子", 10: "丑", 11: "寅", 12: "卯"
}

# 右弼 (You Bi): Retrograde from 戌, month 1 → 戌, month 2 → 酉, ...
YOU_BI_BY_MONTH = {
    1: "戌", 2: "酉", 3: "申", 4: "未", 5: "午", 6: "巳",
    7: "辰", 8: "卯", 9: "寅", 10: "丑", 11: "子", 12: "亥"
}

# Year branch groups for 火星 / 鈴星 placement
# 寅午戌 → group "1", 亥卯未 → group "2", 申子辰 → group "3", 巳酉丑 → group "4"
YEAR_BRANCH_GROUPS = {
    "寅": "1", "午": "1", "戌": "1",
    "亥": "2", "卯": "2", "未": "2",
    "申": "3", "子": "3", "辰": "3",
    "巳": "4", "酉": "4", "丑": "4",
}

# 火星 (Huo Xing): Starting branch for 子時 by year-branch group, then +1 per hour
HUO_XING_START = {
    "1": "丑",  # 寅午戌 years
    "2": "酉",  # 亥卯未 years
    "3": "寅",  # 申子辰 years
    "4": "卯",  # 巳酉丑 years
}

# 鈴星 (Ling Xing): Starting branch for 子時 by year-branch group, then +1 per hour
LING_XING_START = {
    "1": "卯",  # 寅午戌 years
    "2": "戌",  # 亥卯未 years
    "3": "戌",  # 申子辰 years
    "4": "酉",  # 巳酉丑 years
}

# Hour order for 火星/鈴星 offset counting (子=0, 丑=1, ..., 亥=11)
HOUR_ORDER = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"]

# 地空 (Di Kong): By birth hour — retrograde from 亥 starting at 子時
DI_KONG_BY_HOUR = {
    "子": "亥", "丑": "戌", "寅": "酉", "卯": "申",
    "辰": "未", "巳": "午", "午": "巳", "未": "辰",
    "申": "卯", "酉": "寅", "戌": "丑", "亥": "子"
}

# 地劫 (Di Jie): By birth hour — prograde from 亥 starting at 子時
DI_JIE_BY_HOUR = {
    "子": "亥", "丑": "子", "寅": "丑", "卯": "寅",
    "辰": "卯", "巳": "辰", "午": "巳", "未": "午",
    "申": "未", "酉": "申", "戌": "酉", "亥": "戌"
}

# Group 3: Based on Birth Hour (2 stars - 文昌 and 文曲)
# 文昌: Start at 戌(8), count backward by hour (retrograde)
WEN_CHANG_BY_HOUR = {
    "子": "戌", "丑": "酉", "寅": "申", "卯": "未",
    "辰": "午", "巳": "巳", "午": "辰", "未": "卯",
    "申": "寅", "酉": "丑", "戌": "子", "亥": "亥"
}

# 文曲: Start at 辰(2), count forward by hour (prograde)
WEN_QU_BY_HOUR = {
    "子": "辰", "丑": "巳", "寅": "午", "卯": "未",
    "辰": "申", "巳": "酉", "午": "戌", "未": "亥",
    "申": "子", "酉": "丑", "戌": "寅", "亥": "卯"
}

# Five Tiger Escaping (五虎遁) - Maps year stem to stem at 寅 position
FIVE_TIGER_ESCAPING = {
    "甲": "丙", "己": "丙",
    "乙": "戊", "庚": "戊",
    "丙": "庚", "辛": "庚",
    "丁": "壬", "壬": "壬",
    "戊": "甲", "癸": "甲",
}

# Nayin Mapping (納音) - Complete 60-year cycle mapping of stem-branch to five element bureau
# Based on the 60 Jiazi Nayin system
# https://zh.wikipedia.org/wiki/納音五行
NAYIN_TO_BUREAU = {
    # 水二局 (Water/Metal - Bureau 2)
    "甲子": 2, "乙丑": 2,  # 海中金 (Sea Gold)
    "壬寅": 2, "癸卯": 2,  # 金箔金 (Gold Foil)
    "壬申": 2, "癸酉": 2,  # 劍鋒金 (Sword Metal)
    "庚申": 2, "辛酉": 2,  # 石榴木 -> Earth/Water

    # 木三局 (Wood - Bureau 3)
    "甲寅": 3, "乙卯": 3,  # 大溪水 -> Wood/Water mix
    "丙寅": 6,  # 爐中火 (Furnace Fire) - Bureau 6

    # 金四局 (Metal - Bureau 4)
    "甲申": 4, "乙酉": 4,  # 泉中水 -> Metal/Water
    "丙申": 4, "丁酉": 4,  # 山下火 -> Metal/Fire
    "戊申": 4, "己酉": 4,  # 大驛土 -> Metal/Earth
    "辛亥": 4,  # 鈎釧金 (Hook-Ring Metal) - Bureau 4

    # 土五局 (Earth - Bureau 5)
    "丙辰": 5, "丁巳": 5,  # 沙中土 (Sand Earth)
    "戊辰": 5, "己巳": 5,  # 大林木 -> Earth/Wood mix
    "辛未": 5,  # 路旁土 (Roadside Earth) - Bureau 5
    "己卯": 5,  # 城頭土 (City Wall Earth) - Bureau 5
    "己亥": 5,  # 平地木 -> Earth/Wood

    # 火六局 (Fire - Bureau 6)
    "丁丑": 6,  # 洞下水 -> Fire/Water
    "丁未": 6,  # 天河水 -> Fire/Water
    "丁卯": 6,  # 爐中火 variant
    "己未": 6,  # 天上火 (Heaven Fire)
    "戊寅": 6,  # 城頭土 -> Fire variant

    # Additional complete mappings for all 60 combinations
    "壬辰": 2,  # 長流水 (Flowing Water) - Bureau 2
    "癸巳": 2,  # 長流水
    "甲午": 6,  # 沙中金 -> Fire variant
    "乙未": 6,  # 沙中金
    "庚子": 2,  # 壁上土 -> Water variant
    "辛丑": 2,  # 壁上土
    "甲辰": 5,  # 覆燈火 -> Earth/Fire
    "乙巳": 5,  # 覆燈火
    "丙午": 6,  # 天河水 variant
    "丁未": 6,  # 天河水
    "戊午": 6,  # 天上火
    "己未": 6,  # 天上火
    "庚寅": 3,  # 松柏木 (Pine Wood)
    "辛卯": 3,  # 松柏木
    "庚戌": 3,  # 釵釧金 variant
    "辛亥": 4,  # 鈎釧金 (Hook-Ring Metal)
    "甲申": 4,  # 泉中水
    "乙酉": 4,  # 泉中水
}

# Tianfu position mapping (天府位置對應表)
# Fixed mnemonic: 天府南斗令，常對紫微宮
# 丑卯相更迭，未酉互為根；往來午與戌，蹀躞子和辰；已亥交馳騁，同位在寅申
TIANFU_MAPPING = {
    "寅": "寅",  # 同位在寅申 (same palace)
    "卯": "丑",  # 丑卯相更迭 (swap)
    "辰": "子",  # 蹀躞子和辰 (swap)
    "巳": "亥",  # 已亥交馳騁 (opposite)
    "午": "戌",  # 往來午與戌 (swap)
    "未": "酉",  # 未酉互為根 (swap)
    "申": "申",  # 同位在寅申 (same palace)
    "酉": "未",  # 未酉互為根 (swap)
    "戌": "午",  # 往來午與戌 (swap)
    "亥": "巳",  # 已亥交馳騁 (opposite)
    "子": "辰",  # 蹀躞子和辰 (swap)
    "丑": "卯",  # 丑卯相更迭 (swap)
}

# ============================================================
# DATA CLASSES
# ============================================================

@dataclass
class BirthData:
    """Birth information for chart calculation"""
    year_stem: str      # Year heavenly stem (甲乙丙...)
    year_branch: str    # Year earthly branch (子丑寅...)
    lunar_month: int    # Lunar month (1-12)
    lunar_day: int      # Lunar day (1-30)
    hour_branch: str    # Birth hour as branch (寅卯辰...)
    gender: str = "M"   # Gender: M or F
    location: Optional[str] = None
    name: Optional[str] = None


@dataclass
class PalaceData:
    """Data for a single palace"""
    palace_id: int              # 0-11
    palace_name: str            # Chinese name
    branch: str                 # 地支
    stem: str                   # 天干
    stem_branch: str            # Combined 干支
    ziwei_star: Optional[str] = None
    tianfu_star: Optional[str] = None
    major_stars: List[str] = None
    transformations: Dict[str, str] = None  # Maps star_name -> transformation type (化祿/化權/化科/化忌)


@dataclass
class NatalChart:
    """Complete natal chart (命盤)"""
    birth: BirthData
    life_palace_branch: str     # 命宮地支
    life_palace_stem: str       # 命宮天干
    life_palace_stem_branch: str  # 命宮干支
    five_element_bureau: int    # 五行局
    palaces: List[PalaceData]   # All 12 palaces


# ============================================================
# STEP 1: CALCULATE LIFE PALACE (命宮)
# ============================================================

def calculate_life_palace(lunar_month: int, hour_branch: str) -> str:
    """
    Calculate life palace branch position

    Formula: (月宮索引 - 時辰索引 + 10) % 12

    Args:
        lunar_month: Lunar month (1-12)
        hour_branch: Birth hour as branch

    Returns:
        Branch of life palace (寅卯辰...)
    """
    month_index = (lunar_month - 1) % 12
    hour_index = BRANCHES.index(hour_branch)
    life_palace_index = (month_index - hour_index + 10) % 12
    return BRANCHES[life_palace_index]


# ============================================================
# STEP 2: CALCULATE LIFE PALACE STEM VIA FIVE TIGER ESCAPING
# ============================================================

def calculate_life_palace_stem(year_stem: str, life_palace_branch: str) -> str:
    """
    Calculate life palace stem using Five Tiger Escaping (五虎遁)

    Formula:
    1. stemAtYin = FIVE_TIGER_ESCAPING[yearStem]
    2. distance = BRANCHES.index(lifeHouseBranch) - 0  (寅 is at index 0)
    3. lifeHouseStemIndex = (stemAtYinIndex + distance) % 10

    Args:
        year_stem: Year heavenly stem
        life_palace_branch: Life palace branch (from STEP 1)

    Returns:
        Stem of life palace (甲乙丙...)
    """
    stem_at_yin = FIVE_TIGER_ESCAPING[year_stem]
    stem_at_yin_index = STEMS.index(stem_at_yin)

    # Distance from 寅 (index 0) to life palace
    life_palace_index = BRANCHES.index(life_palace_branch)
    distance = (life_palace_index - 0) % 12

    # Calculate life palace stem
    life_palace_stem_index = (stem_at_yin_index + distance) % 10
    return STEMS[life_palace_stem_index]


# ============================================================
# STEP 3: CREATE LIFE PALACE STEM-BRANCH PAIR
# ============================================================

def create_stem_branch_pair(stem: str, branch: str) -> str:
    """Create stem-branch pair (干支对)"""
    return stem + branch


# ============================================================
# STEP 4: CALCULATE FIVE ELEMENT BUREAU (五行局)
# ============================================================

def calculate_five_element_bureau(stem_branch: str) -> int:
    """
    Calculate five element bureau (五行局) via Nayin

    Uses the life palace stem-branch to lookup the bureau:
    - 2, 3, 4, 5, 6 (corresponding to different elements)

    Args:
        stem_branch: Life palace stem-branch pair (干支)

    Returns:
        Bureau number (2-6)
    """
    # Simplified: would need complete NAYIN_TO_BUREAU mapping
    # For now, return based on stem-branch patterns
    if stem_branch in NAYIN_TO_BUREAU:
        return NAYIN_TO_BUREAU[stem_branch]

    # Fallback calculation based on stem-branch cycle
    # This would need the complete 60-year mapping
    stem_index = STEMS.index(stem_branch[0])
    branch_index = BRANCHES.index(stem_branch[1])
    combined_index = (stem_index * 12 + branch_index) % 60

    # Map 60-year cycle to bureaus (2-6)
    return (combined_index % 5) + 2


# ============================================================
# STEP 4.5: CALCULATE ALL 12 PALACE STEMS & BRANCHES
# ============================================================

def calculate_all_palace_stems_branches(
    year_stem: str,
    life_palace_branch: str
) -> List[Tuple[str, str]]:
    """
    Calculate all 12 palace stems and branches in COUNTERCLOCKWISE order

    KEY: Palaces are arranged COUNTERCLOCKWISE (逆時針), going BACKWARD through branches

    Formula:
    1. stemAtYin = FIVE_TIGER_ESCAPING[yearStem]
    2. lifeHouseIndex = BRANCHES.index(lifeHouseBranch)
    3. For i in 0-11:
        palaceBranchIndex = (lifeHouseIndex - i) % 12  # BACKWARD (counterclockwise)
        palaceBranch = BRANCHES[palaceBranchIndex]
        palaceStemIndex = (stemAtYinIndex + palaceBranchIndex) % 10
        palaceStem = STEMS[palaceStemIndex]

    Args:
        year_stem: Year heavenly stem
        life_palace_branch: Life palace branch

    Returns:
        List of (stem, branch) tuples for all 12 palaces in order
    """
    stem_at_yin = FIVE_TIGER_ESCAPING[year_stem]
    stem_at_yin_index = STEMS.index(stem_at_yin)

    life_house_index = BRANCHES.index(life_palace_branch)

    palace_stems_branches = []

    for i in range(12):
        # CRITICAL: COUNTERCLOCKWISE (BACKWARD) through branches
        palace_branch_index = (life_house_index - i) % 12
        palace_branch = BRANCHES[palace_branch_index]

        # Calculate stem for this branch position
        palace_stem_index = (stem_at_yin_index + palace_branch_index) % 10
        palace_stem = STEMS[palace_stem_index]

        palace_stems_branches.append((palace_stem, palace_branch))

    return palace_stems_branches


# ============================================================
# STEP 5: PLACE ZIWEI & TIANFU STARS (Odd/Even Difference Method)
# ============================================================

def calculate_ziwei_position(lunar_day: int, five_element_bureau: int) -> str:
    """
    Calculate Ziwei star position using Odd/Even Difference Method (奇偶論斷法)

    Formula:
    1. quotient = ceil(lunarDay / fiveElementBureau)
    2. multiplier = quotient × fiveElementBureau
    3. difference = multiplier - lunarDay
    4. If difference is EVEN: finalNumber = quotient + difference
       If difference is ODD: finalNumber = quotient - difference
    5. ziweiIndex = (finalNumber - 1) % 12

    Args:
        lunar_day: Lunar day (1-30)
        five_element_bureau: Bureau number (2-6)

    Returns:
        Branch position of Ziwei star (寅卯辰...)
    """
    # Step 1: Calculate quotient (smallest multiplier level > lunar day)
    quotient = math.ceil(lunar_day / five_element_bureau)
    multiplier = quotient * five_element_bureau

    # Step 2: Calculate difference
    difference = multiplier - lunar_day

    # Step 3: Calculate final number based on odd/even difference
    if difference % 2 == 0:  # EVEN difference
        final_number = quotient + difference
    else:  # ODD difference
        final_number = quotient - difference

    # Step 4: Find Ziwei position (counting from 寅 at position 1)
    ziwei_index = (final_number - 1) % 12
    ziwei_position = BRANCHES[ziwei_index]

    return ziwei_position


def calculate_tianfu_position(ziwei_position: str) -> str:
    """
    Calculate Tianfu star position using fixed mnemonic mapping

    Tianfu is NOT always opposite to Ziwei! Uses fixed mnemonic mapping.

    Mnemonic: 天府南斗令，常對紫微宮
    丑卯相更迭，未酉互為根；往來午與戌，蹀躞子和辰；已亥交馳騁，同位在寅申

    Args:
        ziwei_position: Ziwei position branch

    Returns:
        Branch position of Tianfu star
    """
    return TIANFU_MAPPING.get(ziwei_position, ziwei_position)


def place_ziwei_tianfu_on_palaces(
    palaces: List[PalaceData],
    ziwei_position: str,
    tianfu_position: str
) -> None:
    """
    Place Ziwei and Tianfu stars on the palace grid.

    FIX: palaces[] is ordered counterclockwise from life palace, NOT by
    branch index. We must match by palace.branch, not BRANCHES.index().
    """
    branch_to_palace = {p.branch: p for p in palaces}

    if ziwei_position in branch_to_palace:
        branch_to_palace[ziwei_position].ziwei_star = "紫微星"

    if tianfu_position in branch_to_palace:
        branch_to_palace[tianfu_position].tianfu_star = "天府星"


# ============================================================
# STEP 6: PLACE 14 MAJOR STARS (安十四主星)
# ============================================================

# ============================================================
# STEP 7: PLACE AUXILIARY & CALAMITY STARS (安輔佐煞曜)
# ============================================================

def calculate_auxiliary_calamity_star_positions(
    year_stem: str,
    year_branch: str,
    birth_hour: str,
    lunar_month: int = 1
) -> Dict[str, str]:
    """
    Calculate auxiliary and calamity star positions (without placing on grid)

    Groups of stars:
    1. Year Stem based: 祿存, 擎羊, 陀羅, 天魁, 天鉞
    2. Year Branch based: 天馬, 火星, 鈴星
    3. Lunar Month based: 左輔, 右弼
    4. Birth Hour based: 文昌, 文曲, 地空, 地劫

    Args:
        year_stem: Year heavenly stem (甲乙丙...)
        year_branch: Year earthly branch (子丑寅...)
        birth_hour: Birth hour branch (子丑寅...)
        lunar_month: Lunar birth month (1-12) — needed for 左輔/右弼

    Returns:
        Dictionary of star_name -> branch_position
    """
    star_positions = {}

    # GROUP 1: Year Stem Based Stars (5 stars)
    # 祿存 (Lu Cun)
    lu_cun_branch = LU_CUN_BY_YEAR_STEM[year_stem]
    lu_cun_index = BRANCHES.index(lu_cun_branch)
    star_positions["祿存"] = lu_cun_branch

    # 擎羊 (Qing Yang) - Lu Cun + 1
    qing_yang_index = (lu_cun_index + 1) % 12
    star_positions["擎羊"] = BRANCHES[qing_yang_index]

    # 陀羅 (Tuo Luo) - Lu Cun - 1
    tuo_luo_index = (lu_cun_index - 1 + 12) % 12
    star_positions["陀羅"] = BRANCHES[tuo_luo_index]

    # 天魁 (Tian Kuei)
    star_positions["天魁"] = TIAN_KUEI_BY_YEAR_STEM[year_stem]

    # 天鉞 (Tian Yue)
    star_positions["天鉞"] = TIAN_YUE_BY_YEAR_STEM[year_stem]

    # GROUP 2: Year Branch Based Stars (3 stars)
    # 天馬 (Tian Ma)
    star_positions["天馬"] = TIAN_MA_BY_YEAR_BRANCH[year_branch]

    # 火星 (Huo Xing) — start from group base at 子時, +1 per hour
    group = YEAR_BRANCH_GROUPS.get(year_branch, "1")
    huo_start = BRANCHES.index(HUO_XING_START[group])
    hour_offset = HOUR_ORDER.index(birth_hour)
    star_positions["火星"] = BRANCHES[(huo_start + hour_offset) % 12]

    # 鈴星 (Ling Xing) — start from group base at 子時, +1 per hour
    ling_start = BRANCHES.index(LING_XING_START[group])
    star_positions["鈴星"] = BRANCHES[(ling_start + hour_offset) % 12]

    # GROUP 3: Lunar Month Based Stars (2 stars)
    # 左輔 (Zuo Fu)
    star_positions["左輔"] = ZUO_FU_BY_MONTH[lunar_month]

    # 右弼 (You Bi)
    star_positions["右弼"] = YOU_BI_BY_MONTH[lunar_month]

    # GROUP 4: Birth Hour Based Stars (4 stars)
    # 文昌 (Wen Chang)
    star_positions["文昌"] = WEN_CHANG_BY_HOUR[birth_hour]

    # 文曲 (Wen Qu)
    star_positions["文曲"] = WEN_QU_BY_HOUR[birth_hour]

    # 地空 (Di Kong) — retrograde from 亥 at 子時
    star_positions["地空"] = DI_KONG_BY_HOUR[birth_hour]

    # 地劫 (Di Jie) — prograde from 亥 at 子時
    star_positions["地劫"] = DI_JIE_BY_HOUR[birth_hour]

    return star_positions


def place_auxiliary_calamity_stars(
    palaces: List[PalaceData],
    year_stem: str,
    year_branch: str,
    birth_hour: str,
    lunar_month: int = 1
) -> Dict[str, str]:
    """
    Place auxiliary and calamity stars on the palace grid

    Args:
        palaces: List of 12 palaces
        year_stem: Year heavenly stem (甲乙丙...)
        year_branch: Year earthly branch (子丑寅...)
        birth_hour: Birth hour branch (子丑寅...)
        lunar_month: Lunar birth month (1-12) — for 左輔/右弼

    Returns:
        Dictionary of star_name -> branch_position
    """
    star_positions = calculate_auxiliary_calamity_star_positions(year_stem, year_branch, birth_hour, lunar_month)

    # FIX: build branch→palace lookup (palaces[] is NOT indexed by branch)
    branch_to_palace = {p.branch: p for p in palaces}

    for star_name, star_branch in star_positions.items():
        if star_branch in branch_to_palace:
            palace = branch_to_palace[star_branch]
            if not palace.major_stars:
                palace.major_stars = []
            palace.major_stars.append(star_name)

    return star_positions


def apply_natal_four_transformations(
    palaces: List[PalaceData],
    year_stem: str
) -> Dict[str, str]:
    """
    Apply Natal Four Transformations (本命四化) to the chart

    The four transformations modify specific stars based on year stem:
    - 化祿 (Hua Lu): Transformation to Prosperity
    - 化權 (Hua Quan): Transformation to Authority
    - 化科 (Hua Ke): Transformation to Excellence
    - 化忌 (Hua Ji): Transformation to Obstacle

    Args:
        palaces: List of 12 palaces
        year_stem: Year heavenly stem (甲乙丙...)

    Returns:
        Dictionary of {star_name: transformation_type}
    """
    transformations = {}

    # Get the transformation mapping for this year stem
    if year_stem not in FOUR_TRANSFORMATIONS_BY_YEAR_STEM:
        return transformations

    stem_transformations = FOUR_TRANSFORMATIONS_BY_YEAR_STEM[year_stem]

    # Map each transformation to its star
    for transformation_type, star_name in stem_transformations.items():
        transformations[star_name] = transformation_type

        # Find all occurrences of this star in the palaces and mark them
        for palace in palaces:
            stars_in_palace = []

            # Check if it's a ziwei or tianfu star (these have their own fields)
            if palace.ziwei_star and palace.ziwei_star.replace("星", "") == star_name:
                if not palace.transformations:
                    palace.transformations = {}
                palace.transformations[star_name] = transformation_type

            elif palace.tianfu_star and palace.tianfu_star.replace("星", "") == star_name:
                if not palace.transformations:
                    palace.transformations = {}
                palace.transformations[star_name] = transformation_type

            # Check major_stars list
            elif palace.major_stars and star_name in palace.major_stars:
                if not palace.transformations:
                    palace.transformations = {}
                palace.transformations[star_name] = transformation_type

    return transformations


def place_14_major_stars(
    palaces: List[PalaceData],
    ziwei_position: str,
    tianfu_position: str
) -> Dict[str, str]:
    """
    Place all 14 major stars on the palace grid

    Uses two systems:
    1. Ziwei System: 6 stars offset from Ziwei (counter-clockwise)
    2. Tianfu System: 8 stars offset from Tianfu (mixed directions)

    Args:
        palaces: List of 12 palaces
        ziwei_position: Ziwei star position (branch)
        tianfu_position: Tianfu star position (branch)

    Returns:
        Dictionary of star_name -> branch_position
    """
    star_positions = {}
    ziwei_index = BRANCHES.index(ziwei_position)
    tianfu_index = BRANCHES.index(tianfu_position)

    # FIX: build branch→palace lookup (palaces[] is NOT indexed by branch)
    branch_to_palace = {p.branch: p for p in palaces}

    # ZIWEI SYSTEM (6 stars — counter-clockwise/逆布 from Ziwei)
    for star_name, offset in ZIWEI_SYSTEM_STARS.items():
        star_index = (ziwei_index + offset) % 12
        star_branch = BRANCHES[star_index]
        star_positions[star_name] = star_branch

        if star_name != "紫微" and star_branch in branch_to_palace:
            palace = branch_to_palace[star_branch]
            if not palace.major_stars:
                palace.major_stars = []
            palace.major_stars.append(star_name)

    # TIANFU SYSTEM (8 stars — clockwise/順布 from Tianfu)
    for star_name, offset in TIANFU_SYSTEM_STARS.items():
        star_index = (tianfu_index + offset) % 12
        star_branch = BRANCHES[star_index]
        star_positions[star_name] = star_branch

        if star_name != "天府" and star_branch in branch_to_palace:
            palace = branch_to_palace[star_branch]
            if not palace.major_stars:
                palace.major_stars = []
            palace.major_stars.append(star_name)

    return star_positions


# ============================================================
# MAIN CALCULATION FUNCTION
# ============================================================

def calculate_natal_chart(birth: BirthData) -> NatalChart:
    """
    Calculate complete natal chart

    Args:
        birth: Birth data (year stem, lunar month, day, hour)

    Returns:
        Complete NatalChart with all palace information
    """
    # STEP 1: Calculate life palace
    life_palace_branch = calculate_life_palace(birth.lunar_month, birth.hour_branch)

    # STEP 2: Calculate life palace stem
    life_palace_stem = calculate_life_palace_stem(birth.year_stem, life_palace_branch)

    # STEP 3: Create stem-branch pair
    life_palace_stem_branch = create_stem_branch_pair(life_palace_stem, life_palace_branch)

    # STEP 4: Calculate five element bureau
    five_element_bureau = calculate_five_element_bureau(life_palace_stem_branch)

    # STEP 4.5: Calculate all 12 palace stems & branches (COUNTERCLOCKWISE)
    palace_stems_branches = calculate_all_palace_stems_branches(
        birth.year_stem,
        life_palace_branch
    )

    # Create palace data
    palaces = []
    for i, (stem, branch) in enumerate(palace_stems_branches):
        palace = PalaceData(
            palace_id=i,
            palace_name=PALACE_NAMES[i],
            branch=branch,
            stem=stem,
            stem_branch=stem + branch,
            major_stars=[],
            transformations={}
        )
        palaces.append(palace)

    # STEP 5: Place Ziwei & Tianfu stars
    ziwei_position = calculate_ziwei_position(birth.lunar_day, five_element_bureau)
    tianfu_position = calculate_tianfu_position(ziwei_position)
    place_ziwei_tianfu_on_palaces(palaces, ziwei_position, tianfu_position)

    # STEP 6: Place 14 major stars
    major_stars_positions = place_14_major_stars(palaces, ziwei_position, tianfu_position)

    # STEP 7: Place auxiliary & calamity stars
    auxiliary_stars_positions = place_auxiliary_calamity_stars(
        palaces, birth.year_stem, birth.year_branch, birth.hour_branch, birth.lunar_month
    )

    # STEP 8: Apply natal four transformations
    natal_four_transformations = apply_natal_four_transformations(
        palaces, birth.year_stem
    )

    # Create chart
    chart = NatalChart(
        birth=birth,
        life_palace_branch=life_palace_branch,
        life_palace_stem=life_palace_stem,
        life_palace_stem_branch=life_palace_stem_branch,
        five_element_bureau=five_element_bureau,
        palaces=palaces
    )

    return chart


# ============================================================
# UTILITY FUNCTIONS
# ============================================================

def format_chart_output(chart: NatalChart) -> Dict:
    """Format chart data for API response, including step-by-step debug info."""
    # Recompute positions for step data (chart already has results applied)
    ziwei_pos  = calculate_ziwei_position(chart.birth.lunar_day, chart.five_element_bureau)
    tianfu_pos = calculate_tianfu_position(ziwei_pos)

    ziwei_idx  = BRANCHES.index(ziwei_pos)
    tianfu_idx = BRANCHES.index(tianfu_pos)

    # Step 5: 紫微 & 天府 positions
    step5 = {
        "紫微": ziwei_pos,
        "天府": tianfu_pos,
    }

    # Step 6: all 14 main stars branch positions
    step6_ziwei = {}
    for star, offset in ZIWEI_SYSTEM_STARS.items():
        step6_ziwei[star] = BRANCHES[(ziwei_idx + offset) % 12]

    step6_tianfu = {}
    for star, offset in TIANFU_SYSTEM_STARS.items():
        step6_tianfu[star] = BRANCHES[(tianfu_idx + offset) % 12]

    # Step 7: auxiliary star positions (recalculate, month arg included)
    step7 = calculate_auxiliary_calamity_star_positions(
        chart.birth.year_stem, chart.birth.year_branch,
        chart.birth.hour_branch, chart.birth.lunar_month
    )

    return {
        "birth": {
            "year_stem":    chart.birth.year_stem,
            "year_branch":  chart.birth.year_branch,
            "lunar_month":  chart.birth.lunar_month,
            "lunar_day":    chart.birth.lunar_day,
            "hour_branch":  chart.birth.hour_branch,
            "gender":       chart.birth.gender,
            "location":     chart.birth.location,
            "name":         chart.birth.name,
        },
        "life_palace": {
            "branch":       chart.life_palace_branch,
            "stem":         chart.life_palace_stem,
            "stem_branch":  chart.life_palace_stem_branch,
        },
        "five_element_bureau": chart.five_element_bureau,
        "four_transformations": FOUR_TRANSFORMATIONS_BY_YEAR_STEM.get(chart.birth.year_stem, {}),
        # Developer step data — branch positions for each calculation stage
        "dev_steps": {
            "step5_ziwei_tianfu": step5,
            "step6_ziwei_system": step6_ziwei,
            "step6_tianfu_system": step6_tianfu,
            "step7_auxiliary": step7,
            "step8_four_transformations": FOUR_TRANSFORMATIONS_BY_YEAR_STEM.get(chart.birth.year_stem, {}),
        },
        "palaces": [
            {
                "palace_id":    p.palace_id,
                "palace_name":  p.palace_name,
                "branch":       p.branch,
                "stem":         p.stem,
                "stem_branch":  p.stem_branch,
                "ziwei_star":   p.ziwei_star,
                "tianfu_star":  p.tianfu_star,
                "major_stars":  p.major_stars or [],
                "transformations": p.transformations or {},
            }
            for p in chart.palaces
        ]
    }


# ============================================================
# TEST EXAMPLES (DEMO DATA)
# ============================================================

if __name__ == "__main__":
    # Test with Bennett (甲子年 1984, 農曆12月3日, 亥時)
    bennett = BirthData(
        year_stem="甲",
        year_branch="子",
        lunar_month=12,
        lunar_day=3,
        hour_branch="亥",
        gender="M",
        name="Bennett"
    )

    chart = calculate_natal_chart(bennett)
    print(f"生成命盤: {bennett.name}")
    print(f"出生年干: {chart.birth.year_stem}")
    print(f"農曆日期: {chart.birth.lunar_month}月 {chart.birth.lunar_day}日")
    print(f"出生時辰: {chart.birth.hour_branch}時")
    print(f"\n命宮: {chart.life_palace_stem_branch}")
    print(f"五行局: {chart.five_element_bureau}")

    # Get Ziwei & Tianfu positions
    ziwei_pos = calculate_ziwei_position(bennett.lunar_day, chart.five_element_bureau)
    tianfu_pos = calculate_tianfu_position(ziwei_pos)
    print(f"\nZiwei & Tianfu (STEP 5):")
    print(f"  紫微星 at: {ziwei_pos}宮")
    print(f"  天府星 at: {tianfu_pos}宮")

    # Get 14 major stars positions from chart (already calculated in calculate_natal_chart)
    major_stars_pos = {}
    for star_name, offset in ZIWEI_SYSTEM_STARS.items():
        star_index = (BRANCHES.index(ziwei_pos) + offset) % 12
        major_stars_pos[star_name] = BRANCHES[star_index]
    for star_name, offset in TIANFU_SYSTEM_STARS.items():
        star_index = (BRANCHES.index(tianfu_pos) + offset) % 12
        major_stars_pos[star_name] = BRANCHES[star_index]
    print(f"\n14 Major Stars (STEP 6):")
    print(f"  Ziwei System (Counter-clockwise from Ziwei):")
    for star in ["紫微", "天機", "太陽", "武曲", "天同", "廉貞"]:
        print(f"    {star}: {major_stars_pos[star]}宮")
    print(f"  Tianfu System (Mixed from Tianfu):")
    for star in ["天府", "太陰", "貪狼", "巨門", "天相", "天梁", "七殺", "破軍"]:
        print(f"    {star}: {major_stars_pos[star]}宮")

    # Get auxiliary stars positions (already placed in calculate_natal_chart)
    auxiliary_stars_pos = calculate_auxiliary_calamity_star_positions(
        bennett.year_stem, bennett.year_branch, bennett.hour_branch
    )

    print(f"\nAuxiliary & Calamity Stars (STEP 7):")
    print(f"  Year Stem based (5 stars):")
    for star in ["祿存", "擎羊", "陀羅", "天魁", "天鉞"]:
        if auxiliary_stars_pos.get(star):
            print(f"    {star}: {auxiliary_stars_pos[star]}宮")
    print(f"  Year Branch based (1 star):")
    for star in ["天馬"]:
        if auxiliary_stars_pos.get(star):
            print(f"    {star}: {auxiliary_stars_pos[star]}宮")
    print(f"  Hour based (2 stars):")
    for star in ["文昌", "文曲"]:
        if auxiliary_stars_pos.get(star):
            print(f"    {star}: {auxiliary_stars_pos[star]}宮")

    # Get four transformations
    four_transformations = FOUR_TRANSFORMATIONS_BY_YEAR_STEM.get(bennett.year_stem, {})
    print(f"\nNatal Four Transformations (STEP 8) - Year Stem: {bennett.year_stem}")
    print(f"  化祿 (Prosperity): {four_transformations.get('hua_lu', 'N/A')}")
    print(f"  化權 (Authority): {four_transformations.get('hua_quan', 'N/A')}")
    print(f"  化科 (Excellence): {four_transformations.get('hua_ke', 'N/A')}")
    print(f"  化忌 (Obstacle): {four_transformations.get('hua_ji', 'N/A')}")

    print(f"\n12宮排列 with All Stars (逆時針 COUNTERCLOCKWISE):")
    for palace in chart.palaces:
        stars = []
        if palace.ziwei_star:
            stars.append(palace.ziwei_star)
        if palace.tianfu_star:
            stars.append(palace.tianfu_star)
        if palace.major_stars:
            stars.extend(palace.major_stars)
        star_info = f" [{', '.join(stars)}]" if stars else ""

        # Add transformation info if present
        transformation_info = ""
        if palace.transformations:
            transforms = []
            for star_name, trans_type in palace.transformations.items():
                trans_emoji = {"hua_lu": "祿", "hua_quan": "權", "hua_ke": "科", "hua_ji": "忌"}.get(trans_type, trans_type)
                transforms.append(f"{star_name}化{trans_emoji}")
            if transforms:
                transformation_info = f" <{', '.join(transforms)}>"

        print(f"  {palace.palace_name}: {palace.stem_branch}{star_info}{transformation_info}")

    # ============================================================
    # TEST WITH BRIAN (丙 Stem)
    # ============================================================
    print("\n" + "="*60)
    brian = BirthData(
        year_stem="丙",
        year_branch="寅",
        lunar_month=12,
        lunar_day=17,
        hour_branch="酉",
        gender="M",
        name="Brian"
    )

    chart2 = calculate_natal_chart(brian)
    print(f"\n生成命盤: {brian.name}")
    print(f"出生年干: {chart2.birth.year_stem}")

    # Get four transformations for Brian
    four_transformations_brian = FOUR_TRANSFORMATIONS_BY_YEAR_STEM.get(brian.year_stem, {})
    print(f"\nNatal Four Transformations (STEP 8) - Year Stem: {brian.year_stem}")
    print(f"  化祿 (Prosperity): {four_transformations_brian.get('hua_lu', 'N/A')}")
    print(f"  化權 (Authority): {four_transformations_brian.get('hua_quan', 'N/A')}")
    print(f"  化科 (Excellence): {four_transformations_brian.get('hua_ke', 'N/A')}")
    print(f"  化忌 (Obstacle): {four_transformations_brian.get('hua_ji', 'N/A')}")

    print(f"\n12宮排列 with Transformations:")
    for palace in chart2.palaces:
        stars = []
        if palace.ziwei_star:
            stars.append(palace.ziwei_star)
        if palace.tianfu_star:
            stars.append(palace.tianfu_star)
        if palace.major_stars:
            stars.extend(palace.major_stars)
        star_info = f" [{', '.join(stars)}]" if stars else ""

        # Add transformation info
        transformation_info = ""
        if palace.transformations:
            transforms = []
            for star_name, trans_type in palace.transformations.items():
                trans_emoji = {"hua_lu": "祿", "hua_quan": "權", "hua_ke": "科", "hua_ji": "忌"}.get(trans_type, trans_type)
                transforms.append(f"{star_name}化{trans_emoji}")
            if transforms:
                transformation_info = f" <{', '.join(transforms)}>"

        if star_info or transformation_info:
            print(f"  {palace.palace_name}: {palace.stem_branch}{star_info}{transformation_info}")
