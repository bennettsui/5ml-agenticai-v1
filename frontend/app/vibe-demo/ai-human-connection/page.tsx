'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, ChevronDown, Phone, Users, Ear, Clock, Brain, Heart, Zap, Target, ArrowRight, Building, AlertTriangle, CheckCircle, Mail, MessageSquare, Video } from 'lucide-react';

// ==================== DATA ====================
const caseStudies = [
  {
    id: 'gov-tenders',
    title: 'Government Tenders',
    titleZh: '政府標書',
    action: 'AI drafts initial tender responses from templates',
    actionZh: 'AI從模板草擬初步標書回應',
    result: '70% faster turnaround, team focuses on strategy',
    resultZh: '處理速度快70%，團隊專注策略',
    icon: Building,
  },
  {
    id: 'elderly-services',
    title: 'Elderly Services',
    titleZh: '長者服務',
    action: 'AI handles appointment scheduling & reminders',
    actionZh: 'AI處理預約排程和提醒',
    result: 'Staff spend 3x more time in face-to-face care',
    resultZh: '員工面對面關懷時間增加3倍',
    icon: Heart,
  },
  {
    id: 'ngo-operations',
    title: 'NGO Operations',
    titleZh: '非牟利機構運作',
    action: 'AI automates donor reporting & data entry',
    actionZh: 'AI自動化捐款報告和數據輸入',
    result: 'Volunteers reconnect with beneficiaries',
    resultZh: '義工重新連繫受助者',
    icon: Users,
  },
];

const threeChoices = [
  {
    id: 'factory',
    title: 'Factory Mode',
    titleZh: '工廠模式',
    subtitle: 'Do more of the same',
    subtitleZh: '做更多一樣的事',
    description: 'Use saved time to increase output. More emails, more tasks, more meetings.',
    descriptionZh: '用省下的時間增加產出：更多電郵、更多任務、更多會議。',
    result: 'Burnout. No relationship gains.',
    resultZh: '結果：倦怠。關係沒有改善。',
    color: 'border-slate-300',
    bgColor: 'bg-slate-50',
    emoji: '🏭',
    highlight: false,
  },
  {
    id: 'busy-trap',
    title: 'The Busy Trap',
    titleZh: '忙碌陷阱',
    subtitle: 'Fill with noise',
    subtitleZh: '用雜音填滿',
    description: 'Let distractions absorb the freed time. Social media, notifications, busywork.',
    descriptionZh: '讓分心的事物吸走時間：社交媒體、通知、雜務。',
    result: 'Time vanishes. Nothing changes.',
    resultZh: '結果：時間消失。一切如故。',
    color: 'border-orange-300',
    bgColor: 'bg-orange-50',
    emoji: '📱',
    highlight: false,
  },
  {
    id: 'human-strategy',
    title: 'The Human Strategy',
    titleZh: '人情策略',
    subtitle: 'High-touch behavior',
    subtitleZh: '高接觸行為',
    description: 'Intentionally invest saved time in relationships. Calls, meetings, presence.',
    descriptionZh: '刻意將省下的時間投資在關係上：電話、會面、陪伴。',
    result: 'Deeper connections. Real impact.',
    resultZh: '結果：更深的連繫。真正的影響。',
    color: 'border-teal-400',
    bgColor: 'bg-teal-50',
    emoji: '💚',
    highlight: true,
  },
];

const highTouchActions = [
  { text: 'Phone calls over emails', textZh: '打電話勝過發電郵', icon: Phone, time: '5 min', impact: 'High' },
  { text: 'Face-to-face over Zoom', textZh: '面對面勝過視像會議', icon: Users, time: '30 min', impact: 'Very High' },
  { text: 'Deep listening over fast talking', textZh: '深度聆聽勝過快速說話', icon: Ear, time: '10 min', impact: 'High' },
  { text: 'Handwritten note over email', textZh: '手寫便條勝過電郵', icon: MessageSquare, time: '3 min', impact: 'Medium' },
  { text: 'Walk and talk over meeting room', textZh: '邊走邊談勝過會議室', icon: Heart, time: '15 min', impact: 'High' },
];

const experimentSteps = [
  { step: 'PICK', stepZh: '選擇', description: 'One repetitive admin task', descriptionZh: '一項重複性行政工作', emoji: '🎯' },
  { step: 'DELEGATE', stepZh: '委派', description: 'Hand it to AI', descriptionZh: '交給AI處理', emoji: '🤖' },
  { step: 'BLOCK', stepZh: '預留', description: '15 minutes as "Human Time"', descriptionZh: '15分鐘「人情時間」', emoji: '📅' },
  { step: 'CONNECT', stepZh: '連繫', description: 'Reach out to someone who matters', descriptionZh: '聯絡重要的人', emoji: '💚' },
];

