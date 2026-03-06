'use client';

const ALL_BADGES = [
  { code: 'FIRST_SESSION',    icon: '🎯', name_en: 'First Step',        name_zh: '第一步',      desc_en: 'Complete your first learning session',        desc_zh: '完成第一次學習' },
  { code: 'CURIOUS_EXPLORER', icon: '🔍', name_en: 'Curious Explorer',  name_zh: '好奇探索者',   desc_en: 'Explore 5 different concept areas',          desc_zh: '探索5個不同概念' },
  { code: 'CONCEPT_MASTER',   icon: '🏆', name_en: 'Concept Master',    name_zh: '概念達人',     desc_en: 'Achieve mastery in 3+ objectives',            desc_zh: '在3個以上目標達到精通' },
  { code: 'HONEST_SELF',      icon: '💡', name_en: 'Honest Learner',    name_zh: '誠實學者',     desc_en: 'Rate your understanding 10 times',           desc_zh: '自我評估10次' },
  { code: 'STREAK_3',         icon: '🔥', name_en: '3-Day Streak',      name_zh: '三日連續',     desc_en: 'Practise 3 days in a row',                   desc_zh: '連續3天練習' },
  { code: 'INTEREST_PEAK',    icon: '⭐', name_en: 'Interest Peak',     name_zh: '興趣高峰',     desc_en: 'Give a 5/5 interest rating to a concept',    desc_zh: '對某概念給出5分興趣評分' },
];

export default function BadgesPage() {
  const language = (() => {
    if (typeof window === 'undefined') return 'ZH';
    try { return JSON.parse(localStorage.getItem('al_student') || '{}').language || 'ZH'; } catch { return 'ZH'; }
  })();

  // Pilot: no earned badges tracked yet — show all as locked
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-bold text-white">Badges</h1>
        <p className="text-slate-400 text-xs mt-0.5">Earn badges by practising and improving</p>
      </div>

      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3">
        <p className="text-amber-300 text-xs">Badges are tracked automatically as you practise. Keep going! 🚀</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {ALL_BADGES.map(b => (
          <div
            key={b.code}
            className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4 flex flex-col gap-2 opacity-60"
          >
            <div className="text-3xl">{b.icon}</div>
            <div>
              <p className="text-white text-sm font-semibold">{language === 'ZH' ? b.name_zh : b.name_en}</p>
              <p className="text-slate-400 text-xs mt-0.5 leading-relaxed">{language === 'ZH' ? b.desc_zh : b.desc_en}</p>
            </div>
            <div className="mt-auto">
              <span className="text-[10px] text-slate-500 bg-slate-700/50 rounded-full px-2 py-0.5">Locked</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
