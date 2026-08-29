# Affiliate Sheet Sync — Automation layer (Apps Script)

Runs **inside the Google Sheet** the extension writes to. No server. Does:

- keep a `content` row per product
- write Thai captions with Gemini
- auto-post to **your own Facebook Page** on a schedule
- expose a JSON **feed** + a gated **admin console**

The public **landing page** is separate: `../landing/index.html` — a standalone
static file you host anywhere (Vercel / Cloudflare Pages / Netlify / GitHub Pages).
It just `fetch()`es the feed URL below. Set `FEED_URL` at the top of that file to
your deployed web-app `/exec` URL.

FB *groups* stay assisted in the extension side panel — there is no safe way to automate those.

---

## 1. Add the files

Extension menu of the Sheet → **Extensions → Apps Script**. Create each file with the
same name and paste its contents:

| File | Type |
|---|---|
| `Config.gs` `SheetLib.gs` `Captions.gs` `FbPage.gs` `WebApp.gs` `Admin.gs` `Triggers.gs` | Script (`.gs`) |
| `Admin.html` | HTML |

## 2. Script properties

Project Settings (gear icon) → **Script properties** → add:

| Key | Value |
|---|---|
| `GEMINI_API_KEY` | from https://ai.google.dev (free tier is enough) |
| `GEMINI_MODEL` | optional, default `gemini-2.0-flash` |
| `FB_PAGE_ID` | numeric id of your Facebook Page |
| `FB_PAGE_TOKEN` | long-lived Page token — see step 3 |
| `POSTS_PER_RUN` | optional, default `3` |
| `ADMIN_KEY` | any long random string — the admin URL needs it |

## 3. Facebook Page token

1. https://developers.facebook.com → create an App (type *Business*).
2. Add product **Facebook Login**, then open **Graph API Explorer**.
3. Pick your App, permissions: `pages_show_list`, `pages_read_engagement`, `pages_manage_posts`.
   Generate a **User** token and authorize.
4. Exchange it for a long-lived user token:
   `GET /oauth/access_token?grant_type=fb_exchange_token&client_id=APP_ID&client_secret=APP_SECRET&fb_exchange_token=SHORT_TOKEN`
5. Call `GET /me/accounts` with that token → copy the target Page's `access_token`
   (this Page token does not expire) and its `id`. Put them in `FB_PAGE_TOKEN` / `FB_PAGE_ID`.
6. While the App is in *Development* mode only Page admins can post — fine for one seller.
   Going public for other users needs App Review for `pages_manage_posts`.

## 4. First run

Editor → run **`runOnceNow`** once, approve the OAuth scopes, check **Executions** for errors.
Then run **`installTriggers`** → schedules: `syncContent` + `generateCaptions` hourly,
`postNextToPage` every 3h. `removeTriggers` stops everything.

## 5. Deploy the web app

**Deploy → New deployment → Web app**
- Execute as: **Me**
- Who has access: **Anyone**

URLs from the deployment:

| What | URL |
|---|---|
| JSON feed | `<WEB_APP_URL>` or `<WEB_APP_URL>?page=feed&limit=200` |
| Admin console | `<WEB_APP_URL>?page=admin&key=<ADMIN_KEY>` |

Re-deploy (Manage deployments → edit → new version) after editing any file.

## 6. Landing page

Edit `../landing/index.html` → set `FEED_URL` to `<WEB_APP_URL>`.
Then host the `landing/` folder:

- **Cloudflare Pages / Netlify / Vercel** — drag-drop the folder, or connect the repo (root = `landing/`).
- **GitHub Pages** — push `landing/` and point Pages at it.
- Local test — `npx serve landing` then open the shown URL (opening `index.html` as a
  `file://` also works, only the feed fetch needs to reach the internet).

Add a custom domain on whichever host. No build step, no framework.

---

## Data model

`content` tab (created automatically, owned by this layer — the extension never touches it):

| col | meaning |
|---|---|
| `item_id` `platform` | join key back to `shopee_products` / `lazada_products` |
| `caption` | generated or hand-edited text |
| `status` | `''` new → `generated` → `posted` |
| `caption_at` `posted_at` `fb_post_id` | audit |
| `hidden` | `TRUE` = excluded from showcase + auto-post |

## Admin console does

- edit / regenerate a caption, save it
- hide/show a product (affects showcase + auto-post)
- **โพสต์เลย** — post one item to the Page now
- run any scheduled job on demand
