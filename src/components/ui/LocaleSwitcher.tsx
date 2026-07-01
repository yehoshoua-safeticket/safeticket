'use client';

import { useState, useRef, useEffect } from 'react';
import { useLocale, type Locale } from '@/i18n/LocaleProvider';

const options: { locale: Locale; flag: string }[] = [
  { locale: 'he', flag: '🇮🇱' },
  { locale: 'en', flag: '🇺🇸' },
];

// Shows only the CURRENT language's flag; clicking opens a small list to choose.
export default function LocaleSwitcher({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale, t } = useLocale();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const current = options.find((o) => o.locale === locale) ?? options[0];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 rounded px-2 py-1.5 text-sm transition-colors hover:bg-current/10"
        aria-haspopup="listbox"
        aria-expanded={open}
        title={t.language.label}
      >
        <span className="text-base leading-none">{current.flag}</span>
        {!compact && <span>{t.language[current.locale]}</span>}
      </button>
      {open && (
        <div className="absolute end-0 z-50 mt-1 min-w-[9rem] overflow-hidden rounded border border-[var(--card-border)] bg-[var(--card)] shadow-lg" role="listbox">
          {options.map(({ locale: l, flag }) => (
            <button
              key={l}
              type="button"
              onClick={() => { setLocale(l); setOpen(false); }}
              role="option"
              aria-selected={locale === l}
              className={`flex w-full items-center gap-2 px-3 py-2 text-start text-sm transition-colors ${
                locale === l
                  ? 'bg-[var(--surface-2)] font-semibold text-[var(--foreground)]'
                  : 'text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--foreground)]'
              }`}
            >
              <span className="text-base leading-none">{flag}</span>
              {t.language[l]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
