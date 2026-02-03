'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, ChevronDown, Phone, Users, Ear, Clock, Brain, Heart, Zap, Target, ArrowRight, Building, Coffee, MessageCircle, Smile, Frown, AlertTriangle, CheckCircle, Sparkles, Star } from 'lucide-react';

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
    color: 'from-slate-400 to-slate-500',
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
    color: 'from-orange-400 to-amber-500',
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
    color: 'from-rose-400 to-pink-500',
    emoji: '💝',
    highlight: true,
  },
];

const highTouchChecklist = [
  { text: 'Phone calls over emails', textZh: '打電話勝過發電郵', icon: Phone },
  { text: 'Face-to-face over Zoom', textZh: '面對面勝過視像會議', icon: Users },
  { text: 'Deep listening over fast talking', textZh: '深度聆聽勝過快速說話', icon: Ear },
];

const experimentSteps = [
  { step: 'PICK', stepZh: '選擇', description: 'One repetitive admin task', descriptionZh: '一項重複性行政工作' },
  { step: 'DELEGATE', stepZh: '委派', description: 'Hand it to AI', descriptionZh: '交給AI處理' },
  { step: 'BLOCK', stepZh: '預留', description: '15 minutes as "Human Time"', descriptionZh: '15分鐘「人情時間」' },
  { step: 'CONNECT', stepZh: '連繫', description: 'Reach out to someone who matters', descriptionZh: '聯絡重要的人' },
];

const whyItsTough = [
  {
    icon: AlertTriangle,
    title: 'Information Overload',
    titleZh: '資訊過載',
    desc: '200+ emails/day, endless notifications',
    descZh: '每天200+電郵、無盡通知',
    color: 'from-amber-400 to-orange-500'
  },
  {
    icon: Clock,
    title: 'Time Fragmentation',
    titleZh: '時間碎片化',
    desc: 'Average focus time: only 11 minutes',
    descZh: '平均專注時間：只有11分鐘',
    color: 'from-rose-400 to-red-500'
  },
  {
    icon: Frown,
    title: 'Meeting Overload',
    titleZh: '會議過多',
    desc: '23 hours/week in meetings for managers',
    descZh: '管理層每週23小時在會議中',
    color: 'from-purple-400 to-violet-500'
  },
  {
    icon: Zap,
    title: 'Always-On Culture',
    titleZh: '永遠在線文化',
    desc: '70% check work emails outside hours',
    descZh: '70%人在工作時間外查看電郵',
    color: 'from-blue-400 to-cyan-500'
  },
];

// ==================== ILLUSTRATION COMPONENTS ====================

