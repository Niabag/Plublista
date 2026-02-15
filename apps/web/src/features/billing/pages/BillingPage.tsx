import { Link } from 'react-router-dom';
import { CreditCard, Download, ExternalLink, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { PRICING_CONFIG } from '@publista/shared';
import type { SubscriptionTier } from '@publista/shared';
import { useBillingDetails } from '../hooks/useBillingDetails';

const STATUS_STYLES: Record<string, string> = {
  paid: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
  open: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
  void: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  uncollectible: 'bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300',
  active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
  trialing: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  past_due: 'bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300',
  canceled: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  suspended: 'bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300',
};

const STATUS_LABELS: Record<string, string> = {
  paid: 'Paid',
  open: 'Pending',
  void: 'Void',
  uncollectible: 'Failed',
  active: 'Active',
  trialing: 'Trialing',
  past_due: 'Past Due',
  canceled: 'Canceled',
  suspended: 'Suspended',
};

function formatCurrency(amount: number, currency: string): string {
  const value = (amount / 100).toFixed(2);
  return currency === 'EUR' ? `€${value}` : `$${value}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="outline" className={`border-transparent ${STATUS_STYLES[status] ?? ''}`}>
      {STATUS_LABELS[status] ?? status}
    </Badge>
  );
}

function SubscriptionCardSkeleton() {
  return (
    <div className="rounded-lg border border-gray-200 bg-background p-6 shadow-sm dark:border-gray-700">
      <Skeleton className="h-6 w-1/3" />
      <div className="mt-4 space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  );
}

function InvoiceListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center justify-between rounded-lg border border-gray-200 bg-background p-4 dark:border-gray-700"
        >
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-3 w-1/3" />
          </div>
          <Skeleton className="h-8 w-20" />
        </div>
      ))}
    </div>
  );
}

export function BillingPage() {
  const { subscription, invoices, paymentMethod, isPending, isError, error, refetch } =
    useBillingDetails();

  if (isPending) {
    return (
      <div className="mx-auto max-w-4xl space-y-8 p-4 sm:p-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Billing</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your subscription and view your invoice history
          </p>
        </div>
        <SubscriptionCardSkeleton />
        <div>
          <h2 className="mb-4 text-lg font-semibold text-foreground">Invoice History</h2>
          <InvoiceListSkeleton />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mx-auto max-w-4xl p-4 sm:p-6">
        <div className="py-12 text-center">
          <AlertCircle className="mx-auto size-12 text-rose-500/50" />
          <h3 className="mt-4 text-lg font-medium text-foreground">
            Error loading billing details
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {(error as { message?: string })?.message ?? 'Something went wrong'}
          </p>
          <Button onClick={() => refetch()} className="mt-4" variant="outline">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Billing</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your subscription and view your invoice history
        </p>
      </div>

      {/* Subscription Card */}
      {subscription ? (
        <div
          data-testid="subscription-card"
          className="rounded-lg border border-gray-200 bg-background p-6 shadow-sm dark:border-gray-700"
        >
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Current Plan</h2>
              <p className="mt-1 text-2xl font-bold text-foreground">
                {PRICING_CONFIG[subscription.tier as SubscriptionTier]?.name ?? subscription.tier}
              </p>
              <div className="mt-2">
                <StatusBadge status={subscription.suspendedAt ? 'suspended' : subscription.status} />
              </div>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link to="/pricing">Manage Plan</Link>
            </Button>
          </div>

          <div className="mt-6 space-y-3 border-t border-gray-200 pt-4 dark:border-gray-700">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Next billing date</span>
              <span className="font-medium text-foreground">
                {subscription.currentPeriodEnd
                  ? formatDate(subscription.currentPeriodEnd)
                  : 'N/A'}
              </span>
            </div>

            {paymentMethod?.type === 'card' && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Payment method</span>
                <span data-testid="payment-method" className="font-medium text-foreground">
                  {paymentMethod.brand?.toUpperCase()} •••• {paymentMethod.last4}
                </span>
              </div>
            )}

            {PRICING_CONFIG[subscription.tier as SubscriptionTier] && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Price</span>
                <span className="font-medium text-foreground">
                  €{PRICING_CONFIG[subscription.tier as SubscriptionTier].priceMonthly} / month
                </span>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div
          data-testid="free-plan-card"
          className="rounded-lg border border-gray-200 bg-background p-6 shadow-sm dark:border-gray-700"
        >
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Current Plan</h2>
              <p className="mt-1 text-2xl font-bold text-foreground">Free</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Upgrade to unlock more features and higher quotas.
              </p>
            </div>
            <Button asChild variant="default" size="sm">
              <Link to="/pricing">View Plans</Link>
            </Button>
          </div>
        </div>
      )}

      {/* Invoice History */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-foreground">Invoice History</h2>

        {invoices.length === 0 ? (
          <div
            data-testid="empty-invoices"
            className="rounded-lg border border-gray-200 bg-background p-8 text-center dark:border-gray-700"
          >
            <CreditCard className="mx-auto size-10 text-muted-foreground/50" />
            <p className="mt-3 text-sm text-muted-foreground">
              No invoices yet. Invoices will appear here after your first billing cycle.
            </p>
          </div>
        ) : (
          <div data-testid="invoice-list" className="space-y-3">
            {invoices.map((invoice) => (
              <div
                key={invoice.id}
                className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-background p-4 shadow-sm dark:border-gray-700 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">
                      {formatDate(invoice.date)}
                    </span>
                    <StatusBadge status={invoice.status} />
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{invoice.description}</p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-semibold text-foreground">
                    {formatCurrency(invoice.amount, invoice.currency)}
                  </span>

                  {invoice.invoicePdf && (
                    <Button asChild variant="outline" size="sm" className="shrink-0">
                      <a
                        href={invoice.invoicePdf}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Download className="mr-1 size-4" />
                        PDF
                      </a>
                    </Button>
                  )}

                  {invoice.hostedInvoiceUrl && !invoice.invoicePdf && (
                    <Button asChild variant="outline" size="sm" className="shrink-0">
                      <a
                        href={invoice.hostedInvoiceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="mr-1 size-4" />
                        View
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
