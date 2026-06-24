'use client';

import { useLocale, type Locale } from '@/i18n/LocaleProvider';

const options: { locale: Locale; flag: string }[] = [
  { locale: 'he', flag: '🇮🇱' },
  { locale: 'en', flag: '🇺🇸' },
];

export default function LocaleSwitcher({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale, t } = useLocale();

  return (
    <div className="flex items-center gap-1">
      {options.map(({ locale: l, flag }) => (
        <button
          key={l}
          onClick={() => setLocale(l)}
          title={t.language[l]}
          className={`flex items-center gap-1 rounded-md px-2 py-1 text-sm transition-colors ${
            locale === l
              ? 'bg-[var(--accent)] text-[var(--accent-text)] font-medium'
              : 'hover:bg-[var(--accent-soft)] text-[var(--muted)]'
          }`}
        >
          <span>{flag}</span>
          {!compact && <span>{t.language[l]}</span>}
        </button>
      ))}
    </div>
  );
}
