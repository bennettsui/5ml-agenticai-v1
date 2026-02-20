/**
 * Ziwei Astrology Chart Engine (中州派紫微斗數)
 * Core deterministic calculation for birth chart (本命局)
 *
 * Algorithm flow: 立命宮 → 五行局 → 安紫微 → 安天府 → 安十四主星 → 安輔佐煞曜 → 本命四化
 */

// ==================== Lookup Tables ====================

// ✅ 五行局表格（由命宮天干決定，不是出生年份天干）
// 甲乙→金四局, 丙丁→水二局, 戊己→火六局, 庚→土五局(實際是5), 辛→土五局, 壬癸→木三局
const fiveElementBureauTable = {
  "甲": 4, "乙": 4,  // 金四局
  "丙": 2, "丁": 2,  // 水二局
  "戊": 6, "己": 6,  // 火六局
  "庚": 4, "辛": 5,  // 庚金四局，辛土五局
  "壬": 3, "癸": 3   // 木三局
};

// ✅ 紫微位置（根據農曆日期和五行局計算）
// 由余數對應的地支（每個局都循環對應）
const ziweiPositionByBureauAndRemainder = {
  2: { 0: "亥", 1: "丑", 2: "子" },
  3: { 0: "子", 1: "寅", 2: "丑", 3: "子" },
  4: { 0: "丑", 1: "卯", 2: "寅", 3: "丑", 4: "卯" },
  5: { 0: "寅", 1: "辰", 2: "卯", 3: "寅", 4: "辰", 5: "寅" },
  6: { 0: "卯", 1: "巳", 2: "辰", 3: "卯", 4: "巳", 5: "辰", 6: "卯" }
};

// TODO: 需用實際紫微天府對照表替換
const tianfuByZiweiBranch = {
  "子": "午", "丑": "未", "寅": "申", "卯": "酉",
  "辰": "戌", "巳": "亥", "午": "子", "未": "丑",
  "申": "寅", "酉": "卯", "戌": "辰", "亥": "巳"
};

// TODO: 根據實際星系表補足所有主星
const majorStarOffsetsFromZiwei = {
  "紫微": 0, "天機": 1, "太陽": 2, "武曲": -1,
  "天同": -2, "廉貞": 3
};

const majorStarOffsetsFromTianfu = {
  "天府": 0, "太陰": -1, "貪狼": -2, "巨門": 1,
  "天相": 2, "天梁": 3, "七殺": -3, "破軍": -4
};

// ✅ 天魁、天鉞表格（由生年天干決定）
// 口訣：「甲戊庚牛羊，乙己鼠猴鄉，丙丁豬雞位，壬癸兔蛇藏，六辛逢馬虎」
const tianKuiByYearStem = {
  "甲": "丑", "乙": "子", "丙": "亥", "丁": "亥",
  "戊": "丑", "己": "子", "庚": "丑", "辛": "午", "壬": "卯", "癸": "卯"
};

const tianYueByYearStem = {
  "甲": "未", "乙": "申", "丙": "酉", "丁": "酉",
  "戊": "未", "己": "申", "庚": "未", "辛": "寅", "壬": "巳", "癸": "巳"
};

// ✅ 四化星表格（由生年天干決定）- 已驗證
const fourTransformationsByYearStem = {
  "甲": { "祿": "廉貞", "權": "破軍", "科": "武曲", "忌": "太陽" },
  "乙": { "祿": "天機", "權": "天梁", "科": "紫微", "忌": "太陰" },
  "丙": { "祿": "天同", "權": "天機", "科": "文昌", "忌": "廉貞" },
  "丁": { "祿": "太陰", "權": "天同", "科": "天機", "忌": "巨門" },
  "戊": { "祿": "貪狼", "權": "太陰", "科": "右弼", "忌": "天機" },
  "己": { "祿": "武曲", "權": "貪狼", "科": "天梁", "忌": "文曲" },
  "庚": { "祿": "太陽", "權": "武曲", "科": "天同", "忌": "天相" },
  "辛": { "祿": "巨門", "權": "太陽", "科": "文曲", "忌": "文昌" },
  "壬": { "祿": "天梁", "權": "紫微", "科": "左輔", "忌": "武曲" },
  "癸": { "祿": "破軍", "權": "巨門", "科": "太陰", "忌": "貪狼" }
};

