'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

// ── Types matching Python format_chart_output ─────────────────────────────
interface PalaceData {
  palace_id:       number;
  palace_name:     string;
  branch:          string;
  stem:            string;
  stem_branch:     string;
  major_stars:     string[];
  transformations: Record<string, string>; // { starName: "hua_lu" | ... }
}

interface BaseChart {
  birth: {
    year_stem:   string;
    year_branch: string;
    lunar_month: number;
    lunar_day:   number;
    hour_branch: string;
    gender:      string;
    name:        string;
    location?:   string;
  };
  life_palace: {
    branch:      string;
    stem:        string;
    stem_branch: string;
  };
  five_element_bureau: number;
  four_transformations: Record<string, string>; // { hua_lu: starName, hua_quan: starName, ... }
  palaces: PalaceData[];
}

interface Props {
  baseChart: BaseChart;
}

// ── Constants from the algorithm knowledge base ───────────────────────────
// Bureau labels (五行局)
const BUREAU_LABEL: Record<number, string> = {
  2: '水二局', 3: '木三局', 4: '金四局', 5: '土五局', 6: '火六局',
};

// 納音五行 nayin mapping for each stem-branch combination
// Source: traditional 五行局 calculation from 命宮 stem-branch nayin
const NAYIN_BUREAU: Record<string, string> = {
  甲子: '海中金', 乙丑: '海中金',
  丙寅: '爐中火', 丁卯: '爐中火',
  戊辰: '大林木', 己巳: '大林木',
  庚午: '路旁土', 辛未: '路旁土',
  壬申: '劍鋒金', 癸酉: '劍鋒金',
  甲戌: '山頭火', 乙亥: '山頭火',
  丙子: '澗下水', 丁丑: '澗下水',
  戊寅: '城頭土', 己卯: '城頭土',
  庚辰: '白蠟金', 辛巳: '白蠟金',
  壬午: '楊柳木', 癸未: '楊柳木',
  甲申: '泉中水', 乙酉: '泉中水',
  丙戌: '屋上土', 丁亥: '屋上土',
  戊子: '霹靂火', 己丑: '霹靂火',
  庚寅: '松柏木', 辛卯: '松柏木',
  壬辰: '長流水', 癸巳: '長流水',
  甲午: '沙中金', 乙未: '沙中金',
  丙申: '山下火', 丁酉: '山下火',
  戊戌: '平地木', 己亥: '平地木',
  庚子: '壁上土', 辛丑: '壁上土',
  壬寅: '金箔金', 癸卯: '金箔金',
  甲辰: '覆燈火', 乙巳: '覆燈火',
  丙午: '天河水', 丁未: '天河水',
  戊申: '大驛土', 己酉: '大驛土',
  庚戌: '釵釧金', 辛亥: '釵釧金',
  壬子: '桑柘木', 癸丑: '桑柘木',
  甲寅: '大溪水', 乙卯: '大溪水',
  丙辰: '沙中土', 丁巳: '沙中土',
  戊午: '天上火', 己未: '天上火',
  庚申: '石榴木', 辛酉: '石榴木',
  壬戌: '大海水', 癸亥: '大海水',
};

const HUA_LABEL: Record<string, string> = {
  hua_lu: '化祿', hua_quan: '化權', hua_ke: '化科', hua_ji: '化忌',
};
const HUA_COLOR_CLASS: Record<string, string> = {
  hua_lu:   'text-emerald-300',
  hua_quan: 'text-amber-300',
  hua_ke:   'text-sky-300',
  hua_ji:   'text-rose-400',
};
const HUA_BG_CLASS: Record<string, string> = {
  hua_lu:   'bg-emerald-900/40 border-emerald-600/30',
  hua_quan: 'bg-amber-900/40 border-amber-600/30',
  hua_ke:   'bg-sky-900/40 border-sky-600/30',
  hua_ji:   'bg-rose-900/40 border-rose-600/30',
};

