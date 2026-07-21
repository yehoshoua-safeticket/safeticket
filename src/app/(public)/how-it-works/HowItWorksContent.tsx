'use client';

import Link from 'next/link';
import { MessageCircle } from 'lucide-react';
import FadeIn from '@/components/ui/FadeIn';
import CtaBanner from '@/components/ui/CtaBanner';
import StepFlow from '@/components/how-it-works/StepFlow';
import FaqSection from '@/components/how-it-works/FaqSection';
import { useLocale } from '@/i18n/LocaleProvider';
import type { Faq } from '@/types/database';

/**
 * Temporarily hidden, not deleted: the per-audience summaries may come back, so
 * StepList and its copy stay wired up behind this flag. Flip to true to restore.
 */
const SHOW_AUDIENCE_SUMMARIES = false;

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

export default function HowItWorksContent({ faqs }: { faqs: Faq[] }) {
  const { t } = useLocale();

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <FadeIn>
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-[var(--foreground)]">{t.howItWorks.title}</h1>
        </div>
      </FadeIn>

      <FadeIn delay={0.1}>
        <StepFlow />
      </FadeIn>

      {SHOW_AUDIENCE_SUMMARIES && (
        <div className="mt-16 grid gap-6 md:grid-cols-2">
          <FadeIn>
            <StepList heading={t.howItWorks.forBuyers} steps={t.howItWorks.buyerSteps} />
          </FadeIn>
          <FadeIn delay={0.1}>
            <StepList heading={t.howItWorks.forSellers} steps={t.howItWorks.sellerSteps} />
          </FadeIn>
        </div>
      )}

      <CtaBanner className="mt-16" />

      <FaqSection faqs={faqs} />

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
  );
}
