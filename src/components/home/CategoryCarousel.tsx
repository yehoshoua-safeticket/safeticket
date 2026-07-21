'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { useLocale } from '@/i18n/LocaleProvider';
import type { CategoryRow } from '@/lib/homepage';

const GAP = 16; // gap-4, and the value .cat-carousel subtracts when sizing slides

/**
 * One category, one horizontally scrolling row of its events.
 *
 * Deliberately no `touch-action` override: pinning it to `pan-x` would let the
 * row swipe but swallow vertical drags, so a finger landing on a card would
 * trap the page. Leaving it at `auto` lets the browser pick the axis from the
 * gesture, which is what keeps the page scrolling under a touched card.
 */
export default function CategoryCarousel({ category, events }: CategoryRow) {
  const { t, locale } = useLocale();
  const scroller = useRef<HTMLDivElement>(null);
  const dateLocale = locale === 'he' ? 'he-IL' : 'en-US';

  // Paging is measured, not assumed: slide width comes from CSS breakpoints, so
  // the number of cards per view is whatever actually fits right now. Both
  // figures are percentages of the track.
  const [thumb, setThumb] = useState({ width: 100, offset: 0, coverHeight: 0 });

  const measure = useCallback(() => {
    const el = scroller.current;
    if (!el) return;
    const card = el.firstElementChild as HTMLElement | null;
    if (!card) return;

    const step = card.offsetWidth + GAP;
    const perView = Math.max(1, Math.round((el.clientWidth + GAP) / step));
    const pages = Math.max(1, Math.ceil(events.length / perView));

    // Current page, derived from how far along the scroll actually is rather
    // than from dividing by a page width: a trailing partial page (5 cards, 4
    // per view) leaves less than a full page of travel, which would otherwise
    // round back to page 0 and never reach the far edge. Mapping progress
    // across the pages guarantees the end of the row lands on the last one.
    // RTL reports scrollLeft as negative, so the magnitude alone works for both
    // directions, and rounding is what keeps the dash out of the gaps.
    const max = el.scrollWidth - el.clientWidth;
    const progress = max > 0 ? Math.abs(el.scrollLeft) / max : 0;
    const page = Math.round(progress * (pages - 1));

    // The bar shows what fraction of the collection is on screen, so it grows
    // and shrinks with the breakpoint the way a scrollbar thumb would — while
    // still coming to rest on a page boundary rather than mid-card.
    const width = Math.min(100, (perView / events.length) * 100);
    const offset = pages > 1 ? (page / (pages - 1)) * (100 - width) : 0;

    // The overlay has to be exactly as tall as the artwork. Deriving it from
    // the row's own aspect ratio would only be right at one card per view — at
    // four per view the box is four times too tall and the bar ends up floating
    // in the gap below the carousel. Measure the cover instead.
    const cover = card.querySelector('[data-cover]') as HTMLElement | null;

    setThumb({ width, offset, coverHeight: cover?.offsetHeight ?? 0 });
  }, [events.length]);

  useEffect(() => {
    measure();
    const el = scroller.current;
    if (!el) return;
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [measure]);

  // In RTL the "previous" arrow points right and "next" points left.
  const PrevIcon = locale === 'he' ? ChevronRight : ChevronLeft;
  const NextIcon = locale === 'he' ? ChevronLeft : ChevronRight;

  /** Advance a whole page, so a scroll never lands mid-card. */
  function scroll(dir: 'prev' | 'next') {
    const el = scroller.current;
    if (!el) return;
    const isRTL = getComputedStyle(el).direction === 'rtl';
    const sign = (dir === 'next' ? 1 : -1) * (isRTL ? -1 : 1);
    el.scrollBy({ left: sign * (el.clientWidth + GAP), behavior: 'smooth' });
  }

  // A bar covering the whole track means the row already fits: nothing to page.
  const paged = thumb.width < 99.5;

  return (
    <section className="px-2 py-3">
      <div className="mx-auto max-w-5xl">
        <div className="mb-4 flex items-end justify-between gap-4">
          <h2 className="text-xl font-bold text-[var(--foreground)] sm:text-2xl" style={{ fontFamily: 'var(--font-display)' }}>
            {t.eventCategory[category] ?? category}
          </h2>
          <div className="flex items-center gap-2">
            <Link
              href={`/tickets?category=${category}`}
              className="text-sm font-bold text-[var(--accent-text)] transition hover:underline"
            >
              {t.home.seeAll}
            </Link>
            {paged && (
              <div className="hidden items-center gap-1 md:flex">
                <button
                  type="button"
                  onClick={() => scroll('prev')}
                  aria-label={t.home.previous}
                  className="flex h-8 w-8 items-center justify-center rounded-md border border-[var(--card-border)] text-[var(--foreground)] transition hover:bg-[var(--input-bg)]"
                >
                  <PrevIcon className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => scroll('next')}
                  aria-label={t.home.next}
                  className="flex h-8 w-8 items-center justify-center rounded-md border border-[var(--card-border)] text-[var(--foreground)] transition hover:bg-[var(--input-bg)]"
                >
                  <NextIcon className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="relative">
          <div
            ref={scroller}
            onScroll={measure}
            className="cat-carousel hide-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain"
          >
            {events.map((ev) => (
              <div key={ev.id} className="snap-start">
                <Link href={`/tickets/${ev.id}`} className="group block">
                  <div data-cover className="relative aspect-[16/9] w-full overflow-hidden rounded-md border border-[var(--card-border)]">
                    <Image
                      src={ev.image_url!}
                      alt=""
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 260px"
                      draggable={false}
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <h3 className="mt-2.5 line-clamp-2 text-sm font-bold leading-snug text-[var(--foreground)]">
                    {ev.title}
                  </h3>
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    {new Date(ev.event_date).toLocaleDateString(dateLocale, { day: 'numeric', month: 'short', year: 'numeric' })}
                    {ev.city && ` · ${ev.city}`}
                  </p>
                  {ev.lowestPrice > 0 && (
                    <p className="font-mono-nums mt-1 text-xs font-bold text-[var(--foreground)]">
                      {t.home.fromPrice.replace('{price}', String(ev.lowestPrice))}
                    </p>
                  )}
                </Link>
              </div>
            ))}
          </div>

          {/* Page indicator, sitting *on* the artwork rather than below the row,
              so it costs no vertical space. Its height is the measured cover
              height, which is what keeps it pinned to the bottom of the image
              at every breakpoint. Touch only — on desktop the chevrons already
              say where you are, so the bar is hidden from md up. */}
          {paged && (
            <div
              className="pointer-events-none absolute inset-x-0 top-0 flex items-end pb-3 md:hidden"
              style={{ height: thumb.coverHeight }}
            >
              {/* No rail behind it — only the bar itself is visible. It sits
                  flush to the leading edge at the start and to the trailing one
                  at the end (flipped in RTL), so hitting an edge is what tells
                  you the row has nothing further to scroll. */}
              <div className="h-1 w-full px-3">
                <div
                  className="h-full rounded-sm bg-white transition-[margin-inline-start] duration-300"
                  style={{
                    width: `${thumb.width}%`,
                    marginInlineStart: `${thumb.offset}%`,
                    boxShadow: '0 0 3px rgba(0,0,0,0.55)',
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
