'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft, X, Calendar, Users, Globe, Award, Heart, GraduationCap, Handshake, MapPin, Clock, Mail } from 'lucide-react';

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

const eras = [
  {
    id: 'founding',
    range: '1954-1969',
    title: 'Founding Years',
    titleZh: '創社時期',
    description: 'Established as one of the early Rotary clubs in Hong Kong, RCHKIE was founded by visionary community leaders who saw the need for organized service in the rapidly developing Hong Kong Island East district.',
    bullets: [
      'Charter members from diverse business backgrounds',
      'Focus on post-war community rebuilding',
      'Established core service traditions',
    ],
  },
  {
    id: 'factories',
    range: '1970s-1980s',
    title: 'From Factories to Communities',
    titleZh: '工業社區時代',
    description: 'As Hong Kong industrialized, the club evolved to serve factory workers and their families. Projects focused on education, vocational training, and improving working conditions in the Eastern district.',
    bullets: [
      'Vocational training programs for workers',
      'Scholarships for workers\' children',
      'Community health initiatives',
    ],
  },
  {
    id: 'professionals',
    range: '1990s-2000s',
    title: 'Middle-Class & Professionals',
    titleZh: '專業人士年代',
    description: 'With Hong Kong\'s economic transformation, RCHKIE attracted professionals from finance, law, medicine, and technology. Service projects became more sophisticated and international in scope.',
    bullets: [
      'International service partnerships',
      'Professional mentorship programs',
      'Major fundraising initiatives',
    ],
  },
  {
    id: 'brand',
    range: '2010s',
    title: 'Brand & International Links',
    titleZh: '品牌與國際連結',
    description: 'The club strengthened its brand identity and expanded international connections. Signature events were established, and collaboration with overseas Rotary clubs flourished.',
    bullets: [
      'Established signature annual events',
      'Sister club relationships worldwide',
      'Social media presence launched',
    ],
  },
  {
    id: 'digital',
    range: '2020s',
    title: 'Digital & Creative Era',
    titleZh: '數碼創意時代',
    description: 'Embracing digital transformation, RCHKIE now leverages technology for service and engagement. Youth-focused creative projects reflect the changing demographics of Hong Kong.',
    bullets: [
      'Student Smartphone Photo Contest launched',
      'Virtual meetings and hybrid events',
      'Focus on youth creativity and innovation',
    ],
  },
];

