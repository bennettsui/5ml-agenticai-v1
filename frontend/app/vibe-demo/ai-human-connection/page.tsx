'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, ChevronDown, Phone, Users, Ear, Clock, Brain, Heart, Zap, ArrowRight, Building, AlertTriangle, Mail, MessageSquare, Video, Sparkles, Target, Coffee } from 'lucide-react';

// ==================== DATA ====================
const caseStudies = [
  {
    id: 'gov-tenders',
    title: 'Government Tenders',
    titleZh: '政府標書',
    action: 'AI drafts initial tender responses from templates',
    actionZh: 'AI從模板草擬初步標書回應',
    result: '70% faster turnaround',
    resultZh: '處理速度快70%',
    icon: Building,
  },
  {
    id: 'elderly-services',
    title: 'Elderly Services',
    titleZh: '長者服務',
    action: 'AI handles scheduling & reminders',
    actionZh: 'AI處理預約和提醒',
    result: '3x more face-to-face time',
    resultZh: '面對面時間增加3倍',
    icon: Heart,
  },
  {
    id: 'ngo-operations',
    title: 'NGO Operations',
    titleZh: '非牟利機構',
    action: 'AI automates donor reporting',
    actionZh: 'AI自動化捐款報告',
    result: 'Volunteers reconnect',
    resultZh: '義工重新連繫',
    icon: Users,
  },
];

const threeChoices = [
  {
    id: 'factory',
    title: 'Factory Mode',
    titleZh: '工廠模式',
    description: 'Do more of the same. More emails, more tasks.',
    descriptionZh: '做更多一樣的事。',
    result: 'Burnout.',
    emoji: '🏭',
    highlight: false,
  },
  {
    id: 'busy-trap',
    title: 'The Busy Trap',
    titleZh: '忙碌陷阱',
    description: 'Fill freed time with distractions.',
    descriptionZh: '用分心填滿時間。',
    result: 'Nothing changes.',
    emoji: '📱',
    highlight: false,
  },
  {
    id: 'human-strategy',
    title: 'Human Strategy',
    titleZh: '人情策略',
    description: 'Invest in relationships intentionally.',
    descriptionZh: '刻意投資在關係上。',
    result: 'Real impact.',
    emoji: '💚',
    highlight: true,
  },
];

const highTouchActions = [
  { text: 'Phone calls over emails', textZh: '打電話勝過發電郵', icon: Phone },
  { text: 'Face-to-face over Zoom', textZh: '面對面勝過視像', icon: Users },
  { text: 'Deep listening', textZh: '深度聆聽', icon: Ear },
  { text: 'Handwritten notes', textZh: '手寫便條', icon: MessageSquare },
  { text: 'Walk and talk', textZh: '邊走邊談', icon: Coffee },
];

const whyItsTough = [
  { stat: '200+', unit: 'emails/day', title: '資訊過載', icon: Mail },
  { stat: '11', unit: 'min focus', title: '時間碎片', icon: Clock },
  { stat: '23', unit: 'hrs meetings', title: '會議過多', icon: Video },
  { stat: '70%', unit: 'always on', title: '永遠在線', icon: AlertTriangle },
];

