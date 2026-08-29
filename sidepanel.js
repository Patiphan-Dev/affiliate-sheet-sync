/**
 * sidepanel.js — UI logic for Affiliate Sheet Sync
 */

const $ = id => document.getElementById(id);

// Products the user selected via the link download that are not confirmed saved
// yet (a failed POST), per platform. Kept here so the tips can nudge a retry.
const pendingRetry = { shopee: 0, lazada: 0 };

// ─── Tab switching ────────────────────────────────────────────────────────────
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    tab.classList.add('active');
    $(`sec-${tab.dataset.tab}`).classList.add('active');
  });
});

// ─── Settings drawer ──────────────────────────────────────────────────────────
$('gearBtn').addEventListener('click', () => {
  $('settingsDrawer').classList.toggle('open');
});

chrome.storage.sync.get(['spreadsheetUrl'], d => {
  $('spreadsheetUrl').value = d.spreadsheetUrl ?? '';
});

$('saveBtn').addEventListener('click', async () => {
  await chrome.storage.sync.set({ spreadsheetUrl: $('spreadsheetUrl').value.trim() });
  $('saveMsg').textContent = '✅ บันทึกแล้ว';
  setTimeout(() => { $('saveMsg').textContent = ''; }, 2000);
  checkConnection();
});

$('connectBtn').addEventListener('click', () =>
  withLoading($('connectBtn'), '⏳ เชื่อมต่อ...', async () => {
    const url = $('spreadsheetUrl').value.trim();
    if (url) await chrome.storage.sync.set({ spreadsheetUrl: url });
    const r = await chrome.runtime.sendMessage({ type: 'CONNECT_SHEET' });
    $('saveMsg').textContent = r?.ok ? '✅ เชื่อมต่อแล้ว — สร้าง tab ครบ' : `❌ ${r?.error ?? 'เชื่อมต่อไม่สำเร็จ'}`;
    await checkConnection();
  })
);

$('disconnectBtn').addEventListener('click', () =>
  withLoading($('disconnectBtn'), '⏳...', async () => {
    await chrome.runtime.sendMessage({ type: 'DISCONNECT_SHEET' });
    $('saveMsg').textContent = 'ออกจากระบบ Google แล้ว';
    await checkConnection();
  })
);

// ─── Connection check ─────────────────────────────────────────────────────────
async function checkConnection() {
  const res = await chrome.runtime.sendMessage({ type: 'PING' });
  const dot  = $('connDot');
  const lbl  = $('connLabel');
  if (res?.ok) {
    dot.className = 'conn-dot ok';
    lbl.textContent = 'เชื่อมต่อ Sheet แล้ว';
    setBanner('shopee', 'ok', '🟢 เชื่อมต่อ Google Sheet แล้ว — เลือกสินค้าใน Shopee Affiliate แล้วกด "รับลิงก์" เพื่อบันทึก');
    setBanner('lazada',  'ok', '🟢 เชื่อมต่อ Google Sheet แล้ว — เลือกสินค้าใน Lazada AdSense แล้วกด Get Link เพื่อบันทึก');
    setBanner('fb',      'ok', '🟢 เชื่อมต่อ Google Sheet แล้ว — เปิดหน้ากลุ่ม FB แล้วกด Scan');
  } else {
    dot.className = 'conn-dot err';
    lbl.textContent = 'ไม่ได้เชื่อมต่อ';
    const msg = (!res?.reason || res.reason === 'no-sheet')
      ? '🔴 ยังไม่ได้เชื่อมต่อ Google Sheet — วางลิงก์ Sheet แล้วกด "เชื่อมต่อ Google" ใน ⚙️'
      : `🔴 เปิด Sheet ไม่ได้ — ${res.reason.includes('403') || res.reason.includes('PERMISSION')
          ? 'บัญชี Google ที่เชื่อมต่อไม่มีสิทธิ์แก้ไข Sheet นี้ (แชร์สิทธิ์ Editor หรือเปลี่ยนลิงก์)'
          : res.reason.slice(0, 160)}`;
    setBanner('shopee', 'err', msg);
    setBanner('lazada',  'err', msg);
    setBanner('fb',      'err', msg);
  }
}

