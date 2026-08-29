/**
 * content-fb.js — FB Groups content script for combined panel extension
 */
(function () {
  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg.type === 'SCAN_NOW') {
      // Auto-scroll to trigger lazy-load, then collect after content settles
      scanWithScroll().then(groups => {
        if (groups.length === 0 && location.pathname.startsWith('/groups/')) {
          const h1 = document.querySelector('h1');
          const name = h1?.innerText?.trim() || document.title.replace(/ \| Facebook$/, '').trim();
          if (name) groups.push({ name, url: location.href });
        }
        sendResponse({ groups });
      });
      return true; // async
    }
  });

  async function scanWithScroll() {
    const isListPage = location.pathname === '/groups/' ||
      location.pathname.startsWith('/groups/feed') ||
      location.pathname.startsWith('/groups/joins') ||
      location.pathname.startsWith('/groups/discover');

    if (!isListPage) return collectGroupLinks();

    // Scroll down in steps to trigger FB lazy-load, collect after each step
    const seen = new Map(); // url → name
    const STEPS = 8, STEP_PX = 600, DELAY_MS = 700;

    for (let i = 0; i < STEPS; i++) {
      collectGroupLinks().forEach(g => { if (!seen.has(g.url)) seen.set(g.url, g.name); });
      window.scrollBy({ top: STEP_PX, behavior: 'smooth' });
      await new Promise(r => setTimeout(r, DELAY_MS));
    }
    // Final collect after last scroll settles
    collectGroupLinks().forEach(g => { if (!seen.has(g.url)) seen.set(g.url, g.name); });

    return [...seen.entries()].map(([url, name]) => ({ url, name }));
  }

  function isListPage(p) {
    return p === '/groups/' || p.startsWith('/groups/feed') || p.startsWith('/groups/joins') || p.startsWith('/groups/discover');
  }

  // Reject timestamps ("3 ชั่วโมงที่แล้ว"), member counts, button labels — FB packs
  // these next to the group link and the old "largest span" heuristic grabbed them.
  function isValidGroupName(t) {
    if (!t || t.length < 3 || t.length > 150) return false;
    if (/(ที่แล้ว|เมื่อวาน|\bago\b|ชั่วโมง|นาที|วินาที|โพสต์ล่าสุด|สมาชิก|\bmembers?\b|ดูกลุ่ม|เข้าร่วม|จัดการกลุ่ม|เชิญเพื่อน)/i.test(t)) return false;
    if (/^\s*ใหม่\s*$/.test(t)) return false;                       // "ใหม่" badge
    if (/^\d+\s*(วัน|ชม\.?|ชั่วโมง|นาที|น\.|สัปดาห์|เดือน|ปี|[dhmwy])\b/i.test(t)) return false; // bare relative time
    return true;
  }

  function collectGroupLinks() {
    const byId = new Map(); // gid → best group-name candidate

    document.querySelectorAll('a[href*="/groups/"]').forEach(a => {
      // Only the group-NAME link: href ends at /groups/<numericId>/ (or ?/#/end),
      // NOT /groups/<id>/posts/… (the timestamp link) or vanity /groups/<slug>.
      const m = a.href.match(/\/groups\/(\d+)(?:\/)?(?:[?#]|$)/);
      if (!m) return;
      const gid = m[1];

      const text = a.innerText?.trim();
      if (!isValidGroupName(text)) return;

      // Keep the longest valid name seen for this gid (real names beat truncations).
      const prev = byId.get(gid);
      if (!prev || text.length > prev.length) byId.set(gid, text);
    });

    return [...byId.entries()].map(([gid, name]) => ({
      name,
      url: `https://www.facebook.com/groups/${gid}/`,
    }));
  }

  function run() {
    const p = location.pathname;
    if (isListPage(p)) {
      let attempts = 0;
      const iv = setInterval(() => {
        const groups = collectGroupLinks();
        attempts++;
        if (groups.length > 0 || attempts >= 6) {
          clearInterval(iv);
          if (groups.length) chrome.runtime.sendMessage({ type: 'FB_GROUP_URLS_CAPTURED', groups });
        } else window.scrollBy(0, 300);
      }, 1200);
    } else if (p.startsWith('/groups/')) {
      const tryCapture = (n) => {
        if (n <= 0) return;
        const h1 = document.querySelector('h1');
        const name = h1?.innerText?.trim() || document.title.replace(/ \| Facebook$/, '').trim();
        if (name?.length >= 3) {
          chrome.runtime.sendMessage({ type: 'FB_GROUP_URLS_CAPTURED', groups: [{ name, url: location.href }] });
        } else setTimeout(() => tryCapture(n - 1), 800);
      };
      tryCapture(8);
    }
  }

  run();
  let lastUrl = location.href;
  new MutationObserver(() => {
    if (location.href === lastUrl) return;
    lastUrl = location.href;
    setTimeout(run, 500);
  }).observe(document.body, { subtree: true, childList: true });
})();
