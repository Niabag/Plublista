import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock apiClient
vi.mock('@/lib/apiClient', () => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  apiPut: vi.fn(),
  apiDelete: vi.fn(),
}));

// Mock Sentry
vi.mock('@sentry/react', () => ({
  init: vi.fn(),
  reactErrorHandler: () => vi.fn(),
  browserTracingIntegration: vi.fn(),
  replayIntegration: vi.fn(),
}));

import { apiGet } from '@/lib/apiClient';
import { PaymentFailedBanner } from './PaymentFailedBanner';

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
    },
  });
}

function renderBanner() {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <PaymentFailedBanner />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const mockSubscription = (overrides: Record<string, unknown> = {}) => ({
  data: {
    id: 'sub-1',
    userId: 'user-1',
    stripeCustomerId: 'cus_123',
    stripeSubscriptionId: 'sub_123',
    tier: 'starter',
    status: 'past_due',
    failedPaymentRetries: 3,
    suspendedAt: '2026-02-10T00:00:00.000Z',
    ...overrides,
  },
});

describe('PaymentFailedBanner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not render while loading', () => {
    vi.mocked(apiGet).mockReturnValue(new Promise(() => {}));
    renderBanner();

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('does not render when no subscription exists', async () => {
    vi.mocked(apiGet).mockResolvedValue({ data: null });
    renderBanner();

    await waitFor(() => {
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  it('does not render when subscription is not suspended', async () => {
    vi.mocked(apiGet).mockResolvedValue(
      mockSubscription({ suspendedAt: null, status: 'active', failedPaymentRetries: 0 }),
    );
    renderBanner();

    await waitFor(() => {
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  it('renders alert banner when account is suspended', async () => {
    vi.mocked(apiGet).mockResolvedValue(mockSubscription());
    renderBanner();

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/Payment failed/)).toBeInTheDocument();
    expect(screen.getByText(/update your payment method/)).toBeInTheDocument();
  });

  it('renders link to /billing', async () => {
    vi.mocked(apiGet).mockResolvedValue(mockSubscription());
    renderBanner();

    const link = await screen.findByText('Update payment method');
    expect(link.closest('a')).toHaveAttribute('href', '/billing');
  });
});
