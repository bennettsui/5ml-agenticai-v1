'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Building2, Palette, Sparkles, ShoppingBag, BookOpen,
  Leaf, Shirt, UtensilsCrossed, Plug, Gem, Cpu
} from 'lucide-react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { Breadcrumb } from '../components/Breadcrumb';

export default function CaseStudiesPage() {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const tagColorMap: Record<string, { bg: string; text: string; border: string }> = {
    'PR': { bg: 'bg-blue-50 dark:bg-blue-950/20', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-800' },
    'Events': { bg: 'bg-purple-50 dark:bg-purple-950/20', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-200 dark:border-purple-800' },
    'Fashion': { bg: 'bg-pink-50 dark:bg-pink-950/20', text: 'text-pink-700 dark:text-pink-300', border: 'border-pink-200 dark:border-pink-800' },
    'Launch': { bg: 'bg-green-50 dark:bg-green-950/20', text: 'text-green-700 dark:text-green-300', border: 'border-green-200 dark:border-green-800' },
    'Thought Leadership': { bg: 'bg-amber-50 dark:bg-amber-950/20', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-800' },
    'Executive Positioning': { bg: 'bg-orange-50 dark:bg-orange-950/20', text: 'text-orange-700 dark:text-orange-300', border: 'border-orange-200 dark:border-orange-800' },
    'Product Launch': { bg: 'bg-indigo-50 dark:bg-indigo-950/20', text: 'text-indigo-700 dark:text-indigo-300', border: 'border-indigo-200 dark:border-indigo-800' },
    'Consumer Goods': { bg: 'bg-cyan-50 dark:bg-cyan-950/20', text: 'text-cyan-700 dark:text-cyan-300', border: 'border-cyan-200 dark:border-cyan-800' },
    'Beauty': { bg: 'bg-rose-50 dark:bg-rose-950/20', text: 'text-rose-700 dark:text-rose-300', border: 'border-rose-200 dark:border-rose-800' },
    'Environmental': { bg: 'bg-lime-50 dark:bg-lime-950/20', text: 'text-lime-700 dark:text-lime-300', border: 'border-lime-200 dark:border-lime-800' },
    'Education': { bg: 'bg-teal-50 dark:bg-teal-950/20', text: 'text-teal-700 dark:text-teal-300', border: 'border-teal-200 dark:border-teal-800' },
    'Cultural': { bg: 'bg-violet-50 dark:bg-violet-950/20', text: 'text-violet-700 dark:text-violet-300', border: 'border-violet-200 dark:border-violet-800' },
    'Art': { bg: 'bg-fuchsia-50 dark:bg-fuchsia-950/20', text: 'text-fuchsia-700 dark:text-fuchsia-300', border: 'border-fuchsia-200 dark:border-fuchsia-800' },
    'International': { bg: 'bg-sky-50 dark:bg-sky-950/20', text: 'text-sky-700 dark:text-sky-300', border: 'border-sky-200 dark:border-sky-800' },
    'Architecture': { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-700 dark:text-slate-300', border: 'border-slate-300 dark:border-slate-600' },
    'Healthcare': { bg: 'bg-red-50 dark:bg-red-950/20', text: 'text-red-700 dark:text-red-300', border: 'border-red-200 dark:border-red-800' },
    'Advocacy': { bg: 'bg-yellow-50 dark:bg-yellow-950/20', text: 'text-yellow-700 dark:text-yellow-300', border: 'border-yellow-200 dark:border-yellow-800' },
    'NGO': { bg: 'bg-emerald-50 dark:bg-emerald-950/20', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-800' }
  };

  const getTagColors = (tag: string) => tagColorMap[tag] || { bg: 'bg-gray-50 dark:bg-gray-900/20', text: 'text-gray-700 dark:text-gray-300', border: 'border-gray-200 dark:border-gray-700' };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? [] : [tag]
    );
  };

  const caseStudies = [
    {
      slug: 'her-own-words-sport',
      title: 'Her Own Words Sport - Sportswear Launch',
      category: 'Fashion & Apparel',
      challenge: 'Launch Hong Kong\'s first sportswear brand featuring 17 Asian sizing options',
      result: '40+ media placements in major fashion and lifestyle outlets',
      metrics: ['40+ Media Placements', 'Featured in Marie Claire, Elle, Cosmopolitan', 'Celebrity partnership with Sammie (Collar)'],
      tags: ['PR', 'Fashion', 'Launch']
    },
    {
      slug: 'daikin',
      title: 'Daikin - Thought Leadership Campaign',
      category: 'Home Appliances',
      challenge: 'Establish thought leadership and strengthen brand image in air conditioning market',
      result: 'Secured coverage from Ming Pao, am730, and TOPick',
      metrics: ['Executive Feature Coverage', '18+ years expertise highlighted', 'Multiple mainstream publications'],
      tags: ['PR', 'Thought Leadership', 'Executive Positioning']
    },
    {
      slug: 'gp-batteries',
      title: 'GP Batteries - Limited Edition Minions Collection',
      category: 'Consumer Products',
      challenge: 'Drive brand awareness and consumer interest through unique product collaboration',
      result: '20+ media placements for novelty product line',
      metrics: ['20+ Media Placements', 'Featured in HK01, TOPick, Baby Kingdom', 'Collectible product success'],
      tags: ['PR', 'Product Launch', 'Consumer Goods']
    },
    {
      slug: 'filorga',
      title: 'FILORGA - NCEF-SHOT & TIME-FILLER Launch',
      category: 'Beauty & Skincare',
      challenge: 'Launch premium winter skincare products and support holiday e-commerce campaign',
      result: '20+ media placements in top-tier fashion and beauty publications',
      metrics: ['20+ Media Placements', 'Featured in Hong Kong Tatler, Madame Figaro, Girl Secret', 'Holiday shopping season support'],
      tags: ['PR', 'Beauty', 'Product Launch']
    },
    {
      slug: 'lung-fu-shan',
      title: 'Lung Fu Shan - "Into the Woods" Environmental Campaign',
      category: 'Education & Environment',
      challenge: 'Promote environmental education and encourage public engagement with nature',
      result: '80+ earned media placements from top-tier outlets',
      metrics: ['80+ Media Placements', '12 media attendees at preview', 'South China Morning Post, Hong Kong Economic Times featured'],
      tags: ['PR', 'Events', 'Environmental', 'Education']
    },
    {
      slug: 'chinese-culture-exhibition',
      title: 'Chinese Culture Exhibition - "華衣．武藝" (Robes & Martial Arts)',
      category: 'Art & Culture',
      challenge: 'Showcase relationship between traditional Chinese martial arts and cultural attire',
      result: 'Successful cultural event promotion and media coverage',
      metrics: ['Cultural dialogue', 'Multiple partner coordination', 'Community engagement'],
      tags: ['PR', 'Events', 'Cultural', 'Art']
    },
    {
      slug: 'venice-biennale-hk',
      title: 'Venice Biennale 2025 - Hong Kong Architecture Exhibition',
      category: 'Architecture & Art',
      challenge: 'Promote Hong Kong\'s architectural heritage and innovation at world-premier architecture biennial',
      result: 'International PR and media coverage for prestigious architecture exhibition',
      metrics: ['International Event', 'Architecture Focus', 'Global Media Reach'],
      tags: ['PR', 'International', 'Architecture', 'Cultural']
    },
    {
      slug: 'richmond-fellowship',
      title: 'Richmond Fellowship - Mental Health Advocacy Campaign',
      category: 'NGO & Healthcare',
      challenge: 'Raise public awareness of mental health issues and advocate for policy support',
      result: 'Secured coverage on TVB and Medical Inspire platforms',
      metrics: ['TVB Broadcast Coverage', 'Medical Inspire Platform', 'Policy Advocacy Support'],
      tags: ['PR', 'Healthcare', 'Advocacy', 'NGO']
    }
  ];

  const allTags = Array.from(new Set(caseStudies.flatMap(cs => cs.tags))).sort();

  const filteredCaseStudies = selectedTags.length === 0
    ? caseStudies
    : caseStudies.filter(cs => selectedTags.some(tag => cs.tags.includes(tag)));

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col">
      <Header />

      <main className="flex-1 pt-20">
        {/* Breadcrumb */}
        <section className="py-6 px-6 border-b border-slate-200 dark:border-slate-800">
          <div className="max-w-6xl mx-auto">
            <Breadcrumb items={[
              { label: 'Home', href: '/vibe-demo/radiance' },
              { label: 'Case Studies' }
            ]} />
          </div>
        </section>

        {/* Hero Section */}
        <section className="pt-16 pb-12 px-6 max-w-6xl mx-auto">
          <div className="space-y-4">
            <h1 className="text-5xl font-bold text-slate-900 dark:text-white leading-tight">
              Our Work
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl">
              Integrated campaigns across{' '}
              <Link href="/vibe-demo/radiance/services/public-relations" className="text-purple-600 dark:text-purple-400 hover:underline font-medium">PR</Link>
              {', '}
              <Link href="/vibe-demo/radiance/services/events" className="text-purple-600 dark:text-purple-400 hover:underline font-medium">events</Link>
              {', '}
              <Link href="/vibe-demo/radiance/services/kol-marketing" className="text-purple-600 dark:text-purple-400 hover:underline font-medium">KOL marketing</Link>
              {' and '}
              <Link href="/vibe-demo/radiance/services/creative-production" className="text-purple-600 dark:text-purple-400 hover:underline font-medium">creative production</Link>
              {' that deliver real business results for brands and institutions across Hong Kong and beyond.'}
            </p>
          </div>
        </section>

        {/* Tag Filter Section */}
        <section className="py-8 px-6 bg-slate-50 dark:bg-slate-900/30 border-b border-slate-200 dark:border-slate-800">
          <div className="max-w-6xl mx-auto">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-4">Filter by tag:</p>
            <div className="flex flex-wrap gap-2">
              {allTags.map((tag) => {
                const colors = getTagColors(tag);
                const isSelected = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-4 py-2 text-sm font-medium rounded-full border transition-all ${
                      isSelected
                        ? `${colors.bg} ${colors.text} border-2 ${colors.border.replace('border-', 'border-')} shadow-md`
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-purple-400 dark:hover:border-purple-500'
                    }`}
                  >
                    {tag}
                    {isSelected && ' ✓'}
                  </button>
                );
              })}
              {selectedTags.length > 0 && (
                <button
                  onClick={() => setSelectedTags([])}
                  className="px-4 py-2 text-sm font-medium rounded-full bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors ml-2"
                >
                  Clear all
                </button>
              )}
            </div>
            {selectedTags.length > 0 && (
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-4">
                Showing {filteredCaseStudies.length} of {caseStudies.length} case studies
              </p>
            )}
          </div>
        </section>

        {/* Case Studies Grid */}
        <section className="py-16 px-6 max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredCaseStudies.map((caseItem) => (
              <Link
                key={caseItem.slug}
                href={`/vibe-demo/radiance/case-studies/${caseItem.slug}`}
                className="group"
              >
                <div className="bg-gradient-to-br from-purple-50 to-slate-50 dark:from-slate-800 dark:to-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-8 h-full hover:border-purple-400 dark:hover:border-purple-500 hover:shadow-lg dark:hover:shadow-purple-900/20 transition-all">
                  <div className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wide mb-3">
                    {caseItem.category}
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                    {caseItem.title}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 text-sm mb-4 leading-relaxed">
                    {caseItem.challenge}
                  </p>
                  <p className="text-purple-600 dark:text-purple-400 font-semibold text-sm mb-4">
                    ✓ {caseItem.result}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {caseItem.tags.map((tag) => {
                      const colors = getTagColors(tag);
                      return (
                        <button
                          key={tag}
                          onClick={(e) => {
                            e.preventDefault();
                            toggleTag(tag);
                          }}
                          className={`px-3 py-1 text-xs font-medium rounded border transition-all cursor-pointer ${colors.bg} ${colors.text} border ${colors.border} hover:shadow-md hover:scale-105`}
                        >
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Industries Served */}
        <section className="py-16 px-6 bg-slate-50 dark:bg-slate-900/30 border-y border-slate-200 dark:border-slate-800">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-8 text-center">
              Industries We Serve
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { label: 'Architecture & City Planning', Icon: Building2 },
                { label: 'Art & Culture', Icon: Palette },
                { label: 'Beauty & Skincare', Icon: Sparkles },
                { label: 'Consumer Products', Icon: ShoppingBag },
                { label: 'Education', Icon: BookOpen },
                { label: 'Environment & Conservation', Icon: Leaf },
                { label: 'Fashion & Apparel', Icon: Shirt },
                { label: 'Food & Hospitality', Icon: UtensilsCrossed },
                { label: 'Home Appliances', Icon: Plug },
                { label: 'Luxury Goods', Icon: Gem },
                { label: 'Technology', Icon: Cpu },
              ].map(({ label, Icon }) => (
                <div key={label} className="flex items-center gap-3 p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700 hover:border-purple-200 dark:hover:border-purple-800 transition-colors">
                  <Icon className="w-5 h-5 text-purple-500 dark:text-purple-400 flex-shrink-0 stroke-[1.5]" />
                  <span className="text-slate-700 dark:text-slate-300 text-sm">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 px-6 max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-lg p-8 text-center">
            <h3 className="text-3xl font-bold text-white mb-4">Ready for your next campaign?</h3>
            <p className="text-purple-100 mb-8 leading-relaxed max-w-2xl mx-auto">
              Whether your challenge is brand awareness, perception shift, community engagement or market entry, we bring integrated strategy and hands-on execution. Let's discuss what's possible for your brand.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/vibe-demo/radiance/lead-gen"
                className="px-6 py-3 bg-white text-purple-600 font-bold rounded-lg hover:bg-purple-50 transition-colors"
              >
                Schedule Your Free Session →
              </Link>
              <Link
                href="/vibe-demo/radiance/contact"
                className="px-6 py-3 border-2 border-white text-white font-bold rounded-lg hover:bg-white/10 transition-colors"
              >
                Get in Touch
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
