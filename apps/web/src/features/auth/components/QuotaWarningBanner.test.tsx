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
import { QuotaWarningBanner } from './QuotaWarningBanner';

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
        <QuotaWarningBanner />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const mockCreditUsage = (overrides: Record<string, unknown> = {}) => ({
  data: {
    tier: 'free',
    creditsUsed: 28,
    creditsLimit: 35,
    percentage: 80,
    period: { start: '2026-02-01', end: '2026-02-28' },
    ...overrides,
  },
});

describe('QuotaWarningBanner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders warning when percentage >= 80%', async () => {
    vi.mocked(apiGet).mockResolvedValue(mockCreditUsage());

    renderBanner();

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/Credit usage at 80%/)).toBeInTheDocument();
    expect(screen.getByText(/7 credits remaining/)).toBeInTheDocument();
  });

  it('renders upgrade link pointing to /pricing', async () => {
    vi.mocked(apiGet).mockResolvedValue(mockCreditUsage({ creditsUsed: 33, percentage: 94 }));

    renderBanner();

    const link = await screen.findByText('Upgrade for more');
    expect(link.closest('a')).toHaveAttribute('href', '/pricing');
  });

  it('does not render when percentage < 80%', async () => {
    vi.mocked(apiGet).mockResolvedValue(
      mockCreditUsage({ creditsUsed: 10, percentage: 29 }),
    );

    renderBanner();

    await waitFor(() => {
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  it('does not render while loading', () => {
    vi.mocked(apiGet).mockReturnValue(new Promise(() => {}));
    renderBanner();

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('does not render on error', async () => {
    vi.mocked(apiGet).mockRejectedValue(new Error('fail'));
    renderBanner();

    await waitFor(() => {
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });
});
