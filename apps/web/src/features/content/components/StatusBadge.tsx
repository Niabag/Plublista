import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/cn';
import type { ContentStatus } from '@publista/shared';

const STATUS_CONFIG: Record<ContentStatus, { label: string; className: string }> = {
  draft: {
    label: 'Draft',
    className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  },
  generating: {
    label: 'Generating',
    className: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300 animate-pulse',
  },
  scheduled: {
    label: 'Scheduled',
    className: 'bg-sky-100 text-sky-700 dark:bg-sky-900 dark:text-sky-300',
  },
  published: {
    label: 'Published',
    className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
  },
  failed: {
    label: 'Failed',
    className: 'bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300',
  },
  retrying: {
    label: 'Retrying',
    className: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300 animate-pulse',
  },
};

interface StatusBadgeProps {
  status: ContentStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];

  return (
    <Badge
      variant="outline"
      className={cn('border-transparent', config.className, className)}
    >
      {config.label}
    </Badge>
  );
}
