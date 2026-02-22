'use client';

import { useState } from 'react';
import { ChevronDown, FlaskConical } from 'lucide-react';

// ── Types matching Python format_chart_output ─────────────────────────────
interface PalaceData {
  palace_id:       number;
  palace_name:     string;
  branch:          string;
  stem:            string;
  stem_branch:     string;
  ziwei_star?:     string | null;
  tianfu_star?:    string | null;
  major_stars:     string[];
  transformations: Record<string, string>;
}

interface DevSteps {
  step5_ziwei_tianfu:      Record<string, string>;
  step6_ziwei_system:      Record<string, string>;
  step6_tianfu_system:     Record<string, string>;
  step7_auxiliary:         Record<string, string>;
  step8_four_transformations: Record<string, string>;
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
  four_transformations: Record<string, string>;
  dev_steps?: DevSteps;
  palaces: PalaceData[];
}

interface Props {
  baseChart: BaseChart;
}

// ── Constants ──────────────────────────────────────────────────────────────
const BUREAU_LABEL: Record<number, string> = {
  2: '水二局', 3: '木三局', 4: '金四局', 5: '土五局', 6: '火六局',
};

const NAYIN_BUREAU: Record<string, string> = {
  甲子:'海中金', 乙丑:'海中金', 丙寅:'爐中火', 丁卯:'爐中火',
  戊辰:'大林木', 己巳:'大林木', 庚午:'路旁土', 辛未:'路旁土',
  壬申:'劍鋒金', 癸酉:'劍鋒金', 甲戌:'山頭火', 乙亥:'山頭火',
  丙子:'澗下水', 丁丑:'澗下水', 戊寅:'城頭土', 己卯:'城頭土',
  庚辰:'白蠟金', 辛巳:'白蠟金', 壬午:'楊柳木', 癸未:'楊柳木',
  甲申:'泉中水', 乙酉:'泉中水', 丙戌:'屋上土', 丁亥:'屋上土',
  戊子:'霹靂火', 己丑:'霹靂火', 庚寅:'松柏木', 辛卯:'松柏木',
  壬辰:'長流水', 癸巳:'長流水', 甲午:'沙中金', 乙未:'沙中金',
  丙申:'山下火', 丁酉:'山下火', 戊戌:'平地木', 己亥:'平地木',
  庚子:'壁上土', 辛丑:'壁上土', 壬寅:'金箔金', 癸卯:'金箔金',
  甲辰:'覆燈火', 乙巳:'覆燈火', 丙午:'天河水', 丁未:'天河水',
  戊申:'大驛土', 己酉:'大驛土', 庚戌:'釵釧金', 辛亥:'釵釧金',
  壬子:'桑柘木', 癸丑:'桑柘木', 甲寅:'大溪水', 乙卯:'大溪水',
  丙辰:'沙中土', 丁巳:'沙中土', 戊午:'天上火', 己未:'天上火',
  庚申:'石榴木', 辛酉:'石榴木', 壬戌:'大海水', 癸亥:'大海水',
};

const HUA_LABEL: Record<string, string> = {
  hua_lu:'化祿', hua_quan:'化權', hua_ke:'化科', hua_ji:'化忌',
};
const HUA_COLOR_CLASS: Record<string, string> = {
  hua_lu:'text-emerald-300', hua_quan:'text-amber-300',
  hua_ke:'text-sky-300',     hua_ji:'text-rose-400',
};
const HUA_BG_CLASS: Record<string, string> = {
  hua_lu:'bg-emerald-900/40 border-emerald-600/30',
  hua_quan:'bg-amber-900/40 border-amber-600/30',
  hua_ke:'bg-sky-900/40 border-sky-600/30',
  hua_ji:'bg-rose-900/40 border-rose-600/30',
};

