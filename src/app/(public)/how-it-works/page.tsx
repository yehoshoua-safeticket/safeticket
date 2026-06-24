'use client';

import Link from 'next/link';
import { Search, CreditCard, Zap, Upload, ShieldCheck, DollarSign, CheckCircle } from 'lucide-react';
import FadeIn from '@/components/ui/FadeIn';
import { useLocale } from '@/i18n/LocaleProvider';

const buyerIcons = [Search, CreditCard, Zap];
const sellerIcons = [Upload, ShieldCheck, DollarSign];

export default function HowItWorksPage() {
  const { t } = useLocale();

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <FadeIn>
        <div className="mb-16 text-center">
          <h1 className="mb-4 text-4xl font-extrabold text-[var(--foreground)]">{t.howItWorks.title}</h1>
          <p className="text-lg text-[var(--muted)]">{t.howItWorks.subtitle}</p>
        </div>
      </FadeIn>

      <div className="mb-20">
        <FadeIn><h2 className="mb-8 text-center text-2xl font-bold text-[var(--foreground)]">{t.howItWorks.forBuyers}</h2></FadeIn>
        <div className="space-y-8">
          {t.howItWorks.buyerSteps.map((item, idx) => {
            const Icon = buyerIcons[idx];
            const step = idx + 1;
            return (
              <FadeIn key={step} delay={step * 0.1}>
                <div className="flex gap-6">
                  <div className="flex shrink-0 flex-col items-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent)] text-lg font-bold text-white shadow-lg shadow-[var(--accent)]/25">
                      {step}
                    </div>
                    {step < 3 && <div className="mt-2 h-full w-px bg-[var(--input-bg)]" />}
                  </div>
                  <div className="group rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-6 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md hover:shadow-black/5">
                    <div className="mb-3 flex items-center gap-3">
                      <Icon className="h-5 w-5 text-[var(--accent-text)]" />
                      <h3 className="text-lg font-bold text-[var(--foreground)]">{item.title}</h3>
                    </div>
                    <p className="text-sm leading-relaxed text-[var(--muted)]">{item.desc}</p>
                  </div>
                </div>
              </FadeIn>
            );
          })}
        </div>
      </div>

      <div className="mb-20">
        <FadeIn><h2 className="mb-8 text-center text-2xl font-bold text-[var(--foreground)]">{t.howItWorks.forSellers}</h2></FadeIn>
        <div className="space-y-8">
          {t.howItWorks.sellerSteps.map((item, idx) => {
            const Icon = sellerIcons[idx];
            const step = idx + 1;
            return (
              <FadeIn key={step} delay={step * 0.1}>
                <div className="flex gap-6">
                  <div className="flex shrink-0 flex-col items-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent)] text-lg font-bold text-white shadow-lg shadow-[var(--accent)]/25">
                      {step}
                    </div>
                    {step < 3 && <div className="mt-2 h-full w-px bg-[var(--input-bg)]" />}
                  </div>
                  <div className="group rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-6 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md hover:shadow-black/5">
                    <div className="mb-3 flex items-center gap-3">
                      <Icon className="h-5 w-5 text-[var(--accent-text)]" />
                      <h3 className="text-lg font-bold text-[var(--foreground)]">{item.title}</h3>
                    </div>
                    <p className="text-sm leading-relaxed text-[var(--muted)]">{item.desc}</p>
                  </div>
                </div>
              </FadeIn>
            );
          })}
        </div>
      </div>

      <FadeIn>
        <div className="relative overflow-hidden rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-8 text-center sm:p-12">
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
    </div>
  );
}
