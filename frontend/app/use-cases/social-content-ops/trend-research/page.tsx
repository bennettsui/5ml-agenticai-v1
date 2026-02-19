'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  TrendingUp, AlertCircle, Loader2, Sparkles, Search, BookOpen,
  Video, Image, FileText, Layers, ChevronDown, ChevronUp,
  Globe, Hash, Clock, Star, ExternalLink, RefreshCw,
  Smartphone, Monitor, Maximize2, Type, Zap,
} from 'lucide-react';
import { useBrandProject } from '@/lib/brand-context';

/* ── Types ──────────────────────────────── */

interface TrendEntry {
  id: string;
  topic: string;
  category: string;
  platform: string;
  relevance: 'High' | 'Medium' | 'Low';
  description: string;
  source: string;
  sourceUrl?: string;
  dateSpotted: string;
  actionable: string;
  importance: number; // 1-5 scale
  mentions: number; // count of mentions/reports
}

interface BestPractice {
  id: string;
  format: string;
  platform: string;
  specs: { label: string; value: string }[];
  tips: string[];
  seoNotes: string;
  lastUpdated: string;
}

type Tab = 'trends' | 'best-practices' | 'seo';

/* ── Best Practice Data (shared knowledge) ── */

const FORMAT_BEST_PRACTICES: BestPractice[] = [
  {
    id: 'ig-reels', format: 'Reels', platform: 'Instagram',
    specs: [
      { label: 'Aspect Ratio', value: '9:16 (vertical)' },
      { label: 'Resolution', value: '1080 x 1920 px' },
      { label: 'Duration', value: '15s – 90s (sweet spot: 15-30s)' },
      { label: 'File Size', value: 'Max 4GB' },
      { label: 'Format', value: 'MP4, MOV' },
      { label: 'Cover Image', value: '1080 x 1920 px' },
      { label: 'Caption Length', value: 'Up to 2,200 chars (first 125 visible)' },
      { label: 'Hashtags', value: '3-5 targeted (avoid 30 spam)' },
    ],
    tips: [
      'Hook viewers in first 1-3 seconds — use text overlay or surprising visual',
      'Use trending audio but add original commentary/value',
      'End with a CTA (follow, save, share) — saves boost algorithm ranking',
      'Add captions/subtitles — 80%+ watch without sound',
      'Post during peak hours: 9am, 12pm, 7pm local time',
      'Use 3-5 relevant hashtags, not 30 generic ones',
      'Vertical only — never letterboxed horizontal video',
      'Loop the ending to the beginning for replay value',
    ],
    seoNotes: 'IG Reels are indexed by audio, text overlay, caption keywords, and hashtags. Use descriptive captions with target keywords in the first line. Alt text is available for accessibility and SEO.',
    lastUpdated: '2026-02',
  },
  {
    id: 'ig-carousel', format: 'Carousel', platform: 'Instagram',
    specs: [
      { label: 'Aspect Ratio', value: '1:1 (square) or 4:5 (portrait)' },
      { label: 'Resolution', value: '1080 x 1080 or 1080 x 1350 px' },
      { label: 'Slides', value: 'Up to 20 slides' },
      { label: 'File Types', value: 'JPG, PNG (images) or MP4 (video slides)' },
      { label: 'Caption Length', value: 'Up to 2,200 chars' },
      { label: 'Hashtags', value: '3-5 targeted' },
    ],
    tips: [
      'Slide 1 is the hook — make it scroll-stopping with a bold statement or question',
      'Use consistent visual style across all slides (fonts, colors, layout)',
      'End with a CTA slide: "Save this post" / "Share with a friend" / "Follow for more"',
      'Carousels get highest save rate — design for value and reference',
      'Optimal slide count: 7-10 slides for educational content',
      'Include your handle/logo subtly on each slide for shareability',
      'Mix image and video slides for engagement boost',
    ],
    seoNotes: 'Each slide can have alt text. Caption keywords matter for Explore page. Carousels have highest save-to-impression ratio, which signals quality to the algorithm.',
    lastUpdated: '2026-02',
  },
  {
    id: 'ig-static', format: 'Static Post', platform: 'Instagram',
    specs: [
      { label: 'Aspect Ratio', value: '1:1 (square) or 4:5 (portrait)' },
      { label: 'Resolution', value: '1080 x 1080 or 1080 x 1350 px' },
      { label: 'File Types', value: 'JPG, PNG' },
      { label: 'Max File Size', value: '8MB' },
      { label: 'Caption Length', value: 'Up to 2,200 chars' },
    ],
    tips: [
      'Use 4:5 portrait to take up more screen real estate in feed',
      'High contrast, bold typography performs best for text-based posts',
      'Single strong image > collage — keep it clean and focused',
      'Quotes, data points, and "swipe left" hooks drive engagement',
      'Include a face in the image when possible — face detection boosts reach',
    ],
    seoNotes: 'Alt text is critical for static posts. Use descriptive, keyword-rich captions. Location tagging boosts local discovery.',
    lastUpdated: '2026-02',
  },
  {
    id: 'ig-stories', format: 'Stories', platform: 'Instagram',
    specs: [
      { label: 'Aspect Ratio', value: '9:16 (vertical)' },
      { label: 'Resolution', value: '1080 x 1920 px' },
      { label: 'Duration', value: '15s per story (video)' },
      { label: 'Image Display', value: '5 seconds' },
      { label: 'Safe Zone', value: 'Top 14% and bottom 14% are UI overlap' },
    ],
    tips: [
      'Use interactive stickers (Poll, Quiz, Question) to boost engagement score',
      'Post 3-7 stories per day — too many causes drop-off',
      'First story is most important — make it eye-catching',
      'Use "Add Yours" sticker for UGC and viral potential',
      'Link stickers for driving traffic (available to all accounts)',
    ],
    seoNotes: 'Stories don\'t appear in search but boost account visibility. High story engagement = better feed reach for your posts.',
    lastUpdated: '2026-02',
  },
  {
    id: 'fb-post', format: 'Feed Post', platform: 'Facebook',
    specs: [
      { label: 'Image Size', value: '1200 x 630 px (link) or 1080 x 1080 (photo)' },
      { label: 'Video', value: '1280 x 720 min, up to 240 min' },
      { label: 'Caption Length', value: 'Up to 63,206 chars (but keep under 80 for best CTR)' },
      { label: 'Link Preview', value: '1200 x 628 px' },
    ],
    tips: [
      'Short posts (under 80 chars) get 66% more engagement',
      'Native video outperforms YouTube links 10x in reach',
      'Ask questions or use fill-in-the-blank to drive comments',
      'Post in groups for organic reach — group content gets priority',
      'Use Facebook Reels for younger audience reach',
    ],
    seoNotes: 'Facebook posts are indexed by Google. Use keyword-rich descriptions. Facebook search uses post text, page name, and metadata.',
    lastUpdated: '2026-02',
  },
  {
    id: 'tiktok-video', format: 'Video', platform: 'TikTok',
    specs: [
      { label: 'Aspect Ratio', value: '9:16 (vertical)' },
      { label: 'Resolution', value: '1080 x 1920 px' },
      { label: 'Duration', value: '15s – 10 min (sweet spot: 21-34s)' },
      { label: 'File Size', value: 'Max 287.6 MB (iOS), 72 MB (Android)' },
      { label: 'Caption Length', value: 'Up to 2,200 chars' },
    ],
    tips: [
      'First 1 second decides everything — start with action, not intro',
      'Use trending sounds — even as background, it boosts distribution',
      'Text hooks on screen: "You won\'t believe..." / "3 things about..."',
      'Stitch and Duet popular content for discoverability',
      'Post 1-4 times per day for maximum reach',
      'Raw/authentic > polished — TikTok rewards relatability',
    ],
    seoNotes: 'TikTok SEO is increasingly important — Gen Z uses TikTok as a search engine. Use keywords in caption, on-screen text, and hashtags. TikTok indexes spoken words via auto-captions.',
    lastUpdated: '2026-02',
  },
];

