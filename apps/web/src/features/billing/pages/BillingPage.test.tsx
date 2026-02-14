import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BillingPage } from './BillingPage';

const mockRefetch = vi.fn();

const mockBillingState = vi.hoisted(() => ({
  subscription: null as {
    tier: string;
    status: string;
    currentPeriodEnd: string | null;
    stripeSubscriptionId: string | null;
  } | null,
  invoices: [] as {
    id: string;
    date: string;
    amount: number;
    currency: string;
    status: string;
    invoicePdf: string | null;
    hostedInvoiceUrl: string | null;
    description: string;
  }[],
  paymentMethod: null as { type: string; last4?: string; brand?: string } | null,
  isPending: false,
  isError: false,
  error: null as { message?: string } | null,
}));

vi.mock('../hooks/useBillingDetails', () => ({
  useBillingDetails: () => ({
    subscription: mockBillingState.subscription,
    invoices: mockBillingState.invoices,
    paymentMethod: mockBillingState.paymentMethod,
    isPending: mockBillingState.isPending,
    isError: mockBillingState.isError,
    error: mockBillingState.error,
    refetch: mockRefetch,
  }),
}));

function renderBillingPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <BillingPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('BillingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockBillingState.subscription = null;
    mockBillingState.invoices = [];
    mockBillingState.paymentMethod = null;
    mockBillingState.isPending = false;
    mockBillingState.isError = false;
    mockBillingState.error = null;
  });

  it('shows loading skeletons when pending', () => {
    mockBillingState.isPending = true;
    renderBillingPage();

    expect(screen.getByText('Billing')).toBeInTheDocument();
    expect(screen.getByText('Invoice History')).toBeInTheDocument();
  });

  it('shows error state with retry button', async () => {
    mockBillingState.isError = true;
    mockBillingState.error = { message: 'Network error' };
    const user = userEvent.setup();
    renderBillingPage();

    expect(screen.getByText('Error loading billing details')).toBeInTheDocument();
    expect(screen.getByText('Network error')).toBeInTheDocument();

    await user.click(screen.getByText('Retry'));
    expect(mockRefetch).toHaveBeenCalled();
  });

  describe('free user (no subscription)', () => {
    it('shows free plan card with View Plans link', () => {
      renderBillingPage();

      const card = screen.getByTestId('free-plan-card');
      expect(card).toBeInTheDocument();
      expect(card).toHaveTextContent('Free');
      expect(screen.getByText('View Plans')).toBeInTheDocument();
    });

    it('shows empty invoices state', () => {
      renderBillingPage();

      expect(screen.getByTestId('empty-invoices')).toBeInTheDocument();
      expect(screen.getByText(/No invoices yet/)).toBeInTheDocument();
    });
  });

  describe('subscribed user', () => {
    beforeEach(() => {
      mockBillingState.subscription = {
        tier: 'pro',
        status: 'active',
        currentPeriodEnd: '2026-03-01T00:00:00.000Z',
        stripeSubscriptionId: 'sub_123',
      };
      mockBillingState.paymentMethod = {
        type: 'card',
        last4: '4242',
        brand: 'visa',
      };
      mockBillingState.invoices = [
        {
          id: 'inv_1',
          date: '2026-02-01T00:00:00.000Z',
          amount: 7900,
          currency: 'EUR',
          status: 'paid',
          invoicePdf: 'https://pay.stripe.com/inv_1.pdf',
          hostedInvoiceUrl: null,
          description: 'Pro plan',
        },
        {
          id: 'inv_2',
          date: '2026-01-01T00:00:00.000Z',
          amount: 7900,
          currency: 'EUR',
          status: 'paid',
          invoicePdf: null,
          hostedInvoiceUrl: 'https://invoice.stripe.com/inv_2',
          description: 'Pro plan',
        },
      ];
    });

    it('shows subscription card with plan name and status', () => {
      renderBillingPage();

      const card = screen.getByTestId('subscription-card');
      expect(card).toBeInTheDocument();
      expect(card).toHaveTextContent('Pro');
      expect(card).toHaveTextContent('Active');
    });

    it('shows next billing date', () => {
      renderBillingPage();

      const card = screen.getByTestId('subscription-card');
      expect(card).toHaveTextContent('Next billing date');
      // Date format varies by locale, just check card has the date
      expect(card).toHaveTextContent(/2026/);
    });

    it('shows payment method', () => {
      renderBillingPage();

      const pm = screen.getByTestId('payment-method');
      expect(pm).toHaveTextContent('VISA');
      expect(pm).toHaveTextContent('4242');
    });

    it('shows Manage Plan link', () => {
      renderBillingPage();

      const link = screen.getByText('Manage Plan');
      expect(link).toBeInTheDocument();
      expect(link.closest('a')).toHaveAttribute('href', '/pricing');
    });

    it('shows invoice list', () => {
      renderBillingPage();

      const list = screen.getByTestId('invoice-list');
      expect(list).toBeInTheDocument();
      expect(list.children).toHaveLength(2);
    });

    it('shows invoice with PDF download button', () => {
      renderBillingPage();

      const pdfLinks = screen.getAllByText('PDF');
      expect(pdfLinks).toHaveLength(1);
      expect(pdfLinks[0].closest('a')).toHaveAttribute(
        'href',
        'https://pay.stripe.com/inv_1.pdf',
      );
    });

    it('shows View button when no PDF available', () => {
      renderBillingPage();

      const viewLinks = screen.getAllByText('View');
      expect(viewLinks).toHaveLength(1);
      expect(viewLinks[0].closest('a')).toHaveAttribute(
        'href',
        'https://invoice.stripe.com/inv_2',
      );
    });

    it('shows invoice amounts formatted as currency', () => {
      renderBillingPage();

      const amounts = screen.getAllByText('€79.00');
      expect(amounts).toHaveLength(2);
    });
  });

  describe('trialing subscription', () => {
    it('shows Trialing status badge', () => {
      mockBillingState.subscription = {
        tier: 'starter',
        status: 'trialing',
        currentPeriodEnd: '2026-02-21T00:00:00.000Z',
        stripeSubscriptionId: 'sub_123',
      };
      renderBillingPage();

      const card = screen.getByTestId('subscription-card');
      expect(card).toHaveTextContent('Trialing');
      expect(card).toHaveTextContent('Starter');
    });
  });
});
