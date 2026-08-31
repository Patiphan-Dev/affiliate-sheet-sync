/** Guide slugs that ship with a hero photo in /public/guides. */
const WITH_IMAGE = new Set([
  'best-2-person-tents-thailand-2026',
  'sleeping-bag-temperature-guide-thailand',
  'camping-stove-guide-thailand',
  'camping-light-headlamp-guide',
  'camping-checklist-beginner-2d1n',
]);

export function guideImage(slug: string): string | null {
  return WITH_IMAGE.has(slug) ? `/guides/${slug}.jpg` : null;
}