const SAMPLE_TRENDS: TrendEntry[] = [
  {
    id: '1', topic: 'AI-Generated Content Transparency', category: 'Regulation',
    platform: 'All', relevance: 'High',
    description: 'Meta and TikTok now require AI-generated content labels. Brands need to disclose AI use in content creation to maintain trust and comply with platform policies.',
    source: 'Meta Newsroom, TikTok Creator Portal',
    sourceUrl: 'https://about.fb.com/news/',
    dateSpotted: '2026-02', actionable: 'Add AI disclosure labels to all AI-assisted content. Update content guidelines.',
    importance: 5, mentions: 47,
  },
  {
    id: '2', topic: 'Long-Form Reels (3-5 min)', category: 'Format',
    platform: 'Instagram', relevance: 'High',
    description: 'Instagram is pushing longer Reels (3-5 min) with new monetization. Educational and tutorial content in this format is getting 2-3x the reach of short clips.',
    source: 'Instagram @Creators',
    sourceUrl: 'https://creators.instagram.com/',
    dateSpotted: '2026-02', actionable: 'Test 3-5 min educational Reels. Repurpose blog/guide content into mini-tutorials.',
    importance: 4, mentions: 32,
  },
  {
    id: '3', topic: 'Social Commerce via Live Shopping', category: 'E-commerce',
    platform: 'TikTok', relevance: 'Medium',
    description: 'TikTok Shop live streams are becoming major revenue drivers in APAC markets. Brands seeing 5-10x conversion rates vs. static product posts.',
    source: 'TikTok for Business',
    sourceUrl: 'https://www.tiktok.com/business/',
    dateSpotted: '2026-01', actionable: 'Explore TikTok Shop setup for applicable brands. Plan test live shopping event.',
    importance: 3, mentions: 18,
  },
  {
    id: '4', topic: 'Threads Integration with Fediverse', category: 'Platform',
    platform: 'Meta/Threads', relevance: 'Low',
    description: 'Threads now fully integrates with ActivityPub/Fediverse. Content posted on Threads can be discovered across Mastodon and other federated platforms.',
    source: 'Meta Engineering Blog',
    sourceUrl: 'https://engineering.fb.com/',
    dateSpotted: '2026-02', actionable: 'Monitor Threads growth. Consider cross-posting strategy if audience overlap exists.',
    importance: 2, mentions: 8,
  },
];

