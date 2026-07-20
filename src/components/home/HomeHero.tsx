'use client';

import { motion } from 'motion/react';
import { useLocale } from '@/i18n/LocaleProvider';
import Logo from '@/components/ui/Logo';

/** Landing headline — sits above the featured carousel. */
export default function HomeHero() {
  const { t } = useLocale();

  return (
    <section className="mx-auto max-w-6xl px-6 pb-7 pt-10 text-center font-[family-name:var(--font-trial)] sm:pb-9 sm:pt-14">
      {/* Brand logo (SVG) — black on the white hero */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-4 flex justify-center"
      >
        <Logo className="h-11 w-auto sm:h-14" />
      </motion.div>
      <motion.h1
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.1 }}
        className="text-3xl font-black text-[var(--foreground)] sm:text-5xl"
        style={{ fontFamily: 'var(--font-display)', lineHeight: 1.08, letterSpacing: '-0.02em' }}
      >
        {t.home.heroLine1}
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.22 }}
        className="mx-auto mt-3 max-w-2xl text-base leading-relaxed text-[var(--muted)] sm:text-lg"
      >
        {t.home.whySafeSubtitle}
      </motion.p>
    </section>
  );
}