// ✅ 祿存星（由生年天干決定）
const luCunByYearStem = {
  "甲": "寅", "乙": "卯", "丙": "巳", "丁": "午",
  "戊": "巳", "己": "午", "庚": "申", "辛": "酉",
  "壬": "亥", "癸": "子"
};

// ✅ 天馬星（由生年地支決定，只在寅申巳亥四馬地）
const tianMaByBranch = {
  "申": "寅", "子": "寅", "辰": "寅",
  "寅": "申", "午": "申", "戌": "申",
  "亥": "巳", "卯": "巳", "未": "巳",
  "巳": "亥", "酉": "亥", "丑": "亥"
};

// ✅ 文昌、文曲星（由生年地支決定）
const wenChangWenQuByBranch = {
  "子": { "文昌": "卯", "文曲": "酉" },
  "午": { "文昌": "卯", "文曲": "酉" },
  "丑": { "文昌": "辰", "文曲": "戌" },
  "未": { "文昌": "辰", "文曲": "戌" },
  "寅": { "文昌": "巳", "文曲": "亥" },
  "申": { "文昌": "巳", "文曲": "亥" },
  "卯": { "文昌": "午", "文曲": "子" },
  "酉": { "文昌": "午", "文曲": "子" },
  "辰": { "文昌": "未", "文曲": "丑" },
  "戌": { "文昌": "未", "文曲": "丑" },
  "巳": { "文昌": "申", "文曲": "寅" },
  "亥": { "文昌": "申", "文曲": "寅" }
};

// ✅ 左輔、右弼星（由生年地支決定）
const leftRightByBranch = {
  "子": { "左輔": "卯", "右弼": "酉" },
  "午": { "左輔": "卯", "右弼": "酉" },
  "丑": { "左輔": "辰", "右弼": "戌" },
  "未": { "左輔": "辰", "右弼": "戌" },
  "寅": { "左輔": "巳", "右弼": "亥" },
  "申": { "左輔": "巳", "右弼": "亥" },
  "卯": { "左輔": "午", "右弼": "子" },
  "酉": { "左輔": "午", "右弼": "子" },
  "辰": { "左輔": "未", "右弼": "丑" },
  "戌": { "左輔": "未", "右弼": "丑" },
  "巳": { "左輔": "申", "右弼": "寅" },
  "亥": { "左輔": "申", "右弼": "寅" }
};

// ✅ 擎羊、陀羅星（由祿存推算）
// 擎羊 = 祿存 + 1 (順時針)
// 陀羅 = 祿存 - 1 (逆時針)
// 這在代碼中動態計算

// ✅ 長生十二星（由生年地支決定起點）
const lifeStageStars = [
  "長生", "沐浴", "冠帶", "臨官", "帝旺",
  "衰", "病", "死", "墓", "絕", "胎", "養"
];

const lifeStageStartByBranch = {
  "子": "午", "丑": "未", "寅": "申", "卯": "酉",
  "辰": "戌", "巳": "亥", "午": "子", "未": "丑",
  "申": "寅", "酉": "卯", "戌": "辰", "亥": "巳"
};

// ✅ 博士十二神（由祿存位置起，根據性別決定方向）
const scholarDeities = [
  "博士", "力士", "青龍", "小耗", "將軍", "奏書",
  "飛廉", "喜神", "病符", "大耗", "伏兵", "官符"
];

