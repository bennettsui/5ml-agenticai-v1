'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft, ChevronDown, Phone, Users, Video, Ear, Clock, Brain, Heart, Zap, Target, Calendar, ArrowRight, MessageSquare, Building, Handshake, QrCode } from 'lucide-react';

// ==================== DATA ====================
const caseStudies = [
  {
    id: 'gov-tenders',
    title: 'Government Tenders',
    action: 'AI drafts initial tender responses from templates',
    result: '70% faster turnaround, team focuses on strategy',
    icon: Building,
  },
  {
    id: 'elderly-services',
    title: 'Elderly Services',
    action: 'AI handles appointment scheduling & reminders',
    result: 'Staff spend 3x more time in face-to-face care',
    icon: Heart,
  },
  {
    id: 'ngo-operations',
    title: 'NGO Operations',
    action: 'AI automates donor reporting & data entry',
    result: 'Volunteers reconnect with beneficiaries',
    icon: Users,
  },
];

const threeChoices = [
  {
    id: 'factory',
    title: 'Factory Mode',
    subtitle: 'Do more of the same',
    description: 'Use saved time to increase output. More emails, more tasks, more meetings.',
    result: 'Burnout. No relationship gains.',
    color: 'from-slate-600 to-slate-700',
    highlight: false,
  },
  {
    id: 'busy-trap',
    title: 'The Busy Trap',
    subtitle: 'Fill with noise',
    description: 'Let distractions absorb the freed time. Social media, notifications, busywork.',
    result: 'Time vanishes. Nothing changes.',
    color: 'from-orange-600 to-red-600',
    highlight: false,
  },
  {
    id: 'human-strategy',
    title: 'The Human Strategy',
    subtitle: 'High-touch behavior',
    description: 'Intentionally invest saved time in relationships. Calls, meetings, presence.',
    result: 'Deeper connections. Real impact.',
    color: 'from-emerald-500 to-cyan-500',
    highlight: true,
  },
];

const highTouchChecklist = [
  { text: 'Phone calls over emails', icon: Phone },
  { text: 'Face-to-face over Zoom', icon: Users },
  { text: 'Deep listening over fast talking', icon: Ear },
];

const experimentSteps = [
  { step: 'PICK', description: 'One repetitive admin task' },
  { step: 'DELEGATE', description: 'Hand it to AI' },
  { step: 'BLOCK', description: '15 minutes as "Human Time"' },
  { step: 'CONNECT', description: 'Reach out to someone who matters' },
];

// ==================== INFOGRAPHIC COMPONENTS ====================

// Paradox Chart - Two peaks showing attention decline
function ParadoxChart() {
  return (
    <svg viewBox="0 0 400 200" className="w-full max-w-lg mx-auto">
      {/* Background */}
      <rect x="0" y="0" width="400" height="200" fill="transparent" />

      {/* Grid lines */}
      <g stroke="rgba(255,255,255,0.1)" strokeWidth="1">
        <line x1="50" y1="160" x2="350" y2="160" />
        <line x1="50" y1="120" x2="350" y2="120" strokeDasharray="4" />
        <line x1="50" y1="80" x2="350" y2="80" strokeDasharray="4" />
      </g>

      {/* The curve - two peaks with dip */}
      <path
        d="M 50 140 Q 100 40, 150 100 Q 200 160, 250 100 Q 300 40, 350 140"
        fill="none"
        stroke="url(#paradoxGradient)"
        strokeWidth="4"
        strokeLinecap="round"
      />

      {/* Gradient definition */}
      <defs>
        <linearGradient id="paradoxGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#f59e0b" />
          <stop offset="50%" stopColor="#ef4444" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>

      {/* Labels */}
      <text x="100" y="60" fill="#f59e0b" fontSize="11" textAnchor="middle" fontWeight="600">Lower Income</text>
      <text x="100" y="75" fill="#fbbf24" fontSize="9" textAnchor="middle">Multiple jobs</text>
      <text x="100" y="87" fill="#fbbf24" fontSize="9" textAnchor="middle">Little time</text>

      <text x="200" y="150" fill="#ef4444" fontSize="10" textAnchor="middle">Declining</text>
      <text x="200" y="162" fill="#ef4444" fontSize="10" textAnchor="middle">Attention</text>

      <text x="300" y="60" fill="#8b5cf6" fontSize="11" textAnchor="middle" fontWeight="600">Higher Income</text>
      <text x="300" y="75" fill="#a78bfa" fontSize="9" textAnchor="middle">Meetings &</text>
      <text x="300" y="87" fill="#a78bfa" fontSize="9" textAnchor="middle">Notifications</text>

      {/* X-axis labels */}
      <text x="200" y="190" fill="rgba(255,255,255,0.5)" fontSize="10" textAnchor="middle">Income Level →</text>
    </svg>
  );
}