function setBanner(platform, type, text) {
  const el = $(`${platform}-banner`);
  el.className = `status-banner ${type}`;
  const icons = { ok:'🟢', warn:'⏳', err:'🔴' };
  el.innerHTML = `<span class="status-icon">${icons[type]}</span><span id="${platform}-banner-text">${text}</span>`;
}

// ─── Stats loading ────────────────────────────────────────────────────────────
async function loadStats() {
  const stats = await chrome.runtime.sendMessage({ type: 'GET_ALL_STATS' });
  if (!stats) return;

  // "buffered" = seen while browsing but deliberately not saved yet
  for (const platform of ['shopee', 'lazada']) {
    $(`${platform}-synced`).textContent  = (stats[platform].synced ?? 0).toLocaleString();
    $(`${platform}-pending`).textContent = (stats[platform].buffered ?? 0).toLocaleString();
    pendingRetry[platform] = stats[platform].pending ?? 0;
  }

  // FB
  $('fb-backfilled').textContent = stats.fb.backfilled.toLocaleString();

  renderLog(stats.log);
}

async function loadDbStats() {
  const db = await chrome.runtime.sendMessage({ type: 'FETCH_DB_STATS' });
  if (!db) return;

  // Shopee DB stats
  if (db.shopee) {
    $('shopee-db').textContent    = db.shopee.total?.toLocaleString() ?? '-';
    $('shopee-links').textContent = db.shopee.withShortLink?.toLocaleString() ?? '-';
    const pct = db.shopee.total ? Math.round((db.shopee.withShortLink / db.shopee.total) * 100) : 0;
    $('shopee-pct').textContent = `${pct}%`;
    $('shopee-prog').style.width = `${pct}%`;
    renderShopeeeTips(db.shopee, pct);
  }

  // Lazada DB stats
  if (db.lazada) {
    $('lazada-db').textContent    = db.lazada.total?.toLocaleString() ?? '-';
    $('lazada-links').textContent = db.lazada.withLink?.toLocaleString() ?? '-';
    renderLazadaTips(db.lazada);
  }

  // FB DB stats
  if (db.fb) {
    const total   = db.fb.total ?? 0;
    const hasUrl  = db.fb.withUrl ?? 0;
    const missing = total - hasUrl;
    const pct     = total ? Math.round((hasUrl / total) * 100) : 0;
    $('fb-total').textContent   = total.toLocaleString();
    $('fb-has-url').textContent = hasUrl.toLocaleString();
    $('fb-missing').textContent = missing.toLocaleString();
    $('fb-pct').textContent     = `${pct}%`;
    $('fb-prog').style.width    = `${pct}%`;
    renderFbTips(db.fb, pct);
  }
}

// ─── Tips / Recommendations ───────────────────────────────────────────────────
function retryTip(platform) {
  const n = pendingRetry[platform];
  return n > 0 ? [`มี ${n} สินค้าที่เลือกไว้แต่ส่งไม่สำเร็จ — กด "ส่งที่ค้างอีกครั้ง"`] : [];
}

function renderShopeeeTips(db, pct) {
  const tips = retryTip('shopee');
  if (pct < 50)       tips.push(`Short link coverage ต่ำ (${pct}%) — ติ๊กเลือกสินค้าแล้วกด "รับลิงก์" ใน Shopee Affiliate`);
  if (db.total === 0) tips.push('ยังไม่มีสินค้าใน DB — เลือกสินค้าใน Shopee Affiliate แล้วกดรับลิงก์');
  showTips('shopee', tips);
}

