'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, ExternalLink, Check, X, Loader2 } from 'lucide-react';
import StatusBadge from '@/components/ui/StatusBadge';
import { useLocale } from '@/i18n/LocaleProvider';

interface VRow {
  id: string;
  user_id: string;
  document_type: string;
  document_url: string | null;
  status: string;
  reviewed_at: string | null;
  created_at: string;
  signedUrl: string | null;
  user: { id: string; full_name: string; email: string; verification_status: string } | null;
}

export default function VerificationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { t, locale } = useLocale();
  const dateLocale = locale === 'he' ? 'he-IL' : 'en-US';
  const router = useRouter();
  const [row, setRow] = useState<VRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/admin/verifications?id=${id}`).then(async (res) => {
      const data = await res.json();
      setRow(res.ok ? (data.verifications?.[0] ?? null) : null);
      setLoading(false);
    });
  }, [id]);

  async function decide(status: 'verified' | 'rejected') {
    setWorking(true);
    setError('');
    const res = await fetch('/api/admin/verifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ verificationIds: [id], status }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error || t.admin.verifications.errorAction);
      setWorking(false);
      return;
    }
    router.push('/admin/verifications');
  }

  const docLabel = (d: string) => d === 'passport' ? t.admin.verifications.docPassport : d === 'license' ? t.admin.verifications.docLicense : t.admin.verifications.docId;
  const isPdf = (row?.document_url ?? '').toLowerCase().endsWith('.pdf');

  if (loading) {
    return <div className="flex min-h-[40vh] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-[var(--muted)]" /></div>;
  }
  if (!row) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 text-center">
        <p className="text-[var(--muted)]">{t.admin.verifications.notFound}</p>
        <button onClick={() => router.push('/admin/verifications')} className="mt-4 text-sm text-[var(--accent-text)]">{t.common.back}</button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="mb-8 flex items-center gap-4">
        <button onClick={() => router.push('/admin/verifications')} className="rounded-lg p-2 text-[var(--muted)] transition hover:bg-[var(--input-bg)] hover:text-[var(--foreground)]">
          <ArrowRight className="h-5 w-5 rtl:rotate-180" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-[var(--foreground)]">{t.admin.verifications.detailTitle}</h1>
        </div>
        <StatusBadge status={row.status} size="md" />
      </div>

      {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label={t.admin.verifications.fieldName} value={row.user?.full_name || '—'} />
        <Field label={t.admin.verifications.fieldEmail} value={row.user?.email || '—'} />
        <Field label={t.admin.verifications.colDocType} value={docLabel(row.document_type)} />
        <Field label={t.admin.verifications.fieldSubmitted} value={new Date(row.created_at).toLocaleDateString(dateLocale, { day: 'numeric', month: 'long', year: 'numeric' })} />
        {row.reviewed_at && <Field label={t.admin.verifications.fieldReviewed} value={new Date(row.reviewed_at).toLocaleDateString(dateLocale, { day: 'numeric', month: 'long', year: 'numeric' })} />}
      </div>

      <div className="mt-6 rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[var(--foreground)]">{t.admin.verifications.documentTitle}</h2>
          {row.signedUrl && (
            <a href={row.signedUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs text-[var(--accent-text)] hover:underline">
              <ExternalLink className="h-3.5 w-3.5" />{t.admin.verifications.viewDocument}
            </a>
          )}
        </div>
        {!row.signedUrl ? (
          <p className="py-8 text-center text-sm text-[var(--muted)]">{t.admin.verifications.noDocument}</p>
        ) : isPdf ? (
          <iframe src={row.signedUrl} className="h-[480px] w-full rounded-lg border border-[var(--card-border)]" title={t.admin.verifications.documentTitle} />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={row.signedUrl} alt={t.admin.verifications.documentTitle} className="mx-auto max-h-[480px] rounded-lg border border-[var(--card-border)]" />
        )}
      </div>

      <div className="mt-6 flex gap-3">
        <button onClick={() => decide('verified')} disabled={working} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--accent)] py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60">
          {working ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}{t.admin.verifications.approve}
        </button>
        <button onClick={() => decide('rejected')} disabled={working} className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-60">
          <X className="h-4 w-4" />{t.admin.verifications.reject}
        </button>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-[var(--muted)]">{label}</label>
      <p className="rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] px-3 py-2.5 text-sm text-[var(--foreground)]">{value}</p>
    </div>
  );
}
