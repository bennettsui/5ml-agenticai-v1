'use client';
import { useState, useMemo } from 'react';
import { BookOpen, ChevronDown, ChevronRight, Search } from 'lucide-react';

// ─── Static curriculum data ───────────────────────────────────────────────────
// Mirrors hk-math-curriculum.json — kept static so no API call needed

interface Objective {
  code: string;
  grade: 'S1' | 'S2' | 'S3';
  subtopic: string;
  name_en: string;
  name_zh: string;
  description_en: string;
  description_zh: string;
  difficulty_range: [number, number];
}

interface Strand {
  id: string;
  name_en: string;
  name_zh: string;
  objectives: Objective[];
}

const CURRICULUM: Strand[] = [
  {
    id: 'NA',
    name_en: 'Number and Algebra',
    name_zh: '數與代數',
    objectives: [
      { code: 'MATH.S1.INT.BASIC', grade: 'S1', subtopic: 'Integers', name_en: 'Integers and Basic Operations', name_zh: '整數與基本運算', description_en: 'Understand integers, their ordering on the number line, and perform addition, subtraction, multiplication and division of integers including negative numbers.', description_zh: '理解整數及其在數線上的排列，能對整數（包括負數）進行加、減、乘、除運算。', difficulty_range: [1, 2] },
      { code: 'MATH.S1.FRACTION.BASIC', grade: 'S1', subtopic: 'Fractions', name_en: 'Fractions — Concepts and Equivalence', name_zh: '分數概念與等值分數', description_en: 'Understand proper/improper fractions and mixed numbers. Simplify fractions and find equivalent fractions.', description_zh: '理解真分數、假分數及帶分數的概念，能化簡分數及求等值分數。', difficulty_range: [1, 2] },
      { code: 'MATH.S1.FRACTION.ADD', grade: 'S1', subtopic: 'Fractions', name_en: 'Addition and Subtraction of Fractions', name_zh: '分數的加法與減法', description_en: 'Add and subtract fractions and mixed numbers with unlike denominators using LCM.', description_zh: '能利用最小公倍數對不同分母的分數及帶分數進行加減運算。', difficulty_range: [2, 3] },
      { code: 'MATH.S1.FRACTION.MULT', grade: 'S1', subtopic: 'Fractions', name_en: 'Multiplication and Division of Fractions', name_zh: '分數的乘法與除法', description_en: 'Multiply and divide fractions and mixed numbers; understand the reciprocal concept.', description_zh: '能對分數及帶分數進行乘除運算，理解倒數概念。', difficulty_range: [2, 3] },
      { code: 'MATH.S1.DECIMAL.OPS', grade: 'S1', subtopic: 'Decimals', name_en: 'Operations on Decimals', name_zh: '小數的運算', description_en: 'Perform addition, subtraction, multiplication and division of decimals; convert between fractions and decimals.', description_zh: '能對小數進行加減乘除運算，並能在分數與小數之間互相換算。', difficulty_range: [1, 3] },
      { code: 'MATH.S1.PERCENT.BASIC', grade: 'S1', subtopic: 'Percentages', name_en: 'Percentages — Concepts and Applications', name_zh: '百分數概念與應用', description_en: 'Convert between percentages, fractions, and decimals. Solve problems involving percentage change, profit, loss, and discount.', description_zh: '能在百分數、分數及小數之間互換。解決涉及百分比變化、利潤、虧損及折扣的問題。', difficulty_range: [2, 4] },
      { code: 'MATH.S1.RATIO.BASIC', grade: 'S1', subtopic: 'Ratio and Rate', name_en: 'Ratio and Rate', name_zh: '比率與速率', description_en: 'Understand ratio and rate. Simplify ratios, divide quantities in a given ratio, and solve speed/distance/time problems.', description_zh: '理解比率與速率的概念，能化簡比率、按比例分配數量，並解決速度/距離/時間問題。', difficulty_range: [2, 4] },
      { code: 'MATH.S1.ALGEBRA.INTRO', grade: 'S1', subtopic: 'Introduction to Algebra', name_en: 'Introduction to Algebra', name_zh: '代數入門', description_en: 'Use letters to represent unknowns. Write, read, and simplify algebraic expressions. Evaluate expressions by substitution.', description_zh: '能以字母代表未知數，撰寫、閱讀及化簡代數式，並以代入法求代數式的值。', difficulty_range: [1, 3] },
      { code: 'MATH.S1.ALGEBRA.EQUATION1', grade: 'S1', subtopic: 'Linear Equations', name_en: 'Linear Equations in One Unknown', name_zh: '一元一次方程', description_en: 'Solve linear equations in one unknown using inverse operations. Formulate and solve equations from word problems.', description_zh: '能用逆運算解一元一次方程，並能從文字題中建立及求解方程。', difficulty_range: [2, 4] },
      { code: 'MATH.S2.ALGEBRA.POLY', grade: 'S2', subtopic: 'Polynomials', name_en: 'Polynomials — Expansion and Factorisation', name_zh: '多項式的展開與因式分解', description_en: 'Expand products of polynomials, factorise using common factors and identities (difference of squares, perfect squares).', description_zh: '能展開多項式的乘積，以公因式及恆等式（平方差、完全平方式）進行因式分解。', difficulty_range: [2, 5] },
      { code: 'MATH.S2.ALGEBRA.EQUATION2', grade: 'S2', subtopic: 'Simultaneous Equations', name_en: 'Simultaneous Linear Equations', name_zh: '聯立一次方程', description_en: 'Solve simultaneous linear equations in two unknowns by substitution and elimination. Apply to real-world problems.', description_zh: '能以代入法及消元法解二元一次聯立方程，並應用於實際問題。', difficulty_range: [3, 5] },
      { code: 'MATH.S2.INEQUAL.BASIC', grade: 'S2', subtopic: 'Inequalities', name_en: 'Linear Inequalities in One Unknown', name_zh: '一元一次不等式', description_en: 'Understand inequality symbols. Solve linear inequalities in one unknown and represent solutions on a number line.', description_zh: '理解不等號，解一元一次不等式，並在數線上表示解集。', difficulty_range: [2, 4] },
      { code: 'MATH.S3.NUMBER.RATIONAL', grade: 'S3', subtopic: 'Rational & Irrational Numbers', name_en: 'Rational and Irrational Numbers', name_zh: '有理數與無理數', description_en: 'Distinguish between rational and irrational numbers. Understand surds; simplify and operate on surds.', description_zh: '區分有理數與無理數，理解根式，能化簡及運算根式。', difficulty_range: [2, 4] },
      { code: 'MATH.S3.ALGEBRA.QUADRATIC', grade: 'S3', subtopic: 'Quadratic Equations', name_en: 'Quadratic Equations in One Unknown', name_zh: '一元二次方程', description_en: 'Solve quadratic equations by factorisation, completing the square, and the quadratic formula. Determine the nature of roots using the discriminant.', description_zh: '以因式分解、配方法及求根公式解一元二次方程，利用判別式判斷根的性質。', difficulty_range: [3, 5] },
      { code: 'MATH.S3.ALGEBRA.FUNCTIONS', grade: 'S3', subtopic: 'Functions and Graphs', name_en: 'Functions and their Graphs', name_zh: '函數及其圖形', description_en: 'Understand the concept of a function. Sketch graphs of linear and quadratic functions; identify key features (vertex, axis of symmetry, intercepts).', description_zh: '理解函數的概念，繪製一次及二次函數的圖形，識別頂點、對稱軸及截距等特徵。', difficulty_range: [3, 5] },
      { code: 'MATH.S3.ALGEBRA.FRACTIONS', grade: 'S3', subtopic: 'Algebraic Fractions', name_en: 'Algebraic Fractions and Equations', name_zh: '代數分式與方程', description_en: 'Simplify algebraic fractions. Add, subtract, multiply, and divide algebraic fractions. Solve fractional equations.', description_zh: '化簡代數分式，對代數分式進行加減乘除，解分式方程並檢驗外來根。', difficulty_range: [3, 5] },
      { code: 'MATH.S3.PERCENT.ADVANCED', grade: 'S3', subtopic: 'Percentages', name_en: 'Compound Interest and Financial Mathematics', name_zh: '複利息與金融數學', description_en: 'Apply compound interest formula A = P(1 + r)ⁿ. Solve problems involving hire purchase, taxation, and foreign exchange.', description_zh: '應用複利息公式 A = P(1 + r)ⁿ，解決分期付款、稅務及外幣兌換等問題。', difficulty_range: [3, 5] },
    ],
  },
  {
    id: 'MG',
    name_en: 'Measures, Shape and Space',
    name_zh: '度量、圖形與空間',
    objectives: [
      { code: 'MATH.S1.MEASURE.PERIMETER', grade: 'S1', subtopic: 'Perimeter and Area', name_en: 'Perimeter and Area of Plane Figures', name_zh: '平面圖形的周界與面積', description_en: 'Find perimeter and area of triangles, quadrilaterals, and composite figures. Use appropriate units.', description_zh: '能求三角形、四邊形及複合圖形的周界與面積，並使用適當的單位。', difficulty_range: [1, 3] },
      { code: 'MATH.S1.MEASURE.CIRCLE', grade: 'S1', subtopic: 'Circles', name_en: 'Circumference and Area of a Circle', name_zh: '圓的周長與面積', description_en: 'Understand pi. Calculate circumference and area of circles and sectors. Solve problems involving circular shapes.', description_zh: '理解圓周率π，計算圓和扇形的周長與面積，解決涉及圓形的問題。', difficulty_range: [2, 3] },
      { code: 'MATH.S1.GEOM.ANGLES', grade: 'S1', subtopic: 'Angles and Lines', name_en: 'Angles and Parallel Lines', name_zh: '角與平行線', description_en: 'Identify types of angles. Understand properties of parallel lines: corresponding, alternate, and co-interior angles.', description_zh: '識別各種角的類型，理解平行線的性質：同位角、交錯角及同旁內角。', difficulty_range: [2, 3] },
      { code: 'MATH.S1.GEOM.TRIANGLE', grade: 'S1', subtopic: 'Triangles', name_en: 'Properties of Triangles', name_zh: '三角形的性質', description_en: 'Identify types of triangles. Apply angle sum and exterior angle theorem. Understand congruence and similarity criteria.', description_zh: '識別各類三角形，應用角和定理及外角定理，理解全等與相似的判別條件。', difficulty_range: [2, 4] },
      { code: 'MATH.S2.GEOM.QUADRILATERAL', grade: 'S2', subtopic: 'Quadrilaterals', name_en: 'Properties of Quadrilaterals', name_zh: '四邊形的性質', description_en: 'Identify and apply properties of parallelograms, rectangles, rhombuses, squares, and trapezoids.', description_zh: '識別並應用平行四邊形、長方形、菱形、正方形及梯形的性質。', difficulty_range: [2, 4] },
      { code: 'MATH.S2.GEOM.3D', grade: 'S2', subtopic: '3D Figures', name_en: 'Volume and Surface Area of 3D Figures', name_zh: '立體圖形的體積與表面積', description_en: 'Calculate volume and surface area of prisms, cylinders, pyramids, cones, and spheres.', description_zh: '計算棱柱、圓柱、棱錐、圓錐及球的體積與表面積。', difficulty_range: [3, 5] },
      { code: 'MATH.S2.COORD.BASIC', grade: 'S2', subtopic: 'Coordinate Geometry', name_en: 'Introduction to Coordinate Geometry', name_zh: '坐標幾何入門', description_en: 'Plot points in the Cartesian plane. Find distance and midpoint between two points. Understand slope of a line.', description_zh: '在笛卡兒坐標平面上描點，求兩點間的距離與中點，理解直線的斜率。', difficulty_range: [2, 4] },
      { code: 'MATH.S3.GEOM.PYTHAGORAS', grade: 'S3', subtopic: "Pythagoras' Theorem", name_en: "Pythagoras' Theorem", name_zh: '畢氏定理', description_en: "Understand and apply Pythagoras' theorem to find unknown sides in right-angled triangles. Apply to 2D and 3D problems.", description_zh: '理解並應用畢氏定理求直角三角形的未知邊長，應用於二維及三維問題。', difficulty_range: [2, 4] },
      { code: 'MATH.S3.TRIG.BASIC', grade: 'S3', subtopic: 'Trigonometry', name_en: 'Trigonometric Ratios', name_zh: '三角比', description_en: 'Define sine, cosine, and tangent (SOH-CAH-TOA). Find trig ratios for special angles (30°, 45°, 60°). Solve right-angled triangles.', description_zh: '定義正弦、餘弦和正切（SOH-CAH-TOA），求特殊角的三角比，用三角比解直角三角形問題。', difficulty_range: [3, 5] },
      { code: 'MATH.S3.TRIG.APPLICATIONS', grade: 'S3', subtopic: 'Trigonometry', name_en: 'Applications of Trigonometry', name_zh: '三角學的應用', description_en: 'Apply trigonometry to angles of elevation and depression. Solve bearings and 3D trigonometry problems.', description_zh: '應用三角學解仰角與俯角的問題，解方位角及三維三角學問題。', difficulty_range: [3, 5] },
      { code: 'MATH.S3.GEOM.CIRCLES', grade: 'S3', subtopic: 'Circles', name_en: 'Properties of Circles', name_zh: '圓的性質', description_en: 'Apply circle theorems: angle at centre, angle in semicircle, angles in the same segment, cyclic quadrilaterals. Understand tangent properties.', description_zh: '應用圓的定理：圓心角、半圓上的圓周角、同弓形上的圓周角、圓內接四邊形，理解切線的性質。', difficulty_range: [3, 5] },
      { code: 'MATH.S3.COORD.LINES', grade: 'S3', subtopic: 'Coordinate Geometry', name_en: 'Equations of Straight Lines', name_zh: '直線方程', description_en: 'Write equations of straight lines in slope-intercept and general form. Find intersections. Understand parallel and perpendicular conditions.', description_zh: '以斜截式及一般式表達直線方程，求直線的交點，理解平行線及垂直線的條件。', difficulty_range: [3, 5] },
    ],
  },
  {
    id: 'DS',
    name_en: 'Data Handling',
    name_zh: '數據處理',
    objectives: [
      { code: 'MATH.S1.DATA.BASIC', grade: 'S1', subtopic: 'Statistical Diagrams', name_en: 'Statistical Diagrams and Tables', name_zh: '統計圖表', description_en: 'Construct and interpret bar charts, pie charts, broken-line graphs, and frequency tables.', description_zh: '能繪製及詮釋棒形圖、餅圖、折線圖及頻數分佈表。', difficulty_range: [1, 3] },
      { code: 'MATH.S1.DATA.AVERAGE', grade: 'S1', subtopic: 'Averages', name_en: 'Measures of Central Tendency', name_zh: '集中趨勢的量度', description_en: 'Calculate and interpret mean, median, and mode. Understand when each measure is appropriate.', description_zh: '計算及詮釋平均數、中位數和眾數，並理解各量度的適用情況。', difficulty_range: [1, 3] },
      { code: 'MATH.S2.PROB.BASIC', grade: 'S2', subtopic: 'Probability', name_en: 'Introduction to Probability', name_zh: '概率入門', description_en: 'Understand probability as a measure of likelihood (0 to 1). List sample spaces, calculate simple and complementary probabilities.', description_zh: '理解概率作為可能性的量度（0至1），列出樣本空間，計算簡單及互補概率。', difficulty_range: [2, 4] },
      { code: 'MATH.S3.DATA.DISPERSION', grade: 'S3', subtopic: 'Measures of Dispersion', name_en: 'Measures of Dispersion', name_zh: '離差的量度', description_en: 'Calculate range, inter-quartile range, and standard deviation. Interpret and compare data sets using box-and-whisker plots.', description_zh: '計算全距、四分位距及標準差，用箱線圖詮釋及比較數據集的分散程度。', difficulty_range: [3, 5] },
      { code: 'MATH.S3.PROB.ADVANCED', grade: 'S3', subtopic: 'Probability', name_en: 'Advanced Probability', name_zh: '進階概率', description_en: 'Calculate probabilities of mutually exclusive and independent events. Understand conditional probability. Use tree diagrams.', description_zh: '計算互斥及獨立事件的概率，理解條件概率，運用樹形圖及列表法。', difficulty_range: [3, 5] },
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const GRADE_COLORS: Record<string, string> = {
  S1: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
  S2: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
  S3: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
};

function DifficultyDots({ range }: { range: [number, number] }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(d => (
        <div key={d} className={`w-1.5 h-1.5 rounded-full ${
          d <= range[1] ? (d <= range[0] ? 'bg-purple-400' : 'bg-purple-400/30') : 'bg-slate-700'
        }`} />
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SyllabusPage() {
  const [gradeFilter, setGradeFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [expandedStrand, setExpandedStrand] = useState<string | null>('NA');
  const [expandedObj, setExpandedObj] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return CURRICULUM.map(strand => ({
      ...strand,
      objectives: strand.objectives.filter(obj => {
        const gradeOk = gradeFilter === 'ALL' || obj.grade === gradeFilter;
        const searchOk = !q || obj.name_en.toLowerCase().includes(q) ||
          obj.name_zh.includes(q) || obj.subtopic.toLowerCase().includes(q) ||
          obj.description_en.toLowerCase().includes(q) || obj.code.toLowerCase().includes(q);
        return gradeOk && searchOk;
      }),
    })).filter(strand => strand.objectives.length > 0);
  }, [gradeFilter, search]);

  const totalVisible = filtered.reduce((s, st) => s + st.objectives.length, 0);
  const totalAll = CURRICULUM.reduce((s, st) => s + st.objectives.length, 0);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">S1–S3 Mathematics Syllabus</h1>
        <p className="text-slate-400 text-sm mt-0.5">
          HK EDB Junior Secondary Curriculum · {totalAll} learning objectives
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5 bg-slate-800/60 border border-slate-700/50 rounded-xl px-3 py-2">
          <Search className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search objectives…"
            className="bg-transparent text-sm text-white placeholder-slate-600 outline-none w-44"
          />
        </div>
        <div className="flex items-center gap-1">
          {['ALL', 'S1', 'S2', 'S3'].map(g => (
            <button
              key={g}
              onClick={() => setGradeFilter(g)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                gradeFilter === g
                  ? 'bg-purple-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
        {(search || gradeFilter !== 'ALL') && (
          <span className="text-xs text-slate-500">{totalVisible} shown</span>
        )}
      </div>

      {/* Strands */}
      <div className="space-y-3">
        {filtered.map(strand => {
          const strandOpen = expandedStrand === strand.id;
          return (
            <div key={strand.id} className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden">
              {/* Strand header */}
              <button
                onClick={() => setExpandedStrand(strandOpen ? null : strand.id)}
                className="w-full flex items-center gap-3 px-5 py-4 hover:bg-white/[0.02] transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-purple-600/15 border border-purple-500/20 flex items-center justify-center shrink-0">
                  <BookOpen className="w-4 h-4 text-purple-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white">{strand.name_en}</p>
                  <p className="text-xs text-slate-400">{strand.name_zh} · {strand.objectives.length} objectives</p>
                </div>
                {strandOpen
                  ? <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
                  : <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
                }
              </button>

              {/* Objectives */}
              {strandOpen && (
                <div className="border-t border-slate-700/30 divide-y divide-slate-700/20">
                  {strand.objectives.map(obj => {
                    const objOpen = expandedObj === obj.code;
                    return (
                      <div key={obj.code}>
                        <button
                          onClick={() => setExpandedObj(objOpen ? null : obj.code)}
                          className="w-full flex items-center gap-3 px-5 py-3 hover:bg-white/[0.02] transition-colors text-left"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`text-[10px] font-medium border rounded-full px-2 py-0.5 shrink-0 ${GRADE_COLORS[obj.grade]}`}>
                                {obj.grade}
                              </span>
                              <span className="text-xs text-slate-500 shrink-0">{obj.subtopic}</span>
                              <p className="text-sm text-white font-medium">{obj.name_en}</p>
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5">{obj.name_zh}</p>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <DifficultyDots range={obj.difficulty_range} />
                            {objOpen
                              ? <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                              : <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                            }
                          </div>
                        </button>

                        {objOpen && (
                          <div className="px-5 pb-4 bg-white/[0.02]">
                            <div className="flex items-center gap-3 mb-2 text-[10px] text-slate-500">
                              <span className="font-mono">{obj.code}</span>
                              <span>Difficulty {obj.difficulty_range[0]}–{obj.difficulty_range[1]}/5</span>
                            </div>
                            <p className="text-xs text-slate-300 leading-relaxed">{obj.description_en}</p>
                            <p className="text-xs text-slate-500 leading-relaxed mt-1.5">{obj.description_zh}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            <BookOpen className="w-8 h-8 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No objectives match your search.</p>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 pt-2 border-t border-slate-800/60 text-xs text-slate-500">
        <span className="font-medium text-slate-400">Grade:</span>
        {(['S1', 'S2', 'S3'] as const).map(g => (
          <span key={g} className={`border rounded-full px-2 py-0.5 ${GRADE_COLORS[g]}`}>{g}</span>
        ))}
        <span className="font-medium text-slate-400 ml-2">Difficulty:</span>
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
          <span>core range</span>
          <div className="w-1.5 h-1.5 rounded-full bg-purple-400/30 ml-1" />
          <span>extended</span>
        </div>
      </div>
    </div>
  );
}
