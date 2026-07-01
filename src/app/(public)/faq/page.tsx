'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronUp, HelpCircle, MessageCircle } from 'lucide-react';
import FadeIn from '@/components/ui/FadeIn';
import { useLocale } from '@/i18n/LocaleProvider';

export default function FAQPage() {
  const { t } = useLocale();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <FadeIn>
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-extrabold text-[var(--foreground)]">{t.faq.title}</h1>
          <p className="text-lg text-[var(--muted)]">{t.faq.subtitle}</p>
        </div>
      </FadeIn>

      <div className="space-y-4">
        {t.faq.items.map((item, i) => (
          <FadeIn key={i} delay={i * 0.04}>
            <div className="overflow-hidden rounded-xl border border-[var(--card-border)] bg-[var(--card)] transition-all hover:border-[var(--input-border)] hover:shadow-sm">
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="flex w-full items-center justify-between p-6 text-start"
              >
                <div className="flex items-center gap-3">
                  <HelpCircle className="h-5 w-5 shrink-0 text-[var(--accent-text)]" />
                  <span className="font-semibold text-[var(--foreground)]">{item.q}</span>
                </div>
                {openIndex === i ? <ChevronUp className="h-5 w-5 shrink-0 text-[var(--muted)]" /> : <ChevronDown className="h-5 w-5 shrink-0 text-[var(--muted)]" />}
              </button>
              <div
                className="overflow-hidden transition-all duration-300"
                style={{
                  maxHeight: openIndex === i ? '500px' : '0px',
                  opacity: openIndex === i ? 1 : 0,
                }}
              >
                <div className="border-t border-[var(--card-border)] px-6 pb-6 pt-4">
                  <p className="text-sm leading-relaxed text-[var(--muted)]">{item.a}</p>
                </div>
              </div>
            </div>
          </FadeIn>
        ))}
      </div>

      <FadeIn delay={0.3}>
        <p className="mt-8 text-xs leading-relaxed text-[var(--muted)]">{t.faq.footnote}</p>
      </FadeIn>

      <FadeIn delay={0.4}>
        <div className="relative mt-16 overflow-hidden rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-8 text-center">
          <div className="noise-overlay pointer-events-none absolute inset-0" />
          <div className="relative">
            <MessageCircle className="mx-auto mb-4 h-10 w-10 text-[var(--accent-text)]" />
            <h2 className="mb-2 text-xl font-bold text-[var(--foreground)]">{t.faq.noAnswer}</h2>
            <p className="mb-6 text-[var(--muted)]">{t.faq.noAnswerDesc}</p>
            <Link href="/contact" className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-6 py-3 font-semibold text-white shadow-lg shadow-[var(--accent)]/20 transition-all hover:shadow-xl hover:brightness-110">
              {t.faq.contact}
            </Link>
          </div>
        </div>
      </FadeIn>
    </div>
  );
}
