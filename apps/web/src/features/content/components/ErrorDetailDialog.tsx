import { useNavigate } from 'react-router-dom';
import { Instagram, XCircle, X, RefreshCw, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ContentItem } from '@publista/shared';

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
  status: string;
  publishedUrl: string | null;
  errorMessage: string | null;
}

interface ErrorDetailDialogProps {
  open: boolean;
  onClose: () => void;
  item: ContentItem | null;
  jobs: PublishJob[];
  onRetry: (platforms: string[]) => void;
  isRetrying?: boolean;
}

export function ErrorDetailDialog({
  open,
  onClose,
  item,
  jobs,
  onRetry,
  isRetrying,
}: ErrorDetailDialogProps) {
  const navigate = useNavigate();

  if (!open || !item) return null;

  const failedJobs = jobs.filter((j) => j.status === 'failed');
  const failedPlatforms = failedJobs.map((j) => j.platform);

  const handleRetry = () => {
    if (failedPlatforms.length > 0) {
      onRetry(failedPlatforms);
    }
  };

  const handleViewContent = () => {
    onClose();
    navigate(`/create/${item.type}/${item.id}/preview`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative mx-4 w-full max-w-md rounded-lg border bg-background p-6 shadow-lg">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 rounded p-1 text-muted-foreground hover:text-foreground"
        >
          <X className="size-4" />
        </button>

        <h2 className="mb-1 text-lg font-semibold text-foreground">Publishing Failed</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          {item.title ?? 'Untitled'} &mdash; {failedJobs.length} platform{failedJobs.length !== 1 ? 's' : ''} failed
        </p>

        <div className="space-y-2">
          {failedJobs.map((job) => {
            const meta = PLATFORM_META[job.platform] ?? { label: job.platform };
            const Icon = meta.icon;

            return (
              <div
                key={job.id}
                className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 dark:border-red-800 dark:bg-red-950"
              >
                <div className="mt-0.5 flex-shrink-0">
                  {Icon ? (
                    <Icon className="size-5 text-red-500" />
                  ) : (
                    <XCircle className="size-5 text-red-500" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-sm font-medium text-foreground">{meta.label}</span>
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {job.errorMessage ?? 'An unexpected error occurred. Please try again.'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Dismiss
          </Button>
          <Button variant="outline" onClick={handleViewContent} className="gap-2">
            <ExternalLink className="size-4" />
            View Content
          </Button>
          {failedPlatforms.length > 0 && (
            <Button onClick={handleRetry} disabled={isRetrying} className="gap-2">
              <RefreshCw className={`size-4 ${isRetrying ? 'animate-spin' : ''}`} />
              {isRetrying ? 'Retrying...' : 'Retry'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
