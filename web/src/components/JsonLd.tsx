/** Renders one or more JSON-LD blocks. Objects are trusted (built server-side). */
export function JsonLd({ data }: { data: Record<string, unknown> | (Record<string, unknown> | null)[] }) {
  const blocks = (Array.isArray(data) ? data : [data]).filter(Boolean) as Record<string, unknown>[];
  return (
    <>
      {blocks.map((block, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(block) }}
        />
      ))}
    </>
  );
}
