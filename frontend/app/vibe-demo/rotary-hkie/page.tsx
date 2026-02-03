'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft, X, Calendar, Users, Globe, Award, Heart, GraduationCap, Handshake, MapPin, Clock, Mail, Camera, Building, Landmark, Network, Smartphone, Trophy, Star, ChevronRight, BookOpen, Lightbulb, Quote, TrendingUp } from 'lucide-react';

// ==================== DATA ====================
const clubMeta = {
  name: 'Rotary Club of Hong Kong Island East',
  nameChinese: '香港島東扶輪社',
  founded: 1954,
  subtitle: 'Serving Hong Kong Island East since 1954',
  subtitleChinese: '自1954年服務香港島東區',
  descriptionEn: 'The Rotary Club of Hong Kong Island East (RCHKIE) has been a pillar of community service for seven decades. Our members are dedicated professionals and business leaders committed to making a positive impact through humanitarian projects, youth development, and international fellowship.',
  descriptionZh: '香港島東扶輪社自創立以來，一直致力服務社區超過七十載。我們的社員來自不同專業領域，透過人道服務、青年發展及國際交流，為社會帶來正面影響。',
};

// Fun facts about Rotary
const rotaryFunFacts = [
  {
    fact: 'Rotary International has over 1.4 million members worldwide',
    factZh: '國際扶輪在全球擁有超過140萬名社員',
    icon: Users,
  },
  {
    fact: 'Rotary has contributed over $2.1 billion to eradicate polio since 1985',
    factZh: '自1985年起，扶輪已捐獻超過21億美元用於根除小兒麻痺症',
    icon: Heart,
  },
  {
    fact: 'The first Rotary club was founded in Chicago in 1905',
    factZh: '第一個扶輪社於1905年在芝加哥成立',
    icon: Landmark,
  },
  {
    fact: 'District 3450 covers Hong Kong, Macao, and Mongolia',
    factZh: '3450地區涵蓋香港、澳門及蒙古',
    icon: Globe,
  },
  {
    fact: '"Service Above Self" is the principal motto of Rotary',
    factZh: '「超我服務」是扶輪的主要座右銘',
    icon: Award,
  },
];

// Stats for animated counters
const clubStats = [
  { label: 'Years of Service', value: 70, suffix: '+', icon: Calendar },
  { label: 'Active Members', value: 50, suffix: '+', icon: Users },
  { label: 'Projects Completed', value: 200, suffix: '+', icon: Award },
  { label: 'Students Supported', value: 1000, suffix: '+', icon: GraduationCap },
];

// Updated history timeline with accurate data
const historyTimeline = [
  {
    id: 'founding',
    year: '1931',
    title: 'Mother Club Founded',
    titleZh: '母社成立',
    description: 'Rotary Club of Hong Kong established as the first Rotary club in the area, becoming the foundation for future clubs.',
    icon: Landmark,
  },
  {
    id: 'birth',
    year: '1954',
    title: 'Hong Kong Island East is Born',
    titleZh: '港島東扶輪社誕生',
    description: 'Rotary Club of Hong Kong sponsors Rotary Club of Hong Kong Island East to serve the growing communities on the eastern side of Hong Kong Island.',
    icon: Building,
  },
  {
    id: 'growth',
    year: '1960s-1990s',
    title: 'Growing with the City',
    titleZh: '與城市共同成長',
    description: 'Supporting education, youth development and community needs as Hong Kong Island East transforms from factories and resettlement areas to modern neighborhoods.',
    icon: Users,
  },
  {
    id: 'today',
    year: 'Today',
    title: 'Part of District 3450',
    titleZh: '地區3450成員',
    description: 'An active English-speaking club connecting professionals, youth and partners in Hong Kong and beyond as part of Rotary District 3450.',
    icon: Globe,
  },
];

// Service focus areas
const serviceFocusAreas = [
  {
    id: 'youth',
    titleEn: 'Youth & Education',
    titleZh: '青年與教育',
    descEn: 'Student leadership, service learning, and creative programs such as the Student Smartphone Photo Contest for primary and secondary students.',
    descZh: '學生領袖培訓、服務學習，以及面向中小學生的創意項目，例如學生手機攝影比賽。',
    icon: GraduationCap,
    color: 'from-blue-500 to-cyan-500',
    stat: '500+ students engaged annually',
  },
  {
    id: 'community',
    titleEn: 'Community Care',
    titleZh: '社區關懷',
    descEn: 'Supporting families, elderly and vulnerable groups in Hong Kong Island East through practical community projects.',
    descZh: '透過實際行動，支援港島東區的家庭、長者和有需要人士。',
    icon: Heart,
    color: 'from-rose-500 to-pink-500',
    stat: '12+ community programs',
  },
  {
    id: 'international',
    titleEn: 'International & District 3450',
    titleZh: '地區與國際連結',
    descEn: 'Working with Rotary District 3450 and partner clubs to contribute to wider causes such as health, education and disaster relief.',
    descZh: '與3450地區及友社合作，參與健康、教育、救災等更廣泛的國際服務。',
    icon: Globe,
    color: 'from-emerald-500 to-teal-500',
    stat: '3 countries in District 3450',
  },
];

