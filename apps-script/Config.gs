/**
 * Config.gs — script properties + constants for the Affiliate Sheet Sync automation.
 *
 * Set values in: Apps Script editor → Project Settings → Script properties
 *   GEMINI_API_KEY   ai.google.dev key (free tier is fine)
 *   GEMINI_MODEL     optional, default gemini-2.0-flash
 *   FB_PAGE_ID       numeric id of YOUR Facebook Page
 *   FB_PAGE_TOKEN    long-lived Page access token (pages_manage_posts)
 *   POSTS_PER_RUN    optional, default 3
 */

const PROP = PropertiesService.getScriptProperties();

const CFG = {
  geminiKey:   () => PROP.getProperty('GEMINI_API_KEY') || '',
  geminiModel: () => PROP.getProperty('GEMINI_MODEL') || 'gemini-2.0-flash',
  fbPageId:    () => PROP.getProperty('FB_PAGE_ID') || '',
  fbPageToken: () => PROP.getProperty('FB_PAGE_TOKEN') || '',
  postsPerRun: () => Number(PROP.getProperty('POSTS_PER_RUN') || 3),
  adminKey:    () => PROP.getProperty('ADMIN_KEY') || '', // gate for ?page=admin
};

// Tabs the extension owns (read-only from here) + the one this layer owns.
const T = {
  shopee:  'shopee_products',
  lazada:  'lazada_products',
  content: 'content', // owned by the automation layer; created on first run
};

// content.status:  '' (new) → 'generated' → 'posted'    content.hidden: '' | 'TRUE'
const CONTENT_COLS = ['item_id', 'platform', 'caption', 'status', 'caption_at', 'posted_at', 'fb_post_id', 'hidden'];

const CAPTION_PROMPT = [
  'เขียนแคปชั่นขายของภาษาไทยสำหรับโพสต์ Facebook 1 โพสต์',
  'โทน: เป็นกันเอง กระตุ้นให้กดซื้อ ไม่โอเวอร์ ไม่ใช้ศัพท์การตลาดเยอะ',
  'โครงสร้าง: hook 1 บรรทัด • จุดเด่น 2-3 bullet • ราคา (ถ้ามี) • CTA • hashtag 3-5 อัน',
  'ห้ามแต่งข้อมูลที่ไม่ได้ให้มา • ห้ามใส่ราคาถ้าไม่มีข้อมูลราคา • ตอบเฉพาะแคปชั่น',
].join('\n');
