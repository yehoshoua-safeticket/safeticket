'use client';

import { useState, useEffect } from 'react';
import { HelpCircle, Plus, Trash2, ChevronUp, ChevronDown, Save } from 'lucide-react';
import { useLocale } from '@/i18n/LocaleProvider';
import type { Faq, FaqCategory } from '@/types/database';

const CATEGORIES: FaqCategory[] = ['general', 'buyers', 'sellers', 'security'];

/** A row being edited locally; `isNew` rows have not been persisted yet. */
type Draft = Faq & { dirty?: boolean };

const BLANK = {
  question_he: '', answer_he: '',
  question_en: '', answer_en: '',
  asterisk_he: '', asterisk_en: '',
  keywords: '', category: null as FaqCategory | null,
  published: true,
};

export default function AdminFaqsPage() {
  const { t } = useLocale();

  const [faqs, setFaqs] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const [migrated, setMigrated] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    const res = await fetch('/api/admin/faqs').then((r) => r.json()).catch(() => ({ faqs: [], migrated: false }));
    setFaqs((res.faqs || []) as Draft[]);
    setMigrated(res.migrated !== false);
    setLoading(false);
  }

  function edit(id: string, patch: Partial<Faq>) {
    setFaqs((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch, dirty: true } : f)));
    setSavedId(null);
  }

  async function create() {
    setError('');
    const res = await fetch('/api/admin/faqs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: { ...BLANK, question_he: '—', answer_he: '—' } }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error || t.admin.faqs.saveError);
      return;
    }
    const { faq } = await res.json();
    setFaqs((prev) => [...prev, faq as Draft]);
    setOpenId(faq.id);
  }

  async function save(faq: Draft) {
    setSavingId(faq.id);
    setError('');
    const { id, created_at, updated_at, dirty, ...fields } = faq;
    void created_at; void updated_at; void dirty;
    const res = await fetch('/api/admin/faqs', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, fields }),
    });
    setSavingId(null);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error || t.admin.faqs.saveError);
      return;
    }
    setFaqs((prev) => prev.map((f) => (f.id === id ? { ...f, dirty: false } : f)));
    setSavedId(id);
    setTimeout(() => setSavedId(null), 2000);
  }

  async function remove(id: string) {
    if (!confirm(t.admin.faqs.deleteConfirm)) return;
    setError('');
    const res = await fetch('/api/admin/faqs', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error || t.admin.faqs.saveError);
      return;
    }
    setFaqs((prev) => prev.filter((f) => f.id !== id));
  }

  /** Reorder locally, then persist the new order in one call. */
  async function move(index: number, dir: -1 | 1) {
    const j = index + dir;
    if (j < 0 || j >= faqs.length) return;
    const next = [...faqs];
    [next[index], next[j]] = [next[j], next[index]];
    setFaqs(next.map((f, i) => ({ ...f, position: i })));
    await fetch('/api/admin/faqs', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order: next.map((f) => f.id) }),
    });
  }

  const label = 'mb-1 block text-xs font-medium text-[var(--muted)]';
  const field = 'w-full rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none';

  const catLabel: Record<FaqCategory, string> = {
    general: t.admin.faqs.catGeneral,
    buyers: t.admin.faqs.catBuyers,
    sellers: t.admin.faqs.catSellers,
    security: t.admin.faqs.catSecurity,
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="flex items-center gap-2 text-2xl font-bold text-[var(--foreground)]">
            <HelpCircle className="h-5 w-5 text-[var(--accent-text)]" />
            {t.admin.faqs.title}
          </h1>
          <p className="mt-1 text-sm text-[var(--muted)]">{t.admin.faqs.subtitle}</p>
        </div>
        <button
          onClick={create}
          disabled={!migrated}
          className="flex shrink-0 items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          {t.admin.faqs.newFaq}
        </button>
      </div>

      {!migrated && (
        <div className="mb-4 rounded-lg border border-[var(--warning)]/40 bg-[var(--warning)]/10 px-4 py-3 text-sm text-[var(--warning)]">
          {t.admin.faqs.notMigrated}
        </div>
      )}
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {loading ? (
        <div className="py-12 text-center text-sm text-[var(--muted)]">{t.common.loading}</div>
      ) : faqs.length === 0 ? (
        <p className="py-12 text-center text-sm text-[var(--muted)]">{t.admin.faqs.empty}</p>
      ) : (
        <ul className="space-y-3">
          {faqs.map((faq, i) => {
            const open = openId === faq.id;
            return (
              <li key={faq.id} className="rounded-xl border border-[var(--card-border)] bg-[var(--card)]">
                <div className="flex items-center gap-2 p-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)] text-xs font-bold text-[var(--accent-text)]">
                    {i + 1}
                  </span>
                  <button
                    onClick={() => setOpenId(open ? null : faq.id)}
                    className="min-w-0 flex-1 text-start"
                  >
                    <p className="truncate text-sm font-medium text-[var(--foreground)]">
                      {faq.question_he || '—'}
                    </p>
                    <p className="truncate text-xs text-[var(--muted)]">
                      {faq.category ? catLabel[faq.category] : t.admin.faqs.catNone}
                      {!faq.published && ' · ' + t.status.draft}
                      {faq.dirty && ' · •'}
                    </p>
                  </button>
                  <div className="flex shrink-0 items-center gap-0.5">
                    <button onClick={() => move(i, -1)} disabled={i === 0} aria-label={t.admin.faqs.moveUp}
                      className="rounded p-1 text-[var(--muted)] transition hover:bg-[var(--input-bg)] hover:text-[var(--foreground)] disabled:opacity-30">
                      <ChevronUp className="h-4 w-4" />
                    </button>
                    <button onClick={() => move(i, 1)} disabled={i === faqs.length - 1} aria-label={t.admin.faqs.moveDown}
                      className="rounded p-1 text-[var(--muted)] transition hover:bg-[var(--input-bg)] hover:text-[var(--foreground)] disabled:opacity-30">
                      <ChevronDown className="h-4 w-4" />
                    </button>
                    <button onClick={() => remove(faq.id)} aria-label={t.common.delete}
                      className="rounded p-1 text-[var(--muted)] transition hover:bg-red-50 hover:text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {open && (
                  <div className="space-y-3 border-t border-[var(--card-border)] p-4">
                    <div>
                      <label className={label}>{t.admin.faqs.questionHe}</label>
                      <input className={field} value={faq.question_he} onChange={(e) => edit(faq.id, { question_he: e.target.value })} />
                    </div>
                    <div>
                      <label className={label}>{t.admin.faqs.answerHe}</label>
                      <textarea rows={4} className={field} value={faq.answer_he} onChange={(e) => edit(faq.id, { answer_he: e.target.value })} />
                    </div>
                    <div>
                      <label className={label}>{t.admin.faqs.asteriskHe}</label>
                      <input className={field} value={faq.asterisk_he} onChange={(e) => edit(faq.id, { asterisk_he: e.target.value })} />
                      <p className="mt-1 text-xs text-[var(--muted)]">{t.admin.faqs.asteriskHint}</p>
                    </div>

                    <div className="rounded-lg border border-[var(--card-border-soft)] p-3">
                      <p className="mb-2 text-xs text-[var(--muted)]">{t.admin.faqs.englishHint}</p>
                      <div className="space-y-3">
                        <div>
                          <label className={label}>{t.admin.faqs.questionEn}</label>
                          <input dir="ltr" className={field} value={faq.question_en} onChange={(e) => edit(faq.id, { question_en: e.target.value })} />
                        </div>
                        <div>
                          <label className={label}>{t.admin.faqs.answerEn}</label>
                          <textarea dir="ltr" rows={4} className={field} value={faq.answer_en} onChange={(e) => edit(faq.id, { answer_en: e.target.value })} />
                        </div>
                        <div>
                          <label className={label}>{t.admin.faqs.asteriskEn}</label>
                          <input dir="ltr" className={field} value={faq.asterisk_en} onChange={(e) => edit(faq.id, { asterisk_en: e.target.value })} />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className={label}>{t.admin.faqs.keywords}</label>
                      <input className={field} value={faq.keywords} onChange={(e) => edit(faq.id, { keywords: e.target.value })} />
                      <p className="mt-1 text-xs text-[var(--muted)]">{t.admin.faqs.keywordsHint}</p>
                    </div>

                    <div className="flex flex-wrap items-end gap-4">
                      <div className="min-w-[10rem] flex-1">
                        <label className={label}>{t.admin.faqs.category}</label>
                        <select
                          className={field}
                          value={faq.category ?? ''}
                          onChange={(e) => edit(faq.id, { category: (e.target.value || null) as FaqCategory | null })}
                        >
                          <option value="">{t.admin.faqs.catNone}</option>
                          {CATEGORIES.map((c) => <option key={c} value={c}>{catLabel[c]}</option>)}
                        </select>
                      </div>
                      <label className="flex items-center gap-2 py-2 text-sm text-[var(--foreground)]">
                        <input type="checkbox" checked={faq.published} onChange={(e) => edit(faq.id, { published: e.target.checked })} />
                        {t.admin.faqs.published}
                      </label>
                      <button
                        onClick={() => save(faq)}
                        disabled={savingId === faq.id}
                        className="ms-auto flex items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
                      >
                        <Save className="h-4 w-4" />
                        {savedId === faq.id ? t.admin.faqs.saved : savingId === faq.id ? t.common.saving : t.common.save}
                      </button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