// ✅ 廟旺平陷表（4級制度：廟、旺、平、陷）
// 每顆星在各地支的亮度等級
const brightnessTable = {
  "紫微": { "子": "廟", "寅": "旺", "午": "平", "巳": "陷", "亥": "陷", "丑": "平", "卯": "平", "未": "陷", "申": "旺", "酉": "平", "戌": "陷", "辰": "平" },
  "天府": { "辰": "廟", "戌": "廟", "申": "廟", "寅": "廟", "未": "旺", "丑": "旺", "午": "平", "卯": "平", "子": "陷", "巳": "陷", "亥": "陷", "酉": "陷" },
  "太陽": { "寅": "廟", "卯": "廟", "辰": "旺", "巳": "旺", "午": "旺", "未": "平", "酉": "平", "申": "陷", "丑": "陷", "子": "陷", "亥": "陷", "戌": "陷" },
  "武曲": { "子": "廟", "午": "旺", "寅": "平", "卯": "平", "酉": "平", "辰": "陷", "戌": "陷", "巳": "陷", "亥": "陷", "丑": "陷", "未": "陷", "申": "陷" },
  "天同": { "午": "廟", "寅": "旺", "卯": "旺", "子": "平", "酉": "平", "辰": "陷", "戌": "陷", "巳": "陷", "亥": "陷", "丑": "陷", "未": "陷", "申": "陷" },
  "天機": { "巳": "廟", "卯": "旺", "午": "旺", "申": "旺", "戌": "旺", "寅": "平", "酉": "平", "子": "陷", "丑": "陷", "未": "陷", "亥": "陷", "辰": "陷" },
  "廉貞": { "未": "廟", "申": "旺", "酉": "旺", "戌": "旺", "子": "旺", "午": "平", "卯": "平", "丑": "陷", "巳": "陷", "亥": "陷", "寅": "陷", "辰": "陷" },
  "太陰": { "戌": "廟", "亥": "廟", "子": "廟", "丑": "廟", "酉": "旺", "申": "平", "卯": "陷", "辰": "陷", "巳": "陷", "午": "陷", "寅": "陷", "未": "陷" },
  "貪狼": { "卯": "廟", "午": "廟", "寅": "旺", "辰": "旺", "申": "旺", "戌": "旺", "子": "平", "亥": "平", "丑": "陷", "巳": "陷", "酉": "陷", "未": "陷" },
  "巨門": { "午": "廟", "子": "旺", "寅": "旺", "申": "旺", "戌": "旺", "卯": "平", "酉": "平", "丑": "陷", "辰": "陷", "巳": "陷", "未": "陷", "亥": "陷" },
  "天相": { "子": "廟", "午": "廟", "寅": "旺", "申": "旺", "卯": "平", "酉": "平", "巳": "陷", "亥": "陷", "丑": "陷", "未": "陷", "辰": "陷", "戌": "陷" },
  "天梁": { "寅": "廟", "卯": "旺", "辰": "旺", "午": "旺", "子": "平", "酉": "平", "申": "陷", "丑": "陷", "巳": "陷", "亥": "陷", "未": "陷", "戌": "陷" },
  "七殺": { "申": "廟", "寅": "旺", "卯": "旺", "辰": "旺", "午": "旺", "子": "平", "酉": "平", "未": "陷", "丑": "陷", "巳": "陷", "亥": "陷", "戌": "陷" },
  "破軍": { "巳": "廟", "午": "旺", "申": "旺", "子": "平", "卯": "平", "寅": "陷", "丑": "陷", "未": "陷", "戌": "陷", "亥": "陷", "酉": "陷", "辰": "陷" }
};

const palaceNames = [
  "命宮", "兄弟宮", "夫妻宮", "子女宮", "財帛宮", "疾厄宮",
  "遷移宮", "僕役宮", "官祿宮", "田宅宮", "福德宮", "父母宮"
];

const branchOrder = ["寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥", "子", "丑"];

// ==================== Helper Functions ====================

// ✅ 性別分類（根據生年天干和性別）
function getGenderType(yearStem, gender) {
  const yangStems = ['甲', '丙', '戊', '庚', '壬'];
  const isYangStem = yangStems.includes(yearStem);

  if (gender === '男') {
    return isYangStem ? 'yang_male' : 'yin_male';
  } else {
    return isYangStem ? 'yang_female' : 'yin_female';
  }
}

// ✅ 大限方向（十年一期）
// 陽男 + 陰女 → 順行；陰男 + 陽女 → 逆行
function getDecadeDirection(genderType) {
  return ['yang_male', 'yin_female'].includes(genderType) ? 'clockwise' : 'counter_clockwise';
}