// Photo contest data
const photoContest = {
  title: 'Student Smartphone Photo Contest',
  titleZh: '學生手機攝影比賽',
  edition: '4th Edition',
  year: '2025-2026',
  theme: 'Hong Kong Through Your Phone Cam',
  themeZh: '用手機鏡頭看香港',
  target: 'Open to all primary and secondary school students in Hong Kong',
  targetZh: '參賽對象：全港中小學生',
  description: 'Capture local moments that show how you see Hong Kong – from cityscapes to everyday life.',
  rules: [
    'One photo per student',
    'Smartphone only',
    'Local Hong Kong content',
    'Online submission via QR code',
  ],
  awards: [
    { place: 'Champion', amount: 2500, icon: Trophy },
    { place: '1st Runner-up', amount: 1500, icon: Star },
    { place: '2nd Runner-up', amount: 1000, icon: Award },
  ],
};

// Updated projects with accurate data
const projects = [
  {
    id: 'photo-contest',
    title: 'Student Smartphone Photo Contest',
    titleZh: '學生手機攝影比賽',
    years: '2022-present',
    tags: ['Youth & Education', 'Signature Events'],
    category: 'youth',
    short: '4th annual photography competition encouraging students to capture Hong Kong through their smartphone lenses.',
    long: 'The Student Smartphone Photo Contest is an annual competition now in its 4th edition, open to primary and secondary school students across Hong Kong. Participants use their smartphones to capture images under the theme "Hong Kong Through Your Phone Cam". The contest promotes creativity, visual literacy, and appreciation for Hong Kong\'s unique urban landscape. Winning entries are exhibited publicly and winners receive book vouchers (Champion: $2,500, 1st Runner-up: $1,500, 2nd Runner-up: $1,000) plus certificates.',
  },
  {
    id: '70th-anniversary',
    title: '70th Anniversary Celebration',
    titleZh: '七十週年慶典',
    years: '2024',
    tags: ['Signature Events', 'Club Legacy'],
    category: 'signature',
    short: 'A milestone celebration marking seven decades of service to Hong Kong Island East.',
    long: 'In 2024, RCHKIE celebrates its 70th anniversary with a series of commemorative events including a gala dinner, community service day, and historical exhibition. The celebration honors past and present members while looking forward to the next chapter of service. Special recognition is given to founding members\' families and long-serving Rotarians who have shaped the club\'s legacy.',
  },
  {
    id: 'joint-service',
    title: 'Joint Service with District 3450',
    titleZh: '地區3450聯合服務',
    years: 'Ongoing',
    tags: ['International'],
    category: 'international',
    short: 'Collaborative humanitarian projects with Rotary clubs across Hong Kong, Macao, and Mongolia.',
    long: 'RCHKIE actively participates in District 3450 initiatives covering Hong Kong, Macao, and Mongolia. Joint service projects include global causes such as polio eradication, disaster relief efforts, educational exchanges, and cross-border charitable initiatives. These partnerships exemplify Rotary\'s global reach and fellowship.',
  },
  {
    id: 'elderly-care',
    title: 'Community Elderly Care Program',
    titleZh: '長者關懷計劃',
    years: '2018-present',
    tags: ['Community Care'],
    category: 'community',
    short: 'Regular visits and support services for elderly residents in Hong Kong Island East.',
    long: 'Recognizing the aging population in our district, RCHKIE launched a comprehensive elderly care program. Members visit elderly homes monthly, organize festive celebrations, and provide practical support such as health check sponsorships and meal deliveries. The program also trains youth volunteers, creating intergenerational connections that benefit both seniors and young people.',
  },
  {
    id: 'scholarship',
    title: 'Youth Leadership Scholarship',
    titleZh: '青年領袖獎學金',
    years: '2010-present',
    tags: ['Youth & Education'],
    category: 'youth',
    short: 'Annual scholarships for outstanding students demonstrating leadership and community service.',
    long: 'The Youth Leadership Scholarship recognizes secondary school students who excel academically while contributing to their communities. Recipients receive financial support for further education and mentorship from Rotary members. The program has supported over 100 students, many of whom have gone on to become community leaders themselves.',
  },
];

// Updated relationships with accurate data
const relationships = [
  {
    id: 'mother',
    name: 'Rotary Club of Hong Kong',
    nameZh: '香港扶輪社',
    relationType: 'Mother Club',
    relationTypeZh: '母社',
    description: 'Founded in 1931, the Rotary Club of Hong Kong sponsored the establishment of RCHKIE in 1954.',
    year: 'Est. 1931',
  },
  {
    id: 'district',
    name: 'District 3450',
    nameZh: '3450地區',
    relationType: 'Rotary District',
    relationTypeZh: '所屬地區',
    description: 'Rotary District 3450 covers Hong Kong, Macao, and Mongolia with numerous clubs working together.',
    year: 'HK, Macao, Mongolia',
  },
  {
    id: 'harbour',
    name: 'RC Hong Kong Harbour',
    nameZh: '香港海港扶輪社',
    relationType: 'Partner Club',
    relationTypeZh: '友社',
    description: 'A fellow club serving the central harbor district, with frequent joint projects and friendship visits.',
    year: 'Partner Club',
  },
  {
    id: 'rotaract',
    name: 'Rotaract Club of HKIE',
    nameZh: '香港島東扶青社',
    relationType: 'Youth Wing (18-30)',
    relationTypeZh: '扶青社',
    description: 'Young professionals (18-30) carrying forward Rotary values to the next generation.',
    year: 'Ages 18-30',
  },
  {
    id: 'interact',
    name: 'Interact Clubs',
    nameZh: '扶少團',
    relationType: 'Student Wing',
    relationTypeZh: '扶少團',
    description: 'Secondary school service clubs sponsored by RCHKIE in local schools.',
    year: 'Secondary Students',
  },
];

