import { Link } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { useQuota } from '../hooks/useQuota';

export function QuotaWarningBanner() {
  const { quota, isPending, isError } = useQuota();

  if (isPending || isError || !quota || quota.percentage < 80) {
    return null;
  }

  const remaining = quota.creditsLimit - quota.creditsUsed;

  return (
    <div
      role="alert"
      className="flex flex-wrap items-center gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200"
    >
      <AlertTriangle className="size-5 shrink-0" />
      <span className="flex-1">
        Credit usage at {quota.percentage}% {'\u2014'} {remaining} credits remaining this month
      </span>
      <Link
        to="/pricing"
        className="whitespace-nowrap font-medium text-amber-900 underline underline-offset-2 hover:text-amber-700 dark:text-amber-100 dark:hover:text-amber-300"
      >
        Upgrade for more
      </Link>
    </div>
  );
}
