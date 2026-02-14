import { Link } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { useSubscription } from '../hooks/useSubscription';

export function PaymentFailedBanner() {
  const { subscription, isPending } = useSubscription();

  if (isPending || !subscription || !subscription.suspendedAt) {
    return null;
  }

  return (
    <div
      role="alert"
      className="mb-4 flex flex-wrap items-center gap-3 rounded-lg border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-700 dark:bg-rose-950 dark:text-rose-200"
    >
      <AlertCircle className="size-5 shrink-0" />
      <span className="flex-1">
        Payment failed {'\u2014'} update your payment method to restore access
      </span>
      <Link
        to="/billing"
        className="whitespace-nowrap font-medium text-rose-900 underline underline-offset-2 hover:text-rose-700 dark:text-rose-100 dark:hover:text-rose-300"
      >
        Update payment method
      </Link>
    </div>
  );
}
