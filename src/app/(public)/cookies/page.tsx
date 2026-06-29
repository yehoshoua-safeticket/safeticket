'use client';

import Link from 'next/link';
import { Info } from 'lucide-react';
import { useLocale } from '@/i18n/LocaleProvider';

export default function CookiesPage() {
  const { t } = useLocale();

  return (
    <div className="mx-auto max-w-3xl px-5 py-12 sm:px-8">
      <h1 className="text-3xl font-bold text-[var(--foreground)]">{t.footer.cookies}</h1>
      <p className="mt-2 text-sm text-[var(--muted)]">{t.legal.lastUpdated}</p>

      <div className="mt-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
        <p className="text-sm text-amber-700">{t.legal.draftNotice}</p>
      </div>

      <p className="mt-10 text-sm text-[var(--muted)]">
        {t.legal.questions}{' '}
        <Link href="/contact" className="text-[var(--accent-text)] hover:underline">{t.legal.contactLink}</Link>
      </p>
    </div>
  );
}
