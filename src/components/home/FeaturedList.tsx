'use client';

import { motion } from 'motion/react';
import Image from 'next/image';
import Link from 'next/link';
import { useLocale } from '@/i18n/LocaleProvider';
import type { EventWithListings } from '@/lib/homepage';

/** Featured events — listed banner cards, one per row. */
export default function FeaturedList({ featured }: { featured: EventWithListings[] }) {
  const { t, locale } = useLocale();
  const dateLocale = locale === 'he' ? 'he-IL' : 'en-US';

  return (
    <section className="mx-auto max-w-5xl px-2 pb-10">
      <h2 className="mb-4 text-xl font-bold text-[var(--foreground)] sm:text-2xl" style={{ fontFamily: 'var(--font-display)' }}>
        {t.home.featuredTitle}
      </h2>
      <div className="flex flex-col gap-4">
        {featured.map((ev, i) => {
          // The first card is the LCP element: render it immediately instead of
          // waiting on hydration and an IntersectionObserver.
          const isFirst = i === 0;
          return (
            <motion.div
              key={ev.id}
              initial={isFirst ? false : { opacity: 0, y: 16 }}
              whileInView={isFirst ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
            >
              <Link href={`/tickets/${ev.id}`} className="group relative block h-[26vh] min-h-[200px] w-full overflow-hidden rounded-md border border-[var(--card-border)] sm:h-[36vh] sm:min-h-[280px]">
                <Image
                  src={ev.image_url!}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 100vw, 1024px"
                  priority={isFirst}
                  draggable={false}
                  className="object-cover transition-transform duration-[1.2s] group-hover:scale-105"
                />
                {/* Darkened at both ends now that content is anchored to both,
                    so the top block stays legible over bright artwork. */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/25 to-black/85" />

                {/* Two independently anchored blocks rather than one stack: the
                    CTA's position is fixed to the bottom edge and no longer
                    drifts with how many lines the title happens to run to. Both
                    use `inset-x-0` + padding, so they share the inline-start
                    side and flip together in RTL. */}
                <div className="absolute inset-x-0 top-0 p-3 sm:p-8">
                  {/* Pills share the card's radius rather than being fully round. */}
                  <span className="inline-block rounded-md bg-white px-3 py-1 text-xs font-bold uppercase tracking-wide text-black">
                    {t.eventCategory[ev.category] ?? ev.category}
                  </span>
                  {/* Clamped: the blocks are anchored, so an unbounded title is
                      the one thing that could still run into the CTA below. */}
                  <h2
                    className="mt-1.5 line-clamp-2 max-w-2xl text-2xl font-black leading-tight text-white sm:text-4xl"
                    style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}
                  >
                    {ev.title}
                  </h2>
                  <p className="mt-1 text-sm text-white/80 sm:text-base">
                    {new Date(ev.event_date).toLocaleDateString(dateLocale, { day: 'numeric', month: 'long', year: 'numeric' })}
                    {ev.city && ` · ${ev.city}`}
                  </p>
                </div>

                {ev.lowestPrice > 0 && (
                  <div className="absolute inset-x-0 bottom-0 p-3 sm:p-8">
                    <span className="font-mono-nums text-lg font-bold text-white sm:text-2xl">
                      {t.home.fromPrice.replace('{price}', String(ev.lowestPrice))}
                    </span>
                  </div>
                )}
              </Link>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
