'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLocale } from '@/i18n/LocaleProvider';
import Logo from '@/components/ui/Logo';
import { FaXTwitter, FaInstagram, FaFacebookF, FaYoutube } from 'react-icons/fa6';

const HIDDEN_ON = ['/dashboard', '/admin'];

export default function Footer() {
  const pathname = usePathname();
  const { t } = useLocale();
  if (HIDDEN_ON.some((prefix) => pathname.startsWith(prefix))) return null;

  return (
    <footer className="border-t border-[var(--chrome-border)] bg-[var(--chrome)] text-white/70">
      <div className="mx-auto max-w-6xl px-5 pt-12 sm:px-8">
        {/* Brand */}
        <div>
          <Link href="/" className="flex items-center">
            <Logo white className="h-5 w-auto" />
          </Link>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/70">
            {t.footer.tagline}
          </p>
          <div className="mt-4 flex items-center gap-4">
            <a href="#" aria-label="X" className="text-white/70 transition hover:text-[var(--accent-on-dark)]">
              <FaXTwitter className="h-5 w-5" aria-hidden />
            </a>
            <a href="#" aria-label="Instagram" className="text-white/70 transition hover:text-[var(--accent-on-dark)]">
              <FaInstagram className="h-5 w-5" aria-hidden />
            </a>
            <a href="#" aria-label="Facebook" className="text-white/70 transition hover:text-[var(--accent-on-dark)]">
              <FaFacebookF className="h-5 w-5" aria-hidden />
            </a>
            <a href="#" aria-label="YouTube" className="text-white/70 transition hover:text-[var(--accent-on-dark)]">
              <FaYoutube className="h-5 w-5" aria-hidden />
            </a>
          </div>
        </div>

        {/* Columns */}
        <div className="mt-10 grid grid-cols-3 gap-6 sm:mt-12 sm:gap-8">
          <div>
            <h4 className="mb-3 text-sm font-bold uppercase tracking-wider text-white">{t.footer.platform}</h4>
            <ul className="space-y-2.5">
              <li><Link href="/tickets" className="text-sm font-bold text-white/70 transition hover:text-[var(--accent-on-dark)]">{t.footer.tickets}</Link></li>
              <li><Link href="/dashboard/sell" className="text-sm font-bold text-white/70 transition hover:text-[var(--accent-on-dark)]">{t.footer.sellTicket}</Link></li>
              <li><Link href="/how-it-works" className="text-sm font-bold text-white/70 transition hover:text-[var(--accent-on-dark)]">{t.footer.howItWorks}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-bold uppercase tracking-wider text-white">{t.footer.support}</h4>
            <ul className="space-y-2.5">
              <li><Link href="/faq" className="text-sm font-bold text-white/70 transition hover:text-[var(--accent-on-dark)]">{t.footer.faq}</Link></li>
              <li><Link href="/contact" className="text-sm font-bold text-white/70 transition hover:text-[var(--accent-on-dark)]">{t.footer.contact}</Link></li>
              <li><Link href="/support" className="text-sm font-bold text-white/70 transition hover:text-[var(--accent-on-dark)]">{t.footer.disputes}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-bold uppercase tracking-wider text-white">{t.footer.legal}</h4>
            <ul className="space-y-2.5">
              <li><Link href="/terms" className="text-sm font-bold text-white/70 transition hover:text-[var(--accent-on-dark)]">{t.footer.terms}</Link></li>
              <li><Link href="/privacy" className="text-sm font-bold text-white/70 transition hover:text-[var(--accent-on-dark)]">{t.footer.privacy}</Link></li>
            </ul>
          </div>
        </div>
      </div>

      {/* Footer of the footer */}
      <div className="mt-10 border-t border-[var(--chrome-border)] py-4">
        <p className="mx-auto max-w-6xl px-5 text-center text-xs text-white/50 sm:px-8">
          {t.footer.copyright}
        </p>
      </div>
    </footer>
  );
}
