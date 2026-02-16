'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, Sparkles, MousePointer2, Layers, Zap, Code2, Palette, Globe, ArrowUpRight } from 'lucide-react';

export default function VibeDemoPage() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [scrollY, setScrollY] = useState(0);
  const [activeCard, setActiveCard] = useState<number | null>(null);
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; size: number; color: string }>>([]);
  const [clicks, setClicks] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const clickTimersRef = useRef<Map<number, NodeJS.Timeout>>(new Map());

  // Track mouse position for parallax effects
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setMousePos({
          x: (e.clientX - rect.left) / rect.width - 0.5,
          y: (e.clientY - rect.top) / rect.height - 0.5,
        });
      }
    };

    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Generate floating particles
  useEffect(() => {
    const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4', '#10b981', '#f59e0b'];
    const newParticles = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 6 + 2,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));
    setParticles(newParticles);
  }, []);

  // Handle click ripple effect
  const handleClick = useCallback((e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const newClick = {
      id: Date.now(),
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
    setClicks(prev => [...prev, newClick]);
    const timer = setTimeout(() => {
      setClicks(prev => prev.filter(c => c.id !== newClick.id));
      clickTimersRef.current.delete(newClick.id);
    }, 1000);
    clickTimersRef.current.set(newClick.id, timer);
  }, []);

  // Cleanup click timers on unmount
  useEffect(() => {
    return () => {
      clickTimersRef.current.forEach(timer => clearTimeout(timer));
      clickTimersRef.current.clear();
    };
  }, []);

  const features = [
    {
      title: 'Parallax Scrolling',
      description: 'Elements move at different speeds as you scroll, creating depth and immersion',
      icon: Layers,
      color: 'from-blue-500 to-cyan-500',
    },
    {
      title: 'Mouse Tracking',
      description: 'Interactive elements respond to your cursor position in real-time',
      icon: MousePointer2,
      color: 'from-purple-500 to-pink-500',
    },
    {
      title: 'Dynamic Animations',
      description: 'Smooth transitions and micro-interactions bring the interface to life',
      icon: Zap,
      color: 'from-amber-500 to-orange-500',
    },
    {
      title: 'Generative Art',
      description: 'Procedurally generated visuals that are unique every time',
      icon: Palette,
      color: 'from-emerald-500 to-teal-500',
    },
  ];

  const demoSites = [
    {
      id: 'tedx-boundary-street',
      title: 'TEDxBoundaryStreet',
      titleZh: '界限街 TEDx — Visual Edition',
      description: 'Ideas of Crossing — visual-first design with "The Line as Canvas" concept, nanobanana AI-generated visuals, scroll animations, and poetic storytelling',
      href: '/vibe-demo/tedx-boundary-street',
      color: 'from-red-600 to-red-800',
      tags: ['Visual Design', 'AI Visuals', 'Scroll Animation', 'Typography'],
    },
    {
      id: 'tedx-boundary-street-partners',
      title: 'TEDxBoundaryStreet',
      titleZh: '界限街 TEDx — Partners Page',
      description: 'Partners page with enquiry form — WCAG 2.1 AA, mobile-first, bilingual, 4 partnership types, multi-select form, TEDx compliance',
      href: '/vibe-demo/tedx-boundary-street/partners',
      color: 'from-red-700 to-neutral-900',
      tags: ['WCAG 2.1 AA', 'Partners', 'Bilingual Form', 'Mobile-first'],
    },
    {
      id: 'rotary-hkie',
      title: 'Rotary Club HK Island East',
      titleZh: '香港島東扶輪社',
      description: 'Interactive timeline, project gallery with filters, network visualization, and bilingual content',
      href: '/vibe-demo/rotary-hkie',
      color: 'from-blue-600 to-indigo-700',
      tags: ['Timeline', 'Gallery', 'Network Diagram', 'Bilingual'],
    },
    {
      id: 'ai-human-connection',
      title: 'AI Mastery for Human Connection',
      titleZh: 'AI賦能・人情為本',
      description: 'Parallax storytelling with infographics: automate the mundane, design the meaningful',
      href: '/vibe-demo/ai-human-connection',
      color: 'from-emerald-500 to-cyan-600',
      tags: ['Storytelling', 'Infographics', 'Parallax', 'Interactive Charts'],
    },
  ];

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-slate-950 text-white overflow-hidden relative"
      onClick={handleClick}
    >
      {/* Animated Background Gradient */}
      <div
        className="fixed inset-0 opacity-30 transition-all duration-1000 ease-out"
        style={{
          background: `radial-gradient(circle at ${50 + mousePos.x * 30}% ${50 + mousePos.y * 30}%,
            rgba(99, 102, 241, 0.4) 0%,
            rgba(139, 92, 246, 0.2) 25%,
            rgba(236, 72, 153, 0.1) 50%,
            transparent 70%)`,
        }}
      />

      {/* Floating Particles */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="absolute rounded-full animate-pulse"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: particle.size,
              height: particle.size,
              backgroundColor: particle.color,
              transform: `translate(${mousePos.x * (particle.size * 10)}px, ${mousePos.y * (particle.size * 10)}px)`,
              transition: 'transform 0.3s ease-out',
              opacity: 0.6,
            }}
          />
        ))}
      </div>

      {/* Click Ripples */}
      {clicks.map((click) => (
        <div
          key={click.id}
          className="absolute pointer-events-none"
          style={{
            left: click.x,
            top: click.y,
          }}
        >
          <div className="absolute -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-white/30 rounded-full animate-ping" />
          <div className="absolute -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white/20 rounded-full animate-ping" style={{ animationDelay: '0.1s' }} />
          <div className="absolute -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 rounded-full animate-ping" style={{ animationDelay: '0.2s' }} />
        </div>
      ))}

      {/* Header with Parallax */}
      <header
        className="relative z-10 border-b border-white/10 backdrop-blur-xl bg-slate-900/50"
        style={{
          transform: `translateY(${scrollY * 0.1}px)`,
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              <span>Back to Home</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section with Multi-layer Parallax */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Layer - Slowest */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            transform: `translateY(${scrollY * 0.5}px) scale(${1 + scrollY * 0.0005})`,
          }}
        >
          <div className="w-[800px] h-[800px] rounded-full bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20 blur-3xl" />
        </div>

        {/* Middle Layer */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            transform: `translateY(${scrollY * 0.3}px) rotate(${scrollY * 0.02}deg)`,
          }}
        >
          <div className="w-[600px] h-[600px] rounded-full border border-white/10" />
          <div className="absolute w-[400px] h-[400px] rounded-full border border-white/10" />
          <div className="absolute w-[200px] h-[200px] rounded-full border border-white/20" />
        </div>

        {/* Foreground Content - Fastest/Fixed */}
        <div
          className="relative z-10 text-center px-4"
          style={{
            transform: `translateY(${scrollY * -0.2}px)`,
          }}
        >
          <div className="flex items-center justify-center gap-3 mb-6">
            <Sparkles className="w-8 h-8 text-purple-400 animate-pulse" />
            <span className="text-purple-400 font-medium tracking-widest uppercase text-sm">Vibe Code Demo</span>
            <Sparkles className="w-8 h-8 text-purple-400 animate-pulse" />
          </div>
          <h1
            className="text-5xl md:text-7xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400"
            style={{
              transform: `translate(${mousePos.x * -20}px, ${mousePos.y * -20}px)`,
              transition: 'transform 0.1s ease-out',
            }}
          >
            Interactive Magic
          </h1>
          <p
            className="text-xl text-slate-400 max-w-2xl mx-auto mb-8"
            style={{
              transform: `translate(${mousePos.x * -10}px, ${mousePos.y * -10}px)`,
              transition: 'transform 0.15s ease-out',
            }}
          >
            Experience the power of modern web animations. Move your mouse, scroll the page, and click anywhere to see the effects in action.
          </p>

          {/* Floating Code Badge */}
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20"
            style={{
              transform: `translate(${mousePos.x * 30}px, ${mousePos.y * 30}px) rotate(${mousePos.x * 5}deg)`,
              transition: 'transform 0.2s ease-out',
            }}
          >
            <Code2 className="w-5 h-5 text-emerald-400" />
            <span className="text-sm font-mono text-emerald-400">Built with React + Tailwind</span>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-slate-500">
          <span className="text-sm">Scroll to explore</span>
          <div className="w-6 h-10 rounded-full border-2 border-slate-500 flex justify-center pt-2">
            <div className="w-1.5 h-3 bg-slate-500 rounded-full animate-bounce" />
          </div>
        </div>
      </section>

      {/* Features Section with Staggered Parallax Cards */}
      <section className="relative py-32 px-4">
        <div className="max-w-6xl mx-auto">
          <h2
            className="text-4xl font-bold text-center mb-4"
            style={{
              transform: `translateY(${Math.max(0, (scrollY - 400) * -0.1)}px)`,
              opacity: Math.min(1, (scrollY - 300) / 200),
            }}
          >
            Vibe Features
          </h2>
          <p
            className="text-slate-400 text-center mb-16 max-w-xl mx-auto"
            style={{
              transform: `translateY(${Math.max(0, (scrollY - 450) * -0.08)}px)`,
              opacity: Math.min(1, (scrollY - 350) / 200),
            }}
          >
            Modern effects that create engaging, memorable experiences
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              const cardOffset = index * 50;
              return (
                <div
                  key={feature.title}
                  className={`relative group cursor-pointer transition-all duration-500 ${
                    activeCard === index ? 'scale-105' : ''
                  }`}
                  style={{
                    transform: `translateY(${Math.max(0, (scrollY - 500 - cardOffset) * -0.05)}px)`,
                    opacity: Math.min(1, Math.max(0, (scrollY - 400 - cardOffset) / 200)),
                  }}
                  onMouseEnter={() => setActiveCard(index)}
                  onMouseLeave={() => setActiveCard(null)}
                >
                  {/* Card Glow Effect */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${feature.color} rounded-2xl blur-xl opacity-0 group-hover:opacity-30 transition-opacity duration-500`}
                  />

                  {/* Card */}
                  <div
                    className="relative bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-8 h-full overflow-hidden group-hover:border-white/20 transition-all duration-500"
                    style={{
                      transform: activeCard === index
                        ? `rotateX(${mousePos.y * -5}deg) rotateY(${mousePos.x * 5}deg)`
                        : 'none',
                      transformStyle: 'preserve-3d',
                      transition: 'transform 0.1s ease-out',
                    }}
                  >
                    {/* Icon */}
                    <div
                      className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500`}
                    >
                      <Icon className="w-7 h-7 text-white" />
                    </div>

                    {/* Content */}
                    <h3 className="text-xl font-bold mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-purple-200 transition-all duration-500">
                      {feature.title}
                    </h3>
                    <p className="text-slate-400 leading-relaxed">
                      {feature.description}
                    </p>

                    {/* Decorative Corner */}
                    <div className="absolute top-0 right-0 w-32 h-32 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                      <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-10 blur-2xl`} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Interactive Playground Section */}
      <section className="relative py-32 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-4">Interactive Playground</h2>
          <p className="text-slate-400 text-center mb-16">
            Click the boxes below to see different interaction patterns
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => {
              const colors = [
                'from-red-500 to-orange-500',
                'from-orange-500 to-yellow-500',
                'from-yellow-500 to-green-500',
                'from-green-500 to-teal-500',
                'from-teal-500 to-cyan-500',
                'from-cyan-500 to-blue-500',
                'from-blue-500 to-indigo-500',
                'from-indigo-500 to-purple-500',
              ];
              return (
                <InteractiveBox key={i} color={colors[i]} delay={i * 100} />
              );
            })}
          </div>
        </div>
      </section>

      {/* Demo Sites Showcase Section */}
      <section className="relative py-32 px-4 bg-slate-900/50">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Globe className="w-8 h-8 text-blue-400" />
            <h2 className="text-4xl font-bold text-center">Demo Sites</h2>
          </div>
          <p className="text-slate-400 text-center mb-16 max-w-2xl mx-auto">
            Full website demonstrations showcasing vibe code capabilities in action
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {demoSites.map((site) => (
              <Link
                key={site.id}
                href={site.href}
                className="group relative block"
              >
                {/* Card Glow */}
                <div className={`absolute inset-0 bg-gradient-to-br ${site.color} rounded-2xl blur-xl opacity-0 group-hover:opacity-40 transition-opacity duration-500`} />

                {/* Card */}
                <div className="relative bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden group-hover:border-white/30 transition-all duration-500">
                  {/* Header */}
                  <div className={`bg-gradient-to-br ${site.color} p-6`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-white mb-1">{site.title}</h3>
                        <p className="text-white/80 text-sm">{site.titleZh}</p>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-colors">
                        <ArrowUpRight className="w-5 h-5 text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                      </div>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-6">
                    <p className="text-slate-300 text-sm mb-4">{site.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {site.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-xs px-2 py-1 bg-white/10 text-slate-300 rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </Link>
            ))}

            {/* Coming Soon Card */}
            <div className="relative bg-slate-900/40 backdrop-blur-xl border border-dashed border-white/20 rounded-2xl p-6 flex flex-col items-center justify-center min-h-[280px]">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                <Sparkles className="w-8 h-8 text-slate-500" />
              </div>
              <p className="text-slate-500 font-medium">More demos coming soon</p>
              <p className="text-slate-600 text-sm mt-2">Stay tuned for new showcases</p>
            </div>
          </div>
        </div>
      </section>

      {/* Wave Divider with Parallax */}
      <div
        className="relative h-64 overflow-hidden"
        style={{
          transform: `translateY(${(scrollY - 1500) * 0.1}px)`,
        }}
      >
        <svg
          className="absolute bottom-0 w-full h-full"
          viewBox="0 0 1440 320"
          preserveAspectRatio="none"
        >
          <path
            fill="rgba(99, 102, 241, 0.1)"
            d="M0,192L48,197.3C96,203,192,213,288,229.3C384,245,480,267,576,250.7C672,235,768,181,864,181.3C960,181,1056,235,1152,234.7C1248,235,1344,181,1392,154.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
            style={{
              transform: `translateX(${mousePos.x * 50}px)`,
              transition: 'transform 0.5s ease-out',
            }}
          />
          <path
            fill="rgba(139, 92, 246, 0.1)"
            d="M0,256L48,240C96,224,192,192,288,181.3C384,171,480,181,576,197.3C672,213,768,235,864,229.3C960,224,1056,192,1152,181.3C1248,171,1344,181,1392,186.7L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
            style={{
              transform: `translateX(${mousePos.x * -30}px)`,
              transition: 'transform 0.5s ease-out',
            }}
          />
        </svg>
      </div>

      {/* Footer */}
      <footer className="relative py-12 border-t border-white/10 bg-slate-900/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-slate-500 text-sm">
            Vibe Code Demo - 5ML Agentic AI Platform
          </p>
          <p className="text-slate-600 text-xs mt-2">
            Demonstrating modern web interaction patterns with React and Tailwind CSS
          </p>
        </div>
      </footer>
    </div>
  );
}

// Interactive Box Component
function InteractiveBox({ color, delay }: { color: string; delay: number }) {
  const [isActive, setIsActive] = useState(false);
  const [rotation, setRotation] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const handleClick = () => {
    // Clear any existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    setIsActive(true);
    setRotation(prev => prev + 180);
    timerRef.current = setTimeout(() => setIsActive(false), 600);
  };

  return (
    <button
      onClick={handleClick}
      className={`aspect-square rounded-xl bg-gradient-to-br ${color} p-1 transition-all duration-500 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white/50`}
      style={{
        transform: `rotate(${rotation}deg) scale(${isActive ? 1.2 : 1})`,
        transition: 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
        animationDelay: `${delay}ms`,
      }}
    >
      <div className={`w-full h-full rounded-lg bg-slate-900/80 flex items-center justify-center transition-all duration-300 ${isActive ? 'bg-transparent' : ''}`}>
        <div className={`w-4 h-4 rounded-full bg-white/30 transition-all duration-300 ${isActive ? 'scale-150 opacity-0' : ''}`} />
      </div>
    </button>
  );
}