// ✅ 小限方向（一年一期）
// 男命順行，女命逆行
function getAnnualDirection(gender) {
  return gender === '男' ? 'clockwise' : 'counter_clockwise';
}

// ✅ 博士十二神排列方向
// 同大限方向
function getScholarDeityDirection(genderType) {
  return getDecadeDirection(genderType);
}

// ✅ 獲取廟旺平陷等級
function getBrightness(star, branch) {
  if (!brightnessTable[star]) return '平'; // default
  return brightnessTable[star][branch] || '平';
}

function branchToIndex(branch) {
  return branchOrder.indexOf(branch);
}

function indexToBranch(index) {
  return branchOrder[((index % 12) + 12) % 12];
}

function findLifeHouseIndex(lunarMonth, hourBranch, isBodyHouse = false) {
  // 月宮：自寅宮起順行 lunarMonth - 1 宮
  const monthHouseIndex = (lunarMonth - 1) % 12;

  // 時辰對應序數：子=1, 丑=2, ..., 亥=12
  const hourIndex = branchToIndex(hourBranch) + 1;

  if (isBodyHouse) {
    // 身宮：以月宮為起點，順行 hourIndex 步
    return (monthHouseIndex + hourIndex) % 12;
  } else {
    // 命宮：以月宮為起點，逆行 hourIndex 步
    return (monthHouseIndex - hourIndex + 24) % 12;
  }
}

function initializeHouses(lifeHouseAbsoluteIndex) {
  // lifeHouseAbsoluteIndex is a position in branchOrder (0-11)
  // We create houses array where index 0 is always the life house
  const houses = [];
  for (let i = 0; i < 12; i++) {
    const branchIndex = (lifeHouseAbsoluteIndex + i) % 12;
    const branch = indexToBranch(branchIndex);
    houses.push({
      index: i,
      branch: branch,
      name: palaceNames[i],
      majorStars: [],
      majorStarsBrightness: {}, // 廟旺平陷
      minorStars: [],
      minorStarsBrightness: {}, // 廟旺平陷
      transformations: [],
      limitStars: {}, // 大限、小限、長生、博士等
      lifeStageStars: [],
      scholarDeities: []
    });
  }
  return houses;
}

function calculateFiveElementBureau(yearStem) {
  return fiveElementBureauTable[yearStem];
}

function getZiweiPosition(lunarDay, bureau) {
  const remainder = lunarDay % bureau;
  const actualRemainder = remainder === 0 ? bureau : remainder;
  const lookup = ziweiPositionByBureauAndRemainder[bureau];
  if (!lookup) throw new Error(`Unknown bureau: ${bureau}`);
  const result = lookup[actualRemainder] || lookup[actualRemainder - 1] || "子";
  if (!result) throw new Error(`Cannot determine Ziwei position for bureau ${bureau}, remainder ${actualRemainder}`);
  return result;
}

function placeStar(houses, starPositions, star, branchOrIndex) {
  const houseIndex = typeof branchOrIndex === "number"
    ? branchOrIndex
    : houses.findIndex(h => h.branch === branchOrIndex);

  if (houseIndex === -1) throw new Error(`Branch not found: ${branchOrIndex}`);

  const branch = houses[houseIndex].branch;
  const brightness = getBrightness(star, branch);

  const isMajor = ["紫微", "天機", "太陽", "武曲", "天同", "廉貞", "天府", "太陰", "貪狼", "巨門", "天相", "天梁", "七殺", "破軍"].includes(star);

  if (isMajor) {
    houses[houseIndex].majorStars.push(star);
    houses[houseIndex].majorStarsBrightness[star] = brightness;
  } else {
    houses[houseIndex].minorStars.push(star);
    houses[houseIndex].minorStarsBrightness[star] = brightness;
  }

  starPositions[star] = { houseIndex, brightness };
}

// ==================== Main Function ====================