const ZIWEI_STARS  = new Set(['紫微','天機','太陽','武曲','天同','廉貞']);
const TIANFU_STARS = new Set(['天府','太陰','貪狼','巨門','天相','天梁','七殺','破軍']);
const AUX_STARS    = new Set(['左輔','右弼','天魁','天鉞','文昌','文曲','天馬','祿存']);
const BAD_STARS    = new Set(['擎羊','陀羅','火星','鈴星','地空','地劫']);

// Verified offsets from KB (ZIWEI_ALGORITHM.md, Zhongzhou School)
const ZIWEI_SYSTEM_OFFSETS: Record<string, number> = {
  '紫微': 0, '天機': -1, '太陽': -3, '武曲': -4, '天同': -5, '廉貞': -8,
};
const TIANFU_SYSTEM_OFFSETS: Record<string, number> = {
  '天府': 0, '太陰': -1, '貪狼': -2, '巨門': 1, '天相': 2, '天梁': 3, '七殺': 6, '破軍': 10,
};

function starColorClass(star: string): string {
  if (star === '紫微')            return 'text-violet-200 font-bold';
  if (star === '天府')            return 'text-cyan-200 font-bold';
  if (ZIWEI_STARS.has(star))      return 'text-violet-300';
  if (TIANFU_STARS.has(star))     return 'text-cyan-300';
  if (AUX_STARS.has(star))        return 'text-emerald-400';
  if (BAD_STARS.has(star))        return 'text-orange-400';
  return 'text-slate-300';
}

