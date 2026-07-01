'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { LayoutDashboard, Users, CalendarDays, Tag, AlertTriangle, MessageCircle, ClipboardList, UserCog, ShieldCheck, Star, Image as ImageIcon } from 'lucide-react';
import Logo from '@/components/ui/Logo';
import { useState, useEffect } from 'react';
import { useLocale } from '@/i18n/LocaleProvider';
import LocaleSwitcher from '@/components/ui/LocaleSwitcher';
import MenuToggle from '@/components/ui/MenuToggle';

// Black Pearl chrome to match the public navbar/footer — dark sidebar over the
// light admin content canvas (the site's "dark-chrome / light-content" sandwich).
export default function AdminSidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { t } = useLocale();

  // Lock background scroll while the full-screen mobile menu is open.
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

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

  const wordmark = <Logo white className="h-5 w-auto" />;

  const nav = (
    <nav className="flex flex-col gap-1 px-3 py-4">
      {navItems.map((item) => {
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 rounded-e-lg border-s-[3px] px-3 py-2.5 text-sm font-semibold transition-colors ${
              active
                ? 'border-[var(--accent)] bg-white/10 text-white'
                : 'border-transparent text-white/65 hover:bg-white/10 hover:text-white'
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
    <div className="flex flex-col gap-1.5 border-b border-[var(--chrome-border)] px-5 py-4">
      <Link href="/admin" className="flex items-center" onClick={() => setMobileOpen(false)}>
        {wordmark}
      </Link>
      <span className="overline ps-0.5 text-white/45">BACKOFFICE · ניהול</span>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar — Black Pearl */}
      <aside className="hidden w-60 shrink-0 flex-col bg-[var(--chrome)] text-white lg:flex">
        {header}
        <div className="flex-1 overflow-y-auto">{nav}</div>
        <div className="space-y-2 border-t border-[var(--chrome-border)] px-5 py-3">
          <LocaleSwitcher />
          <Link href="/" className="overline block text-white/55 transition hover:text-[var(--accent-on-dark)]">
            {t.sidebar.backToSite}
          </Link>
        </div>
      </aside>

      {/* Mobile header — Black Pearl */}
      <div className="flex h-14 items-center justify-between bg-[var(--chrome)] px-4 text-white lg:hidden">
        <Link href="/admin" className="flex items-center" onClick={() => setMobileOpen(false)}>
          {wordmark}
        </Link>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="inline-flex items-center justify-center rounded-md p-2 text-white" aria-label="Menu">
          <MenuToggle open={mobileOpen} className="h-9 w-9" />
        </button>
      </div>
      {/* Full-screen mobile menu (below the top bar; the burger morphs to X) */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.2, 0.8, 0.3, 1] }}
            className="fixed inset-x-0 bottom-0 top-14 z-[45] flex flex-col overflow-y-auto bg-[var(--chrome)] text-white lg:hidden"
          >
            <div className="flex flex-col px-4 pt-3">
              {navItems.map((item, i) => {
                const active = isActive(item.href);
                return (
                  <motion.div
                    key={item.href}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.03 + i * 0.035, duration: 0.28, ease: [0.2, 0.8, 0.3, 1] }}
                  >
                    <Link
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 rounded-lg px-3 py-3.5 text-base font-semibold transition-colors ${
                        active ? 'bg-white/10 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <item.icon className="h-5 w-5" strokeWidth={1.8} />
                      {item.label}
                    </Link>
                  </motion.div>
                );
              })}
            </div>
            <div className="mt-auto space-y-3 border-t border-[var(--chrome-border)] px-5 py-4">
              <LocaleSwitcher />
              <Link href="/" onClick={() => setMobileOpen(false)} className="overline block text-white/55 transition hover:text-[var(--accent-on-dark)]">
                {t.sidebar.backToSite}
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
