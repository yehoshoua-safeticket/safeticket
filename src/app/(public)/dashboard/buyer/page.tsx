'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShoppingBag, Clock, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import DashboardCard from '@/components/ui/DashboardCard';
import StatusBadge from '@/components/ui/StatusBadge';
import EmptyState from '@/components/ui/EmptyState';
import { createClient } from '@/lib/supabase';
import type { Order, Dispute } from '@/types/database';
import { useLocale } from '@/i18n/LocaleProvider';

export default function BuyerDashboardPage() {
  const { t, locale } = useLocale();
  const dateLocale = locale === 'he' ? 'he-IL' : 'en-US';
  const [orders, setOrders] = useState<Order[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [{ data: ordersData }, { data: disputesData }] = await Promise.all([
        supabase.from('orders').select('*, listing:listings(*, event:events(*))').eq('buyer_id', user.id).order('created_at', { ascending: false }),
        supabase.from('disputes').select('*').eq('opened_by', user.id).order('created_at', { ascending: false }),
      ]);

      setOrders(ordersData ?? []);
      setDisputes(disputesData ?? []);
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

  const pendingOrders = orders.filter((o) => o.order_status === 'pending' || o.order_status === 'confirmed');
  const completedOrders = orders.filter((o) => o.order_status === 'completed');
  const openDisputes = disputes.filter((d) => d.status === 'open' || d.status === 'under_review');

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--foreground)]">{t.buyer.title}</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">{t.buyer.subtitle}</p>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <DashboardCard title={t.buyer.totalOrders} value={orders.length} icon={ShoppingBag} color="blue" />
        <DashboardCard title={t.buyer.pendingOrders} value={pendingOrders.length} icon={Clock} color="yellow" />
        <DashboardCard title={t.buyer.completedOrders} value={completedOrders.length} icon={CheckCircle} color="emerald" />
        <DashboardCard title={t.buyer.disputes} value={openDisputes.length} icon={AlertTriangle} color="red" />
      </div>

      <div className="mb-8">
        <h2 className="mb-4 text-lg font-semibold text-[var(--foreground)]">{t.buyer.recentOrders}</h2>
        {orders.length > 0 ? (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-[var(--foreground)]">{(order as any).listing?.event?.title || t.buyer.eventFallback}</p>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      {t.buyer.orderPrefix}{order.id.slice(-4)} · {new Date(order.created_at).toLocaleDateString(dateLocale)}
                    </p>
                  </div>
                  <StatusBadge status={order.order_status} />
                </div>
                <div className="mt-4 grid grid-cols-1 gap-4 border-t border-[var(--card-border)] pt-4 text-sm sm:grid-cols-3">
                  <div>
                    <p className="text-[var(--muted)]">{t.buyer.amount}</p>
                    <p className="font-medium text-[var(--foreground)]">₪{order.total_amount}</p>
                  </div>
                  <div>
                    <p className="text-[var(--muted)]">{t.buyer.payment}</p>
                    <StatusBadge status={order.payment_status} />
                  </div>
                  <div>
                    <p className="text-[var(--muted)]">{t.buyer.sellerPayout}</p>
                    <StatusBadge status={order.payout_status} />
                  </div>
                </div>
                {order.order_status !== 'completed' && order.order_status !== 'cancelled' && (
                  <div className="mt-4 flex gap-3">
                    <Link href="/support" className="rounded-lg border border-[var(--input-border)] px-4 py-2 text-sm text-[var(--muted)] transition hover:bg-[var(--input-bg)] hover:text-[var(--foreground)]">
                      {t.buyer.openDispute}
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <EmptyState icon={ShoppingBag} title={t.buyer.emptyTitle} description={t.buyer.emptyDesc} action={{ label: t.buyer.emptyAction, href: '/tickets' }} />
        )}
      </div>

      {disputes.length > 0 && (
        <div>
          <h2 className="mb-4 text-lg font-semibold text-[var(--foreground)]">{t.buyer.disputesSection}</h2>
          <div className="space-y-4">
            {disputes.map((dispute) => (
              <div key={dispute.id} className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-[var(--foreground)]">{t.buyer.disputePrefix}{dispute.id.slice(-4)}</p>
                    <p className="mt-1 text-sm text-[var(--muted)]">{dispute.reason}</p>
                  </div>
                  <StatusBadge status={dispute.status} />
                </div>
                {dispute.admin_resolution && (
                  <div className="mt-3 rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] p-3">
                    <p className="text-xs text-[var(--muted)]">{t.buyer.resolution}</p>
                    <p className="mt-0.5 text-sm text-[var(--foreground)]">{dispute.admin_resolution}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
