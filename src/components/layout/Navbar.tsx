'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X, User, LogOut, Loader2, Search } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { logout } from '@/app/(public)/auth/actions';
import { useLocale } from '@/i18n/LocaleProvider';
import LocaleSwitcher from '@/components/ui/LocaleSwitcher';
import type { User as SupabaseUser } from '@supabase/supabase-js';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const { t } = useLocale();

  const navLinks = [
    { href: '/tickets', label: t.nav.tickets },
    { href: '/how-it-works', label: t.nav.howItWorks },
    { href: '/faq', label: t.nav.faq },
  ];

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => { setUser(user); setLoading(false); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => setUser(session?.user ?? null));
    return () => subscription.unsubscribe();
  }, []);

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || '';

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--chrome-border)] bg-[var(--chrome)] text-white">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="flex h-14 items-center justify-between gap-4">
          <Link href="/" className="flex shrink-0 items-center gap-2.5">
            <img src="/logos/st-logo.png" alt="SafeTicket" className="h-8 w-auto" />
            <span className="font-[family-name:var(--font-display)] text-[1.15rem] font-extrabold tracking-tight">
              <span className="text-white">Safe</span><span style={{ color: 'var(--accent-on-dark)' }}>Ticket</span>
            </span>
          </Link>

          <div className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-md px-3.5 py-2 text-[0.78rem] font-bold uppercase tracking-wider text-white/70 transition-colors hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden items-center gap-3 md:flex">
            <Link href="/tickets" aria-label={t.nav.tickets} className="rounded-md p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white">
              <Search className="h-[18px] w-[18px]" />
            </Link>
            <LocaleSwitcher compact />
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin text-white/50" />
            ) : user ? (
              <>
                <Link href="/dashboard" className="flex items-center gap-2 rounded-md border border-white/20 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-white/10">
                  <User className="h-4 w-4" /><span className="max-w-[120px] truncate">{displayName}</span>
                </Link>
                <form action={logout}>
                  <button type="submit" className="rounded-md p-2 text-white/70 transition-colors hover:text-red-400" title={t.nav.logoutTitle}>
                    <LogOut className="h-[18px] w-[18px]" />
                  </button>
                </form>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="rounded-md px-3 py-2 text-[0.78rem] font-bold uppercase tracking-wider text-white/70 transition-colors hover:text-white">
                  {t.nav.login}
                </Link>
                <Link href="/auth/signup" className="rounded-md bg-[var(--accent)] px-4 py-2 text-[0.78rem] font-bold uppercase tracking-wider text-white transition-colors hover:bg-[var(--accent-hover)]">
                  {t.nav.signup}
                </Link>
              </>
            )}
          </div>

          <button onClick={() => setIsOpen(!isOpen)} className="rounded-md p-2 text-white md:hidden" aria-label="Menu">
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="border-t border-[var(--chrome-border)] bg-[var(--chrome)] md:hidden">
          <div className="space-y-1 px-5 py-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className="block rounded-md px-4 py-3 text-sm font-bold uppercase tracking-wider text-white/70 hover:bg-white/10 hover:text-white"
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-4 border-t border-[var(--chrome-border)] pt-4">
              <div className="mb-3 flex justify-center">
                <LocaleSwitcher />
              </div>
              {user ? (
                <div className="flex items-center gap-3">
                  <Link href="/dashboard" onClick={() => setIsOpen(false)} className="flex flex-1 items-center justify-center gap-2 rounded-md border border-white/20 py-2.5 text-sm text-white">
                    <User className="h-4 w-4" />{displayName}
                  </Link>
                  <form action={logout}>
                    <button type="submit" className="rounded-md border border-white/20 p-2.5 text-white/70">
                      <LogOut className="h-4 w-4" />
                    </button>
                  </form>
                </div>
              ) : (
                <div className="flex gap-3">
                  <Link href="/auth/login" onClick={() => setIsOpen(false)} className="flex-1 rounded-md border border-white/20 py-2.5 text-center text-sm font-bold uppercase tracking-wider text-white">
                    {t.nav.login}
                  </Link>
                  <Link href="/auth/signup" onClick={() => setIsOpen(false)} className="flex-1 rounded-md bg-[var(--accent)] py-2.5 text-center text-sm font-bold uppercase tracking-wider text-white">
                    {t.nav.signup}
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