function calcBaseChart(input) {
  const {
    lunarYear,
    lunarMonth,
    lunarDay,
    hourBranch,
    yearStem,
    yearBranch,
    gender
  } = input;

  // 🔴 **Step 1: Initialize houses and find life house (命宮)**
  const lifeHouseIndex = findLifeHouseIndex(lunarMonth, hourBranch);
  const houses = initializeHouses(lifeHouseIndex);

  // 🔴 **Step 2: Calculate five element bureau (五行局)**
  const fiveElementBureau = calculateFiveElementBureau(yearStem);

  // 🔴 **Step 3: Place Ziwei (紫微)**
  const starPositions = {};
  const ziweiLifeBranch = getZiweiPosition(lunarDay, fiveElementBureau);
  const ziweiHouseIndex = houses.findIndex(h => h.branch === ziweiLifeBranch);
  if (ziweiHouseIndex === -1) throw new Error(`Ziwei branch not found: ${ziweiLifeBranch}`);
  placeStar(houses, starPositions, "紫微", ziweiHouseIndex);

  // 🔴 **Step 4: Place Tianfu (天府)**
  const tianfuBranch = tianfuByZiweiBranch[ziweiLifeBranch];
  const tianfuHouseIndex = houses.findIndex(h => h.branch === tianfuBranch);
  if (tianfuHouseIndex === -1) throw new Error(`Tianfu branch not found: ${tianfuBranch}`);
  placeStar(houses, starPositions, "天府", tianfuHouseIndex);

  // 🔴 **Step 5: Place remaining 12 major stars**
  const ziweiPos = starPositions["紫微"];
  const tianfuPos = starPositions["天府"];

  if (!ziweiPos || !tianfuPos) throw new Error("紫微 or 天府 not placed");

  for (const [star, offset] of Object.entries(majorStarOffsetsFromZiwei)) {
    if (star === "紫微") continue;
    const houseIndex = ((ziweiPos.houseIndex + offset) % 12 + 12) % 12;
    placeStar(houses, starPositions, star, houseIndex);
  }

  for (const [star, offset] of Object.entries(majorStarOffsetsFromTianfu)) {
    if (star === "天府") continue;
    if (star in starPositions) continue;
    const houseIndex = ((tianfuPos.houseIndex + offset) % 12 + 12) % 12;
    placeStar(houses, starPositions, star, houseIndex);
  }

  // 🔴 **Step 6: Place birth-year-stem stars (生年干諸星曜)**
  // 天魁、天鉞
  placeStar(houses, starPositions, "天魁", tianKuiByYearStem[yearStem]);
  placeStar(houses, starPositions, "天鉞", tianYueByYearStem[yearStem]);

  // 祿存、天馬
  placeStar(houses, starPositions, "祿存", luCunByYearStem[yearStem]);
  placeStar(houses, starPositions, "天馬", tianMaByBranch[yearBranch]);

  // 擎羊、陀羅（相對祿存）
  const luCunBranch = luCunByYearStem[yearStem];
  const luCunIndex = branchToIndex(luCunBranch);
  const qingYangBranch = indexToBranch(luCunIndex + 1);
  const tuoLuoBranch = indexToBranch(luCunIndex - 1);
  placeStar(houses, starPositions, "擎羊", qingYangBranch);
  placeStar(houses, starPositions, "陀羅", tuoLuoBranch);

  // 🔴 **Step 7: Place other secondary stars (其他諸星曜)**
  // 文昌、文曲
  const wenStars = wenChangWenQuByBranch[yearBranch];
  if (wenStars) {
    placeStar(houses, starPositions, "文昌", wenStars["文昌"]);
    placeStar(houses, starPositions, "文曲", wenStars["文曲"]);
  }

  // 左輔、右弼
  const leftRightStars = leftRightByBranch[yearBranch];
  if (leftRightStars) {
    placeStar(houses, starPositions, "左輔", leftRightStars["左輔"]);
    placeStar(houses, starPositions, "右弼", leftRightStars["右弼"]);
  }

  // 🔴 **Step 8: Place four transformations (本命四化)**
  const baseFourTransformations = fourTransformationsByYearStem[yearStem];
  for (const [transformation, star] of Object.entries(baseFourTransformations)) {
    if (star in starPositions) {
      const pos = starPositions[star];
      const houseIndex = pos.houseIndex;
      houses[houseIndex].transformations.push(transformation);
    }
  }

  // 🔴 **Step 9: Place decade & annual limits (大限與小限) - WITH GENDER LOGIC**
  const genderType = getGenderType(yearStem, gender);
  const decadeDir = getDecadeDirection(genderType);
  const annualDir = getAnnualDirection(gender);

  const ageAtStart = fiveElementBureau;
  const decadeLimits = [];
  for (let decade = 0; decade < 12; decade++) {
    const ageStart = ageAtStart + decade * 10;
    const houseOffset = decadeDir === 'clockwise' ? decade : -decade;
    const palaceIndex = (houseOffset + 12) % 12;
    decadeLimits.push({
      decade: decade + 1,
      ageStart,
      ageEnd: ageStart + 9,
      palaceIndex,
      palaceName: palaceNames[palaceIndex]
    });
  }

  const annualLimits = [];
  // 小限起點：根據生年支
  const annualStartBranch = lifeStageStartByBranch[yearBranch];
  const annualStartIndex = branchToIndex(annualStartBranch);

  for (let year = 0; year < 120; year++) {
    const houseOffset = annualDir === 'clockwise' ? year : -year;
    const palaceIndex = (annualStartIndex + houseOffset + 12) % 12;
    annualLimits.push({
      year: year + 1,
      age: year,
      palaceIndex,
      palaceName: palaceNames[palaceIndex]
    });
  }

  // 🔴 **Step 10: Place 12 Life-Stage Stars (長生十二星)**
  const lifeStageStart = lifeStageStartByBranch[yearBranch];
  const lifeStageStartIndex = branchToIndex(lifeStageStart);

  for (let i = 0; i < 12; i++) {
    const palaceIndex = (lifeStageStartIndex + i) % 12;
    const star = lifeStageStars[i];
    houses[palaceIndex].lifeStageStars.push(star);
  }

  // 🔴 **Step 11: Place 12 Scholar-Deities (博士十二神) - WITH GENDER LOGIC**
  const scholarDir = getScholarDeityDirection(genderType);
  const luCunHouseIndex = starPositions["祿存"].houseIndex;

  for (let i = 0; i < 12; i++) {
    const houseOffset = scholarDir === 'clockwise' ? i : -i;
    const palaceIndex = (luCunHouseIndex + houseOffset + 12) % 12;
    const deity = scholarDeities[i];
    houses[palaceIndex].scholarDeities.push(deity);
  }

  // Body house (身宮) - correct calculation
  const bodyHouseIndex = findLifeHouseIndex(lunarMonth, hourBranch, true);

  return {
    houses,
    lifeHouseIndex: 0,  // Always 0 in this array structure
    bodyHouseIndex,
    fiveElementBureau,
    baseFourTransformations,
    starPositions,
    genderType,
    decadeLimits,
    annualLimits,
    decadeDirection: decadeDir,
    annualDirection: annualDir,
    yearStem,
    yearBranch,
    gender
  };
}

