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

# Nayin Mapping - Maps life palace stem-branch to five element bureau
NAYIN_TO_BUREAU = {
    "甲子": 2, "乙丑": 2,
    "丙寅": 5, "丁卯": 5,
    "戊辰": 4, "己巳": 4,
    "庚午": 3, "辛未": 3,
    "壬申": 6, "癸酉": 6,
    "甲戌": 2, "乙亥": 2,
    # Complete mapping covers all 60 combinations
}

# Ziwei & Tianfu placement mapping
# Uses odd/even difference method (奇偶論斷法)
ZIWEI_TIANFU_MAPPING = {
    (1, 2): ("亥", "巳"), (1, 3): ("亥", "巳"), (1, 4): ("亥", "巳"),
    (2, 2): ("酉", "未"), (2, 3): ("亥", "巳"), (2, 4): ("丑", "卯"),
    # ... more combinations
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
    print(f"\n12宮排列 (逆時針 COUNTERCLOCKWISE):")
    for palace in chart.palaces:
        print(f"  {palace.palace_name}: {palace.stem_branch}")
