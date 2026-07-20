'use client';

import { motion } from 'motion/react';
import Link from 'next/link';
import { useLocale } from '@/i18n/LocaleProvider';

/** Shown when there are no featured events — Aurora gradient + CTA. */
export default function FeaturedFallbackCta() {
  const { t } = useLocale();

  return (
    <section className="aurora-gradient relative mx-auto flex min-h-[30vh] max-w-6xl flex-col items-center justify-center overflow-hidden rounded-2xl px-6 py-14 text-center">
      <motion.div
        initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.15 }}
      >
        <Link
          href="/tickets"
          className="relative z-10 inline-flex items-center rounded-md bg-white px-7 py-3 text-sm font-bold uppercase tracking-wider text-[var(--accent-text)] shadow-lg transition hover:bg-white/90"
        >
          {t.home.findTickets}
        </Link>
      </motion.div>
    </section>
  );
}
