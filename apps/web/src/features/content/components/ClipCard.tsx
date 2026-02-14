import { X, GripVertical, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/cn';
import { formatDuration } from '@/features/upload/utils/videoMetadata';

export interface ClipData {
  id: string;
  file: File;
  fileKey: string;
  fileName: string;
  thumbnailUrl: string;
  duration: number;
  status: 'uploading' | 'processing' | 'ready' | 'error';
  error?: string;
}

interface ClipCardProps {
  clip: ClipData;
  onRemove: (id: string) => void;
  dragHandleProps?: Record<string, unknown>;
  isDragging?: boolean;
}

export function ClipCard({ clip, onRemove, dragHandleProps, isDragging }: ClipCardProps) {
  const isLoading = clip.status === 'uploading' || clip.status === 'processing';
  const isError = clip.status === 'error';

  return (
    <div
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-lg border bg-white transition-shadow dark:bg-gray-900',
        isDragging && 'z-50 shadow-xl opacity-90',
        isError
          ? 'border-rose-300 dark:border-rose-800'
          : 'border-gray-200 dark:border-gray-700',
      )}
    >
      {/* Thumbnail area — 16:9 aspect ratio */}
      <div className="relative aspect-video w-full bg-gray-100 dark:bg-gray-800">
        {isLoading ? (
          <div className="flex size-full animate-pulse items-center justify-center">
            <div className="h-3/4 w-3/4 rounded bg-gray-200 dark:bg-gray-700" />
          </div>
        ) : isError ? (
          <div className="flex size-full items-center justify-center">
            <AlertCircle className="size-8 text-rose-400" />
          </div>
        ) : (
          <img
            src={clip.thumbnailUrl}
            alt={`Thumbnail of ${clip.fileName}`}
            className="size-full object-cover"
          />
        )}

        {/* Duration badge */}
        {clip.status === 'ready' && (
          <span className="absolute bottom-1.5 right-1.5 rounded bg-black/70 px-1.5 py-0.5 text-xs font-medium text-white">
            {formatDuration(clip.duration)}
          </span>
        )}

        {/* Remove button — visible on hover */}
        <button
          type="button"
          onClick={() => onRemove(clip.id)}
          className="absolute right-1.5 top-1.5 flex size-7 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity hover:bg-black/80 group-hover:opacity-100 focus:opacity-100"
          aria-label={`Remove ${clip.fileName}`}
        >
          <X className="size-4" />
        </button>
      </div>

      {/* Info bar */}
      <div className="flex items-center gap-1.5 px-2 py-1.5">
        {/* Drag handle */}
        <button
          type="button"
          className="shrink-0 cursor-grab touch-none rounded p-0.5 text-muted-foreground hover:text-foreground active:cursor-grabbing"
          aria-label="Drag to reorder"
          {...dragHandleProps}
        >
          <GripVertical className="size-4" />
        </button>

        {/* Filename */}
        <p className="min-w-0 flex-1 truncate text-xs text-foreground">
          {clip.fileName}
        </p>
      </div>

      {/* Error message */}
      {isError && clip.error && (
        <p className="px-2 pb-1.5 text-xs text-rose-600 dark:text-rose-400">{clip.error}</p>
      )}
    </div>
  );
}
