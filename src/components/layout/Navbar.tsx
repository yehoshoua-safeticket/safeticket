'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import { User, LogOut, Loader2, Globe, ChevronUp } from 'lucide-react';
import MenuToggle from '@/components/ui/MenuToggle';
import Logo from '@/components/ui/Logo';
import { createClient } from '@/lib/supabase';
import { logout } from '@/app/(public)/auth/actions';
import { useLocale } from '@/i18n/LocaleProvider';
import LocaleSwitcher from '@/components/ui/LocaleSwitcher';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import pkg from '../../../package.json';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const { t, locale, setLocale } = useLocale();

  const navLinks = [
    { href: '/tickets', label: t.nav.tickets },
    { href: '/tickets', label: t.nav.buyer },
    { href: '/sell', label: t.nav.seller },
    { href: '/how-it-works', label: t.nav.howItWorks },
    { href: '/faq', label: t.nav.faq },
  ];

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => { setUser(user); setLoading(false); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => setUser(session?.user ?? null));
    return () => subscription.unsubscribe();
  }, []);

  // Lock background scroll while the full-screen mobile menu is open.
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    if (!isOpen) setLangOpen(false);
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || '';

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--chrome-border)] bg-[var(--chrome)] font-[family-name:var(--font-trial)] text-white">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="flex h-14 items-center justify-between gap-4">
          <Link href="/" className="flex shrink-0 items-center">
            <Logo white className="h-5 w-auto" />
          </Link>

          <div className="hidden items-center gap-1 lg:flex">
            {navLinks.map((link, i) => (
              <Link
                key={`${link.href}-${i}`}
                href={link.href}
                className="rounded px-3.5 py-2 text-sm font-bold uppercase tracking-wider text-white/70 transition-colors hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden items-center gap-3 lg:flex">
            <LocaleSwitcher compact />
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin text-white/50" />
            ) : user ? (
              <>
                <Link href="/dashboard" className="flex items-center gap-2 rounded border border-white/20 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-white/10">
                  <User className="h-4 w-4" /><span className="max-w-[120px] truncate">{displayName}</span>
                </Link>
                <form action={logout}>
                  <button type="submit" className="rounded p-2 text-white/70 transition-colors hover:text-red-400" title={t.nav.logoutTitle}>
                    <LogOut className="h-[18px] w-[18px]" />
                  </button>
                </form>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="rounded px-3 py-2 text-sm font-bold uppercase tracking-wider text-white/70 transition-colors hover:text-white">
                  {t.nav.login}
                </Link>
                <Link href="/auth/signup" className="rounded bg-white px-4 py-2 text-sm font-bold uppercase tracking-wider text-[var(--chrome)] transition-colors hover:bg-white/90">
                  {t.nav.signup}
                </Link>
              </>
            )}
          </div>

          <button onClick={() => setIsOpen(!isOpen)} className="inline-flex items-center justify-center rounded p-2 text-white lg:hidden" aria-label="Menu">
            <MenuToggle open={isOpen} className="h-9 w-9" />
          </button>
        </div>
      </div>

      {/* Full-screen mobile menu (sits below the header; the burger morphs to X) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.2, 0.8, 0.3, 1] }}
            className="fixed inset-x-0 bottom-0 top-14 z-[45] flex flex-col overflow-y-auto bg-[var(--chrome)] text-white lg:hidden"
          >
            <nav className="flex flex-col px-6 pt-4">
              {navLinks.map((link, i) => (
                <motion.div
                  key={`${link.href}-${i}`}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.08 + i * 0.09, duration: 0.42, ease: [0.2, 0.8, 0.3, 1] }}
                >
                  <Link
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className="block border-b border-[var(--chrome-border)] py-4 text-2xl font-extrabold uppercase tracking-tight text-white/90 transition-colors hover:text-white"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
            </nav>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.08 + navLinks.length * 0.09, duration: 0.4 }}
              className="mt-auto space-y-3 px-6 pb-8 pt-8"
            >
              {user ? (
                <>
                  <Link href="/dashboard" onClick={() => setIsOpen(false)} className="flex w-full items-center justify-center gap-2 rounded border border-white/20 py-3 text-sm font-medium text-white transition hover:bg-white/10">
                    <User className="h-4 w-4" />{displayName}
                  </Link>
                  <form action={logout}>
                    <button type="submit" className="flex w-full items-center justify-center gap-2 rounded border border-white/20 py-3 text-sm text-white/70 transition hover:text-white">
                      <LogOut className="h-4 w-4" />{t.nav.logoutTitle}
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <Link href="/auth/signup" onClick={() => setIsOpen(false)} className="block w-full rounded bg-white py-3 text-center text-sm font-bold uppercase tracking-wider text-[var(--chrome)] transition hover:bg-white/90">
                    {t.nav.signup}
                  </Link>
                  <Link href="/auth/login" onClick={() => setIsOpen(false)} className="block w-full rounded border border-white/20 py-3 text-center text-sm font-bold uppercase tracking-wider text-white transition hover:bg-white/10">
                    {t.nav.login}
                  </Link>
                </>
              )}

              {/* Language — opens upward (we're at the bottom of the screen) */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setLangOpen((v) => !v)}
                  className="flex w-full items-center justify-between rounded border border-white/20 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10"
                >
                  <span className="flex items-center gap-2"><Globe className="h-4 w-4" />{t.language.label}</span>
                  <ChevronUp className={`h-4 w-4 transition-transform ${langOpen ? '' : 'rotate-180'}`} />
                </button>
                <AnimatePresence>
                  {langOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      transition={{ duration: 0.2, ease: [0.2, 0.8, 0.3, 1] }}
                      className="absolute inset-x-0 bottom-full mb-2 overflow-hidden rounded border border-white/15 bg-[var(--chrome-2)] shadow-xl"
                    >
                      {(['he', 'en'] as const).map((l) => (
                        <button
                          key={l}
                          type="button"
                          onClick={() => { setLocale(l); setLangOpen(false); }}
                          className={`flex w-full items-center px-4 py-3 text-start text-sm transition ${locale === l ? 'bg-white/10 font-semibold text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}
                        >
                          {t.language[l]}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Credit */}
              <p className="pt-1 text-center text-[10px] text-white/30">by Yehoshoua | V.{pkg.version}</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
