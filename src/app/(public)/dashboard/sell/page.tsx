'use client';

import { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import {
  Upload, ShieldCheck, Check, Search, ChevronDown, X, FileText,
  Shield, UserCheck, Lock, Eye, LogIn, Loader2, Sparkles, AlertCircle,
  Plus,
} from 'lucide-react';
import Link from 'next/link';
import FadeIn from '@/components/ui/FadeIn';
import { createClient } from '@/lib/supabase';
import type { Event } from '@/types/database';
import { useLocale } from '@/i18n/LocaleProvider';

interface OcrFields {
  eventName?: string;
  venue?: string;
  city?: string;
  eventDate?: string;
  eventTime?: string;
  category?: string;
  section?: string | null;
  row?: string | null;
  seatInfo?: string | null;
  quantity?: number;
  faceValue?: number;
}

interface NewEventDraft {
  title: string;
  venue: string;
  city: string;
  event_date: string;
  category: string;
}

export default function SellPage() {
  const { t } = useLocale();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [sellerId, setSellerId] = useState('');
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { setAuthLoading(false); return; }
      setIsAuthenticated(true);
      setSellerId(user.id);
      const { data: profile } = await supabase
        .from('profiles')
        .select('verification_status, role')
        .eq('id', user.id)
        .single();
      if (profile?.role === 'external_user' && profile?.verification_status !== 'verified') {
        window.location.href = '/dashboard/verify';
        return;
      }
      setIsVerified(true);
      setAuthLoading(false);
    });
    supabase.from('events').select('*').order('event_date', { ascending: true }).then(({ data }) => {
      setEvents((data || []) as Event[]);
    });
  }, []);

  /* ─── Form state ─── */
  const [submitted, setSubmitted] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Event
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [eventSearch, setEventSearch] = useState('');
  const [eventDropdownOpen, setEventDropdownOpen] = useState(false);

  // Ticket details (OCR-populated)
  const [section, setSection] = useState('');
  const [row, setRow] = useState('');
  const [seatInfo, setSeatInfo] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [faceValue, setFaceValue] = useState('');
  const [askingPrice, setAskingPrice] = useState('');

  // Files
  const [ticketFile, setTicketFile] = useState<File | null>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const ticketInputRef = useRef<HTMLInputElement>(null);
  const proofInputRef = useRef<HTMLInputElement>(null);

  // OCR
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrError, setOcrError] = useState<string | null>(null);
  const [ocrDone, setOcrDone] = useState(false);

  // New event draft (when OCR finds no match)
  const [newEventDraft, setNewEventDraft] = useState<NewEventDraft | null>(null);
  const [useNewEvent, setUseNewEvent] = useState(false);
  const [creatingEvent, setCreatingEvent] = useState(false);

  const selectedEvent = useMemo(
    () => events.find((e) => e.id === selectedEventId),
    [selectedEventId, events]
  );

  const filteredEvents = useMemo(() => {
    if (!eventSearch) return events;
    const q = eventSearch.toLowerCase();
    return events.filter(
      (e) => e.title.toLowerCase().includes(q) || e.venue.toLowerCase().includes(q) || e.city.toLowerCase().includes(q)
    );
  }, [eventSearch, events]);

  /* ─── OCR trigger ─── */
  const runOcr = useCallback(async (file: File) => {
    setOcrLoading(true);
    setOcrError(null);
    setOcrDone(false);
    setNewEventDraft(null);
    setUseNewEvent(false);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/ocr', { method: 'POST', body: formData });
      const json = await res.json();

      if (!res.ok) {
        setOcrError(json.error || 'OCR failed');
        return;
      }

      const fields: OcrFields = json.extracted || {};
      const matched: Event | null = json.matchedEvent || null;

      // Auto-populate fields
      if (fields.section) setSection(fields.section);
      if (fields.row) setRow(fields.row);
      if (fields.seatInfo) setSeatInfo(fields.seatInfo);
      if (fields.quantity && fields.quantity > 0) setQuantity(fields.quantity);
      if (fields.faceValue && fields.faceValue > 0) {
        setFaceValue(String(fields.faceValue));
        // Default asking price = face value
        setAskingPrice(String(fields.faceValue));
      }

      if (matched) {
        setSelectedEventId(matched.id);
        setEvents((prev) => prev.some((e) => e.id === matched.id) ? prev : [matched, ...prev]);
      } else if (fields.eventName) {
        // Prefill event search so user can find it manually
        setEventSearch(fields.eventName);
        setEventDropdownOpen(true);

        // Build a draft for auto-create
        if (fields.venue && fields.city && fields.eventDate) {
          const dateStr = fields.eventTime
            ? `${fields.eventDate}T${fields.eventTime}:00`
            : `${fields.eventDate}T20:00:00`;
          setNewEventDraft({
            title: fields.eventName,
            venue: fields.venue,
            city: fields.city,
            event_date: dateStr,
            category: fields.category || 'other',
          });
        }
      }

      setOcrDone(true);
    } catch {
      setOcrError('OCR request failed');
    } finally {
      setOcrLoading(false);
    }
  }, []);

  /* ─── Auto-create event ─── */
  const createEvent = async () => {
    if (!newEventDraft) return;
    setCreatingEvent(true);
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEventDraft),
      });
      const json = await res.json();
      if (res.ok && json.event) {
        const created = json.event as Event;
        setEvents((prev) => [created, ...prev]);
        setSelectedEventId(created.id);
        setUseNewEvent(false);
        setNewEventDraft(null);
        setEventDropdownOpen(false);
      } else {
        setOcrError(json.error || 'Failed to create event');
      }
    } catch {
      setOcrError('Failed to create event');
    } finally {
      setCreatingEvent(false);
    }
  };

  /* ─── Validation + submit ─── */
  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!selectedEventId && !useNewEvent) newErrors.event = t.sell.errorEventRequired;
    if (!ticketFile) newErrors.ticket = t.sell.errorTicketRequired;
    if (!faceValue || parseFloat(faceValue) <= 0) newErrors.faceValue = t.sell.errorFaceValuePositive;
    if (!askingPrice || parseFloat(askingPrice) <= 0) newErrors.price = t.sell.errorAskingPricePositive;
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    let eventId = selectedEventId;

    // Auto-create event if needed
    if (!eventId && newEventDraft) {
      setCreatingEvent(true);
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEventDraft),
      });
      const json = await res.json();
      setCreatingEvent(false);
      if (res.ok && json.event) {
        const created = json.event as Event;
        setEvents((prev) => [created, ...prev]);
        setSelectedEventId(created.id);
        eventId = created.id;
      } else {
        setErrors((prev) => ({ ...prev, event: json.error || 'שגיאה ביצירת אירוע' }));
        return;
      }
    }

    setSubmitLoading(true);
    setSubmitError('');

    // Upload ticket file to storage
    let ticketFileUrl: string | null = null;
    if (ticketFile) {
      const supabase = createClient();
      const ext = ticketFile.name.split('.').pop();
      const path = `listings/${sellerId}/${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from('tickets').upload(path, ticketFile, { upsert: false });
      if (uploadErr) {
        setSubmitError(uploadErr.message);
        setSubmitLoading(false);
        return;
      }
      const { data: urlData } = supabase.storage.from('tickets').getPublicUrl(path);
      ticketFileUrl = urlData.publicUrl;
    }

    // Insert listing row
    const supabase = createClient();
    const { error: insertErr } = await supabase.from('listings').insert({
      seller_id: sellerId,
      event_id: eventId,
      quantity,
      face_value: parseFloat(faceValue),
      asking_price: parseFloat(askingPrice),
      section: section || null,
      row: row || null,
      seat_info: seatInfo || null,
      ticket_file_url: ticketFileUrl,
      status: 'pending_review',
      risk_status: 'clear',
    });

    setSubmitLoading(false);
    if (insertErr) {
      setSubmitError(insertErr.message);
      return;
    }

    setSubmitted(true);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  /* ─── Loading ─── */
  if (authLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--accent)]" />
      </div>
    );
  }

  /* ─── Auth gate ─── */
  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <FadeIn>
          <div className="mb-10 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--accent-soft)]">
              <Shield className="h-8 w-8 text-[var(--accent-text)]" />
            </div>
            <h1 className="text-3xl font-bold text-[var(--foreground)]">{t.sell.gateTitle}</h1>
            <p className="mx-auto mt-3 max-w-md text-[var(--muted)]">
              {t.sell.gateSubtitle}
            </p>
          </div>
        </FadeIn>
        <FadeIn delay={0.1}>
          <div className="mb-8 rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-6">
            <h2 className="mb-5 text-lg font-semibold text-[var(--foreground)]">{t.sell.whyRegister}</h2>
            <div className="space-y-5">
              {[
                { icon: UserCheck, title: t.sell.reasonIdentity, desc: t.sell.reasonIdentityDesc },
                { icon: Eye, title: t.sell.reasonPrivacy, desc: t.sell.reasonPrivacyDesc },
                { icon: Lock, title: t.sell.reasonPayment, desc: t.sell.reasonPaymentDesc },
              ].map((item) => (
                <div key={item.title} className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--accent-soft)]">
                    <item.icon className="h-5 w-5 text-[var(--accent-text)]" />
                  </div>
                  <div>
                    <h3 className="text-[0.95rem] font-semibold text-[var(--foreground)]">{item.title}</h3>
                    <p className="mt-0.5 text-sm leading-relaxed text-[var(--muted)]">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </FadeIn>
        <FadeIn delay={0.2}>
          <div className="mb-6 rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-6">
            <h2 className="mb-4 text-lg font-semibold text-[var(--foreground)]">{t.sell.howItWorks}</h2>
            <div className="space-y-3">
              {t.sell.gateSteps.map((text, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-xs font-bold text-white">{idx + 1}</span>
                  <p className="text-sm text-[var(--muted)] leading-relaxed">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </FadeIn>
        <FadeIn delay={0.3}>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/auth/signup" className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-6 py-3.5 font-semibold text-white shadow-lg shadow-[var(--accent)]/20 transition-all hover:shadow-xl hover:brightness-110">
              <UserCheck className="h-5 w-5" />{t.sell.createAccount}
            </Link>
            <Link href="/auth/login" className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[var(--card-border)] bg-[var(--card)] px-6 py-3.5 font-semibold text-[var(--foreground)] transition-all hover:border-[var(--muted)] hover:shadow-sm">
              <LogIn className="h-5 w-5" />{t.sell.alreadyHaveAccount}
            </Link>
          </div>
        </FadeIn>
      </div>
    );
  }

  /* ─── Success ─── */
  if (submitted) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50">
          <Check className="h-10 w-10 text-[var(--accent-text)]" />
        </div>
        <h1 className="text-3xl font-bold text-[var(--foreground)]">{t.sell.successTitle}</h1>
        <p className="mt-4 text-[var(--muted)]">{t.sell.successDesc}</p>
        <div className="mt-8 flex justify-center gap-4">
          <Link href="/" className="rounded-xl bg-[var(--accent)] px-6 py-3 font-semibold text-white transition hover:opacity-90">{t.sell.backHome}</Link>
          <button
            onClick={() => {
              setSubmitted(false);
              setSelectedEventId(null);
              setEventSearch('');
              setAskingPrice('');
              setFaceValue('');
              setSection('');
              setRow('');
              setSeatInfo('');
              setQuantity(1);
              setTicketFile(null);
              setProofFile(null);
              setErrors({});
              setOcrDone(false);
              setNewEventDraft(null);
            }}
            className="rounded-xl border border-[var(--input-border)] px-6 py-3 text-[var(--foreground)] transition hover:bg-[var(--input-bg)]"
          >
            {t.sell.addAnother}
          </button>
        </div>
      </div>
    );
  }

  /* ─── Sell form ─── */
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[var(--foreground)]">{t.sell.title}</h1>
        <p className="mt-2 text-[var(--muted)]">{t.sell.subtitle}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* ── Step 1: Upload ticket (OCR trigger) ── */}
        <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[var(--foreground)]">{t.sell.step1}</h2>
            {ocrLoading && (
              <span className="flex items-center gap-1.5 text-xs text-[var(--accent-text)]">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                {t.sell.ocrDetecting}
              </span>
            )}
            {ocrDone && !ocrLoading && (
              <span className="flex items-center gap-1.5 text-xs text-emerald-600">
                <Sparkles className="h-3.5 w-3.5" />
                {t.sell.ocrDetected}
              </span>
            )}
          </div>

          {ocrError && (
            <div className="mb-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-700">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{ocrError}</span>
            </div>
          )}

          {ticketFile ? (
            <div className="flex items-center justify-between rounded-xl border border-[var(--card-border)] bg-[var(--input-bg)] px-4 py-3">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-[var(--accent-text)]" />
                <div>
                  <div className="text-sm font-medium text-[var(--foreground)]">{ticketFile.name}</div>
                  <div className="text-xs text-[var(--muted)]">{formatFileSize(ticketFile.size)}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setTicketFile(null); setOcrDone(false); setOcrError(null); }}
                className="rounded-lg p-1 text-[var(--muted)] hover:bg-[var(--card-border)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => ticketInputRef.current?.click()}
              className={`flex w-full items-center justify-center rounded-xl border-2 border-dashed p-8 transition hover:border-[var(--muted)] ${errors.ticket ? 'border-red-400 bg-red-50' : 'border-[var(--input-border)] bg-[var(--input-bg)]'}`}
            >
              <div className="text-center">
                <Upload className="mx-auto h-8 w-8 text-[var(--muted)]" />
                <p className="mt-2 text-sm font-medium text-[var(--foreground)]">{t.sell.uploadArea}</p>
                <p className="mt-1 text-xs text-[var(--muted)]">{t.sell.uploadFormats}</p>
              </div>
            </button>
          )}
          <input
            ref={ticketInputRef}
            type="file"
            accept=".pdf,.png,.jpg,.jpeg"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                setTicketFile(file);
                if (errors.ticket) setErrors((prev) => { const next = { ...prev }; delete next.ticket; return next; });
                runOcr(file);
              }
            }}
          />
          {errors.ticket && <p className="mt-1 text-xs text-red-600">{errors.ticket}</p>}

          <div className="mt-4 rounded-lg border border-[var(--card-border)] bg-[var(--input-bg)] px-4 py-3">
            <p className="text-xs text-[var(--muted)]">{t.sell.uploadProofHint}</p>
            {proofFile ? (
              <div className="mt-2 flex items-center justify-between rounded-lg border border-[var(--card-border)] bg-[var(--card)] px-3 py-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-[var(--accent-text)]" />
                  <span className="text-xs text-[var(--foreground)]">{proofFile.name}</span>
                </div>
                <button type="button" onClick={() => setProofFile(null)} className="rounded p-0.5 text-[var(--muted)] hover:bg-[var(--card-border)]">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => proofInputRef.current?.click()} className="mt-2 text-xs font-medium text-[var(--accent-text)] hover:underline">
                {t.sell.uploadProofButton}
              </button>
            )}
            <input ref={proofInputRef} type="file" accept=".pdf,.png,.jpg,.jpeg" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) setProofFile(f); }} />
          </div>
        </div>

        {/* ── Step 2: Event ── */}
        <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-6">
          <h2 className="mb-4 text-lg font-semibold text-[var(--foreground)]">{t.sell.step2}</h2>

          {/* New event auto-create banner */}
          {newEventDraft && !selectedEventId && (
            <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 p-4">
              <p className="mb-1 text-sm font-medium text-blue-800">{t.sell.eventNotFound}</p>
              <p className="text-sm text-blue-700">{newEventDraft.title} · {newEventDraft.venue}, {newEventDraft.city}</p>
              <button
                type="button"
                onClick={createEvent}
                disabled={creatingEvent}
                className="mt-3 flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white transition hover:bg-blue-700 disabled:opacity-60"
              >
                {creatingEvent ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                {t.sell.createEvent}
              </button>
            </div>
          )}

          <div className="relative">
            <button
              type="button"
              onClick={() => setEventDropdownOpen(!eventDropdownOpen)}
              className={`flex w-full items-center justify-between rounded-xl border bg-[var(--input-bg)] px-4 py-3 text-start transition ${errors.event ? 'border-red-500' : 'border-[var(--input-border)]'}`}
            >
              <span className={selectedEvent ? 'text-[var(--foreground)]' : 'text-[var(--muted)]'}>
                {selectedEvent ? selectedEvent.title : t.sell.selectEvent}
              </span>
              <ChevronDown className={`h-4 w-4 text-[var(--muted)] transition ${eventDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            {errors.event && <p className="mt-1 text-xs text-red-600">{errors.event}</p>}

            {eventDropdownOpen && (
              <div className="absolute z-10 mt-2 w-full rounded-xl border border-[var(--card-border)] bg-[var(--card)] shadow-lg">
                <div className="border-b border-[var(--card-border)] p-3">
                  <div className="relative">
                    <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
                    <input
                      type="text"
                      value={eventSearch}
                      onChange={(e) => setEventSearch(e.target.value)}
                      placeholder={t.sell.searchEvent}
                      className="w-full rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] py-2 pe-3 ps-10 text-sm placeholder-[var(--muted)] focus:border-[var(--accent)] focus:outline-none"
                    />
                  </div>
                </div>
                <div className="max-h-60 overflow-y-auto p-2">
                  {filteredEvents.length > 0 ? (
                    filteredEvents.map((ev) => (
                      <button
                        key={ev.id}
                        type="button"
                        onClick={() => {
                          setSelectedEventId(ev.id);
                          setEventDropdownOpen(false);
                          setEventSearch('');
                          setNewEventDraft(null);
                          if (errors.event) setErrors((prev) => { const next = { ...prev }; delete next.event; return next; });
                        }}
                        className={`w-full rounded-lg px-3 py-2.5 text-start transition hover:bg-[var(--input-bg)] ${selectedEventId === ev.id ? 'bg-[var(--accent-soft)]' : ''}`}
                      >
                        <div className="text-sm font-medium text-[var(--foreground)]">{ev.title}</div>
                        <div className="text-xs text-[var(--muted)]">
                          {new Date(ev.event_date).toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' })} · {ev.venue}, {ev.city}
                        </div>
                      </button>
                    ))
                  ) : (
                    <p className="px-3 py-4 text-center text-sm text-[var(--muted)]">{t.sell.noEvents}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {selectedEvent && (
            <div className="mt-3 rounded-lg bg-[var(--input-bg)] px-4 py-3 text-sm">
              <div className="font-medium text-[var(--foreground)]">{selectedEvent.title}</div>
              <div className="text-xs text-[var(--muted)]">
                {new Date(selectedEvent.event_date).toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' })} · {selectedEvent.venue}, {selectedEvent.city}
              </div>
            </div>
          )}
        </div>

        {/* ── Step 3: Seat details ── */}
        <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[var(--foreground)]">{t.sell.step3}</h2>
            {ocrDone && <span className="text-xs text-[var(--muted)]">{t.sell.ocrFilled}</span>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm text-[var(--muted)]">{t.sell.section}</label>
              <input type="text" value={section} onChange={(e) => setSection(e.target.value)} placeholder={t.sell.sectionPlaceholder} className="w-full rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-4 py-3 text-sm text-[var(--foreground)] placeholder-[var(--muted)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-[var(--muted)]">{t.sell.row}</label>
              <input type="text" value={row} onChange={(e) => setRow(e.target.value)} placeholder={t.sell.rowPlaceholder} className="w-full rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-4 py-3 text-sm text-[var(--foreground)] placeholder-[var(--muted)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]" />
            </div>
            <div className="col-span-2">
              <label className="mb-1.5 block text-sm text-[var(--muted)]">{t.sell.seatInfo}</label>
              <input type="text" value={seatInfo} onChange={(e) => setSeatInfo(e.target.value)} placeholder={t.sell.seatInfoPlaceholder} className="w-full rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-4 py-3 text-sm text-[var(--foreground)] placeholder-[var(--muted)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-[var(--muted)]">{t.sell.quantity}</label>
              <input
                type="number"
                min="1"
                max="20"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-4 py-3 text-sm text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              />
            </div>
          </div>
        </div>

        {/* ── Step 4: Pricing ── */}
        <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-6">
          <h2 className="mb-4 text-lg font-semibold text-[var(--foreground)]">{t.sell.step4}</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm text-[var(--muted)]">{t.sell.faceValue}</label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  value={faceValue}
                  onChange={(e) => {
                    setFaceValue(e.target.value);
                    if (errors.faceValue) setErrors((prev) => { const next = { ...prev }; delete next.faceValue; return next; });
                  }}
                  placeholder={t.sell.faceValuePlaceholder}
                  className={`w-full rounded-xl border bg-[var(--input-bg)] py-3 pe-4 ps-10 text-[var(--foreground)] placeholder-[var(--muted)] focus:outline-none focus:ring-1 ${errors.faceValue ? 'border-red-500 focus:ring-red-500' : 'border-[var(--input-border)] focus:ring-[var(--accent)]'}`}
                />
                <span className="absolute start-4 top-1/2 -translate-y-1/2 text-[var(--muted)]">₪</span>
              </div>
              {errors.faceValue && <p className="mt-1 text-xs text-red-600">{errors.faceValue}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-[var(--muted)]">{t.sell.askingPrice}</label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  value={askingPrice}
                  onChange={(e) => {
                    setAskingPrice(e.target.value);
                    if (errors.price) setErrors((prev) => { const next = { ...prev }; delete next.price; return next; });
                  }}
                  placeholder={t.sell.askingPricePlaceholder}
                  className={`w-full rounded-xl border bg-[var(--input-bg)] py-3 pe-4 ps-10 text-[var(--foreground)] placeholder-[var(--muted)] focus:outline-none focus:ring-1 ${errors.price ? 'border-red-500 focus:ring-red-500' : 'border-[var(--input-border)] focus:ring-[var(--accent)]'}`}
                />
                <span className="absolute start-4 top-1/2 -translate-y-1/2 text-[var(--muted)]">₪</span>
              </div>
              {errors.price && <p className="mt-1 text-xs text-red-600">{errors.price}</p>}
            </div>
          </div>
          <p className="mt-2 text-xs text-[var(--muted)]">
            {t.sell.priceNote}
          </p>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <ShieldCheck className="h-5 w-5 shrink-0 text-[var(--accent-text)]" />
          <p className="text-sm text-[var(--accent-text)]">{t.sell.trustNotice}</p>
        </div>

        {submitError && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{submitError}</div>}

        <button
          type="submit"
          disabled={ocrLoading || creatingEvent || submitLoading}
          className="w-full rounded-xl bg-[var(--accent)] py-4 text-lg font-bold text-white transition hover:opacity-90 disabled:opacity-60"
        >
          {(creatingEvent || submitLoading) ? (
            <span className="flex items-center justify-center gap-2"><Loader2 className="h-5 w-5 animate-spin" /> {creatingEvent ? t.sell.creatingEvent : t.common.saving}</span>
          ) : t.sell.submit}
        </button>
      </form>
    </div>
  );
}
