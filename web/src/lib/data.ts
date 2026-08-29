import 'server-only';
import type { Article, Product } from '@/types';
import { categoryFor } from './categories';
import { slugify, normalizeSlug } from './slug';
import mockFeed from '@/data/mock-feed.json';
import seedArticles from '@/data/seed-articles.json';

const FEED_URL = process.env.FEED_URL?.replace(/\/$/, '') ?? '';
const REVALIDATE = 60 * 60; // rebuild pages against the Sheet at most hourly

interface RawProduct {
  platform?: string;
  id?: string | number;
  name?: string;
  price?: number | null;
  original_price?: number | null;
  list_price?: number | null;
  discount?: number | null;
  commission?: number | null;
  rating?: number | null;
  sold?: number | null;
  shop?: string;
  image?: string;
  product_url?: string;
  link?: string;
  caption?: string;
  updated_at?: string;
}

const HOT_COMMISSION = 12; // % — at/above this a product gets a "ขายดี" flag
const NEW_WINDOW_MS = 3 * 24 * 60 * 60 * 1000;

async function fetchFeed<T>(query: string, fallback: T): Promise<T> {
  if (!FEED_URL) return fallback;
  try {
    const res = await fetch(`${FEED_URL}${query}`, { next: { revalidate: REVALIDATE } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as T;
  } catch (err) {
    console.warn(`[data] feed ${query} failed (${(err as Error).message}) — using bundled fallback`);
    return fallback;
  }
}

function num(v: unknown): number | null {
  const n = typeof v === 'number' ? v : parseFloat(String(v ?? ''));
  return Number.isFinite(n) && n > 0 ? n : null;
}

function normalizeProduct(r: RawProduct): Product | null {
  const id = String(r.id ?? '').trim();
  const name = String(r.name ?? '').trim();
  const link = String(r.link ?? '').trim();
  if (!id || !name || !link) return null;

  const platform = r.platform === 'lazada' ? 'lazada' : 'shopee';
  const price = num(r.price);
  const originalPrice = num(r.original_price) ?? num(r.list_price);
  const commission = num(r.commission);
  const updatedAt = String(r.updated_at ?? '').trim();

  const discountPercent =
    num(r.discount) ??
    (price != null && originalPrice != null && originalPrice > price
      ? Math.round((1 - price / originalPrice) * 100)
      : 0);

  const updatedMs = updatedAt ? Date.parse(updatedAt) : NaN;
  const isNew = Number.isFinite(updatedMs) && Date.now() - updatedMs < NEW_WINDOW_MS;

  return {
    platform,
    id,
    slug: slugify(name, id),
    name,
    price,
    originalPrice: originalPrice && originalPrice > (price ?? 0) ? originalPrice : null,
    discountPercent,
    commission,
    rating: num(r.rating),
    sold: num(r.sold),
    shop: String(r.shop ?? '').trim(),
    hot: (commission ?? 0) >= HOT_COMMISSION || discountPercent >= 40,
    isNew,
    image: String(r.image ?? '').trim(),
    link,
    caption: String(r.caption ?? '').trim(),
    categorySlug: categoryFor(name).slug,
    updatedAt,
  };
}

let productCache: Promise<Product[]> | null = null;

export function getProducts(): Promise<Product[]> {
  if (!productCache) {
    productCache = fetchFeed<{ items?: RawProduct[] }>(
      '?page=feed&limit=1000',
      mockFeed as unknown as { items: RawProduct[] },
    ).then((data) => {
      const seen = new Set<string>();
      const out: Product[] = [];
      for (const raw of data.items ?? []) {
        const p = normalizeProduct(raw);
        if (!p || seen.has(p.slug)) continue;
        seen.add(p.slug);
        out.push(p);
      }
      return out.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    });
  }
  return productCache;
}

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  const want = normalizeSlug(slug);
  return (await getProducts()).find((p) => p.slug === want);
}

let articleCache: Promise<Article[]> | null = null;

/**
 * Bundled seed guides ship with the site (evergreen, not product-specific).
 * Feed articles from the Sheet are merged on top and win on slug collision.
 */
export function getArticles(): Promise<Article[]> {
  if (!articleCache) {
    const seed = (seedArticles as unknown as { items: Article[] }).items;
    articleCache = fetchFeed<{ items?: Article[] }>('?page=articles', { items: [] }).then((data) => {
      const bySlug = new Map<string, Article>();
      for (const a of seed) bySlug.set(a.slug, a);
      for (const a of data.items ?? []) if (a?.slug && a.title && a.bodyHtml) bySlug.set(a.slug, a);
      return [...bySlug.values()];
    });
  }
  return articleCache;
}

export async function getReviewFor(productId: string): Promise<Article | undefined> {
  return (await getArticles()).find((a) => a.kind === 'review' && a.refId === productId);
}

export async function getGuides(): Promise<Article[]> {
  return (await getArticles()).filter((a) => a.kind === 'guide');
}

export async function getGuideBySlug(slug: string): Promise<Article | undefined> {
  const want = normalizeSlug(slug);
  return (await getGuides()).find((a) => a.slug === want);
}