// Happy person waving
function HappyPerson({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 140" className={className}>
      {/* Body */}
      <ellipse cx="50" cy="110" rx="25" ry="30" fill="url(#bodyGradient)" />
      {/* Head */}
      <circle cx="50" cy="45" r="28" fill="#FFE0BD" />
      {/* Hair */}
      <ellipse cx="50" cy="30" rx="25" ry="15" fill="#4A3728" />
      {/* Eyes */}
      <circle cx="40" cy="42" r="4" fill="#333" />
      <circle cx="60" cy="42" r="4" fill="#333" />
      <circle cx="41" cy="41" r="1.5" fill="#fff" />
      <circle cx="61" cy="41" r="1.5" fill="#fff" />
      {/* Smile */}
      <path d="M 38 55 Q 50 68, 62 55" stroke="#333" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      {/* Cheeks */}
      <circle cx="32" cy="52" r="5" fill="#FFB6C1" opacity="0.6" />
      <circle cx="68" cy="52" r="5" fill="#FFB6C1" opacity="0.6" />
      {/* Waving arm */}
      <ellipse cx="85" cy="75" rx="8" ry="25" fill="#FFE0BD" transform="rotate(-30 85 75)">
        <animate attributeName="transform" dur="1s" repeatCount="indefinite"
          values="rotate(-30 85 75);rotate(-45 85 75);rotate(-30 85 75)"
          type="rotate" />
      </ellipse>
      {/* Hand */}
      <circle cx="95" cy="55" r="8" fill="#FFE0BD">
        <animate attributeName="cy" dur="1s" repeatCount="indefinite" values="55;48;55" />
      </circle>
      <defs>
        <linearGradient id="bodyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF9A9E" />
          <stop offset="100%" stopColor="#FECFEF" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// Two people connecting
function PeopleConnecting({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 120" className={className}>
      {/* Person 1 */}
      <g>
        <circle cx="45" cy="35" r="18" fill="#FFE0BD" />
        <ellipse cx="45" cy="25" rx="16" ry="10" fill="#8B4513" />
        <circle cx="40" cy="33" r="2.5" fill="#333" />
        <circle cx="50" cy="33" r="2.5" fill="#333" />
        <path d="M 40 42 Q 45 48, 50 42" stroke="#333" strokeWidth="2" fill="none" />
        <ellipse cx="45" cy="80" rx="20" ry="25" fill="url(#person1Body)" />
      </g>
      {/* Person 2 */}
      <g>
        <circle cx="155" cy="35" r="18" fill="#FFE0BD" />
        <ellipse cx="155" cy="25" rx="16" ry="10" fill="#2C1810" />
        <circle cx="150" cy="33" r="2.5" fill="#333" />
        <circle cx="160" cy="33" r="2.5" fill="#333" />
        <path d="M 150 42 Q 155 48, 160 42" stroke="#333" strokeWidth="2" fill="none" />
        <ellipse cx="155" cy="80" rx="20" ry="25" fill="url(#person2Body)" />
      </g>
      {/* Connecting hearts */}
      <g className="animate-pulse">
        <path d="M 85 50 C 85 40, 95 40, 100 48 C 105 40, 115 40, 115 50 C 115 65, 100 75, 100 75 C 100 75, 85 65, 85 50" fill="#FF6B9D" />
      </g>
      {/* Connection lines */}
      <path d="M 65 50 Q 100 30, 135 50" stroke="#FF6B9D" strokeWidth="2" strokeDasharray="5,5" fill="none" opacity="0.5">
        <animate attributeName="stroke-dashoffset" dur="2s" repeatCount="indefinite" values="0;20" />
      </path>
      <defs>
        <linearGradient id="person1Body" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#87CEEB" />
          <stop offset="100%" stopColor="#98D8C8" />
        </linearGradient>
        <linearGradient id="person2Body" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#DDA0DD" />
          <stop offset="100%" stopColor="#FFB6C1" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// Coffee chat illustration
function CoffeeChat({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 100" className={className}>
      {/* Table */}
      <ellipse cx="60" cy="85" rx="55" ry="12" fill="#DEB887" />
      <rect x="55" y="85" width="10" height="15" fill="#8B4513" />
      {/* Coffee cups */}
      <g>
        <rect x="25" y="60" width="20" height="25" rx="3" fill="#FFF8DC" />
        <ellipse cx="35" cy="60" rx="10" ry="4" fill="#FFF8DC" />
        <ellipse cx="35" cy="65" rx="7" ry="3" fill="#8B4513" />
        <path d="M 45 65 Q 55 65, 55 75 Q 55 85, 45 85" stroke="#FFF8DC" strokeWidth="3" fill="none" />
        {/* Steam */}
        <path d="M 32 55 Q 30 50, 32 45" stroke="#DDD" strokeWidth="2" fill="none" opacity="0.6">
          <animate attributeName="d" dur="2s" repeatCount="indefinite"
            values="M 32 55 Q 30 50, 32 45;M 32 55 Q 34 50, 32 45;M 32 55 Q 30 50, 32 45" />
        </path>
        <path d="M 38 55 Q 40 48, 38 42" stroke="#DDD" strokeWidth="2" fill="none" opacity="0.6">
          <animate attributeName="d" dur="2.5s" repeatCount="indefinite"
            values="M 38 55 Q 40 48, 38 42;M 38 55 Q 36 48, 38 42;M 38 55 Q 40 48, 38 42" />
        </path>
      </g>
      <g>
        <rect x="75" y="60" width="20" height="25" rx="3" fill="#FFF8DC" />
        <ellipse cx="85" cy="60" rx="10" ry="4" fill="#FFF8DC" />
        <ellipse cx="85" cy="65" rx="7" ry="3" fill="#8B4513" />
        <path d="M 75 65 Q 65 65, 65 75 Q 65 85, 75 85" stroke="#FFF8DC" strokeWidth="3" fill="none" />
        <path d="M 82 55 Q 80 48, 82 42" stroke="#DDD" strokeWidth="2" fill="none" opacity="0.6">
          <animate attributeName="d" dur="2.2s" repeatCount="indefinite"
            values="M 82 55 Q 80 48, 82 42;M 82 55 Q 84 48, 82 42;M 82 55 Q 80 48, 82 42" />
        </path>
      </g>
      {/* Chat bubbles */}
      <g className="animate-bounce" style={{ animationDuration: '3s' }}>
        <ellipse cx="30" cy="25" rx="18" ry="12" fill="#FFE4E1" />
        <path d="M 35 35 L 40 42 L 42 35" fill="#FFE4E1" />
        <text x="30" y="28" textAnchor="middle" fontSize="12">😊</text>
      </g>
      <g className="animate-bounce" style={{ animationDuration: '3.5s', animationDelay: '0.5s' }}>
        <ellipse cx="90" cy="20" rx="18" ry="12" fill="#E0FFFF" />
        <path d="M 85 30 L 80 37 L 78 30" fill="#E0FFFF" />
        <text x="90" y="23" textAnchor="middle" fontSize="12">💬</text>
      </g>
    </svg>
  );
}

// Floating hearts
function FloatingHearts({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className}>
      {[
        { x: 20, y: 60, size: 12, delay: 0, color: '#FF6B9D' },
        { x: 50, y: 40, size: 18, delay: 0.5, color: '#FFB6C1' },
        { x: 80, y: 55, size: 10, delay: 1, color: '#FF9A9E' },
        { x: 35, y: 25, size: 8, delay: 1.5, color: '#FECFEF' },
        { x: 70, y: 20, size: 14, delay: 2, color: '#FF6B9D' },
      ].map((heart, i) => (
        <g key={i} style={{ animation: `float ${3 + i * 0.5}s ease-in-out infinite`, animationDelay: `${heart.delay}s` }}>
          <path
            d={`M ${heart.x} ${heart.y + heart.size/3}
               C ${heart.x} ${heart.y - heart.size/3}, ${heart.x + heart.size/2} ${heart.y - heart.size/3}, ${heart.x + heart.size/2} ${heart.y + heart.size/6}
               C ${heart.x + heart.size/2} ${heart.y - heart.size/3}, ${heart.x + heart.size} ${heart.y - heart.size/3}, ${heart.x + heart.size} ${heart.y + heart.size/3}
               C ${heart.x + heart.size} ${heart.y + heart.size}, ${heart.x + heart.size/2} ${heart.y + heart.size * 1.2}, ${heart.x + heart.size/2} ${heart.y + heart.size * 1.2}
               C ${heart.x + heart.size/2} ${heart.y + heart.size * 1.2}, ${heart.x} ${heart.y + heart.size}, ${heart.x} ${heart.y + heart.size/3}`}
            fill={heart.color}
            opacity="0.8"
          />
        </g>
      ))}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </svg>
  );
}

// ==================== INFOGRAPHIC COMPONENTS ====================

// Why It's Tough - Visual Grid
function WhyToughInfographic({ isVisible }: { isVisible: boolean }) {
  return (
    <div className="grid grid-cols-2 gap-6 max-w-2xl mx-auto">
      {whyItsTough.map((item, idx) => (
        <div
          key={item.title}
          className={`relative p-6 rounded-2xl bg-white/80 backdrop-blur-sm border border-white/50 shadow-lg transition-all duration-700 hover:scale-105 hover:shadow-xl ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
          style={{ transitionDelay: `${idx * 150}ms` }}
        >
          <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-4 shadow-md`}>
            <item.icon className="w-7 h-7 text-white" />
          </div>
          <h4 className="font-bold text-slate-800 mb-1">{item.title}</h4>
          <p className="text-sm text-slate-500 mb-2">{item.titleZh}</p>
          <p className="text-sm text-slate-600">{item.desc}</p>
          <p className="text-xs text-slate-400">{item.descZh}</p>
        </div>
      ))}
    </div>
  );
}

// Paradox Chart - Warmer colors
function ParadoxChart() {
  return (
    <svg viewBox="0 0 400 220" className="w-full max-w-lg mx-auto">
      {/* Background with gradient */}
      <rect x="0" y="0" width="400" height="220" fill="url(#chartBg)" rx="12" />

      {/* Grid lines */}
      <g stroke="rgba(255,255,255,0.3)" strokeWidth="1">
        <line x1="50" y1="170" x2="350" y2="170" />
        <line x1="50" y1="130" x2="350" y2="130" strokeDasharray="4" />
        <line x1="50" y1="90" x2="350" y2="90" strokeDasharray="4" />
      </g>

      {/* The curve - two peaks with dip */}
      <path
        d="M 50 150 Q 100 50, 150 110 Q 200 170, 250 110 Q 300 50, 350 150"
        fill="none"
        stroke="url(#paradoxGradientWarm)"
        strokeWidth="5"
        strokeLinecap="round"
      />

      {/* Peak indicators - cute icons */}
      <g>
        <circle cx="100" cy="70" r="25" fill="white" opacity="0.9" />
        <text x="100" y="78" textAnchor="middle" fontSize="24">😓</text>
      </g>
      <g>
        <circle cx="300" cy="70" r="25" fill="white" opacity="0.9" />
        <text x="300" y="78" textAnchor="middle" fontSize="24">😰</text>
      </g>

      {/* Gradient definition */}
      <defs>
        <linearGradient id="paradoxGradientWarm" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#F59E0B" />
          <stop offset="50%" stopColor="#EC4899" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>
        <linearGradient id="chartBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(254, 243, 199, 0.3)" />
          <stop offset="100%" stopColor="rgba(252, 231, 243, 0.3)" />
        </linearGradient>
      </defs>

      {/* Labels */}
      <text x="100" y="115" fill="#92400E" fontSize="10" textAnchor="middle" fontWeight="600">Lower Income</text>
      <text x="100" y="128" fill="#B45309" fontSize="9" textAnchor="middle">打幾份工</text>

      <text x="200" y="175" fill="#BE185D" fontSize="10" textAnchor="middle">Declining Attention 注意力下降</text>

      <text x="300" y="115" fill="#6D28D9" fontSize="10" textAnchor="middle" fontWeight="600">Higher Income</text>
      <text x="300" y="128" fill="#7C3AED" fontSize="9" textAnchor="middle">會議太多</text>

      {/* X-axis labels */}
      <text x="200" y="205" fill="rgba(100,100,100,0.7)" fontSize="10" textAnchor="middle">Income Level 收入水平 →</text>
    </svg>
  );
}

// Workday Donut Chart - Warmer
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
          stroke="rgba(236, 72, 153, 0.2)"
          strokeWidth={strokeWidth}
        />
        {/* Admin segment */}
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke="url(#donutGradientWarm)"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={adminOffset}
          strokeLinecap="round"
        />
        <defs>
          <linearGradient id="donutGradientWarm" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#EC4899" />
          </linearGradient>
        </defs>
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-5xl font-bold text-amber-600">40%</span>
        <span className="text-sm text-slate-500">Repetitive Admin</span>
        <span className="text-xs text-slate-400">重複性行政工作</span>
      </div>
    </div>
  );
}

// AI Adoption Staircase - Warmer
function AIAdoptionStaircase({ activeZone, setActiveZone }: { activeZone: string; setActiveZone: (z: string) => void }) {
  const zones = [
    { id: 'trough', label: 'The Trough', labelZh: '低谷', level: '0-1', desc: '"AI? Not my thing." 「AI？唔關我事。」', y: 140, emoji: '😴' },
    { id: 'sweet-spot', label: 'The Sweet Spot', labelZh: '甜蜜點', level: '2-3', desc: 'Real problems: emails, summaries 實際問題：電郵、摘要', y: 90, emoji: '🎯' },
    { id: 'frontier', label: 'The Frontier', labelZh: '前沿', level: '4-6', desc: 'Tokens, RAG, AGI... 技術詞彙', y: 40, emoji: '🚀' },
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
              fill={activeZone === zone.id ? (zone.id === 'sweet-spot' ? 'rgba(236, 72, 153, 0.2)' : 'rgba(251, 191, 36, 0.15)') : 'rgba(255,255,255,0.5)'}
              stroke={zone.id === 'sweet-spot' ? '#EC4899' : 'rgba(200,200,200,0.5)'}
              strokeWidth={zone.id === 'sweet-spot' ? 3 : 1}
              rx="8"
              className="cursor-pointer transition-all duration-300 hover:fill-pink-100"
              onClick={() => setActiveZone(zone.id)}
            />
            <text
              x={100 + i * 110}
              y={zone.y + 30}
              fill={zone.id === 'sweet-spot' ? '#BE185D' : '#64748B'}
              fontSize="20"
              textAnchor="middle"
            >
              {zone.emoji}
            </text>
            <text
              x={100 + i * 110}
              y={zone.y + 50}
              fill={zone.id === 'sweet-spot' ? '#BE185D' : '#475569'}
              fontSize="11"
              textAnchor="middle"
              fontWeight="600"
            >
              {zone.label}
            </text>
            <text
              x={100 + i * 110}
              y={zone.y + 64}
              fill={zone.id === 'sweet-spot' ? '#DB2777' : '#64748B'}
              fontSize="10"
              textAnchor="middle"
            >
              {zone.labelZh}
            </text>
          </g>
        ))}

        {/* Arrow showing progression */}
        <path
          d="M 80 175 L 320 175"
          stroke="rgba(150,150,150,0.5)"
          strokeWidth="2"
          markerEnd="url(#arrowheadWarm)"
        />
        <defs>
          <marker id="arrowheadWarm" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="rgba(150,150,150,0.5)" />
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
            <span className={zone.id === 'sweet-spot' ? 'text-pink-600' : 'text-slate-500'}>
              {zone.desc}
            </span>
          </p>
        ))}
      </div>
    </div>
  );
}

