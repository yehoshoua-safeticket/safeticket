'use client';

import Link from 'next/link';
import { Info } from 'lucide-react';
import { useLocale } from '@/i18n/LocaleProvider';

type Section = { heading: string; body: string };

export default function LegalDoc({ doc }: { doc: 'terms' | 'privacy' }) {
  const { t } = useLocale();
  const content = t.legal[doc];

  return (
    <div className="mx-auto max-w-3xl px-5 py-12 sm:px-8">
      <h1 className="text-3xl font-bold text-[var(--foreground)]">{content.title}</h1>
      <p className="mt-2 text-sm text-[var(--muted)]">{t.legal.lastUpdated}</p>

      <div className="mt-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
        <p className="text-sm text-amber-700">{t.legal.draftNotice}</p>
      </div>

      <div className="mt-8 space-y-6">
        {content.sections.map((s: Section, i: number) => (
          <section key={i}>
            <h2 className="text-lg font-semibold text-[var(--foreground)]">{s.heading}</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-[var(--muted)]">{s.body}</p>
          </section>
        ))}
      </div>

      <p className="mt-10 text-sm text-[var(--muted)]">
        {t.legal.questions}{' '}
        <Link href="/contact" className="text-[var(--accent-text)] hover:underline">{t.legal.contactLink}</Link>
      </p>
    </div>
  );
}
