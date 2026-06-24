'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Tag, DollarSign, Clock, XCircle, CheckCircle, Loader2 } from 'lucide-react';
import DashboardCard from '@/components/ui/DashboardCard';
import StatusBadge from '@/components/ui/StatusBadge';
import EmptyState from '@/components/ui/EmptyState';
import { createClient } from '@/lib/supabase';
import type { Listing, Payout } from '@/types/database';
import { useLocale } from '@/i18n/LocaleProvider';

export default function SellerDashboardPage() {
  const { t } = useLocale();
  const [listings, setListings] = useState<Listing[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [{ data: listingsData }, { data: payoutsData }] = await Promise.all([
        supabase.from('listings').select('*, event:events(*)').eq('seller_id', user.id).order('created_at', { ascending: false }),
        supabase.from('payouts').select('*').eq('seller_id', user.id).order('created_at', { ascending: false }),
      ]);

      setListings(listingsData ?? []);
      setPayouts(payoutsData ?? []);
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

  const activeListings = listings.filter((l) => l.status === 'active');
  const soldListings = listings.filter((l) => l.status === 'sold');
  const pendingListings = listings.filter((l) => l.status === 'pending_review');
  const rejectedListings = listings.filter((l) => l.status === 'rejected');
  const pendingPayouts = payouts.filter((p) => p.status === 'held' || p.status === 'pending_release');
  const totalEarned = payouts.filter((p) => p.status === 'released').reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">{t.seller.title}</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">{t.seller.subtitle}</p>
        </div>
        <Link href="/dashboard/sell" className="flex items-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90">
          <Plus className="h-4 w-4" />
          {t.seller.newListing}
        </Link>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <DashboardCard title={t.seller.activeListings} value={activeListings.length} icon={Tag} color="emerald" />
        <DashboardCard title={t.seller.soldListings} value={soldListings.length} icon={CheckCircle} color="blue" />
        <DashboardCard title={t.seller.pendingPayouts} value={pendingPayouts.length} icon={Clock} color="yellow" />
        <DashboardCard title={t.seller.totalEarnings} value={`₪${totalEarned}`} icon={DollarSign} color="purple" />
      </div>

      {/* Payout Timeline */}
      <div className="mb-8 rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-6">
        <h2 className="mb-4 text-lg font-semibold text-[var(--foreground)]">{t.seller.payoutTimeline}</h2>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {[
            { label: t.seller.payoutBuyerPaid, icon: DollarSign, active: true },
            { label: t.seller.payoutEscrow, icon: Clock, active: true },
            { label: t.seller.payoutVerification, icon: CheckCircle, active: false },
            { label: t.seller.payoutReleased, icon: DollarSign, active: false },
          ].map((step, i) => (
            <div key={i} className="flex items-center gap-3 sm:flex-col sm:text-center">
              <div className={`flex h-10 w-10 items-center justify-center rounded-full ${step.active ? 'bg-emerald-50 text-[var(--accent-text)]' : 'bg-[var(--input-bg)] text-[var(--muted)]'}`}>
                <step.icon className="h-5 w-5" />
              </div>
              <span className={`text-sm ${step.active ? 'text-[var(--foreground)]' : 'text-[var(--muted)]'}`}>{step.label}</span>
              {i < 3 && <div className="hidden h-px flex-1 bg-[var(--input-bg)] sm:block" />}
            </div>
          ))}
        </div>
      </div>

      <div className="mb-8">
        <h2 className="mb-4 text-lg font-semibold text-[var(--foreground)]">{t.seller.activeListingsSection}</h2>
        {activeListings.length > 0 ? (
          <div className="space-y-3">
            {activeListings.map((listing) => (
              <div key={listing.id} className="flex items-center justify-between rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-4">
                <div>
                  <p className="font-medium text-[var(--foreground)]">{(listing as any).event?.title}</p>
                  <p className="text-sm text-[var(--muted)]">{t.seller.ticketsSummary.replace('{qty}', String(listing.quantity)).replace('{price}', String(listing.asking_price))}</p>
                </div>
                <StatusBadge status={listing.status} />
              </div>
            ))}
          </div>
        ) : (
          <EmptyState icon={Tag} title={t.seller.emptyActiveTitle} description={t.seller.emptyActiveDesc} action={{ label: t.seller.emptyActiveAction, href: '/dashboard/sell' }} />
        )}
      </div>

      {pendingListings.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-4 text-lg font-semibold text-[var(--foreground)]">{t.seller.pendingApproval}</h2>
          <div className="space-y-3">
            {pendingListings.map((listing) => (
              <div key={listing.id} className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 p-4">
                <div>
                  <p className="font-medium text-[var(--foreground)]">{(listing as any).event?.title}</p>
                  <p className="text-sm text-[var(--muted)]">{t.seller.ticketsSummary.replace('{qty}', String(listing.quantity)).replace('{price}', String(listing.asking_price))}</p>
                </div>
                <StatusBadge status="pending_review" />
              </div>
            ))}
          </div>
        </div>
      )}

      {rejectedListings.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-4 text-lg font-semibold text-[var(--foreground)]">{t.seller.rejectedSection}</h2>
          <div className="space-y-3">
            {rejectedListings.map((listing) => (
              <div key={listing.id} className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 p-4">
                <div>
                  <p className="font-medium text-[var(--foreground)]">{(listing as any).event?.title}</p>
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-600" />
                    <p className="text-sm text-red-600">{t.seller.suspectedFraud}</p>
                  </div>
                </div>
                <StatusBadge status="rejected" />
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="mb-4 text-lg font-semibold text-[var(--foreground)]">{t.seller.payoutsSection}</h2>
        {payouts.length > 0 ? (
          <div className="space-y-3">
            {payouts.map((payout) => (
              <div key={payout.id} className="flex items-center justify-between rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-4">
                <div>
                  <p className="font-medium text-[var(--foreground)]">₪{payout.amount}</p>
                  <p className="text-sm text-[var(--muted)]">{t.seller.orderRef.replace('{id}', payout.order_id.slice(-4))}</p>
                </div>
                <StatusBadge status={payout.status} />
              </div>
            ))}
          </div>
        ) : (
          <EmptyState icon={DollarSign} title={t.seller.emptyPayoutsTitle} description={t.seller.emptyPayoutsDesc} />
        )}
      </div>
    </div>
  );
}
