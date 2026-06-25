'use client';

import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { Plus, ClipboardList, ChevronDown, X, Archive, Settings2, ArrowUp, ArrowDown, ChevronsUpDown, User, Paperclip } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import StatusBadge from '@/components/ui/StatusBadge';
import FieldSearch from '@/components/ui/FieldSearch';
import type { SearchFilter } from '@/components/ui/FieldSearch';
import { SECTION_LABELS } from '@/lib/task-pages';
import { useLocale } from '@/i18n/LocaleProvider';
import type { EmployeeTask, TaskStatus, TaskSection } from '@/types/database';

interface InternalUser { id: string; full_name: string; }

export default function TasksPage() {
  const { t } = useLocale();
  const router = useRouter();
  const [tasks, setTasks] = useState<EmployeeTask[]>([]);
  const [internalUsers, setInternalUsers] = useState<InternalUser[]>([]);
  const [currentUserId, setCurrentUserId] = useState('');
  const [loading, setLoading] = useState(true);

  const [showArchived, setShowArchived] = useState(false);
  const [searchFilters, setSearchFilters] = useState<SearchFilter[]>([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterSection, setFilterSection] = useState('all');
  const [filterMine, setFilterMine] = useState(false);
  const [groupBy, setGroupBy] = useState<'none' | 'user' | 'section'>('none');
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [hiddenCols, setHiddenCols] = useState<Set<string>>(new Set());
  const [showColPicker, setShowColPicker] = useState(false);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const colPickerRef = useRef<HTMLDivElement>(null);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [bulkSaving, setBulkSaving] = useState(false);

  const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
    { value: 'todo', label: t.status.todo },
    { value: 'done', label: t.status.done },
    { value: 'canceled', label: t.status.canceled },
  ];

  const SECTION_OPTIONS = Object.entries(SECTION_LABELS).map(([value, label]) => ({ value: value as TaskSection, label }));

  async function loadTasks() {
    const supabase = createClient();
    const { data } = await supabase
      .from('tasks')
      .select('*, assignee:profiles!assigned_to(id, full_name), creator:profiles!created_by(id, full_name)')
      .order('created_at', { ascending: false });
    setTasks((data || []) as unknown as EmployeeTask[]);
  }

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }
      const { data: admins } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('role', ['admin', 'internal_user'])
        .order('full_name');
      setInternalUsers((admins || []) as InternalUser[]);
      await loadTasks();
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (colPickerRef.current && !colPickerRef.current.contains(e.target as Node)) setShowColPicker(false);
    }
    if (showColPicker) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showColPicker]);

  interface TaskColumn { key: string; header: string; sortValue?: (t: EmployeeTask) => string | number; }

  const allColumns: TaskColumn[] = [
    { key: 'name',        header: t.admin.tasks.colName,        sortValue: (task) => task.name },
    { key: 'description', header: t.admin.tasks.colDescription, sortValue: (task) => task.description },
    { key: 'section',     header: t.admin.tasks.colSection,     sortValue: (task) => task.section || '' },
    { key: 'page',        header: t.admin.tasks.colPage,        sortValue: (task) => task.page || '' },
    { key: 'user',        header: t.admin.tasks.colUser,        sortValue: (task) => task.assignee?.full_name || '' },
    { key: 'status',      header: t.admin.tasks.colStatus,      sortValue: (task) => task.status },
    { key: 'created_at',  header: t.admin.tasks.colCreatedAt,   sortValue: (task) => task.created_at },
    { key: 'created_by',  header: t.admin.tasks.colCreatedBy,   sortValue: (task) => task.creator?.full_name || '' },
  ];

  const visibleColumns = allColumns.filter((c) => !hiddenCols.has(c.key));

  function handleSort(col: TaskColumn) {
    if (!col.sortValue) return;
    if (sortKey === col.key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(col.key); setSortDir('asc'); }
  }

  const filteredTasks = useMemo(() => tasks.filter((task) => {
    if (!showArchived && !task.active) return false;
    if (showArchived && task.active) return false;
    if (filterStatus !== 'all' && task.status !== filterStatus) return false;
    if (filterSection !== 'all' && task.section !== filterSection) return false;
    if (filterMine && task.assigned_to !== currentUserId) return false;
    for (const f of searchFilters) {
      const q = f.value.toLowerCase();
      if (f.field === 'all') {
        if (!task.name.toLowerCase().includes(q) && !task.description.toLowerCase().includes(q)) return false;
      } else {
        const val = f.field === 'name' ? task.name : task.description;
        if (!val.toLowerCase().includes(q)) return false;
      }
    }
    return true;
  }), [tasks, filterStatus, filterSection, filterMine, searchFilters, showArchived, currentUserId]);

  const archivedCount = useMemo(() => tasks.filter((task) => !task.active).length, [tasks]);

  const sortedTasks = useMemo(() => {
    if (!sortKey) return filteredTasks;
    const col = allColumns.find((c) => c.key === sortKey);
    if (!col?.sortValue) return filteredTasks;
    return [...filteredTasks].sort((a, b) => {
      const va = col.sortValue!(a), vb = col.sortValue!(b);
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredTasks, sortKey, sortDir]);

  const grouped = useMemo(() => {
    if (groupBy === 'none') return null;
    const map = new Map<string, EmployeeTask[]>();
    for (const task of sortedTasks) {
      const key = groupBy === 'section'
        ? (task.section ? SECTION_LABELS[task.section] : t.admin.tasks.noSection)
        : (task.assignee?.full_name || t.admin.tasks.noAssignee);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(task);
    }
    return map;
  }, [sortedTasks, groupBy]);

  async function archiveTask(id: string) {
    const supabase = createClient();
    await supabase.from('tasks').update({ active: false }).eq('id', id);
    setTasks((prev) => prev.map((task) => (task.id === id ? { ...task, active: false } : task)));
  }

  async function restoreTask(id: string) {
    const supabase = createClient();
    await supabase.from('tasks').update({ active: true }).eq('id', id);
    setTasks((prev) => prev.map((task) => (task.id === id ? { ...task, active: true } : task)));
  }

  function toggleSelect(id: string) {
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  function toggleSelectAll() {
    setSelected(sortedTasks.length > 0 && selected.size === sortedTasks.length ? new Set() : new Set(sortedTasks.map(task => task.id)));
  }

  async function bulkChangeStatus(status: TaskStatus) {
    setBulkSaving(true);
    const supabase = createClient();
    await Promise.all([...selected].map(id => supabase.from('tasks').update({ status }).eq('id', id)));
    setBulkSaving(false);
    setSelected(new Set());
    await loadTasks();
  }

  async function bulkArchive() {
    setBulkSaving(true);
    await Promise.all([...selected].map(id => archiveTask(id)));
    setBulkSaving(false);
    setSelected(new Set());
  }

  async function bulkRestore() {
    setBulkSaving(true);
    await Promise.all([...selected].map(id => restoreTask(id)));
    setBulkSaving(false);
    setSelected(new Set());
  }

  async function bulkDelete() {
    setBulkSaving(true);
    const supabase = createClient();
    await Promise.all([...selected].map(id => supabase.from('tasks').delete().eq('id', id)));
    setTasks(prev => prev.filter(task => ![...selected].includes(task.id)));
    setBulkSaving(false);
    setSelected(new Set());
    setConfirmBulkDelete(false);
  }

  function toggleGroup(key: string) {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }

  function renderCell(key: string, task: EmployeeTask) {
    switch (key) {
      case 'name':
        return (
          <td key={key} className="px-5 py-3.5 text-sm font-medium text-[var(--foreground)]">
            <span className="flex items-center gap-1.5">
              {task.name}
              {task.files.length > 0 && (
                <span className="flex items-center gap-0.5 text-[var(--muted)]">
                  <Paperclip className="h-3 w-3" /><span className="text-[10px]">{task.files.length}</span>
                </span>
              )}
            </span>
          </td>
        );
      case 'description':
        return <td key={key} className="px-5 py-3.5 text-sm text-[var(--muted)]"><span className="block truncate">{task.description}</span></td>;
      case 'section':
        return (
          <td key={key} className="px-5 py-3.5 text-sm text-[var(--muted)]">
            {task.section ? SECTION_LABELS[task.section] : '—'}
          </td>
        );
      case 'page':
        return <td key={key} className="px-5 py-3.5 font-mono text-xs text-[var(--muted)]">{task.page || '—'}</td>;
      case 'user':
        return <td key={key} className="px-5 py-3.5 text-sm font-medium">{task.assignee?.full_name || '—'}</td>;
      case 'status':
        return <td key={key} className="px-5 py-3.5 text-sm"><StatusBadge status={task.status} /></td>;
      case 'created_at':
        return <td key={key} className="px-5 py-3.5 text-sm text-[var(--muted)]">{new Date(task.created_at).toLocaleDateString('he-IL')}</td>;
      case 'created_by':
        return <td key={key} className="px-5 py-3.5 text-sm text-[var(--muted)]">{task.creator?.full_name || '—'}</td>;
      default:
        return null;
    }
  }

  function renderRow(task: EmployeeTask) {
    return (
      <tr
        key={task.id}
        onClick={() => router.push(`/admin/tasks/${task.id}`)}
        className="cursor-pointer transition-colors hover:bg-[var(--input-bg)]"
      >
        <td className="px-3 py-3.5" onClick={(e) => e.stopPropagation()}>
          <input type="checkbox" checked={selected.has(task.id)} onChange={() => toggleSelect(task.id)} className="h-4 w-4 rounded border-[var(--input-border)] accent-[var(--accent)]" />
        </td>
        {visibleColumns.map((col) => renderCell(col.key, task))}
      </tr>
    );
  }

  function renderCard(task: EmployeeTask) {
    const show = (key: string) => !hiddenCols.has(key);
    return (
      <li
        key={task.id}
        onClick={() => router.push(`/admin/tasks/${task.id}`)}
        className="cursor-pointer space-y-2 p-4 transition-colors hover:bg-[var(--input-bg)]"
      >
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={selected.has(task.id)}
            onChange={() => toggleSelect(task.id)}
            onClick={(e) => e.stopPropagation()}
            className="mt-1 h-4 w-4 shrink-0 rounded border-[var(--input-border)] accent-[var(--accent)]"
          />
          <p className="min-w-0 flex-1 text-sm font-semibold text-[var(--foreground)]">
            <span className="flex items-center gap-1.5">
              {task.name}
              {task.files.length > 0 && (
                <span className="flex items-center gap-0.5 text-[var(--muted)]">
                  <Paperclip className="h-3 w-3" /><span className="text-[10px]">{task.files.length}</span>
                </span>
              )}
            </span>
          </p>
          {show('status') && <span className="shrink-0"><StatusBadge status={task.status} /></span>}
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 ps-7 text-sm text-[var(--muted)]">
          {show('description') && task.description && <span className="min-w-0 truncate">{task.description}</span>}
          {show('section') && <span>{t.admin.tasks.colSection}: {task.section ? SECTION_LABELS[task.section] : '—'}</span>}
          {show('page') && task.page && <span className="font-mono text-xs">{task.page}</span>}
          {show('user') && <span className="font-medium text-[var(--foreground)]">{task.assignee?.full_name || '—'}</span>}
          {show('created_at') && <span>{new Date(task.created_at).toLocaleDateString('he-IL')}</span>}
          {show('created_by') && <span>{t.admin.tasks.colCreatedBy}: {task.creator?.full_name || '—'}</span>}
        </div>
      </li>
    );
  }

  function renderTableHead() {
    return (
      <tr className="border-b border-[var(--card-border)]">
        <th className="w-10 px-3 py-3.5" onClick={(e) => e.stopPropagation()}>
          <input type="checkbox" checked={sortedTasks.length > 0 && selected.size === sortedTasks.length} onChange={toggleSelectAll} className="h-4 w-4 rounded border-[var(--input-border)] accent-[var(--accent)]" />
        </th>
        {visibleColumns.map((col) => (
          <th
            key={col.key}
            onClick={() => handleSort(col)}
            className="cursor-pointer select-none px-5 py-3.5 text-start text-xs font-medium uppercase tracking-wider text-[var(--muted)] hover:text-[var(--foreground)]"
          >
            <span className="flex items-center gap-1">
              {col.header}
              {sortKey === col.key
                ? sortDir === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                : <ChevronsUpDown className="h-3 w-3 opacity-40" />}
            </span>
          </th>
        ))}
        <th className="w-10 px-3 py-3.5">
          <div ref={colPickerRef} className="relative">
            <button
              onClick={() => setShowColPicker(!showColPicker)}
              className={`rounded-lg p-1 transition ${showColPicker ? 'bg-emerald-50 text-[var(--accent-text)]' : 'text-[var(--muted)] hover:bg-[var(--input-bg)] hover:text-[var(--foreground)]'}`}
              title={t.admin.tasks.showHideColumns}
            >
              <Settings2 className="h-4 w-4" />
            </button>
            {showColPicker && (
              <div className="absolute left-0 top-full z-20 mt-1 min-w-[160px] rounded-xl border border-[var(--card-border)] bg-[var(--card)] py-2 shadow-lg">
                {allColumns.map((col) => (
                  <label key={col.key} className="flex cursor-pointer items-center gap-2 px-3 py-1.5 text-sm hover:bg-[var(--input-bg)]">
                    <input
                      type="checkbox"
                      checked={!hiddenCols.has(col.key)}
                      onChange={() => setHiddenCols((prev) => { const next = new Set(prev); if (next.has(col.key)) next.delete(col.key); else next.add(col.key); return next; })}
                      className="h-3.5 w-3.5 rounded border-[var(--input-border)] accent-[var(--accent)]"
                    />
                    <span className="text-[var(--foreground)]">{col.header}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </th>
      </tr>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ClipboardList className="h-6 w-6 text-[var(--accent)]" />
          <div>
            <h1 className="text-2xl font-bold text-[var(--foreground)]">{t.admin.tasks.title}</h1>
            <p className="mt-0.5 text-sm text-[var(--muted)]">{t.admin.tasks.subtitle}</p>
          </div>
        </div>
        <button onClick={() => router.push('/admin/tasks/new')} className="flex items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90">
          <Plus className="h-4 w-4" />{t.admin.tasks.newTask}
        </button>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <FieldSearch
          fields={[
            { field: 'all', label: t.admin.tasks.fieldAll },
            { field: 'name', label: t.admin.tasks.fieldName },
            { field: 'description', label: t.admin.tasks.fieldDescription },
          ]}
          filters={searchFilters}
          onChange={setSearchFilters}
          placeholder={t.admin.tasks.searchPlaceholder}
          className="flex-1 max-w-md"
        />

        <button
          onClick={() => setFilterMine(!filterMine)}
          className={`flex items-center gap-1.5 rounded-xl border px-4 py-2.5 text-sm transition ${
            filterMine
              ? 'border-[var(--accent)] bg-emerald-50 text-[var(--accent-text)]'
              : 'border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--muted)] hover:text-[var(--foreground)]'
          }`}
        >
          <User className="h-3.5 w-3.5" />
          {t.admin.tasks.myTasks}
        </button>

        <select
          value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-4 py-2.5 text-sm text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
        >
          <option value="all">{t.admin.tasks.allStatuses}</option>
          {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>

        <select
          value={filterSection} onChange={(e) => setFilterSection(e.target.value)}
          className="rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-4 py-2.5 text-sm text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
        >
          <option value="all">{t.admin.tasks.allSections}</option>
          {SECTION_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>

        <select
          value={groupBy}
          onChange={(e) => { setGroupBy(e.target.value as 'none' | 'user' | 'section'); setCollapsedGroups(new Set()); }}
          className="rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-4 py-2.5 text-sm text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
        >
          <option value="none">{t.admin.tasks.noGrouping}</option>
          <option value="user">{t.admin.tasks.groupByUser}</option>
          <option value="section">{t.admin.tasks.groupBySection}</option>
        </select>

        <button
          onClick={() => { setShowArchived(!showArchived); setSelected(new Set()); setConfirmBulkDelete(false); }}
          className={`flex items-center gap-1.5 rounded-xl border px-4 py-2.5 text-sm transition ${
            showArchived
              ? 'border-[var(--accent)] bg-emerald-50 text-[var(--accent-text)]'
              : 'border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--muted)] hover:text-[var(--foreground)]'
          }`}
        >
          <Archive className="h-3.5 w-3.5" />
          {t.admin.tasks.archive}{archivedCount > 0 && ` (${archivedCount})`}
        </button>
      </div>

      <p className="mb-4 text-xs text-[var(--muted)]">
        {showArchived
          ? t.admin.tasks.countArchived.replace('{n}', String(sortedTasks.length))
          : t.admin.tasks.countActive.replace('{n}', String(sortedTasks.length))}
      </p>

      {selected.size > 0 && !showArchived && (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-[var(--accent)]/30 bg-[var(--accent-soft)] px-4 py-3">
          <span className="text-sm font-medium text-[var(--accent-text)]">{t.common.selected.replace('{n}', String(selected.size))}</span>
          <div className="flex flex-wrap items-center gap-2">
            <select value="" disabled={bulkSaving} onChange={(e) => { if (e.target.value) bulkChangeStatus(e.target.value as TaskStatus); }} className="rounded-lg border border-[var(--input-border)] bg-white px-2.5 py-1.5 text-xs focus:outline-none">
              <option value="">{t.admin.tasks.bulkStatus}</option>
              {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            <button onClick={bulkArchive} disabled={bulkSaving} className="rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-[var(--foreground)] shadow-sm hover:bg-[var(--input-bg)] disabled:opacity-50">{t.admin.tasks.bulkArchive}</button>
            {confirmBulkDelete ? (
              <span className="flex items-center gap-1.5">
                <span className="text-xs text-red-600">{t.admin.tasks.deletePermanentConfirm.replace('{n}', String(selected.size))}</span>
                <button onClick={bulkDelete} disabled={bulkSaving} className="rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50">{t.common.confirm}</button>
                <button onClick={() => setConfirmBulkDelete(false)} className="rounded px-2 py-1 text-xs text-[var(--muted)] hover:bg-[var(--input-bg)]">{t.common.cancel}</button>
              </span>
            ) : (
              <button onClick={() => setConfirmBulkDelete(true)} className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100">{t.common.delete}</button>
            )}
          </div>
          <button onClick={() => { setSelected(new Set()); setConfirmBulkDelete(false); }} className="mr-auto text-xs text-[var(--muted)] hover:text-[var(--foreground)]">{t.common.clearSelection}</button>
        </div>
      )}

      {selected.size > 0 && showArchived && (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-[var(--accent)]/30 bg-[var(--accent-soft)] px-4 py-3">
          <span className="text-sm font-medium text-[var(--accent-text)]">{t.common.selected.replace('{n}', String(selected.size))}</span>
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={bulkRestore} disabled={bulkSaving} className="rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-[var(--foreground)] shadow-sm hover:bg-[var(--input-bg)] disabled:opacity-50">{t.admin.tasks.bulkRestore}</button>
            {confirmBulkDelete ? (
              <span className="flex items-center gap-1.5">
                <span className="text-xs text-red-600">{t.admin.tasks.deletePermanentConfirm.replace('{n}', String(selected.size))}</span>
                <button onClick={bulkDelete} disabled={bulkSaving} className="rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50">{t.common.confirm}</button>
                <button onClick={() => setConfirmBulkDelete(false)} className="rounded px-2 py-1 text-xs text-[var(--muted)] hover:bg-[var(--input-bg)]">{t.common.cancel}</button>
              </span>
            ) : (
              <button onClick={() => setConfirmBulkDelete(true)} className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100">{t.admin.tasks.bulkDeletePermanent}</button>
            )}
          </div>
          <button onClick={() => { setSelected(new Set()); setConfirmBulkDelete(false); }} className="mr-auto text-xs text-[var(--muted)] hover:text-[var(--foreground)]">{t.common.clearSelection}</button>
        </div>
      )}

      {loading ? (
        <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-12 text-center text-sm text-[var(--muted)]">{t.common.loading}</div>
      ) : sortedTasks.length === 0 ? (
        <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-12 text-center">
          <p className="text-[var(--muted)]">{showArchived ? t.admin.tasks.emptyArchived : t.admin.tasks.emptyActive}</p>
        </div>
      ) : grouped ? (
        <div className="space-y-4">
          {Array.from(grouped.entries()).map(([groupName, groupTasks]) => {
            const isCollapsed = collapsedGroups.has(groupName);
            return (
              <div key={groupName} className="overflow-hidden rounded-xl border border-[var(--card-border)] bg-[var(--card)]">
                <button
                  onClick={() => toggleGroup(groupName)}
                  className="flex w-full items-center gap-2 border-b border-[var(--card-border)] bg-[var(--background)] px-5 py-3 text-start"
                >
                  <ChevronDown className={`h-4 w-4 text-[var(--muted)] transition-transform ${isCollapsed ? '-rotate-90' : ''}`} />
                  <span className="text-sm font-semibold text-[var(--foreground)]">{groupName}</span>
                  <span className="mr-auto rounded-full bg-[var(--input-bg)] px-2.5 py-0.5 text-xs text-[var(--muted)]">{groupTasks.length}</span>
                </button>
                {!isCollapsed && (
                  <>
                    <div className="hidden overflow-x-auto lg:block">
                      <table className="hidden w-full lg:table">
                        <thead>{renderTableHead()}</thead>
                        <tbody className="divide-y divide-[var(--card-border)]">{groupTasks.map(renderRow)}</tbody>
                      </table>
                    </div>
                    <ul className="divide-y divide-[var(--card-border)] lg:hidden">{groupTasks.map(renderCard)}</ul>
                  </>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[var(--card-border)] bg-[var(--card)]">
          <table className="hidden w-full lg:table">
            <thead>{renderTableHead()}</thead>
            <tbody className="divide-y divide-[var(--card-border)]">{sortedTasks.map(renderRow)}</tbody>
          </table>
          <ul className="divide-y divide-[var(--card-border)] lg:hidden">{sortedTasks.map(renderCard)}</ul>
        </div>
      )}
    </div>
  );
}
