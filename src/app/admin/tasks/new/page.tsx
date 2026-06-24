'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { ArrowRight, Upload, FileText, Image as ImageIcon, File, X } from 'lucide-react';
import { SECTION_LABELS, SECTION_PAGES } from '@/lib/task-pages';
import { useLocale } from '@/i18n/LocaleProvider';
import type { TaskStatus, TaskSection, TaskFile } from '@/types/database';

interface InternalUser { id: string; full_name: string; }

export default function NewTaskPage() {
  const { t } = useLocale();
  const router = useRouter();
  const [currentUserId, setCurrentUserId] = useState('');
  const [currentUserName, setCurrentUserName] = useState('');
  const [internalUsers, setInternalUsers] = useState<InternalUser[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [status, setStatus] = useState<TaskStatus>('todo');
  const [section, setSection] = useState<TaskSection | ''>('');
  const [page, setPage] = useState('');
  const [device, setDevice] = useState<'not_relevant' | 'mobile' | 'tablet' | 'computer'>('not_relevant');
  const [files, setFiles] = useState<TaskFile[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingFiles = useRef<Map<string, File>>(new Map());

  const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
    { value: 'todo', label: t.status.todo },
    { value: 'done', label: t.status.done },
    { value: 'canceled', label: t.status.canceled },
  ];

  const SECTION_OPTIONS = Object.entries(SECTION_LABELS).map(([value, label]) => ({ value: value as TaskSection, label }));

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
        setAssignedTo(user.id);
        const { data: p } = await supabase.from('profiles').select('full_name').eq('id', user.id).single();
        setCurrentUserName(p?.full_name || '');
      }
      const { data: admins } = await supabase.from('profiles').select('id, full_name').in('role', ['admin', 'internal_user']).order('full_name');
      setInternalUsers((admins || []) as InternalUser[]);
    }
    load();
  }, []);

  const pageOptions = section ? SECTION_PAGES[section as TaskSection] : [];

  function handleSectionChange(val: TaskSection | '') {
    setSection(val);
    setPage('');
  }

  const addFiles = useCallback((fileList: FileList) => {
    const newFiles: TaskFile[] = Array.from(fileList).map((f) => {
      const id = `file-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      pendingFiles.current.set(id, f);
      return { id, name: f.name, size: f.size, type: f.type, url: URL.createObjectURL(f) };
    });
    setFiles(prev => [...prev, ...newFiles]);
  }, []);

  function removeFile(fileId: string) {
    setFiles(prev => {
      const f = prev.find(x => x.id === fileId);
      if (f && f.url.startsWith('blob:')) URL.revokeObjectURL(f.url);
      pendingFiles.current.delete(fileId);
      return prev.filter(x => x.id !== fileId);
    });
  }

  // Upload each locally-added file to storage and return its persisted metadata.
  async function uploadFiles(): Promise<TaskFile[]> {
    const uploaded: TaskFile[] = [];
    for (const f of files) {
      const localFile = pendingFiles.current.get(f.id);
      if (!localFile) { uploaded.push(f); continue; }
      const body = new FormData();
      body.append('file', localFile);
      const res = await fetch('/api/task-files', { method: 'POST', body });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || t.admin.taskForm.fileUploadError);
      }
      const { file: meta } = await res.json();
      uploaded.push(meta as TaskFile);
    }
    return uploaded;
  }

  function formatSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  }

  function getFileIcon(type: string) {
    if (type.startsWith('image/')) return <ImageIcon className="h-4 w-4 text-blue-500" />;
    if (type.includes('pdf')) return <FileText className="h-4 w-4 text-red-500" />;
    return <File className="h-4 w-4 text-[var(--muted)]" />;
  }

  async function handleSave() {
    if (!name.trim()) { setError(t.admin.taskForm.nameError); return; }
    setSaving(true);
    setError('');
    const supabase = createClient();
    let uploadedFiles: TaskFile[];
    try {
      uploadedFiles = await uploadFiles();
    } catch (e) {
      setSaving(false);
      setError(e instanceof Error ? e.message : t.admin.taskForm.fileUploadError);
      return;
    }
    const { error: err } = await supabase.from('tasks').insert({
      name: name.trim(),
      description,
      assigned_to: assignedTo || null,
      created_by: currentUserId,
      status,
      section: section || null,
      page: page || null,
      device,
      files: uploadedFiles,
      active: true,
    });
    setSaving(false);
    if (err) { setError(err.message); return; }
    router.push('/admin/tasks');
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <div className="mb-8 flex items-center gap-4">
        <button onClick={() => router.push('/admin/tasks')} className="rounded-lg p-2 text-[var(--muted)] transition hover:bg-[var(--input-bg)] hover:text-[var(--foreground)]">
          <ArrowRight className="h-5 w-5 rtl:rotate-180" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-[var(--foreground)]">{t.admin.taskForm.newTitle}</h1>
        </div>
        <button onClick={handleSave} disabled={saving || !name.trim()} className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50">
          {saving ? t.common.saving : t.admin.taskForm.createButton}
        </button>
      </div>

      {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="overflow-hidden rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-[var(--muted)]">{t.admin.taskForm.nameLabel}</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder={t.admin.taskForm.namePlaceholder} className="w-full rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] px-3 py-2.5 text-sm text-[var(--foreground)] placeholder-[var(--muted)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]" />
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-[var(--muted)]">{t.admin.taskForm.descLabel}</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t.admin.taskForm.descPlaceholder} rows={3} className="w-full rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] px-3 py-2.5 text-sm text-[var(--foreground)] placeholder-[var(--muted)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]" />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--muted)]">{t.admin.taskForm.sectionLabel}</label>
            <select value={section} onChange={(e) => handleSectionChange(e.target.value as TaskSection | '')} className="w-full rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)]">
              <option value="">{t.admin.taskForm.sectionPlaceholder}</option>
              {SECTION_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--muted)]">{t.admin.taskForm.pageLabel}</label>
            <select value={page} onChange={(e) => setPage(e.target.value)} disabled={!section} className="w-full rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)] disabled:opacity-40">
              <option value="">{t.admin.taskForm.pagePlaceholder}</option>
              {pageOptions.map((p) => <option key={p.path} value={p.path}>{p.label}</option>)}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--muted)]">{t.admin.taskForm.deviceLabel}</label>
            <select value={device} onChange={(e) => setDevice(e.target.value as typeof device)} className="w-full rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)]">
              <option value="not_relevant">{t.admin.taskForm.deviceNotRelevant}</option>
              <option value="mobile">{t.admin.taskForm.deviceMobile}</option>
              <option value="tablet">{t.admin.taskForm.deviceTablet}</option>
              <option value="computer">{t.admin.taskForm.deviceComputer}</option>
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--muted)]">{t.admin.taskForm.assigneeLabel}</label>
            <select value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} className="w-full rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)]">
              <option value="">{t.admin.taskForm.assigneePlaceholder}</option>
              {internalUsers.map((u) => <option key={u.id} value={u.id}>{u.full_name}</option>)}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--muted)]">{t.admin.taskForm.statusLabel}</label>
            <select value={status} onChange={(e) => setStatus(e.target.value as TaskStatus)} className="w-full rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)]">
              {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--muted)]">{t.admin.taskForm.createdByLabel}</label>
            <p className="rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] px-3 py-2.5 text-sm text-[var(--muted)]">{currentUserName || '—'}</p>
          </div>
        </div>

        <div className="mt-5">
          <label className="mb-1.5 block text-sm font-medium text-[var(--muted)]">{t.admin.taskForm.filesLabel}</label>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files); }}
            onClick={() => fileInputRef.current?.click()}
            className={`flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed px-4 py-6 transition ${dragging ? 'border-[var(--accent)] bg-emerald-50/50' : 'border-[var(--input-border)] hover:border-[var(--accent)]/50'}`}
          >
            <Upload className="h-5 w-5 text-[var(--muted)]" />
            <p className="text-xs text-[var(--muted)]">{t.admin.taskForm.filesHint}</p>
            <input ref={fileInputRef} type="file" multiple className="hidden" onChange={(e) => { if (e.target.files?.length) { addFiles(e.target.files); e.target.value = ''; } }} />
          </div>
          {files.length > 0 && (
            <div className="mt-2 space-y-1.5">
              {files.map((f) => (
                <div key={f.id} className="flex items-center gap-2 rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] px-3 py-2">
                  {getFileIcon(f.type)}
                  <span className="flex-1 truncate text-xs text-[var(--foreground)]">{f.name}</span>
                  <span className="text-[10px] text-[var(--muted)]">{formatSize(f.size)}</span>
                  <button onClick={() => removeFile(f.id)} className="rounded p-0.5 text-[var(--muted)] hover:text-red-600"><X className="h-3.5 w-3.5" /></button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