// Hourglass Animation - Warmer
function Hourglass() {
  return (
    <div className="relative w-32 h-48 mx-auto">
      <svg viewBox="0 0 80 120" className="w-full h-full">
        {/* Frame */}
        <rect x="10" y="5" width="60" height="6" rx="3" fill="#D97706" />
        <rect x="10" y="109" width="60" height="6" rx="3" fill="#D97706" />
        <line x1="15" y1="11" x2="15" y2="109" stroke="#D97706" strokeWidth="4" />
        <line x1="65" y1="11" x2="65" y2="109" stroke="#D97706" strokeWidth="4" />

        {/* Glass shape */}
        <path
          d="M 20 15 L 20 45 Q 40 60, 60 45 L 60 15 Z"
          fill="rgba(251, 191, 36, 0.2)"
          stroke="rgba(251, 191, 36, 0.6)"
          strokeWidth="2"
        />
        <path
          d="M 20 105 L 20 75 Q 40 60, 60 75 L 60 105 Z"
          fill="rgba(251, 191, 36, 0.2)"
          stroke="rgba(251, 191, 36, 0.6)"
          strokeWidth="2"
        />

        {/* Sand - top (depleting) */}
        <path
          d="M 25 20 L 25 40 Q 40 52, 55 40 L 55 20 Z"
          fill="#FBBF24"
          className="animate-pulse"
        >
          <animate attributeName="d" dur="3s" repeatCount="indefinite"
            values="M 25 20 L 25 40 Q 40 52, 55 40 L 55 20 Z;M 25 20 L 25 30 Q 40 38, 55 30 L 55 20 Z;M 25 20 L 25 40 Q 40 52, 55 40 L 55 20 Z" />
        </path>

        {/* Sand stream */}
        <line x1="40" y1="52" x2="40" y2="68" stroke="#FBBF24" strokeWidth="3">
          <animate attributeName="opacity" dur="0.5s" repeatCount="indefinite" values="1;0.3;1" />
        </line>

        {/* Sand - bottom (filling) */}
        <path
          d="M 25 100 L 25 85 Q 40 78, 55 85 L 55 100 Z"
          fill="#FBBF24"
          className="animate-pulse"
        >
          <animate attributeName="d" dur="3s" repeatCount="indefinite"
            values="M 25 100 L 25 85 Q 40 78, 55 85 L 55 100 Z;M 25 100 L 25 75 Q 40 68, 55 75 L 55 100 Z;M 25 100 L 25 85 Q 40 78, 55 85 L 55 100 Z" />
        </path>
      </svg>
    </div>
  );
}

