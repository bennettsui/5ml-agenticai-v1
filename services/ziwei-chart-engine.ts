/**
 * Ziwei Astrology Chart Engine (中州派紫微斗數)
 * Core deterministic calculation for birth chart (本命局)
 *
 * Algorithm flow: 立命宮 → 五行局 → 安紫微 → 安天府 → 安十四主星 → 安輔佐煞曜 → 本命四化
 */

/// <reference types="node" />

// ==================== Types ====================

type Branch = "子" | "丑" | "寅" | "卯" | "辰" | "巳" | "午" | "未" | "申" | "酉" | "戌" | "亥";
type Stem = "甲" | "乙" | "丙" | "丁" | "戊" | "己" | "庚" | "辛" | "壬" | "癸";

type PalaceName =
  | "命宮" | "兄弟宮" | "夫妻宮" | "子女宮" | "財帛宮" | "疾厄宮"
  | "遷移宮" | "僕役宮" | "官祿宮" | "田宅宮" | "福德宮" | "父母宮";

type MajorStar =
  | "紫微" | "天機" | "太陽" | "武曲" | "天同" | "廉貞"
  | "天府" | "太陰" | "貪狼" | "巨門" | "天相" | "天梁" | "七殺" | "破軍";

type MinorStar =
  | "左輔" | "右弼" | "文昌" | "文曲" | "天魁" | "天鉞"
  | "祿存" | "擎羊" | "陀羅" | "火星" | "鈴星";

type Transformation = "祿" | "權" | "科" | "忌";

interface BaseChartInput {
  lunarYear: number;
  lunarMonth: number;
  lunarDay: number;
  hourBranch: Branch;
  yearStem: Stem;
  yearBranch: Branch;
  gender: "男" | "女";
}

interface House {
  index: number;
  branch: Branch;
  name: PalaceName;
  majorStars: MajorStar[];
  minorStars: MinorStar[];
  transformations: Transformation[];
}

interface BaseChart {
  houses: House[];
  lifeHouseIndex: number;
  bodyHouseIndex: number;
  fiveElementBureau: number;
  baseFourTransformations: Record<Transformation, MajorStar>;
  starPositions: Record<MajorStar | MinorStar, number>;
}

// ==================== Lookup Tables ====================

// TODO: 根據實際安星訣將年干 → 五行局的完整表格補齊
const fiveElementBureauTable: Record<Stem, number> = {
  "甲": 3, "乙": 3, "丙": 6, "丁": 6, "戊": 5,
  "己": 5, "庚": 4, "辛": 4, "壬": 2, "癸": 2
};

// TODO: 根據安星訣表格補上所有局數×餘數對應紫微位置
const ziweiPositionByBureauAndRemainder: Record<number, Record<number, Branch>> = {
  2: { 0: "亥", 1: "丑", 2: "子" },
  3: { 0: "子", 1: "寅", 2: "丑" },
  4: { 0: "丑", 1: "卯", 2: "寅" },
  5: { 0: "寅", 1: "辰", 2: "卯" },
  6: { 0: "卯", 1: "巳", 2: "辰" }
};

// TODO: 需用實際紫微天府對照表替換
const tianfuByZiweiBranch: Record<Branch, Branch> = {
  "子": "午", "丑": "未", "寅": "申", "卯": "酉",
  "辰": "戌", "巳": "亥", "午": "子", "未": "丑",
  "申": "寅", "酉": "卯", "戌": "辰", "亥": "巳"
};

// TODO: 根據實際星系表補足所有主星
const majorStarOffsetsFromZiwei: Partial<Record<MajorStar, number>> = {
  "紫微": 0, "天機": 1, "太陽": 2, "武曲": -1,
  "天同": -2, "廉貞": 3
};

const majorStarOffsetsFromTianfu: Partial<Record<MajorStar, number>> = {
  "天府": 0, "太陰": -1, "貪狼": -2, "巨門": 1,
  "天相": 2, "天梁": 3, "七殺": -3, "破軍": -4
};