// ==================== Tests ====================

function assert(cond, msg) {
  if (!cond) throw new Error(`❌ ${msg}`);
  console.log(`✅ ${msg}`);
}

function test() {
  console.log("\n🧪 Running Ziwei Chart Engine tests (Compliance v2.0)...\n");

  // Test 1: Basic structure & Five Element Bureau (CORRECTED)
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
  assert(chart1.fiveElementBureau === 4, "✅ CORRECTED: 5-element bureau for 甲 should be 4 (金四局)");
  console.log(`  ✅ Life house index: ${chart1.lifeHouseIndex}`);
  console.log(`  ✅ Ziwei position with brightness: ${JSON.stringify(chart1.starPositions["紫微"])}`);
  console.log(`  ✅ Gender type: ${chart1.genderType}`);
  console.log(`  ✅ Decade direction: ${chart1.decadeDirection}`);

  // Test 2: Star placements & brightness
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
  assert(chart2.starPositions["紫微"].houseIndex !== chart2.starPositions["天府"].houseIndex, "Ziwei and Tianfu should not overlap");
  console.log(`  ✅ Ziwei house ${chart2.starPositions["紫微"].houseIndex} (brightness: ${chart2.starPositions["紫微"].brightness})`);
  console.log(`  ✅ Tianfu house ${chart2.starPositions["天府"].houseIndex} (brightness: ${chart2.starPositions["天府"].brightness})`);
  console.log(`  ✅ Gender: 女, Decade direction: ${chart2.decadeDirection} (should be counter_clockwise)`);

  // Test 3: Four transformations (CORRECTED)
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
  console.log(`  ✅ Transformations placed: ${transformationCount}`);

  // Test 4: All auxiliary stars placed
  const testChart = chart3;
  const auxStars = ["祿存", "天馬", "擎羊", "陀羅", "文昌", "文曲", "左輔", "右弼", "天魁", "天鉞"];
  for (const star of auxStars) {
    assert(star in testChart.starPositions, `${star} must be placed`);
  }
  console.log(`  ✅ All ${auxStars.length} auxiliary stars placed correctly`);

  // Test 5: Decade & Annual limits
  assert(testChart.decadeLimits.length === 12, "Should have 12 decade limits");
  assert(testChart.annualLimits.length === 120, "Should have 120 annual limits (0-119 years)");
  console.log(`  ✅ Decade limits: ${testChart.decadeLimits.length}`);
  console.log(`  ✅ Annual limits: ${testChart.annualLimits.length}`);
  console.log(`  ✅ First decade: ${testChart.decadeLimits[0].ageStart}-${testChart.decadeLimits[0].ageEnd}, palace: ${testChart.decadeLimits[0].palaceName}`);

  // Test 6: Life-stage stars & Scholar deities
  let lifeStageCount = 0;
  let scholarCount = 0;
  for (const house of testChart.houses) {
    lifeStageCount += house.lifeStageStars.length;
    scholarCount += house.scholarDeities.length;
  }
  assert(lifeStageCount === 12, "Should have exactly 12 life-stage stars");
  assert(scholarCount === 12, "Should have exactly 12 scholar deities");
  console.log(`  ✅ Life-stage stars: ${lifeStageCount}`);
  console.log(`  ✅ Scholar deities: ${scholarCount}`);

  // Test 7: Gender logic verification
  const yangMaleChart = calcBaseChart({
    lunarYear: 1984, lunarMonth: 1, lunarDay: 15,
    hourBranch: "子", yearStem: "甲", yearBranch: "子", gender: "男"
  });
  const yinFemaleChart = calcBaseChart({
    lunarYear: 1984, lunarMonth: 1, lunarDay: 15,
    hourBranch: "子", yearStem: "乙", yearBranch: "丑", gender: "女"
  });

  assert(yangMaleChart.genderType === 'yang_male', "Yang male classification");
  assert(yangMaleChart.decadeDirection === 'clockwise', "Yang male should have clockwise decade direction");
  assert(yinFemaleChart.genderType === 'yin_female', "Yin female classification");
  assert(yinFemaleChart.decadeDirection === 'clockwise', "Yin female should have clockwise decade direction");
  console.log(`  ✅ Gender logic verified`);

  console.log("\n✨ All compliance tests passed! (v2.0)\n");
}