// Weekly Calendar - Warmer
function WeekCalendar() {
  const days = [
    { en: 'Mon', zh: '一' },
    { en: 'Tue', zh: '二' },
    { en: 'Wed', zh: '三' },
    { en: 'Thu', zh: '四' },
    { en: 'Fri', zh: '五' },
    { en: 'Sat', zh: '六' },
    { en: 'Sun', zh: '日' },
  ];
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
        <div key={day.en} className="text-center">
          <div className="text-xs text-slate-500 mb-1">{day.en}</div>
          <div className="text-xs text-slate-400 mb-2">{day.zh}</div>
          <div className={`h-16 rounded-xl border-2 flex items-center justify-center transition-all ${
            schedule[i].human
              ? 'border-pink-400 bg-pink-50 shadow-md'
              : schedule[i].admin
              ? 'border-amber-300/50 bg-amber-50/50'
              : 'border-slate-200 bg-white/50'
          }`}>
            <span className="text-xl">
              {schedule[i].human ? '💝' : schedule[i].admin ? '📋' : ''}
            </span>
          </div>
        </div>
      ))}
      <div className="col-span-7 flex justify-center gap-6 mt-4 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-lg">💝</span>
          <span className="text-slate-600">Human Time 人情時間</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-lg">📋</span>
          <span className="text-slate-500">Admin → AI 行政工作</span>
        </div>
      </div>
    </div>
  );
}

// Workflow Diagram - Warmer
function WorkflowDiagram() {
  const steps = [
    { en: 'Analyze', zh: '分析', emoji: '🔍' },
    { en: 'Identify', zh: '識別', emoji: '💡' },
    { en: 'Automate', zh: '自動化', emoji: '🤖' },
    { en: 'Free Up', zh: '釋放時間', emoji: '🎉' },
  ];

  return (
    <div className="flex items-center justify-center gap-2 flex-wrap">
      {steps.map((step, i) => (
        <div key={step.en} className="flex items-center">
          <div className="px-4 py-3 bg-gradient-to-br from-rose-100 to-pink-100 border border-pink-200 rounded-xl shadow-sm hover:shadow-md transition-all">
            <span className="text-2xl block text-center mb-1">{step.emoji}</span>
            <span className="text-pink-600 font-medium block text-center">{step.en}</span>
            <span className="text-pink-400 text-xs block text-center">{step.zh}</span>
          </div>
          {i < steps.length - 1 && (
            <ArrowRight className="w-5 h-5 text-pink-300 mx-2" />
          )}
        </div>
      ))}
    </div>
  );
}

// LinkedIn QR Code
function LinkedInQR() {
  // QR code for https://www.linkedin.com/in/bennettsui/
  return (
    <svg viewBox="0 0 200 200" className="w-40 h-40 mx-auto">
      <rect width="200" height="200" fill="white" rx="12" />
      {/* QR Code pattern - simplified representation */}
      <g fill="#1E293B">
        {/* Position detection patterns - corners */}
        {/* Top-left */}
        <rect x="20" y="20" width="42" height="42" />
        <rect x="26" y="26" width="30" height="30" fill="white" />
        <rect x="32" y="32" width="18" height="18" />

        {/* Top-right */}
        <rect x="138" y="20" width="42" height="42" />
        <rect x="144" y="26" width="30" height="30" fill="white" />
        <rect x="150" y="32" width="18" height="18" />

        {/* Bottom-left */}
        <rect x="20" y="138" width="42" height="42" />
        <rect x="26" y="144" width="30" height="30" fill="white" />
        <rect x="32" y="150" width="18" height="18" />

        {/* Data modules - creating a pattern */}
        {/* Row 1 */}
        <rect x="68" y="20" width="6" height="6" />
        <rect x="80" y="20" width="6" height="6" />
        <rect x="92" y="20" width="6" height="6" />
        <rect x="104" y="20" width="6" height="6" />
        <rect x="116" y="20" width="6" height="6" />

        {/* Row 2 */}
        <rect x="68" y="32" width="6" height="6" />
        <rect x="86" y="32" width="6" height="6" />
        <rect x="98" y="32" width="6" height="6" />
        <rect x="122" y="32" width="6" height="6" />

        {/* More data rows */}
        <rect x="68" y="44" width="6" height="6" />
        <rect x="80" y="44" width="6" height="6" />
        <rect x="110" y="44" width="6" height="6" />
        <rect x="122" y="44" width="6" height="6" />

        <rect x="74" y="56" width="6" height="6" />
        <rect x="86" y="56" width="6" height="6" />
        <rect x="98" y="56" width="6" height="6" />
        <rect x="116" y="56" width="6" height="6" />

        {/* Timing pattern */}
        <rect x="20" y="68" width="6" height="6" />
        <rect x="32" y="68" width="6" height="6" />
        <rect x="44" y="68" width="6" height="6" />
        <rect x="56" y="68" width="6" height="6" />

        {/* Middle section */}
        <rect x="68" y="68" width="6" height="6" />
        <rect x="86" y="68" width="6" height="6" />
        <rect x="98" y="68" width="6" height="6" />
        <rect x="116" y="68" width="6" height="6" />
        <rect x="138" y="68" width="6" height="6" />
        <rect x="150" y="68" width="6" height="6" />
        <rect x="168" y="68" width="6" height="6" />

        {/* More data */}
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

        {/* Bottom rows */}
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

        {/* Alignment pattern */}
        <rect x="138" y="138" width="24" height="24" />
        <rect x="144" y="144" width="12" height="12" fill="white" />
        <rect x="147" y="147" width="6" height="6" />
      </g>

      {/* LinkedIn icon in center */}
      <rect x="80" y="80" width="40" height="40" rx="8" fill="#0A66C2" />
      <text x="100" y="108" textAnchor="middle" fill="white" fontSize="24" fontWeight="bold">in</text>
    </svg>
  );
}