// TODO: 根據實際天魁天鉞表補齊
const tianKuiByYearStem: Record<Stem, Branch> = {
  "甲": "寅", "乙": "寅", "丙": "巳", "丁": "巳", "戊": "巳",
  "己": "巳", "庚": "申", "辛": "申", "壬": "亥", "癸": "亥"
};

const tianYueByYearStem: Record<Stem, Branch> = {
  "甲": "申", "乙": "申", "丙": "亥", "丁": "亥", "戊": "亥",
  "己": "亥", "庚": "寅", "辛": "寅", "壬": "巳", "癸": "巳"
};

// TODO: 補齊所有天干四化對應表
const fourTransformationsByYearStem: Record<Stem, Record<Transformation, MajorStar>> = {
  "甲": { "祿": "廉貞", "權": "破軍", "科": "武曲", "忌": "太陽" },
  "乙": { "祿": "天機", "權": "天梁", "科": "紫微", "忌": "太陰" },
  "丙": { "祿": "天同", "權": "天機", "科": "廉貞", "忌": "巨門" },
  "丁": { "祿": "太陰", "權": "武曲", "科": "天府", "忌": "天同" },
  "戊": { "祿": "貪狼", "權": "太陽", "科": "天機", "忌": "廉貞" },
  "己": { "祿": "武曲", "權": "廉貞", "科": "天府", "忌": "破軍" },
  "庚": { "祿": "太陽", "權": "天府", "科": "紫微", "忌": "武曲" },
  "辛": { "祿": "天梁", "權": "紫微", "科": "破軍", "忌": "天機" },
  "壬": { "祿": "天機", "權": "天同", "科": "廉貞", "忌": "破軍" },
  "癸": { "祿": "破軍", "權": "巨門", "科": "太陽", "忌": "貪狼" }
};

const palaceNames: PalaceName[] = [
  "命宮", "兄弟宮", "夫妻宮", "子女宮", "財帛宮", "疾厄宮",
  "遷移宮", "僕役宮", "官祿宮", "田宅宮", "福德宮", "父母宮"
];

const branchOrder: Branch[] = ["寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥", "子", "丑"];

// ==================== Helper Functions ====================

function branchToIndex(branch: Branch): number {
  return branchOrder.indexOf(branch);
}

function indexToBranch(index: number): Branch {
  return branchOrder[index % 12];
}

function findLifeHouseIndex(lunarMonth: number, hourBranch: Branch): number {
  // 月宮：自寅宮起順行 lunarMonth - 1 宮
  const monthHouseIndex = (lunarMonth - 1) % 12;

  // 時辰對應序數：子=1, 丑=2, ..., 亥=12
  const hourIndex = branchToIndex(hourBranch) + 1;

  // 命宮：以月宮為起點，逆行 hourIndex 步
  return (monthHouseIndex - hourIndex + 12) % 12;
}

function initializeHouses(lifeHouseAbsoluteIndex: number): House[] {
  // lifeHouseAbsoluteIndex is a position in branchOrder (0-11)
  // We create houses array where index 0 is always the life house
  const houses: House[] = [];
  for (let i = 0; i < 12; i++) {
    const branchIndex = (lifeHouseAbsoluteIndex + i) % 12;
    houses.push({
      index: i,
      branch: indexToBranch(branchIndex),
      name: palaceNames[i],
      majorStars: [],
      minorStars: [],
      transformations: []
    });
  }
  return houses;
}

function calculateFiveElementBureau(yearStem: Stem): number {
  return fiveElementBureauTable[yearStem];
}

function getZiweiPosition(lunarDay: number, bureau: number): Branch {
  const remainder = lunarDay % bureau || bureau;
  const lookup = ziweiPositionByBureauAndRemainder[bureau];
  if (!lookup) throw new Error(`Unknown bureau: ${bureau}`);
  return lookup[remainder] || "子"; // fallback
}

