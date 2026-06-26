'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, CalendarDays, Tag, AlertTriangle, MessageCircle, ClipboardList, UserCog, ShieldCheck, Ticket, Star, Image as ImageIcon, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useLocale } from '@/i18n/LocaleProvider';
import LocaleSwitcher from '@/components/ui/LocaleSwitcher';

export default function AdminSidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { t } = useLocale();

  const navItems = [
    { href: '/admin', label: t.sidebar.overview, icon: LayoutDashboard },
    { href: '/admin/events', label: t.sidebar.events, icon: CalendarDays },
    { href: '/admin/featured', label: t.sidebar.featured, icon: Star },
    { href: '/admin/category_covers', label: t.sidebar.categoryCovers, icon: ImageIcon },
    { href: '/admin/external_users', label: t.sidebar.externalUsers, icon: Users },
    { href: '/admin/verifications', label: t.sidebar.verifications, icon: ShieldCheck },
    { href: '/admin/listings', label: t.sidebar.listings, icon: Tag },
    { href: '/admin/disputes', label: t.sidebar.disputes, icon: AlertTriangle },
    { href: '/admin/support', label: t.sidebar.support, icon: MessageCircle },
    { href: '/admin/tasks', label: t.sidebar.tasks, icon: ClipboardList },
    { href: '/admin/internal_users', label: t.sidebar.internalUsers, icon: UserCog },
  ];

  function isActive(href: string) {
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  }

  const nav = (
    <nav className="flex flex-col gap-1 px-3 py-4">
      {navItems.map((item) => {
        const active = isActive(item.href);
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
            <item.icon className="h-[18px] w-[18px]" strokeWidth={1.8} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  const header = (
    <div className="flex flex-col gap-1 border-b border-[var(--card-border)] bg-[var(--surface-2)] px-5 py-4">
      <Link href="/admin" className="flex items-center gap-2.5" onClick={() => setMobileOpen(false)}>
        <span className="flex h-8 w-8 items-center justify-center rounded-md bg-[#1a55e3] text-white">
          <Ticket className="h-[18px] w-[18px]" strokeWidth={2.2} />
        </span>
        <span className="font-[family-name:var(--font-display)] text-lg font-extrabold leading-none">SafeTicket</span>
      </Link>
      <span className="overline ps-0.5 text-[var(--muted)]">BACKOFFICE · ניהול</span>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 border-s border-[var(--card-border)] bg-[var(--surface)] lg:flex lg:flex-col">
        {header}
        <div className="flex-1 overflow-y-auto">{nav}</div>
        <div className="border-t border-[var(--card-border)] px-5 py-3 space-y-2">
          <LocaleSwitcher />
          <Link href="/" className="overline block text-[var(--muted)] transition hover:text-[var(--accent-text)]">
            {t.sidebar.backToSite}
          </Link>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="flex h-14 items-center justify-between border-b border-[var(--card-border)] bg-[var(--surface-2)] px-4 lg:hidden">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#1a55e3] text-white">
            <Ticket className="h-4 w-4" strokeWidth={2.2} />
          </span>
          <span className="font-[family-name:var(--font-display)] text-base font-extrabold">SafeTicket</span>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="rounded-md p-2">
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {mobileOpen && (
        <div className="border-b border-[var(--card-border)] bg-[var(--surface)] lg:hidden">
          {nav}
        </div>
      )}
    </>
  );
}
