'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Loader2, ShieldCheck, Settings, Plus, LifeBuoy, ShoppingBag, Tag,
  Wallet, AlertTriangle, ChevronLeft, Mail, Phone, CalendarDays,
} from 'lucide-react';
import StatusBadge from '@/components/ui/StatusBadge';
import { createClient } from '@/lib/supabase';
import { useLocale } from '@/i18n/LocaleProvider';
import type { Profile, Order, Listing, Payout, Dispute, Event } from '@/types/database';

type OrderRow = Order & { listing?: (Listing & { event?: Event }) | null };
type ListingRow = Listing & { event?: Event | null };

const RECENT = 4;

export default function ProfilePage() {
  const { t } = useLocale();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [listings, setListings] = useState<ListingRow[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [p, o, l, pay, d] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('orders').select('*, listing:listings(*, event:events(*))').eq('buyer_id', user.id).order('created_at', { ascending: false }),
        supabase.from('listings').select('*, event:events(*)').eq('seller_id', user.id).order('created_at', { ascending: false }),
        supabase.from('payouts').select('*').eq('seller_id', user.id),
        supabase.from('disputes').select('*').eq('opened_by', user.id).in('status', ['open', 'under_review']),
      ]);

      setProfile((p.data as Profile) ?? null);
      setOrders((o.data ?? []) as OrderRow[]);
      setListings((l.data ?? []) as ListingRow[]);
      setPayouts((pay.data ?? []) as Payout[]);
      setDisputes((d.data ?? []) as Dispute[]);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--muted)]" />
      </div>
    );
  }

  if (!profile) return null;

  const totalSpent = orders
    .filter((o) => o.order_status !== 'cancelled')
    .reduce((sum, o) => sum + Number(o.total_amount), 0);
  const activeListings = listings.filter((l) => l.status === 'active').length;
  const soldListings = listings.filter((l) => l.status === 'sold').length;
  const earned = payouts.filter((p) => p.status === 'released').reduce((s, p) => s + Number(p.amount), 0);
  const pendingPayout = payouts.filter((p) => p.status !== 'released' && p.status !== 'cancelled').reduce((s, p) => s + Number(p.amount), 0);

  // Someone who has never listed shouldn't be shown a wall of zeros, and vice
  // versa — each side collapses to an invitation until it has something to say.
  const buys = orders.length > 0;
  const sells = listings.length > 0;

  const initials = profile.full_name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  const memberSince = new Date(profile.created_at).toLocaleDateString('he-IL', { month: 'long', year: 'numeric' });

  const card = 'rounded-xl border border-[var(--card-border)] bg-[var(--card)]';

  const stat = (label: string, value: string, Icon: React.ElementType, tone = 'text-[var(--foreground)]') => (
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--input-bg)]">
        <Icon className="h-4 w-4 text-[var(--muted)]" strokeWidth={1.8} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-[var(--muted)]">{label}</p>
        <p className={`truncate text-lg font-bold ${tone}`}>{value}</p>
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--foreground)]">{t.profile.title}</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">{t.profile.subtitle}</p>
      </div>

      {/* Identity */}
      <div className={`${card} p-6`}>
        <div className="flex flex-wrap items-start gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)] text-xl font-bold text-[var(--accent-text)]">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold text-[var(--foreground)]">{profile.full_name}</h2>
              <StatusBadge status={profile.verification_status} />
            </div>
            <div className="mt-3 grid gap-2 text-sm text-[var(--muted)] sm:grid-cols-2">
              <p className="flex items-center gap-2 truncate"><Mail className="h-3.5 w-3.5 shrink-0" />{profile.email}</p>
              {profile.phone && <p className="flex items-center gap-2 truncate"><Phone className="h-3.5 w-3.5 shrink-0" />{profile.phone}</p>}
              <p className="flex items-center gap-2"><CalendarDays className="h-3.5 w-3.5 shrink-0" />{t.profile.memberSince} {memberSince}</p>
            </div>
          </div>
          <Link href="/settings" className="shrink-0 rounded-lg border border-[var(--input-border)] px-3 py-2 text-sm font-medium text-[var(--foreground)] transition hover:bg-[var(--input-bg)]">
            {t.profile.editAccount}
          </Link>
        </div>

        {profile.verification_status !== 'verified' && (
          <div className="mt-5 flex flex-wrap items-center gap-3 rounded-lg border border-[var(--accent)]/30 bg-[var(--accent-soft)] px-4 py-3">
            <ShieldCheck className="h-4 w-4 shrink-0 text-[var(--accent-text)]" />
            <p className="min-w-0 flex-1 text-sm text-[var(--accent-text)]">{t.profile.verifyPrompt}</p>
            <Link href="/dashboard/verify" className="shrink-0 rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90">
              {t.profile.verifyCta}
            </Link>
          </div>
        )}
      </div>

      {/* Buying / selling at a glance */}
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className={`${card} p-5`}>
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-[var(--foreground)]">
            <ShoppingBag className="h-4 w-4 text-[var(--muted)]" />{t.profile.buying}
          </h3>
          {buys ? (
            <div className="space-y-4">
              {stat(t.profile.purchases, String(orders.length), ShoppingBag)}
              {stat(t.profile.totalSpent, `₪${totalSpent.toLocaleString()}`, Wallet)}
              {disputes.length > 0 && stat(t.profile.openDisputes, String(disputes.length), AlertTriangle, 'text-red-600')}
            </div>
          ) : (
            <div className="py-2">
              <p className="text-sm text-[var(--muted)]">{t.profile.noPurchases}</p>
              <Link href="/tickets" className="mt-3 inline-block rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90">
                {t.profile.browseTickets}
              </Link>
            </div>
          )}
        </div>

        <div className={`${card} p-5`}>
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-[var(--foreground)]">
            <Tag className="h-4 w-4 text-[var(--muted)]" />{t.profile.selling}
          </h3>
          {sells ? (
            <div className="space-y-4">
              {stat(t.profile.activeListings, String(activeListings), Tag)}
              {stat(t.profile.sold, String(soldListings), ShoppingBag)}
              {stat(t.profile.earned, `₪${earned.toLocaleString()}`, Wallet, 'text-emerald-600')}
              {pendingPayout > 0 && stat(t.profile.pendingPayout, `₪${pendingPayout.toLocaleString()}`, Wallet)}
            </div>
          ) : (
            <div className="py-2">
              <p className="text-sm text-[var(--muted)]">{t.profile.noListings}</p>
              <Link href="/dashboard/sell" className="mt-3 inline-block rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90">
                {t.profile.sellFirst}
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Recent activity — only the sides that have any */}
      {buys && (
        <section className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[var(--foreground)]">{t.profile.recentPurchases}</h3>
            <Link href="/dashboard/buyer" className="flex items-center gap-1 text-xs text-[var(--accent-text)] hover:underline">
              {t.profile.viewAll}<ChevronLeft className="h-3 w-3 rtl:rotate-180" />
            </Link>
          </div>
          <ul className={`${card} divide-y divide-[var(--card-border)]`}>
            {orders.slice(0, RECENT).map((o) => (
              <li key={o.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[var(--foreground)]">{o.listing?.event?.title || t.profile.eventFallback}</p>
                  <p className="text-xs text-[var(--muted)]">{new Date(o.created_at).toLocaleDateString('he-IL')}</p>
                </div>
                <span className="text-sm font-semibold text-[var(--foreground)]">₪{Number(o.total_amount).toLocaleString()}</span>
                <StatusBadge status={o.order_status} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {sells && (
        <section className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[var(--foreground)]">{t.profile.recentListings}</h3>
            <Link href="/dashboard/seller" className="flex items-center gap-1 text-xs text-[var(--accent-text)] hover:underline">
              {t.profile.viewAll}<ChevronLeft className="h-3 w-3 rtl:rotate-180" />
            </Link>
          </div>
          <ul className={`${card} divide-y divide-[var(--card-border)]`}>
            {listings.slice(0, RECENT).map((l) => (
              <li key={l.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[var(--foreground)]">{l.event?.title || t.profile.eventFallback}</p>
                  <p className="text-xs text-[var(--muted)]">{new Date(l.created_at).toLocaleDateString('he-IL')}</p>
                </div>
                <span className="text-sm font-semibold text-[var(--foreground)]">₪{Number(l.asking_price).toLocaleString()}</span>
                <StatusBadge status={l.status} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Quick actions */}
      <section className="mt-6">
        <h3 className="mb-3 text-sm font-semibold text-[var(--foreground)]">{t.profile.quickActions}</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { href: '/dashboard/sell', label: t.profile.actionSell, icon: Plus },
            { href: '/dashboard/verify', label: t.profile.actionVerify, icon: ShieldCheck },
            { href: '/settings', label: t.profile.actionSettings, icon: Settings },
            { href: '/support', label: t.profile.actionSupport, icon: LifeBuoy },
          ].map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className={`${card} flex items-center gap-2.5 px-4 py-3.5 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--accent)]/40 hover:bg-[var(--input-bg)]`}
            >
              <a.icon className="h-4 w-4 shrink-0 text-[var(--muted)]" strokeWidth={1.8} />
              {a.label}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
