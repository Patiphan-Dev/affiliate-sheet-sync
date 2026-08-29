# แคมป์เกียร์ — web

Next.js (App Router, SSG) site that renders camping products + AI articles from the
Google Sheet, via the Apps Script feed. Built for SEO / AEO / GEO.

## Run locally

```bash
cd web
npm install
cp .env.example .env      # optional — leave FEED_URL empty to use mock data
npm run dev                # http://localhost:3000
npm run build && npm start # production build
```

With `FEED_URL` empty the site builds from `src/data/mock-*.json` so you can work offline.

## Wire to the real Sheet

Set in `.env` (local) and in Vercel → Project → Settings → Environment Variables:

| var | value |
|---|---|
| `FEED_URL` | Apps Script web-app URL ending `/exec` |
| `NEXT_PUBLIC_SITE_URL` | the site's public origin, e.g. `https://campgear.example.com` (no trailing slash) |

The feed must answer:
- `GET {FEED_URL}?page=feed&limit=1000` → `{ items: Product[] }` (already implemented in `apps-script/WebApp.gs`)
- `GET {FEED_URL}?page=articles` → `{ items: Article[] }` (add an `articles` case + tab — TODO in Apps Script)

Shapes: see `src/types/index.ts`.

## Deploy (Vercel)

1. Push this folder's repo to GitHub.
2. Vercel → New Project → import the repo → **Root Directory = `web`**.
3. Add the env vars above → Deploy.
4. Content refreshes on its own: every page has `revalidate = 3600` (ISR). To force
   an immediate rebuild after editing the Sheet, add a Vercel **Deploy Hook** and
   have the Apps Script `postNextToPage`/admin ping it, or trigger from the dashboard.

## Pages

| route | what |
|---|---|
| `/` | hero + latest products + guides |
| `/category/<slug>` | one camping category + intro + FAQ + filtered grid |
| `/gear/<slug>` | product + AI review + comparison + related + Product/Review/FAQ JSON-LD |
| `/guides` , `/guides/<slug>` | buying guides (Article + FAQ JSON-LD) |
| `/disclosure` | affiliate disclosure (E-E-A-T) |
| `/sitemap.xml` `/robots.txt` `/llms.txt` `/feed.xml` | crawler + AI-search plumbing |

Categories/taxonomy live in `src/lib/categories.ts` — edit keywords there to re-bucket products.
