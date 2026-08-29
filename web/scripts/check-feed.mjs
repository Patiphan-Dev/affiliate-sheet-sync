#!/usr/bin/env node
/**
 * Quick check that the Apps Script feed is reachable and shaped right.
 *   node scripts/check-feed.mjs "https://script.google.com/macros/s/XXX/exec"
 * Falls back to $FEED_URL when no arg is given.
 */
const url = (process.argv[2] || process.env.FEED_URL || '').replace(/\/$/, '');
if (!url) {
  console.error('usage: node scripts/check-feed.mjs <apps-script /exec url>');
  process.exit(1);
}

async function get(query) {
  const res = await fetch(url + query, { redirect: 'follow' });
  if (!res.ok) throw new Error(`${query} → HTTP ${res.status}`);
  return res.json();
}

try {
  const feed = await get('?page=feed&limit=1000');
  const items = feed.items ?? [];
  const withName = items.filter((i) => i.name).length;
  const withLink = items.filter((i) => i.link).length;
  const withPrice = items.filter((i) => i.price).length;
  const withImage = items.filter((i) => i.image).length;
  console.log(`feed OK — ${items.length} products`);
  console.log(`  name: ${withName}   link: ${withLink}   price: ${withPrice}   image: ${withImage}`);
  if (items[0]) console.log('  sample:', JSON.stringify(items[0], null, 1));

  const arts = await get('?page=articles');
  console.log(`articles OK — ${(arts.items ?? []).length} items`);

  if (withName === 0) {
    console.warn('\n⚠️  0 products have a name — re-sync the extension (old toRow left name/price blank).');
    process.exit(2);
  }
} catch (err) {
  console.error('feed check FAILED:', err.message);
  process.exit(1);
}
