import type { MetadataRoute } from 'next';
import { getProducts, getGuides } from '@/lib/data';
import { CATEGORIES } from '@/lib/categories';
import { SITE, absoluteUrl } from '@/lib/site';
import { guideImage } from '@/lib/guide-images';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, guides] = await Promise.all([getProducts(), getGuides()]);
  const now = new Date();

  const staticUrls: MetadataRoute.Sitemap = [
    { url: `${SITE.url}/`, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE.url}/deals`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE.url}/guides`, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${SITE.url}/about`, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${SITE.url}/disclosure`, changeFrequency: 'yearly', priority: 0.2 },
  ];

  const categoryUrls: MetadataRoute.Sitemap = CATEGORIES.map((c) => ({
    url: `${SITE.url}/category/${c.slug}`,
    images: [absoluteUrl(`/cat/${c.slug}.jpg`)],
    changeFrequency: 'daily',
    priority: 0.8,
  }));

  const productUrls: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${SITE.url}/gear/${p.slug}`,
    lastModified: p.updatedAt ? new Date(p.updatedAt) : now,
    ...(p.image ? { images: [p.image] } : {}),
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  const guideUrls: MetadataRoute.Sitemap = guides.map((g) => {
    const img = guideImage(g.slug, g.refId);
    return {
      url: `${SITE.url}/guides/${g.slug}`,
      ...(img ? { images: [absoluteUrl(img)] } : {}),
      lastModified: g.updatedAt ? new Date(g.updatedAt) : now,
      changeFrequency: 'monthly',
      priority: 0.6,
    };
  });

  return [...staticUrls, ...categoryUrls, ...productUrls, ...guideUrls];
}
