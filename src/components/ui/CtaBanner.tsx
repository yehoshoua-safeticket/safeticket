'use client';

import Link from 'next/link';
import { Search, Upload, CheckCircle } from 'lucide-react';
import FadeIn from '@/components/ui/FadeIn';
import { useLocale } from '@/i18n/LocaleProvider';

/** Closing call to action — find a ticket, or go list one. */
export default function CtaBanner({ className = '' }: { className?: string }) {
  const { t } = useLocale();

  return (
    <FadeIn>
      <div className={`relative overflow-hidden rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-8 text-center sm:p-12 ${className}`}>
        <div className="noise-overlay pointer-events-none absolute inset-0" />
        <div className="relative">
          <CheckCircle className="mx-auto mb-4 h-12 w-12 text-[var(--accent-text)]" />
          <h2 className="mb-3 text-2xl font-bold text-[var(--foreground)]">{t.howItWorks.ctaTitle}</h2>
          <p className="mb-8 text-[var(--muted)]">{t.howItWorks.ctaSubtitle}</p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Link href="/tickets" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-8 py-3.5 font-bold text-white shadow-lg shadow-black/20 transition-all hover:shadow-xl hover:bg-[var(--accent-hover)]">
              <Search className="h-5 w-5" />{t.howItWorks.findTickets}
            </Link>
            <Link href="/dashboard/sell" className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--input-border)] px-8 py-3.5 font-bold text-[var(--foreground)] transition hover:bg-[var(--input-bg)]">
              <Upload className="h-5 w-5" />{t.howItWorks.sellTickets}
            </Link>
          </div>
        </div>
      </div>
    </FadeIn>
  );
}