const joiningInfo = {
  meetingTime: 'Every Thursday, 12:30 PM',
  meetingLocation: 'Causeway Bay Hotel',
  language: 'English (Bilingual environment)',
  membershipSteps: [
    'Attend as a guest at a weekly meeting',
    'Meet with membership committee',
    'Complete application and background check',
    'Induction ceremony and welcome',
  ],
  youthOpportunities: [
    'Join Rotaract (ages 18-30)',
    'Participate in Interact at your school',
    'Enter the Student Smartphone Photo Contest',
    'Apply for Youth Leadership Scholarship',
  ],
  partnerOpportunities: [
    'CSR collaboration on community projects',
    'Event sponsorship opportunities',
    'Professional networking',
    'Global Rotary partnership access',
  ],
};

// ==================== SVG ROTARY WHEEL COMPONENT ====================
function RotaryWheel({ className = '', spin = false }: { className?: string; spin?: boolean }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={`${className} ${spin ? 'animate-spin' : ''}`}
      style={spin ? { animationDuration: '20s' } : {}}
    >
      {/* Outer gear teeth */}
      <g fill="#F7A81B">
        {[...Array(24)].map((_, i) => (
          <rect
            key={i}
            x="47"
            y="2"
            width="6"
            height="8"
            rx="1"
            transform={`rotate(${i * 15} 50 50)`}
          />
        ))}
      </g>
      {/* Main wheel */}
      <circle cx="50" cy="50" r="42" fill="#F7A81B" />
      <circle cx="50" cy="50" r="35" fill="#17458F" />
      {/* Spokes */}
      <g fill="#F7A81B">
        {[...Array(6)].map((_, i) => (
          <rect
            key={i}
            x="48"
            y="18"
            width="4"
            height="28"
            rx="2"
            transform={`rotate(${i * 60} 50 50)`}
          />
        ))}
      </g>
      {/* Center */}
      <circle cx="50" cy="50" r="12" fill="#F7A81B" />
      <circle cx="50" cy="50" r="6" fill="#17458F" />
    </svg>
  );
}

// ==================== ANIMATED COUNTER COMPONENT ====================
function AnimatedCounter({ value, suffix = '', duration = 2000 }: { value: number; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          let start = 0;
          const end = value;
          const increment = end / (duration / 16);
          const timer = setInterval(() => {
            start += increment;
            if (start >= end) {
              setCount(end);
              clearInterval(timer);
            } else {
              setCount(Math.floor(start));
            }
          }, 16);
        }
      },
      { threshold: 0.5 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [value, duration, hasAnimated]);

  return (
    <span ref={ref} className="tabular-nums">
      {count}{suffix}
    </span>
  );
}

