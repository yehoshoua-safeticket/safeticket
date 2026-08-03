'use client';

import { useEffect, useState } from 'react';
import { FileText, Image as ImageIcon, File, X, ExternalLink } from 'lucide-react';
import { useLocale } from '@/i18n/LocaleProvider';
import type { TaskFile } from '@/types/database';

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function isImage(type: string) {
  return type.startsWith('image/');
}

function isPdf(type: string) {
  return type.includes('pdf');
}

function getFileIcon(type: string) {
  if (isImage(type)) return <ImageIcon className="h-4 w-4 text-blue-500" />;
  if (isPdf(type)) return <FileText className="h-4 w-4 text-red-500" />;
  return <File className="h-4 w-4 text-[var(--muted)]" />;
}

// Attachment list for the task form. Images and PDFs open in an inline preview;
// anything else opens in a new tab, since the browser can't render it here.
export default function TaskFileList({ files, onRemove }: { files: TaskFile[]; onRemove: (fileId: string) => void }) {
  const { t } = useLocale();
  const [preview, setPreview] = useState<TaskFile | null>(null);

  useEffect(() => {
    if (!preview) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setPreview(null);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [preview]);

  if (files.length === 0) return null;

  return (
    <>
      <div className="mt-2 space-y-1.5">
        {files.map((f) => {
          const previewable = isImage(f.type) || isPdf(f.type);
          return (
            <div key={f.id} className="flex items-center gap-2 rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] px-3 py-2">
              {isImage(f.type) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={f.url} alt="" className="h-8 w-8 shrink-0 rounded object-cover" />
              ) : (
                getFileIcon(f.type)
              )}
              {previewable ? (
                <button
                  type="button"
                  onClick={() => setPreview(f)}
                  className="flex-1 truncate text-start text-xs text-[var(--foreground)] hover:underline"
                  title={f.name}
                >
                  {f.name}
                </button>
              ) : (
                <a
                  href={f.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-1 items-center gap-1 truncate text-xs text-[var(--foreground)] hover:underline"
                  title={f.name}
                >
                  <span className="truncate">{f.name}</span>
                  <ExternalLink className="h-3 w-3 shrink-0 text-[var(--muted)]" />
                </a>
              )}
              <span className="shrink-0 text-[10px] text-[var(--muted)]">{formatSize(f.size)}</span>
              <button
                type="button"
                onClick={() => onRemove(f.id)}
                className="rounded p-0.5 text-[var(--muted)] hover:text-red-600"
                title={t.common.remove}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>

      {preview && (
        <div
          onClick={() => setPreview(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-full w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-[var(--card)] shadow-xl"
          >
            <div className="flex items-center gap-3 border-b border-[var(--card-border)] px-4 py-3">
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-[var(--foreground)]">{preview.name}</span>
              <a
                href={preview.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex shrink-0 items-center gap-1.5 text-xs text-[var(--accent-text)] hover:underline"
              >
                <ExternalLink className="h-3.5 w-3.5" />{t.admin.taskForm.openInNewTab}
              </a>
              <button
                type="button"
                onClick={() => setPreview(null)}
                className="shrink-0 rounded-lg p-1 text-[var(--muted)] transition hover:bg-[var(--input-bg)] hover:text-[var(--foreground)]"
                title={t.common.close}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="overflow-auto p-4">
              {isPdf(preview.type) ? (
                <iframe src={preview.url} className="h-[70vh] w-full rounded-lg border border-[var(--card-border)]" title={preview.name} />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview.url} alt={preview.name} className="mx-auto max-h-[70vh] rounded-lg" />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
