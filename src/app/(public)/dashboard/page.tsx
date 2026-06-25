'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShoppingBag, Tag, ShieldCheck, AlertTriangle, Settings, Loader2 } from 'lucide-react';
import VerificationBanner from '@/components/ui/VerificationBanner';
import DashboardCard from '@/components/ui/DashboardCard';
import { createClient } from '@/lib/supabase';
import type { Profile, Listing, Order } from '@/types/database';
import { useLocale } from '@/i18n/LocaleProvider';

export default function DashboardPage() {
  const { t } = useLocale();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [activeListings, setActiveListings] = useState(0);
  const [myOrders, setMyOrders] = useState(0);
  const [openDisputes, setOpenDisputes] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [{ data: profileData }, { data: listings }, { data: orders }, { count: disputeCount }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('listings').select('id').eq('seller_id', user.id).eq('status', 'active'),
        supabase.from('orders').select('id').eq('buyer_id', user.id),
        supabase.from('disputes').select('id', { count: 'exact', head: true }).eq('opened_by', user.id).in('status', ['open', 'under_review']),
      ]);

      if (!profileData) {
        // Profile not yet created — build one from auth metadata
        const meta = user.user_metadata;
        setProfile({
          id: user.id,
          full_name: meta?.full_name || user.email?.split('@')[0] || '',
          email: user.email || '',
          phone: meta?.phone || null,
          role: 'external_user',
          verification_status: 'unverified',
          avatar_url: null,
          created_at: user.created_at,
        } as Profile);
      } else {
        setProfile(profileData);
      }

      setActiveListings(listings?.length ?? 0);
      setMyOrders(orders?.length ?? 0);
      setOpenDisputes(disputeCount ?? 0);
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

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-8 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-[var(--foreground)]">{t.dashboard.title.replace('{name}', profile.full_name)}</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">{t.dashboard.subtitle}</p>
        </div>
        <Link href="/settings" className="shrink-0 rounded-lg bg-[var(--input-bg)] p-2 text-[var(--muted)] transition hover:text-[var(--foreground)]">
          <Settings className="h-5 w-5" />
        </Link>
      </div>

      <div className="mb-8">
        <VerificationBanner status={profile.verification_status} />
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <DashboardCard title={t.dashboard.myOrders} value={myOrders} icon={ShoppingBag} color="blue" />
        <DashboardCard title={t.dashboard.activeListings} value={activeListings} icon={Tag} color="emerald" />
        <DashboardCard title={t.dashboard.verificationStatus} value={(t.status as Record<string, string>)[profile.verification_status] ?? profile.verification_status} icon={ShieldCheck} color={profile.verification_status === 'verified' ? 'emerald' : 'yellow'} />
        <DashboardCard title={t.dashboard.openDisputes} value={openDisputes} icon={AlertTriangle} color="red" />
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Link href="/dashboard/buyer" className="group rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-6 transition hover:border-[var(--input-border)]">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-50 p-3">
              <ShoppingBag className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-[var(--foreground)] group-hover:text-[var(--accent-text)]">{t.dashboard.buyerTitle}</h3>
              <p className="text-sm text-[var(--muted)]">{t.dashboard.buyerDesc}</p>
            </div>
          </div>
        </Link>
        <Link href="/dashboard/seller" className="group rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-6 transition hover:border-[var(--input-border)]">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-[var(--accent-soft)] p-3">
              <Tag className="h-6 w-6 text-[var(--accent-text)]" />
            </div>
            <div>
              <h3 className="font-semibold text-[var(--foreground)] group-hover:text-[var(--accent-text)]">{t.dashboard.sellerTitle}</h3>
              <p className="text-sm text-[var(--muted)]">{t.dashboard.sellerDesc}</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