function renderLazadaTips(db) {
  const tips = retryTip('lazada');
  if (db.total === 0) tips.push('ยังไม่มีสินค้า Lazada — เลือกสินค้าใน Lazada AdSense แล้วกด Get Link');
  if (db.withLink === 0 && db.total > 0) tips.push('ยังไม่มี tracking link — กด Get Link ให้สินค้าที่เลือก');
  showTips('lazada', tips);
}

function renderFbTips(db, pct) {
  const tips = [];
  const missing = (db.total ?? 0) - (db.withUrl ?? 0);
  if (pct < 30)     tips.push(`URL coverage ต่ำมาก — เปิด facebook.com/groups/joins/ แล้วกด "Scan หน้านี้"`);
  else if (pct < 80)tips.push(`ยังขาด URL อีก ${missing} กลุ่ม — scroll หน้า FB groups ให้โหลดครบแล้วกด Scan อีกครั้ง`);
  if (db.total === 0)tips.push('ยังไม่มีกลุ่มใน DB — ตรวจสอบ migration 0013');
  showTips('fb', tips);
}

function showTips(platform, tips) {
  const el = $(`${platform}-tips`);
  const body = $(`${platform}-tips-body`);
  if (tips.length === 0) { el.style.display = 'none'; return; }
  el.style.display = 'block';
  body.innerHTML = tips.map(t => `<div class="tip">${t}</div>`).join('');
}

// ─── Activity log ─────────────────────────────────────────────────────────────
function renderLog(log) {
  const all  = log ?? [];
  const fmt  = at => new Date(at).toLocaleTimeString('th-TH', { hour:'2-digit', minute:'2-digit' });

  const shopeeItems = all.filter(l => l.text.includes('Shopee') || l.text.includes('🔗') && l.text.includes('Shopee'));
  const lazadaItems = all.filter(l => l.text.includes('Lazada'));
  const fbItems     = all.filter(l => l.text.includes('FB') || l.text.includes('📘'));

  const renderItems = (items, containerId) => {
    const el = $(containerId);
    if (!items.length) { el.innerHTML = '<span style="color:#94a3b8;font-size:11px">ยังไม่มีกิจกรรม</span>'; return; }
    el.innerHTML = items.slice(0, 15).map(l =>
      `<div class="log-item"><span class="log-time">${fmt(l.at)}</span><span class="log-text">${l.text}</span></div>`
    ).join('');
  };

  // Show all-platform logs in each tab (filtered by relevance)
  renderItems(all.filter(l => !l.text.includes('Lazada') && !l.text.includes('FB') && !l.text.includes('📘')), 'shopee-log');
  renderItems(all.filter(l => l.text.includes('Lazada')), 'lazada-log');
  renderItems(all.filter(l => l.text.includes('FB') || l.text.includes('📘') || l.text.includes('กลุ่ม')), 'fb-log');
}

// ─── Buttons ──────────────────────────────────────────────────────────────────
async function withLoading(btn, label, fn) {
  btn.disabled = true;
  const orig = btn.textContent;
  btn.textContent = label;
  try { await fn(); } finally {
    btn.disabled = false;
    btn.textContent = orig;
  }
}

$('shopee-flush').addEventListener('click', () =>
  withLoading($('shopee-flush'), '⏳ กำลังส่ง...', async () => {
    const r = await chrome.runtime.sendMessage({ type: 'FLUSH_SHOPEE' });
    setBanner('shopee', 'ok', r?.sent
      ? `✅ บันทึกเพิ่ม ${r.sent} สินค้า`
      : 'ไม่มีรายการค้าง — บันทึกจะเกิดตอนกด "รับลิงก์" ใน Shopee Affiliate');
    await loadStats();
  })
);

$('shopee-reset').addEventListener('click', () =>
  withLoading($('shopee-reset'), '⏳...', async () => {
    await chrome.runtime.sendMessage({ type: 'RESET_SHOPEE' });
    await loadStats();
    setBanner('shopee', 'ok', '✅ ล้างสินค้าที่เก็บไว้ในเครื่องแล้ว (ไม่กระทบข้อมูลใน DB)');
  })
);

