import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/apiClient';

interface Invoice {
  id: string;
  date: string;
  amount: number;
  currency: string;
  status: 'paid' | 'open' | 'void' | 'uncollectible';
  invoicePdf: string | null;
  hostedInvoiceUrl: string | null;
  description: string;
}

interface PaymentMethod {
  type: 'card' | 'other';
  last4?: string;
  brand?: string;
}

interface Subscription {
  id: string;
  userId: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string | null;
  tier: string;
  status: string;
  trialEndsAt: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  pendingTier: string | null;
  pendingTierEffectiveDate: string | null;
  failedPaymentRetries: number;
  suspendedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface BillingDetailsResponse {
  data: {
    subscription: Subscription | null;
    invoices: Invoice[];
    paymentMethod: PaymentMethod | null;
  };
}

export const BILLING_DETAILS_QUERY_KEY = 'billing-details' as const;

export function useBillingDetails() {
  const query = useQuery({
    queryKey: [BILLING_DETAILS_QUERY_KEY],
    queryFn: () => apiGet<BillingDetailsResponse>('/api/billing/details'),
  });

  return {
    subscription: query.data?.data.subscription ?? null,
    invoices: query.data?.data.invoices ?? [],
    paymentMethod: query.data?.data.paymentMethod ?? null,
    isPending: query.isPending,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
