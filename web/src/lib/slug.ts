/**
 * URL slugs. Thai keeps its characters (browsers + Google handle UTF-8 slugs
 * fine); latin is lowercased; spaces/symbols collapse to a single dash. A short
 * id suffix keeps slugs unique when two products share a name.
 */
/** NFC so a slug compares equal regardless of how the source string was encoded. */
export function normalizeSlug(s: string): string {
  return decodeURIComponent(String(s ?? '')).normalize('NFC');
}

// Cap slugs well under the filesystem's 255-byte filename limit: Thai codepoints
// are 3 bytes in UTF-8, and Vercel writes files like
// `<slug>.prerender-fallback.html`, so a long Thai name blew ENAMETOOLONG.
const MAX_SLUG_BYTES = 90;

function truncateBytes(s: string, maxBytes: number): string {
  let bytes = 0;
  let out = '';
  for (const ch of s) {
    const n = new TextEncoder().encode(ch).length;
    if (bytes + n > maxBytes) break;
    bytes += n;
    out += ch;
  }
  return out.replace(/-+$/, '');
}

export function slugify(text: string, id?: string): string {
  const cleaned = String(text || '')
    .normalize('NFC')
    .trim()
    .toLowerCase()
    // keep Thai, latin letters, digits and spaces; drop everything else
    .replace(/[^฀-๿a-z0-9\s]+/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  const suffix = id ? `-${String(id).slice(-6)}` : '';
  const base = truncateBytes(cleaned, MAX_SLUG_BYTES - suffix.length);
  return (base || 'item') + suffix;
}