const whyItsTough = [
  {
    icon: Mail,
    stat: '200+',
    unit: 'emails/day',
    title: 'Information Overload',
    titleZh: '資訊過載',
    desc: 'The average professional receives over 200 emails daily, plus notifications from 5+ apps.',
    descZh: '一般專業人士每天收到超過200封電郵，加上5個以上應用程式的通知。',
  },
  {
    icon: Clock,
    stat: '11',
    unit: 'minutes',
    title: 'Time Fragmentation',
    titleZh: '時間碎片化',
    desc: 'Studies show the average focus time before interruption is just 11 minutes.',
    descZh: '研究顯示，在被打斷之前的平均專注時間只有11分鐘。',
  },
  {
    icon: Video,
    stat: '23',
    unit: 'hrs/week',
    title: 'Meeting Overload',
    titleZh: '會議過多',
    desc: 'Managers spend 23 hours per week in meetings—more than half their work time.',
    descZh: '管理層每週花23小時在會議中——超過一半的工作時間。',
  },
  {
    icon: AlertTriangle,
    stat: '70%',
    unit: '',
    title: 'Always-On Culture',
    titleZh: '永遠在線文化',
    desc: '70% of professionals check work emails outside work hours, blurring life boundaries.',
    descZh: '70%的專業人士在工作時間外查看電郵，模糊生活界線。',
  },
];

// ==================== SCROLL PROGRESS INDICATOR ====================
function ScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrolled = (window.scrollY / scrollHeight) * 100;
      setProgress(scrolled);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 h-1 bg-slate-200 z-[100]">
      <div
        className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-all duration-100"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

