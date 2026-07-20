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
    <section className="mx-auto max-w-5xl px-5 pb-10 sm:px-8">
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
              <Link href={`/tickets/${ev.id}`} className="group relative block h-[37vh] min-h-[250px] w-full overflow-hidden rounded-xl border border-[var(--card-border)] sm:h-[43vh]">
                <Image
                  src={ev.image_url!}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 100vw, 1024px"
                  priority={isFirst}
                  draggable={false}
                  className="object-cover transition-transform duration-[1.2s] group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/10" />
                <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
                  <span className="inline-block rounded-full bg-[var(--accent)] px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
                    {t.eventCategory[ev.category] ?? ev.category}
                  </span>
                  <h2
                    className="mt-3 max-w-2xl text-2xl font-black leading-tight text-white sm:text-4xl"
                    style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}
                  >
                    {ev.title}
                  </h2>
                  <p className="mt-2 text-sm text-white/80 sm:text-base">
                    {new Date(ev.event_date).toLocaleDateString(dateLocale, { day: 'numeric', month: 'long', year: 'numeric' })}
                    {ev.city && ` · ${ev.city}`}
                  </p>
                  <div className="mt-4 flex flex-wrap items-center gap-4">
                    <span className="inline-flex items-center rounded-md bg-[var(--accent)] px-5 py-2.5 text-sm font-bold uppercase tracking-wider text-white transition-colors group-hover:bg-[var(--accent-hover)]">
                      {t.home.findTickets}
                    </span>
                    {ev.lowestPrice > 0 && (
                      <span className="font-mono-nums text-sm font-semibold text-white/90">
                        {t.home.fromPrice.replace('{price}', String(ev.lowestPrice))}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
