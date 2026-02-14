import { useQuota } from '../hooks/useQuota';

function getBarColor(percentage: number): string {
  if (percentage >= 80) return 'bg-rose-500';
  if (percentage >= 60) return 'bg-amber-500';
  return 'bg-emerald-500';
}

export function QuotaIndicator() {
  const { quota, isPending, isError } = useQuota();

  if (isPending) {
    return (
      <div className="space-y-3">
        <div className="h-5 w-40 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        <div className="animate-pulse">
          <div className="mb-1 flex justify-between">
            <div className="h-4 w-24 rounded bg-gray-200 dark:bg-gray-700" />
            <div className="h-4 w-16 rounded bg-gray-200 dark:bg-gray-700" />
          </div>
          <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700" />
        </div>
      </div>
    );
  }

  if (isError || !quota) {
    return null;
  }

  const color = getBarColor(quota.percentage);
  const remaining = quota.creditsLimit - quota.creditsUsed;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Usage This Month
        </h2>
        <span className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
          {quota.tier}
        </span>
      </div>

      <div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-700 dark:text-gray-300">Credits</span>
          <span className="text-gray-500 dark:text-gray-400">
            {quota.creditsUsed} / {quota.creditsLimit}
          </span>
        </div>
        <div
          className="mt-1 h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700"
          role="progressbar"
          aria-valuenow={quota.creditsUsed}
          aria-valuemin={0}
          aria-valuemax={quota.creditsLimit}
          aria-label={`Credits: ${quota.creditsUsed} of ${quota.creditsLimit} used`}
        >
          <div
            className={`h-full rounded-full transition-all ${color}`}
            style={{ width: `${Math.min(quota.percentage, 100)}%` }}
          />
        </div>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {remaining} credits remaining
        </p>
      </div>
    </div>
  );
}
