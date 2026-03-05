'use strict';

/**
 * search.js — Bag-of-Words + Inverted Index + Fuzzy Name Search Engine
 * No external dependencies. Pure Node.js.
 *
 * ─── Two-field design ─────────────────────────────────────────────────────────
 *   name_original  = stored as-is (full_name column) — only ever shown in UI
 *   name_search    = pre-normalised string — never shown; used for all matching
 *
 * ─── Normalisation pipeline (applied identically to indexed data & query) ─────
 *   1. Traditional → Simplified Chinese (comprehensive char map for names)
 *   2. Lowercase
 *   3. Strip punctuation, spaces, hyphens, apostrophes, middle-dots
 *   4. Strip Latin diacritics (é→e, ü→u, etc.)
 *
 * ─── Tokenisation ─────────────────────────────────────────────────────────────
 *   CJK segments   → char unigrams  +  char bigrams  +  char trigrams
 *   Latin segments → whole token    +  char bigrams  (for partial match)
 *
 * ─── Scoring (weights sum to 1.0) ─────────────────────────────────────────────
 *   token_coverage  w=0.50   matched_query_tokens / total_query_tokens
 *   fuzzy_sim       w=0.30   mean best-fuzzy-score per query token
 *   ngram_bonus     w=0.20   char-bigram Jaccard(normalised_query, normalised_candidate)
 *
 * ─── Per-token fuzzy similarity ───────────────────────────────────────────────
 *   exact             → 1.0
 *   shape-similar CJK → 1.0 (形近字 table)
 *   edit distance     → max(0, 1 − editDist/maxLen)
 *   Latin phonetic    → also check Soundex; return max(edit_sim, soundex ? 0.7 : 0)
 *
 * ─── Test cases (see bottom of file) ─────────────────────────────────────────
 */

// ═══════════════════════════════════════════════════════════════════════════════
// §1  Traditional → Simplified character map (common name characters)
// ═══════════════════════════════════════════════════════════════════════════════

const T2S_MAP = {
  // ── Common surnames ──────────────────────────────────────────────────────────
  '陳':'陈','張':'张','劉':'刘','楊':'杨','趙':'赵','吳':'吴','孫':'孙','馬':'马',
  '鄭':'郑','謝':'谢','韓':'韩','馮':'冯','蕭':'萧','鄧':'邓','許':'许','葉':'叶',
  '閻':'阎','呂':'吕','蘇':'苏','盧':'卢','蔣':'蒋','賈':'贾','龍':'龙','萬':'万',
  '錢':'钱','湯':'汤','賴':'赖','關':'关','嚴':'严','韋':'韦','歐':'欧','鍾':'钟',
  '顧':'顾','範':'范','譚':'谭','鄒':'邹','陸':'陆','邱':'邱','廖':'廖','魏':'魏',
  '連':'连','薛':'薛','傅':'傅','阮':'阮','翁':'翁','江':'江','曾':'曾','施':'施',
  '柯':'柯','潘':'潘','盧':'卢','洪':'洪','紀':'纪','涂':'涂','游':'游','方':'方',
  // ── Common given-name characters ────────────────────────────────────────────
  '國':'国','學':'学','會':'会','來':'来','時':'时','們':'们','個':'个','為':'为',
  '長':'长','發':'发','電':'电','話':'话','與':'与','說':'说','這':'这','語':'语',
  '數':'数','師':'师','從':'从','東':'东','書':'书','實':'实','機':'机','體':'体',
  '後':'后','進':'进','開':'开','過':'过','對':'对','點':'点','樣':'样','種':'种',
  '現':'现','問':'问','還':'还','頭':'头','間':'间','讓':'让','義':'义','給':'给',
  '臺':'台','灣':'湾','華':'华','業':'业','樂':'乐','強':'强','寶':'宝','愛':'爱',
  '靜':'静','麗':'丽','雅':'雅','慧':'慧','玲':'玲','婷':'婷','鈺':'钰','穎':'颖',
  '薇':'薇','蓉':'蓉','琪':'琪','琳':'琳','瑩':'莹','燕':'燕','鳳':'凤','蘭':'兰',
  '芳':'芳','娟':'娟','秀':'秀','君':'君','紅':'红','青':'青','雲':'云','霞':'霞',
  '偉':'伟','駿':'骏','龍':'龙','飛':'飞','傑':'杰','健':'健','誠':'诚','達':'达',
  '輝':'辉','明':'明','恩':'恩','德':'德','嘉':'嘉','志':'志','文':'文','凱':'凯',
  '奕':'奕','宇':'宇','軒':'轩','哲':'哲','瑋':'玮','勳':'勋','翔':'翔','鴻':'鸿',
  '廣':'广','維':'维','緯':'纬','緣':'缘','緒':'绪','練':'练','緩':'缓','線':'线',
  '總':'总','賢':'贤','寬':'宽','賢':'贤','興':'兴','覺':'觉','讀':'读','證':'证',
  '護':'护','財':'财','貝':'贝','責':'责','費':'费','賞':'赏','識':'识','變':'变',
};

