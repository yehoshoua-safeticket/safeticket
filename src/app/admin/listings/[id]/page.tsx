'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { ArrowRight, Save, Trash2 } from 'lucide-react';
import { useLocale } from '@/i18n/LocaleProvider';
import type { Listing, ListingStatus, RiskStatus } from '@/types/database';

export default function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { t } = useLocale();
  const router = useRouter();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<ListingStatus>('pending_review');
  const [riskStatus, setRiskStatus] = useState<RiskStatus>('clear');
  const [section, setSection] = useState('');
  const [row, setRow] = useState('');
  const [seatInfo, setSeatInfo] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [askingPrice, setAskingPrice] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const STATUS_OPTIONS: { value: ListingStatus; label: string }[] = [
    { value: 'draft', label: t.status.draft },
    { value: 'pending_review', label: t.status.pending_review },
    { value: 'active', label: t.status.active },
    { value: 'sold', label: t.status.sold },
    { value: 'rejected', label: t.status.rejected },
    { value: 'expired', label: t.status.expired },
  ];

  const RISK_OPTIONS: { value: RiskStatus; label: string }[] = [
    { value: 'clear', label: t.status.clear },
    { value: 'flagged', label: t.status.flagged },
    { value: 'under_review', label: t.status.under_review },
    { value: 'blocked', label: t.status.blocked },
  ];

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from('listings')
        .select('*, event:events(*), seller:profiles(*)')
        .eq('id', id)
        .single();
      if (data) {
        const l = data as Listing;
        setListing(l);
        setStatus(l.status);
        setRiskStatus(l.risk_status);
        setSection(l.section || '');
        setRow(l.row || '');
        setSeatInfo(l.seat_info || '');
        setQuantity(l.quantity);
        setAskingPrice(l.asking_price);
      }
      setLoading(false);
    }
    load();
  }, [id]);

  async function handleSave() {
    setError('');
    setSaved(false);
    // Mirror the DB CHECK constraints so the user gets a clear message instead of a raw Postgres error.
    if (quantity < 1) { setError(t.admin.listingDetail.errorQuantity); return; }
    if (askingPrice <= 0) { setError(t.admin.listingDetail.errorAskingPositive); return; }
    if (listing && askingPrice > listing.face_value) { setError(t.admin.listingDetail.errorAskingMax); return; }
    setSaving(true);
    const supabase = createClient();
    const { error: err } = await supabase
      .from('listings')
      .update({ status, risk_status: riskStatus, section, row, seat_info: seatInfo, quantity, asking_price: askingPrice })
      .eq('id', id);
    setSaving(false);
    if (err) {
      setError(err.message || t.admin.listingDetail.errorSave);
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  }

  async function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setDeleting(true);
    setError('');
    const supabase = createClient();
    const { error: err } = await supabase.from('listings').delete().eq('id', id);
    if (err) {
      setError(err.message || t.admin.listingDetail.errorDelete);
      setDeleting(false);
      setConfirmDelete(false);
    } else {
      router.push('/admin/listings');
    }
  }

  const inputClass = 'rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] px-3 py-2 text-sm focus:outline-none';

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <div className="mb-8 flex items-center gap-4">
        <button
          onClick={() => router.push('/admin/listings')}
          className="rounded-lg p-2 text-[var(--muted)] transition hover:bg-[var(--input-bg)] hover:text-[var(--foreground)]"
        >
          <ArrowRight className="h-5 w-5 rtl:rotate-180" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-[var(--foreground)]">{listing?.event?.title || t.admin.listingDetail.defaultTitle}</h1>
          <p className="text-sm text-[var(--muted)]">{t.admin.listingDetail.subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          {confirmDelete ? (
            <span className="flex items-center gap-1.5">
              <span className="text-sm text-red-600">{t.admin.listingDetail.deleteConfirm}</span>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? t.common.deleting : t.common.confirm}
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="rounded-lg border border-[var(--input-border)] px-3 py-1.5 text-sm text-[var(--muted)] hover:bg-[var(--input-bg)]"
              >
                {t.common.cancel}
              </button>
            </span>
          ) : (
            <button
              onClick={handleDelete}
              className="rounded-lg p-2 text-[var(--muted)] transition hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {saved ? t.common.saved : saving ? t.common.saving : t.common.save}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {loading ? (
        <div className="py-12 text-center text-sm text-[var(--muted)]">{t.common.loading}</div>
      ) : !listing ? (
        <div className="py-12 text-center text-sm text-red-600">{t.admin.listingDetail.notFound}</div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-[var(--card-border)] bg-[var(--card)]">
          <div className="divide-y divide-[var(--card-border)]">
            <div className="flex items-center gap-4 px-5 py-4">
              <span className="w-32 shrink-0 text-sm text-[var(--muted)]">{t.admin.listingDetail.fieldEvent}</span>
              <button
                onClick={() => listing.event_id && router.push(`/admin/events/${listing.event_id}`)}
                className="text-sm text-[var(--accent)] hover:underline"
              >
                {listing.event?.title || listing.event_id}
              </button>
            </div>

            <div className="flex items-center gap-4 px-5 py-4">
              <span className="w-32 shrink-0 text-sm text-[var(--muted)]">{t.admin.listingDetail.fieldSeller}</span>
              <button
                onClick={() => router.push(`/admin/external_users/${listing.seller_id}`)}
                className="text-sm text-[var(--accent)] hover:underline"
              >
                {listing.seller?.full_name || listing.seller_id}
              </button>
            </div>

            <div className="flex items-center gap-4 px-5 py-4">
              <span className="w-32 shrink-0 text-sm text-[var(--muted)]">{t.admin.listingDetail.fieldFaceValue}</span>
              <span className="text-sm text-[var(--foreground)]">₪{listing.face_value}</span>
            </div>

            <div className="flex items-center gap-4 px-5 py-4">
              <span className="w-32 shrink-0 text-sm text-[var(--muted)]">{t.admin.listingDetail.fieldCreated}</span>
              <span className="text-sm text-[var(--foreground)]">
                {new Date(listing.created_at).toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            </div>

            <div className="flex items-center gap-4 px-5 py-4">
              <span className="w-32 shrink-0 text-sm text-[var(--muted)]">{t.admin.listingDetail.fieldStatus}</span>
              <select value={status} onChange={(e) => setStatus(e.target.value as ListingStatus)} className={inputClass}>
                {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            <div className="flex items-center gap-4 px-5 py-4">
              <span className="w-32 shrink-0 text-sm text-[var(--muted)]">{t.admin.listingDetail.fieldRisk}</span>
              <select value={riskStatus} onChange={(e) => setRiskStatus(e.target.value as RiskStatus)} className={inputClass}>
                {RISK_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            <div className="flex items-center gap-4 px-5 py-4">
              <span className="w-32 shrink-0 text-sm text-[var(--muted)]">{t.admin.listingDetail.fieldSection}</span>
              <input type="text" value={section} onChange={(e) => setSection(e.target.value)} className={inputClass} />
            </div>

            <div className="flex items-center gap-4 px-5 py-4">
              <span className="w-32 shrink-0 text-sm text-[var(--muted)]">{t.admin.listingDetail.fieldRow}</span>
              <input type="text" value={row} onChange={(e) => setRow(e.target.value)} className={inputClass} />
            </div>

            <div className="flex items-center gap-4 px-5 py-4">
              <span className="w-32 shrink-0 text-sm text-[var(--muted)]">{t.admin.listingDetail.fieldSeatInfo}</span>
              <input type="text" value={seatInfo} onChange={(e) => setSeatInfo(e.target.value)} className={inputClass} />
            </div>

            <div className="flex items-center gap-4 px-5 py-4">
              <span className="w-32 shrink-0 text-sm text-[var(--muted)]">{t.admin.listingDetail.fieldQuantity}</span>
              <input type="number" min={1} value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} className={inputClass} />
            </div>

            <div className="flex items-center gap-4 px-5 py-4">
              <span className="w-32 shrink-0 text-sm text-[var(--muted)]">{t.admin.listingDetail.fieldAskingPrice}</span>
              <input type="number" min={0} value={askingPrice} onChange={(e) => setAskingPrice(Number(e.target.value))} className={inputClass} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
