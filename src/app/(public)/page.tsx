import { Suspense } from 'react';
import HomeHero from '@/components/home/HomeHero';
import FeaturedSection, { FeaturedSkeleton } from '@/components/home/FeaturedSection';
import CategorySection, { CategorySkeleton } from '@/components/home/CategorySection';

export default function Home() {
  return (
    <>
      <HomeHero />

      {/* Both sections hit the database, so each streams in behind its own
          boundary — a slow category query never holds up the featured cards. */}
      <Suspense fallback={<FeaturedSkeleton />}>
        <FeaturedSection />
      </Suspense>

      <Suspense fallback={<CategorySkeleton />}>
        <CategorySection />
      </Suspense>
    </>
  );
}
