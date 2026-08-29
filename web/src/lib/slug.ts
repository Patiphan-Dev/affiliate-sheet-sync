/**
 * URL slugs. Thai keeps its characters (browsers + Google handle UTF-8 slugs
 * fine); latin is lowercased; spaces/symbols collapse to a single dash. A short
 * id suffix keeps slugs unique when two products share a name.
 */
/** NFC so a slug compares equal regardless of how the source string was encoded. */
export function normalizeSlug(s: string): string {
  return decodeURIComponent(String(s ?? '')).normalize('NFC');
}

export function slugify(text: string, id?: string): string {
  const base = String(text || '')
    .normalize('NFC')
    .trim()
    .toLowerCase()
    // keep Thai, latin letters, digits and spaces; drop everything else
    .replace(/[^฀-๿a-z0-9\s]+/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
  const suffix = id ? `-${String(id).slice(-6)}` : '';
  return (base || 'item') + suffix;
}
