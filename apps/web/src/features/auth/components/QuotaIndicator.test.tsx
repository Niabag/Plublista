import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
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

describe('QuotaIndicator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders quota bars when data is loaded', async () => {
    vi.mocked(apiGet).mockResolvedValue({
      data: {
        tier: 'free',
        quotas: [
          { resource: 'reels', used: 1, limit: 3, percentage: 33 },
          { resource: 'carousels', used: 2, limit: 3, percentage: 67 },
          { resource: 'aiImages', used: 4, limit: 5, percentage: 80 },
        ],
        period: { start: '2026-02-01', end: '2026-02-28' },
      },
    });

    renderQuotaIndicator();

    // Wait for data-only element (loading skeleton doesn't have resource labels)
    expect(await screen.findByText('AI Reels')).toBeInTheDocument();
    expect(screen.getByText('Usage This Month')).toBeInTheDocument();
    expect(screen.getByText('1/3')).toBeInTheDocument();
    expect(screen.getByText('Carousels')).toBeInTheDocument();
    expect(screen.getByText('2/3')).toBeInTheDocument();
    expect(screen.getByText('AI Images')).toBeInTheDocument();
    expect(screen.getByText('4/5')).toBeInTheDocument();
  });

  it('renders accessible progress bars', async () => {
    vi.mocked(apiGet).mockResolvedValue({
      data: {
        tier: 'free',
        quotas: [
          { resource: 'reels', used: 1, limit: 3, percentage: 33 },
          { resource: 'carousels', used: 0, limit: 3, percentage: 0 },
          { resource: 'aiImages', used: 0, limit: 5, percentage: 0 },
        ],
        period: { start: '2026-02-01', end: '2026-02-28' },
      },
    });

    renderQuotaIndicator();

    // Wait for data-only element instead of skeleton-shared text
    await screen.findByText('AI Reels');

    const progressBars = screen.getAllByRole('progressbar');
    expect(progressBars).toHaveLength(3);
    expect(progressBars[0]).toHaveAttribute('aria-valuenow', '1');
    expect(progressBars[0]).toHaveAttribute('aria-valuemax', '3');
  });

  it('renders loading skeleton initially', () => {
    vi.mocked(apiGet).mockReturnValue(new Promise(() => {})); // Never resolves
    renderQuotaIndicator();

    expect(screen.getByText('Usage This Month')).toBeInTheDocument();
  });
});
