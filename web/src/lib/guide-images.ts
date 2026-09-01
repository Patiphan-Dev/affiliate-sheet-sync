/** Guide slugs that ship with a dedicated hero photo in /public/guides. */
const WITH_IMAGE = new Set([
  'best-2-person-tents-thailand-2026',
  'sleeping-bag-temperature-guide-thailand',
  'camping-stove-guide-thailand',
  'camping-light-headlamp-guide',
  'camping-checklist-beginner-2d1n',
]);

/** Category slugs that have an image in /public/cat — used as a fallback. */
const CAT_SLUGS = new Set([
  'tents',
  'sleeping-bags',
  'stoves',
  'furniture',
  'lighting',
  'backpacks',
  'coolers',
  'accessories',
]);

/**
 * Hero image for a guide: its own photo if present, otherwise the photo of the
 * category it belongs to (`refId`), otherwise nothing.
 */
export function guideImage(slug: string, refId?: string): string | null {
  if (WITH_IMAGE.has(slug)) return `/guides/${slug}.jpg`;
  if (refId && CAT_SLUGS.has(refId)) return `/cat/${refId}.jpg`;
  return null;
}