// ==================== FLOATING PARTICLES ====================
function FloatingParticles() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 bg-emerald-500/30 rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animation: `float-particle ${8 + Math.random() * 12}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 5}s`,
          }}
        />
      ))}
      <style jsx>{`
        @keyframes float-particle {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.3; }
          25% { transform: translate(${Math.random() * 100 - 50}px, ${Math.random() * 100 - 50}px) scale(1.5); opacity: 0.6; }
          50% { transform: translate(${Math.random() * 100 - 50}px, ${Math.random() * 100 - 50}px) scale(1); opacity: 0.4; }
          75% { transform: translate(${Math.random() * 100 - 50}px, ${Math.random() * 100 - 50}px) scale(1.2); opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}

// ==================== TYPING EFFECT ====================
function TypingText({ text, className = '', delay = 0 }: { text: string; className?: string; delay?: number }) {
  const [displayed, setDisplayed] = useState('');
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const startTimer = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(startTimer);
  }, [delay]);

  useEffect(() => {
    if (!started) return;
    let i = 0;
    const timer = setInterval(() => {
      if (i <= text.length) {
        setDisplayed(text.slice(0, i));
        i++;
      } else {
        clearInterval(timer);
      }
    }, 50);
    return () => clearInterval(timer);
  }, [text, started]);

  return (
    <span className={className}>
      {displayed}
      {displayed.length < text.length && started && (
        <span className="animate-pulse">|</span>
      )}
    </span>
  );
}

// ==================== ANIMATED COUNTER ====================
function AnimatedCounter({ value, suffix = '', duration = 2000 }: { value: number; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isVisible) {
          setIsVisible(true);
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible) return;
    let start = 0;
    const increment = value / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [isVisible, value, duration]);

  return <span ref={ref}>{count}{suffix}</span>;
}

// ==================== PULSE RING ====================
function PulseRing({ children, color = 'emerald' }: { children: React.ReactNode; color?: string }) {
  return (
    <div className="relative">
      <div className={`absolute inset-0 rounded-full bg-${color}-500/20 animate-ping`} style={{ animationDuration: '2s' }} />
      <div className={`absolute inset-0 rounded-full bg-${color}-500/10 animate-pulse`} />
      {children}
    </div>
  );
}

// ==================== INTERACTIVE CARD ====================
function InteractiveCard({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const [isHovered, setIsHovered] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePos({
      x: ((e.clientX - rect.left) / rect.width - 0.5) * 20,
      y: ((e.clientY - rect.top) / rect.height - 0.5) * 20,
    });
  };

  return (
    <div
      ref={cardRef}
      className={`transition-all duration-300 ${className}`}
      style={{
        transform: isHovered
          ? `perspective(1000px) rotateY(${mousePos.x}deg) rotateX(${-mousePos.y}deg) scale(1.02)`
          : 'perspective(1000px) rotateY(0) rotateX(0) scale(1)',
        transitionDelay: `${delay}ms`,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseMove={handleMouseMove}
    >
      {children}
      {isHovered && (
        <div
          className="absolute inset-0 pointer-events-none rounded-2xl"
          style={{
            background: `radial-gradient(circle at ${(mousePos.x + 10) * 5}% ${(mousePos.y + 10) * 5}%, rgba(16, 185, 129, 0.15), transparent 50%)`,
          }}
        />
      )}
    </div>
  );
}

// ==================== SCROLL PROGRESS ====================
function ScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      setProgress((window.scrollY / scrollHeight) * 100);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 h-1 bg-slate-800 z-[100]">
      <div
        className="h-full bg-gradient-to-r from-emerald-500 via-cyan-500 to-emerald-500 transition-all duration-150"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

// ==================== STICKY NARRATIVE SECTION ====================
function StickyNarrative({
  title,
  titleZh,
  paragraphs,
  visual
}: {
  title: string;
  titleZh: string;
  paragraphs: { en: string; zh: string }[];
  visual: React.ReactNode;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const paragraphRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = paragraphRefs.current.indexOf(entry.target as HTMLDivElement);
            if (index !== -1) setActiveIndex(index);
          }
        });
      },
      { threshold: 0.7, rootMargin: '-20% 0px -20% 0px' }
    );

    paragraphRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <div className="grid md:grid-cols-2 gap-8 md:gap-16">
        {/* Sticky Visual */}
        <div className="hidden md:block">
          <div className="sticky top-32">
            <h2 className="text-3xl md:text-4xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">
              {title}
            </h2>
            <p className="text-xl text-emerald-400/80 mb-8">{titleZh}</p>
            <div className="relative">
              {visual}
              {/* Progress dots */}
              <div className="flex gap-2 mt-8">
                {paragraphs.map((_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      i === activeIndex ? 'bg-emerald-400 scale-125' : 'bg-slate-600'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Scrolling Text */}
        <div className="space-y-[50vh]">
          <div className="md:hidden mb-8">
            <h2 className="text-3xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">
              {title}
            </h2>
            <p className="text-lg text-emerald-400/80">{titleZh}</p>
          </div>
          {paragraphs.map((p, i) => (
            <div
              key={i}
              ref={(el) => { paragraphRefs.current[i] = el; }}
              className={`transition-all duration-500 ${
                i === activeIndex ? 'opacity-100 translate-x-0' : 'opacity-30 translate-x-4'
              }`}
            >
              <p className="text-xl md:text-2xl text-slate-200 leading-relaxed mb-4">
                {p.en}
              </p>
              <p className="text-lg text-slate-400">
                {p.zh}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ==================== LINKEDIN QR ====================
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
      <text x="100" y="106" textAnchor="middle" fill="white" fontSize="22" fontWeight="bold">in</text>
    </svg>
  );
}

// ==================== MAIN COMPONENT ====================
export default function AIHumanConnectionPage() {
  const [scrollY, setScrollY] = useState(0);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set());
  const [activeChoice, setActiveChoice] = useState('human-strategy');

  const containerRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<{ [key: string]: HTMLElement | null }>({});
  const sectionIds = ['hero', 'problem', 'whytough', 'solution', 'casestudies', 'threepaths', 'hightouch', 'experiment', 'closing'];

  // Scroll and mouse tracking
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight });
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleMouseMove);
    };
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
      { threshold: 0.1 }
    );
    Object.values(sectionRefs.current).forEach((ref) => {
      if (ref) observer.observe(ref);
    });
    return () => observer.disconnect();
  }, []);

  const scrollToNextSection = useCallback(() => {
    const currentScroll = window.scrollY + 100;
    for (let i = 0; i < sectionIds.length; i++) {
      const section = sectionRefs.current[sectionIds[i]];
      if (section && section.offsetTop > currentScroll) {
        window.scrollTo({ top: section.offsetTop - 60, behavior: 'smooth' });
        break;
      }
    }
  }, []);

  const isVisible = (id: string) => visibleSections.has(id);

  return (
    <div ref={containerRef} className="min-h-screen bg-slate-950 text-white overflow-hidden">
      <ScrollProgress />
      <FloatingParticles />

      {/* Parallax Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div
          className="absolute w-[800px] h-[800px] rounded-full bg-gradient-to-br from-emerald-500/10 to-cyan-500/5 blur-3xl"
          style={{
            left: '10%',
            top: '10%',
            transform: `translate(${mousePos.x * 50 - 25}px, ${scrollY * 0.1}px)`,
          }}
        />
        <div
          className="absolute w-[600px] h-[600px] rounded-full bg-gradient-to-br from-purple-500/10 to-pink-500/5 blur-3xl"
          style={{
            right: '10%',
            bottom: '20%',
            transform: `translate(${mousePos.x * -30 + 15}px, ${scrollY * -0.05}px)`,
          }}
        />
      </div>

      {/* Navigation */}
      <nav className="fixed top-1 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/vibe-demo" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm">Back</span>
          </Link>
          <div className="flex items-center gap-2 text-sm">
            <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span className="text-emerald-400 font-medium">用好 AI，過好生活</span>
          </div>
        </div>
      </nav>

      {/* Floating Down Button */}
      <button
        onClick={scrollToNextSection}
        className="fixed bottom-8 right-8 z-40 w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/50 hover:scale-110 transition-all flex items-center justify-center group"
      >
        <ChevronDown className="w-6 h-6 group-hover:translate-y-1 transition-transform" />
      </button>

      {/* ===== HERO ===== */}
      <section
        id="hero"
        ref={(el) => { sectionRefs.current['hero'] = el; }}
        className="min-h-screen flex items-center justify-center pt-20 px-6 relative"
      >
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="relative">
              <Brain className="w-10 h-10 text-emerald-400" />
              <div className="absolute inset-0 bg-emerald-400/30 blur-xl animate-pulse" />
            </div>
            <span className="text-emerald-400 font-medium tracking-widest uppercase text-sm">5 Miles Lab</span>
            <div className="relative">
              <Heart className="w-10 h-10 text-pink-400" />
              <div className="absolute inset-0 bg-pink-400/30 blur-xl animate-pulse" />
            </div>
          </div>

          <h1
            className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-400 animate-gradient"
            style={{
              backgroundSize: '200% auto',
              animation: 'gradient 4s linear infinite',
            }}
          >
            用好 AI，過好生活
          </h1>

          <p className="text-2xl md:text-3xl text-slate-300 font-light mb-4">
            <TypingText text="AI Mastery for Human Connection" delay={500} />
          </p>

          <p className="text-lg text-slate-400 max-w-xl mx-auto mb-4">
            How to automate the mundane so you can design the meaningful
          </p>
          <p className="text-slate-500 mb-12">
            讓機器處理瑣碎，讓人心專注意義
          </p>

          <p className="text-sm text-slate-500 mb-16">
            Bennet Tsui · Founder, 5 Miles Lab
          </p>

          <button
            onClick={scrollToNextSection}
            className="inline-flex items-center gap-2 px-6 py-3 bg-white/5 backdrop-blur border border-white/10 rounded-full hover:bg-white/10 hover:border-emerald-500/50 transition-all group"
          >
            <span className="text-sm text-slate-300">Begin the story</span>
            <ChevronDown className="w-4 h-4 text-emerald-400 group-hover:translate-y-1 transition-transform" />
          </button>
        </div>

        {/* Scroll indicator */}
        <div
          className="absolute bottom-12 left-1/2 -translate-x-1/2"
          style={{ opacity: Math.max(0, 1 - scrollY / 300) }}
        >
          <div className="w-6 h-10 rounded-full border-2 border-slate-600 flex justify-center pt-2">
            <div className="w-1.5 h-3 bg-emerald-400 rounded-full animate-bounce" />
          </div>
        </div>

        <style jsx>{`
          @keyframes gradient {
            0% { background-position: 0% center; }
            100% { background-position: 200% center; }
          }
        `}</style>
      </section>

      {/* ===== THE PROBLEM - Sticky Narrative ===== */}
      <section
        id="problem"
        ref={(el) => { sectionRefs.current['problem'] = el; }}
        className="py-32 px-6"
      >
        <div className="max-w-5xl mx-auto">
          <StickyNarrative
            title="The Paradox of Progress"
            titleZh="進步的悖論"
            paragraphs={[
              {
                en: "Last month, how many times did you sit down with someone for 10+ minutes without checking your phone?",
                zh: "上個月，你有多少次和人坐下來10分鐘以上，而沒有看手機？"
              },
              {
                en: "We have more tools to connect than ever. Yet we feel more isolated. The technology meant to bring us together has become the wall between us.",
                zh: "我們有比以往更多的連繫工具。但我們感覺更加孤立。本應拉近我們的科技，成了我們之間的牆。"
              },
              {
                en: "Whether we earn less or more, our attention is constantly pulled away from the people who matter most.",
                zh: "無論收入高低，我們的注意力都在不斷遠離最重要的人。"
              },
            ]}
            visual={
              <div className="relative h-64 flex items-center justify-center">
                <div className="absolute w-32 h-32 rounded-full border-2 border-emerald-500/30 animate-ping" style={{ animationDuration: '3s' }} />
                <div className="absolute w-48 h-48 rounded-full border border-cyan-500/20 animate-ping" style={{ animationDuration: '4s', animationDelay: '1s' }} />
                <div className="relative">
                  <div className="text-6xl">🤳</div>
                  <div className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full animate-pulse" />
                </div>
              </div>
            }
          />
        </div>
      </section>

      {/* ===== WHY IT'S TOUGH - Stats Grid ===== */}
      <section
        id="whytough"
        ref={(el) => { sectionRefs.current['whytough'] = el; }}
        className="py-32 px-6 bg-slate-900/50"
      >
        <div className="max-w-5xl mx-auto">
          <div className={`text-center mb-16 transition-all duration-700 ${isVisible('whytough') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <h2 className="text-3xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">
              Why connection is so hard
            </h2>
            <p className="text-xl text-emerald-400/80">為什麼連繫這麼難？</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {whyItsTough.map((item, idx) => (
              <InteractiveCard
                key={item.title}
                delay={idx * 100}
                className={`relative p-6 rounded-2xl bg-slate-800/50 border border-slate-700/50 backdrop-blur transition-all duration-700 ${
                  isVisible('whytough') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
              >
                <item.icon className="w-8 h-8 text-emerald-400 mb-4" />
                <div className="text-4xl md:text-5xl font-bold text-white mb-1">
                  <AnimatedCounter value={parseInt(item.stat)} suffix={item.stat.includes('%') ? '%' : ''} />
                </div>
                <p className="text-sm text-slate-400">{item.unit}</p>
                <p className="text-xs text-emerald-400/80 mt-2">{item.title}</p>
              </InteractiveCard>
            ))}
          </div>
        </div>
      </section>

      {/* ===== THE SOLUTION - Sticky Narrative ===== */}
      <section
        id="solution"
        ref={(el) => { sectionRefs.current['solution'] = el; }}
        className="py-32 px-6"
      >
        <div className="max-w-5xl mx-auto">
          <StickyNarrative
            title="The Sweet Spot"
            titleZh="AI的甜蜜點"
            paragraphs={[
              {
                en: "You don't need to become a coder. You don't need to understand tokens, RAG, or AGI.",
                zh: "你不需要成為程式員。你不需要理解tokens、RAG或AGI。"
              },
              {
                en: "The goal is simply moving from Stage 1 to Stage 2: using AI for real problems like emails, summaries, and repetitive tasks.",
                zh: "目標只是從第1階段進到第2階段：用AI處理實際問題，如電郵、摘要和重複性任務。"
              },
              {
                en: "GenAI users already save 2-4 hours per week. The question is: what will you do with that time?",
                zh: "GenAI用戶每週已節省2-4小時。問題是：你會用那些時間做什麼？"
              },
            ]}
            visual={
              <div className="space-y-4">
                {['😴 The Trough', '🎯 Sweet Spot', '🚀 The Frontier'].map((label, i) => (
                  <div
                    key={label}
                    className={`p-4 rounded-xl border transition-all duration-300 ${
                      i === 1
                        ? 'bg-emerald-500/20 border-emerald-500 scale-105'
                        : 'bg-slate-800/50 border-slate-700 opacity-60'
                    }`}
                  >
                    <span className={i === 1 ? 'text-emerald-400 font-medium' : 'text-slate-400'}>
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            }
          />
        </div>
      </section>

      {/* ===== CASE STUDIES ===== */}
      <section
        id="casestudies"
        ref={(el) => { sectionRefs.current['casestudies'] = el; }}
        className="py-32 px-6 bg-slate-900/50"
      >
        <div className="max-w-5xl mx-auto">
          <div className={`text-center mb-16 transition-all duration-700 ${isVisible('casestudies') ? 'opacity-100' : 'opacity-0'}`}>
            <h2 className="text-3xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">
              When the Machine Types
            </h2>
            <p className="text-xl text-cyan-400/80 mb-2">the Human Can Listen</p>
            <p className="text-slate-500">當機器打字，人可以聆聽</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {caseStudies.map((study, idx) => (
              <InteractiveCard
                key={study.id}
                delay={idx * 150}
                className={`relative p-6 rounded-2xl bg-slate-800/50 border border-slate-700/50 backdrop-blur transition-all duration-700 ${
                  isVisible('casestudies') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
              >
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center mb-4">
                  <study.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-1">{study.title}</h3>
                <p className="text-sm text-emerald-400 mb-4">{study.titleZh}</p>
                <p className="text-sm text-slate-400 mb-4">{study.action}</p>
                <div className="pt-4 border-t border-slate-700">
                  <p className="text-emerald-400 font-medium">{study.result}</p>
                  <p className="text-xs text-slate-500">{study.resultZh}</p>
                </div>
              </InteractiveCard>
            ))}
          </div>
        </div>
      </section>

      {/* ===== THREE PATHS ===== */}
      <section
        id="threepaths"
        ref={(el) => { sectionRefs.current['threepaths'] = el; }}
        className="py-32 px-6"
      >
        <div className="max-w-5xl mx-auto">
          <div className={`text-center mb-16 transition-all duration-700 ${isVisible('threepaths') ? 'opacity-100' : 'opacity-0'}`}>
            <h2 className="text-3xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">
              Three Paths
            </h2>
            <p className="text-xl text-emerald-400/80">省下時間的三條路</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {threeChoices.map((choice, idx) => (
              <div
                key={choice.id}
                className={`relative cursor-pointer transition-all duration-500 ${
                  isVisible('threepaths') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
                style={{ transitionDelay: `${idx * 150}ms` }}
                onMouseEnter={() => setActiveChoice(choice.id)}
                onClick={() => setActiveChoice(choice.id)}
              >
                {choice.highlight && activeChoice === choice.id && (
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 rounded-2xl blur-xl" />
                )}
                <div className={`relative h-full p-6 rounded-2xl border-2 transition-all ${
                  activeChoice === choice.id
                    ? choice.highlight
                      ? 'border-emerald-500 bg-emerald-500/10'
                      : 'border-slate-500 bg-slate-800/80'
                    : 'border-slate-700 bg-slate-800/50'
                } ${activeChoice === choice.id ? 'scale-105' : 'scale-100'}`}>
                  <span className="text-4xl mb-4 block">{choice.emoji}</span>
                  <h3 className="text-xl font-semibold text-white mb-1">{choice.title}</h3>
                  <p className="text-sm text-emerald-400 mb-4">{choice.titleZh}</p>
                  <p className="text-sm text-slate-400 mb-4">{choice.description}</p>
                  <p className={`text-sm font-medium ${choice.highlight ? 'text-emerald-400' : 'text-slate-500'}`}>
                    → {choice.result}
                  </p>
                </div>

                {choice.highlight && (
                  <div className="hidden md:flex absolute -bottom-12 left-1/2 -translate-x-1/2 flex-col items-center">
                    <div className="w-0.5 h-8 bg-gradient-to-b from-emerald-500 to-transparent" />
                    <ChevronDown className="w-5 h-5 text-emerald-500 animate-bounce" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== HIGH TOUCH ===== */}
      <section
        id="hightouch"
        ref={(el) => { sectionRefs.current['hightouch'] = el; }}
        className="py-32 px-6 bg-slate-900/50"
      >
        <div className="max-w-5xl mx-auto">
          <div className={`text-center mb-4 transition-all duration-700 ${isVisible('hightouch') ? 'opacity-100' : 'opacity-0'}`}>
            <p className="text-sm text-emerald-400 uppercase tracking-wider mb-4">↑ The Human Strategy in Practice</p>
            <h2 className="text-3xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">
              High-Touch Philosophy
            </h2>
            <p className="text-xl text-emerald-400/80 mb-8">高接觸的哲學</p>
          </div>

          <div className={`grid grid-cols-2 md:grid-cols-5 gap-4 mb-12 transition-all duration-700 delay-200 ${isVisible('hightouch') ? 'opacity-100' : 'opacity-0'}`}>
            {highTouchActions.map((action, idx) => (
              <InteractiveCard
                key={action.text}
                delay={idx * 100}
                className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 text-center hover:border-emerald-500/50 transition-all"
              >
                <action.icon className="w-8 h-8 mx-auto text-emerald-400 mb-2" />
                <p className="text-sm text-white">{action.text}</p>
                <p className="text-xs text-slate-500">{action.textZh}</p>
              </InteractiveCard>
            ))}
          </div>

          <div className={`grid md:grid-cols-2 gap-6 transition-all duration-700 delay-400 ${isVisible('hightouch') ? 'opacity-100' : 'opacity-0'}`}>
            <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
              <div className="text-5xl font-bold text-emerald-400 mb-2">
                <AnimatedCounter value={88} suffix="%" />
              </div>
              <p className="text-slate-300">satisfaction with human service</p>
              <p className="text-sm text-slate-500">人工服務滿意度</p>
            </div>
            <div className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700">
              <div className="text-5xl font-bold text-slate-500 mb-2">
                <AnimatedCounter value={60} suffix="%" />
              </div>
              <p className="text-slate-400">satisfaction with AI service</p>
              <p className="text-sm text-slate-600">AI服務滿意度</p>
            </div>
          </div>

          <p className="text-center text-slate-400 italic mt-8">
            "AI satisfies the task. Humans satisfy the soul."
          </p>
          <p className="text-center text-slate-600 text-sm italic">
            「AI滿足任務。人滿足心靈。」
          </p>
        </div>
      </section>

      {/* ===== EXPERIMENT ===== */}
      <section
        id="experiment"
        ref={(el) => { sectionRefs.current['experiment'] = el; }}
        className="py-32 px-6"
      >
        <div className="max-w-4xl mx-auto">
          <div className={`text-center mb-16 transition-all duration-700 ${isVisible('experiment') ? 'opacity-100' : 'opacity-0'}`}>
            <h2 className="text-3xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">
              Try This Week
            </h2>
            <p className="text-xl text-emerald-400/80">一週實驗</p>
          </div>

          <div className={`flex flex-col md:flex-row items-center gap-4 transition-all duration-700 delay-200 ${isVisible('experiment') ? 'opacity-100' : 'opacity-0'}`}>
            {[
              { emoji: '🎯', step: 'Pick', stepZh: '選擇', desc: 'One admin task' },
              { emoji: '🤖', step: 'Delegate', stepZh: '委派', desc: 'Give it to AI' },
              { emoji: '📅', step: 'Block', stepZh: '預留', desc: '15 min human time' },
              { emoji: '💚', step: 'Connect', stepZh: '連繫', desc: 'Reach out' },
            ].map((item, idx) => (
              <div key={item.step} className="flex items-center">
                <InteractiveCard
                  delay={idx * 100}
                  className="flex-1 p-6 rounded-2xl bg-slate-800/50 border border-slate-700/50 text-center hover:border-emerald-500/50 transition-all"
                >
                  <span className="text-4xl mb-3 block">{item.emoji}</span>
                  <div className="w-8 h-8 mx-auto mb-2 rounded-full bg-emerald-500 text-white flex items-center justify-center text-sm font-bold">
                    {idx + 1}
                  </div>
                  <h3 className="font-semibold text-white">{item.step}</h3>
                  <p className="text-xs text-emerald-400">{item.stepZh}</p>
                  <p className="text-xs text-slate-500 mt-2">{item.desc}</p>
                </InteractiveCard>
                {idx < 3 && (
                  <ArrowRight className="w-5 h-5 text-emerald-500/50 mx-2 hidden md:block" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CLOSING ===== */}
      <section
        id="closing"
        ref={(el) => { sectionRefs.current['closing'] = el; }}
        className="py-32 px-6 bg-slate-900/50"
      >
        <div className="max-w-3xl mx-auto text-center">
          <h2 className={`text-4xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-400 transition-all duration-700 ${isVisible('closing') ? 'opacity-100' : 'opacity-0'}`}>
            用好 AI，過好生活
          </h2>

          <p className="text-2xl text-slate-300 font-light mb-4">
            AI Speed, Human Direction
          </p>
          <p className="text-slate-500 mb-12">
            AI讓我們更快。讓我們用這速度，回到重要的人身邊。
          </p>

          <div className="inline-block p-8 bg-slate-800/50 backdrop-blur rounded-2xl border border-slate-700/50 mb-8">
            <p className="text-lg font-medium text-white mb-1">Bennet Tsui</p>
            <p className="text-emerald-400 mb-6">Founder, 5 Miles Lab</p>

            <LinkedInQR />

            <a
              href="https://www.linkedin.com/in/bennettsui/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-emerald-400 hover:text-emerald-300 mt-4 block"
            >
              linkedin.com/in/bennettsui
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-slate-800">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <p className="text-slate-600 text-sm">
            用好 AI，過好生活 · AI Mastery for Human Connection
          </p>
          <p className="text-emerald-500/50 text-sm mt-1">5 Miles Lab</p>
        </div>
      </footer>
    </div>
  );
}