const projects = [
  {
    id: 'photo-contest',
    title: 'Student Smartphone Photo Contest',
    titleZh: '學生手機攝影比賽',
    years: '2023-present',
    tags: ['Youth & Education', 'Signature Events'],
    category: 'youth',
    short: 'Annual photography competition encouraging students to capture Hong Kong through their smartphone lenses.',
    long: 'The Student Smartphone Photo Contest is an annual competition open to primary and secondary school students across Hong Kong. Participants use their smartphones to capture images that tell stories about their community, culture, and daily life. The contest promotes creativity, visual literacy, and appreciation for Hong Kong\'s unique urban landscape. Winning entries are exhibited publicly and winners receive scholarships and photography workshops.',
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
    title: 'Joint Service with Overseas Clubs',
    titleZh: '海外社聯合服務',
    years: 'Ongoing',
    tags: ['International'],
    category: 'international',
    short: 'Collaborative humanitarian projects with Rotary clubs from Japan, Taiwan, and Southeast Asia.',
    long: 'RCHKIE maintains active partnerships with Rotary clubs across Asia Pacific. Joint service projects include disaster relief efforts, educational exchanges, and cross-border charitable initiatives. Annual friendship visits strengthen bonds between clubs, and members participate in international conventions together. These partnerships exemplify Rotary\'s global reach and fellowship.',
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
  {
    id: 'disaster-relief',
    title: 'Global Disaster Relief Fund',
    titleZh: '全球災難救援基金',
    years: 'Ongoing',
    tags: ['International', 'Community Care'],
    category: 'international',
    short: 'Rapid response funding for natural disasters and humanitarian crises worldwide.',
    long: 'RCHKIE maintains a disaster relief fund that enables rapid response to natural disasters and humanitarian emergencies. Working through Rotary International\'s network, contributions reach affected communities quickly and efficiently. Past responses include support for earthquake victims, flood relief, and pandemic assistance.',
  },
];

const relationships = [
  {
    id: 'mother',
    name: 'Rotary Club of Hong Kong',
    nameZh: '香港扶輪社',
    relationType: 'Mother Club',
    description: 'Founded in 1930, the Rotary Club of Hong Kong sponsored the establishment of RCHKIE in 1954.',
    position: 'top',
  },
  {
    id: 'harbour',
    name: 'RC Hong Kong Harbour',
    nameZh: '香港海港扶輪社',
    relationType: 'Sister Club',
    description: 'A fellow club serving the central harbor district, with frequent joint projects.',
    position: 'left',
  },
  {
    id: 'south',
    name: 'RC Hong Kong South',
    nameZh: '香港南區扶輪社',
    relationType: 'Sister Club',
    description: 'Neighboring club serving the Southern district, partner in district-wide initiatives.',
    position: 'right',
  },
  {
    id: 'rotaract',
    name: 'Rotaract Club of HKIE',
    nameZh: '香港島東扶青社',
    relationType: 'Youth Wing',
    description: 'Young professionals (18-30) carrying forward Rotary values to the next generation.',
    position: 'bottom-left',
  },
  {
    id: 'interact',
    name: 'Interact Clubs',
    nameZh: '扶少團',
    relationType: 'Student Wing',
    description: 'Secondary school service clubs sponsored by RCHKIE in local schools.',
    position: 'bottom-right',
  },
];

const joiningInfo = {
  meetingTime: 'Every Thursday, 12:30 PM',
  meetingLocation: 'Causeway Bay Hotel (name TBC)',
  membershipSteps: [
    'Attend as a guest at a weekly meeting',
    'Meet with membership committee',
    'Complete application and background check',
    'Induction ceremony and welcome',
  ],
  youthOpportunities: [
    'Join Rotaract (ages 18-30)',
    'Participate in Interact at your school',
    'Enter the Student Photo Contest',
    'Apply for Youth Leadership Scholarship',
  ],
  partnerOpportunities: [
    'CSR collaboration on community projects',
    'Event sponsorship opportunities',
    'Professional networking',
    'Global Rotary partnership access',
  ],
};

// ==================== COMPONENTS ====================

export default function RotaryHKIEPage() {
  const [activeEra, setActiveEra] = useState('digital');
  const [activeFilter, setActiveFilter] = useState('All');
  const [selectedProject, setSelectedProject] = useState<typeof projects[0] | null>(null);
  const [hoveredRelation, setHoveredRelation] = useState<string | null>(null);

  const timelineRef = useRef<HTMLDivElement>(null);
  const joinRef = useRef<HTMLDivElement>(null);

  const scrollToTimeline = () => {
    timelineRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToJoin = () => {
    joinRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const filters = ['All', 'Youth & Education', 'Community Care', 'International', 'Signature Events'];

  const filteredProjects = activeFilter === 'All'
    ? projects
    : projects.filter(p => p.tags.includes(activeFilter));

  const currentEra = eras.find(e => e.id === activeEra) || eras[eras.length - 1];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-950 text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-blue-950/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/vibe-demo"
              className="flex items-center gap-2 text-blue-300 hover:text-white transition-colors group"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              <span>Back to Demos</span>
            </Link>
            <div className="hidden sm:flex items-center gap-6 text-sm">
              <button onClick={scrollToTimeline} className="text-blue-300 hover:text-white transition-colors">
                Our History
              </button>
              <button onClick={scrollToJoin} className="text-blue-300 hover:text-white transition-colors">
                Join Us
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-br from-blue-500/20 via-purple-500/10 to-transparent rounded-full blur-3xl" />
          <div className="absolute top-20 right-20 w-32 h-32 border border-yellow-500/30 rounded-full" />
          <div className="absolute bottom-20 left-20 w-24 h-24 border border-blue-400/30 rounded-full" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Rotary Wheel Icon */}
          <div className="inline-flex items-center justify-center w-20 h-20 mb-8 rounded-full bg-gradient-to-br from-yellow-500 to-yellow-600 shadow-lg shadow-yellow-500/30">
            <div className="w-12 h-12 border-4 border-blue-900 rounded-full flex items-center justify-center">
              <div className="w-4 h-4 bg-blue-900 rounded-full" />
            </div>
          </div>

          <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-100 to-yellow-200">
            {clubMeta.name}
          </h1>
          <p className="text-2xl md:text-3xl text-yellow-400 font-medium mb-2">
            {clubMeta.nameChinese}
          </p>
          <p className="text-lg text-blue-200 mb-8">
            {clubMeta.subtitle} | {clubMeta.subtitleChinese}
          </p>

          {/* Bilingual Description */}
          <div className="max-w-3xl mx-auto mb-12 space-y-4">
            <p className="text-blue-100 leading-relaxed">
              {clubMeta.descriptionEn}
            </p>
            <p className="text-blue-200/80 leading-relaxed">
              {clubMeta.descriptionZh}
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={scrollToTimeline}
              className="px-8 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 text-blue-900 font-semibold rounded-full hover:from-yellow-400 hover:to-yellow-500 transition-all shadow-lg shadow-yellow-500/30 hover:shadow-yellow-500/50"
            >
              Explore Our Journey
            </button>
            <button
              onClick={scrollToJoin}
              className="px-8 py-3 bg-white/10 backdrop-blur-sm border border-white/30 text-white font-semibold rounded-full hover:bg-white/20 transition-all"
            >
              Contact / Join
            </button>
          </div>
        </div>
      </section>

      {/* Era Timeline Section */}
      <section ref={timelineRef} className="py-20 bg-blue-950/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-4">Our Journey Through Time</h2>
          <p className="text-blue-300 text-center mb-12 max-w-2xl mx-auto">
            Seven decades of service, fellowship, and community impact
          </p>

          {/* Timeline Navigation */}
          <div className="flex flex-wrap justify-center gap-2 mb-12">
            {eras.map((era) => (
              <button
                key={era.id}
                onClick={() => setActiveEra(era.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  activeEra === era.id
                    ? 'bg-yellow-500 text-blue-900 shadow-lg shadow-yellow-500/30'
                    : 'bg-white/10 text-blue-200 hover:bg-white/20'
                }`}
              >
                {era.range}
              </button>
            ))}
          </div>

          {/* Timeline Content */}
          <div className="grid lg:grid-cols-2 gap-8 items-start">
            {/* Era Details */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
              <div className="flex items-center gap-3 mb-4">
                <Calendar className="w-6 h-6 text-yellow-500" />
                <span className="text-yellow-500 font-medium">{currentEra.range}</span>
              </div>
              <h3 className="text-2xl font-bold mb-2">{currentEra.title}</h3>
              <p className="text-blue-300 mb-1">{currentEra.titleZh}</p>
              <p className="text-blue-100 leading-relaxed mt-4 mb-6">
                {currentEra.description}
              </p>
              <ul className="space-y-3">
                {currentEra.bullets.map((bullet, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0" />
                    <span className="text-blue-200">{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Visual Timeline */}
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-yellow-500 via-blue-400 to-purple-500" />
              <div className="space-y-6 pl-12">
                {eras.map((era, idx) => (
                  <div
                    key={era.id}
                    className={`relative cursor-pointer transition-all ${
                      activeEra === era.id ? 'scale-105' : 'opacity-60 hover:opacity-100'
                    }`}
                    onClick={() => setActiveEra(era.id)}
                  >
                    <div
                      className={`absolute -left-12 top-1 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                        activeEra === era.id
                          ? 'bg-yellow-500 shadow-lg shadow-yellow-500/50'
                          : 'bg-blue-800 border border-blue-600'
                      }`}
                    >
                      <span className="text-xs font-bold">{idx + 1}</span>
                    </div>
                    <div className={`p-4 rounded-xl transition-all ${
                      activeEra === era.id
                        ? 'bg-white/10 border border-yellow-500/30'
                        : 'bg-white/5'
                    }`}>
                      <p className="text-yellow-500 text-sm font-medium">{era.range}</p>
                      <p className="font-semibold">{era.title}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Project Gallery Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-4">Our Projects & Initiatives</h2>
          <p className="text-blue-300 text-center mb-12 max-w-2xl mx-auto">
            Making a difference through service above self
          </p>

          {/* Filter Buttons */}
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

          {/* Project Cards Grid */}
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
                  className="group cursor-pointer bg-white/5 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/10 hover:border-blue-400/50 transition-all hover:shadow-lg hover:shadow-blue-500/10"
                >
                  {/* Card Header */}
                  <div className="p-6 border-b border-white/10">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
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

                  {/* Card Body */}
                  <div className="p-6">
                    <p className="text-blue-200 text-sm mb-4 line-clamp-2">{project.short}</p>
                    <div className="flex flex-wrap gap-2">
                      {project.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-xs px-2 py-1 bg-white/10 text-blue-200 rounded-full"
                        >
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

      {/* Rotary Network Section */}
      <section className="py-20 bg-blue-950/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-4">Our Rotary Family</h2>
          <p className="text-blue-300 text-center mb-12 max-w-2xl mx-auto">
            Connected through service and fellowship
          </p>

          {/* Network Diagram */}
          <div className="relative max-w-3xl mx-auto py-16">
            {/* Center Node */}
            <div className="relative z-10 flex flex-col items-center">
              {/* Top Connection */}
              <div className="absolute -top-16 left-1/2 -translate-x-1/2 flex flex-col items-center">
                <div
                  className={`p-4 rounded-xl bg-gradient-to-br from-yellow-500 to-yellow-600 text-blue-900 text-center cursor-pointer transition-all ${
                    hoveredRelation === 'mother' ? 'scale-110 shadow-lg shadow-yellow-500/50' : ''
                  }`}
                  onMouseEnter={() => setHoveredRelation('mother')}
                  onMouseLeave={() => setHoveredRelation(null)}
                >
                  <p className="font-bold text-sm">{relationships[0].name}</p>
                  <p className="text-xs opacity-80">{relationships[0].relationType}</p>
                </div>
                <div className="w-0.5 h-8 bg-yellow-500/50" />
              </div>

              {/* Left Connection */}
              <div className="absolute top-1/2 -left-32 md:-left-48 -translate-y-1/2 flex items-center">
                <div
                  className={`p-3 rounded-xl bg-white/10 border border-white/20 text-center cursor-pointer transition-all ${
                    hoveredRelation === 'harbour' ? 'scale-110 bg-white/20' : ''
                  }`}
                  onMouseEnter={() => setHoveredRelation('harbour')}
                  onMouseLeave={() => setHoveredRelation(null)}
                >
                  <p className="font-bold text-xs">{relationships[1].name}</p>
                  <p className="text-xs text-blue-300">{relationships[1].relationType}</p>
                </div>
                <div className="w-8 h-0.5 bg-blue-400/50" />
              </div>

              {/* Right Connection */}
              <div className="absolute top-1/2 -right-32 md:-right-48 -translate-y-1/2 flex items-center">
                <div className="w-8 h-0.5 bg-blue-400/50" />
                <div
                  className={`p-3 rounded-xl bg-white/10 border border-white/20 text-center cursor-pointer transition-all ${
                    hoveredRelation === 'south' ? 'scale-110 bg-white/20' : ''
                  }`}
                  onMouseEnter={() => setHoveredRelation('south')}
                  onMouseLeave={() => setHoveredRelation(null)}
                >
                  <p className="font-bold text-xs">{relationships[2].name}</p>
                  <p className="text-xs text-blue-300">{relationships[2].relationType}</p>
                </div>
              </div>

              {/* Center */}
              <div className="w-48 h-48 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-6 shadow-2xl shadow-blue-500/30 border-4 border-white/20">
                <div className="text-center">
                  <Users className="w-10 h-10 mx-auto mb-2" />
                  <p className="font-bold text-sm">RCHKIE</p>
                  <p className="text-xs text-blue-200">{clubMeta.nameChinese}</p>
                </div>
              </div>

              {/* Bottom Connections */}
              <div className="w-0.5 h-8 bg-purple-500/50" />
              <div className="flex gap-8">
                <div
                  className={`p-3 rounded-xl bg-gradient-to-br from-purple-500/30 to-pink-500/30 border border-purple-400/30 text-center cursor-pointer transition-all ${
                    hoveredRelation === 'rotaract' ? 'scale-110 shadow-lg shadow-purple-500/30' : ''
                  }`}
                  onMouseEnter={() => setHoveredRelation('rotaract')}
                  onMouseLeave={() => setHoveredRelation(null)}
                >
                  <p className="font-bold text-xs">{relationships[3].name}</p>
                  <p className="text-xs text-purple-300">{relationships[3].relationType}</p>
                </div>
                <div
                  className={`p-3 rounded-xl bg-gradient-to-br from-pink-500/30 to-orange-500/30 border border-pink-400/30 text-center cursor-pointer transition-all ${
                    hoveredRelation === 'interact' ? 'scale-110 shadow-lg shadow-pink-500/30' : ''
                  }`}
                  onMouseEnter={() => setHoveredRelation('interact')}
                  onMouseLeave={() => setHoveredRelation(null)}
                >
                  <p className="font-bold text-xs">{relationships[4].name}</p>
                  <p className="text-xs text-pink-300">{relationships[4].relationType}</p>
                </div>
              </div>
            </div>

            {/* Hover Tooltip */}
            {hoveredRelation && (
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-xl p-4 rounded-xl border border-white/20 max-w-sm text-center">
                <p className="text-blue-100 text-sm">
                  {relationships.find(r => r.id === hoveredRelation)?.description}
                </p>
              </div>
            )}
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

          {/* Meeting Info */}
          <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-2xl p-8 border border-yellow-500/30 mb-12 max-w-2xl mx-auto">
            <div className="flex flex-col md:flex-row items-center justify-center gap-8 text-center md:text-left">
              <div className="flex items-center gap-3">
                <Clock className="w-8 h-8 text-yellow-500" />
                <div>
                  <p className="text-sm text-yellow-300">Meeting Time</p>
                  <p className="font-bold">{joiningInfo.meetingTime}</p>
                </div>
              </div>
              <div className="w-px h-12 bg-yellow-500/30 hidden md:block" />
              <div className="flex items-center gap-3">
                <MapPin className="w-8 h-8 text-yellow-500" />
                <div>
                  <p className="text-sm text-yellow-300">Location</p>
                  <p className="font-bold">{joiningInfo.meetingLocation}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Three Columns */}
          <div className="grid md:grid-cols-3 gap-8">
            {/* For Members */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
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

            {/* For Youth */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
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

            {/* For Partners */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
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

          {/* Contact Button */}
          <div className="text-center mt-12">
            <a
              href="mailto:info@rotaryhkie.org"
              className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-full hover:from-blue-400 hover:to-purple-500 transition-all shadow-lg shadow-blue-500/30"
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
          <p className="text-blue-400 text-sm">
            Rotary Club of Hong Kong Island East | 香港島東扶輪社
          </p>
          <p className="text-blue-500 text-xs mt-2">
            &quot;Service Above Self&quot; | 超我服務
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