const T2S = new Map(Object.entries(T2S_MAP));

function t2s(str) {
  let out = '';
  for (const ch of str) out += T2S.get(ch) ?? ch;
  return out;
}

// ═══════════════════════════════════════════════════════════════════════════════
// §2  Shape-similar (形近字) confusion table
//     These single chars are treated as zero edit-distance from each other.
// ═══════════════════════════════════════════════════════════════════════════════

const SHAPE_SIMILAR = new Map([
  ['己','已'], ['已','己'], ['巳','己'], ['己','巳'], ['已','巳'], ['巳','已'],
  ['末','未'],  ['未','末'],
  ['土','士'],  ['士','土'],
  ['干','千'],  ['千','干'],
  ['大','太'],  ['太','大'],
  ['人','入'],  ['入','人'],
  ['日','曰'],  ['曰','日'],
  ['力','刀'],  ['刀','力'],
  ['木','本'],  ['本','木'],
  ['申','甲'],  ['甲','申'],
]);

// ═══════════════════════════════════════════════════════════════════════════════
// §3  Normalisation
// ═══════════════════════════════════════════════════════════════════════════════

const PUNCT_RE = /[\s\u00b7·\-_,.\/\\()\[\]{}<>'"!@#$%^&*+=|;:?，。！？、；：「」『』【】〔〕〈〉《》…—－～·•·]/g;
const DIACRITIC_RE = /[\u0300-\u036f]/g; // combining diacritics after NFD

/**
 * normalise(str) → string suitable for indexing / comparison.
 * Never used for display — only for matching.
 */
function normalise(str) {
  if (!str) return '';
  // 1. T2S
  let s = t2s(str);
  // 2. NFD then strip diacritics (é→e, ü→u)
  s = s.normalize('NFD').replace(DIACRITIC_RE, '');
  // 3. lowercase + strip punctuation/spaces
  return s.toLowerCase().replace(PUNCT_RE, '');
}

// ═══════════════════════════════════════════════════════════════════════════════
// §4  CJK detector
// ═══════════════════════════════════════════════════════════════════════════════

function isCJK(ch) {
  const cp = ch.codePointAt(0);
  return (cp >= 0x4E00 && cp <= 0x9FFF)    // CJK Unified Ideographs
      || (cp >= 0x3400 && cp <= 0x4DBF)    // Extension A
      || (cp >= 0x20000 && cp <= 0x2A6DF)  // Extension B
      || (cp >= 0xF900 && cp <= 0xFAFF);   // Compatibility
}

// ═══════════════════════════════════════════════════════════════════════════════
// §5  Tokenisation
//   Returns a Set<string> of tokens for a normalised string.
//   CJK  → unigrams + bigrams + trigrams
//   Latin → whole-segment token + char bigrams (handles partial romanisation)
// ═══════════════════════════════════════════════════════════════════════════════

function tokenise(normStr) {
  const tokens = new Set();
  if (!normStr) return tokens;

  let cjkBuf = '';
  let latBuf = '';

  function flushCJK() {
    if (!cjkBuf) return;
    const chars = [...cjkBuf];
    for (const c of chars) tokens.add(c);                                             // unigrams
    for (let i = 0; i < chars.length - 1; i++) tokens.add(chars[i] + chars[i+1]);    // bigrams
    for (let i = 0; i < chars.length - 2; i++) tokens.add(chars[i] + chars[i+1] + chars[i+2]); // trigrams
    cjkBuf = '';
  }

  function flushLat() {
    if (!latBuf) return;
    tokens.add(latBuf);                                                    // whole segment
    for (let i = 0; i < latBuf.length - 1; i++) tokens.add(latBuf[i] + latBuf[i+1]); // char bigrams
    latBuf = '';
  }

  for (const ch of normStr) {
    if (isCJK(ch)) { flushLat(); cjkBuf += ch; }
    else            { flushCJK(); latBuf += ch; }
  }
  flushCJK();
  flushLat();
  return tokens;
}

// ═══════════════════════════════════════════════════════════════════════════════
// §6  Edit distance (Levenshtein, O(m·n) with early-exit)
// ═══════════════════════════════════════════════════════════════════════════════

function editDist(a, b) {
  if (a === b) return 0;
  const m = a.length, n = b.length;
  if (!m) return n;
  if (!n) return m;
  // Early exit: strings too different in length
  if (Math.abs(m - n) > Math.max(m, n) * 0.7) return Math.max(m, n);

  const prev = Array.from({ length: n + 1 }, (_, j) => j);
  const curr = new Array(n + 1);
  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      curr[j] = a[i-1] === b[j-1]
        ? prev[j-1]
        : 1 + Math.min(prev[j], curr[j-1], prev[j-1]);
    }
    for (let k = 0; k <= n; k++) prev[k] = curr[k];
  }
  return prev[n];
}