// Workday Donut Chart
function WorkdayDonut() {
  const radius = 70;
  const strokeWidth = 20;
  const circumference = 2 * Math.PI * radius;
  const adminPercent = 40;
  const adminOffset = circumference * (1 - adminPercent / 100);

  return (
    <div className="relative w-64 h-64 mx-auto">
      <svg viewBox="0 0 200 200" className="w-full h-full transform -rotate-90">
        {/* Background circle */}
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke="rgba(16, 185, 129, 0.3)"
          strokeWidth={strokeWidth}
        />
        {/* Admin segment */}
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke="url(#donutGradient)"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={adminOffset}
          strokeLinecap="round"
        />
        <defs>
          <linearGradient id="donutGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="100%" stopColor="#f97316" />
          </linearGradient>
        </defs>
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold text-red-400">40%</span>
        <span className="text-sm text-slate-400">Repetitive Admin</span>
      </div>
    </div>
  );
}

// AI Adoption Staircase
function AIAdoptionStaircase({ activeZone, setActiveZone }: { activeZone: string; setActiveZone: (z: string) => void }) {
  const zones = [
    { id: 'trough', label: 'The Trough', level: '0-1', desc: '"AI? Not my thing."', y: 140 },
    { id: 'sweet-spot', label: 'The Sweet Spot', level: '2-3', desc: 'Real problems: emails, summaries, workflows', y: 90 },
    { id: 'frontier', label: 'The Frontier', level: '4-6', desc: 'Tokens, RAG, AGI', y: 40 },
  ];

  return (
    <div className="relative">
      <svg viewBox="0 0 400 200" className="w-full max-w-xl mx-auto">
        {/* Staircase steps */}
        {zones.map((zone, i) => (
          <g key={zone.id}>
            <rect
              x={50 + i * 110}
              y={zone.y}
              width={100}
              height={160 - zone.y}
              fill={activeZone === zone.id ? (zone.id === 'sweet-spot' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(139, 92, 246, 0.2)') : 'rgba(255,255,255,0.05)'}
              stroke={zone.id === 'sweet-spot' ? '#10b981' : 'rgba(255,255,255,0.2)'}
              strokeWidth={zone.id === 'sweet-spot' ? 2 : 1}
              rx="4"
              className="cursor-pointer transition-all duration-300"
              onClick={() => setActiveZone(zone.id)}
            />
            <text
              x={100 + i * 110}
              y={zone.y + 25}
              fill={zone.id === 'sweet-spot' ? '#10b981' : '#94a3b8'}
              fontSize="12"
              textAnchor="middle"
              fontWeight="600"
            >
              {zone.label}
            </text>
            <text
              x={100 + i * 110}
              y={zone.y + 42}
              fill="rgba(255,255,255,0.5)"
              fontSize="10"
              textAnchor="middle"
            >
              Stage {zone.level}
            </text>
          </g>
        ))}

        {/* Arrow showing progression */}
        <path
          d="M 80 170 L 320 170"
          stroke="rgba(255,255,255,0.3)"
          strokeWidth="2"
          markerEnd="url(#arrowhead)"
        />
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="rgba(255,255,255,0.3)" />
          </marker>
        </defs>
      </svg>

      {/* Zone description */}
      <div className="mt-4 text-center h-16">
        {zones.map((zone) => (
          <p
            key={zone.id}
            className={`transition-all duration-300 ${activeZone === zone.id ? 'opacity-100' : 'opacity-0 absolute'}`}
          >
            <span className={zone.id === 'sweet-spot' ? 'text-emerald-400' : 'text-slate-400'}>
              {zone.desc}
            </span>
          </p>
        ))}
      </div>
    </div>
  );
}

// Hourglass Animation
function Hourglass() {
  return (
    <div className="relative w-32 h-48 mx-auto">
      <svg viewBox="0 0 80 120" className="w-full h-full">
        {/* Frame */}
        <rect x="10" y="5" width="60" height="6" rx="2" fill="#64748b" />
        <rect x="10" y="109" width="60" height="6" rx="2" fill="#64748b" />
        <line x1="15" y1="11" x2="15" y2="109" stroke="#64748b" strokeWidth="3" />
        <line x1="65" y1="11" x2="65" y2="109" stroke="#64748b" strokeWidth="3" />

        {/* Glass shape */}
        <path
          d="M 20 15 L 20 45 Q 40 60, 60 45 L 60 15 Z"
          fill="rgba(139, 92, 246, 0.2)"
          stroke="rgba(139, 92, 246, 0.5)"
        />
        <path
          d="M 20 105 L 20 75 Q 40 60, 60 75 L 60 105 Z"
          fill="rgba(139, 92, 246, 0.2)"
          stroke="rgba(139, 92, 246, 0.5)"
        />

        {/* Sand - top (depleting) */}
        <path
          d="M 25 20 L 25 40 Q 40 52, 55 40 L 55 20 Z"
          fill="#f59e0b"
          className="animate-pulse"
        >
          <animate attributeName="d" dur="3s" repeatCount="indefinite"
            values="M 25 20 L 25 40 Q 40 52, 55 40 L 55 20 Z;M 25 20 L 25 30 Q 40 38, 55 30 L 55 20 Z;M 25 20 L 25 40 Q 40 52, 55 40 L 55 20 Z" />
        </path>

        {/* Sand stream */}
        <line x1="40" y1="52" x2="40" y2="68" stroke="#f59e0b" strokeWidth="2">
          <animate attributeName="opacity" dur="0.5s" repeatCount="indefinite" values="1;0.3;1" />
        </line>

        {/* Sand - bottom (filling) */}
        <path
          d="M 25 100 L 25 85 Q 40 78, 55 85 L 55 100 Z"
          fill="#f59e0b"
          className="animate-pulse"
        >
          <animate attributeName="d" dur="3s" repeatCount="indefinite"
            values="M 25 100 L 25 85 Q 40 78, 55 85 L 55 100 Z;M 25 100 L 25 75 Q 40 68, 55 75 L 55 100 Z;M 25 100 L 25 85 Q 40 78, 55 85 L 55 100 Z" />
        </path>
      </svg>
    </div>
  );
}

// Weekly Calendar
function WeekCalendar() {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const schedule = [
    { admin: true, human: false },
    { admin: false, human: true },
    { admin: true, human: false },
    { admin: false, human: true },
    { admin: true, human: true },
    { admin: false, human: true },
    { admin: false, human: true },
  ];

  return (
    <div className="grid grid-cols-7 gap-2 max-w-md mx-auto">
      {days.map((day, i) => (
        <div key={day} className="text-center">
          <div className="text-xs text-slate-500 mb-2">{day}</div>
          <div className={`h-16 rounded-lg border-2 flex items-center justify-center transition-all ${
            schedule[i].human
              ? 'border-emerald-500 bg-emerald-500/20'
              : schedule[i].admin
              ? 'border-red-500/50 bg-red-500/10 line-through'
              : 'border-slate-700 bg-slate-800/50'
          }`}>
            <span className={`text-xs ${schedule[i].human ? 'text-emerald-400' : 'text-red-400/50'}`}>
              {schedule[i].human ? '👤' : schedule[i].admin ? '📋' : ''}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

// Workflow Diagram
function WorkflowDiagram() {
  const steps = ['Analyze', 'Identify', 'Automate', 'Free Up'];

  return (
    <div className="flex items-center justify-center gap-2 flex-wrap">
      {steps.map((step, i) => (
        <div key={step} className="flex items-center">
          <div className="px-4 py-3 bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 rounded-xl">
            <span className="text-emerald-400 font-medium">{step}</span>
          </div>
          {i < steps.length - 1 && (
            <ArrowRight className="w-5 h-5 text-slate-600 mx-2" />
          )}
        </div>
      ))}
    </div>
  );
}

// ==================== MAIN COMPONENT ====================
export default function AIHumanConnectionPage() {
  const [scrollY, setScrollY] = useState(0);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [activeZone, setActiveZone] = useState('sweet-spot');
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set());
  const [hoveredChoice, setHoveredChoice] = useState<string | null>('human-strategy');

  const containerRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<{ [key: string]: HTMLElement | null }>({});

  // Scroll and mouse tracking
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setMousePos({
          x: (e.clientX - rect.left) / rect.width - 0.5,
          y: (e.clientY - rect.top) / rect.height - 0.5,
        });
      }
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  // Intersection observer for scroll-triggered animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleSections((prev) => new Set(prev).add(entry.target.id));
          }
        });
      },
      { threshold: 0.2 }
    );

    Object.values(sectionRefs.current).forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, []);

  const scrollToNext = () => {
    window.scrollTo({ top: window.innerHeight, behavior: 'smooth' });
  };

  const isVisible = (id: string) => visibleSections.has(id);

  return (
    <div ref={containerRef} className="min-h-screen bg-slate-950 text-white overflow-hidden">
      {/* Parallax Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div
          className="absolute w-[800px] h-[800px] rounded-full bg-gradient-to-br from-emerald-500/10 to-cyan-500/5 blur-3xl"
          style={{
            left: '20%',
            top: '10%',
            transform: `translate(${mousePos.x * 50}px, ${scrollY * 0.1 + mousePos.y * 50}px)`,
          }}
        />
        <div
          className="absolute w-[600px] h-[600px] rounded-full bg-gradient-to-br from-purple-500/10 to-pink-500/5 blur-3xl"
          style={{
            right: '10%',
            top: '50%',
            transform: `translate(${mousePos.x * -30}px, ${scrollY * -0.05 + mousePos.y * -30}px)`,
          }}
        />
      </div>

      {/* Sticky Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/vibe-demo" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm">Back to Demos</span>
          </Link>
          <div className="hidden md:flex items-center gap-6 text-xs text-slate-500">
            <span className="text-emerald-400 font-medium">AI Mastery for Human Connection</span>
          </div>
        </div>
      </nav>

      {/* ===== SECTION 0: HERO ===== */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
        {/* Parallax background shapes */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ transform: `translateY(${scrollY * 0.3}px)` }}
        >
          <div className="w-[500px] h-[500px] rounded-full border border-emerald-500/20" />
          <div className="absolute w-[350px] h-[350px] rounded-full border border-cyan-500/20" />
          <div className="absolute w-[200px] h-[200px] rounded-full bg-gradient-to-br from-emerald-500/10 to-cyan-500/10" />
        </div>

        {/* Hero content */}
        <div
          className="relative z-10 text-center px-4 max-w-4xl"
          style={{ transform: `translateY(${scrollY * -0.2}px)` }}
        >
          <div className="flex items-center justify-center gap-3 mb-6">
            <Brain className="w-8 h-8 text-emerald-400" />
            <span className="text-emerald-400 font-medium tracking-widest uppercase text-sm">5 Miles Lab</span>
            <Heart className="w-8 h-8 text-pink-400" />
          </div>

          <h1
            className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-cyan-400 to-purple-400"
            style={{
              transform: `translate(${mousePos.x * -20}px, ${mousePos.y * -20}px)`,
              transition: 'transform 0.1s ease-out',
            }}
          >
            AI Mastery for<br />Human Connection
          </h1>

          <p className="text-xl md:text-2xl text-slate-400 mb-4">
            How to automate the mundane so you can design the meaningful
          </p>

          <p className="text-slate-500 mb-12">
            Bennet Tsui | Founder, 5 Miles Lab | Ex-4As Ad Agencies
          </p>

          <button
            onClick={scrollToNext}
            className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full hover:bg-white/20 transition-all group"
          >
            <span>Scroll to begin</span>
            <ChevronDown className="w-5 h-5 group-hover:translate-y-1 transition-transform" />
          </button>
        </div>

        {/* Scroll indicator */}
        <div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          style={{ opacity: Math.max(0, 1 - scrollY / 300) }}
        >
          <div className="w-6 h-10 rounded-full border-2 border-slate-500 flex justify-center pt-2">
            <div className="w-1.5 h-3 bg-slate-500 rounded-full animate-bounce" />
          </div>
        </div>
      </section>

      {/* ===== SECTION 1: THE PARADOX OF PROGRESS ===== */}
      <section
        id="paradox"
        ref={(el) => { sectionRefs.current['paradox'] = el; }}
        className="relative py-32 px-4"
      >
        <div className="max-w-4xl mx-auto">
          <div className={`transition-all duration-1000 ${isVisible('paradox') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <h2 className="text-3xl md:text-5xl font-bold text-center mb-8">
              The Paradox of Progress
            </h2>

            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 mb-12">
              <p className="text-xl text-center text-slate-300 italic">
                &quot;Last month, how many times did you sit down with someone for 10+ minutes without checking a phone?&quot;
              </p>
            </div>

            {/* Parallax chart */}
            <div style={{ transform: `translateY(${(scrollY - 600) * -0.05}px)` }}>
              <ParadoxChart />
            </div>

            <p className="text-center text-slate-500 mt-8 max-w-2xl mx-auto">
              Whether we earn less or more, our attention is being pulled away from the people who matter most.
            </p>
          </div>
        </div>
      </section>

      {/* ===== SECTION 2: LIVING AT THE INTERSECTION ===== */}
      <section
        id="intersection"
        ref={(el) => { sectionRefs.current['intersection'] = el; }}
        className="relative py-32 px-4 bg-slate-900/50"
      >
        <div className="max-w-5xl mx-auto">
          <h2 className={`text-3xl md:text-5xl font-bold text-center mb-16 transition-all duration-1000 ${isVisible('intersection') ? 'opacity-100' : 'opacity-0'}`}>
            Living at the Intersection of<br />
            <span className="text-emerald-400">Efficiency</span> and <span className="text-pink-400">Empathy</span>
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: 'The Grind', icon: Zap, color: 'from-orange-500 to-red-500', desc: '20 years in advertising. Efficiency was survival.' },
              { title: 'The Soul', icon: Heart, color: 'from-pink-500 to-purple-500', desc: 'But the best work came from human understanding.' },
              { title: 'The Tech', icon: Brain, color: 'from-emerald-500 to-cyan-500', desc: 'Now AI handles the grind. We focus on the soul.' },
            ].map((item, idx) => (
              <div
                key={item.title}
                className={`text-center transition-all duration-700 delay-${idx * 200} ${isVisible('intersection') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
                style={{ transitionDelay: `${idx * 200}ms` }}
              >
                <div className={`w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center`}>
                  <item.icon className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                <p className="text-slate-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== SECTION 3: DROWNING IN THE SHALLOWS ===== */}
      <section
        id="shallows"
        ref={(el) => { sectionRefs.current['shallows'] = el; }}
        className="relative py-32 px-4"
      >
        <div className="max-w-4xl mx-auto">
          <h2 className={`text-3xl md:text-5xl font-bold text-center mb-4 transition-all duration-1000 ${isVisible('shallows') ? 'opacity-100' : 'opacity-0'}`}>
            Drowning in the Shallows of the Modern Workday
          </h2>
          <p className="text-center text-slate-500 mb-16">The hidden cost of repetitive admin</p>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className={`transition-all duration-1000 ${isVisible('shallows') ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}>
              <WorkdayDonut />
            </div>

            <div className={`space-y-6 transition-all duration-1000 delay-300 ${isVisible('shallows') ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}>
              {[
                '40% of work time spent on repetitive admin tasks',
                'Only 30 out of 40 hours truly productive',
                '75% feel time is wasted on tasks that could be automated',
              ].map((stat, idx) => (
                <div key={idx} className="flex items-start gap-4 p-4 bg-white/5 rounded-xl border border-white/10">
                  <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-4 h-4 text-red-400" />
                  </div>
                  <p className="text-slate-300">{stat}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== SECTION 4: THE SWEET SPOT OF AI ADOPTION ===== */}
      <section
        id="sweetspot"
        ref={(el) => { sectionRefs.current['sweetspot'] = el; }}
        className="relative py-32 px-4 bg-slate-900/50"
      >
        <div className="max-w-4xl mx-auto">
          <h2 className={`text-3xl md:text-5xl font-bold text-center mb-4 transition-all duration-1000 ${isVisible('sweetspot') ? 'opacity-100' : 'opacity-0'}`}>
            The Sweet Spot of AI Adoption
          </h2>
          <p className="text-center text-slate-500 mb-16">Click each zone to learn more</p>

          <AIAdoptionStaircase activeZone={activeZone} setActiveZone={setActiveZone} />

          <div className="mt-12 p-6 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-center">
            <p className="text-emerald-400 font-medium">
              You don&apos;t need to be a coder. The goal is simply moving from Stage 1 to Stage 2.
            </p>
          </div>
        </div>
      </section>

      {/* ===== SECTION 5: WHEN THE MACHINE TYPES ===== */}
      <section
        id="casestudies"
        ref={(el) => { sectionRefs.current['casestudies'] = el; }}
        className="relative py-32 px-4"
      >
        <div className="max-w-5xl mx-auto">
          <h2 className={`text-3xl md:text-5xl font-bold text-center mb-4 transition-all duration-1000 ${isVisible('casestudies') ? 'opacity-100' : 'opacity-0'}`}>
            When the Machine Types,<br />the Human Can Listen
          </h2>
          <p className="text-center text-slate-500 mb-16">Efficiency for the machine. Empathy for the people.</p>

          <div className="grid md:grid-cols-3 gap-6">
            {caseStudies.map((study, idx) => (
              <div
                key={study.id}
                className={`bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-emerald-500/30 transition-all duration-500 hover:-translate-y-2 ${isVisible('casestudies') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
                style={{ transitionDelay: `${idx * 150}ms` }}
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center mb-4">
                  <study.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold mb-3">{study.title}</h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-xs text-emerald-400 uppercase tracking-wider">Action</span>
                    <p className="text-slate-400 text-sm">{study.action}</p>
                  </div>
                  <div>
                    <span className="text-xs text-cyan-400 uppercase tracking-wider">Result</span>
                    <p className="text-slate-300 text-sm font-medium">{study.result}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== SECTION 6: THE TIME SAVED TRAP ===== */}
      <section
        id="timetrap"
        ref={(el) => { sectionRefs.current['timetrap'] = el; }}
        className="relative py-32 px-4 bg-slate-900/50"
      >
        <div className="max-w-4xl mx-auto">
          <h2 className={`text-3xl md:text-5xl font-bold text-center mb-16 transition-all duration-1000 ${isVisible('timetrap') ? 'opacity-100' : 'opacity-0'}`}>
            The &quot;Time Saved&quot; Trap
          </h2>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className={`transition-all duration-1000 ${isVisible('timetrap') ? 'opacity-100' : 'opacity-0'}`}>
              <Hourglass />
            </div>

            <div className={`space-y-6 transition-all duration-1000 delay-300 ${isVisible('timetrap') ? 'opacity-100' : 'opacity-0'}`}>
              <p className="text-xl text-slate-300">
                GenAI users already save <span className="text-emerald-400 font-bold">2–4 hours per week</span>.
              </p>
              <p className="text-slate-400">
                But without intentional design, saved time doesn&apos;t lead to freedom.
              </p>
              <div className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-xl">
                <p className="text-orange-400">
                  <strong>Parkinson&apos;s Law:</strong> Work expands to fill the time available.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== SECTION 7: THREE PATHS ===== */}
      <section
        id="threepaths"
        ref={(el) => { sectionRefs.current['threepaths'] = el; }}
        className="relative py-32 px-4"
      >
        <div className="max-w-5xl mx-auto">
          <h2 className={`text-3xl md:text-5xl font-bold text-center mb-16 transition-all duration-1000 ${isVisible('threepaths') ? 'opacity-100' : 'opacity-0'}`}>
            Three Paths for Your Saved Hours
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            {threeChoices.map((choice, idx) => (
              <div
                key={choice.id}
                className={`relative group cursor-pointer transition-all duration-500 ${isVisible('threepaths') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
                style={{ transitionDelay: `${idx * 150}ms` }}
                onMouseEnter={() => setHoveredChoice(choice.id)}
                onMouseLeave={() => setHoveredChoice('human-strategy')}
              >
                {/* Glow effect */}
                {choice.highlight && (
                  <div className={`absolute inset-0 bg-gradient-to-br ${choice.color} rounded-2xl blur-xl opacity-30`} />
                )}

                <div className={`relative h-full p-6 rounded-2xl border-2 transition-all ${
                  hoveredChoice === choice.id
                    ? choice.highlight
                      ? 'border-emerald-500 bg-emerald-500/10'
                      : 'border-white/30 bg-white/5'
                    : 'border-white/10 bg-white/5'
                }`}>
                  <div className={`inline-block px-3 py-1 rounded-full text-xs font-medium mb-4 bg-gradient-to-r ${choice.color}`}>
                    Choice {idx + 1}
                  </div>
                  <h3 className="text-xl font-bold mb-2">{choice.title}</h3>
                  <p className="text-slate-500 text-sm mb-4">{choice.subtitle}</p>
                  <p className="text-slate-400 text-sm mb-4">{choice.description}</p>
                  <div className={`p-3 rounded-lg ${choice.highlight ? 'bg-emerald-500/20' : 'bg-white/5'}`}>
                    <p className={`text-sm font-medium ${choice.highlight ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {choice.result}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== SECTION 8: PHILOSOPHY OF HIGH-TOUCH ===== */}
      <section
        id="hightouch"
        ref={(el) => { sectionRefs.current['hightouch'] = el; }}
        className="relative py-32 px-4 bg-slate-900/50"
      >
        <div className="max-w-4xl mx-auto">
          <h2 className={`text-3xl md:text-5xl font-bold text-center mb-16 transition-all duration-1000 ${isVisible('hightouch') ? 'opacity-100' : 'opacity-0'}`}>
            The Philosophy of High-Touch
          </h2>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-4">
              {highTouchChecklist.map((item, idx) => (
                <div
                  key={idx}
                  className={`flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10 transition-all duration-500 ${isVisible('hightouch') ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}
                  style={{ transitionDelay: `${idx * 200}ms` }}
                >
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <item.icon className="w-5 h-5 text-emerald-400" />
                  </div>
                  <span className="text-slate-300">{item.text}</span>
                </div>
              ))}
            </div>

            <div className={`transition-all duration-1000 delay-500 ${isVisible('hightouch') ? 'opacity-100' : 'opacity-0'}`}>
              <div className="bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 rounded-2xl p-6 border border-emerald-500/30">
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-emerald-400">88%</div>
                    <div className="text-xs text-slate-500">Satisfaction with<br />human service</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-slate-500">60%</div>
                    <div className="text-xs text-slate-500">Satisfaction with<br />AI service</div>
                  </div>
                </div>
                <p className="text-center text-slate-300 italic">
                  &quot;AI satisfies the task. Humans satisfy the soul.&quot;
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== SECTION 9: ONE-WEEK EXPERIMENT ===== */}
      <section
        id="experiment"
        ref={(el) => { sectionRefs.current['experiment'] = el; }}
        className="relative py-32 px-4"
      >
        <div className="max-w-4xl mx-auto">
          <h2 className={`text-3xl md:text-5xl font-bold text-center mb-4 transition-all duration-1000 ${isVisible('experiment') ? 'opacity-100' : 'opacity-0'}`}>
            A One-Week Experiment in<br />Reclaiming Humanity
          </h2>
          <p className="text-center text-slate-500 mb-16">Replace admin blocks with human time</p>

          <WeekCalendar />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12">
            {experimentSteps.map((step, idx) => (
              <div
                key={step.step}
                className={`text-center p-4 bg-white/5 rounded-xl border border-white/10 transition-all duration-500 ${isVisible('experiment') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
                style={{ transitionDelay: `${idx * 100}ms` }}
              >
                <div className="text-2xl font-bold text-emerald-400 mb-2">{idx + 1}</div>
                <div className="text-sm font-bold text-white mb-1">{step.step}</div>
                <div className="text-xs text-slate-500">{step.description}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== SECTION 10: DESIGNING WORKFLOWS ===== */}
      <section
        id="workflows"
        ref={(el) => { sectionRefs.current['workflows'] = el; }}
        className="relative py-32 px-4 bg-slate-900/50"
      >
        <div className="max-w-4xl mx-auto">
          <h2 className={`text-3xl md:text-5xl font-bold text-center mb-4 transition-all duration-1000 ${isVisible('workflows') ? 'opacity-100' : 'opacity-0'}`}>
            Designing Workflows,<br />Not Just Buying Software
          </h2>
          <p className="text-center text-slate-500 mb-16">
            We don&apos;t just sell products. We sit with you to understand your workflows.
          </p>

          <WorkflowDiagram />

          <div className="mt-12 grid md:grid-cols-3 gap-6 text-center">
            {[
              'Analyze bottlenecks in your current process',
              'Identify 10–20% of admin that can be automated',
              'Free up time for what truly matters',
            ].map((text, idx) => (
              <div
                key={idx}
                className={`p-4 bg-white/5 rounded-xl transition-all duration-500 ${isVisible('workflows') ? 'opacity-100' : 'opacity-0'}`}
                style={{ transitionDelay: `${idx * 150}ms` }}
              >
                <div className="w-8 h-8 mx-auto mb-3 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <Target className="w-4 h-4 text-emerald-400" />
                </div>
                <p className="text-slate-400 text-sm">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== SECTION 11: CLOSING ===== */}
      <section
        id="closing"
        ref={(el) => { sectionRefs.current['closing'] = el; }}
        className="relative py-32 px-4"
      >
        <div className="max-w-3xl mx-auto text-center">
          <h2 className={`text-4xl md:text-6xl font-bold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400 transition-all duration-1000 ${isVisible('closing') ? 'opacity-100' : 'opacity-0'}`}>
            AI Speed,<br />Human Direction
          </h2>

          <p className="text-xl text-slate-300 mb-4">
            AI makes us faster. But speed is useless without direction.
          </p>
          <p className="text-slate-500 mb-12">
            Let&apos;s use this speed to get back to the people who matter.
          </p>

          <div className="inline-block p-8 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 mb-12">
            <p className="text-lg font-medium mb-2">Bennet Tsui</p>
            <p className="text-emerald-400">5 Miles Lab</p>
            <div className="mt-6 w-32 h-32 mx-auto bg-white/10 rounded-xl flex items-center justify-center">
              <QrCode className="w-16 h-16 text-slate-500" />
            </div>
            <p className="text-xs text-slate-600 mt-2">QR Code Placeholder</p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold rounded-full hover:opacity-90 transition-all">
              Book a Conversation
            </button>
            <button className="px-8 py-3 bg-white/10 border border-white/20 text-white font-semibold rounded-full hover:bg-white/20 transition-all">
              Follow Our Work
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-slate-600 text-sm">
            AI Mastery for Human Connection | 5 Miles Lab
          </p>
          <p className="text-slate-700 text-xs mt-2">
            Demo site for 5ML Vibe Code Showcase
          </p>
        </div>
      </footer>
    </div>
  );
}