// ── Section wrapper ───────────────────────────────────────────────────────
function Section({
  step, title, children,
}: { step: number; title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="rounded-xl border border-slate-700/40 bg-slate-900/40 overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-800/30 transition-colors"
      >
        <span className="w-6 h-6 rounded-full bg-teal-700/60 border border-teal-600/40 flex items-center justify-center text-[10px] font-bold text-cyan-200 flex-shrink-0">
          {step}
        </span>
        <span className="flex-1 text-sm font-semibold text-white">{title}</span>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

// ── Mini table helper ─────────────────────────────────────────────────────
function MiniTable({ headers, rows }: { headers: string[]; rows: (string | React.ReactNode)[][] }) {
  return (
    <div className="rounded-lg border border-slate-700/40 overflow-hidden text-xs">
      <table className="w-full">
        <thead>
          <tr className="bg-slate-800/60">
            {headers.map((h, i) => (
              <th key={i} className="px-3 py-2 text-left font-semibold text-slate-400 border-b border-slate-700/40">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} className={ri % 2 === 0 ? 'bg-slate-900/20' : 'bg-slate-800/20'}>
              {row.map((cell, ci) => (
                <td key={ci} className="px-3 py-1.5 text-slate-300 border-b border-slate-700/20">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────
export default function ZiweiChartSteps({ baseChart }: Props) {
  if (!baseChart) return null;

  const { birth, life_palace, five_element_bureau, four_transformations, palaces } = baseChart;

  // ── Derive step data ──────────────────────────────────────────────────
  const bureauLabel = BUREAU_LABEL[five_element_bureau] ?? `${five_element_bureau}局`;
  const nayin       = NAYIN_BUREAU[life_palace.stem_branch] ?? '—';

  // Collect all stars and their palaces
  const allStars: { star: string; branch: string; palace_name: string; huaType?: string }[] = [];
  for (const p of palaces) {
    const hua = p.transformations ?? {};
    for (const star of p.major_stars ?? []) {
      allStars.push({ star, branch: p.branch, palace_name: p.palace_name, huaType: hua[star] });
    }
  }

  // Find 紫微 and 天府
  const ziwei  = allStars.find(s => s.star === '紫微');
  const tianfu = allStars.find(s => s.star === '天府');

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 px-1">
        <div className="w-2 h-2 rounded-full bg-cyan-400" />
        <h3 className="text-sm font-bold text-white">命盤排列步驟</h3>
        <span className="text-xs text-slate-500">算法知識庫輸出</span>
      </div>

      {/* ── Step 1: Birth Data ─────────────────────────────────────── */}
      <Section step={1} title="生辰資料 Birth Data">
        <MiniTable
          headers={['項目', '資料']}
          rows={[
            ['命造', birth.name || '—'],
            ['性別', birth.gender === 'M' ? '男' : birth.gender === 'F' ? '女' : '—'],
            ['農曆年', `${birth.year_stem}${birth.year_branch}年`],
            ['農曆月', `${birth.lunar_month}月`],
            ['農曆日', `${birth.lunar_day}日`],
            ['時辰', `${birth.hour_branch}時`],
            ['出生地', birth.location || '—'],
          ]}
        />
      </Section>

      {/* ── Step 2: Life Palace ───────────────────────────────────── */}
      <Section step={2} title="安命宮身宮 Life & Body Palace">
        <p className="text-[11px] text-slate-500 mb-2">
          以農曆月份與時辰，按「寅宮起正月，逆布十二宮」法推算命宮地支；再以生年天干配五虎遁年法得天干。
        </p>
        <MiniTable
          headers={['宮位', '地支', '天干', '天干地支']}
          rows={[
            [
              <span key="life" className="text-amber-300 font-bold">命宮</span>,
              life_palace.branch,
              life_palace.stem,
              <span key="lsb" className="text-cyan-300 font-medium">{life_palace.stem_branch}</span>,
            ],
          ]}
        />
      </Section>

      {/* ── Step 3: Five Element Bureau ──────────────────────────── */}
      <Section step={3} title="起五行局 Five Element Bureau">
        <p className="text-[11px] text-slate-500 mb-2">
          以命宮天干地支查納音五行，再得五行局（水二/木三/金四/土五/火六局）。
        </p>
        <MiniTable
          headers={['命宮天干地支', '納音', '五行局']}
          rows={[
            [
              life_palace.stem_branch,
              nayin,
              <span key="bur" className="text-teal-300 font-bold">{bureauLabel}</span>,
            ],
          ]}
        />
      </Section>

      {/* ── Step 4: Ziwei & Tianfu positions ─────────────────────── */}
      <Section step={4} title="安紫微天府星 Purple Star & Vault Star">
        <p className="text-[11px] text-slate-500 mb-2">
          以五行局數與農曆日期，按奇偶局推算紫微位置；天府星以紫微為基準，對宮安放。
        </p>
        <MiniTable
          headers={['星曜', '所在地支', '宮位名']}
          rows={[
            [
              <span key="zw" className="text-purple-300 font-bold">紫微</span>,
              ziwei?.branch ?? '—',
              ziwei?.palace_name ?? '—',
            ],
            [
              <span key="tf" className="text-yellow-300 font-bold">天府</span>,
              tianfu?.branch ?? '—',
              tianfu?.palace_name ?? '—',
            ],
          ]}
        />
      </Section>

      {/* ── Step 5: All major stars placement ───────────────────── */}
      <Section step={5} title="安主星 Major Star Placement">
        <p className="text-[11px] text-slate-500 mb-2">
          以紫微/天府為基點，按各星安星訣布置14顆主星及輔星於十二宮。
        </p>
        <MiniTable
          headers={['星曜', '地支宮', '宮位', '四化']}
          rows={allStars.map(s => [
            <span key={s.star} className="text-blue-300">{s.star}</span>,
            s.branch,
            s.palace_name,
            s.huaType ? (
              <span key={`h-${s.star}`} className={`${HUA_COLOR_CLASS[s.huaType] ?? 'text-slate-400'} font-medium`}>
                {HUA_LABEL[s.huaType] ?? s.huaType}
              </span>
            ) : '—',
          ])}
        />
      </Section>

      {/* ── Step 6: Four Transformations ─────────────────────────── */}
      <Section step={6} title="本命四化 Natal Transformations">
        <p className="text-[11px] text-slate-500 mb-2">
          以生年天干查四化訣：每個天干固定化四顆星。
        </p>
        {/* Year stem row */}
        <div className="mb-3 flex items-center gap-2">
          <span className="text-xs text-slate-400">生年天干：</span>
          <span className="px-2 py-0.5 bg-teal-800/40 border border-teal-600/30 rounded text-cyan-300 font-bold text-sm">
            {birth.year_stem}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(four_transformations).map(([huaType, star]) => {
            // Find which palace this star is in
            const palaceEntry = allStars.find(s => s.star === star);
            return (
              <div
                key={huaType}
                className={`rounded-lg border px-3 py-2 ${HUA_BG_CLASS[huaType] ?? 'bg-slate-800/40 border-slate-600/30'}`}
              >
                <div className={`text-xs font-bold mb-0.5 ${HUA_COLOR_CLASS[huaType] ?? 'text-slate-300'}`}>
                  {HUA_LABEL[huaType] ?? huaType}
                </div>
                <div className="text-sm font-semibold text-white">{star}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {palaceEntry ? `${palaceEntry.palace_name} (${palaceEntry.branch})` : '—'}
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* ── Step 7: Palace summary ────────────────────────────────── */}
      <Section step={7} title="十二宮總覽 Twelve Palaces Summary">
        <MiniTable
          headers={['宮位', '地支', '天干', '主星']}
          rows={palaces.map(p => [
            <span key={p.palace_id} className={p.branch === life_palace.branch ? 'text-amber-300 font-bold' : 'text-slate-200'}>
              {p.palace_name}{p.branch === life_palace.branch ? ' ★' : ''}
            </span>,
            p.branch,
            <span key={`s-${p.palace_id}`} className="text-sky-400">{p.stem}</span>,
            (p.major_stars ?? []).map(s => {
              const hua = (p.transformations ?? {})[s];
              return (
                <span
                  key={s}
                  className={`mr-1 ${hua ? (HUA_COLOR_CLASS[hua] ?? 'text-blue-300') : 'text-blue-300/80'}`}
                >
                  {s}{hua ? `(${HUA_LABEL[hua] ?? hua})` : ''}
                </span>
              );
            }),
          ])}
        />
      </Section>
    </div>
  );
}