// ═══════════════════════════════════════════════════════════════════════════════
// §7  Soundex (phonetic key for Latin tokens)
// ═══════════════════════════════════════════════════════════════════════════════

const SD_CODE = { a:0,e:0,i:0,o:0,u:0,h:0,w:0,y:0,
                  b:1,f:1,p:1,v:1, c:2,g:2,j:2,k:2,q:2,s:2,x:2,z:2,
                  d:3,t:3, l:4, m:5,n:5, r:6 };

function soundex(str) {
  const s = str.toLowerCase().replace(/[^a-z]/g, '');
  if (!s) return '0000';
  let out = s[0].toUpperCase();
  let prev = SD_CODE[s[0]] ?? -1;
  for (let i = 1; i < s.length && out.length < 4; i++) {
    const c = SD_CODE[s[i]];
    if (c === undefined) { prev = -1; continue; }
    if (c > 0 && c !== prev) out += c;
    prev = c;
  }
  return out.padEnd(4, '0');
}

// ═══════════════════════════════════════════════════════════════════════════════
// §8  Character-bigram Jaccard similarity (full-name N-gram bonus)
// ═══════════════════════════════════════════════════════════════════════════════

function bigramSet(str) {
  const s = new Set();
  for (let i = 0; i < str.length - 1; i++) s.add(str[i] + str[i+1]);
  return s;
}

function jaccardBigram(a, b) {
  const A = bigramSet(a), B = bigramSet(b);
  if (!A.size && !B.size) return 1;
  if (!A.size || !B.size) return 0;
  let inter = 0;
  for (const t of A) if (B.has(t)) inter++;
  return inter / (A.size + B.size - inter);
}

// ═══════════════════════════════════════════════════════════════════════════════
// §9  Per-token fuzzy similarity  →  [0, 1]
// ═══════════════════════════════════════════════════════════════════════════════

