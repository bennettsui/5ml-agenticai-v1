'use client';

import { SiteNav, SiteFooter, Section, SectionLabel, FadeIn, globalStyles, TED_RED, WARM_AMBER } from '../components';

const CURRENT_PATH = '/vibe-demo/tedx-xinyi/sponsors';

const TIER_COLORS: Record<string, string> = {
  patron:     TED_RED,
  honor:      '#71717a',
  basic:      WARM_AMBER,
  individual: '#d4d4d8',
};

const PLAN_CARDS = [
  {
    tier: 'patron',
    code: 'Patron / Donor',
    name: '全年戰略合作夥伴',
    amount: 'NT$500,000 起',
    bullets: [
      '全年大會與相關活動之場地概念合作與品牌呈現',
      '工作坊展示合作與 F&B 體驗合作',
      '永續體驗裝置合作（含設計與現場佈置）',
      '官方視覺、LED、KV 等物料之品牌 Logo 露出',
      '活動前、中、後社群貼文與 EDM 置入',
      '舞台口頭致謝與個人／品牌答謝會機會',
    ],
  },
  {
    tier: 'honor',
    code: 'Honor Donation',
    name: '單場主合作夥伴',
    amount: 'NT$300,000',
    bullets: [
      '當年度旗艦活動之主題區或場地佈置合作',
      '現場展位或體驗區，可進行產品導入與互動',
      '網站 Sponsors 區與社群貼文之顯著 Logo 露出',
      '活動現場主視覺、指示牌與背板 Logo 呈現',
      '提供一定數量貴賓票與座位保留',
    ],
  },
  {
    tier: 'basic',
    code: 'Basic Donation',
    name: '金牌合作夥伴',
    amount: 'NT$100,000 以下',
    bullets: [
      '網站與現場物料（贊助牆、節目冊）Logo 露出',
      '社群貼文感謝一次',
      '視活動類型安排小型展示或產品置放',
      '提供一定數量一般票券回饋',
    ],
  },
  {
    tier: 'individual',
    code: 'Individual Support',
    name: '個人贊助',
    amount: '不限',
    bullets: [
      '網站「個人支持名單」公開或匿名致謝',
      '活動現場投影感謝名單',
      '有機會受邀參與小型分享會或謝票活動',
    ],
  },
];

// rows: [label, patron, honor, basic, individual]
const TABLE_ROWS: [string, boolean, boolean, boolean, boolean][] = [
  ['場地概念合作 / 主題區合作',  true,  true,  false, false],
  ['工作坊展示合作',             true,  false, false, false],
  ['F&B 體驗合作',               true,  false, false, false],
  ['永續體驗裝置合作',           true,  false, false, false],
  ['網站與活動視覺 Logo 露出',   true,  true,  true,  false],
  ['社群與 EDM 露出',            true,  true,  true,  false],
  ['現場展位或產品展示',         true,  true,  true,  false],
  ['票券與貴賓席次回饋',         true,  true,  true,  false],
  ['舞台口頭致謝 / 感謝名單',   true,  false, false, true ],
];

const LOGO_GROUPS = [
  {
    title: '大會官方成長夥伴',
    desc: '提供從文具、禮品到體驗設計等資源，陪伴參與者把靈感帶回家。',
    slots: ['Moleskine', '夥伴名稱', '夥伴名稱', '夥伴名稱'],
  },
  {
    title: '影音與創意夥伴',
    desc: '提供攝影、錄影與視覺創作，讓講者內容在活動後持續被看見。',
    slots: ['夥伴名稱', '夥伴名稱', '夥伴名稱', '夥伴名稱'],
  },
  {
    title: '體驗夥伴',
    desc: '在活動前後與會場中打造飲食、旅遊與生活風格體驗。',
    slots: ['夥伴名稱', '夥伴名稱', '夥伴名稱', '夥伴名稱'],
  },
  {
    title: '媒體與出版夥伴',
    desc: '透過媒體報導與專題合作，讓更多人認識 TEDxXinyi 的故事與講者。',
    slots: ['夥伴名稱', '夥伴名稱', '夥伴名稱', '夥伴名稱'],
  },
  {
    title: '社區夥伴',
    desc: '從其他 TEDx 團隊到社會創新與科技組織，跨城市、跨領域一起擴散影響力。',
    slots: ['夥伴名稱', '夥伴名稱', '夥伴名稱', '夥伴名稱'],
  },
];

