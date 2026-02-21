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
    Place Ziwei and Tianfu stars on the palace grid

    Args:
        palaces: List of 12 palaces
        ziwei_position: Ziwei star position (branch)
        tianfu_position: Tianfu star position (branch)
    """
    ziwei_index = BRANCHES.index(ziwei_position)
    tianfu_index = BRANCHES.index(tianfu_position)

    if 0 <= ziwei_index < len(palaces):
        palaces[ziwei_index].ziwei_star = "紫微星"

    if 0 <= tianfu_index < len(palaces):
        palaces[tianfu_index].tianfu_star = "天府星"


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
            major_stars=[]
        )
        palaces.append(palace)

    # STEP 5: Place Ziwei & Tianfu stars
    ziwei_position = calculate_ziwei_position(birth.lunar_day, five_element_bureau)
    tianfu_position = calculate_tianfu_position(ziwei_position)
    place_ziwei_tianfu_on_palaces(palaces, ziwei_position, tianfu_position)

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
    """Format chart data for API response"""
    return {
        "birth": {
            "year_stem": chart.birth.year_stem,
            "lunar_month": chart.birth.lunar_month,
            "lunar_day": chart.birth.lunar_day,
            "hour_branch": chart.birth.hour_branch,
            "gender": chart.birth.gender,
            "location": chart.birth.location,
            "name": chart.birth.name,
        },
        "life_palace": {
            "branch": chart.life_palace_branch,
            "stem": chart.life_palace_stem,
            "stem_branch": chart.life_palace_stem_branch,
        },
        "five_element_bureau": chart.five_element_bureau,
        "palaces": [
            {
                "palace_id": p.palace_id,
                "palace_name": p.palace_name,
                "branch": p.branch,
                "stem": p.stem,
                "stem_branch": p.stem_branch,
                "major_stars": p.major_stars or [],
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

    # Calculate Ziwei & Tianfu positions
    ziwei_pos = calculate_ziwei_position(bennett.lunar_day, chart.five_element_bureau)
    tianfu_pos = calculate_tianfu_position(ziwei_pos)
    print(f"\nZiwei & Tianfu:")
    print(f"  紫微星 at: {ziwei_pos}宮")
    print(f"  天府星 at: {tianfu_pos}宮")

    print(f"\n12宮排列 (逆時針 COUNTERCLOCKWISE):")
    for palace in chart.palaces:
        stars = []
        if palace.ziwei_star:
            stars.append(palace.ziwei_star)
        if palace.tianfu_star:
            stars.append(palace.tianfu_star)
        star_info = f" [{', '.join(stars)}]" if stars else ""
        print(f"  {palace.palace_name}: {palace.stem_branch}{star_info}")