$('shopee-refresh-db').addEventListener('click', () =>
  withLoading($('shopee-refresh-db'), '⏳ โหลด...', loadDbStats)
);

$('lazada-flush').addEventListener('click', () =>
  withLoading($('lazada-flush'), '⏳ กำลังส่ง...', async () => {
    const r = await chrome.runtime.sendMessage({ type: 'FLUSH_LAZADA' });
    setBanner('lazada', 'ok', r?.sent
      ? `✅ บันทึกเพิ่ม ${r.sent} สินค้า`
      : 'ไม่มีรายการค้าง — บันทึกจะเกิดตอนกด Get Link ใน Lazada AdSense');
    await loadStats();
  })
);

$('lazada-reset').addEventListener('click', () =>
  withLoading($('lazada-reset'), '⏳...', async () => {
    await chrome.runtime.sendMessage({ type: 'RESET_LAZADA' });
    await loadStats();
    setBanner('lazada', 'ok', '✅ ล้างสินค้าที่เก็บไว้ในเครื่องแล้ว (ไม่กระทบข้อมูลใน DB)');
  })
);

$('lazada-refresh-db').addEventListener('click', () =>
  withLoading($('lazada-refresh-db'), '⏳ โหลด...', loadDbStats)
);

$('fb-scan').addEventListener('click', () =>
  withLoading($('fb-scan'), '⏳ กำลัง scan...', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.url?.includes('facebook.com')) {
      setBanner('fb', 'warn', '⚠️ เปิดหน้า facebook.com/groups/... ก่อนแล้วกด Scan');
      return;
    }
    const r = await chrome.runtime.sendMessage({ type: 'FB_SCAN_TAB', tabId: tab.id });
    if (r?.ok) {
      setBanner('fb', 'ok', `✅ Scan เสร็จ — พบ ${r.groups} กลุ่ม`);
      await loadStats();
      await loadDbStats();
    } else {
      setBanner('fb', 'err', `❌ ${r?.error ?? 'Scan ล้มเหลว'}`);
    }
  })
);

$('fb-reset').addEventListener('click', () =>
  withLoading($('fb-reset'), '⏳...', async () => {
    await chrome.runtime.sendMessage({ type: 'RESET_FB' });
    await loadStats();
    setBanner('fb', 'ok', '✅ Reset แล้ว — กด "Scan หน้านี้" เพื่อ scan ใหม่');
  })
);

$('fb-refresh-db').addEventListener('click', () =>
  withLoading($('fb-refresh-db'), '⏳ โหลด...', loadDbStats)
);

// ─── Guided posting session ───────────────────────────────────────────────────
const postSession = { cards: [], index: 0 };
const postLog = [];