function placeStar(
  houses: House[],
  starPositions: Record<MajorStar | MinorStar, number>,
  star: MajorStar | MinorStar,
  branchOrIndex: Branch | number
): void {
  const houseIndex = typeof branchOrIndex === "number"
    ? branchOrIndex
    : houses.findIndex(h => h.branch === branchOrIndex);

  if (houseIndex === -1) throw new Error(`Branch not found: ${branchOrIndex}`);

  const isMajor = ["紫微", "天機", "太陽", "武曲", "天同", "廉貞", "天府", "太陰", "貪狼", "巨門", "天相", "天梁", "七殺", "破軍"].includes(star);

  if (isMajor) {
    houses[houseIndex].majorStars.push(star as MajorStar);
  } else {
    houses[houseIndex].minorStars.push(star as MinorStar);
  }

  starPositions[star] = houseIndex;
}

// ==================== Main Function ====================

export function calcBaseChart(input: BaseChartInput): BaseChart {
  const {
    lunarYear,
    lunarMonth,
    lunarDay,
    hourBranch,
    yearStem,
    yearBranch,
    gender
  } = input;

  // 1. Initialize houses and find life house (命宮)
  const lifeHouseIndex = findLifeHouseIndex(lunarMonth, hourBranch);
  const houses = initializeHouses(lifeHouseIndex);

  // 2. Calculate five element bureau (五行局)
  const fiveElementBureau = calculateFiveElementBureau(yearStem);

  // 3. Place Ziwei (紫微)
  const starPositions: Record<string, number> = {};
  const ziweiLifeBranch = getZiweiPosition(lunarDay, fiveElementBureau);
  const ziweiHouseIndex = houses.findIndex(h => h.branch === ziweiLifeBranch);
  if (ziweiHouseIndex === -1) throw new Error(`Ziwei branch not found: ${ziweiLifeBranch}`);
  placeStar(houses, starPositions as Record<MajorStar | MinorStar, number>, "紫微", ziweiHouseIndex);

  // 4. Place Tianfu (天府)
  const tianfuBranch = tianfuByZiweiBranch[ziweiLifeBranch];
  const tianfuHouseIndex = houses.findIndex(h => h.branch === tianfuBranch);
  if (tianfuHouseIndex === -1) throw new Error(`Tianfu branch not found: ${tianfuBranch}`);
  placeStar(houses, starPositions as Record<MajorStar | MinorStar, number>, "天府", tianfuHouseIndex);

  // 5. Place remaining 12 major stars using offsets
  const ziweiIndex = starPositions["紫微"];
  const tianfuIndex = starPositions["天府"];

  if (ziweiIndex === undefined) throw new Error("Ziwei not in starPositions");
  if (tianfuIndex === undefined) throw new Error("Tianfu not in starPositions");

  for (const [star, offset] of Object.entries(majorStarOffsetsFromZiwei)) {
    if (star === "紫微") continue;
    const houseIndex = ((ziweiIndex + (offset as number)) % 12 + 12) % 12;
    placeStar(houses, starPositions as Record<MajorStar | MinorStar, number>, star as MajorStar, houseIndex);
  }

  for (const [star, offset] of Object.entries(majorStarOffsetsFromTianfu)) {
    if (star === "天府") continue;
    if (star in starPositions) continue; // already placed
    const houseIndex = ((tianfuIndex + (offset as number)) % 12 + 12) % 12;
    placeStar(houses, starPositions as Record<MajorStar | MinorStar, number>, star as MajorStar, houseIndex);
  }

  // 6. Place minor stars (輔佐煞曜) - simplified version
  // 天魁、天鉞 based on year stem
  const tianKuiBranch = tianKuiByYearStem[yearStem];
  const tianYueBranch = tianYueByYearStem[yearStem];
  placeStar(houses, starPositions as Record<MajorStar | MinorStar, number>, "天魁" as MinorStar, tianKuiBranch);
  placeStar(houses, starPositions as Record<MajorStar | MinorStar, number>, "天鉞" as MinorStar, tianYueBranch);

  // 左輔 and 右弼: offset from life house
  placeStar(houses, starPositions as Record<MajorStar | MinorStar, number>, "左輔" as MinorStar, (lifeHouseIndex + 2) % 12);
  placeStar(houses, starPositions as Record<MajorStar | MinorStar, number>, "右弼" as MinorStar, (lifeHouseIndex + 10) % 12);

  // 7. Place four transformations (本命四化)
  const baseFourTransformations = fourTransformationsByYearStem[yearStem];
  for (const [transformation, star] of Object.entries(baseFourTransformations)) {
    if (star in starPositions) {
      const houseIndex = starPositions[star];
      houses[houseIndex].transformations.push(transformation as Transformation);
    }
  }

  // 8. Body house (身宮) - simplified: offset from life house
  // Note: in this array, lifeHouseIndex is always 0, so body house is calculated from 0
  const bodyHouseIndex = (12 - (lunarDay % 12)) % 12;

  return {
    houses,
    lifeHouseIndex: 0,  // Always 0 in this array structure
    bodyHouseIndex,
    fiveElementBureau,
    baseFourTransformations,
    starPositions: starPositions as Record<MajorStar | MinorStar, number>
  };
}

