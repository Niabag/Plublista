import { Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PRICING_CONFIG, TIER_ORDER, getTierChangeDirection } from '@publista/shared';
import type { SubscriptionTier } from '@publista/shared';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useCheckout } from '../hooks/useCheckout';
import { useSubscription } from '../hooks/useSubscription';
import { useChangePlan } from '../hooks/useChangePlan';
import { useCancelDowngrade } from '../hooks/useCancelDowngrade';
import { cn } from '@/lib/cn';

const POPULAR_TIER = 'pro';

export function PricingPage() {
  const { user } = useAuth();
  const { startCheckout, isCheckingOut } = useCheckout();
  const { subscription } = useSubscription();
  const { changePlan, isChangingPlan } = useChangePlan();
  const { cancelDowngrade, isCanceling } = useCancelDowngrade();
  const currentTier = user?.subscriptionTier ?? 'free';
  const hasSubscription = !!subscription?.stripeSubscriptionId;

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-4 sm:p-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground">Choose your plan</h1>
        <p className="mt-2 text-muted-foreground">
          Start with a 7-day free trial on any paid plan. No credit card required to start.
        </p>
      </div>

      {subscription?.pendingTier && (
        <div
          data-testid="pending-downgrade-banner"
          className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950"
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-medium text-amber-800 dark:text-amber-200">
                Downgrade to {PRICING_CONFIG[subscription.pendingTier as SubscriptionTier]?.name} scheduled
              </p>
              <p className="text-sm text-amber-600 dark:text-amber-400">
                Your plan will change on{' '}
                {subscription.pendingTierEffectiveDate
                  ? new Date(subscription.pendingTierEffectiveDate).toLocaleDateString()
                  : 'end of billing period'}
                . You keep all current features until then.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => cancelDowngrade()}
              disabled={isCanceling}
            >
              {isCanceling ? 'Canceling...' : 'Cancel Downgrade'}
            </Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {TIER_ORDER.map((tier) => {
          const config = PRICING_CONFIG[tier];
          const isCurrent = tier === currentTier;
          const isPopular = tier === POPULAR_TIER;
          const isFree = tier === 'free';
          const isPendingTarget = subscription?.pendingTier === tier;

          const btn = getButtonConfig({
            tier,
            isCurrent,
            isFree,
            isPendingTarget,
            hasSubscription,
            currentTier,
            isCheckingOut,
            isChangingPlan,
            startCheckout,
            changePlan,
          });

          return (
            <div
              key={tier}
              data-testid={`tier-${tier}`}
              className={cn(
                'relative flex flex-col rounded-lg border p-6',
                isPopular && 'border-indigo-500 shadow-lg shadow-indigo-100 dark:shadow-indigo-950',
                isCurrent && 'ring-2 ring-indigo-500',
                !isPopular && !isCurrent && 'border-gray-200 dark:border-gray-700',
              )}
            >
              {isPopular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white">
                  <Sparkles className="mr-1 size-3" />
                  Popular
                </Badge>
              )}

              <h3 className="text-lg font-semibold text-foreground">{config.name}</h3>

              <div className="mt-3">
                <span className="text-3xl font-bold text-foreground">
                  {config.priceMonthly === 0 ? 'Free' : `€${config.priceMonthly}`}
                </span>
                {config.priceMonthly > 0 && (
                  <span className="text-sm text-muted-foreground"> /month</span>
                )}
              </div>

              <ul className="mt-6 flex-1 space-y-3">
                {config.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-foreground/80">
                    <Check className="mt-0.5 size-4 shrink-0 text-emerald-500" />
                    {feature}
                  </li>
                ))}
              </ul>

              <div className="mt-6">
                <Button
                  variant={btn.variant as 'default' | 'outline'}
                  className={cn('w-full', btn.className)}
                  onClick={btn.action}
                  disabled={btn.disabled}
                >
                  {btn.label}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function getButtonConfig({
  tier,
  isCurrent,
  isFree,
  isPendingTarget,
  hasSubscription,
  currentTier,
  isCheckingOut,
  isChangingPlan,
  startCheckout,
  changePlan,
}: {
  tier: SubscriptionTier;
  isCurrent: boolean;
  isFree: boolean;
  isPendingTarget: boolean;
  hasSubscription: boolean;
  currentTier: string;
  isCheckingOut: boolean;
  isChangingPlan: boolean;
  startCheckout: (tier: Exclude<SubscriptionTier, 'free'>) => void;
  changePlan: (tier: Exclude<SubscriptionTier, 'free'>) => void;
}) {
  if (isCurrent) {
    return { label: 'Current Plan', disabled: true, variant: 'outline', action: undefined, className: '' };
  }

  if (isFree) {
    return { label: 'Free', disabled: true, variant: 'outline', action: undefined, className: '' };
  }

  if (isPendingTarget) {
    return { label: 'Downgrade Pending', disabled: true, variant: 'outline', action: undefined, className: '' };
  }

  // No active subscription — go through Stripe Checkout
  if (!hasSubscription) {
    const isPopular = tier === POPULAR_TIER;
    return {
      label: isCheckingOut ? 'Redirecting...' : 'Start Free Trial',
      disabled: isCheckingOut,
      variant: 'default',
      action: () => startCheckout(tier as Exclude<SubscriptionTier, 'free'>),
      className: isPopular ? 'bg-indigo-600 text-white hover:bg-indigo-700' : '',
    };
  }

  // Active subscription — determine direction
  const direction = getTierChangeDirection(currentTier as SubscriptionTier, tier);

  if (direction === 'upgrade') {
    return {
      label: isChangingPlan ? 'Upgrading...' : 'Upgrade',
      disabled: isChangingPlan,
      variant: 'default',
      action: () => changePlan(tier as Exclude<SubscriptionTier, 'free'>),
      className: 'bg-emerald-600 text-white hover:bg-emerald-700',
    };
  }

  if (direction === 'downgrade') {
    return {
      label: isChangingPlan ? 'Processing...' : 'Downgrade',
      disabled: isChangingPlan,
      variant: 'outline',
      action: () => changePlan(tier as Exclude<SubscriptionTier, 'free'>),
      className: '',
    };
  }

  return { label: 'Current Plan', disabled: true, variant: 'outline', action: undefined, className: '' };
}
