import type { MetadataRoute } from 'next';
import { SITE } from '@/lib/site';

/**
 * Allow everything, including the AI crawlers — being indexable by answer
 * engines (ChatGPT, Perplexity, Google AI Overviews, Gemini) is the point.
 */
export default function robots(): MetadataRoute.Robots {
  const aiBots = ['GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-Web', 'PerplexityBot', 'Google-Extended', 'CCBot', 'Applebot-Extended'];
  return {
    rules: [
      { userAgent: '*', allow: '/' },
      ...aiBots.map((ua) => ({ userAgent: ua, allow: '/' })),
    ],
    sitemap: `${SITE.url}/sitemap.xml`,
    host: SITE.url,
  };
}
