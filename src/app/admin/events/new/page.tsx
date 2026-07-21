'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Save, Upload, X, Loader2 } from 'lucide-react';
import { useLocale } from '@/i18n/LocaleProvider';
import type { EventCategory } from '@/types/database';

export default function NewEventPage() {
  const { t } = useLocale();
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [venue, setVenue] = useState('');
  const [city, setCity] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [category, setCategory] = useState<EventCategory>('concert');
  const [imageUrl, setImageUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleImageUpload(file: File) {
    setUploadingImage(true);
    setError('');
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/admin/event-image', { method: 'POST', body: fd });
    setUploadingImage(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error || t.admin.eventForm.imageError);
      return;
    }
    const { url } = await res.json();
    setImageUrl(url);
  }

  const CATEGORY_OPTIONS: { value: EventCategory; label: string }[] = [
    { value: 'concert', label: t.eventCategory.concert },
    { value: 'sports', label: t.eventCategory.sports },
    { value: 'theater', label: t.eventCategory.theater },
    { value: 'festival', label: t.eventCategory.festival },
    { value: 'conference', label: t.eventCategory.conference },
    { value: 'other', label: t.eventCategory.other },
  ];

  async function handleSave() {
    if (!title.trim() || !venue.trim() || !city.trim() || !date) {
      setError(t.admin.eventForm.requiredError);
      return;
    }
    setSaving(true);
    setError('');
    const event_date = time ? `${date}T${time}:00` : `${date}T00:00:00`;
    // Route through /api/events (service role) — the events table has no INSERT
    // RLS policy, and this auto-approves staff-created events.
    const res = await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: title.trim(), venue: venue.trim(), city: city.trim(), event_date, category, image_url: imageUrl || null }),
    });
    setSaving(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error || t.admin.eventForm.requiredError);
      return;
    }
    router.push('/admin/events');
  }

  const inputClass = 'w-full rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] px-3 py-2.5 text-sm text-[var(--foreground)] focus:outline-none';

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <div className="mb-8 flex items-center gap-4">
        <button
          onClick={() => router.push('/admin/events')}
          className="rounded-lg p-2 text-[var(--muted)] transition hover:bg-[var(--input-bg)] hover:text-[var(--foreground)]"
        >
          <ArrowRight className="h-5 w-5 rtl:rotate-180" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-[var(--foreground)]">{t.admin.eventForm.newTitle}</h1>
          <p className="text-sm text-[var(--muted)]">{t.admin.eventForm.newSubtitle}</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {saving ? t.common.saving : t.common.save}
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="overflow-hidden rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm text-[var(--muted)]">
              {t.admin.eventForm.titleLabel} <span className="text-red-500">{t.common.required}</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t.admin.eventForm.titlePlaceholder}
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm text-[var(--muted)]">
              {t.admin.eventForm.venueLabel} <span className="text-red-500">{t.common.required}</span>
            </label>
            <input
              type="text"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              placeholder={t.admin.eventForm.venuePlaceholder}
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm text-[var(--muted)]">
              {t.admin.eventForm.cityLabel} <span className="text-red-500">{t.common.required}</span>
            </label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder={t.admin.eventForm.cityPlaceholder}
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm text-[var(--muted)]">
              {t.admin.eventForm.dateLabel} <span className="text-red-500">{t.common.required}</span>
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm text-[var(--muted)]">{t.admin.eventForm.timeLabel}</label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm text-[var(--muted)]">{t.admin.eventForm.categoryLabel}</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as EventCategory)}
              className={inputClass}
            >
              {CATEGORY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm text-[var(--muted)]">{t.admin.eventForm.imageLabel}</label>
            {imageUrl ? (
              <div className="relative inline-block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageUrl} alt="" className="h-32 w-full rounded-lg border border-[var(--card-border)] object-cover sm:w-64" />
                <button
                  type="button"
                  onClick={() => setImageUrl('')}
                  className="absolute end-2 top-2 rounded-full bg-black/60 p-1 text-white transition hover:bg-black/80"
                  aria-label={t.common.remove}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-[var(--input-border)] bg-[var(--input-bg)] px-4 py-6 text-sm text-[var(--muted)] transition hover:border-[var(--accent)] hover:text-[var(--foreground)]">
                {uploadingImage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                <span>{uploadingImage ? t.common.loading : t.admin.eventForm.imageUpload}</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploadingImage}
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); }}
                />
              </label>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
