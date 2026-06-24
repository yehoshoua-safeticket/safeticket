'use client';

import { useRef, useState, useEffect, KeyboardEvent } from 'react';
import { Search, X } from 'lucide-react';
import { useLocale } from '@/i18n/LocaleProvider';

export interface SearchField {
  field: string;
  label: string;
}

export interface SearchFilter {
  field: string;
  value: string;
}

interface Props {
  fields: SearchField[];
  filters: SearchFilter[];
  onChange: (filters: SearchFilter[]) => void;
  placeholder?: string;
  className?: string;
}

export default function FieldSearch({ fields, filters, onChange, placeholder, className = '' }: Props) {
  const [inputValue, setInputValue] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { t } = useLocale();

  const resolvedPlaceholder = placeholder ?? t.fieldSearch.search + '...';

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current && !inputRef.current.contains(e.target as Node)
      ) setShowDropdown(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function applyFilter(field: string) {
    const value = inputValue.trim();
    if (!value) return;
    onChange([...filters.filter((f) => f.field !== field), { field, value }]);
    setInputValue('');
    setShowDropdown(false);
    setHighlightedIndex(0);
    inputRef.current?.focus();
  }

  function removeFilter(field: string) {
    onChange(filters.filter((f) => f.field !== field));
    inputRef.current?.focus();
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') { setShowDropdown(false); setInputValue(''); return; }
    if (e.key === 'Backspace' && inputValue === '' && filters.length > 0) {
      e.preventDefault();
      onChange(filters.slice(0, -1));
      return;
    }
    if (!showDropdown || !inputValue.trim()) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setHighlightedIndex((i) => (i + 1) % fields.length); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHighlightedIndex((i) => (i - 1 + fields.length) % fields.length); }
    else if (e.key === 'Enter') { e.preventDefault(); applyFilter(fields[highlightedIndex].field); }
  }

  return (
    <div className={`relative ${className}`}>
      <div className="flex min-h-[44px] flex-wrap items-center gap-1.5 rounded-[10px] border border-[var(--input-border)] bg-[var(--input-bg)] px-3 py-2 focus-within:border-[var(--accent)]">
        <Search className="h-4 w-4 shrink-0 text-[var(--muted)]" />
        {filters.map((f) => (
          <span key={f.field} className="flex items-center gap-1 rounded-[5px] border border-[var(--accent)]/30 bg-[var(--accent-soft)] px-2 py-0.5 text-xs font-semibold text-[var(--accent-text)] whitespace-nowrap">
            {fields.find((s) => s.field === f.field)?.label}: {f.value}
            <button onClick={() => removeFilter(f.field)} className="hover:opacity-70"><X className="h-3 w-3" /></button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => { setInputValue(e.target.value); setShowDropdown(e.target.value.trim().length > 0); setHighlightedIndex(0); }}
          onFocus={() => { if (inputValue.trim()) setShowDropdown(true); }}
          onKeyDown={handleKeyDown}
          placeholder={filters.length === 0 ? resolvedPlaceholder : ''}
          className="min-w-[80px] flex-1 bg-transparent text-sm text-[var(--foreground)] placeholder-[var(--muted)] focus:outline-none"
        />
      </div>

      {showDropdown && inputValue.trim() && (
        <div ref={dropdownRef} className="absolute top-full z-20 mt-1.5 w-full min-w-[220px] overflow-hidden rounded-[10px] border border-[var(--card-border)] bg-[var(--surface-2)] elev-2">
          {fields.map((s, i) => (
            <button
              key={s.field}
              onMouseDown={(e) => { e.preventDefault(); applyFilter(s.field); }}
              onMouseEnter={() => setHighlightedIndex(i)}
              className={`flex w-full items-center gap-2 px-4 py-2.5 text-start text-sm ${highlightedIndex === i ? 'bg-[var(--input-bg)]' : ''}`}
            >
              <span className="text-[var(--muted)]">{t.fieldSearch.search}</span>
              <span className="font-medium text-[var(--foreground)]">&ldquo;{inputValue}&rdquo;</span>
              <span className="text-[var(--muted)]">{t.fieldSearch.in}{s.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
