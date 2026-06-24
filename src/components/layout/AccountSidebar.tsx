'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  LayoutDashboard, ShoppingBag, Tag, Plus, ShieldCheck,
  Users, CalendarDays, AlertTriangle, MessageCircle, ClipboardList, UserCog,
  Menu, X, LogOut, Settings,
} from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { useLocale } from '@/i18n/LocaleProvider';
import LocaleSwitcher from '@/components/ui/LocaleSwitcher';
import type { UserRole, VerificationStatus } from '@/types/database';

interface Props {
  role: UserRole;
  fullName: string;
  email: string;
  verificationStatus: VerificationStatus;
}

function initials(name: string) {
  return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?';
}

export default function AccountSidebar({ role, fullName, email, verificationStatus }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { t } = useLocale();

  const userNav = [
    { href: '/dashboard', label: t.sidebar.dashboard, icon: LayoutDashboard, exact: true },
    { href: '/dashboard/buyer', label: t.sidebar.myOrders, icon: ShoppingBag },
    { href: '/dashboard/seller', label: t.sidebar.myListings, icon: Tag },
    { href: '/dashboard/sell', label: t.sidebar.sellTicket, icon: Plus },
    { href: '/dashboard/verify', label: t.sidebar.verifyIdentity, icon: ShieldCheck },
    { href: '/settings', label: t.sidebar.settings, icon: Settings },
  ];

  const adminNav = [
    { href: '/admin', label: t.sidebar.overview, icon: LayoutDashboard, exact: true },
    { href: '/admin/events', label: t.sidebar.events, icon: CalendarDays },
    { href: '/admin/external_users', label: t.sidebar.externalUsers, icon: Users },
    { href: '/admin/listings', label: t.sidebar.listings, icon: Tag },
    { href: '/admin/disputes', label: t.sidebar.disputes, icon: AlertTriangle },
    { href: '/admin/support', label: t.sidebar.support, icon: MessageCircle },
    { href: '/admin/tasks', label: t.sidebar.tasks, icon: ClipboardList },
    { href: '/admin/internal_users', label: t.sidebar.internalUsers, icon: UserCog },
  ];

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(href + '/');
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  }

  const navLink = (item: { href: string; label: string; icon: React.ElementType; exact?: boolean }) => {
    const active = isActive(item.href, item.exact);
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={() => setMobileOpen(false)}
        className={`flex items-center gap-3 rounded-e-md border-s-[3px] px-3 py-2.5 text-sm font-semibold transition-colors ${
          active
            ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-text)]'
            : 'border-transparent text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--foreground)]'
        }`}
      >
        <item.icon className="h-[17px] w-[17px] shrink-0" strokeWidth={1.8} />
        <span className="flex-1">{item.label}</span>
      </Link>
    );
  };

  const content = (
    <div className="flex h-full flex-col">
      {/* User info — membership card */}
      <div className="border-b border-[var(--card-border)] bg-[var(--surface-2)] px-4 py-5">
        <span className="overline text-[var(--muted)]">{t.sidebar.myAccount}</span>
        <div className="mt-3 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[var(--accent)] text-sm font-bold text-white">
            {initials(fullName)}
          </div>
          <div className="min-w-0">
            <p className="truncate font-[family-name:var(--font-display)] text-base font-bold leading-tight">{fullName}</p>
            <p className="truncate text-xs text-[var(--muted)]">{email}</p>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <span className="rounded-[4px] border border-[var(--card-border)] px-2 py-0.5 text-[10px] font-bold tracking-wide text-[var(--muted)]">
            {t.roles[role]}
          </span>
          {role === 'external_user' && verificationStatus === 'verified' && (
            <span className="flex items-center gap-1 text-[10px] font-bold tracking-wide text-emerald-400">
              <ShieldCheck className="h-3 w-3" />{t.status.verified}
            </span>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-3">
        <div className="space-y-0.5">
          {userNav.map(navLink)}
        </div>

        {(role === 'admin' || role === 'internal_user') && (
          <div className="mt-5">
            <p className="overline mb-1.5 px-3 text-[var(--muted)]">
              {t.sidebar.management}
            </p>
            <div className="space-y-0.5">
              {adminNav.map(navLink)}
            </div>
          </div>
        )}
      </nav>

      {/* Language + Footer */}
      <div className="border-t border-[var(--card-border)] px-3 py-3 space-y-1">
        <div className="flex items-center gap-2 px-3 py-1.5">
          <span className="text-xs text-[var(--muted)]">{t.language.label}:</span>
          <LocaleSwitcher compact />
        </div>
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[var(--muted)] transition-colors hover:bg-red-500/15 hover:text-red-400"
        >
          <LogOut className="h-[17px] w-[17px] shrink-0" />
          {t.sidebar.logout}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <aside className="hidden w-64 shrink-0 border-s border-[var(--card-border)] bg-[var(--surface)] lg:flex lg:flex-col">
        {content}
      </aside>

      {/* Mobile bar */}
      <div className="flex items-center justify-between border-b border-[var(--card-border)] bg-[var(--card)] px-4 py-3 lg:hidden">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent)] text-xs font-bold text-white">
            {initials(fullName)}
          </div>
          <span className="text-sm font-medium text-[var(--foreground)]">{fullName}</span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="rounded-lg p-2 text-[var(--muted)] transition hover:bg-[var(--input-bg)]"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        >
          <div className="absolute inset-0 bg-black/30" />
          <aside
            className="absolute right-0 top-0 h-full w-72 bg-[var(--card)] shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex h-14 items-center justify-between border-b border-[var(--card-border)] px-4">
              <span className="text-sm font-semibold text-[var(--foreground)]">{t.sidebar.myAccount}</span>
              <button onClick={() => setMobileOpen(false)} className="rounded-lg p-1.5 text-[var(--muted)]">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="h-[calc(100%-3.5rem)] overflow-y-auto">
              {content}
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
