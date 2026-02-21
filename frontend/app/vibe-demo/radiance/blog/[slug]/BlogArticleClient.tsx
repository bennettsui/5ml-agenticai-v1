'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer';
import { Breadcrumb } from '../../components/Breadcrumb';

interface ArticleData {
  title: string;
  date: string;
  category: string;
  readTime: string;
  excerpt: string;
  content: string;
}

interface CmsOverride {
  title_en?: string;
  date_en?: string;
  category_en?: string;
  read_time?: string;
  excerpt_en?: string;
  hero_image?: string;
  content_en?: string;
}

const API_BASE =
  typeof window !== 'undefined'
    ? process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'
    : 'http://localhost:8080';

export default function BlogArticleClient({
  slug,
  fallback,
}: {
  slug: string;
  fallback: ArticleData;
}) {
  const [article, setArticle] = useState<ArticleData>(fallback);
  const [heroImage, setHeroImage] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/radiance/blog/${slug}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.post) {
          const p: CmsOverride = data.post;
          setArticle({
            title: p.title_en || fallback.title,
            date: p.date_en || fallback.date,
            category: p.category_en || fallback.category,
            readTime: p.read_time || fallback.readTime,
            excerpt: p.excerpt_en || fallback.excerpt,
            content: p.content_en || fallback.content,
          });
          if (p.hero_image) setHeroImage(p.hero_image);
        }
      })
      .catch(() => {/* use fallback */});
  }, [slug, fallback]);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col">
      <Header />

      <main className="flex-1 pt-20">
        {/* Breadcrumb */}
        <section className="py-3 px-6 border-b border-slate-100 dark:border-slate-800">
          <div className="max-w-6xl mx-auto">
            <Breadcrumb items={[
              { label: 'Home', href: '/vibe-demo/radiance' },
              { label: 'Blog', href: '/vibe-demo/radiance/blog' },
              { label: article.title }
            ]} />
          </div>
        </section>

        {/* Hero Section */}
        <section className="relative py-20 px-6 overflow-hidden">
          {heroImage ? (
            <>
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${heroImage})` }}
              />
              <div className="absolute inset-0 bg-slate-900/70" />
            </>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 to-slate-800" />
          )}
          <div className="relative z-10 max-w-6xl mx-auto">
            <Link href="/vibe-demo/radiance/blog" className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 text-sm font-medium mb-6 transition-colors">
              ← Back to Blog
            </Link>
            <div className="mb-4">
              <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider bg-purple-900/30 px-3 py-1 rounded-full">
                {article.category}
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight max-w-4xl">
              {article.title}
            </h1>
            <div className="flex items-center gap-4 text-slate-400 text-sm">
              <span>{article.date}</span>
              <span>•</span>
              <span>{article.readTime}</span>
            </div>
          </div>
        </section>

        {/* Article Content */}
        <article className="py-20 px-6 max-w-3xl mx-auto">
          <div
            className="prose prose-slate dark:prose-invert max-w-none
              prose-h2:text-2xl prose-h2:font-bold prose-h2:text-slate-900 dark:prose-h2:text-white
              prose-h2:mt-12 prose-h2:mb-5 prose-h2:pb-2 prose-h2:border-b prose-h2:border-slate-100 dark:prose-h2:border-slate-800
              prose-h3:text-xl prose-h3:font-semibold prose-h3:text-slate-800 dark:prose-h3:text-slate-200
              prose-h3:mt-8 prose-h3:mb-3
              prose-p:text-lg prose-p:text-slate-600 dark:prose-p:text-slate-400 prose-p:leading-[1.85] prose-p:mb-6
              prose-li:text-lg prose-li:text-slate-600 dark:prose-li:text-slate-400 prose-li:leading-[1.75]
              prose-ul:mb-6 prose-ol:mb-6
              prose-strong:text-slate-800 dark:prose-strong:text-slate-200 prose-strong:font-semibold
              prose-a:text-purple-600 dark:prose-a:text-purple-400 hover:prose-a:underline"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />
        </article>

        {/* Related Articles */}
        <section className="py-16 px-6 bg-slate-50 dark:bg-slate-900/30 border-t border-slate-200 dark:border-slate-800">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-8">Related Articles</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <Link
                href="/vibe-demo/radiance/blog"
                className="p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-purple-400 dark:hover:border-purple-500 transition-colors"
              >
                <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase">Back to Blog</span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-2">Read More Articles</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">Explore more insights on PR, events and integrated marketing</p>
              </Link>
              <Link
                href="/vibe-demo/radiance/case-studies"
                className="p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-purple-400 dark:hover:border-purple-500 transition-colors"
              >
                <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase">See These Ideas In Action</span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-2">View Case Studies</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">See real examples of these strategies delivered for Hong Kong brands</p>
              </Link>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-lg p-8 text-center">
              <h3 className="text-2xl font-bold text-white mb-4">
                Ready to apply these strategies to your brand?
              </h3>
              <p className="text-purple-100 mb-8 leading-relaxed max-w-2xl mx-auto">
                Let&apos;s discuss how integrated PR, events and digital strategies can drive real results for your organisation.
              </p>
              <Link
                href="/vibe-demo/radiance/lead-gen"
                className="inline-block px-6 py-3 bg-white text-purple-600 font-semibold rounded-lg hover:bg-purple-50 transition-colors"
              >
                Schedule Your Free Strategy Session →
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