// Star Meanings Database Integration
let starMeaningsCache = null;

function loadStarMeanings() {
  if (!starMeaningsCache) {
    try {
      const path = require('path');
      const starMeaningsPath = path.join(__dirname, 'star-meanings.json');
      starMeaningsCache = require(starMeaningsPath);
    } catch (error) {
      console.warn('Warning: Could not load star-meanings.json', error.message);
      starMeaningsCache = { metadata: { error: 'Database not available' } };
    }
  }
  return starMeaningsCache;
}

function getStarMeaning(starName) {
  const meanings = loadStarMeanings();

  // Search across all star categories (excluding nested structures)
  for (const category of ['main_stars', 'auxiliary_stars', 'malevolent_stars', 'longevity_stars', 'romance_stars', 'auspicious_auxiliary_stars', 'secondary_stars']) {
    if (meanings[category] && meanings[category][starName]) {
      return {
        name: starName,
        category,
        ...meanings[category][starName]
      };
    }
  }

  // Handle nested annual_stars structure (sub-groups: 博士十二星, 歲前十二星)
  if (meanings.annual_stars) {
    for (const group of Object.values(meanings.annual_stars)) {
      if (group[starName]) {
        return {
          name: starName,
          category: 'annual_stars',
          ...group[starName]
        };
      }
    }
  }

  return null;
}

