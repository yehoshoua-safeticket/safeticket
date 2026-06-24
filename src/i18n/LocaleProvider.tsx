'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { he } from './he';
import { en } from './en';
import type { Translations } from './he';

export type Locale = 'he' | 'en';

const translations: Record<Locale, Translations> = { he, en };

interface LocaleContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: Translations;
  dir: 'rtl' | 'ltr';
}

const LocaleContext = createContext<LocaleContextValue>({
  locale: 'he',
  setLocale: () => {},
  t: he,
  dir: 'rtl',
});

export function LocaleProvider({
  children,
  initialLocale = 'he',
}: {
  children: ReactNode;
  initialLocale?: Locale;
}) {
  const router = useRouter();
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    document.cookie = `locale=${next};path=/;max-age=31536000;SameSite=Lax`;
    document.documentElement.lang = next;
    document.documentElement.dir = next === 'he' ? 'rtl' : 'ltr';
    router.refresh();
  }, [router]);

  const dir: 'rtl' | 'ltr' = locale === 'he' ? 'rtl' : 'ltr';

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t: translations[locale], dir }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextValue {
  return useContext(LocaleContext);
}