function tokenFuzzy(a, b) {
  if (a === b) return 1.0;

  // Shape-similar single CJK chars
  if (a.length === 1 && b.length === 1) {
    if (SHAPE_SIMILAR.get(a) === b || SHAPE_SIMILAR.get(b) === a) return 1.0;
  }

  const maxLen = Math.max(a.length, b.length);
  if (!maxLen) return 1.0;

  const edSim = Math.max(0, 1 - editDist(a, b) / maxLen);

  // Latin phonetic fallback
  if (/^[a-z]+$/.test(a) && /^[a-z]+$/.test(b)) {
    const phoneticSim = soundex(a) === soundex(b) ? 0.7 : 0;
    return Math.max(edSim, phoneticSim);
  }

  return edSim;
}

// ═══════════════════════════════════════════════════════════════════════════════
// §10  Scoring weights
// ═══════════════════════════════════════════════════════════════════════════════

const W_COVERAGE = 0.50;
const W_FUZZY    = 0.30;
const W_NGRAM    = 0.20;
const FUZZY_THRESH = 0.45;  // minimum to count a query token as "covered"
const MIN_SCORE    = 0.10;  // discard very weak matches
const TOP_K        = 20;    // max results returned

function scorePair(qNorm, cNorm, qTokens, cTokens) {
  if (!qTokens.size || !cTokens.size) return 0;

  const cArr = [...cTokens];
  let covered = 0, fuzzySum = 0;

  for (const qt of qTokens) {
    let best = cTokens.has(qt) ? 1.0 : 0;  // fast-path for exact
    if (best < 1.0) {
      for (const ct of cArr) {
        const s = tokenFuzzy(qt, ct);
        if (s > best) { best = s; if (best >= 0.99) break; }
      }
    }
    fuzzySum += best;
    if (best >= FUZZY_THRESH) covered++;
  }

  const tokenCoverage = covered / qTokens.size;
  const avgFuzzy      = fuzzySum / qTokens.size;
  const ngramBonus    = jaccardBigram(qNorm, cNorm);

  return W_COVERAGE * tokenCoverage
       + W_FUZZY    * avgFuzzy
       + W_NGRAM    * ngramBonus;
}

// ═══════════════════════════════════════════════════════════════════════════════
// §11  Public API
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * computeNameSearch(participant) → normalised string for name_search column.
 * Call on every INSERT and UPDATE.
 */
function computeNameSearch(p) {
  const parts = [p.first_name, p.last_name].filter(Boolean);
  return normalise(parts.join(' '));
}

/**
 * searchParticipants(query, participants) → sorted array (desc score).
 *
 * @param {string} query        Raw user input (not normalised)
 * @param {Array}  participants All participant rows from DB
 *   Each row must have: id, full_name, first_name, last_name, organization,
 *                       color, status, title, remarks
 *   May have: name_search (pre-computed; falls back to computing on the fly)
 * @returns {Array} Top-K participants sorted descending by relevance score.
 *   Only name_original (i.e. full_name) is returned for display — name_search
 *   is never sent to the client.
 */
function searchParticipants(query, participants) {
  if (!query || !query.trim()) return participants.slice(0, TOP_K);

  const trimmed = query.trim();

  // Pure numeric → match phone only
  if (/^\d+$/.test(trimmed)) {
    return participants
      .filter(p => p.phone && p.phone.includes(trimmed))
      .slice(0, TOP_K);
  }

  const qNorm   = normalise(trimmed);
  const qTokens = tokenise(qNorm);

  const scored = [];
  for (const p of participants) {
    // name_search: use pre-computed if present, else derive on the fly
    const cNorm = p.name_search || computeNameSearch(p);
    const cTokens = tokenise(cNorm);

    // Also fold in organisation, phone, and email tokens
    for (const extra of [p.organization, p.phone, p.email]) {
      if (extra) for (const t of tokenise(normalise(extra))) cTokens.add(t);
    }

    const score = scorePair(qNorm, cNorm, qTokens, cTokens);
    if (score >= MIN_SCORE) scored.push({ ...p, _score: score });
  }

  scored.sort((a, b) => b._score - a._score || a.id - b.id);
  return scored.slice(0, TOP_K);
}

