'use client';

import { useEffect, useRef, useState } from 'react';
import { Upload, ShieldCheck, Clock, Check, Loader2 } from 'lucide-react';
import VerificationBanner from '@/components/ui/VerificationBanner';
import { createClient } from '@/lib/supabase';
import { useLocale } from '@/i18n/LocaleProvider';
import type { VerificationStatus } from '@/types/database';

export default function VerifyPage() {
  const { t } = useLocale();
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>('unverified');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [docType, setDocType] = useState('id');

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data } = await supabase.from('profiles').select('verification_status').eq('id', user.id).single();
      if (data) setVerificationStatus(data.verification_status as VerificationStatus);
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) { setError(t.verify.errorNoFile); return; }
    setLoading(true);
    setError('');
    const body = new FormData();
    body.append('file', file);
    body.append('document_type', docType);
    const res = await fetch('/api/verification', { method: 'POST', body });
    setLoading(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error || t.verify.errorGeneric);
      return;
    }
    setVerificationStatus('pending');
    setSubmitted(true);
  }

  if (verificationStatus === 'pending' || verificationStatus === 'verified') {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[var(--foreground)]">{t.verify.title}</h1>
        </div>
        <VerificationBanner status={verificationStatus} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--foreground)]">{t.verify.title}</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">{t.verify.subtitle}</p>
      </div>

      <div className="mb-8">
        <VerificationBanner status={verificationStatus} />
      </div>

      {submitted ? (
        <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
            <Check className="h-8 w-8 text-[var(--accent-text)]" />
          </div>
          <h2 className="text-xl font-bold text-[var(--foreground)]">{t.verify.submittedTitle}</h2>
          <p className="mt-3 text-[var(--muted)]">{t.verify.submittedDesc}</p>
          <div className="mt-6 flex items-center justify-center gap-2 text-sm text-amber-700">
            <Clock className="h-4 w-4" />
            <span>{t.verify.pendingStatus}</span>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

          <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-6">
            <h2 className="mb-4 text-lg font-semibold text-[var(--foreground)]">{t.verify.personalInfo}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm text-[var(--muted)]">{t.verify.fullName}</label>
                <input type="text" required className="w-full rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-4 py-3 text-[var(--foreground)] placeholder-[var(--muted)] focus:outline-none" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm text-[var(--muted)]">{t.verify.idNumber}</label>
                <input type="text" required className="w-full rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-4 py-3 text-[var(--foreground)] placeholder-[var(--muted)] focus:outline-none" />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-6">
            <h2 className="mb-4 text-lg font-semibold text-[var(--foreground)]">{t.verify.uploadDoc}</h2>
            <div>
              <label className="mb-2 block text-sm text-[var(--muted)]">{t.verify.docType}</label>
              <select value={docType} onChange={(e) => setDocType(e.target.value)} className="mb-4 w-full rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-4 py-3 text-[var(--foreground)] focus:outline-none">
                <option value="id">{t.verify.docId}</option>
                <option value="passport">{t.verify.docPassport}</option>
                <option value="license">{t.verify.docLicense}</option>
              </select>
            </div>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="flex cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-[var(--input-border)] bg-[var(--input-bg)] p-8 transition hover:border-[var(--muted)]"
            >
              <div className="text-center">
                <Upload className="mx-auto h-8 w-8 text-[var(--muted)]" />
                {file ? (
                  <p className="mt-2 text-sm font-medium text-[var(--foreground)]">{file.name}</p>
                ) : (
                  <>
                    <p className="mt-2 text-sm text-[var(--muted)]">{t.verify.uploadArea}</p>
                    <p className="mt-1 text-xs text-[var(--muted)]">{t.verify.uploadFormats}</p>
                  </>
                )}
              </div>
              <input ref={fileInputRef} type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <ShieldCheck className="h-5 w-5 shrink-0 text-[var(--accent-text)]" />
            <p className="text-sm text-[var(--accent-text)]">{t.verify.trustNotice}</p>
          </div>

          <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] py-3.5 font-semibold text-white transition hover:opacity-90 disabled:opacity-60">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {t.verify.submit}
          </button>
        </form>
      )}
    </div>
  );
}
