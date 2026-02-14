import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PricingPage } from './PricingPage';

const mockStartCheckout = vi.fn();
const mockChangePlan = vi.fn();
const mockCancelDowngrade = vi.fn();

const mockAuthUser = vi.hoisted(() => ({
  value: { subscriptionTier: 'free' } as { subscriptionTier: string },
}));

const mockSubscription = vi.hoisted(() => ({
  value: null as {
    stripeSubscriptionId: string | null;
    pendingTier: string | null;
    pendingTierEffectiveDate: string | null;
    tier: string;
    status: string;
  } | null,
}));

vi.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: () => ({
    user: mockAuthUser.value,
  }),
}));

vi.mock('../hooks/useCheckout', () => ({
  useCheckout: () => ({
    startCheckout: mockStartCheckout,
    isCheckingOut: false,
  }),
}));

vi.mock('../hooks/useSubscription', () => ({
  useSubscription: () => ({
    subscription: mockSubscription.value,
    isPending: false,
  }),
  SUBSCRIPTION_QUERY_KEY: 'subscription',
}));

vi.mock('../hooks/useChangePlan', () => ({
  useChangePlan: () => ({
    changePlan: mockChangePlan,
    isChangingPlan: false,
  }),
}));

vi.mock('../hooks/useCancelDowngrade', () => ({
  useCancelDowngrade: () => ({
    cancelDowngrade: mockCancelDowngrade,
    isCanceling: false,
  }),
}));

function renderPricingPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <PricingPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('PricingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthUser.value = { subscriptionTier: 'free' };
    mockSubscription.value = null;
  });

  it('renders 5 tier cards', () => {
    renderPricingPage();

    expect(screen.getByTestId('tier-free')).toBeInTheDocument();
    expect(screen.getByTestId('tier-starter')).toBeInTheDocument();
    expect(screen.getByTestId('tier-pro')).toBeInTheDocument();
    expect(screen.getByTestId('tier-business')).toBeInTheDocument();
    expect(screen.getByTestId('tier-agency')).toBeInTheDocument();
  });

  it('displays tier names and prices', () => {
    renderPricingPage();

    const freeCard = screen.getByTestId('tier-free');
    expect(freeCard.querySelector('h3')).toHaveTextContent('Free');
    expect(screen.getByText('Starter')).toBeInTheDocument();
    expect(screen.getByText('Pro')).toBeInTheDocument();
    expect(screen.getByText('Business')).toBeInTheDocument();
    expect(screen.getByText('Agency')).toBeInTheDocument();

    expect(screen.getByText('€29')).toBeInTheDocument();
    expect(screen.getByText('€79')).toBeInTheDocument();
    expect(screen.getByText('€199')).toBeInTheDocument();
    expect(screen.getByText('€499')).toBeInTheDocument();
  });

  it('shows "Current Plan" button for the free tier (current)', () => {
    renderPricingPage();

    const freeCard = screen.getByTestId('tier-free');
    const currentBtn = freeCard.querySelector('button');
    expect(currentBtn).toHaveTextContent('Current Plan');
    expect(currentBtn).toBeDisabled();
  });

  it('shows "Start Free Trial" buttons for paid tiers when no subscription', () => {
    renderPricingPage();

    const trialButtons = screen.getAllByText('Start Free Trial');
    expect(trialButtons).toHaveLength(4);
  });

  it('shows "Popular" badge on Pro tier', () => {
    renderPricingPage();

    expect(screen.getByText('Popular')).toBeInTheDocument();
  });

  it('calls startCheckout when clicking a paid tier button', async () => {
    const user = userEvent.setup();
    renderPricingPage();

    const trialButtons = screen.getAllByText('Start Free Trial');
    await user.click(trialButtons[0]);

    expect(mockStartCheckout).toHaveBeenCalledWith('starter');
  });

  it('renders page heading', () => {
    renderPricingPage();

    expect(screen.getByText('Choose your plan')).toBeInTheDocument();
    expect(screen.getByText(/No credit card required/)).toBeInTheDocument();
  });

  it('highlights current plan with ring style', () => {
    renderPricingPage();

    const freeCard = screen.getByTestId('tier-free');
    expect(freeCard.className).toContain('ring-2');
  });

  describe('subscribed user (Starter plan)', () => {
    beforeEach(() => {
      mockAuthUser.value = { subscriptionTier: 'starter' };
      mockSubscription.value = {
        stripeSubscriptionId: 'sub_123',
        pendingTier: null,
        pendingTierEffectiveDate: null,
        tier: 'starter',
        status: 'active',
      };
    });

    it('shows "Current Plan" on the active tier', () => {
      renderPricingPage();

      const starterCard = screen.getByTestId('tier-starter');
      const btn = starterCard.querySelector('button');
      expect(btn).toHaveTextContent('Current Plan');
      expect(btn).toBeDisabled();
    });

    it('shows "Upgrade" buttons for higher tiers', () => {
      renderPricingPage();

      const upgradeButtons = screen.getAllByText('Upgrade');
      expect(upgradeButtons).toHaveLength(3); // pro, business, agency
    });

    it('calls changePlan when clicking Upgrade', async () => {
      const user = userEvent.setup();
      renderPricingPage();

      const upgradeButtons = screen.getAllByText('Upgrade');
      await user.click(upgradeButtons[0]); // first upgrade = pro

      expect(mockChangePlan).toHaveBeenCalledWith('pro');
    });

    it('does not show "Start Free Trial" buttons', () => {
      renderPricingPage();

      expect(screen.queryAllByText('Start Free Trial')).toHaveLength(0);
    });
  });

  describe('subscribed user (Pro plan)', () => {
    beforeEach(() => {
      mockAuthUser.value = { subscriptionTier: 'pro' };
      mockSubscription.value = {
        stripeSubscriptionId: 'sub_123',
        pendingTier: null,
        pendingTierEffectiveDate: null,
        tier: 'pro',
        status: 'active',
      };
    });

    it('shows "Downgrade" for lower tiers and "Upgrade" for higher tiers', () => {
      renderPricingPage();

      const downgradeButtons = screen.getAllByText('Downgrade');
      expect(downgradeButtons).toHaveLength(1); // starter

      const upgradeButtons = screen.getAllByText('Upgrade');
      expect(upgradeButtons).toHaveLength(2); // business, agency
    });

    it('calls changePlan with lower tier when clicking Downgrade', async () => {
      const user = userEvent.setup();
      renderPricingPage();

      const downgradeBtn = screen.getByText('Downgrade');
      await user.click(downgradeBtn);

      expect(mockChangePlan).toHaveBeenCalledWith('starter');
    });
  });

  describe('pending downgrade banner', () => {
    beforeEach(() => {
      mockAuthUser.value = { subscriptionTier: 'pro' };
      mockSubscription.value = {
        stripeSubscriptionId: 'sub_123',
        pendingTier: 'starter',
        pendingTierEffectiveDate: '2026-03-01T00:00:00.000Z',
        tier: 'pro',
        status: 'active',
      };
    });

    it('shows pending downgrade banner', () => {
      renderPricingPage();

      const banner = screen.getByTestId('pending-downgrade-banner');
      expect(banner).toBeInTheDocument();
      expect(banner).toHaveTextContent(/Downgrade to Starter scheduled/);
    });

    it('shows "Downgrade Pending" disabled button on target tier', () => {
      renderPricingPage();

      const starterCard = screen.getByTestId('tier-starter');
      const btn = starterCard.querySelector('button');
      expect(btn).toHaveTextContent('Downgrade Pending');
      expect(btn).toBeDisabled();
    });

    it('calls cancelDowngrade when clicking Cancel Downgrade', async () => {
      const user = userEvent.setup();
      renderPricingPage();

      const cancelBtn = screen.getByText('Cancel Downgrade');
      await user.click(cancelBtn);

      expect(mockCancelDowngrade).toHaveBeenCalled();
    });
  });
});
