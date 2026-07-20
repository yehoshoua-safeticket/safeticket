import { Suspense } from 'react';
import HomeHero from '@/components/home/HomeHero';
import FeaturedSection, { FeaturedSkeleton } from '@/components/home/FeaturedSection';
import CategorySection from '@/components/home/CategorySection';
import HowItWorks from '@/components/home/HowItWorks';
import { CATEGORY_TILES } from '@/lib/homepage';

export default function Home() {
  return (
    <>
      <HomeHero />

      {/* Only the featured carousel depends on the database, so it is the only
          thing behind a Suspense boundary — everything else renders at once. */}
      <Suspense fallback={<FeaturedSkeleton />}>
        <FeaturedSection />
      </Suspense>

      {/* Static artwork: no data dependency, so these paint immediately. */}
      <CategorySection categories={CATEGORY_TILES} />

      <HowItWorks />
    </>
  );
}
