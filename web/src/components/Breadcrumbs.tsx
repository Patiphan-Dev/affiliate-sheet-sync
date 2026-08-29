import Link from 'next/link';

export function Breadcrumbs({ trail }: { trail: { name: string; path: string }[] }) {
  return (
    <nav aria-label="breadcrumb" className="text-xs text-ink/60">
      <ol className="flex flex-wrap items-center gap-1">
        {trail.map((t, i) => (
          <li key={t.path} className="flex items-center gap-1">
            {i > 0 && <span aria-hidden>/</span>}
            {i < trail.length - 1 ? (
              <Link href={t.path} className="hover:text-brand">
                {t.name}
              </Link>
            ) : (
              <span className="text-ink/80">{t.name}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