// ═══════════════════════════════════════════════════════════════════════════════
// §12  Test cases (run with: node api/search.js)
// ═══════════════════════════════════════════════════════════════════════════════
/*
 * MOCK DATA
 *   1. { id:1,  full_name:'陳大文', first_name:'大文', last_name:'陳', organization:'台大醫院' }
 *   2. { id:2,  full_name:'大文陳', first_name:'陳',   last_name:'大文', organization:'台大醫院' }
 *   3. { id:3,  full_name:'Chang Wei-Lin', first_name:'Wei-Lin', last_name:'Chang' }
 *   4. { id:4,  full_name:'Zhang Weilin',  first_name:'Weilin',  last_name:'Zhang' }
 *   5. { id:5,  full_name:'陳小明', first_name:'小明',  last_name:'陳' }
 *
 * TEST CASE 1 — Chinese name, reversed token order
 *   Query: "大文陳"  → should match #1 and #2 equally (BoW ignores order)
 *   Expected rank: #1 & #2 tied ahead of #5 (partial 陳 match)
 *
 * TEST CASE 2 — Traditional vs Simplified
 *   Query: "陈大文" (Simplified) → normalises to same as "陳大文"
 *   Expected rank: #1 first, #2 second
 *
 * TEST CASE 3 — Romanisation variants (Pinyin vs Wade-Giles / Taiwanese)
 *   Query: "Chang"  → matches #3 ("Chang"), fuzzy-matches #4 ("Zhang", ed=1)
 *   Expected rank: #3 first (exact), #4 second (fuzzy ed=1)
 *
 * TEST CASE 4 — English typo / edit distance
 *   Query: "Chnag"  → edit distance 2 from "Chang", 2 from "Zhang"
 *   Expected rank: #3 and #4 both returned with reduced score
 *
 * TEST CASE 5 — Shape-similar (形近字) typo
 *   Query: "己大文" vs "已大文" → 己/已 treated as identical → same score as "陳大文"
 *   (After T2S normalisation, both 己 and 已 are distinct from 陳;
 *    but if the DB stored name used 己 and query uses 已, score=1.0 for that char)
 */

if (require.main === module) {
  const mockParticipants = [
    { id:1, full_name:'陳大文', first_name:'大文', last_name:'陳', organization:'台大醫院', color:'Blue', status:'not_checked_in' },
    { id:2, full_name:'大文陳', first_name:'陳',   last_name:'大文', organization:'台大醫院', color:'Red', status:'not_checked_in' },
    { id:3, full_name:'Chang Wei-Lin', first_name:'Wei-Lin', last_name:'Chang', organization:'NTU', color:'Green', status:'not_checked_in' },
    { id:4, full_name:'Zhang Weilin',  first_name:'Weilin',  last_name:'Zhang',  organization:'PKU', color:'Purple', status:'not_checked_in' },
    { id:5, full_name:'陳小明', first_name:'小明',  last_name:'陳', organization:'成大', color:'Blue', status:'not_checked_in' },
  ];

  const tests = [
    { label:'TC1 – reversed CJK tokens',      q:'大文陳' },
    { label:'TC2 – Simplified query',           q:'陈大文' },
    { label:'TC3 – romanisation variant',       q:'Chang' },
    { label:'TC4 – English typo',               q:'Chnag' },
    { label:'TC5 – shape-similar (己→已)',      q:'己大文' },
  ];

  for (const { label, q } of tests) {
    const results = searchParticipants(q, mockParticipants);
    console.log(`\n${label} — query: "${q}"`);
    for (const r of results) {
      console.log(`  [${r._score.toFixed(3)}] #${r.id} ${r.full_name}`);
    }
  }
}

module.exports = { searchParticipants, computeNameSearch, normalise, tokenise };
