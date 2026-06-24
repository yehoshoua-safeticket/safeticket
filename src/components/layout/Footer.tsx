'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLocale } from '@/i18n/LocaleProvider';

const HIDDEN_ON = ['/dashboard', '/admin'];

export default function Footer() {
  const pathname = usePathname();
  const { t } = useLocale();
  if (HIDDEN_ON.some((prefix) => pathname.startsWith(prefix))) return null;

  return (
    <footer className="border-t border-white/10 bg-black/20 backdrop-blur-md">
      <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <img src="/logos/st-logo.png" alt="" className="h-8 w-auto" />
              <span className="text-base font-bold text-white">SafeTicket</span>
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-white/50">
              {t.footer.tagline}
            </p>
          </div>

          <div>
            <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-white/40">{t.footer.platform}</h4>
            <ul className="space-y-2.5">
              <li><Link href="/tickets" className="text-sm text-white/60 transition hover:text-white">{t.footer.tickets}</Link></li>
              <li><Link href="/dashboard/sell" className="text-sm text-white/60 transition hover:text-white">{t.footer.sellTicket}</Link></li>
              <li><Link href="/how-it-works" className="text-sm text-white/60 transition hover:text-white">{t.footer.howItWorks}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-white/40">{t.footer.support}</h4>
            <ul className="space-y-2.5">
              <li><Link href="/faq" className="text-sm text-white/60 transition hover:text-white">{t.footer.faq}</Link></li>
              <li><Link href="/contact" className="text-sm text-white/60 transition hover:text-white">{t.footer.contact}</Link></li>
              <li><Link href="/support" className="text-sm text-white/60 transition hover:text-white">{t.footer.disputes}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-white/40">{t.footer.legal}</h4>
            <ul className="space-y-2.5">
              <li><Link href="/terms" className="text-sm text-white/60 transition hover:text-white">{t.footer.terms}</Link></li>
              <li><Link href="/privacy" className="text-sm text-white/60 transition hover:text-white">{t.footer.privacy}</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-6">
          <p className="text-center text-xs text-white/35">{t.footer.copyright}</p>
        </div>
      </div>
    </footer>
  );
}
