import { Instagram, Loader2, CheckCircle, XCircle, ExternalLink, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';

const PLATFORM_META: Record<string, { label: string; icon?: typeof Instagram }> = {
  instagram: { label: 'Instagram', icon: Instagram },
  youtube: { label: 'YouTube' },
  tiktok: { label: 'TikTok' },
  facebook: { label: 'Facebook' },
  linkedin: { label: 'LinkedIn' },
  x: { label: 'X (Twitter)' },
};

interface PublishJob {
  id: string;
  platform: string;
  status: 'pending' | 'publishing' | 'published' | 'failed' | 'retrying';
  publishedUrl: string | null;
  errorMessage: string | null;
}

interface PublishProgressDialogProps {
  open: boolean;
  onClose: () => void;
  jobs: PublishJob[];
  onRetryFailed?: () => void;
}

export function PublishProgressDialog({
  open,
  onClose,
  jobs,
  onRetryFailed,
}: PublishProgressDialogProps) {
  if (!open || jobs.length === 0) return null;

  const publishedCount = jobs.filter((j) => j.status === 'published').length;
  const failedCount = jobs.filter((j) => j.status === 'failed').length;
  const activeCount = jobs.filter(
    (j) => j.status === 'pending' || j.status === 'publishing' || j.status === 'retrying',
  ).length;
  const allDone = activeCount === 0;
  const allSuccess = allDone && failedCount === 0;
  const hasFailures = failedCount > 0;

  const summaryText = !allDone
    ? `Publishing to ${jobs.length} platform${jobs.length > 1 ? 's' : ''}...`
    : allSuccess
      ? `Published to ${publishedCount} platform${publishedCount > 1 ? 's' : ''}!`
      : `Published to ${publishedCount}/${jobs.length} platforms`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative mx-4 w-full max-w-md rounded-lg border bg-background p-6 shadow-lg">
        {allDone && (
          <button
            onClick={onClose}
            className="absolute top-3 right-3 rounded p-1 text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        )}

        <h2 className="mb-1 text-lg font-semibold">
          {allSuccess ? 'Published!' : allDone ? 'Publishing Complete' : 'Publishing...'}
        </h2>
        <p className="mb-4 text-sm text-muted-foreground">{summaryText}</p>

        <div className="space-y-2">
          {jobs.map((job) => {
            const meta = PLATFORM_META[job.platform] ?? { label: job.platform };
            const Icon = meta.icon;

            return (
              <div
                key={job.id}
                className={cn(
                  'flex items-center justify-between rounded-lg border px-4 py-3',
                  job.status === 'published'
                    ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950'
                    : job.status === 'failed'
                      ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950'
                      : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900',
                )}
              >
                <div className="flex items-center gap-3">
                  {Icon ? (
                    <Icon className="size-5 text-indigo-600" />
                  ) : (
                    <div className="flex size-5 items-center justify-center text-xs font-bold text-muted-foreground">
                      {meta.label.charAt(0)}
                    </div>
                  )}
                  <div>
                    <span className="text-sm font-medium">{meta.label}</span>
                    {job.status === 'failed' && job.errorMessage && (
                      <p className="text-xs text-red-600 dark:text-red-400">{job.errorMessage}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {job.status === 'pending' || job.status === 'publishing' || job.status === 'retrying' ? (
                    <Loader2 className="size-4 animate-spin text-indigo-500" />
                  ) : job.status === 'published' ? (
                    <div className="flex items-center gap-1">
                      <CheckCircle className="size-4 text-emerald-500" />
                      {job.publishedUrl && (
                        <a
                          href={job.publishedUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
                        >
                          <ExternalLink className="size-3" />
                        </a>
                      )}
                    </div>
                  ) : (
                    <XCircle className="size-4 text-red-500" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          {allDone && hasFailures && onRetryFailed && (
            <Button variant="outline" onClick={onRetryFailed} className="gap-2">
              Retry Failed
            </Button>
          )}
          {allDone && (
            <Button onClick={onClose}>
              {allSuccess ? 'Done' : 'Close'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
