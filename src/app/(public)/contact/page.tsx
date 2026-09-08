'use client';

import { useState } from 'react';
import { Mail, Phone, MapPin, Send, Check } from 'lucide-react';
import { useLocale } from '@/i18n/LocaleProvider';

// The display strings live in i18n (the address is written differently per
// locale); these are the machine-readable forms the links point at, identical
// in every language.
const SUPPORT_EMAIL = 'cs@safeticket.co.il';
const SUPPORT_PHONE_E164 = '+972507169977';
const OFFICE_MAP_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent('Golda Meir Blvd 255, Jerusalem')}`;

export default function ContactPage() {
  const { t } = useLocale();
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
          <Check className="h-8 w-8 text-[var(--accent-text)]" />
        </div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">{t.contact.successTitle}</h1>
        <p className="mt-3 text-[var(--muted)]">{t.contact.successDesc}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <div className="mb-12 text-center">
        <h1 className="mb-4 text-4xl font-extrabold text-[var(--foreground)]">{t.contact.title}</h1>
        <p className="text-lg text-[var(--muted)]">{t.contact.subtitle}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3 lg:gap-8">
        <div className="space-y-6 lg:col-span-2">
          <form onSubmit={handleSubmit} className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-6 sm:p-8">
            <div className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm text-[var(--muted)]">{t.contact.fullName}</label>
                  <input type="text" required placeholder={t.contact.namePlaceholder} className="w-full rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-4 py-3 text-[var(--foreground)] placeholder-[var(--muted)] focus:outline-none" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm text-[var(--muted)]">{t.contact.email}</label>
                  <input type="email" required placeholder="your@email.com" className="w-full rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-4 py-3 text-[var(--foreground)] placeholder-[var(--muted)] focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm text-[var(--muted)]">{t.contact.subject}</label>
                <select className="w-full rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-4 py-3 text-[var(--foreground)] focus:outline-none">
                  <option value="">{t.contact.subjectPlaceholder}</option>
                  <option value="general">{t.contact.subjectGeneral}</option>
                  <option value="buying">{t.contact.subjectBuying}</option>
                  <option value="selling">{t.contact.subjectSelling}</option>
                  <option value="payment">{t.contact.subjectPayment}</option>
                  <option value="dispute">{t.contact.subjectDispute}</option>
                  <option value="other">{t.contact.subjectOther}</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm text-[var(--muted)]">{t.contact.message}</label>
                <textarea required rows={5} placeholder={t.contact.messagePlaceholder} className="w-full resize-none rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-4 py-3 text-[var(--foreground)] placeholder-[var(--muted)] focus:outline-none" />
              </div>
            </div>
            <button type="submit" className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] py-3.5 font-semibold text-white transition hover:opacity-90">
              <Send className="h-5 w-5" />{t.contact.submit}
            </button>
          </form>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-6">
            <h3 className="mb-4 font-semibold text-[var(--foreground)]">{t.contact.contactInfo}</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 shrink-0 text-[var(--accent-text)]" />
                <a href={`mailto:${SUPPORT_EMAIL}`} className="text-sm text-[var(--muted)] transition hover:text-[var(--accent-text)]">{SUPPORT_EMAIL}</a>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 shrink-0 text-[var(--accent-text)]" />
                {/* dir="ltr" so the number is not reordered by the RTL layout. */}
                <a href={`tel:${SUPPORT_PHONE_E164}`} dir="ltr" className="text-sm text-[var(--muted)] transition hover:text-[var(--accent-text)]">{t.contact.phone}</a>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 shrink-0 text-[var(--accent-text)]" />
                <a href={OFFICE_MAP_URL} target="_blank" rel="noopener noreferrer" className="text-sm text-[var(--muted)] transition hover:text-[var(--accent-text)]">{t.contact.location}</a>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-6">
            <h3 className="mb-2 font-semibold text-[var(--foreground)]">{t.contact.hours}</h3>
            <div className="space-y-2 text-sm text-[var(--muted)]">
              <p>{t.contact.hoursLine1}</p>
              <p>{t.contact.hoursLine2}</p>
              <p>{t.contact.hoursLine3}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
