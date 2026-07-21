import { getEventsByCategory } from '@/lib/homepage';
import CategoryCarousel from './CategoryCarousel';

/** Streamed fallback — one placeholder row, matching a carousel's geometry. */
export function CategorySkeleton() {
  return (
    <section className="px-5 py-6 md:px-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-4 h-7 w-32 animate-pulse rounded bg-slate-200" />
        {/* Same slide sizing as the real row, so nothing shifts on swap. */}
        <div className="cat-carousel flex gap-4 overflow-hidden">
          {[0, 1, 2, 3].map((i) => (
            <div key={i}>
              <div className="aspect-[16/9] w-full animate-pulse rounded-xl bg-slate-200" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/** One carousel per category, fetched on the server. */
export default async function CategorySection() {
  const rows = await getEventsByCategory();

  if (rows.length === 0) return null;

  return (
    <>
      {rows.map((row) => (
        <CategoryCarousel key={row.category} category={row.category} events={row.events} />
      ))}
    </>
  );
}