const IMPORTANCE_STARS: Record<number, string> = {
  1: 'Low Impact', 2: 'Minor', 3: 'Moderate', 4: 'Significant', 5: 'Critical',
};

const RELEVANCE_COLORS: Record<string, string> = {
  High: 'bg-red-500/20 text-red-400',
  Medium: 'bg-amber-500/20 text-amber-400',
  Low: 'bg-slate-700/50 text-slate-400',
};

const FORMAT_ICONS: Record<string, typeof Video> = {
  Reels: Video, Carousel: Layers, 'Static Post': Image, Stories: Smartphone,
  'Feed Post': FileText, Video: Video,
};

/* ── Component ──────────────────────────── */

export default function TrendResearchPage() {
  const { selectedBrand } = useBrandProject();
  const [tab, setTab] = useState<Tab>('trends');
  const [trends, setTrends] = useState<TrendEntry[]>(SAMPLE_TRENDS);

  // Load saved trends on brand change
  useEffect(() => {
    if (!selectedBrand) return;
    async function load() {
      try {
        const res = await fetch(`/api/social/trends/${selectedBrand!.id}`);
        if (res.ok) {
          const { data } = await res.json();
          if (data && data.length > 0) {
            const apiTrends: TrendEntry[] = data.map((r: Record<string, unknown>) => ({
              id: String(r.id),
              topic: String(r.trend_name || ''),
              category: String(r.category || 'Content'),
              platform: String(r.platforms || 'All'),
              relevance: (r.relevance_score as number) >= 4 ? 'High' : (r.relevance_score as number) >= 2 ? 'Medium' : 'Low',
              description: String(r.description || ''),
              source: 'Saved',
              dateSpotted: String(r.created_at || '').slice(0, 7),
              actionable: String(r.content_ideas || ''),
              importance: Number(r.relevance_score) || 3,
              mentions: 1,
            }));
            setTrends([...apiTrends, ...SAMPLE_TRENDS]);
          }
        }
      } catch { /* silent */ }
    }
    load();
  }, [selectedBrand?.id]);
  const [expandedTrend, setExpandedTrend] = useState<string | null>(null);
  const [expandedPractice, setExpandedPractice] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTrends = searchQuery
    ? trends.filter(t =>
        t.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.platform.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : trends;

  /* ── AI Research ─────────────────────── */

  const handleAiResearch = useCallback(async (topic: string) => {
    if (!selectedBrand) return;
    setGenerating(true);
    try {
      const res = await fetch('/api/social/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{
            role: 'user',
            content: `Research the latest social media trends for "${selectedBrand.name}" (topic: ${topic || 'general social media trends 2026'}).

Provide 3-4 trend entries as a JSON array:
[{
  "topic": "Trend name",
  "category": "Format|Platform|Regulation|E-commerce|Algorithm|Content",
  "platform": "Instagram|TikTok|Facebook|LinkedIn|All",
  "relevance": "High|Medium|Low",
  "description": "2-3 sentence description",
  "source": "Where this trend was identified",
  "dateSpotted": "2026-02",
  "actionable": "What to do about it"
}]

Focus on trends relevant to content creation, social media marketing, and brand engagement.
Return ONLY the JSON array.`,
          }],
          use_case_id: 'social-content-ops',
          brand_name: selectedBrand.name,
          current_module: 'Trend Research',
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const msg = data.message || '';
        try {
          const jsonMatch = msg.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]) as Partial<TrendEntry>[];
            const newTrends: TrendEntry[] = parsed.map((t, i) => ({
              id: `ai-${Date.now()}-${i}`,
              topic: t.topic || 'New Trend',
              category: t.category || 'Content',
              platform: t.platform || 'All',
              relevance: (t.relevance as TrendEntry['relevance']) || 'Medium',
              description: t.description || '',
              source: t.source || 'AI Research',
              sourceUrl: t.sourceUrl || '',
              dateSpotted: t.dateSpotted || '2026-02',
              actionable: t.actionable || '',
              importance: (t.importance as number) || 3,
              mentions: (t.mentions as number) || 1,
            }));
            setTrends(prev => [...newTrends, ...prev]);
            // Persist each new trend to the API
            if (selectedBrand) {
              for (const trend of newTrends) {
                try {
                  await fetch(`/api/social/trends/${selectedBrand.id}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      trendName: trend.topic,
                      category: trend.category,
                      description: trend.description,
                      platforms: trend.platform,
                      contentIdeas: trend.actionable,
                      relevanceScore: trend.importance,
                    }),
                  });
                } catch { /* silent */ }
              }
            }
          }
        } catch {
          console.log('AI response (non-JSON):', msg.slice(0, 500));
        }
      }
    } catch { /* silent */ }
    setGenerating(false);
  }, [selectedBrand]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-5 h-5 text-violet-400" />
            <h1 className="text-2xl font-bold text-white">Social Trend Research</h1>
          </div>
          <p className="text-sm text-slate-400">
            Shared knowledge base — trends, best practices, SEO, and format specs across all use cases
          </p>
        </div>
        <button
          disabled={!selectedBrand || generating}
          onClick={() => handleAiResearch(searchQuery)}
          className="px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-xs font-medium disabled:opacity-40 transition-colors flex items-center gap-1.5"
        >
          {generating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
          AI Research Trends
        </button>
      </div>

      {!selectedBrand && (
        <div className="flex items-center gap-3 px-4 py-3 bg-amber-900/20 border border-amber-700/30 rounded-xl">
          <AlertCircle className="w-4 h-4 text-amber-400" />
          <p className="text-xs text-amber-300">Select a brand to research trends specific to your industry.</p>
        </div>
      )}

      {/* Tab navigation */}
      <div className="flex gap-1">
        {([
          { key: 'trends', label: 'Trending Now', icon: TrendingUp },
          { key: 'best-practices', label: 'Format Best Practices', icon: BookOpen },
          { key: 'seo', label: 'SEO & Discovery', icon: Search },
        ] as const).map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                tab === t.key
                  ? 'bg-violet-600/20 text-violet-400 border border-violet-700/30'
                  : 'text-slate-400 hover:text-white border border-transparent'
              }`}
            >
              <Icon className="w-3 h-3" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* ═══ TRENDS TAB ═══════════════════════ */}
      {tab === 'trends' && (
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search trends by topic, category, or platform..."
              className="w-full bg-white/[0.02] border border-slate-700/30 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-violet-500/30"
            />
          </div>

          <div className="space-y-2">
            {filteredTrends.map(trend => {
              const isExpanded = expandedTrend === trend.id;
              return (
                <div key={trend.id} className="bg-slate-800/60 border border-slate-700/50 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setExpandedTrend(isExpanded ? null : trend.id)}
                    className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-white/[0.02] transition-colors"
                  >
                    <TrendingUp className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm text-white font-medium">{trend.topic}</span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${RELEVANCE_COLORS[trend.relevance]}`}>
                          {trend.relevance}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-violet-400/60">{trend.category}</span>
                        <span className="text-[10px] text-slate-600">•</span>
                        <span className="text-[10px] text-slate-500">{trend.platform}</span>
                        <span className="text-[10px] text-slate-600">•</span>
                        <span className="text-[10px] text-slate-600">{trend.dateSpotted}</span>
                      </div>
                    </div>
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-slate-500" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-500" />}
                  </button>
                  {isExpanded && (
                    <div className="border-t border-slate-700/30 px-4 py-4 space-y-3">
                      <p className="text-xs text-slate-300">{trend.description}</p>
                      <div className="bg-violet-500/5 border border-violet-700/20 rounded-lg p-3">
                        <label className="text-[10px] uppercase text-violet-400 mb-1 block font-medium">Actionable Insight</label>
                        <p className="text-xs text-slate-300">{trend.actionable}</p>
                      </div>
                        {/* Importance & Mentions */}
                      <div className="flex items-center gap-4 text-[10px]">
                        <div className="flex items-center gap-1">
                          <span className="text-slate-500">Importance:</span>
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map(i => (
                              <Star key={i} className={`w-3 h-3 ${i <= trend.importance ? 'text-amber-400 fill-amber-400' : 'text-slate-700'}`} />
                            ))}
                          </div>
                          <span className="text-slate-600 ml-1">{IMPORTANCE_STARS[trend.importance]}</span>
                        </div>
                        <div className="flex items-center gap-1 text-slate-500">
                          <Hash className="w-3 h-3" />
                          <span>{trend.mentions} mentions</span>
                        </div>
                      </div>

                      {/* Source link */}
                      <div className="flex items-center gap-2 text-[10px] text-slate-500">
                        <Globe className="w-3 h-3" />
                        <span>Source: </span>
                        {trend.sourceUrl ? (
                          <a
                            href={trend.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-violet-400 hover:text-violet-300 underline flex items-center gap-0.5"
                          >
                            {trend.source} <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        ) : (
                          <span>{trend.source}</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══ BEST PRACTICES TAB ═══════════════ */}
      {tab === 'best-practices' && (
        <div className="space-y-3">
          <p className="text-xs text-slate-500">
            Reference specs, tips, and guidelines for each content format — shared across all Social Content Ops modules.
          </p>
          {FORMAT_BEST_PRACTICES.map(bp => {
            const isExpanded = expandedPractice === bp.id;
            const FormatIcon = FORMAT_ICONS[bp.format] || FileText;
            return (
              <div key={bp.id} className="bg-slate-800/60 border border-slate-700/50 rounded-xl overflow-hidden">
                <button
                  onClick={() => setExpandedPractice(isExpanded ? null : bp.id)}
                  className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-white/[0.02] transition-colors"
                >
                  <FormatIcon className="w-4 h-4 text-violet-400 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-white font-medium">{bp.format}</span>
                      <span className="text-[10px] px-1.5 py-0.5 bg-white/[0.04] text-slate-500 rounded">{bp.platform}</span>
                    </div>
                    <span className="text-[10px] text-slate-600">{bp.specs.length} specs • {bp.tips.length} tips • Updated {bp.lastUpdated}</span>
                  </div>
                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-slate-500" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-500" />}
                </button>
                {isExpanded && (
                  <div className="border-t border-slate-700/30 px-4 py-4 space-y-4">
                    {/* Specs */}
                    <div>
                      <h4 className="text-[10px] uppercase text-violet-400 font-semibold mb-2 flex items-center gap-1">
                        <Maximize2 className="w-3 h-3" /> Technical Specs
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {bp.specs.map(s => (
                          <div key={s.label} className="bg-white/[0.02] rounded-lg p-2.5">
                            <p className="text-[9px] text-slate-500 uppercase mb-0.5">{s.label}</p>
                            <p className="text-xs text-white font-medium">{s.value}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Tips */}
                    <div>
                      <h4 className="text-[10px] uppercase text-emerald-400 font-semibold mb-2 flex items-center gap-1">
                        <Star className="w-3 h-3" /> Best Practices
                      </h4>
                      <ul className="space-y-1.5">
                        {bp.tips.map((tip, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                            <span className="text-emerald-400/60 mt-0.5 flex-shrink-0">•</span>
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* SEO */}
                    <div className="bg-blue-500/5 border border-blue-700/20 rounded-lg p-3">
                      <h4 className="text-[10px] uppercase text-blue-400 font-semibold mb-1 flex items-center gap-1">
                        <Search className="w-3 h-3" /> SEO & Discovery Notes
                      </h4>
                      <p className="text-xs text-slate-300">{bp.seoNotes}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ═══ SEO & DISCOVERY TAB ═════════════ */}
      {tab === 'seo' && (
        <div className="space-y-5">
          <p className="text-xs text-slate-500">
            Cross-platform SEO guidelines for social content discovery — keywords, hashtags, alt text, and algorithm signals.
          </p>

          {/* Platform SEO guides */}
          {[
            {
              platform: 'Instagram', color: 'pink',
              signals: [
                { signal: 'Caption keywords', importance: 'High', note: 'First 125 chars matter most. Include target keywords naturally.' },
                { signal: 'Hashtags', importance: 'Medium', note: '3-5 targeted > 30 generic. Mix niche + broader tags.' },
                { signal: 'Alt text', importance: 'Medium', note: 'Add descriptive alt text to every image/carousel slide.' },
                { signal: 'Saves & Shares', importance: 'High', note: 'Highest-weight engagement signals for algorithm. Design content worth saving.' },
                { signal: 'Reel completion rate', importance: 'High', note: 'Algorithm prioritizes videos watched to the end. Keep it tight.' },
                { signal: 'Location tags', importance: 'Low', note: 'Boosts local discovery. Use for location-specific content.' },
              ],
            },
            {
              platform: 'TikTok', color: 'purple',
              signals: [
                { signal: 'On-screen text', importance: 'High', note: 'TikTok OCR reads text overlays. Include keywords visually.' },
                { signal: 'Spoken words', importance: 'High', note: 'Auto-captions are indexed. Say your keywords out loud.' },
                { signal: 'Caption keywords', importance: 'High', note: 'TikTok search engine indexes captions. Write for search.' },
                { signal: 'Trending audio', importance: 'Medium', note: 'Using trending sounds boosts initial distribution.' },
                { signal: 'Watch time & loops', importance: 'High', note: 'Full watches and replays = algorithm gold.' },
                { signal: 'Comments (keyword-rich)', importance: 'Medium', note: 'Pin keyword-rich comments. Reply with follow-up questions.' },
              ],
            },
            {
              platform: 'Facebook', color: 'blue',
              signals: [
                { signal: 'Post text', importance: 'High', note: 'Google indexes FB posts. Write keyword-rich descriptions.' },
                { signal: 'Comments & shares', importance: 'High', note: 'Meaningful comments (not "nice!") are weighted higher.' },
                { signal: 'Group activity', importance: 'High', note: 'Group content gets priority in feed. Share to relevant groups.' },
                { signal: 'Native video', importance: 'Medium', note: 'Native uploads get 10x more reach than YouTube links.' },
                { signal: 'Link preview image', importance: 'Medium', note: 'Custom 1200x628 OG images improve CTR significantly.' },
              ],
            },
          ].map(p => {
            const colorMap: Record<string, { bg: string; text: string; border: string }> = {
              pink: { bg: 'bg-pink-500/5', text: 'text-pink-400', border: 'border-pink-700/20' },
              purple: { bg: 'bg-purple-500/5', text: 'text-purple-400', border: 'border-purple-700/20' },
              blue: { bg: 'bg-blue-500/5', text: 'text-blue-400', border: 'border-blue-700/20' },
            };
            const colors = colorMap[p.color];
            return (
              <div key={p.platform} className={`${colors.bg} border ${colors.border} rounded-xl p-5`}>
                <h3 className={`text-sm font-semibold ${colors.text} mb-3`}>{p.platform} SEO Signals</h3>
                <div className="space-y-2">
                  {p.signals.map(s => (
                    <div key={s.signal} className="flex items-start gap-3">
                      <div className="flex items-center gap-2 min-w-[160px]">
                        <span className={`text-[9px] px-1.5 py-0.5 rounded ${
                          s.importance === 'High' ? 'bg-red-500/20 text-red-400' :
                          s.importance === 'Medium' ? 'bg-amber-500/20 text-amber-400' :
                          'bg-slate-700/50 text-slate-400'
                        }`}>
                          {s.importance}
                        </span>
                        <span className="text-xs text-white font-medium">{s.signal}</span>
                      </div>
                      <p className="text-xs text-slate-400 flex-1">{s.note}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Knowledge Base note */}
      <div className="bg-white/[0.02] border border-slate-700/30 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-1">
          <BookOpen className="w-3.5 h-3.5 text-violet-400" />
          <h3 className="text-xs font-medium text-slate-400">Shared Knowledge Base</h3>
        </div>
        <p className="text-[10px] text-slate-500">
          This knowledge base is shared across all Social Content Ops modules. When creating Reels, Carousels, or any content,
          the AI chatbot references these specs and best practices automatically. Trend data informs strategy and calendar generation.
        </p>
      </div>
    </div>
  );
}
