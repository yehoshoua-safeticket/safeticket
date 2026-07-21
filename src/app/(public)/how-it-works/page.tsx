'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, Upload, CheckCircle, ChevronDown, ChevronUp, HelpCircle, MessageCircle } from 'lucide-react';
import FadeIn from '@/components/ui/FadeIn';
import StepFlow from '@/components/how-it-works/StepFlow';
import { useLocale } from '@/i18n/LocaleProvider';

/** One audience, one card, three quiet points. */
function StepList({ heading, steps }: { heading: string; steps: { title: string; desc: string }[] }) {
  return (
    <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-6 sm:p-7">
      <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--muted)]">{heading}</h2>
      <ol className="mt-5 space-y-5">
        {steps.map((step, i) => (
          <li key={i} className="flex gap-3">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[var(--input-border)] text-[0.65rem] font-bold text-[var(--muted)]">
              {i + 1}
            </span>
            <div>
              <p className="text-sm font-bold text-[var(--foreground)]">{step.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-[var(--muted)]">{step.desc}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

export default function HowItWorksPage() {
  const { t } = useLocale();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <FadeIn>
        <div className="text-center">
          <h1 className="mb-4 text-4xl font-extrabold text-[var(--foreground)]">{t.howItWorks.title}</h1>
          <p className="text-lg text-[var(--muted)]">{t.howItWorks.subtitle}</p>
        </div>
      </FadeIn>

      <FadeIn delay={0.1}>
        <StepFlow />
      </FadeIn>

      <div className="mt-16 grid gap-6 md:grid-cols-2">
        <FadeIn>
          <StepList heading={t.howItWorks.forBuyers} steps={t.howItWorks.buyerSteps} />
        </FadeIn>
        <FadeIn delay={0.1}>
          <StepList heading={t.howItWorks.forSellers} steps={t.howItWorks.sellerSteps} />
        </FadeIn>
      </div>

      <FadeIn>
        <div className="relative mt-16 overflow-hidden rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-8 text-center sm:p-12">
          <div className="noise-overlay pointer-events-none absolute inset-0" />
          <div className="relative">
            <CheckCircle className="mx-auto mb-4 h-12 w-12 text-[var(--accent-text)]" />
            <h2 className="mb-3 text-2xl font-bold text-[var(--foreground)]">{t.howItWorks.ctaTitle}</h2>
            <p className="mb-8 text-[var(--muted)]">{t.howItWorks.ctaSubtitle}</p>
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Link href="/tickets" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-8 py-3.5 font-bold text-white shadow-lg shadow-[var(--accent)]/20 transition-all hover:shadow-xl hover:brightness-110">
                <Search className="h-5 w-5" />{t.howItWorks.findTickets}
              </Link>
              <Link href="/dashboard/sell" className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--input-border)] px-8 py-3.5 font-bold text-[var(--foreground)] transition hover:bg-[var(--input-bg)]">
                <Upload className="h-5 w-5" />{t.howItWorks.sellTickets}
              </Link>
            </div>
          </div>
        </div>
      </FadeIn>

      <div id="faq" className="mt-24 scroll-mt-24">
        <FadeIn>
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-extrabold text-[var(--foreground)]">{t.faq.title}</h2>
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
              <h3 className="mb-2 text-xl font-bold text-[var(--foreground)]">{t.faq.noAnswer}</h3>
              <p className="mb-6 text-[var(--muted)]">{t.faq.noAnswerDesc}</p>
              <Link href="/contact" className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-6 py-3 font-semibold text-white shadow-lg shadow-[var(--accent)]/20 transition-all hover:shadow-xl hover:brightness-110">
                {t.faq.contact}
              </Link>
            </div>
          </div>
        </FadeIn>
      </div>
    </div>
  );
}
