'use client';

import { useState } from 'react';
import { SiteNav, SiteFooter, Section, SectionLabel, FadeIn, globalStyles, TED_RED, WARM_GRAY } from '../components';

type Category = 'all' | 'curatorial' | 'guide';

const POSTS = [
  {
    title: '策展筆記｜AI 模組化的未來，真正不能被複製的，是人的感知與信念',
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
    title: 'Zoom 如何置換個人虛擬背景',
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
    <div className="tedx-xinyi bg-white text-neutral-900 min-h-screen">
      <style dangerouslySetInnerHTML={{ __html: globalStyles }} />
      <SiteNav currentPath="/vibe-demo/tedx-xinyi/blog" />

      {/* ==================== HERO — CLEAN / EDITORIAL ==================== */}
      <section className="pt-28 pb-16 px-6" style={{ backgroundColor: WARM_GRAY }}>
        <div className="max-w-5xl mx-auto">
          <FadeIn>
            <SectionLabel>BLOG</SectionLabel>
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-black" lang="en">
              The Blog
            </h1>
          </FadeIn>
          <FadeIn delay={200}>
            <p className="text-neutral-500 text-base sm:text-lg mt-4 max-w-xl" lang="zh-TW">
              這裡是策展筆記、實用教學與長期思考的集合。
            </p>
          </FadeIn>
        </div>
      </section>

      {/* ==================== FILTER + POSTS ==================== */}
      <Section bg="white">
        <FadeIn>
          <div className="flex flex-wrap gap-2 mb-12">
            {([
              { key: 'all' as const, label: '全部' },
              { key: 'curatorial' as const, label: '策展觀點 Curatorial Essays' },
              { key: 'guide' as const, label: '實用指南 Guides' },
            ]).map((cat) => (
              <button
                key={cat.key}
                onClick={() => setActiveFilter(cat.key)}
                className={`px-4 py-2 text-sm font-bold rounded-full border-2 transition-all ${
                  activeFilter === cat.key
                    ? 'border-neutral-900 text-white'
                    : 'border-neutral-200 text-neutral-500 hover:text-neutral-900 hover:border-neutral-400'
                }`}
                style={activeFilter === cat.key ? { backgroundColor: '#1a1a1a', color: 'white', borderColor: '#1a1a1a' } : undefined}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </FadeIn>

        <div className="space-y-6">
          {filteredPosts.map((post, i) => (
            <FadeIn key={post.title} delay={i * 80}>
              <article className="group flex flex-col sm:flex-row gap-6 rounded-xl overflow-hidden border border-neutral-100 hover:border-neutral-200 hover:shadow-md transition-all cursor-pointer p-5 sm:p-0">
                {post.thumbnail ? (
                  <div className="w-full sm:w-44 h-44 sm:h-auto flex-shrink-0 overflow-hidden rounded-lg sm:rounded-none bg-neutral-100">
                    <img
                      src={post.thumbnail}
                      alt=""
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                ) : (
                  <div className="w-full sm:w-44 h-44 sm:h-auto flex-shrink-0 flex items-center justify-center rounded-lg sm:rounded-none" style={{ backgroundColor: WARM_GRAY }}>
                    <span className="text-neutral-300 text-5xl font-black">T</span>
                  </div>
                )}

                <div className="flex-1 sm:py-5 sm:pr-6">
                  <div className="flex items-center gap-3 mb-3">
                    <span
                      className="text-xs font-bold px-2.5 py-1 rounded-full"
                      style={{
                        backgroundColor: post.category === 'curatorial' ? `${TED_RED}10` : WARM_GRAY,
                        color: post.category === 'curatorial' ? TED_RED : '#777',
                      }}
                    >
                      {post.categoryLabel}
                    </span>
                    <span className="text-neutral-400 text-xs font-medium">{post.date}</span>
                  </div>

                  <h2 className="text-lg font-black mb-2 group-hover:text-neutral-600 transition-colors" lang="zh-TW">
                    {post.title}
                  </h2>

                  <p className="text-neutral-500 text-sm leading-relaxed whitespace-pre-line" lang="zh-TW">
                    {post.excerpt}
                  </p>
                </div>
              </article>
            </FadeIn>
          ))}
        </div>

        {filteredPosts.length === 0 && (
          <div className="text-center py-16">
            <p className="text-neutral-400 text-sm">No posts in this category yet.</p>
          </div>
        )}
      </Section>

      <SiteFooter />
    </div>
  );
}
