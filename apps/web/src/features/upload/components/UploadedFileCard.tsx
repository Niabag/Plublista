import { X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { FileUploadState } from '../hooks/useFileUpload';

interface UploadedFileCardProps {
  upload: FileUploadState;
  onRemove: (file: File) => void;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

export function UploadedFileCard({ upload, onRemove }: UploadedFileCardProps) {
  const { file, progress, status, error } = upload;
  const isVideo = file.type.startsWith('video/');

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-lg border p-3',
        status === 'error'
          ? 'border-rose-300 bg-rose-50 dark:border-rose-800 dark:bg-rose-950'
          : status === 'complete'
            ? 'border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950'
            : 'border-border bg-card',
      )}
    >
      {/* File type icon */}
      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-medium text-muted-foreground">
        {isVideo ? 'VID' : 'IMG'}
      </div>

      {/* File info + progress */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">
          {file.name}
        </p>
        <p className="text-xs text-muted-foreground">
          {formatFileSize(file.size)}
        </p>

        {/* Progress bar */}
        {status === 'uploading' && (
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-indigo-600 transition-all duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {/* Error message */}
        {status === 'error' && error && (
          <p className="mt-0.5 text-xs text-rose-600 dark:text-rose-400">{error}</p>
        )}
      </div>

      {/* Status icon */}
      <div className="shrink-0">
        {status === 'uploading' && (
          <Loader2 className="size-4 animate-spin text-indigo-600" />
        )}
        {status === 'complete' && (
          <CheckCircle className="size-4 text-emerald-500" />
        )}
        {status === 'error' && (
          <AlertCircle className="size-4 text-rose-500" />
        )}
      </div>

      {/* Remove button */}
      <button
        type="button"
        onClick={() => onRemove(file)}
        className="shrink-0 rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
        aria-label={`Remove ${file.name}`}
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
