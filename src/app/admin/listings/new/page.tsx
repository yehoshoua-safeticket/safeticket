'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { ArrowRight, Save, Upload } from 'lucide-react';
import { useLocale } from '@/i18n/LocaleProvider';
import type { ListingStatus } from '@/types/database';

interface Opt { id: string; label: string; }

export default function NewListingPage() {
  const { t } = useLocale();
  const router = useRouter();
  const [sellers, setSellers] = useState<Opt[]>([]);
  const [events, setEvents] = useState<Opt[]>([]);
  const [sellerId, setSellerId] = useState('');
  const [eventId, setEventId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [faceValue, setFaceValue] = useState('');
  const [askingPrice, setAskingPrice] = useState('');
  const [section, setSection] = useState('');
  const [row, setRow] = useState('');
  const [seatInfo, setSeatInfo] = useState('');
  const [status, setStatus] = useState<ListingStatus>('active');
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.from('profiles').select('id, full_name, email').eq('role', 'external_user').order('full_name').then(({ data }) => {
      setSellers((data || []).map((p) => ({ id: p.id, label: `${p.full_name || '—'} (${p.email})` })));
    });
    supabase.from('events').select('id, title, event_date').order('event_date', { ascending: true }).then(({ data }) => {
      setEvents((data || []).map((e) => ({ id: e.id, label: e.title })));
    });
  }, []);

  async function handleSave() {
    if (!sellerId || !eventId || !quantity || !faceValue || !askingPrice) {
      setError(t.admin.listingForm.requiredError);
      return;
    }
    setSaving(true);
    setError('');
    const body = new FormData();
    body.append('seller_id', sellerId);
    body.append('event_id', eventId);
    body.append('quantity', quantity);
    body.append('face_value', faceValue);
    body.append('asking_price', askingPrice);
    body.append('section', section);
    body.append('row', row);
    body.append('seat_info', seatInfo);
    body.append('status', status);
    if (file) body.append('file', file);
    const res = await fetch('/api/admin/listings', { method: 'POST', body });
    setSaving(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error || t.admin.listingForm.errorCreate);
      return;
    }
    router.push('/admin/listings');
  }

  const inputClass = 'w-full rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] px-3 py-2.5 text-sm text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]';
  const ld = t.admin.listingDetail;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <div className="mb-8 flex items-center gap-4">
        <button onClick={() => router.push('/admin/listings')} className="rounded-lg p-2 text-[var(--muted)] transition hover:bg-[var(--input-bg)] hover:text-[var(--foreground)]">
          <ArrowRight className="h-5 w-5 rtl:rotate-180" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-[var(--foreground)]">{t.admin.listingForm.newTitle}</h1>
          <p className="text-sm text-[var(--muted)]">{t.admin.listingForm.newSubtitle}</p>
        </div>
        <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50">
          <Save className="h-4 w-4" />{saving ? t.common.saving : t.admin.listingForm.createButton}
        </button>
      </div>

      {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="overflow-hidden rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm text-[var(--muted)]">{t.admin.listingForm.sellerLabel} <span className="text-red-500">{t.common.required}</span></label>
            <select value={sellerId} onChange={(e) => setSellerId(e.target.value)} className={inputClass}>
              <option value="">{t.admin.listingForm.sellerPlaceholder}</option>
              {sellers.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm text-[var(--muted)]">{t.admin.listingForm.eventLabel} <span className="text-red-500">{t.common.required}</span></label>
            <select value={eventId} onChange={(e) => setEventId(e.target.value)} className={inputClass}>
              <option value="">{t.admin.listingForm.eventPlaceholder}</option>
              {events.map((ev) => <option key={ev.id} value={ev.id}>{ev.label}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-[var(--muted)]">{ld.fieldQuantity} <span className="text-red-500">{t.common.required}</span></label>
            <input type="number" min={1} value={quantity} onChange={(e) => setQuantity(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-[var(--muted)]">{t.admin.listingForm.statusLabel}</label>
            <select value={status} onChange={(e) => setStatus(e.target.value as ListingStatus)} className={inputClass}>
              <option value="active">{t.admin.listings.statusActive}</option>
              <option value="pending_review">{t.admin.listings.statusPendingReview}</option>
              <option value="draft">{t.status.draft}</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-[var(--muted)]">{ld.fieldFaceValue} <span className="text-red-500">{t.common.required}</span></label>
            <input type="number" min={0} step="0.01" value={faceValue} onChange={(e) => setFaceValue(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-[var(--muted)]">{ld.fieldAskingPrice} <span className="text-red-500">{t.common.required}</span></label>
            <input type="number" min={0} step="0.01" value={askingPrice} onChange={(e) => setAskingPrice(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-[var(--muted)]">{ld.fieldSection}</label>
            <input type="text" value={section} onChange={(e) => setSection(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-[var(--muted)]">{ld.fieldRow}</label>
            <input type="text" value={row} onChange={(e) => setRow(e.target.value)} className={inputClass} />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm text-[var(--muted)]">{ld.fieldSeatInfo}</label>
            <input type="text" value={seatInfo} onChange={(e) => setSeatInfo(e.target.value)} className={inputClass} />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm text-[var(--muted)]">{t.admin.listingForm.fileLabel}</label>
            <div onClick={() => fileRef.current?.click()} className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-[var(--input-border)] bg-[var(--input-bg)] px-4 py-5 text-sm text-[var(--muted)] transition hover:border-[var(--accent)]/50">
              <Upload className="h-4 w-4" />
              {file ? file.name : t.admin.listingForm.fileHint}
              <input ref={fileRef} type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