function LogoSlot() {
  return (
    <div className="border-2 border-dashed border-neutral-200 bg-neutral-50 rounded-xl h-20 flex items-center justify-center text-xs font-bold text-neutral-300 tracking-widest uppercase cursor-pointer hover:border-neutral-400 hover:bg-white transition-colors select-none">
      Logo
    </div>
  );
}

export default function SponsorsPage() {
  return (
    <div className="tedx-xinyi bg-white text-neutral-900 min-h-screen">
      <style dangerouslySetInnerHTML={{ __html: globalStyles }} />
      <SiteNav currentPath={CURRENT_PATH} heroMode />

      {/* ── HERO ─────────────────────────────────────── */}
      <section className="relative min-h-[52vh] flex items-end bg-neutral-900 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 50% 70% at 5% 50%, rgba(245,158,11,0.07) 0%, transparent 65%), radial-gradient(ellipse 50% 70% at 95% 50%, rgba(230,43,30,0.07) 0%, transparent 65%)' }} />
        <div className="absolute inset-0 bg-gradient-to-b from-neutral-900/20 via-neutral-900/60 to-white" />
        <div className="relative z-10 max-w-6xl mx-auto px-6 pb-20 pt-36 w-full">
          <FadeIn>
            <SectionLabel dark>PARTNERS &amp; SPONSORS</SectionLabel>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black mb-5 text-white leading-tight" lang="zh-TW">
              好點子要落地，<br />需要一起冒險的夥伴。
            </h1>
          </FadeIn>
          <FadeIn delay={150}>
            <p className="text-white/50 text-sm" lang="zh-TW">感謝歷屆所有合作夥伴、志工與社群朋友的支持。</p>
          </FadeIn>
        </div>
      </section>

      {/* ── HIGHLIGHTED PARTNERS STRIP ───────────────── */}
      <Section bg="white">
        <FadeIn>
          <SectionLabel>精選夥伴</SectionLabel>
          <div className="flex flex-wrap gap-3 sm:gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="flex-shrink-0 w-32 h-16 border-2 border-dashed border-neutral-200 bg-neutral-50 rounded-xl flex items-center justify-center text-xs font-bold text-neutral-300 tracking-widest uppercase cursor-pointer hover:border-neutral-400 hover:bg-white transition-colors select-none"
              >
                Logo
              </div>
            ))}
          </div>
        </FadeIn>
      </Section>

      {/* ── WHY PARTNER ──────────────────────────────── */}
      <Section bg="warm" id="why-partner">
        <FadeIn>
          <SectionLabel>The Value</SectionLabel>
          <h2 className="text-3xl md:text-4xl font-black mb-12" lang="zh-TW">為何與 TEDxXinyi 合作</h2>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: '💡',
              title: '與好點子站在一起',
              body: '把品牌與「好點子、創造力與社會影響力」連結在一起，走進以故事與內容為核心的國際社群。',
            },
            {
              icon: '🔗',
              title: '接觸行動派社群',
              body: '參與者關心未來、創新與議題，是最適合品牌體驗與產品試用的一群人。',
            },
            {
              icon: '🌱',
              title: '讓影響力延續活動之外',
              body: '講者故事與內容在活動後，會持續透過影片、社群與媒體被看見與分享。',
            },
          ].map((card) => (
            <FadeIn key={card.title}>
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-neutral-100 hover:shadow-md hover:-translate-y-1 transition-all duration-200 h-full">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-xl mb-5"
                  style={{ backgroundColor: `${TED_RED}12` }}
                >
                  {card.icon}
                </div>
                <h3 className="text-lg font-black mb-3" lang="zh-TW">{card.title}</h3>
                <p className="text-sm text-neutral-500 leading-relaxed" lang="zh-TW">{card.body}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </Section>

      {/* ── STRATEGIC PARTNERS ───────────────────────── */}
      <Section bg="white" id="strategic-partners">
        <FadeIn>
          <SectionLabel>Strategic</SectionLabel>
          <h2 className="text-3xl md:text-4xl font-black mb-3" lang="zh-TW">策略影響夥伴</h2>
          <p className="text-neutral-500 text-sm leading-relaxed max-w-xl mb-12" lang="zh-TW">
            這些夥伴不只提供資源，而是與 TEDxXinyi 一起為城市策劃長期對話與實驗。
          </p>
        </FadeIn>

        {/* Logo cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-16">
          {[
            { tag: '大會官方成長夥伴', name: 'Moleskine', desc: '以創意文具與設計工具，陪伴參與者把靈感帶回日常。' },
            { tag: '影響力夥伴', name: '家扶基金會', desc: '長期夥伴，與我們一起連結公益與社群力量。' },
          ].map((card) => (
            <FadeIn key={card.name}>
              <div className="border border-neutral-100 rounded-2xl p-6 hover:shadow-md hover:-translate-y-1 transition-all duration-200">
                <LogoSlot />
                <span
                  className="inline-block mt-4 mb-3 px-3 py-1 rounded-full text-xs font-bold tracking-wide"
                  style={{ backgroundColor: `${TED_RED}10`, color: TED_RED }}
                >
                  {card.tag}
                </span>
                <p className="font-black text-base" lang="zh-TW">{card.name}</p>
                <p className="text-sm text-neutral-500 mt-1" lang="zh-TW">{card.desc}</p>
              </div>
            </FadeIn>
          ))}
        </div>

        {/* iKala featured card */}
        <FadeIn>
          <SectionLabel>AI Strategic Partner</SectionLabel>
          <h3 className="text-2xl font-black mb-6" lang="zh-TW">AI 戰略合作夥伴 iKala</h3>
          <div className="flex justify-center">
            <div
              className="w-full max-w-2xl rounded-2xl p-8 sm:p-10 border"
              style={{ borderColor: `${TED_RED}25`, backgroundColor: `${TED_RED}04` }}
            >
              <div className="h-1 w-12 rounded-full mb-8" style={{ backgroundColor: TED_RED }} />
              <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-8 items-start">
                <div className="border-2 border-dashed border-neutral-200 bg-white rounded-xl h-28 flex items-center justify-center text-xs font-bold text-neutral-300 tracking-widest uppercase select-none">
                  iKala Logo
                </div>
                <div>
                  <p className="text-xs font-bold tracking-widest uppercase mb-2" style={{ color: TED_RED }}>
                    AI Strategic Partner · iKala
                  </p>
                  <h4 className="text-xl font-black mb-3" lang="zh-TW">AI 戰略合作夥伴 iKala</h4>
                  <p className="text-sm text-neutral-600 leading-relaxed mb-4" lang="zh-TW">
                    與 iKala 合作，TEDxXinyi 正在探索如何運用 AI 強化活動體驗、內容策展與社群經營，讓每一位參與者的影響力被科技放大。
                  </p>
                  <ul className="space-y-2">
                    {[
                      '將 AI 工具整合進溝通流程與活動執行',
                      '以數據與社群回饋共同創作內容與洞察報告',
                    ].map((b) => (
                      <li key={b} className="flex gap-2 text-sm text-neutral-500" lang="zh-TW">
                        <span style={{ color: TED_RED }} className="mt-0.5 flex-shrink-0">•</span>
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </FadeIn>
      </Section>

      {/* ── SPONSORSHIP PLANS ────────────────────────── */}
      <Section bg="warm" id="sponsorship-plans">
        <FadeIn>
          <SectionLabel>Sponsorship</SectionLabel>
          <h2 className="text-3xl md:text-4xl font-black mb-4" lang="zh-TW">贊助方案</h2>
          <p className="text-neutral-500 text-sm leading-relaxed max-w-xl mb-12" lang="zh-TW">
            我們提供不同層級與形式的贊助方案，從全年策略合作到單場活動支持，依品牌需求客製合作內容。
            以下為 TEDxXinyi 贊助方案概覽，詳細項目可向我們索取完整簡章。
          </p>
        </FadeIn>

        {/* Plan cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-14">
          {PLAN_CARDS.map((plan) => (
            <FadeIn key={plan.tier}>
              <div
                className="bg-white rounded-2xl p-6 border border-neutral-100 flex flex-col h-full hover:shadow-lg hover:-translate-y-1.5 transition-all duration-200"
                style={{ borderTop: `3px solid ${TIER_COLORS[plan.tier]}` }}
              >
                <div className="w-2.5 h-2.5 rounded-full mb-4" style={{ backgroundColor: TIER_COLORS[plan.tier] }} />
                <p className="text-xs font-bold tracking-widest uppercase text-neutral-400 mb-1">{plan.code}</p>
                <p className="text-xl font-black leading-tight mb-4" lang="zh-TW">{plan.name}</p>
                <div className="text-sm font-semibold px-3 py-2 rounded-lg bg-neutral-50 border border-neutral-100 mb-5" lang="zh-TW">
                  贊助金額：{plan.amount}
                </div>
                <ul className="flex flex-col gap-2 flex-1">
                  {plan.bullets.map((b) => (
                    <li key={b} className="flex gap-2 text-xs text-neutral-500 leading-relaxed" lang="zh-TW">
                      <span className="text-neutral-300 flex-shrink-0 mt-0.5">—</span>
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            </FadeIn>
          ))}
        </div>

        {/* Benefits table */}
        <FadeIn>
          <p className="text-xs font-bold tracking-widest uppercase text-neutral-400 mb-3" lang="zh-TW">
            主要合作權益一覽
          </p>
          <div className="overflow-x-auto rounded-2xl border border-neutral-200 bg-white">
            <table className="w-full text-sm min-w-[560px]">
              <thead>
                <tr className="border-b border-neutral-100">
                  <th className="text-left px-5 py-4 text-xs font-bold tracking-widest uppercase text-neutral-400 w-[40%] sticky left-0 bg-white">
                    權益項目
                  </th>
                  {(['Patron', 'Honor', 'Basic', 'Individual'] as const).map((t, i) => (
                    <th
                      key={t}
                      className="px-4 py-4 text-center text-xs font-black tracking-wide uppercase"
                      style={{ color: Object.values(TIER_COLORS)[i] }}
                    >
                      {t}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TABLE_ROWS.map(([label, p, h, b, ind], rowIdx) => (
                  <tr key={label} className={`border-b border-neutral-50 ${rowIdx % 2 === 1 ? 'bg-neutral-50/60' : ''}`}>
                    <td className="px-5 py-3.5 font-medium text-neutral-700 sticky left-0 bg-inherit" lang="zh-TW">{label}</td>
                    {[p, h, b, ind].map((v, ci) => (
                      <td key={ci} className="px-4 py-3.5 text-center">
                        {v
                          ? <span className="text-base font-black" style={{ color: TED_RED }}>✔</span>
                          : <span className="text-neutral-200 text-lg">–</span>
                        }
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </FadeIn>
      </Section>

      {/* ── IN-KIND & COMMUNITY PARTNERS ─────────────── */}
      <Section bg="white" id="community-partners">
        <FadeIn>
          <SectionLabel>Community</SectionLabel>
          <h2 className="text-3xl md:text-4xl font-black mb-14" lang="zh-TW">實物與社群夥伴</h2>
        </FadeIn>

        <div className="space-y-14">
          {LOGO_GROUPS.map((group) => (
            <FadeIn key={group.title}>
              <h3 className="text-base font-black mb-1" lang="zh-TW">{group.title}</h3>
              <p className="text-sm text-neutral-500 mb-5" lang="zh-TW">{group.desc}</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {group.slots.map((name, i) => (
                  <div key={i}>
                    <LogoSlot />
                    <p className="text-xs text-neutral-400 text-center font-semibold tracking-wide mt-2" lang="zh-TW">{name}</p>
                  </div>
                ))}
              </div>
            </FadeIn>
          ))}
        </div>
      </Section>

      {/* ── CONTACT CTA ──────────────────────────────── */}
      <Section bg="red" id="contact">
        <div className="max-w-xl mx-auto text-center">
          <FadeIn>
            <SectionLabel dark>Get in Touch</SectionLabel>
            <h2 className="text-3xl md:text-4xl font-black mb-8" lang="zh-TW">與 TEDxXinyi 合作</h2>
          </FadeIn>
          <FadeIn delay={100}>
            <p className="text-white/80 text-sm leading-relaxed mb-3" lang="zh-TW">
              無論是現金贊助、實物支持、媒體合作，或是 AI 與科技共創，我們都期待與你一起設計專屬的合作方式。
            </p>
            <p className="text-white/80 text-sm leading-relaxed mb-10" lang="zh-TW">
              若想了解完整贊助簡章或客製方案，歡迎與 TEDxXinyi 團隊聯繫。
            </p>
          </FadeIn>
          <FadeIn delay={200}>
            <div className="flex flex-wrap gap-3 justify-center">
              <a
                href="#"
                className="px-6 py-3 rounded-full text-sm font-bold bg-white hover:bg-neutral-100 transition-colors"
                style={{ color: TED_RED }}
              >
                下載完整贊助簡介
              </a>
              <a
                href="#"
                className="px-6 py-3 rounded-full text-sm font-bold border-2 border-white/40 text-white hover:bg-white/10 hover:border-white/60 transition-colors"
              >
                與我們聊聊合作
              </a>
            </div>
          </FadeIn>
          <FadeIn delay={300}>
            <p className="text-white/30 text-xs mt-12 border-t border-white/10 pt-8" lang="zh-TW">
              TEDxXinyi 為 TED 授權之獨立策劃活動，所有贊助款項僅用於節目製作與相關成本。
            </p>
          </FadeIn>
        </div>
      </Section>

      <SiteFooter />
    </div>
  );
}
