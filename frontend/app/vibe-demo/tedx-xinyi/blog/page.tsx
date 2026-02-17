'use client';

import { useState } from 'react';
import { SiteNav, SiteFooter, Section, FadeIn, globalStyles, TED_RED } from '../components';

type Category = 'all' | 'curatorial' | 'guide';

const POSTS = [
  {
    title: '策展與科技整合的未來，還是人的感受與信任',
    date: '2025-09-25',
    category: 'curatorial' as const,
    categoryLabel: '策展觀點',
    thumbnail: 'https://tedxxinyi.com/wp-content/uploads/2025/09/ChatGPT-Image-2025%E5%B9%B49%E6%9C%8825%E6%97%A5-%E4%B8%8B%E5%8D%8804_22_26-150x150.png',
    excerpt: '當 AI 變成每一個活動都在談的 buzzword，我們更想問的是：\n在現場，說話的人和聽的人，還能不能真的互相信任？',
  },
  {
    title: '樂觀三部曲連載',
    date: '2021-08-24',
    category: 'curatorial' as const,
    categoryLabel: '策展觀點',
    thumbnail: null,
    excerpt: '「樂觀」不是天真的同義詞。\n而是在很糟的新聞之後，仍然願意問：那我們可以做什麼？',
  },
  {
    title: 'Zoom 如何置換個人背景',
    date: '2021-08-12',
    category: 'guide' as const,
    categoryLabel: '實用指南',
    thumbnail: null,
    excerpt: '在遠端時代，螢幕後面的那一塊矩形，\n也是你對世界說「我在這裡」的一種方式。',
  },
];

export default function BlogPage() {
  const [activeFilter, setActiveFilter] = useState<Category>('all');

  const filteredPosts = activeFilter === 'all'
    ? POSTS
    : POSTS.filter(p => p.category === activeFilter);

  return (
    <div className="tedx-xinyi bg-neutral-950 text-white min-h-screen">
      <style dangerouslySetInnerHTML={{ __html: globalStyles }} />
      <SiteNav currentPath="/vibe-demo/tedx-xinyi/blog" />

      {/* ==================== HERO ==================== */}
      <section className="relative min-h-[45vh] flex items-end overflow-hidden">
        <div className="absolute inset-0 bg-neutral-900">
          <img
            src="https://tedxxinyi.com/wp-content/uploads/2021/07/logo_white_%E5%B7%A5%E4%BD%9C%E5%8D%80%E5%9F%9F-1-e1625644086441.png"
            alt=""
            className="w-full h-full object-contain opacity-5"
            style={{ padding: '4rem' }}
          />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-6 pb-16 pt-32">
          <FadeIn>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black mb-6" lang="en">
              The Blog
            </h1>
          </FadeIn>
          <FadeIn delay={200}>
            <p className="text-white/70 text-base sm:text-lg leading-relaxed max-w-2xl" lang="zh-TW">
              這裡是策展筆記、實用教學與長期思考的集合。
            </p>
          </FadeIn>
        </div>
      </section>

      {/* ==================== CATEGORY FILTER ==================== */}
      <Section dark={false}>
        <FadeIn>
          <div className="flex flex-wrap gap-3 mb-12">
            {([
              { key: 'all' as const, label: '全部' },
              { key: 'curatorial' as const, label: '策展觀點 Curatorial Essays' },
              { key: 'guide' as const, label: '實用指南 Guides' },
            ]).map((cat) => (
              <button
                key={cat.key}
                onClick={() => setActiveFilter(cat.key)}
                className={`px-4 py-2 text-sm rounded-full border transition-all ${
                  activeFilter === cat.key
                    ? 'border-white/40 text-white font-medium bg-white/10'
                    : 'border-white/10 text-white/50 hover:text-white hover:border-white/30'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </FadeIn>

        {/* ==================== POST GRID ==================== */}
        <div className="space-y-6">
          {filteredPosts.map((post, i) => (
            <FadeIn key={post.title} delay={i * 100}>
              <article className="group flex flex-col md:flex-row gap-6 bg-neutral-800/30 rounded-xl overflow-hidden border border-white/5 hover:border-white/15 transition-all cursor-pointer">
                {/* Thumbnail */}
                {post.thumbnail ? (
                  <div className="w-full md:w-48 h-48 md:h-auto flex-shrink-0 overflow-hidden">
                    <img
                      src={post.thumbnail}
                      alt=""
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                ) : (
                  <div className="w-full md:w-48 h-48 md:h-auto flex-shrink-0 bg-neutral-800/60 flex items-center justify-center">
                    <span className="text-white/10 text-4xl font-black">T</span>
                  </div>
                )}

                {/* Content */}
                <div className="flex-1 p-5 md:py-6 md:pr-6 md:pl-0">
                  <div className="flex items-center gap-3 mb-3">
                    <span
                      className="text-xs px-2.5 py-0.5 rounded-full font-medium"
                      style={{
                        backgroundColor: post.category === 'curatorial' ? `${TED_RED}20` : 'rgba(255,255,255,0.08)',
                        color: post.category === 'curatorial' ? TED_RED : 'rgba(255,255,255,0.5)',
                      }}
                    >
                      {post.categoryLabel}
                    </span>
                    <span className="text-white/30 text-xs">{post.date}</span>
                  </div>

                  <h2 className="text-lg font-bold mb-3 group-hover:text-white transition-colors" lang="zh-TW">
                    {post.title}
                  </h2>

                  <p className="text-white/45 text-sm leading-relaxed whitespace-pre-line" lang="zh-TW">
                    {post.excerpt}
                  </p>
                </div>
              </article>
            </FadeIn>
          ))}
        </div>

        {filteredPosts.length === 0 && (
          <div className="text-center py-16">
            <p className="text-white/30 text-sm">No posts in this category yet.</p>
          </div>
        )}
      </Section>

      <SiteFooter />
    </div>
  );
}
