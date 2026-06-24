'use client';

import { useState, useRef, useEffect } from 'react';
import { Settings2, ArrowUp, ArrowDown, ChevronsUpDown } from 'lucide-react';

interface Column<T> {
  key: string;
  header: string;
  render: (item: T) => React.ReactNode;
  sortable?: boolean;
  sortValue?: (item: T) => string | number;
  defaultHidden?: boolean;
}

interface AdminTableProps<T> {
  columns: Column<T>[];
  data: T[];
  emptyMessage?: string;
}

export default function AdminTable<T>({ columns, data, emptyMessage = 'אין נתונים להצגה' }: AdminTableProps<T>) {
  const [hiddenColumns, setHiddenColumns] = useState<Set<string>>(() => {
    return new Set(columns.filter((c) => c.defaultHidden).map((c) => c.key));
  });
  const [showColumnPicker, setShowColumnPicker] = useState(false);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowColumnPicker(false);
      }
    }
    if (showColumnPicker) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showColumnPicker]);

  const visibleColumns = columns.filter((c) => !hiddenColumns.has(c.key));

  function toggleColumn(key: string) {
    setHiddenColumns((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function handleSort(col: Column<T>) {
    if (!col.sortable) return;
    if (sortKey === col.key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(col.key);
      setSortDir('asc');
    }
  }

  let sortedData = data;
  if (sortKey) {
    const col = columns.find((c) => c.key === sortKey);
    if (col?.sortValue) {
      sortedData = [...data].sort((a, b) => {
        const va = col.sortValue!(a);
        const vb = col.sortValue!(b);
        if (va < vb) return sortDir === 'asc' ? -1 : 1;
        if (va > vb) return sortDir === 'asc' ? 1 : -1;
        return 0;
      });
    }
  }

  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-12 text-center">
        <p className="text-[var(--muted)]">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="relative overflow-x-auto rounded-xl border border-[var(--card-border)] bg-[var(--card)]">
      {/* Column picker button */}
      <div ref={pickerRef} className="absolute left-2 top-2 z-10">
        <button
          onClick={() => setShowColumnPicker(!showColumnPicker)}
          className={`rounded-lg p-1.5 transition ${showColumnPicker ? 'bg-emerald-50 text-[var(--accent-text)]' : 'text-[var(--muted)] hover:bg-[var(--input-bg)] hover:text-[var(--foreground)]'}`}
          title="הצג/הסתר עמודות"
        >
          <Settings2 className="h-4 w-4" />
        </button>
        {showColumnPicker && (
          <div className="absolute left-0 top-full mt-1 min-w-[160px] rounded-xl border border-[var(--card-border)] bg-[var(--card)] py-2 shadow-lg">
            {columns.map((col) => (
              <label key={col.key} className="flex cursor-pointer items-center gap-2 px-3 py-1.5 text-sm hover:bg-[var(--input-bg)]">
                <input
                  type="checkbox"
                  checked={!hiddenColumns.has(col.key)}
                  onChange={() => toggleColumn(col.key)}
                  className="h-3.5 w-3.5 rounded border-[var(--input-border)] accent-[var(--accent)]"
                />
                <span className="text-[var(--foreground)]">{col.header || col.key}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      <table className="w-full">
        <thead>
          <tr className="border-b border-[var(--card-border)]">
            {visibleColumns.map((col) => (
              <th
                key={col.key}
                onClick={() => handleSort(col)}
                className={`px-5 py-3.5 text-start text-xs font-medium uppercase tracking-wider text-[var(--muted)] ${col.sortable ? 'cursor-pointer select-none hover:text-[var(--foreground)]' : ''}`}
              >
                <span className="flex items-center gap-1">
                  {col.header}
                  {col.sortable && (
                    sortKey === col.key
                      ? sortDir === 'asc'
                        ? <ArrowUp className="h-3 w-3" />
                        : <ArrowDown className="h-3 w-3" />
                      : <ChevronsUpDown className="h-3 w-3 opacity-40" />
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--card-border)]">
          {sortedData.map((item, i) => (
            <tr key={i} className="transition-colors hover:bg-[var(--input-bg)]">
              {visibleColumns.map((col) => (
                <td key={col.key} className="whitespace-nowrap px-5 py-3.5 text-sm">
                  {col.render(item)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export type { Column };
