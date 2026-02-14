import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
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
import { QuotaIndicator } from './QuotaIndicator';

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
    },
  });
}

function renderQuotaIndicator() {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <QuotaIndicator />
    </QueryClientProvider>,
  );
}

const mockCreditUsage = (overrides: Record<string, unknown> = {}) => ({
  data: {
    tier: 'free',
    creditsUsed: 10,
    creditsLimit: 35,
    percentage: 29,
    period: { start: '2026-02-01', end: '2026-02-28' },
    ...overrides,
  },
});

describe('QuotaIndicator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders credit usage bar when data is loaded', async () => {
    vi.mocked(apiGet).mockResolvedValue(mockCreditUsage());

    renderQuotaIndicator();

    expect(await screen.findByText('Credits')).toBeInTheDocument();
    expect(screen.getByText('Usage This Month')).toBeInTheDocument();
    expect(screen.getByText('10 / 35')).toBeInTheDocument();
    expect(screen.getByText('25 credits remaining')).toBeInTheDocument();
    expect(screen.getByText('free')).toBeInTheDocument();
  });

  it('renders a single accessible progress bar', async () => {
    vi.mocked(apiGet).mockResolvedValue(mockCreditUsage({ creditsUsed: 20, percentage: 57 }));

    renderQuotaIndicator();
    await screen.findByText('Credits');

    const progressBars = screen.getAllByRole('progressbar');
    expect(progressBars).toHaveLength(1);
    expect(progressBars[0]).toHaveAttribute('aria-valuenow', '20');
    expect(progressBars[0]).toHaveAttribute('aria-valuemax', '35');
    expect(progressBars[0]).toHaveAttribute('aria-label', 'Credits: 20 of 35 used');
  });

  it('shows green bar when usage is below 60%', async () => {
    vi.mocked(apiGet).mockResolvedValue(mockCreditUsage());

    renderQuotaIndicator();
    await screen.findByText('Credits');

    const bar = screen.getByRole('progressbar').firstChild as HTMLElement;
    expect(bar.className).toContain('bg-emerald-500');
  });

  it('shows amber bar when usage is 60-79%', async () => {
    vi.mocked(apiGet).mockResolvedValue(
      mockCreditUsage({ tier: 'starter', creditsUsed: 140, creditsLimit: 200, percentage: 70 }),
    );

    renderQuotaIndicator();
    await screen.findByText('Credits');

    const bar = screen.getByRole('progressbar').firstChild as HTMLElement;
    expect(bar.className).toContain('bg-amber-500');
  });

  it('shows rose bar when usage is 80% or above', async () => {
    vi.mocked(apiGet).mockResolvedValue(
      mockCreditUsage({ creditsUsed: 28, percentage: 80 }),
    );

    renderQuotaIndicator();
    await screen.findByText('Credits');

    const bar = screen.getByRole('progressbar').firstChild as HTMLElement;
    expect(bar.className).toContain('bg-rose-500');
  });

  it('renders loading skeleton initially', () => {
    vi.mocked(apiGet).mockReturnValue(new Promise(() => {}));
    const { container } = renderQuotaIndicator();

    const pulses = container.querySelectorAll('.animate-pulse');
    expect(pulses.length).toBeGreaterThan(0);
  });

  it('renders nothing on error', async () => {
    vi.mocked(apiGet).mockRejectedValue(new Error('fail'));
    const { container } = renderQuotaIndicator();

    await waitFor(() => {
      expect(container.innerHTML).toBe('');
    });
  });
});
