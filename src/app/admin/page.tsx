'use client';

import { useState, useEffect } from 'react';
import { Users, Tag, Clock, AlertTriangle, ShieldAlert, CalendarPlus } from 'lucide-react';
import DashboardCard from '@/components/ui/DashboardCard';
import StatusBadge from '@/components/ui/StatusBadge';
import { createClient } from '@/lib/supabase';
import { useLocale } from '@/i18n/LocaleProvider';
import type { Listing, Dispute } from '@/types/database';

export default function AdminOverviewPage() {
  const { t } = useLocale();
  const [userCount, setUserCount] = useState(0);
  const [eventCount, setEventCount] = useState(0);
  const [listings, setListings] = useState<Listing[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);

  async function loadData() {
    const supabase = createClient();
    const [profilesRes, eventsRes, listingsRes, disputesRes] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('events').select('id', { count: 'exact', head: true }),
      supabase.from('listings').select('*, event:events(title), seller:profiles(full_name)'),
      supabase.from('disputes').select('*'),
    ]);
    setUserCount(profilesRes.count || 0);
    setEventCount(eventsRes.count || 0);
    setListings((listingsRes.data || []) as Listing[]);
    setDisputes((disputesRes.data || []) as Dispute[]);
  }

  useEffect(() => { loadData(); }, []);

  async function handleListingAction(id: string, status: 'active' | 'rejected') {
    const supabase = createClient();
    await supabase.from('listings').update({ status }).eq('id', id);
    await loadData();
  }

  const pendingListings = listings.filter((l) => l.status === 'pending_review');
  const flaggedListings = listings.filter((l) => l.risk_status === 'flagged' || l.risk_status === 'under_review');
  const openDisputes = disputes.filter((d) => d.status === 'open' || d.status === 'under_review');

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--foreground)]">{t.admin.overview.title}</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">{t.admin.overview.subtitle}</p>
      </div>

      <div className="space-y-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <DashboardCard title={t.admin.overview.users} value={userCount} icon={Users} color="blue" />
          <DashboardCard title={t.admin.overview.events} value={eventCount} icon={CalendarPlus} color="emerald" />
          <DashboardCard title={t.admin.overview.listings} value={listings.length} icon={Tag} color="purple" />
          <DashboardCard title={t.admin.overview.pendingApproval} value={pendingListings.length} icon={Clock} color="yellow" />
          <DashboardCard title={t.admin.overview.openDisputes} value={openDisputes.length} icon={AlertTriangle} color="red" />
          <DashboardCard title={t.admin.overview.fraudAlerts} value={flaggedListings.length} icon={ShieldAlert} color="red" />
        </div>

        {pendingListings.length > 0 && (
          <div>
            <h2 className="mb-4 text-lg font-semibold text-[var(--foreground)]">{t.admin.overview.pendingApproval}</h2>
            <div className="space-y-3">
              {pendingListings.map((listing) => (
                <div key={listing.id} className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <div>
                    <p className="font-medium text-[var(--foreground)]">{listing.event?.title}</p>
                    <p className="text-sm text-[var(--muted)]">{t.admin.overview.seller} {listing.seller?.full_name} · ₪{listing.asking_price}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleListingAction(listing.id, 'active')} className="rounded-lg bg-emerald-50 px-3 py-1.5 text-sm text-[var(--accent-text)] hover:bg-emerald-100">{t.admin.overview.approve}</button>
                    <button onClick={() => handleListingAction(listing.id, 'rejected')} className="rounded-lg bg-red-50 px-3 py-1.5 text-sm text-red-600 hover:bg-red-100">{t.admin.overview.reject}</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {flaggedListings.length > 0 && (
          <div>
            <h2 className="mb-4 text-lg font-semibold text-[var(--foreground)]">{t.admin.overview.fraudAlerts}</h2>
            <div className="space-y-3">
              {flaggedListings.map((listing) => (
                <div key={listing.id} className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 p-4">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    <div>
                      <p className="font-medium text-[var(--foreground)]">{listing.event?.title}</p>
                      <p className="text-sm text-red-600">{t.admin.overview.seller} {listing.seller?.full_name} · {t.status.flagged}: {listing.risk_status}</p>
                    </div>
                  </div>
                  <StatusBadge status={listing.risk_status} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