// ==================== Tests ====================

function assert(cond: boolean, msg: string): void {
  if (!cond) throw new Error(`❌ ${msg}`);
  console.log(`✅ ${msg}`);
}

function test(): void {
  console.log("\n🧪 Running Ziwei Chart Engine tests...\n");

  // Test 1: Basic structure
  const chart1 = calcBaseChart({
    lunarYear: 1984,
    lunarMonth: 1,
    lunarDay: 15,
    hourBranch: "子",
    yearStem: "甲",
    yearBranch: "子",
    gender: "男"
  });

  assert(chart1.houses.length === 12, "Chart should have 12 houses");
  assert(chart1.houses[chart1.lifeHouseIndex].name === "命宮", "Life house should be 命宮");
  assert(chart1.fiveElementBureau === 3, "5-element bureau for 甲 should be 3");
  console.log(`  Life house index: ${chart1.lifeHouseIndex}`);
  console.log(`  Ziwei position: ${chart1.starPositions["紫微"]}`);

  // Test 2: Star placements
  const chart2 = calcBaseChart({
    lunarYear: 1990,
    lunarMonth: 6,
    lunarDay: 10,
    hourBranch: "午",
    yearStem: "庚",
    yearBranch: "午",
    gender: "女"
  });

  assert("紫微" in chart2.starPositions, "Ziwei must be placed");
  assert("天府" in chart2.starPositions, "Tianfu must be placed");
  assert(chart2.starPositions["紫微"] !== chart2.starPositions["天府"], "Ziwei and Tianfu should not overlap");
  console.log(`  Ziwei at house ${chart2.starPositions["紫微"]}, Tianfu at house ${chart2.starPositions["天府"]}`);

  // Test 3: Four transformations
  const chart3 = calcBaseChart({
    lunarYear: 2000,
    lunarMonth: 12,
    lunarDay: 25,
    hourBranch: "酉",
    yearStem: "己",
    yearBranch: "辰",
    gender: "男"
  });

  assert(Object.keys(chart3.baseFourTransformations).length === 4, "Should have 4 transformations");
  let transformationCount = 0;
  for (const house of chart3.houses) {
    transformationCount += house.transformations.length;
  }
  assert(transformationCount > 0, "At least one house should have transformations");
  console.log(`  Transformations placed: ${transformationCount}`);

  console.log("\n✨ All tests passed!\n");
}

// Export types and functions
export type { BaseChartInput, House, BaseChart };
export { test };