// ==================== ANIMATED STAT COUNTER ====================
function AnimatedStat({ stat, unit, isVisible }: { stat: string; unit: string; isVisible: boolean }) {
  const [count, setCount] = useState(0);
  const numericStat = parseInt(stat.replace(/[^0-9]/g, '')) || 0;
  const hasPercent = stat.includes('%');

  useEffect(() => {
    if (!isVisible) return;
    let start = 0;
    const duration = 1500;
    const increment = numericStat / (duration / 16);

    const timer = setInterval(() => {
      start += increment;
      if (start >= numericStat) {
        setCount(numericStat);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [isVisible, numericStat]);

  return (
    <div className="flex items-baseline gap-1">
      <span className="text-5xl md:text-6xl font-light text-slate-900 tabular-nums">
        {count}{hasPercent ? '%' : ''}
      </span>
      {unit && <span className="text-lg text-slate-500">{unit}</span>}
    </div>
  );
}

// ==================== MODERN DONUT CHART ====================
function ModernDonut({ isVisible }: { isVisible: boolean }) {
  const [animatedPercent, setAnimatedPercent] = useState(0);
  const targetPercent = 40;

  useEffect(() => {
    if (!isVisible) return;
    let current = 0;
    const timer = setInterval(() => {
      current += 1;
      if (current >= targetPercent) {
        setAnimatedPercent(targetPercent);
        clearInterval(timer);
      } else {
        setAnimatedPercent(current);
      }
    }, 30);
    return () => clearInterval(timer);
  }, [isVisible]);

  const radius = 80;
  const strokeWidth = 12;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - animatedPercent / 100);

  return (
    <div className="relative w-48 h-48">
      <svg viewBox="0 0 200 200" className="w-full h-full -rotate-90">
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth={strokeWidth}
        />
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke="#14b8a6"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-100"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-light text-slate-900">{animatedPercent}%</span>
        <span className="text-sm text-slate-500">admin time</span>
      </div>
    </div>
  );
}

// ==================== LINKEDIN QR CODE ====================
function LinkedInQR() {
  return (
    <svg viewBox="0 0 200 200" className="w-32 h-32 mx-auto">
      <rect width="200" height="200" fill="white" rx="8" />
      <g fill="#0f172a">
        <rect x="20" y="20" width="42" height="42" />
        <rect x="26" y="26" width="30" height="30" fill="white" />
        <rect x="32" y="32" width="18" height="18" />
        <rect x="138" y="20" width="42" height="42" />
        <rect x="144" y="26" width="30" height="30" fill="white" />
        <rect x="150" y="32" width="18" height="18" />
        <rect x="20" y="138" width="42" height="42" />
        <rect x="26" y="144" width="30" height="30" fill="white" />
        <rect x="32" y="150" width="18" height="18" />
        <rect x="68" y="20" width="6" height="6" />
        <rect x="80" y="20" width="6" height="6" />
        <rect x="92" y="20" width="6" height="6" />
        <rect x="104" y="20" width="6" height="6" />
        <rect x="116" y="20" width="6" height="6" />
        <rect x="68" y="32" width="6" height="6" />
        <rect x="86" y="32" width="6" height="6" />
        <rect x="98" y="32" width="6" height="6" />
        <rect x="122" y="32" width="6" height="6" />
        <rect x="68" y="44" width="6" height="6" />
        <rect x="80" y="44" width="6" height="6" />
        <rect x="110" y="44" width="6" height="6" />
        <rect x="122" y="44" width="6" height="6" />
        <rect x="74" y="56" width="6" height="6" />
        <rect x="86" y="56" width="6" height="6" />
        <rect x="98" y="56" width="6" height="6" />
        <rect x="116" y="56" width="6" height="6" />
        <rect x="20" y="68" width="6" height="6" />
        <rect x="32" y="68" width="6" height="6" />
        <rect x="44" y="68" width="6" height="6" />
        <rect x="56" y="68" width="6" height="6" />
        <rect x="68" y="68" width="6" height="6" />
        <rect x="86" y="68" width="6" height="6" />
        <rect x="98" y="68" width="6" height="6" />
        <rect x="116" y="68" width="6" height="6" />
        <rect x="138" y="68" width="6" height="6" />
        <rect x="150" y="68" width="6" height="6" />
        <rect x="168" y="68" width="6" height="6" />
        <rect x="20" y="80" width="6" height="6" />
        <rect x="44" y="80" width="6" height="6" />
        <rect x="68" y="80" width="6" height="6" />
        <rect x="92" y="80" width="6" height="6" />
        <rect x="110" y="80" width="6" height="6" />
        <rect x="138" y="80" width="6" height="6" />
        <rect x="162" y="80" width="6" height="6" />
        <rect x="32" y="92" width="6" height="6" />
        <rect x="56" y="92" width="6" height="6" />
        <rect x="80" y="92" width="6" height="6" />
        <rect x="104" y="92" width="6" height="6" />
        <rect x="122" y="92" width="6" height="6" />
        <rect x="150" y="92" width="6" height="6" />
        <rect x="174" y="92" width="6" height="6" />
        <rect x="20" y="104" width="6" height="6" />
        <rect x="44" y="104" width="6" height="6" />
        <rect x="68" y="104" width="6" height="6" />
        <rect x="86" y="104" width="6" height="6" />
        <rect x="110" y="104" width="6" height="6" />
        <rect x="138" y="104" width="6" height="6" />
        <rect x="156" y="104" width="6" height="6" />
        <rect x="32" y="116" width="6" height="6" />
        <rect x="56" y="116" width="6" height="6" />
        <rect x="74" y="116" width="6" height="6" />
        <rect x="98" y="116" width="6" height="6" />
        <rect x="122" y="116" width="6" height="6" />
        <rect x="144" y="116" width="6" height="6" />
        <rect x="168" y="116" width="6" height="6" />
        <rect x="68" y="138" width="6" height="6" />
        <rect x="86" y="138" width="6" height="6" />
        <rect x="104" y="138" width="6" height="6" />
        <rect x="116" y="138" width="6" height="6" />
        <rect x="68" y="150" width="6" height="6" />
        <rect x="80" y="150" width="6" height="6" />
        <rect x="98" y="150" width="6" height="6" />
        <rect x="122" y="150" width="6" height="6" />
        <rect x="74" y="162" width="6" height="6" />
        <rect x="92" y="162" width="6" height="6" />
        <rect x="110" y="162" width="6" height="6" />
        <rect x="68" y="174" width="6" height="6" />
        <rect x="86" y="174" width="6" height="6" />
        <rect x="104" y="174" width="6" height="6" />
        <rect x="116" y="174" width="6" height="6" />
        <rect x="138" y="138" width="24" height="24" />
        <rect x="144" y="144" width="12" height="12" fill="white" />
        <rect x="147" y="147" width="6" height="6" />
      </g>
      <rect x="80" y="80" width="40" height="40" rx="6" fill="#0A66C2" />
      <text x="100" y="106" textAnchor="middle" fill="white" fontSize="22" fontWeight="bold" fontFamily="system-ui">in</text>
    </svg>
  );
}

// ==================== MAIN COMPONENT ====================
export default function AIHumanConnectionPage() {
  const [scrollY, setScrollY] = useState(0);
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set());
  const [hoveredChoice, setHoveredChoice] = useState<string | null>('human-strategy');
  const [activeZone, setActiveZone] = useState('sweet-spot');

  const containerRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<{ [key: string]: HTMLElement | null }>({});

  const sectionIds = ['hero', 'whytough', 'paradox', 'shallows', 'sweetspot', 'casestudies', 'timetrap', 'threepaths', 'hightouch', 'experiment', 'closing'];

  // Scroll tracking
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Intersection observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleSections((prev) => new Set(prev).add(entry.target.id));
          }
        });
      },
      { threshold: 0.15, rootMargin: '-50px' }
    );

    Object.values(sectionRefs.current).forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, []);

  const scrollToSection = useCallback((sectionId: string) => {
    const section = sectionRefs.current[sectionId];
    if (section) {
      const top = section.offsetTop - 60;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  }, []);

  const scrollToNextSection = useCallback(() => {
    const currentScroll = window.scrollY + window.innerHeight / 3;
    for (let i = 0; i < sectionIds.length; i++) {
      const section = sectionRefs.current[sectionIds[i]];
      if (section && section.offsetTop > currentScroll) {
        scrollToSection(sectionIds[i]);
        break;
      }
    }
  }, [scrollToSection]);

  const isVisible = (id: string) => visibleSections.has(id);

  return (
    <div ref={containerRef} className="min-h-screen bg-slate-50 text-slate-900 font-[system-ui,-apple-system,sans-serif]">
      <ScrollProgress />

      {/* Navigation */}
      <nav className="fixed top-1 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/vibe-demo" className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back</span>
          </Link>
          <div className="text-sm font-medium text-teal-600">
            用好 AI，過好生活
          </div>
        </div>
      </nav>

      {/* Floating Down Button */}
      <button
        onClick={scrollToNextSection}
        className="fixed bottom-8 right-8 z-40 w-12 h-12 rounded-full bg-slate-900 text-white shadow-lg hover:bg-slate-800 transition-all flex items-center justify-center group"
        aria-label="Next section"
      >
        <ChevronDown className="w-5 h-5 group-hover:translate-y-0.5 transition-transform" />
      </button>

      {/* ===== HERO ===== */}
      <section
        id="hero"
        ref={(el) => { sectionRefs.current['hero'] = el; }}
        className="min-h-screen flex items-center justify-center pt-20 px-6"
      >
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-sm font-medium text-teal-600 tracking-wide uppercase mb-6">
            5 Miles Lab
          </p>

          <h1 className="text-5xl md:text-7xl font-light text-slate-900 mb-6 leading-tight tracking-tight">
            用好 AI，過好生活
          </h1>

          <p className="text-2xl md:text-3xl text-slate-600 font-light mb-8">
            AI Mastery for Human Connection
          </p>

          <p className="text-lg text-slate-500 max-w-xl mx-auto mb-4">
            How to automate the mundane<br />so you can design the meaningful
          </p>

          <p className="text-base text-slate-400 mb-12">
            讓機器處理瑣碎，讓人心專注意義
          </p>

          <p className="text-sm text-slate-400 mb-16">
            Bennet Tsui · Founder, 5 Miles Lab
          </p>

          <button
            onClick={() => scrollToSection('whytough')}
            className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors group"
          >
            <span className="text-sm">Start reading</span>
            <ChevronDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
          </button>
        </div>
      </section>

      {/* ===== WHY IT'S TOUGH - Scrollytelling Style ===== */}
      <section
        id="whytough"
        ref={(el) => { sectionRefs.current['whytough'] = el; }}
        className="py-32 px-6 bg-white"
      >
        <div className="max-w-5xl mx-auto">
          <div className={`text-center mb-20 transition-all duration-700 ${isVisible('whytough') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <h2 className="text-3xl md:text-5xl font-light text-slate-900 mb-4">
              Why connection is so hard
            </h2>
            <p className="text-xl text-teal-600 mb-4">為什麼連繫這麼難？</p>
            <p className="text-slate-500 max-w-lg mx-auto">
              Modern life fragments our attention into thousands of pieces.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {whyItsTough.map((item, idx) => (
              <div
                key={item.title}
                className={`group p-8 rounded-2xl bg-slate-50 border border-slate-100 hover:border-teal-200 hover:bg-white transition-all duration-500 ${
                  isVisible('whytough') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
                style={{ transitionDelay: `${idx * 100 + 200}ms` }}
              >
                <div className="flex items-start gap-6">
                  <div className="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center flex-shrink-0 group-hover:bg-teal-200 transition-colors">
                    <item.icon className="w-6 h-6 text-teal-600" />
                  </div>
                  <div className="flex-1">
                    <AnimatedStat stat={item.stat} unit={item.unit} isVisible={isVisible('whytough')} />
                    <h3 className="text-lg font-medium text-slate-900 mt-3 mb-1">{item.title}</h3>
                    <p className="text-sm text-teal-600 mb-3">{item.titleZh}</p>
                    <p className="text-sm text-slate-600 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== THE PARADOX ===== */}
      <section
        id="paradox"
        ref={(el) => { sectionRefs.current['paradox'] = el; }}
        className="py-32 px-6"
      >
        <div className="max-w-4xl mx-auto">
          <div className={`transition-all duration-700 ${isVisible('paradox') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <h2 className="text-3xl md:text-5xl font-light text-slate-900 text-center mb-4">
              The Paradox of Progress
            </h2>
            <p className="text-xl text-center text-teal-600 mb-16">進步的悖論</p>

            <div className="bg-white rounded-2xl p-8 md:p-12 border border-slate-200 mb-12">
              <p className="text-xl md:text-2xl text-slate-700 text-center leading-relaxed font-light italic">
                "Last month, how many times did you sit down with someone for 10+ minutes without checking your phone?"
              </p>
              <p className="text-lg text-center text-slate-500 mt-4 italic">
                「上個月，你有多少次和人坐下來10分鐘以上，而沒有看手機？」
              </p>
            </div>

            <div className="text-center">
              <p className="text-slate-600 max-w-2xl mx-auto leading-relaxed">
                Whether we earn less or more, our attention is being pulled away from the people who matter most. The tools meant to connect us have become the walls between us.
              </p>
              <p className="text-slate-500 mt-4">
                無論收入高低，我們的注意力都在遠離最重要的人。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== DROWNING IN SHALLOWS ===== */}
      <section
        id="shallows"
        ref={(el) => { sectionRefs.current['shallows'] = el; }}
        className="py-32 px-6 bg-white"
      >
        <div className="max-w-5xl mx-auto">
          <div className={`transition-all duration-700 ${isVisible('shallows') ? 'opacity-100' : 'opacity-0'}`}>
            <h2 className="text-3xl md:text-5xl font-light text-slate-900 text-center mb-4">
              Drowning in the Shallows
            </h2>
            <p className="text-xl text-center text-teal-600 mb-6">淹沒在瑣碎之中</p>
            <p className="text-center text-slate-500 mb-16 max-w-lg mx-auto">
              The hidden cost of repetitive admin work
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className={`flex justify-center transition-all duration-700 delay-200 ${isVisible('shallows') ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}`}>
              <ModernDonut isVisible={isVisible('shallows')} />
            </div>

            <div className={`space-y-6 transition-all duration-700 delay-400 ${isVisible('shallows') ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`}>
              {[
                { en: '40% of work time spent on repetitive admin tasks', zh: '40%工作時間花在重複性行政' },
                { en: 'Only 30 out of 40 hours truly productive', zh: '40小時中只有30小時真正有生產力' },
                { en: '75% feel time is wasted on tasks that could be automated', zh: '75%人覺得時間浪費在可自動化的任務上' },
              ].map((stat, idx) => (
                <div key={idx} className="flex items-start gap-4 p-5 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="w-2 h-2 rounded-full bg-teal-500 mt-2 flex-shrink-0" />
                  <div>
                    <p className="text-slate-800 font-medium">{stat.en}</p>
                    <p className="text-slate-500 text-sm mt-1">{stat.zh}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== SWEET SPOT ===== */}
      <section
        id="sweetspot"
        ref={(el) => { sectionRefs.current['sweetspot'] = el; }}
        className="py-32 px-6"
      >
        <div className="max-w-4xl mx-auto">
          <div className={`text-center mb-16 transition-all duration-700 ${isVisible('sweetspot') ? 'opacity-100' : 'opacity-0'}`}>
            <h2 className="text-3xl md:text-5xl font-light text-slate-900 mb-4">
              The Sweet Spot of AI Adoption
            </h2>
            <p className="text-xl text-teal-600 mb-4">AI應用的甜蜜點</p>
            <p className="text-slate-500">Click each zone to learn more</p>
          </div>

          <div className={`flex flex-col md:flex-row gap-4 mb-8 transition-all duration-700 delay-200 ${isVisible('sweetspot') ? 'opacity-100' : 'opacity-0'}`}>
            {[
              { id: 'trough', label: 'The Trough', labelZh: '低谷', level: '0-1', desc: '"AI? Not my thing."', emoji: '😴' },
              { id: 'sweet-spot', label: 'Sweet Spot', labelZh: '甜蜜點', level: '2-3', desc: 'Real problems: emails, summaries', emoji: '🎯' },
              { id: 'frontier', label: 'The Frontier', labelZh: '前沿', level: '4-6', desc: 'Tokens, RAG, AGI...', emoji: '🚀' },
            ].map((zone) => (
              <button
                key={zone.id}
                onClick={() => setActiveZone(zone.id)}
                className={`flex-1 p-6 rounded-xl border-2 text-left transition-all ${
                  activeZone === zone.id
                    ? zone.id === 'sweet-spot'
                      ? 'border-teal-500 bg-teal-50'
                      : 'border-slate-300 bg-slate-50'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <span className="text-2xl mb-2 block">{zone.emoji}</span>
                <h3 className={`font-medium ${activeZone === zone.id && zone.id === 'sweet-spot' ? 'text-teal-700' : 'text-slate-800'}`}>
                  {zone.label}
                </h3>
                <p className="text-sm text-slate-500">{zone.labelZh}</p>
                <p className="text-xs text-slate-400 mt-2">{zone.desc}</p>
              </button>
            ))}
          </div>

          <div className="p-6 bg-teal-50 border border-teal-200 rounded-xl text-center">
            <p className="text-teal-800">
              You don't need to be a coder. The goal is simply moving from Stage 1 to Stage 2.
            </p>
            <p className="text-teal-600 text-sm mt-2">
              你不需要會寫程式。目標只是從第1階段進到第2階段。
            </p>
          </div>
        </div>
      </section>

      {/* ===== CASE STUDIES ===== */}
      <section
        id="casestudies"
        ref={(el) => { sectionRefs.current['casestudies'] = el; }}
        className="py-32 px-6 bg-white"
      >
        <div className="max-w-5xl mx-auto">
          <div className={`text-center mb-16 transition-all duration-700 ${isVisible('casestudies') ? 'opacity-100' : 'opacity-0'}`}>
            <h2 className="text-3xl md:text-5xl font-light text-slate-900 mb-4">
              When the Machine Types,<br />the Human Can Listen
            </h2>
            <p className="text-xl text-teal-600 mb-4">當機器打字，人可以聆聽</p>
            <p className="text-slate-500">機器講效率，人講心</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {caseStudies.map((study, idx) => (
              <div
                key={study.id}
                className={`p-6 rounded-xl bg-slate-50 border border-slate-100 hover:border-teal-200 transition-all duration-500 ${
                  isVisible('casestudies') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
                style={{ transitionDelay: `${idx * 100 + 200}ms` }}
              >
                <div className="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center mb-4">
                  <study.icon className="w-6 h-6 text-teal-600" />
                </div>
                <h3 className="text-lg font-medium text-slate-900 mb-1">{study.title}</h3>
                <p className="text-sm text-teal-600 mb-4">{study.titleZh}</p>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-xs text-slate-400 uppercase tracking-wide">Action</span>
                    <p className="text-slate-600">{study.action}</p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 uppercase tracking-wide">Result</span>
                    <p className="text-slate-800 font-medium">{study.result}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== TIME SAVED TRAP ===== */}
      <section
        id="timetrap"
        ref={(el) => { sectionRefs.current['timetrap'] = el; }}
        className="py-32 px-6"
      >
        <div className="max-w-4xl mx-auto">
          <div className={`text-center mb-16 transition-all duration-700 ${isVisible('timetrap') ? 'opacity-100' : 'opacity-0'}`}>
            <h2 className="text-3xl md:text-5xl font-light text-slate-900 mb-4">
              The "Time Saved" Trap
            </h2>
            <p className="text-xl text-teal-600">「省下時間」的陷阱</p>
          </div>

          <div className={`max-w-2xl mx-auto space-y-8 transition-all duration-700 delay-200 ${isVisible('timetrap') ? 'opacity-100' : 'opacity-0'}`}>
            <div className="text-center">
              <p className="text-2xl text-slate-700 font-light">
                GenAI users already save <span className="text-teal-600 font-medium">2–4 hours per week</span>.
              </p>
              <p className="text-slate-500 mt-2">GenAI用戶已經每週節省2-4小時。</p>
            </div>

            <div className="text-center">
              <p className="text-xl text-slate-600">
                But without intentional design, saved time doesn't lead to freedom.
              </p>
              <p className="text-slate-500 text-sm mt-2">
                但沒有刻意設計，省下的時間不會帶來自由。
              </p>
            </div>

            <div className="p-6 bg-amber-50 border border-amber-200 rounded-xl">
              <p className="text-amber-800 font-medium text-center">
                Parkinson's Law 帕金森定律
              </p>
              <p className="text-amber-700 text-center mt-2">
                Work expands to fill the time available.
              </p>
              <p className="text-amber-600 text-sm text-center mt-1">
                工作會膨脹到填滿所有可用時間。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== THREE PATHS ===== */}
      <section
        id="threepaths"
        ref={(el) => { sectionRefs.current['threepaths'] = el; }}
        className="py-32 px-6 bg-white"
      >
        <div className="max-w-5xl mx-auto">
          <div className={`text-center mb-16 transition-all duration-700 ${isVisible('threepaths') ? 'opacity-100' : 'opacity-0'}`}>
            <h2 className="text-3xl md:text-5xl font-light text-slate-900 mb-4">
              Three Paths for Your Saved Hours
            </h2>
            <p className="text-xl text-teal-600">省下時間的三條路</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {threeChoices.map((choice, idx) => (
              <div
                key={choice.id}
                className={`relative transition-all duration-500 ${
                  isVisible('threepaths') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
                style={{ transitionDelay: `${idx * 100 + 200}ms` }}
                onMouseEnter={() => setHoveredChoice(choice.id)}
                onMouseLeave={() => setHoveredChoice('human-strategy')}
              >
                <div className={`h-full p-6 rounded-xl border-2 transition-all ${choice.color} ${choice.bgColor} ${
                  hoveredChoice === choice.id ? 'shadow-lg scale-[1.02]' : ''
                } ${choice.highlight ? 'ring-2 ring-teal-500 ring-offset-2' : ''}`}>
                  <span className="text-3xl mb-4 block">{choice.emoji}</span>
                  <h3 className="text-lg font-medium text-slate-900 mb-1">{choice.title}</h3>
                  <p className="text-sm text-teal-600 mb-2">{choice.titleZh}</p>
                  <p className="text-xs text-slate-500 mb-4">{choice.subtitle}</p>
                  <p className="text-sm text-slate-600 mb-4">{choice.description}</p>
                  <div className={`p-3 rounded-lg ${choice.highlight ? 'bg-teal-100' : 'bg-white/50'}`}>
                    <p className={`text-sm font-medium ${choice.highlight ? 'text-teal-700' : 'text-slate-600'}`}>
                      {choice.result}
                    </p>
                    <p className={`text-xs mt-1 ${choice.highlight ? 'text-teal-600' : 'text-slate-500'}`}>
                      {choice.resultZh}
                    </p>
                  </div>
                </div>

                {/* Arrow connecting to next section */}
                {choice.highlight && (
                  <div className="hidden md:block absolute -bottom-16 left-1/2 -translate-x-1/2">
                    <div className="w-0.5 h-12 bg-gradient-to-b from-teal-500 to-transparent" />
                    <ChevronDown className="w-5 h-5 text-teal-500 -ml-[9px]" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== HIGH TOUCH - Connected from Three Paths ===== */}
      <section
        id="hightouch"
        ref={(el) => { sectionRefs.current['hightouch'] = el; }}
        className="py-32 px-6"
      >
        <div className="max-w-5xl mx-auto">
          <div className={`text-center mb-4 transition-all duration-700 ${isVisible('hightouch') ? 'opacity-100' : 'opacity-0'}`}>
            <p className="text-sm font-medium text-teal-600 uppercase tracking-wide mb-4">The Human Strategy in Practice</p>
            <h2 className="text-3xl md:text-5xl font-light text-slate-900 mb-4">
              The Philosophy of High-Touch
            </h2>
            <p className="text-xl text-teal-600 mb-6">高接觸的哲學</p>
            <p className="text-slate-500 max-w-lg mx-auto">
              Small moments of genuine connection have outsized impact.
            </p>
          </div>

          <div className={`mt-16 transition-all duration-700 delay-200 ${isVisible('hightouch') ? 'opacity-100' : 'opacity-0'}`}>
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left p-4 text-sm font-medium text-slate-600">Action 行動</th>
                    <th className="text-left p-4 text-sm font-medium text-slate-600 hidden md:table-cell">Time</th>
                    <th className="text-left p-4 text-sm font-medium text-slate-600 hidden md:table-cell">Impact</th>
                  </tr>
                </thead>
                <tbody>
                  {highTouchActions.map((item, idx) => (
                    <tr key={idx} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center">
                            <item.icon className="w-5 h-5 text-teal-600" />
                          </div>
                          <div>
                            <p className="text-slate-800 font-medium">{item.text}</p>
                            <p className="text-slate-500 text-sm">{item.textZh}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-slate-600 hidden md:table-cell">{item.time}</td>
                      <td className="p-4 hidden md:table-cell">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          item.impact === 'Very High' ? 'bg-teal-100 text-teal-700' :
                          item.impact === 'High' ? 'bg-emerald-100 text-emerald-700' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {item.impact}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-8 grid md:grid-cols-2 gap-6">
              <div className="p-6 rounded-xl bg-teal-50 border border-teal-200">
                <div className="text-4xl font-light text-teal-700 mb-2">88%</div>
                <p className="text-slate-600">satisfaction with human service</p>
                <p className="text-slate-500 text-sm">人工服務滿意度</p>
              </div>
              <div className="p-6 rounded-xl bg-slate-100 border border-slate-200">
                <div className="text-4xl font-light text-slate-500 mb-2">60%</div>
                <p className="text-slate-600">satisfaction with AI service</p>
                <p className="text-slate-500 text-sm">AI服務滿意度</p>
              </div>
            </div>

            <p className="text-center text-slate-600 italic mt-8">
              "AI satisfies the task. Humans satisfy the soul."
            </p>
            <p className="text-center text-slate-500 text-sm italic mt-2">
              「AI滿足任務。人滿足心靈。」
            </p>
          </div>
        </div>
      </section>

      {/* ===== EXPERIMENT ===== */}
      <section
        id="experiment"
        ref={(el) => { sectionRefs.current['experiment'] = el; }}
        className="py-32 px-6 bg-white"
      >
        <div className="max-w-4xl mx-auto">
          <div className={`text-center mb-16 transition-all duration-700 ${isVisible('experiment') ? 'opacity-100' : 'opacity-0'}`}>
            <h2 className="text-3xl md:text-5xl font-light text-slate-900 mb-4">
              A One-Week Experiment
            </h2>
            <p className="text-xl text-teal-600 mb-4">一週實驗</p>
            <p className="text-slate-500">Try it this week</p>
          </div>

          <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 transition-all duration-700 delay-200 ${isVisible('experiment') ? 'opacity-100' : 'opacity-0'}`}>
            {experimentSteps.map((step, idx) => (
              <div
                key={step.step}
                className="text-center p-6 rounded-xl bg-slate-50 border border-slate-100 hover:border-teal-200 transition-all"
                style={{ transitionDelay: `${idx * 100 + 300}ms` }}
              >
                <span className="text-3xl mb-3 block">{step.emoji}</span>
                <div className="w-8 h-8 mx-auto mb-3 rounded-full bg-teal-500 text-white flex items-center justify-center text-sm font-medium">
                  {idx + 1}
                </div>
                <h3 className="font-medium text-slate-900">{step.step}</h3>
                <p className="text-sm text-teal-600">{step.stepZh}</p>
                <p className="text-xs text-slate-500 mt-2">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CLOSING ===== */}
      <section
        id="closing"
        ref={(el) => { sectionRefs.current['closing'] = el; }}
        className="py-32 px-6"
      >
        <div className="max-w-3xl mx-auto text-center">
          <h2 className={`text-4xl md:text-6xl font-light text-slate-900 mb-4 transition-all duration-700 ${isVisible('closing') ? 'opacity-100' : 'opacity-0'}`}>
            用好 AI，過好生活
          </h2>
          <p className="text-2xl text-slate-600 font-light mb-8">
            AI Speed, Human Direction
          </p>

          <p className="text-lg text-slate-600 mb-2">
            AI makes us faster. But speed is useless without direction.
          </p>
          <p className="text-slate-500 mb-8">
            AI讓我們更快。但沒有方向的速度毫無意義。
          </p>

          <p className="text-lg text-teal-600 mb-16">
            Let's use this speed to get back to the people who matter.
          </p>

          <div className="inline-block p-8 bg-white rounded-2xl border border-slate-200">
            <p className="text-lg font-medium text-slate-800 mb-1">Bennet Tsui</p>
            <p className="text-teal-600 mb-6">Founder, 5 Miles Lab</p>

            <LinkedInQR />

            <p className="text-sm text-slate-500 mt-4">Scan to connect on LinkedIn</p>
            <a
              href="https://www.linkedin.com/in/bennettsui/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-teal-600 hover:text-teal-700 mt-2 block"
            >
              linkedin.com/in/bennettsui
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-slate-200 bg-white">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <p className="text-slate-500 text-sm">
            用好 AI，過好生活 · AI Mastery for Human Connection
          </p>
          <p className="text-teal-600 text-sm mt-1">
            5 Miles Lab
          </p>
        </div>
      </footer>
    </div>
  );
}
