/**
 * sheets-auth.js — Google OAuth token handling via chrome.identity.
 *
 * The token comes from the `oauth2` block in manifest.json (client_id + the
 * spreadsheets scope). Callers get a bearer string; a 401 from the API should
 * trigger invalidate() + one retry with interactive=true.
 */

let cached = null;

function requestToken(interactive) {
  return new Promise((resolve, reject) => {
    chrome.identity.getAuthToken({ interactive }, (token) => {
      const err = chrome.runtime.lastError;
      if (err || !token) return reject(new Error(err?.message ?? 'ไม่ได้รับ token จาก Google'));
      resolve(token);
    });
  });
}

/** Bearer token. interactive=true is allowed to pop the Google consent window. */
export async function getToken(interactive = false) {
  if (cached) return cached;
  cached = await requestToken(interactive);
  return cached;
}

/** Drop the token Chrome has cached — call after a 401 before retrying. */
export async function invalidateToken() {
  const token = cached;
  cached = null;
  if (token) {
    await new Promise((r) => chrome.identity.removeCachedAuthToken({ token }, r));
  }
}

/** Force the consent flow (used by the panel's "เชื่อมต่อ Google" button). */
export async function signIn() {
  await invalidateToken();
  return getToken(true);
}

/** Revoke the grant entirely so the next call re-consents. */
export async function signOut() {
  const token = cached ?? await getToken(false).catch(() => null);
  await invalidateToken();
  await new Promise((r) => chrome.identity.clearAllCachedAuthTokens(r));
  if (token) {
    // Needs the oauth2.googleapis.com host permission; without it this is a no-op
    // and only the local cache is cleared.
    await fetch(`https://oauth2.googleapis.com/revoke?token=${token}`, { method: 'POST' }).catch(() => {});
  }
}
