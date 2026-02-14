import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/apiClient';

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

interface SubscriptionResponse {
  data: Subscription | null;
}

export const SUBSCRIPTION_QUERY_KEY = 'subscription' as const;

export function useSubscription() {
  const query = useQuery({
    queryKey: [SUBSCRIPTION_QUERY_KEY],
    queryFn: () => apiGet<SubscriptionResponse>('/api/billing/subscription'),
  });

  return {
    subscription: query.data?.data ?? null,
    isPending: query.isPending,
  };
}
