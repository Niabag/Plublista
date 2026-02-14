import { useQuota } from '../hooks/useQuota';
import type { QuotaResource } from '@plublista/shared';

const RESOURCE_LABELS: Record<QuotaResource['resource'], string> = {
  reels: 'AI Reels',
  carousels: 'Carousels',
  aiImages: 'AI Images',
};

function getBarColor(percentage: number): string {
  if (percentage >= 80) return 'bg-rose-500';
  if (percentage >= 60) return 'bg-amber-500';
  return 'bg-emerald-500';
}

function QuotaBar({ resource, used, limit, percentage }: QuotaResource) {
  const color = getBarColor(percentage);
  const label = RESOURCE_LABELS[resource];

  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-700 dark:text-gray-300">{label}</span>
        <span className="text-gray-500 dark:text-gray-400">
          {used}/{limit}
        </span>
      </div>
      <div
        className="mt-1 h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700"
        role="progressbar"
        aria-valuenow={used}
        aria-valuemin={0}
        aria-valuemax={limit}
        aria-label={`${label}: ${used} of ${limit} used`}
      >
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  );
}

export function QuotaIndicator() {
  const { quota, isPending, isError } = useQuota();

  if (isPending) {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Usage This Month
          </h2>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="mb-1 flex justify-between">
                <div className="h-4 w-20 rounded bg-gray-200 dark:bg-gray-700" />
                <div className="h-4 w-10 rounded bg-gray-200 dark:bg-gray-700" />
              </div>
              <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError || !quota) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Usage This Month
        </h2>
      </div>
      <div className="space-y-3">
        {quota.quotas.map((q) => (
          <QuotaBar key={q.resource} {...q} />
        ))}
      </div>
    </div>
  );
}
