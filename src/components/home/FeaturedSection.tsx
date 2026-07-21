import { getFeaturedEvents } from '@/lib/homepage';
import FeaturedList from './FeaturedList';
import FeaturedFallbackCta from './FeaturedFallbackCta';

/** Streamed fallback — matches the real cards' geometry so nothing shifts. */
export function FeaturedSkeleton() {
  return (
    <section className="mx-auto max-w-5xl px-2 pb-10">
      <div className="mb-4 h-7 w-40 animate-pulse rounded bg-slate-200 sm:h-8" />
      <div className="flex flex-col gap-4">
        {[0, 1].map((i) => (
          <div key={i} className="h-[26vh] min-h-[200px] w-full animate-pulse rounded-md bg-slate-200 sm:h-[36vh] sm:min-h-[280px]" />
        ))}
      </div>
    </section>
  );
}

/**
 * Fetches on the server and streams in behind a <Suspense> boundary, so the
 * hero, categories and flow render without waiting on the database.
 */
export default async function FeaturedSection() {
  const featured = await getFeaturedEvents();

  if (featured.length === 0) return <FeaturedFallbackCta />;
  return <FeaturedList featured={featured} />;
}
