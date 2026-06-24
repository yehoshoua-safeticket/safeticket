'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShieldCheck, AlertTriangle, Clock, CheckCircle, FileText, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { useLocale } from '@/i18n/LocaleProvider';

const stepIcons = [FileText, Clock, CheckCircle, ShieldCheck];
const stepColors = [
  'text-blue-600 bg-blue-50',
  'text-amber-700 bg-amber-50',
  'text-[var(--accent-text)] bg-[var(--accent-soft)]',
  'text-purple-600 bg-purple-50',
];

type OrderOption = { id: string; label: string };

export default function SupportPage() {
  const { t } = useLocale();
  const [submitted, setSubmitted] = useState(false);
  const [authResolved, setAuthResolved] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [orders, setOrders] = useState<OrderOption[]>([]);
  const [orderId, setOrderId] = useState('');
  const [reasonCode, setReasonCode] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      setUserId(user?.id ?? null);
      if (user) {
        const { data } = await supabase
          .from('orders')
          .select('id, created_at, listing:listings(event:events(title))')
          .eq('buyer_id', user.id)
          .order('created_at', { ascending: false });
        const opts = (data || []).map((o) => {
          const listing = o.listing as { event?: { title?: string } } | null;
          const title = listing?.event?.title ?? '';
          return { id: o.id, label: `#ORD-${o.id.slice(0, 8).toUpperCase()}${title ? ` — ${title}` : ''}` };
        });
        setOrders(opts);
      }
      setAuthResolved(true);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const reasonLabel = reasonCode ? `[${reasonCode}] ` : '';
    const res = await fetch('/api/disputes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, reason: `${reasonLabel}${description}` }),
    });
    setLoading(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error || t.supportPage.errorGeneric);
      return;
    }
    setSubmitted(true);
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <div className="mb-12 text-center">
        <h1 className="mb-4 text-4xl font-extrabold text-[var(--foreground)]">{t.supportPage.title}</h1>
        <p className="text-lg text-[var(--muted)]">{t.supportPage.subtitle}</p>
      </div>

      <div className="mb-12 rounded-xl border border-emerald-200 bg-emerald-50 p-6">
        <div className="flex items-start gap-4">
          <ShieldCheck className="h-6 w-6 shrink-0 text-[var(--accent-text)]" />
          <div>
            <h3 className="font-semibold text-[var(--foreground)]">{t.supportPage.protectionTitle}</h3>
            <p className="mt-1 text-sm text-[var(--muted)]">{t.supportPage.protectionDesc}</p>
          </div>
        </div>
      </div>

      <div className="mb-12">
        <h2 className="mb-6 text-xl font-bold text-[var(--foreground)]">{t.supportPage.processTitle}</h2>
        <div className="grid gap-4 sm:grid-cols-4">
          {t.supportPage.steps.map((step, i) => {
            const Icon = stepIcons[i];
            return (
              <div key={i} className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-4 text-center">
                <div className={`mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg ${stepColors[i]}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <p className="text-sm font-semibold text-[var(--foreground)]">{step.label}</p>
                <p className="mt-1 text-xs text-[var(--muted)]">{step.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {submitted ? (
        <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-12 text-center">
          <CheckCircle className="mx-auto mb-4 h-12 w-12 text-[var(--accent-text)]" />
          <h2 className="text-xl font-bold text-[var(--foreground)]">{t.supportPage.submittedTitle}</h2>
          <p className="mt-3 text-sm text-[var(--muted)]">{t.supportPage.submittedDesc}</p>
        </div>
      ) : !authResolved ? (
        <div className="flex items-center justify-center rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-12">
          <Loader2 className="h-6 w-6 animate-spin text-[var(--accent)]" />
        </div>
      ) : !userId ? (
        <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-12 text-center">
          <h2 className="text-xl font-bold text-[var(--foreground)]">{t.supportPage.loginRequiredTitle}</h2>
          <p className="mt-3 text-[var(--muted)]">{t.supportPage.loginRequiredDesc}</p>
          <Link href="/auth/login?next=%2Fsupport" className="mt-6 inline-block rounded-xl bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90">{t.supportPage.loginButton}</Link>
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-12 text-center">
          <h2 className="text-xl font-bold text-[var(--foreground)]">{t.supportPage.noOrdersTitle}</h2>
          <p className="mt-3 text-[var(--muted)]">{t.supportPage.noOrdersDesc}</p>
          <Link href="/tickets" className="mt-6 inline-block rounded-xl border border-[var(--input-border)] px-6 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--input-bg)]">{t.supportPage.processTitle}</Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-6 sm:p-8">
          <h2 className="mb-6 text-lg font-semibold text-[var(--foreground)]">{t.supportPage.formTitle}</h2>
          <div className="space-y-5">
            <div>
              <label className="mb-1.5 block text-sm text-[var(--muted)]">{t.supportPage.selectOrder}</label>
              <select required value={orderId} onChange={(e) => setOrderId(e.target.value)} className="w-full rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-4 py-3 text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]">
                <option value="">{t.supportPage.selectOrderPlaceholder}</option>
                {orders.map((o) => (
                  <option key={o.id} value={o.id}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-[var(--muted)]">{t.supportPage.reason}</label>
              <select required value={reasonCode} onChange={(e) => setReasonCode(e.target.value)} className="w-full rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-4 py-3 text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]">
                <option value="">{t.supportPage.reasonPlaceholder}</option>
                <option value="fake">{t.supportPage.reasonFake}</option>
                <option value="wrong">{t.supportPage.reasonWrong}</option>
                <option value="not_received">{t.supportPage.reasonNotReceived}</option>
                <option value="cancelled">{t.supportPage.reasonCancelled}</option>
                <option value="other">{t.supportPage.reasonOther}</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-[var(--muted)]">{t.supportPage.description}</label>
              <textarea required rows={4} value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t.supportPage.descriptionPlaceholder} className="w-full resize-none rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-4 py-3 text-[var(--foreground)] placeholder-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]" />
            </div>
          </div>

          {error && <div className="mt-4 rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700">{error}</div>}

          <div className="mt-4 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-700" />
            <p className="text-xs text-amber-700">{t.supportPage.warning}</p>
          </div>

          <button type="submit" disabled={loading} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] py-3.5 font-semibold text-white transition hover:opacity-90 disabled:opacity-60">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {t.supportPage.submit}
          </button>
        </form>
      )}
    </div>
  );
}
