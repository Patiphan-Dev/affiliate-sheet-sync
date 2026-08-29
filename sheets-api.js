/**
 * sheets-api.js — thin wrapper over the Google Sheets REST API v4.
 *
 * Every method returns the parsed JSON body and throws on a non-2xx response.
 * A 401 is handled once here: drop the cached token and retry interactively.
 */

import { getToken, invalidateToken } from './sheets-auth.js';

const BASE = 'https://sheets.googleapis.com/v4/spreadsheets';
const RETRYABLE = new Set([429, 500, 502, 503]);
const MAX_BACKOFF_TRIES = 4;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function call(path, { method = 'GET', body, params } = {}) {
  const url = new URL(`${BASE}${path}`);
  for (const [k, v] of Object.entries(params ?? {})) {
    if (v === undefined || v === null) continue;
    if (Array.isArray(v)) v.forEach((x) => url.searchParams.append(k, x));
    else url.searchParams.set(k, v);
  }

  let authRetried = false;
  for (let tries = 0; ; tries++) {
    const token = await getToken(authRetried);
    const res = await fetch(url, {
      method,
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (res.status === 401 && !authRetried) {
      authRetried = true;
      await invalidateToken();
      continue;
    }
    if (RETRYABLE.has(res.status) && tries < MAX_BACKOFF_TRIES) {
      await sleep(500 * 2 ** tries + Math.random() * 250); // 0.5s, 1s, 2s, 4s (+jitter)
      continue;
    }
    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      throw new Error(`Sheets ${method} ${path} → ${res.status} ${detail.slice(0, 300)}`);
    }
    return res.status === 204 ? null : res.json();
  }
}

export function getSpreadsheet(id, fields) {
  return call(`/${id}`, { params: { fields } });
}

export function getValues(id, range) {
  return call(`/${id}/values/${encodeURIComponent(range)}`);
}

export function batchGetValues(id, ranges) {
  return call(`/${id}/values:batchGet`, { params: { ranges, majorDimension: 'ROWS' } });
}

export function updateValues(id, range, values) {
  return call(`/${id}/values/${encodeURIComponent(range)}`, {
    method: 'PUT',
    params: { valueInputOption: 'RAW' },
    body: { values },
  });
}

/** data: [{ range, values }] — one round trip for many disjoint writes. */
export function batchUpdateValues(id, data) {
  return call(`/${id}/values:batchUpdate`, {
    method: 'POST',
    body: { valueInputOption: 'RAW', data },
  });
}

export function appendValues(id, range, values) {
  return call(`/${id}/values/${encodeURIComponent(range)}:append`, {
    method: 'POST',
    params: { valueInputOption: 'RAW', insertDataOption: 'INSERT_ROWS' },
    body: { values },
  });
}

/** Structural changes (addSheet, etc.). requests: Sheets API Request[] */
export function batchUpdate(id, requests) {
  return call(`/${id}:batchUpdate`, { method: 'POST', body: { requests } });
}