// ── Section (controlled open/close) ──────────────────────────────────────
function Section({
  step, title, children, isOpen, onToggle,
}: {
  step: number; title: string; children: React.ReactNode;
  isOpen: boolean; onToggle: () => void;
}) {
  return (
    <div className="rounded-xl border border-slate-700/40 bg-slate-900/40 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-800/30 transition-colors"
      >
        <span className="w-6 h-6 rounded-full bg-teal-700/60 border border-teal-600/40 flex items-center justify-center text-[10px] font-bold text-cyan-200 flex-shrink-0">
          {step}
        </span>
        <span className="flex-1 text-sm font-semibold text-white">{title}</span>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

// ── Mini table ────────────────────────────────────────────────────────────
function MiniTable({ headers, rows }: { headers: string[]; rows: (string | React.ReactNode)[][] }) {
  return (
    <div className="rounded-lg border border-slate-700/40 overflow-hidden text-xs">
      <table className="w-full">
        <thead>
          <tr className="bg-slate-800/60">
            {headers.map((h, i) => (
              <th key={i} className="px-3 py-2 text-left font-semibold text-slate-400 border-b border-slate-700/40">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} className={ri % 2 === 0 ? 'bg-slate-900/20' : 'bg-slate-800/20'}>
              {row.map((cell, ci) => (
                <td key={ci} className="px-3 py-1.5 text-slate-300 border-b border-slate-700/20">{cell}</td>
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

  const { birth, life_palace, five_element_bureau, four_transformations = {}, palaces, dev_steps } = baseChart;

  // Step filter: null = all open, 0 = dev mode, 1-7 = specific step
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const [devMode, setDevMode]       = useState(false);

  const isOpen = (step: number) => activeStep === null || activeStep === step;
  const toggle = (step: number) => {
    setActiveStep(prev => prev === step ? null : step);
    setDevMode(false);
  };

  // Build branch→palace lookup
  const branchToPalace: Record<string, PalaceData> = {};
  for (const p of palaces) if (p.branch) branchToPalace[p.branch] = p;

  // Collect all stars from palaces (including anchors from special fields)
  const allStars: { star: string; branch: string; palace_name: string; huaType?: string }[] = [];
  for (const p of palaces) {
    const hua = p.transformations ?? {};
    if (p.ziwei_star)  allStars.push({ star: p.ziwei_star.replace('星',''),  branch: p.branch, palace_name: p.palace_name, huaType: hua['紫微']  });
    if (p.tianfu_star) allStars.push({ star: p.tianfu_star.replace('星',''), branch: p.branch, palace_name: p.palace_name, huaType: hua['天府'] });
    for (const star of p.major_stars ?? []) {
      allStars.push({ star, branch: p.branch, palace_name: p.palace_name, huaType: hua[star] });
    }
  }

  const ziwei  = allStars.find(s => s.star === '紫微');
  const tianfu = allStars.find(s => s.star === '天府');

  const bureauLabel = BUREAU_LABEL[five_element_bureau] ?? `${five_element_bureau}局`;
  const nayin       = NAYIN_BUREAU[life_palace.stem_branch] ?? '—';

  // ── Dev mode: star placement verification table ─────────────────────────
  function DevPanel() {
    if (!dev_steps) {
      return (
        <div className="text-xs text-slate-500 p-3 bg-slate-900/40 rounded-lg border border-slate-700/40">
          dev_steps not available — regenerate the chart to get detailed step data.
        </div>
      );
    }

    const allDevStars: { star: string; system: string; branch: string; palace: string; ok: boolean }[] = [];

    const addStars = (map: Record<string, string>, system: string) => {
      for (const [star, branch] of Object.entries(map)) {
        const actual = allStars.find(s => s.star === star);
        allDevStars.push({
          star, system, branch,
          palace: branchToPalace[branch]?.palace_name ?? '—',
          ok: actual?.branch === branch,
        });
      }
    };

    addStars(dev_steps.step5_ziwei_tianfu, '錨星');
    addStars(dev_steps.step6_ziwei_system, '紫微系');
    addStars(dev_steps.step6_tianfu_system, '天府系');
    addStars(dev_steps.step7_auxiliary, '輔佐煞');

    return (
      <div className="space-y-3">
        <p className="text-[11px] text-slate-500">
          Shows computed branch for every star. ✓ = correctly placed in chart · ✗ = mismatch
        </p>
        <div className="rounded-lg border border-slate-700/40 overflow-hidden text-xs">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-800/60">
                {['系統','星曜','應在地支','應在宮位','校驗'].map((h, i) => (
                  <th key={i} className="px-3 py-2 text-left font-semibold text-slate-400 border-b border-slate-700/40">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {allDevStars.map((r, i) => (
                <tr key={i} className={`${i % 2 === 0 ? 'bg-slate-900/20' : 'bg-slate-800/20'} ${r.ok ? '' : 'bg-red-900/10'}`}>
                  <td className="px-3 py-1.5 border-b border-slate-700/20 text-slate-500 text-[10px]">{r.system}</td>
                  <td className="px-3 py-1.5 border-b border-slate-700/20">
                    <span className={starColorClass(r.star)}>{r.star}</span>
                  </td>
                  <td className="px-3 py-1.5 border-b border-slate-700/20 text-sky-400 font-mono">{r.branch}</td>
                  <td className="px-3 py-1.5 border-b border-slate-700/20 text-slate-300">{r.palace}</td>
                  <td className="px-3 py-1.5 border-b border-slate-700/20 font-bold">
                    {r.ok
                      ? <span className="text-emerald-400">✓</span>
                      : <span className="text-rose-400" title={`found in: ${allStars.find(s=>s.star===r.star)?.branch ?? '?'}`}>✗</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* 四化 verification */}
        <div className="text-[11px] text-slate-500 font-semibold mt-2">本命四化 ({birth.year_stem}年)</div>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(dev_steps.step8_four_transformations).map(([huaType, star]) => {
            const loc = allStars.find(s => s.star === star);
            return (
              <div key={huaType} className={`rounded border px-2 py-1.5 ${HUA_BG_CLASS[huaType] ?? 'bg-slate-800 border-slate-700'}`}>
                <span className={`text-[10px] font-bold ${HUA_COLOR_CLASS[huaType] ?? ''}`}>{HUA_LABEL[huaType] ?? huaType}</span>
                <span className="text-white font-semibold ml-1 text-xs">{star}</span>
                <span className="text-slate-400 text-[10px] ml-1">
                  {loc ? `→ ${loc.palace_name} (${loc.branch})` : '—'}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* ── Header + filter bar ───────────────────────────────────────────── */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="w-2 h-2 rounded-full bg-cyan-400 flex-shrink-0" />
        <h3 className="text-sm font-bold text-white">命盤排列步驟</h3>
        <span className="text-xs text-slate-500">算法知識庫輸出</span>

        {/* Step filter buttons */}
        <div className="ml-auto flex items-center gap-1 flex-wrap">
          <span className="text-[10px] text-slate-600 mr-0.5">篩選:</span>
          <button
            onClick={() => { setActiveStep(null); setDevMode(false); }}
            className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors ${
              activeStep === null && !devMode
                ? 'bg-teal-700/50 border-teal-600/50 text-white'
                : 'border-slate-700/50 text-slate-500 hover:text-slate-300'
            }`}
          >全</button>
          {[1,2,3,4,5,6,7].map(s => (
            <button
              key={s}
              onClick={() => { toggle(s); setDevMode(false); }}
              className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors ${
                activeStep === s && !devMode
                  ? 'bg-teal-700/50 border-teal-600/50 text-white'
                  : 'border-slate-700/50 text-slate-500 hover:text-slate-300'
              }`}
            >
              {s}
            </button>
          ))}
          {/* Dev mode toggle */}
          <button
            onClick={() => { setDevMode(d => !d); setActiveStep(null); }}
            className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors flex items-center gap-0.5 ${
              devMode
                ? 'bg-violet-700/50 border-violet-600/50 text-violet-200'
                : 'border-slate-700/50 text-slate-500 hover:text-slate-300'
            }`}
          >
            <FlaskConical className="w-2.5 h-2.5" />Dev
          </button>
        </div>
      </div>

      {/* ── Dev mode panel ─────────────────────────────────────────────────── */}
      {devMode && (
        <div className="rounded-xl border border-violet-700/40 bg-violet-950/20 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-violet-700/30">
            <FlaskConical className="w-4 h-4 text-violet-400" />
            <span className="text-sm font-semibold text-violet-200">Developer — Star Placement Verification</span>
          </div>
          <div className="px-4 pb-4 pt-3">
            <DevPanel />
          </div>
        </div>
      )}

      {/* ── Step 1: Birth Data ─────────────────────────────────────────────── */}
      <Section step={1} title="生辰資料 Birth Data" isOpen={isOpen(1)} onToggle={() => toggle(1)}>
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

      {/* ── Step 2: Life Palace ───────────────────────────────────────────── */}
      <Section step={2} title="安命宮 Life Palace" isOpen={isOpen(2)} onToggle={() => toggle(2)}>
        <p className="text-[11px] text-slate-500 mb-2">
          以農曆月份與時辰，按「寅宮起正月，逆布十二宮」法推算命宮地支；再以生年天干配五虎遁年法得天干。
        </p>
        <MiniTable
          headers={['宮位', '地支', '天干', '天干地支']}
          rows={[[
            <span key="life" className="text-amber-300 font-bold">命宮</span>,
            life_palace.branch, life_palace.stem,
            <span key="lsb" className="text-cyan-300 font-medium">{life_palace.stem_branch}</span>,
          ]]}
        />
      </Section>

      {/* ── Step 3: Five Element Bureau ──────────────────────────────────── */}
      <Section step={3} title="起五行局 Five Element Bureau" isOpen={isOpen(3)} onToggle={() => toggle(3)}>
        <p className="text-[11px] text-slate-500 mb-2">
          以命宮天干地支查納音五行，再得五行局（水二/木三/金四/土五/火六局）。
        </p>
        <MiniTable
          headers={['命宮天干地支', '納音', '五行局']}
          rows={[[
            life_palace.stem_branch, nayin,
            <span key="bur" className="text-teal-300 font-bold">{bureauLabel}</span>,
          ]]}
        />
      </Section>

      {/* ── Step 4: Ziwei & Tianfu ──────────────────────────────────────── */}
      <Section step={4} title="安紫微天府星 Purple Star & Vault Star" isOpen={isOpen(4)} onToggle={() => toggle(4)}>
        <p className="text-[11px] text-slate-500 mb-2">
          以五行局數與農曆日期，按奇偶論斷法推算紫微位置；天府以固定口訣對宮安放。
        </p>
        <MiniTable
          headers={['星曜', '所在地支', '宮位名']}
          rows={[
            [<span key="zw" className="text-violet-200 font-bold">紫微</span>, ziwei?.branch ?? '—', ziwei?.palace_name ?? '—'],
            [<span key="tf" className="text-cyan-200 font-bold">天府</span>, tianfu?.branch ?? '—', tianfu?.palace_name ?? '—'],
          ]}
        />
      </Section>

      {/* ── Step 5: All major stars ──────────────────────────────────────── */}
      <Section step={5} title="安主星 Major Star Placement" isOpen={isOpen(5)} onToggle={() => toggle(5)}>
        <p className="text-[11px] text-slate-500 mb-3">
          以紫微/天府為錨點，按安星訣排布14顆主星。
          紫微系逆布（offset −1, −3, −4, −5, −8）；天府系混布——太陰/貪狼逆（−1/−2），巨門/天相/天梁順（+1/+2/+3），七殺/破軍順（+6/+10）。
        </p>

        {/* Ziwei system — 6 stars counter-clockwise */}
        <div className="text-[10px] font-semibold text-violet-400 mb-1">紫微系 6星 — counter-clockwise from 紫微</div>
        <MiniTable
          headers={['星曜', 'offset', '地支宮', '宮位', '四化']}
          rows={allStars
            .filter(s => ZIWEI_SYSTEM_OFFSETS[s.star] !== undefined)
            .map(s => {
              const off = ZIWEI_SYSTEM_OFFSETS[s.star];
              return [
                <span key={s.star} className={starColorClass(s.star)}>{s.star}</span>,
                <span key={`o-${s.star}`} className="font-mono text-slate-400 text-[10px]">{off === 0 ? '0 (錨)' : String(off)}</span>,
                s.branch, s.palace_name,
                s.huaType ? <span key={`h-${s.star}`} className={`${HUA_COLOR_CLASS[s.huaType] ?? ''} font-medium`}>{HUA_LABEL[s.huaType] ?? s.huaType}</span> : '—',
              ];
            })
          }
        />

        {/* Tianfu system — 8 stars mixed direction */}
        <div className="text-[10px] font-semibold text-cyan-400 mb-1 mt-3">天府系 8星 — mixed direction from 天府</div>
        <MiniTable
          headers={['星曜', 'offset', '方向', '地支宮', '宮位', '四化']}
          rows={allStars
            .filter(s => TIANFU_SYSTEM_OFFSETS[s.star] !== undefined)
            .map(s => {
              const off = TIANFU_SYSTEM_OFFSETS[s.star];
              return [
                <span key={s.star} className={starColorClass(s.star)}>{s.star}</span>,
                <span key={`o-${s.star}`} className="font-mono text-slate-400 text-[10px]">{off === 0 ? '0 (錨)' : off > 0 ? `+${off}` : String(off)}</span>,
                <span key={`d-${s.star}`} className={`text-[10px] ${off < 0 ? 'text-rose-400' : off > 0 ? 'text-emerald-400' : 'text-slate-500'}`}>{off === 0 ? '—' : off < 0 ? '逆' : '順'}</span>,
                s.branch, s.palace_name,
                s.huaType ? <span key={`h-${s.star}`} className={`${HUA_COLOR_CLASS[s.huaType] ?? ''} font-medium`}>{HUA_LABEL[s.huaType] ?? s.huaType}</span> : '—',
              ];
            })
          }
        />

        {/* Auxiliary & calamity stars */}
        {allStars.filter(s => ZIWEI_SYSTEM_OFFSETS[s.star] === undefined && TIANFU_SYSTEM_OFFSETS[s.star] === undefined).length > 0 && (
          <>
            <div className="text-[10px] font-semibold text-emerald-400 mb-1 mt-3">輔佐煞星 — Auxiliary & Calamity</div>
            <MiniTable
              headers={['星曜', '地支宮', '宮位', '四化']}
              rows={allStars
                .filter(s => ZIWEI_SYSTEM_OFFSETS[s.star] === undefined && TIANFU_SYSTEM_OFFSETS[s.star] === undefined)
                .map(s => [
                  <span key={s.star} className={starColorClass(s.star)}>{s.star}</span>,
                  s.branch, s.palace_name,
                  s.huaType ? <span key={`h-${s.star}`} className={`${HUA_COLOR_CLASS[s.huaType] ?? ''} font-medium`}>{HUA_LABEL[s.huaType] ?? s.huaType}</span> : '—',
                ])
              }
            />
          </>
        )}
      </Section>

      {/* ── Step 6: Four Transformations ────────────────────────────────── */}
      <Section step={6} title="本命四化 Natal Transformations" isOpen={isOpen(6)} onToggle={() => toggle(6)}>
        <p className="text-[11px] text-slate-500 mb-2">以生年天干查四化訣：每個天干固定化四顆星。</p>
        <div className="mb-3 flex items-center gap-2">
          <span className="text-xs text-slate-400">生年天干：</span>
          <span className="px-2 py-0.5 bg-teal-800/40 border border-teal-600/30 rounded text-cyan-300 font-bold text-sm">{birth.year_stem}</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(four_transformations).map(([huaType, star]) => {
            const loc = allStars.find(s => s.star === star);
            return (
              <div key={huaType} className={`rounded-lg border px-3 py-2 ${HUA_BG_CLASS[huaType] ?? 'bg-slate-800/40 border-slate-600/30'}`}>
                <div className={`text-xs font-bold mb-0.5 ${HUA_COLOR_CLASS[huaType] ?? ''}`}>{HUA_LABEL[huaType] ?? huaType}</div>
                <div className="text-sm font-semibold text-white">{star}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {loc ? `${loc.palace_name} (${loc.branch})` : '—'}
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* ── Step 7: Palace summary ───────────────────────────────────────── */}
      <Section step={7} title="十二宮總覽 Twelve Palaces Summary" isOpen={isOpen(7)} onToggle={() => toggle(7)}>
        <MiniTable
          headers={['宮位', '地支', '天干', '主星']}
          rows={palaces.map(p => {
            const isLifePalace = p.branch === life_palace.branch;
            const hua = p.transformations ?? {};
            const anchorStars: string[] = [];
            if (p.ziwei_star)  anchorStars.push(p.ziwei_star.replace('星',''));
            if (p.tianfu_star) anchorStars.push(p.tianfu_star.replace('星',''));
            const allPalaceStars = [...anchorStars, ...(p.major_stars ?? [])];
            return [
              <span key={p.palace_id} className={isLifePalace ? 'text-amber-300 font-bold' : 'text-slate-200'}>
                {p.palace_name}{isLifePalace ? ' ★' : ''}
              </span>,
              p.branch,
              <span key={`s-${p.palace_id}`} className="text-sky-400">{p.stem}</span>,
              allPalaceStars.map(s => {
                const h = hua[s];
                return (
                  <span key={s} className={`mr-1 ${h ? (HUA_COLOR_CLASS[h] ?? 'text-blue-300') : starColorClass(s)}`}>
                    {s}{h ? `(${HUA_LABEL[h] ?? h})` : ''}
                  </span>
                );
              }),
            ];
          })}
        />
      </Section>
    </div>
  );
}
