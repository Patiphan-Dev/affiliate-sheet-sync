import type { ReactElement, SVGProps } from 'react';

/** One consistent 24×24 line-icon set — 1.6 stroke, round caps. */
const base = {
  width: 22,
  height: 22,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

type P = SVGProps<SVGSVGElement>;

export const IconTent = (p: P) => (
  <svg {...base} {...p}><path d="M12 4 3 19h18L12 4Z" /><path d="M12 4v15" /><path d="m9 19 3-5 3 5" /></svg>
);
export const IconSleepingBag = (p: P) => (
  <svg {...base} {...p}><rect x="6" y="3" width="12" height="18" rx="4" /><path d="M12 3v10" /><path d="M12 13c2 0 3 1.5 3 4" /></svg>
);
export const IconStove = (p: P) => (
  <svg {...base} {...p}><path d="M12 3c1.6 1.7 2.4 3.2 2.4 4.6A2.4 2.4 0 0 1 12 10a2.4 2.4 0 0 1-2.4-2.4C9.6 6.2 10.4 4.7 12 3Z" /><path d="M5 13h14l-1.5 7h-11L5 13Z" /><path d="M9 13v7M15 13v7" /></svg>
);
export const IconChair = (p: P) => (
  <svg {...base} {...p}><path d="M6 4v9h12V4" /><path d="M4 13h16" /><path d="m7 13-2 7M17 13l2 7" /><path d="M6 17h12" /></svg>
);
export const IconLantern = (p: P) => (
  <svg {...base} {...p}><path d="M9 3h6" /><path d="M10 3v3M14 3v3" /><rect x="7" y="6" width="10" height="12" rx="2" /><path d="M12 9v6" /><path d="M10 21h4" /><path d="M12 18v3" /></svg>
);
export const IconBackpack = (p: P) => (
  <svg {...base} {...p}><path d="M7 8a5 5 0 0 1 10 0v11a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V8Z" /><path d="M9 8a3 3 0 0 1 6 0" /><rect x="9.5" y="12" width="5" height="5" rx="1" /></svg>
);
export const IconCooler = (p: P) => (
  <svg {...base} {...p}><rect x="4" y="7" width="16" height="12" rx="2" /><path d="M4 11h16" /><path d="M9 7V5h6v2" /><path d="M10 15h4" /></svg>
);
export const IconToolkit = (p: P) => (
  <svg {...base} {...p}><rect x="3" y="8" width="18" height="12" rx="2" /><path d="M8 8V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><path d="M3 13h18" /><path d="M11 11h2v4h-2z" /></svg>
);
export const IconTag = (p: P) => (
  <svg {...base} {...p}><path d="M20.6 12.6 12 21l-8-8V4h9l7.6 7.6a1.4 1.4 0 0 1 0 2Z" /><circle cx="8" cy="8" r="1.4" /></svg>
);
export const IconBook = (p: P) => (
  <svg {...base} {...p}><path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3V4Z" /><path d="M5 17a3 3 0 0 1 3-3h11" /><path d="M9 8h6M9 11h5" /></svg>
);
export const IconSearch = (p: P) => (
  <svg {...base} {...p}><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
);

export const CATEGORY_ICON: Record<string, (p: P) => ReactElement> = {
  tents: IconTent,
  'sleeping-bags': IconSleepingBag,
  stoves: IconStove,
  furniture: IconChair,
  lighting: IconLantern,
  backpacks: IconBackpack,
  coolers: IconCooler,
  accessories: IconToolkit,
};