function pushPostLog(text) {
  postLog.unshift({ text, at: Date.now() });
  if (postLog.length > 15) postLog.length = 15;
  const fmt = at => new Date(at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
  $('post-log').innerHTML = postLog.map(l =>
    `<div class="log-item"><span class="log-time">${fmt(l.at)}</span><span class="log-text">${l.text}</span></div>`
  ).join('');
}

function renderPostCard() {
  const { cards, index } = postSession;
  const total = cards.length;

  $('post-prog-wrap').style.display = total ? 'block' : 'none';
  $('post-count').textContent = `${index}/${total}`;
  $('post-prog').style.width = total ? `${Math.round((index / total) * 100)}%` : '0%';

  if (index >= total) {
    $('post-card').style.display = 'none';
    $('post-done-msg').style.display = total ? 'block' : 'none';
    $('post-done-text').textContent = total ? `โพสต์ครบ ${total} กลุ่มแล้ว — พรุ่งนี้กดเริ่มใหม่ได้เลย` : '';
    return;
  }

  const c = cards[index];
  $('post-done-msg').style.display = 'none';
  $('post-card').style.display = 'block';
  $('post-group').textContent = `${index + 1}. ${c.groupName}`;
  $('post-product').textContent = c.productTitle || '';
  const img = $('post-image');
  if (c.productImage) { img.src = c.productImage; img.style.display = 'block'; } else { img.style.display = 'none'; }
  $('post-copy-img').style.display = c.productImage ? 'inline-block' : 'none';
  $('post-caption').textContent = c.caption;
  $('post-linknote').textContent =
    c.linkPlacement === 'in_comment' ? '⚠️ กลุ่มนี้ควรวางลิงก์ในคอมเมนต์ (แคปชั่นไม่มีลิงก์)' : '';
}

async function startPostSession() {
  setBanner('post', 'warn', '⏳ กำลังดึงคิววันนี้...');
  const res = await chrome.runtime.sendMessage({ type: 'FETCH_GROUP_QUEUE' });
  if (!res?.ok) {
    setBanner('post', 'err', `🔴 ${res?.reason ?? 'ดึงคิวไม่สำเร็จ'}`);
    return;
  }
  postSession.cards = res.cards ?? [];
  postSession.index = 0;
  if (postSession.cards.length === 0) {
    setBanner('post', 'ok', '✅ วันนี้ไม่มีกลุ่มถึงคิว (ทุกกลุ่มยัง cooldown) — พรุ่งนี้ลองใหม่');
  } else {
    const skipped = res.skippedNoUrl ? ` (ข้าม ${res.skippedNoUrl} กลุ่มไม่มีลิงก์)` : '';
    setBanner('post', 'ok', `📣 คิววันนี้ ${postSession.cards.length} กลุ่ม${skipped} — คัดลอก+เปิด แล้วโพสต์ทีละกลุ่ม`);
  }
  renderPostCard();
}

async function copyAndOpen() {
  const c = postSession.cards[postSession.index];
  if (!c) return;
  try { await navigator.clipboard.writeText(c.caption); } catch { /* clipboard blocked — caption still shown in panel */ }
  if (c.groupUrl) chrome.tabs.create({ url: c.groupUrl, active: true });
}

async function copyProductImage() {
  const c = postSession.cards[postSession.index];
  if (!c) return;
  try {
    await ImageClip.copyImage(c.productImage);
    setBanner('post', 'ok', '🖼️ คัดลอกรูปแล้ว — กลับไปที่โพสต์แล้วกด Ctrl+V');
  } catch (e) {
    setBanner('post', 'err', `❌ ${String(e.message ?? e)}`);
  }
}

async function markPostedNext() {
  const c = postSession.cards[postSession.index];
  if (!c) return;
  const res = await chrome.runtime.sendMessage({ type: 'MARK_GROUP_POSTED', card: c });
  if (res?.ok) pushPostLog(`✅ โพสต์ ${c.groupName}`);
  else pushPostLog(`⚠️ บันทึกไม่สำเร็จ: ${c.groupName} (ลองใหม่ได้)`);
  postSession.index++;
  renderPostCard();
}

function skipCurrent() {
  if (postSession.index < postSession.cards.length) postSession.index++;
  renderPostCard();
}

$('post-start').addEventListener('click', () => withLoading($('post-start'), '⏳ ดึงคิว...', startPostSession));
$('post-refresh').addEventListener('click', () => withLoading($('post-refresh'), '⏳ ดึงคิว...', startPostSession));
$('post-copy').addEventListener('click', copyAndOpen);
$('post-copy-img').addEventListener('click', () => withLoading($('post-copy-img'), '⏳ รูป...', copyProductImage));
$('post-done').addEventListener('click', () => withLoading($('post-done'), '⏳...', markPostedNext));
$('post-skip').addEventListener('click', skipCurrent);

// ─── Live updates from background ────────────────────────────────────────────
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'STAT_UPDATE') loadStats();
  if (msg.type === 'LOG_UPDATE')  renderLog(msg.log);
});

// ─── Init ─────────────────────────────────────────────────────────────────────
checkConnection();
loadStats();
loadDbStats();
