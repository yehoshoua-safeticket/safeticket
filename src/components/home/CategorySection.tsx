'use client';

import { motion } from 'motion/react';
import Image from 'next/image';
import Link from 'next/link';
import { useRef } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { useLocale } from '@/i18n/LocaleProvider';
import type { CategoryTile } from '@/lib/homepage';

/**
 * Category tiles. One carousel serves both breakpoints — mobile swipes a
 * full-width card at a time, md+ centres a row of fixed-width tiles. Rendering
 * a single DOM tree (rather than a mobile copy plus a `hidden md:flex` copy)
 * keeps the browser from fetching every tile image twice.
 */
export default function CategorySection({ categories }: { categories: CategoryTile[] }) {
  const { t, locale } = useLocale();
  const catRef = useRef<HTMLDivElement>(null);

  // In RTL (Hebrew) the "previous" arrow points right and "next" points left,
  // so swap which chevron each control renders.
  const PrevIcon = locale === 'he' ? ChevronRight : ChevronLeft;
  const NextIcon = locale === 'he' ? ChevronLeft : ChevronRight;

  // Scroll one full card at a time (RTL-aware).
  function scrollCategories(dir: 'prev' | 'next') {
    const el = catRef.current;
    if (!el) return;
    const card = el.querySelector('[data-cat-card]') as HTMLElement | null;
    const step = card ? card.offsetWidth + 12 : el.clientWidth; // card width + gap-3
    const isRTL = getComputedStyle(el).direction === 'rtl';
    const sign = (dir === 'next' ? 1 : -1) * (isRTL ? -1 : 1);
    el.scrollBy({ left: sign * step, behavior: 'smooth' });
  }

  if (categories.length === 0) return null;

  return (
    <section className="px-5 py-8 sm:py-10 md:px-6">
      <div className="mx-auto max-w-5xl">
        <h2 className="mb-6 text-center text-2xl font-bold text-[var(--foreground)] sm:text-3xl" style={{ fontFamily: 'var(--font-display)' }}>
          {t.home.categoriesTitle}
        </h2>

        <div className="relative">
          <div
            ref={catRef}
            className="flex snap-x snap-mandatory touch-pan-x gap-3 overflow-x-auto overflow-y-hidden overscroll-x-contain pb-1 [scrollbar-width:none] md:justify-center md:gap-4 md:pb-2 [&::-webkit-scrollbar]:hidden"
          >
            {categories.map((tile, i) => (
              <motion.div
                key={tile.category}
                data-cat-card
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className="w-full shrink-0 snap-center md:w-auto md:snap-start"
              >
                <Link href={`/tickets?category=${tile.category}`} draggable={false} className="group relative block h-64 w-full overflow-hidden rounded-2xl border border-[var(--card-border)] md:w-80">
                  <Image
                    src={tile.image_url}
                    alt=""
                    fill
                    sizes="(max-width: 768px) 100vw, 320px"
                    draggable={false}
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent md:from-black/80 md:via-black/20" />
                  <span className="absolute bottom-4 start-4 text-2xl font-extrabold text-white md:bottom-3 md:start-3 md:text-xl" style={{ fontFamily: 'var(--font-display)' }}>
                    {t.eventCategory[tile.category] ?? tile.category}
                  </span>
                </Link>
              </motion.div>
            ))}
          </div>

          {categories.length > 1 && (
            <div className="md:hidden">
              <button
                type="button"
                onClick={() => scrollCategories('prev')}
                aria-label="Previous"
                className="absolute start-2 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--card-border)] bg-[var(--card)] text-[var(--foreground)] backdrop-blur-md transition active:bg-[var(--accent-soft)]"
              >
                <PrevIcon className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => scrollCategories('next')}
                aria-label="Next"
                className="absolute end-2 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--card-border)] bg-[var(--card)] text-[var(--foreground)] backdrop-blur-md transition active:bg-[var(--accent-soft)]"
              >
                <NextIcon className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
