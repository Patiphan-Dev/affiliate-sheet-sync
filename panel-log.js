/**
 * panel-log.js — the activity feed shown in the side panel.
 *
 * The side panel is not always open, so the log is persisted (last 30 entries)
 * and also broadcast live to whatever is listening.
 */

const LOG_KEY = 'log';
const MAX_ENTRIES = 30;

export async function pushLog(text) {
  const d = await chrome.storage.local.get(LOG_KEY);
  const log = d[LOG_KEY] ?? [];
  log.unshift({ text, at: Date.now() });
  if (log.length > MAX_ENTRIES) log.length = MAX_ENTRIES;
  await chrome.storage.local.set({ [LOG_KEY]: log });
  broadcast({ type: 'LOG_UPDATE', log });
}

/** Messages to the side panel are best-effort — it is usually closed. */
export function broadcast(msg) {
  chrome.runtime.sendMessage(msg).catch(() => {});
}
