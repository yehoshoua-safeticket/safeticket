'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { ArrowRight, Save, Trash2 } from 'lucide-react';
import { useLocale } from '@/i18n/LocaleProvider';
import type { Dispute, DisputeStatus } from '@/types/database';

export default function DisputeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { t } = useLocale();
  const router = useRouter();
  const [dispute, setDispute] = useState<Dispute | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<DisputeStatus>('open');
  const [adminResolution, setAdminResolution] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const STATUS_OPTIONS: { value: DisputeStatus; label: string }[] = [
    { value: 'open', label: t.admin.disputes.statusOpen },
    { value: 'under_review', label: t.admin.disputes.statusUnderReview },
    { value: 'resolved_buyer', label: t.admin.disputes.statusResolvedBuyer },
    { value: 'resolved_seller', label: t.admin.disputes.statusResolvedSeller },
    { value: 'closed', label: t.admin.disputes.statusClosed },
  ];

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from('disputes')
        .select('*, order:orders(id, total_amount, order_status, payment_status)')
        .eq('id', id)
        .single();
      if (data) {
        const d = data as Dispute;
        setDispute(d);
        setStatus(d.status);
        setAdminResolution(d.admin_resolution || '');
      }
      setLoading(false);
    }
    load();
  }, [id]);

  async function handleSave() {
    setSaving(true);
    setError('');
    setSaved(false);
    const supabase = createClient();
    const { error: err } = await supabase
      .from('disputes')
      .update({ status, admin_resolution: adminResolution })
      .eq('id', id);
    setSaving(false);
    if (err) {
      setError(err.message || t.admin.disputeDetail.errorSave);
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
    const { error: err } = await supabase.from('disputes').delete().eq('id', id);
    if (err) {
      setError(err.message || t.admin.disputeDetail.errorDelete);
      setDeleting(false);
      setConfirmDelete(false);
    } else {
      router.push('/admin/disputes');
    }
  }

  const inputClass = 'rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)]';

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <div className="mb-8 flex items-center gap-4">
        <button
          onClick={() => router.push('/admin/disputes')}
          className="rounded-lg p-2 text-[var(--muted)] transition hover:bg-[var(--input-bg)] hover:text-[var(--foreground)]"
        >
          <ArrowRight className="h-5 w-5 rtl:rotate-180" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-[var(--foreground)]">{t.admin.disputeDetail.titlePrefix}{id.slice(-6)}</h1>
          <p className="text-sm text-[var(--muted)]">{t.admin.disputeDetail.subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          {confirmDelete ? (
            <span className="flex items-center gap-1.5">
              <span className="text-sm text-red-600">{t.admin.disputeDetail.deleteConfirm}</span>
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
      ) : !dispute ? (
        <div className="py-12 text-center text-sm text-red-600">{t.admin.disputeDetail.notFound}</div>
      ) : (
        <div className="space-y-4">
          <div className="overflow-hidden rounded-xl border border-[var(--card-border)] bg-[var(--card)]">
            <div className="divide-y divide-[var(--card-border)]">
              <div className="flex items-start gap-4 px-5 py-4">
                <span className="w-32 shrink-0 text-sm text-[var(--muted)]">{t.admin.disputeDetail.fieldReason}</span>
                <span className="text-sm text-[var(--foreground)]">{dispute.reason}</span>
              </div>

              <div className="flex items-center gap-4 px-5 py-4">
                <span className="w-32 shrink-0 text-sm text-[var(--muted)]">{t.admin.disputeDetail.fieldOpenedBy}</span>
                <button
                  onClick={() => router.push(`/admin/external_users/${dispute.opened_by}`)}
                  className="text-sm text-[var(--accent)] hover:underline"
                >
                  {dispute.opened_by}
                </button>
              </div>

              <div className="flex items-center gap-4 px-5 py-4">
                <span className="w-32 shrink-0 text-sm text-[var(--muted)]">{t.admin.disputeDetail.fieldCreated}</span>
                <span className="text-sm text-[var(--foreground)]">
                  {new Date(dispute.created_at).toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              </div>

              {dispute.order && (
                <>
                  <div className="flex items-center gap-4 px-5 py-4">
                    <span className="w-32 shrink-0 text-sm text-[var(--muted)]">{t.admin.disputeDetail.fieldOrderAmount}</span>
                    <span className="text-sm text-[var(--foreground)]">₪{dispute.order.total_amount}</span>
                  </div>
                  <div className="flex items-center gap-4 px-5 py-4">
                    <span className="w-32 shrink-0 text-sm text-[var(--muted)]">{t.admin.disputeDetail.fieldOrderStatus}</span>
                    <span className="text-sm text-[var(--foreground)]">{dispute.order.order_status}</span>
                  </div>
                  <div className="flex items-center gap-4 px-5 py-4">
                    <span className="w-32 shrink-0 text-sm text-[var(--muted)]">{t.admin.disputeDetail.fieldPaymentStatus}</span>
                    <span className="text-sm text-[var(--foreground)]">{dispute.order.payment_status}</span>
                  </div>
                </>
              )}

              <div className="flex items-center gap-4 px-5 py-4">
                <span className="w-32 shrink-0 text-sm text-[var(--muted)]">{t.admin.disputeDetail.fieldStatus}</span>
                <select value={status} onChange={(e) => setStatus(e.target.value as DisputeStatus)} className={inputClass}>
                  {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>

              <div className="flex items-start gap-4 px-5 py-4">
                <span className="w-32 shrink-0 pt-1 text-sm text-[var(--muted)]">{t.admin.disputeDetail.fieldResolution}</span>
                <textarea
                  value={adminResolution}
                  onChange={(e) => setAdminResolution(e.target.value)}
                  rows={4}
                  placeholder={t.admin.disputeDetail.resolutionPlaceholder}
                  className={`${inputClass} w-full resize-none`}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