// ==================== MAIN COMPONENT ====================
export default function AIHumanConnectionPage() {
  const [scrollY, setScrollY] = useState(0);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [activeZone, setActiveZone] = useState('sweet-spot');
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set());
  const [hoveredChoice, setHoveredChoice] = useState<string | null>('human-strategy');
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<{ [key: string]: HTMLElement | null }>({});

  const sectionIds = ['hero', 'whytough', 'paradox', 'intersection', 'shallows', 'sweetspot', 'casestudies', 'timetrap', 'threepaths', 'hightouch', 'experiment', 'workflows', 'closing'];

  // Scroll and mouse tracking
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);

      // Determine current section
      const scrollPosition = window.scrollY + window.innerHeight / 2;
      for (let i = sectionIds.length - 1; i >= 0; i--) {
        const section = sectionRefs.current[sectionIds[i]];
        if (section && section.offsetTop <= scrollPosition) {
          setCurrentSectionIndex(i);
          break;
        }
      }
    };
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

  const scrollToNextSection = useCallback(() => {
    const nextIndex = Math.min(currentSectionIndex + 1, sectionIds.length - 1);
    const nextSection = sectionRefs.current[sectionIds[nextIndex]];
    if (nextSection) {
      nextSection.scrollIntoView({ behavior: 'smooth' });
    }
  }, [currentSectionIndex]);

  const isVisible = (id: string) => visibleSections.has(id);

  return (
    <div ref={containerRef} className="min-h-screen bg-gradient-to-b from-amber-50 via-rose-50 to-pink-50 text-slate-800 overflow-hidden">
      {/* Parallax Background - Warm floating elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute w-[600px] h-[600px] rounded-full bg-gradient-to-br from-amber-200/30 to-orange-200/20 blur-3xl"
          style={{
            left: '10%',
            top: '5%',
            transform: `translate(${mousePos.x * 40}px, ${scrollY * 0.08 + mousePos.y * 40}px)`,
          }}
        />
        <div
          className="absolute w-[500px] h-[500px] rounded-full bg-gradient-to-br from-rose-200/30 to-pink-200/20 blur-3xl"
          style={{
            right: '5%',
            top: '40%',
            transform: `translate(${mousePos.x * -25}px, ${scrollY * -0.04 + mousePos.y * -25}px)`,
          }}
        />
        <div
          className="absolute w-[400px] h-[400px] rounded-full bg-gradient-to-br from-purple-200/20 to-violet-200/10 blur-3xl"
          style={{
            left: '50%',
            bottom: '10%',
            transform: `translate(${mousePos.x * 30}px, ${scrollY * 0.06 + mousePos.y * 30}px)`,
          }}
        />
        {/* Floating hearts background */}
        <div
          className="absolute w-[200px] h-[200px] opacity-30"
          style={{
            right: '15%',
            top: '20%',
            transform: `translate(${mousePos.x * -20}px, ${scrollY * -0.1 + mousePos.y * -20}px)`,
          }}
        >
          <FloatingHearts />
        </div>
      </div>

      {/* Sticky Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-xl border-b border-rose-100">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/vibe-demo" className="flex items-center gap-2 text-slate-500 hover:text-rose-600 transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm">Back to Demos</span>
          </Link>
          <div className="hidden md:flex items-center gap-2 text-sm">
            <span className="text-rose-600 font-medium">用好 AI，過好生活</span>
            <span className="text-slate-400">|</span>
            <span className="text-slate-500">AI Mastery for Human Connection</span>
          </div>
        </div>
      </nav>

      {/* Floating Down Button */}
      {currentSectionIndex < sectionIds.length - 1 && (
        <button
          onClick={scrollToNextSection}
          className="fixed bottom-8 right-8 z-40 w-14 h-14 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 text-white shadow-lg hover:shadow-xl hover:scale-110 transition-all flex items-center justify-center animate-bounce"
          style={{ animationDuration: '2s' }}
          aria-label="Scroll to next section"
        >
          <ChevronDown className="w-7 h-7" />
        </button>
      )}

      {/* ===== SECTION 0: HERO ===== */}
      <section
        id="hero"
        ref={(el) => { sectionRefs.current['hero'] = el; }}
        className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16"
      >
        {/* Parallax background shapes */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ transform: `translateY(${scrollY * 0.3}px)` }}
        >
          <div className="w-[500px] h-[500px] rounded-full border-2 border-rose-200/50" />
          <div className="absolute w-[350px] h-[350px] rounded-full border-2 border-amber-200/50" />
          <div className="absolute w-[200px] h-[200px] rounded-full bg-gradient-to-br from-rose-200/30 to-pink-200/30" />
        </div>

        {/* Hero content */}
        <div
          className="relative z-10 text-center px-4 max-w-4xl"
          style={{ transform: `translateY(${scrollY * -0.2}px)` }}
        >
          {/* Illustration */}
          <div className="w-48 h-32 mx-auto mb-6">
            <PeopleConnecting className="w-full h-full" />
          </div>

          <div className="flex items-center justify-center gap-3 mb-6">
            <Brain className="w-8 h-8 text-amber-500" />
            <span className="text-amber-600 font-medium tracking-widest uppercase text-sm">5 Miles Lab</span>
            <Heart className="w-8 h-8 text-rose-500" />
          </div>

          <h1
            className="text-4xl md:text-6xl lg:text-7xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-amber-500 via-rose-500 to-pink-500"
            style={{
              transform: `translate(${mousePos.x * -20}px, ${mousePos.y * -20}px)`,
              transition: 'transform 0.1s ease-out',
            }}
          >
            用好 AI，過好生活
          </h1>

          <h2 className="text-2xl md:text-3xl text-slate-600 mb-6">
            AI Mastery for Human Connection
          </h2>

          <p className="text-lg md:text-xl text-slate-500 mb-4">
            How to automate the mundane so you can design the meaningful
          </p>
          <p className="text-slate-400 mb-2">
            讓機器處理瑣碎，讓人心專注意義
          </p>

          <p className="text-slate-400 mb-12">
            Bennet Tsui 徐天佑 | Founder, 5 Miles Lab | Ex-4As Ad Agencies
          </p>

          <button
            onClick={scrollToNextSection}
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-rose-400 to-pink-500 text-white font-semibold rounded-full hover:shadow-lg hover:scale-105 transition-all group"
          >
            <span>開始探索 Start exploring</span>
            <ChevronDown className="w-5 h-5 group-hover:translate-y-1 transition-transform" />
          </button>
        </div>

        {/* Scroll indicator */}
        <div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          style={{ opacity: Math.max(0, 1 - scrollY / 300) }}
        >
          <div className="w-6 h-10 rounded-full border-2 border-rose-300 flex justify-center pt-2">
            <div className="w-1.5 h-3 bg-rose-400 rounded-full animate-bounce" />
          </div>
        </div>
      </section>

      {/* ===== SECTION: WHY IT'S TOUGH ===== */}
      <section
        id="whytough"
        ref={(el) => { sectionRefs.current['whytough'] = el; }}
        className="relative py-32 px-4"
      >
        <div className="max-w-4xl mx-auto">
          <div className={`text-center mb-16 transition-all duration-1000 ${isVisible('whytough') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <span className="text-5xl mb-4 block">😰</span>
            <h2 className="text-3xl md:text-5xl font-bold mb-4 text-slate-800">
              Why It&apos;s So Tough
            </h2>
            <p className="text-2xl text-rose-500 mb-2">為什麼這麼難？</p>
            <p className="text-slate-500 max-w-2xl mx-auto">
              Modern life pulls our attention in a thousand directions.<br />
              現代生活把我們的注意力扯向千百個方向。
            </p>
          </div>

          <WhyToughInfographic isVisible={isVisible('whytough')} />

          {/* Illustration */}
          <div className="mt-12 flex justify-center">
            <div className="w-32 h-44">
              <HappyPerson className="w-full h-full opacity-80" />
            </div>
          </div>
        </div>
      </section>

      {/* ===== SECTION 1: THE PARADOX OF PROGRESS ===== */}
      <section
        id="paradox"
        ref={(el) => { sectionRefs.current['paradox'] = el; }}
        className="relative py-32 px-4 bg-white/50"
      >
        <div className="max-w-4xl mx-auto">
          <div className={`transition-all duration-1000 ${isVisible('paradox') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <h2 className="text-3xl md:text-5xl font-bold text-center mb-4 text-slate-800">
              The Paradox of Progress
            </h2>
            <p className="text-2xl text-center text-rose-500 mb-8">進步的悖論</p>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-rose-100 shadow-lg mb-12">
              <p className="text-xl text-center text-slate-700 italic">
                &quot;Last month, how many times did you sit down with someone for 10+ minutes without checking a phone?&quot;
              </p>
              <p className="text-lg text-center text-slate-500 italic mt-2">
                「上個月，你有多少次和人坐下來10分鐘以上，而沒有看手機？」
              </p>
            </div>

            {/* Parallax chart */}
            <div style={{ transform: `translateY(${(scrollY - 800) * -0.03}px)` }}>
              <ParadoxChart />
            </div>

            <p className="text-center text-slate-500 mt-8 max-w-2xl mx-auto">
              Whether we earn less or more, our attention is being pulled away from the people who matter most.
            </p>
            <p className="text-center text-slate-400 mt-2">
              無論收入高低，我們的注意力都在遠離最重要的人。
            </p>
          </div>
        </div>
      </section>

      {/* ===== SECTION 2: LIVING AT THE INTERSECTION ===== */}
      <section
        id="intersection"
        ref={(el) => { sectionRefs.current['intersection'] = el; }}
        className="relative py-32 px-4"
      >
        <div className="max-w-5xl mx-auto">
          <h2 className={`text-3xl md:text-5xl font-bold text-center mb-4 transition-all duration-1000 ${isVisible('intersection') ? 'opacity-100' : 'opacity-0'}`}>
            Living at the Intersection of<br />
            <span className="text-amber-500">Efficiency</span> and <span className="text-rose-500">Empathy</span>
          </h2>
          <p className="text-xl text-center text-slate-500 mb-16">在效率與同理心的交匯處</p>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: 'The Grind', titleZh: '拼搏', icon: Zap, color: 'from-amber-400 to-orange-500', desc: '20 years in advertising. Efficiency was survival.', descZh: '廣告業20年。效率就是生存。' },
              { title: 'The Soul', titleZh: '靈魂', icon: Heart, color: 'from-rose-400 to-pink-500', desc: 'But the best work came from human understanding.', descZh: '但最好的作品來自人性的理解。' },
              { title: 'The Tech', titleZh: '科技', icon: Brain, color: 'from-purple-400 to-violet-500', desc: 'Now AI handles the grind. We focus on the soul.', descZh: '現在AI處理苦差。我們專注靈魂。' },
            ].map((item, idx) => (
              <div
                key={item.title}
                className={`text-center transition-all duration-700 ${isVisible('intersection') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
                style={{ transitionDelay: `${idx * 200}ms` }}
              >
                <div className={`w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-lg`}>
                  <item.icon className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-1 text-slate-800">{item.title}</h3>
                <p className="text-rose-500 text-sm mb-3">{item.titleZh}</p>
                <p className="text-slate-600">{item.desc}</p>
                <p className="text-slate-400 text-sm mt-1">{item.descZh}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== SECTION 3: DROWNING IN THE SHALLOWS ===== */}
      <section
        id="shallows"
        ref={(el) => { sectionRefs.current['shallows'] = el; }}
        className="relative py-32 px-4 bg-white/50"
      >
        <div className="max-w-4xl mx-auto">
          <h2 className={`text-3xl md:text-5xl font-bold text-center mb-4 transition-all duration-1000 ${isVisible('shallows') ? 'opacity-100' : 'opacity-0'}`}>
            Drowning in the Shallows
          </h2>
          <p className="text-2xl text-center text-rose-500 mb-2">淹沒在瑣碎之中</p>
          <p className="text-center text-slate-500 mb-16">The hidden cost of repetitive admin 重複性行政的隱藏成本</p>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className={`transition-all duration-1000 ${isVisible('shallows') ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}>
              <WorkdayDonut />
            </div>

            <div className={`space-y-6 transition-all duration-1000 delay-300 ${isVisible('shallows') ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}>
              {[
                { en: '40% of work time spent on repetitive admin tasks', zh: '40%工作時間花在重複性行政' },
                { en: 'Only 30 out of 40 hours truly productive', zh: '40小時中只有30小時真正有生產力' },
                { en: '75% feel time is wasted on tasks that could be automated', zh: '75%人覺得時間浪費在可自動化的任務上' },
              ].map((stat, idx) => (
                <div key={idx} className="flex items-start gap-4 p-4 bg-white/80 rounded-xl border border-rose-100 shadow-sm">
                  <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-slate-700">{stat.en}</p>
                    <p className="text-slate-400 text-sm">{stat.zh}</p>
                  </div>
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
        className="relative py-32 px-4"
      >
        <div className="max-w-4xl mx-auto">
          <h2 className={`text-3xl md:text-5xl font-bold text-center mb-4 transition-all duration-1000 ${isVisible('sweetspot') ? 'opacity-100' : 'opacity-0'}`}>
            The Sweet Spot of AI Adoption
          </h2>
          <p className="text-2xl text-center text-rose-500 mb-4">AI應用的甜蜜點</p>
          <p className="text-center text-slate-500 mb-16">Click each zone to learn more 點擊每個區域了解更多</p>

          <AIAdoptionStaircase activeZone={activeZone} setActiveZone={setActiveZone} />

          <div className="mt-12 p-6 bg-gradient-to-r from-rose-100 to-pink-100 border border-rose-200 rounded-2xl text-center shadow-sm">
            <p className="text-rose-600 font-medium">
              You don&apos;t need to be a coder. The goal is simply moving from Stage 1 to Stage 2.
            </p>
            <p className="text-rose-400 text-sm mt-1">
              你不需要會寫程式。目標只是從第1階段進到第2階段。
            </p>
          </div>
        </div>
      </section>

      {/* ===== SECTION 5: WHEN THE MACHINE TYPES ===== */}
      <section
        id="casestudies"
        ref={(el) => { sectionRefs.current['casestudies'] = el; }}
        className="relative py-32 px-4 bg-white/50"
      >
        <div className="max-w-5xl mx-auto">
          <h2 className={`text-3xl md:text-5xl font-bold text-center mb-4 transition-all duration-1000 ${isVisible('casestudies') ? 'opacity-100' : 'opacity-0'}`}>
            When the Machine Types,<br />the Human Can Listen
          </h2>
          <p className="text-2xl text-center text-rose-500 mb-4">當機器打字，人可以聆聽</p>
          <p className="text-center text-slate-500 mb-16">Efficiency for the machine. Empathy for the people. 機器講效率，人講心。</p>

          <div className="grid md:grid-cols-3 gap-6">
            {caseStudies.map((study, idx) => (
              <div
                key={study.id}
                className={`bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-rose-100 hover:border-rose-300 hover:shadow-lg transition-all duration-500 hover:-translate-y-2 ${isVisible('casestudies') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
                style={{ transitionDelay: `${idx * 150}ms` }}
              >
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center mb-4 shadow-md">
                  <study.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-lg font-bold mb-1 text-slate-800">{study.title}</h3>
                <p className="text-rose-500 text-sm mb-3">{study.titleZh}</p>
                <div className="space-y-3">
                  <div>
                    <span className="text-xs text-amber-600 uppercase tracking-wider font-medium">Action 行動</span>
                    <p className="text-slate-600 text-sm">{study.action}</p>
                    <p className="text-slate-400 text-xs">{study.actionZh}</p>
                  </div>
                  <div>
                    <span className="text-xs text-rose-600 uppercase tracking-wider font-medium">Result 結果</span>
                    <p className="text-slate-700 text-sm font-medium">{study.result}</p>
                    <p className="text-slate-400 text-xs">{study.resultZh}</p>
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
        className="relative py-32 px-4"
      >
        <div className="max-w-4xl mx-auto">
          <h2 className={`text-3xl md:text-5xl font-bold text-center mb-4 transition-all duration-1000 ${isVisible('timetrap') ? 'opacity-100' : 'opacity-0'}`}>
            The &quot;Time Saved&quot; Trap
          </h2>
          <p className="text-2xl text-center text-rose-500 mb-16">「省下時間」的陷阱</p>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className={`transition-all duration-1000 ${isVisible('timetrap') ? 'opacity-100' : 'opacity-0'}`}>
              <Hourglass />
              <p className="text-center text-slate-500 mt-4 text-sm">Time is slipping away... 時間在流逝...</p>
            </div>

            <div className={`space-y-6 transition-all duration-1000 delay-300 ${isVisible('timetrap') ? 'opacity-100' : 'opacity-0'}`}>
              <p className="text-xl text-slate-700">
                GenAI users already save <span className="text-rose-500 font-bold">2–4 hours per week</span>.
              </p>
              <p className="text-slate-500">
                GenAI用戶已經每週節省2-4小時。
              </p>
              <p className="text-slate-600">
                But without intentional design, saved time doesn&apos;t lead to freedom.
              </p>
              <p className="text-slate-400 text-sm">
                但沒有刻意設計，省下的時間不會帶來自由。
              </p>
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <p className="text-amber-700">
                  <strong>Parkinson&apos;s Law 帕金森定律:</strong>
                </p>
                <p className="text-amber-600 text-sm mt-1">
                  Work expands to fill the time available.
                </p>
                <p className="text-amber-500 text-sm">
                  工作會膨脹到填滿所有可用時間。
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
        className="relative py-32 px-4 bg-white/50"
      >
        <div className="max-w-5xl mx-auto">
          <h2 className={`text-3xl md:text-5xl font-bold text-center mb-4 transition-all duration-1000 ${isVisible('threepaths') ? 'opacity-100' : 'opacity-0'}`}>
            Three Paths for Your Saved Hours
          </h2>
          <p className="text-2xl text-center text-rose-500 mb-16">省下時間的三條路</p>

          <div className="grid md:grid-cols-3 gap-6">
            {threeChoices.map((choice, idx) => (
              <div
                key={choice.id}
                className={`relative group cursor-pointer transition-all duration-500 ${isVisible('threepaths') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
                style={{ transitionDelay: `${idx * 150}ms` }}
                onMouseEnter={() => setHoveredChoice(choice.id)}
                onMouseLeave={() => setHoveredChoice('human-strategy')}
              >
                {/* Glow effect for highlighted choice */}
                {choice.highlight && (
                  <div className="absolute inset-0 bg-gradient-to-br from-rose-300 to-pink-300 rounded-2xl blur-xl opacity-40" />
                )}

                <div className={`relative h-full p-6 rounded-2xl border-2 transition-all ${
                  hoveredChoice === choice.id
                    ? choice.highlight
                      ? 'border-rose-400 bg-white shadow-xl'
                      : 'border-slate-300 bg-white shadow-lg'
                    : 'border-slate-200 bg-white/80'
                }`}>
                  <div className="text-4xl mb-4">{choice.emoji}</div>
                  <div className={`inline-block px-3 py-1 rounded-full text-xs font-medium mb-4 text-white bg-gradient-to-r ${choice.color}`}>
                    Choice {idx + 1} 選擇{idx + 1}
                  </div>
                  <h3 className="text-xl font-bold mb-1 text-slate-800">{choice.title}</h3>
                  <p className="text-rose-500 text-sm mb-2">{choice.titleZh}</p>
                  <p className="text-slate-500 text-sm mb-4">{choice.subtitle} {choice.subtitleZh}</p>
                  <p className="text-slate-600 text-sm mb-4">{choice.description}</p>
                  <p className="text-slate-400 text-xs mb-4">{choice.descriptionZh}</p>
                  <div className={`p-3 rounded-lg ${choice.highlight ? 'bg-rose-50' : 'bg-slate-50'}`}>
                    <p className={`text-sm font-medium ${choice.highlight ? 'text-rose-600' : 'text-slate-500'}`}>
                      {choice.result}
                    </p>
                    <p className={`text-xs ${choice.highlight ? 'text-rose-400' : 'text-slate-400'}`}>
                      {choice.resultZh}
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
        className="relative py-32 px-4"
      >
        <div className="max-w-4xl mx-auto">
          <h2 className={`text-3xl md:text-5xl font-bold text-center mb-4 transition-all duration-1000 ${isVisible('hightouch') ? 'opacity-100' : 'opacity-0'}`}>
            The Philosophy of High-Touch
          </h2>
          <p className="text-2xl text-center text-rose-500 mb-16">高接觸的哲學</p>

          {/* Coffee chat illustration */}
          <div className="w-40 h-32 mx-auto mb-12">
            <CoffeeChat className="w-full h-full" />
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-4">
              {highTouchChecklist.map((item, idx) => (
                <div
                  key={idx}
                  className={`flex items-center gap-4 p-4 bg-white/80 rounded-xl border border-rose-100 shadow-sm transition-all duration-500 hover:shadow-md ${isVisible('hightouch') ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}
                  style={{ transitionDelay: `${idx * 200}ms` }}
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-rose-100 to-pink-100 flex items-center justify-center">
                    <item.icon className="w-6 h-6 text-rose-500" />
                  </div>
                  <div>
                    <span className="text-slate-700">{item.text}</span>
                    <p className="text-slate-400 text-sm">{item.textZh}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className={`transition-all duration-1000 delay-500 ${isVisible('hightouch') ? 'opacity-100' : 'opacity-0'}`}>
              <div className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-2xl p-6 border border-rose-200 shadow-sm">
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-rose-500">88%</div>
                    <div className="text-xs text-slate-500">Satisfaction with<br />human service</div>
                    <div className="text-xs text-slate-400">人工服務滿意度</div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-slate-400">60%</div>
                    <div className="text-xs text-slate-500">Satisfaction with<br />AI service</div>
                    <div className="text-xs text-slate-400">AI服務滿意度</div>
                  </div>
                </div>
                <p className="text-center text-slate-600 italic">
                  &quot;AI satisfies the task. Humans satisfy the soul.&quot;
                </p>
                <p className="text-center text-slate-400 text-sm italic mt-1">
                  「AI滿足任務。人滿足心靈。」
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
        className="relative py-32 px-4 bg-white/50"
      >
        <div className="max-w-4xl mx-auto">
          <h2 className={`text-3xl md:text-5xl font-bold text-center mb-4 transition-all duration-1000 ${isVisible('experiment') ? 'opacity-100' : 'opacity-0'}`}>
            A One-Week Experiment
          </h2>
          <p className="text-2xl text-center text-rose-500 mb-4">一週實驗</p>
          <p className="text-center text-slate-500 mb-16">Replace admin blocks with human time 用人情時間取代行政時段</p>

          <WeekCalendar />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12">
            {experimentSteps.map((step, idx) => (
              <div
                key={step.step}
                className={`text-center p-4 bg-white/80 rounded-xl border border-rose-100 shadow-sm hover:shadow-md transition-all duration-500 ${isVisible('experiment') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
                style={{ transitionDelay: `${idx * 100}ms` }}
              >
                <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center text-white font-bold">
                  {idx + 1}
                </div>
                <div className="text-sm font-bold text-slate-800 mb-1">{step.step}</div>
                <div className="text-xs text-rose-500 mb-2">{step.stepZh}</div>
                <div className="text-xs text-slate-500">{step.description}</div>
                <div className="text-xs text-slate-400">{step.descriptionZh}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== SECTION 10: DESIGNING WORKFLOWS ===== */}
      <section
        id="workflows"
        ref={(el) => { sectionRefs.current['workflows'] = el; }}
        className="relative py-32 px-4"
      >
        <div className="max-w-4xl mx-auto">
          <h2 className={`text-3xl md:text-5xl font-bold text-center mb-4 transition-all duration-1000 ${isVisible('workflows') ? 'opacity-100' : 'opacity-0'}`}>
            Designing Workflows,<br />Not Just Buying Software
          </h2>
          <p className="text-2xl text-center text-rose-500 mb-4">設計工作流程，而非只是買軟件</p>
          <p className="text-center text-slate-500 mb-16">
            We don&apos;t just sell products. We sit with you to understand your workflows.
          </p>
          <p className="text-center text-slate-400 text-sm mb-16">
            我們不只賣產品。我們坐下來理解你的工作流程。
          </p>

          <WorkflowDiagram />

          <div className="mt-12 grid md:grid-cols-3 gap-6 text-center">
            {[
              { en: 'Analyze bottlenecks in your current process', zh: '分析現有流程的瓶頸' },
              { en: 'Identify 10–20% of admin that can be automated', zh: '識別10-20%可自動化的行政工作' },
              { en: 'Free up time for what truly matters', zh: '騰出時間給真正重要的事' },
            ].map((text, idx) => (
              <div
                key={idx}
                className={`p-4 bg-white/80 rounded-xl border border-rose-100 shadow-sm transition-all duration-500 hover:shadow-md ${isVisible('workflows') ? 'opacity-100' : 'opacity-0'}`}
                style={{ transitionDelay: `${idx * 150}ms` }}
              >
                <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-gradient-to-br from-rose-100 to-pink-100 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-rose-500" />
                </div>
                <p className="text-slate-700 text-sm">{text.en}</p>
                <p className="text-slate-400 text-xs mt-1">{text.zh}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== SECTION 11: CLOSING ===== */}
      <section
        id="closing"
        ref={(el) => { sectionRefs.current['closing'] = el; }}
        className="relative py-32 px-4 bg-gradient-to-b from-white/50 to-rose-50"
      >
        <div className="max-w-3xl mx-auto text-center">
          {/* Illustration */}
          <div className="w-56 h-36 mx-auto mb-8">
            <PeopleConnecting className="w-full h-full" />
          </div>

          <h2 className={`text-4xl md:text-6xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-amber-500 via-rose-500 to-pink-500 transition-all duration-1000 ${isVisible('closing') ? 'opacity-100' : 'opacity-0'}`}>
            用好 AI，過好生活
          </h2>
          <h3 className="text-2xl md:text-3xl text-slate-600 mb-8">
            AI Speed, Human Direction
          </h3>

          <p className="text-xl text-slate-600 mb-2">
            AI makes us faster. But speed is useless without direction.
          </p>
          <p className="text-slate-500 mb-2">
            AI讓我們更快。但沒有方向的速度毫無意義。
          </p>
          <p className="text-lg text-rose-500 mb-12">
            Let&apos;s use this speed to get back to the people who matter.
            <br />
            <span className="text-rose-400">讓我們用這速度，回到重要的人身邊。</span>
          </p>

          <div className="inline-block p-8 bg-white/80 backdrop-blur-sm rounded-2xl border border-rose-100 shadow-lg mb-12">
            <p className="text-xl font-medium mb-1 text-slate-800">Bennet Tsui 徐天佑</p>
            <p className="text-rose-500 mb-6">Founder, 5 Miles Lab</p>

            <LinkedInQR />

            <p className="text-sm text-slate-500 mt-4">Scan to connect on LinkedIn</p>
            <p className="text-xs text-slate-400">掃描連接 LinkedIn</p>
            <a
              href="https://www.linkedin.com/in/bennettsui/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-500 hover:text-blue-600 mt-2 block"
            >
              linkedin.com/in/bennettsui
            </a>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button className="px-8 py-3 bg-gradient-to-r from-rose-400 to-pink-500 text-white font-semibold rounded-full hover:shadow-lg hover:scale-105 transition-all">
              Book a Conversation 預約對話
            </button>
            <button className="px-8 py-3 bg-white border border-rose-200 text-rose-600 font-semibold rounded-full hover:bg-rose-50 hover:shadow-md transition-all">
              Follow Our Work 關注我們
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-rose-100 bg-white/50">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-slate-500 text-sm">
            用好 AI，過好生活 | AI Mastery for Human Connection
          </p>
          <p className="text-rose-400 text-sm mt-1">
            5 Miles Lab
          </p>
          <p className="text-slate-400 text-xs mt-2">
            Demo site for 5ML Vibe Code Showcase
          </p>
        </div>
      </footer>
    </div>
  );
}