// ==================== MAIN COMPONENT ====================
export default function RotaryHKIEPage() {
  const [scrollY, setScrollY] = useState(0);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [activeFilter, setActiveFilter] = useState('All');
  const [selectedProject, setSelectedProject] = useState<typeof projects[0] | null>(null);
  const [hoveredRelation, setHoveredRelation] = useState<string | null>(null);
  const [activeTimelineItem, setActiveTimelineItem] = useState<string | null>(null);
  const [currentFactIndex, setCurrentFactIndex] = useState(0);
  const [isFactPaused, setIsFactPaused] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const serviceRef = useRef<HTMLDivElement>(null);
  const contestRef = useRef<HTMLDivElement>(null);
  const joinRef = useRef<HTMLDivElement>(null);

  // Parallax scroll effect
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

  // Auto-rotate fun facts
  useEffect(() => {
    if (isFactPaused) return;
    const interval = setInterval(() => {
      setCurrentFactIndex((prev) => (prev + 1) % rotaryFunFacts.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isFactPaused]);

  const scrollToSection = (ref: React.RefObject<HTMLDivElement | null>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const filters = ['All', 'Youth & Education', 'Community Care', 'International', 'Signature Events'];

  const filteredProjects = activeFilter === 'All'
    ? projects
    : projects.filter(p => p.tags.includes(activeFilter));

  return (
    <div ref={containerRef} className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-950 text-white overflow-hidden">
      {/* Parallax Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Floating gradient orbs */}
        <div
          className="absolute w-[600px] h-[600px] rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/10 blur-3xl"
          style={{
            left: '10%',
            top: '20%',
            transform: `translate(${mousePos.x * 30}px, ${scrollY * 0.1 + mousePos.y * 30}px)`,
            transition: 'transform 0.3s ease-out',
          }}
        />
        <div
          className="absolute w-[400px] h-[400px] rounded-full bg-gradient-to-br from-yellow-500/10 to-orange-500/5 blur-3xl"
          style={{
            right: '10%',
            top: '60%',
            transform: `translate(${mousePos.x * -20}px, ${scrollY * -0.05 + mousePos.y * -20}px)`,
            transition: 'transform 0.3s ease-out',
          }}
        />
        {/* Floating Rotary wheels */}
        <div
          className="absolute opacity-10"
          style={{
            left: '5%',
            top: '30%',
            transform: `translateY(${scrollY * 0.2}px) rotate(${scrollY * 0.05}deg)`,
          }}
        >
          <RotaryWheel className="w-32 h-32" />
        </div>
        <div
          className="absolute opacity-5"
          style={{
            right: '8%',
            top: '70%',
            transform: `translateY(${scrollY * -0.15}px) rotate(${scrollY * -0.03}deg)`,
          }}
        >
          <RotaryWheel className="w-48 h-48" />
        </div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-blue-950/90 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/vibe-demo"
              className="flex items-center gap-2 text-blue-300 hover:text-white transition-colors group"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              <span>Back to Demos</span>
            </Link>
            <nav className="hidden md:flex items-center gap-6 text-sm">
              <button onClick={() => scrollToSection(timelineRef)} className="text-blue-300 hover:text-white transition-colors">
                Our History
              </button>
              <button onClick={() => scrollToSection(serviceRef)} className="text-blue-300 hover:text-white transition-colors">
                What We Do
              </button>
              <button onClick={() => scrollToSection(contestRef)} className="text-blue-300 hover:text-white transition-colors">
                Photo Contest
              </button>
              <button onClick={() => scrollToSection(joinRef)} className="text-blue-300 hover:text-white transition-colors">
                Join Us
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section with Parallax */}
      <section className="relative py-16 lg:py-24 overflow-hidden">
        <div
          className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
          style={{
            transform: `translateY(${scrollY * -0.1}px)`,
          }}
        >
          {/* Logo with Rotary Wheel */}
          <div className="flex flex-col items-center mb-8">
            <div
              className="relative"
              style={{
                transform: `rotate(${scrollY * 0.02}deg)`,
              }}
            >
              <RotaryWheel className="w-24 h-24 md:w-32 md:h-32 drop-shadow-2xl" spin />
            </div>
            <div className="mt-6 text-center">
              <h1 className="text-3xl md:text-5xl font-bold text-white mb-2">
                <span className="text-[#17458F] drop-shadow-lg">Rotary</span>
              </h1>
              <p className="text-xl md:text-2xl text-blue-200">Club of Hong Kong Island East</p>
              <p className="text-lg text-yellow-400 mt-1">{clubMeta.nameChinese}</p>
            </div>
          </div>

          {/* Text content with mouse parallax */}
          <div
            className="text-center"
            style={{
              transform: `translate(${mousePos.x * -10}px, ${mousePos.y * -10}px)`,
              transition: 'transform 0.2s ease-out',
            }}
          >
            <p className="text-lg text-blue-200 mb-4">
              {clubMeta.subtitle} | {clubMeta.subtitleChinese}
            </p>

            <div className="max-w-3xl mx-auto mb-10 space-y-3">
              <p className="text-blue-100 leading-relaxed">
                {clubMeta.descriptionEn}
              </p>
              <p className="text-blue-200/80 leading-relaxed text-sm">
                {clubMeta.descriptionZh}
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => scrollToSection(timelineRef)}
                className="px-8 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 text-blue-900 font-semibold rounded-full hover:from-yellow-400 hover:to-yellow-500 transition-all shadow-lg shadow-yellow-500/30 hover:shadow-yellow-500/50 hover:scale-105"
              >
                Explore Our Journey
              </button>
              <button
                onClick={() => scrollToSection(joinRef)}
                className="px-8 py-3 bg-white/10 backdrop-blur-sm border border-white/30 text-white font-semibold rounded-full hover:bg-white/20 transition-all hover:scale-105"
              >
                Contact / Join
              </button>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div
          className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center text-blue-400"
          style={{ opacity: Math.max(0, 1 - scrollY / 200) }}
        >
          <span className="text-sm mb-2">Scroll to explore</span>
          <div className="w-6 h-10 rounded-full border-2 border-blue-400 flex justify-center pt-2">
            <div className="w-1.5 h-3 bg-blue-400 rounded-full animate-bounce" />
          </div>
        </div>
      </section>

      {/* ============ ANIMATED STATS SECTION ============ */}
      <section className="relative py-16 bg-blue-900/30">
        <div
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
          style={{
            transform: `translateY(${Math.max(0, (scrollY - 200) * -0.05)}px)`,
          }}
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {clubStats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className="text-center p-6 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 hover:border-yellow-500/30 transition-all hover:transform hover:-translate-y-2"
                >
                  <Icon className="w-8 h-8 mx-auto mb-3 text-yellow-500" />
                  <div className="text-3xl md:text-4xl font-bold text-white mb-1">
                    <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                  </div>
                  <p className="text-blue-300 text-sm">{stat.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============ FUN FACTS CAROUSEL ============ */}
      <section className="relative py-12 overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className="bg-gradient-to-r from-yellow-500/20 via-yellow-500/10 to-yellow-500/20 rounded-2xl p-6 border border-yellow-500/30 relative"
            onMouseEnter={() => setIsFactPaused(true)}
            onMouseLeave={() => setIsFactPaused(false)}
          >
            <div className="flex items-center gap-3 mb-4">
              <Lightbulb className="w-6 h-6 text-yellow-500" />
              <span className="text-yellow-500 font-medium">Did You Know?</span>
            </div>

            <div className="relative h-20 overflow-hidden">
              {rotaryFunFacts.map((fact, idx) => {
                const Icon = fact.icon;
                return (
                  <div
                    key={idx}
                    className={`absolute inset-0 flex items-center gap-4 transition-all duration-500 ${
                      idx === currentFactIndex
                        ? 'opacity-100 translate-y-0'
                        : idx < currentFactIndex
                        ? 'opacity-0 -translate-y-full'
                        : 'opacity-0 translate-y-full'
                    }`}
                  >
                    <Icon className="w-10 h-10 text-yellow-500/50 flex-shrink-0" />
                    <div>
                      <p className="text-white text-lg">{fact.fact}</p>
                      <p className="text-yellow-300/70 text-sm">{fact.factZh}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Dots indicator */}
            <div className="flex justify-center gap-2 mt-4">
              {rotaryFunFacts.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentFactIndex(idx)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    idx === currentFactIndex ? 'bg-yellow-500 w-6' : 'bg-yellow-500/30'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============ INFOGRAPHIC 1: History Timeline with Parallax ============ */}
      <section ref={timelineRef} className="py-20 bg-gradient-to-b from-blue-950/50 to-indigo-950/50 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className="text-center mb-12"
            style={{
              transform: `translateY(${Math.max(0, (scrollY - 600) * -0.05)}px)`,
            }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Our Journey</h2>
            <p className="text-blue-300 max-w-2xl mx-auto">
              Seven decades of service, fellowship, and community impact
            </p>
          </div>

          {/* Timeline Infographic with Parallax */}
          <div className="relative">
            {/* Desktop: Horizontal Timeline */}
            <div className="hidden lg:block">
              {/* Timeline Line with gradient */}
              <div
                className="absolute top-24 left-0 right-0 h-1 bg-gradient-to-r from-yellow-500 via-blue-400 to-purple-500 rounded-full"
                style={{
                  transform: `scaleX(${Math.min(1, (scrollY - 500) / 400)})`,
                  transformOrigin: 'left',
                }}
              />

              <div className="grid grid-cols-4 gap-4">
                {historyTimeline.map((item, idx) => {
                  const Icon = item.icon;
                  const itemOffset = idx * 100;
                  return (
                    <div
                      key={item.id}
                      className="relative"
                      style={{
                        transform: `translateY(${Math.max(0, (scrollY - 600 - itemOffset) * -0.03)}px)`,
                        opacity: Math.min(1, Math.max(0, (scrollY - 500 - itemOffset) / 200)),
                      }}
                      onMouseEnter={() => setActiveTimelineItem(item.id)}
                      onMouseLeave={() => setActiveTimelineItem(null)}
                    >
                      <div className="text-center mb-4">
                        <span className="inline-block px-4 py-2 bg-gradient-to-r from-yellow-500 to-yellow-600 text-blue-900 font-bold rounded-full text-sm shadow-lg">
                          {item.year}
                        </span>
                      </div>

                      <div className="flex justify-center mb-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                          activeTimelineItem === item.id
                            ? 'bg-yellow-500 scale-125 shadow-xl shadow-yellow-500/50'
                            : 'bg-blue-700 border-2 border-blue-500'
                        }`}>
                          <Icon className={`w-6 h-6 ${activeTimelineItem === item.id ? 'text-blue-900' : 'text-white'}`} />
                        </div>
                      </div>

                      <div className={`bg-white/5 backdrop-blur-sm rounded-xl p-5 border transition-all duration-300 ${
                        activeTimelineItem === item.id
                          ? 'border-yellow-500/50 bg-white/10 transform -translate-y-2 shadow-xl'
                          : 'border-white/10'
                      }`}>
                        <h3 className="font-bold text-lg mb-1">{item.title}</h3>
                        <p className="text-blue-300 text-sm mb-2">{item.titleZh}</p>
                        <p className="text-blue-200/80 text-sm leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Mobile: Vertical Timeline */}
            <div className="lg:hidden">
              <div className="relative pl-8 border-l-2 border-yellow-500/50 space-y-8">
                {historyTimeline.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.id} className="relative">
                      <div className="absolute -left-[25px] top-0 w-12 h-12 rounded-full bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center shadow-lg">
                        <Icon className="w-6 h-6 text-blue-900" />
                      </div>
                      <div className="ml-8 bg-white/5 backdrop-blur-sm rounded-xl p-5 border border-white/10">
                        <span className="inline-block px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-sm font-medium mb-3">
                          {item.year}
                        </span>
                        <h3 className="font-bold text-lg mb-1">{item.title}</h3>
                        <p className="text-blue-300 text-sm mb-2">{item.titleZh}</p>
                        <p className="text-blue-200/80 text-sm leading-relaxed">{item.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="text-center mt-12">
            <p className="text-blue-400 text-sm italic flex items-center justify-center gap-2">
              <Quote className="w-4 h-4" />
              A connected family of service, from Mother Club to community.
              <Quote className="w-4 h-4 rotate-180" />
            </p>
          </div>
        </div>
      </section>

      {/* ============ INFOGRAPHIC 2: Service Focus Areas with Parallax ============ */}
      <section ref={serviceRef} className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className="text-center mb-12"
            style={{
              transform: `translateY(${Math.max(0, (scrollY - 1000) * -0.05)}px)`,
            }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-2">What We Do</h2>
            <p className="text-2xl text-blue-300 mb-4">我們在香港東區做的事</p>
            <p className="text-blue-400 max-w-2xl mx-auto">
              Making a difference through service above self
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {serviceFocusAreas.map((area, idx) => {
              const Icon = area.icon;
              const cardOffset = idx * 80;
              return (
                <div
                  key={area.id}
                  className="group relative"
                  style={{
                    transform: `translateY(${Math.max(0, (scrollY - 1100 - cardOffset) * -0.04)}px)`,
                    opacity: Math.min(1, Math.max(0, (scrollY - 1000 - cardOffset) / 200)),
                  }}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${area.color} rounded-2xl blur-xl opacity-0 group-hover:opacity-30 transition-opacity duration-500`} />

                  <div className="relative bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 h-full group-hover:border-white/20 transition-all duration-300 group-hover:transform group-hover:-translate-y-2">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${area.color} flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>

                    <h3 className="text-xl font-bold mb-1">{area.titleEn}</h3>
                    <p className="text-blue-300 text-lg mb-4">{area.titleZh}</p>

                    <p className="text-blue-100 leading-relaxed mb-3">{area.descEn}</p>
                    <p className="text-blue-200/70 text-sm leading-relaxed mb-4">{area.descZh}</p>

                    {/* Stat badge */}
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-sm text-blue-300">
                      <TrendingUp className="w-4 h-4" />
                      {area.stat}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============ INFOGRAPHIC 3: Photo Contest Feature with Parallax ============ */}
      <section ref={contestRef} className="py-20 bg-gradient-to-b from-indigo-950/50 to-purple-950/50 relative overflow-hidden">
        {/* Parallax camera icons */}
        <div
          className="absolute left-10 top-20 opacity-10"
          style={{ transform: `translateY(${(scrollY - 1400) * 0.1}px)` }}
        >
          <Camera className="w-32 h-32 text-purple-400" />
        </div>
        <div
          className="absolute right-10 bottom-20 opacity-10"
          style={{ transform: `translateY(${(scrollY - 1400) * -0.1}px)` }}
        >
          <Smartphone className="w-24 h-24 text-pink-400" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Contest Info */}
            <div
              style={{
                transform: `translateX(${Math.max(0, (scrollY - 1400) * -0.03)}px)`,
              }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500/20 rounded-full text-yellow-400 text-sm font-medium mb-6">
                <Camera className="w-4 h-4" />
                <span>{photoContest.edition} • {photoContest.year}</span>
              </div>

              <h2 className="text-3xl md:text-4xl font-bold mb-2">{photoContest.title}</h2>
              <p className="text-2xl text-purple-300 mb-4">{photoContest.titleZh}</p>

              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <Smartphone className="w-8 h-8 text-purple-400" />
                  <div>
                    <p className="font-bold text-lg">&quot;{photoContest.theme}&quot;</p>
                    <p className="text-purple-300">{photoContest.themeZh}</p>
                  </div>
                </div>
                <p className="text-blue-200 mb-2">{photoContest.target}</p>
                <p className="text-blue-300 text-sm">{photoContest.targetZh}</p>
              </div>

              <p className="text-blue-100 mb-6">{photoContest.description}</p>

              <div className="grid grid-cols-2 gap-3 mb-6">
                {photoContest.rules.map((rule, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-blue-200 text-sm">
                    <ChevronRight className="w-4 h-4 text-yellow-500" />
                    {rule}
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Awards & Visual */}
            <div
              style={{
                transform: `translateX(${Math.max(0, (scrollY - 1400) * 0.03)}px)`,
              }}
            >
              {/* Phone Frame Visual with parallax */}
              <div
                className="relative max-w-sm mx-auto mb-8"
                style={{
                  transform: `rotateY(${mousePos.x * 5}deg) rotateX(${mousePos.y * -5}deg)`,
                  transition: 'transform 0.1s ease-out',
                }}
              >
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-[3rem] p-3 shadow-2xl">
                  <div className="bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 rounded-[2.5rem] aspect-[9/16] flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-4 border-2 border-white/30 rounded-2xl" />
                    <div className="absolute top-6 left-1/2 -translate-x-1/2 w-16 h-6 bg-black/50 rounded-full" />
                    <div className="text-center p-8">
                      <Camera className="w-16 h-16 text-white/80 mx-auto mb-4" />
                      <p className="text-white font-bold text-lg">Hong Kong</p>
                      <p className="text-white/80">Through Your Lens</p>
                    </div>
                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full border-4 border-white/80" />
                  </div>
                </div>
              </div>

              {/* Awards */}
              <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 rounded-2xl p-6 border border-yellow-500/30">
                <h3 className="font-bold text-lg mb-4 text-center">Awards 獎項</h3>
                <div className="space-y-3">
                  {photoContest.awards.map((award) => {
                    const Icon = award.icon;
                    return (
                      <div key={award.place} className="flex items-center justify-between bg-white/5 rounded-xl p-4 hover:bg-white/10 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            award.place === 'Champion' ? 'bg-yellow-500' :
                            award.place === '1st Runner-up' ? 'bg-slate-400' : 'bg-amber-700'
                          }`}>
                            <Icon className="w-5 h-5 text-white" />
                          </div>
                          <span className="font-medium">{award.place}</span>
                        </div>
                        <span className="text-yellow-400 font-bold">${award.amount}</span>
                      </div>
                    );
                  })}
                </div>
                <p className="text-center text-blue-300 text-sm mt-4">+ Merit Awards & Certificates</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ INFOGRAPHIC 4: Rotary Network with Interactive Hover ============ */}
      <section className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className="text-center mb-12"
            style={{
              transform: `translateY(${Math.max(0, (scrollY - 1800) * -0.05)}px)`,
            }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Our Rotary Family</h2>
            <p className="text-blue-300 max-w-2xl mx-auto">
              Connected through service and fellowship across District 3450
            </p>
          </div>

          {/* Interactive Network Diagram */}
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              {relationships.slice(0, 2).map((rel) => (
                <div
                  key={rel.id}
                  className={`relative group cursor-pointer transition-all duration-300 ${
                    hoveredRelation === rel.id ? 'transform -translate-y-2 z-10' : ''
                  }`}
                  onMouseEnter={() => setHoveredRelation(rel.id)}
                  onMouseLeave={() => setHoveredRelation(null)}
                >
                  <div className={`absolute inset-0 rounded-2xl blur-xl transition-opacity duration-300 ${
                    rel.id === 'mother' ? 'bg-yellow-500' : 'bg-blue-500'
                  } ${hoveredRelation === rel.id ? 'opacity-40' : 'opacity-0'}`} />

                  <div className={`relative p-6 rounded-2xl border transition-all duration-300 ${
                    rel.id === 'mother'
                      ? 'bg-gradient-to-br from-yellow-500/20 to-orange-500/10 border-yellow-500/30'
                      : 'bg-gradient-to-br from-blue-500/20 to-cyan-500/10 border-blue-500/30'
                  }`}>
                    <div className="flex items-start justify-between mb-3">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        rel.id === 'mother' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        {rel.relationType}
                      </span>
                      <span className="text-xs text-blue-400">{rel.year}</span>
                    </div>
                    <h3 className="font-bold text-xl mb-1">{rel.name}</h3>
                    <p className="text-blue-300 mb-3">{rel.nameZh}</p>
                    <p className="text-blue-200/80 text-sm">{rel.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Center: RCHKIE with spinning wheel */}
            <div className="flex justify-center my-8">
              <div
                className="relative group cursor-pointer"
                style={{
                  transform: `scale(${1 + Math.sin(scrollY * 0.002) * 0.05})`,
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full blur-2xl opacity-40 group-hover:opacity-60 transition-opacity" />
                <div className="relative w-48 h-48 rounded-full bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center p-6 border-4 border-white/20 shadow-2xl">
                  <div className="text-center">
                    <RotaryWheel className="w-16 h-16 mx-auto mb-2" spin />
                    <p className="font-bold text-sm">RCHKIE</p>
                    <p className="text-xs text-blue-200">{clubMeta.nameChinese}</p>
                    <p className="text-xs text-blue-300 mt-1">Est. 1954</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Row */}
            <div className="grid md:grid-cols-3 gap-6">
              {relationships.slice(2).map((rel) => (
                <div
                  key={rel.id}
                  className={`relative group cursor-pointer transition-all duration-300 ${
                    hoveredRelation === rel.id ? 'transform -translate-y-2' : ''
                  }`}
                  onMouseEnter={() => setHoveredRelation(rel.id)}
                  onMouseLeave={() => setHoveredRelation(null)}
                >
                  <div className={`absolute inset-0 rounded-xl blur-xl transition-opacity duration-300 ${
                    rel.id === 'harbour' ? 'bg-cyan-500' :
                    rel.id === 'rotaract' ? 'bg-purple-500' : 'bg-pink-500'
                  } ${hoveredRelation === rel.id ? 'opacity-30' : 'opacity-0'}`} />

                  <div className="relative bg-white/5 backdrop-blur-sm p-5 rounded-xl border border-white/10 h-full group-hover:border-white/20 transition-all">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium px-2 py-1 bg-white/10 rounded-full text-blue-300">
                        {rel.relationType}
                      </span>
                      <span className="text-xs text-blue-400">{rel.year}</span>
                    </div>
                    <h4 className="font-bold mb-1">{rel.name}</h4>
                    <p className="text-blue-300 text-sm mb-2">{rel.nameZh}</p>
                    <p className="text-blue-200/70 text-xs">{rel.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Project Gallery Section */}
      <section className="py-20 bg-blue-950/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-4">Our Projects & Initiatives</h2>
          <p className="text-blue-300 text-center mb-12 max-w-2xl mx-auto">
            Service Above Self | 超我服務
          </p>

          <div className="flex flex-wrap justify-center gap-2 mb-12">
            {filters.map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  activeFilter === filter
                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                    : 'bg-white/10 text-blue-200 hover:bg-white/20'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => {
              const iconMap: Record<string, typeof Award> = {
                youth: GraduationCap,
                community: Heart,
                international: Globe,
                signature: Award,
              };
              const Icon = iconMap[project.category] || Award;

              return (
                <div
                  key={project.id}
                  onClick={() => setSelectedProject(project)}
                  className="group cursor-pointer bg-white/5 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/10 hover:border-blue-400/50 transition-all hover:shadow-lg hover:shadow-blue-500/10 hover:transform hover:-translate-y-1"
                >
                  <div className="p-6 border-b border-white/10">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <span className="text-xs text-blue-300 bg-blue-500/20 px-2 py-1 rounded-full">
                        {project.years}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold mb-1 group-hover:text-yellow-400 transition-colors">
                      {project.title}
                    </h3>
                    <p className="text-blue-300 text-sm">{project.titleZh}</p>
                  </div>
                  <div className="p-6">
                    <p className="text-blue-200 text-sm mb-4 line-clamp-2">{project.short}</p>
                    <div className="flex flex-wrap gap-2">
                      {project.tags.map((tag) => (
                        <span key={tag} className="text-xs px-2 py-1 bg-white/10 text-blue-200 rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Join Section */}
      <section ref={joinRef} className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-4">How We Meet & How to Join</h2>
          <p className="text-blue-300 text-center mb-12 max-w-2xl mx-auto">
            Be part of a global network of service-minded individuals
          </p>

          <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-2xl p-8 border border-yellow-500/30 mb-12 max-w-3xl mx-auto">
            <div className="grid md:grid-cols-3 gap-6 text-center">
              <div className="flex flex-col items-center gap-2">
                <Clock className="w-8 h-8 text-yellow-500" />
                <p className="text-sm text-yellow-300">Meeting Time</p>
                <p className="font-bold">{joiningInfo.meetingTime}</p>
              </div>
              <div className="flex flex-col items-center gap-2">
                <MapPin className="w-8 h-8 text-yellow-500" />
                <p className="text-sm text-yellow-300">Location</p>
                <p className="font-bold">{joiningInfo.meetingLocation}</p>
              </div>
              <div className="flex flex-col items-center gap-2">
                <BookOpen className="w-8 h-8 text-yellow-500" />
                <p className="text-sm text-yellow-300">Language</p>
                <p className="font-bold">{joiningInfo.language}</p>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-blue-400/30 transition-all hover:transform hover:-translate-y-1">
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-xl font-bold mb-4">For Prospective Members</h3>
              <ol className="space-y-3">
                {joiningInfo.membershipSteps.map((step, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-sm font-bold flex-shrink-0">
                      {idx + 1}
                    </span>
                    <span className="text-blue-200 text-sm">{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-purple-400/30 transition-all hover:transform hover:-translate-y-1">
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center mb-4">
                <GraduationCap className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-xl font-bold mb-4">For Students & Youth</h3>
              <ul className="space-y-3">
                {joiningInfo.youthOpportunities.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0" />
                    <span className="text-blue-200 text-sm">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-emerald-400/30 transition-all hover:transform hover:-translate-y-1">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center mb-4">
                <Handshake className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold mb-4">For Partners & Sponsors</h3>
              <ul className="space-y-3">
                {joiningInfo.partnerOpportunities.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2 flex-shrink-0" />
                    <span className="text-blue-200 text-sm">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="text-center mt-12">
            <a
              href="mailto:info@rotaryhkie.org"
              className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-full hover:from-blue-400 hover:to-purple-500 transition-all shadow-lg shadow-blue-500/30 hover:scale-105"
            >
              <Mail className="w-5 h-5" />
              Contact Us
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-white/10 bg-blue-950/50">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <RotaryWheel className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-blue-400 text-sm">
            Rotary Club of Hong Kong Island East | 香港島東扶輪社
          </p>
          <p className="text-blue-500 text-xs mt-2">
            &quot;Service Above Self&quot; | 超我服務
          </p>
          <p className="text-blue-500 text-xs mt-1">
            Part of Rotary District 3450 (Hong Kong, Macao, Mongolia)
          </p>
          <p className="text-blue-600 text-xs mt-4">
            Demo site for 5ML Vibe Code Showcase
          </p>
        </div>
      </footer>

      {/* Project Modal */}
      {selectedProject && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setSelectedProject(null)}
        >
          <div
            className="bg-gradient-to-br from-blue-900 to-indigo-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-white/20 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-white/10 flex items-start justify-between">
              <div>
                <h3 className="text-2xl font-bold">{selectedProject.title}</h3>
                <p className="text-blue-300">{selectedProject.titleZh}</p>
              </div>
              <button
                onClick={() => setSelectedProject(null)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-4 h-4 text-yellow-500" />
                <span className="text-yellow-500 text-sm">{selectedProject.years}</span>
              </div>
              <p className="text-blue-100 leading-relaxed mb-6">
                {selectedProject.long}
              </p>
              <div className="flex flex-wrap gap-2">
                {selectedProject.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-blue-500/20 text-blue-200 rounded-full text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