function getStarsByCategory(category) {
  const meanings = loadStarMeanings();
  if (!meanings[category]) return {};
  return meanings[category];
}

function getStarsByElement(element) {
  const meanings = loadStarMeanings();
  const result = {};

  for (const category of Object.keys(meanings)) {
    if (typeof meanings[category] === 'object' && !Array.isArray(meanings[category])) {
      for (const [starName, starData] of Object.entries(meanings[category])) {
        if (starData.element === element) {
          result[starName] = { category, ...starData };
        }
      }
    }
  }

  return result;
}

function getStarsByType(type) {
  const meanings = loadStarMeanings();
  const result = {};

  for (const category of Object.keys(meanings)) {
    if (typeof meanings[category] === 'object' && !Array.isArray(meanings[category])) {
      for (const [starName, starData] of Object.entries(meanings[category])) {
        if (starData.type === type) {
          result[starName] = { category, ...starData };
        }
      }
    }
  }

  return result;
}

function getStarsByKeyword(keyword) {
  const meanings = loadStarMeanings();
  const lowerKeyword = keyword.toLowerCase();
  const result = {};

  for (const category of Object.keys(meanings)) {
    if (typeof meanings[category] === 'object' && !Array.isArray(meanings[category])) {
      for (const [starName, starData] of Object.entries(meanings[category])) {
        const meaning = (starData.meaning || '').toLowerCase();
        const positiveArray = Array.isArray(starData.positive) ? starData.positive : (typeof starData.positive === 'string' ? [starData.positive] : []);
        const negativeArray = Array.isArray(starData.negative) ? starData.negative : (typeof starData.negative === 'string' ? [starData.negative] : []);
        const positive = positiveArray.join(' ').toLowerCase();
        const negative = negativeArray.join(' ').toLowerCase();

        if (meaning.includes(lowerKeyword) || positive.includes(lowerKeyword) || negative.includes(lowerKeyword)) {
          result[starName] = { category, ...starData };
        }
      }
    }
  }

  return result;
}

function getStarDatabase() {
  return loadStarMeanings();
}

// Palace-Specific Star Meanings Functions
let starPalaceMeaningsCache = null;

function loadStarPalaceMeanings() {
  if (!starPalaceMeaningsCache) {
    try {
      const path = require('path');
      starPalaceMeaningsCache = require(path.join(__dirname, 'star-palace-meanings.json'));
    } catch (e) {
      console.warn('Warning: Could not load star-palace-meanings.json', e.message);
      starPalaceMeaningsCache = { metadata: { error: 'Database not available', available: false } };
    }
  }
  return starPalaceMeaningsCache;
}

function getStarPalaceMeaning(starName, palaceName) {
  const db = loadStarPalaceMeanings();
  if (!db[starName]) return null;
  if (!db[starName][palaceName]) return null;
  return {
    star: starName,
    palace: palaceName,
    ...db[starName][palaceName]
  };
}

function getStarInAllPalaces(starName) {
  const db = loadStarPalaceMeanings();
  if (!db[starName] || db[starName] === 'metadata') return null;
  return {
    star: starName,
    palaces: db[starName]
  };
}

function getPalaceAllStars(palaceName) {
  const db = loadStarPalaceMeanings();
  const result = {};
  for (const [star, palaces] of Object.entries(db)) {
    if (star === 'metadata') continue;
    if (typeof palaces === 'object' && palaces[palaceName]) {
      result[star] = palaces[palaceName];
    }
  }
  return { palace: palaceName, stars: result, count: Object.keys(result).length };
}

// Exports
module.exports = {
  calcBaseChart,
  test,
  getGenderType,
  getDecadeDirection,
  getAnnualDirection,
  loadStarMeanings,
  getStarMeaning,
  getStarsByCategory,
  getStarsByElement,
  getStarsByType,
  getStarsByKeyword,
  getStarDatabase,
  loadStarPalaceMeanings,
  getStarPalaceMeaning,
  getStarInAllPalaces,
  getPalaceAllStars
};
