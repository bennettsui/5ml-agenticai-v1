import { MetadataRoute } from 'next';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://radiancehk.com';

  return [
    // Homepage
    {
      url: `${baseUrl}/vibe-demo/radiance`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${baseUrl}/vibe-demo/radiance/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
    },

    // Services
    {
      url: `${baseUrl}/vibe-demo/radiance/services/public-relations`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/vibe-demo/radiance/services/events`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/vibe-demo/radiance/services/social-content`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/vibe-demo/radiance/services/kol-influencer`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/vibe-demo/radiance/services/creative-production`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },

    // Case Studies
    {
      url: `${baseUrl}/vibe-demo/radiance/case-studies`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.95,
    },
    {
      url: `${baseUrl}/vibe-demo/radiance/case-studies/lung-fu-shan`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/vibe-demo/radiance/case-studies/her-own-words-sport`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/vibe-demo/radiance/case-studies/filorga`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/vibe-demo/radiance/case-studies/daikin`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/vibe-demo/radiance/case-studies/gp-batteries`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/vibe-demo/radiance/case-studies/venice-biennale-hk`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/vibe-demo/radiance/case-studies/chinese-culture-exhibition`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/vibe-demo/radiance/case-studies/richmond-fellowship`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },

    // Blog
    {
      url: `${baseUrl}/vibe-demo/radiance/blog`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/vibe-demo/radiance/blog/earned-media-strategy`,
      lastModified: new Date('2026-02-18'),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/vibe-demo/radiance/blog/integrated-campaigns`,
      lastModified: new Date('2026-02-15'),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/vibe-demo/radiance/blog/product-launch-pr`,
      lastModified: new Date('2026-02-12'),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/vibe-demo/radiance/blog/event-media-strategy`,
      lastModified: new Date('2026-02-10'),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/vibe-demo/radiance/blog/thought-leadership`,
      lastModified: new Date('2026-02-08'),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/vibe-demo/radiance/blog/ngos-reputation`,
      lastModified: new Date('2026-02-05'),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/vibe-demo/radiance/blog/cultural-pr`,
      lastModified: new Date('2026-02-01'),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/vibe-demo/radiance/blog/social-media-strategy`,
      lastModified: new Date('2026-01-28'),
      changeFrequency: 'monthly',
      priority: 0.7,
    },

    // Contact & Lead Gen
    {
      url: `${baseUrl}/vibe-demo/radiance/contact`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/vibe-demo/radiance/lead-gen`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
  ];
}
