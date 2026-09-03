import Link from 'next/link';
import Image from 'next/image';
import type { Article } from '@/types';
import { guideImage } from '@/lib/guide-images';
import { thaiDate } from '@/lib/format';

/**
 * Guide teaser. Mobile: a compact row (small thumb + title + date, no summary)
 * so a list of six stays scannable. ≥sm: the usual stacked card with summary.
 */
export function GuideCard({ guide }: { guide: Article }) {
  const img = guideImage(guide.slug, guide.refId);

  return (
    <article className="group">
      <Link href={`/guides/${guide.slug}`} className="flex items-start gap-3.5 sm:block">
        {img && (
          <span className="relative block aspect-[4/3] w-28 shrink-0 overflow-hidden rounded-lg bg-surface sm:aspect-[16/10] sm:w-full">
            <Image
              src={img}
              alt={guide.title}
              fill
              sizes="(max-width:640px) 112px, 380px"
              className="object-cover transition-transform duration-[600ms] ease-out group-hover:scale-105"
            />
          </span>
        )}
        <div className="min-w-0 flex-1 sm:mt-3">
          <h3 className="line-clamp-2 font-bold leading-snug tracking-tight underline-offset-4 group-hover:underline sm:text-lg">
            {guide.title}
          </h3>
          <p className="mt-1 hidden text-sm text-subtle sm:line-clamp-2 sm:block">{guide.summary}</p>
          {guide.updatedAt && (
            <p className="mt-1 text-[11px] uppercase tracking-wide text-subtle sm:mt-2">
              อัปเดต {thaiDate(guide.updatedAt)}
            </p>
          )}
        </div>
      </Link>
    </article>
  );
}
