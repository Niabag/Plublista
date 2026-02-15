import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AdminPage } from './AdminPage';

const mockApiGet = vi.fn();

vi.mock('@/lib/apiClient', () => ({
  apiGet: (...args: unknown[]) => mockApiGet(...args),
  apiPatch: vi.fn(),
}));

function renderAdmin() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <AdminPage />
    </QueryClientProvider>,
  );
}

describe('AdminPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApiGet.mockImplementation((url: string) => {
      if (url === '/api/admin/health') {
        return Promise.resolve({
          data: {
            publishSuccessRate: 95,
            publishedCount: 190,
            failedCount: 10,
            activeUsersToday: 42,
            totalUsers: 500,
            totalContent: 800,
            costToday: 12.5,
          },
        });
      }
      if (url === '/api/admin/errors') {
        return Promise.resolve({
          data: {
            rows: [
              {
                id: 'e-1',
                userId: 'u-1',
                userEmail: 'user@test.com',
                contentItemId: 'c-1',
                contentType: 'reel',
                platform: 'instagram',
                errorMessage: 'Token expired',
                errorCode: 'TOKEN_EXPIRED',
                attemptCount: 3,
                createdAt: '2026-02-10T00:00:00.000Z',
                updatedAt: '2026-02-10T01:00:00.000Z',
              },
            ],
            total: 1,
          },
        });
      }
      if (url === '/api/admin/costs') {
        return Promise.resolve({
          data: {
            byService: [{ service: 'openai', totalCost: 25.5, requestCount: 100 }],
            byUser: [],
            dailyTrend: [],
          },
        });
      }
      if (url.startsWith('/api/admin/users')) {
        return Promise.resolve({
          data: {
            rows: [
              {
                id: 'u-1',
                email: 'user@test.com',
                displayName: 'Test User',
                role: 'user',
                subscriptionTier: 'free',
                createdAt: '2026-01-01T00:00:00.000Z',
              },
            ],
            total: 1,
          },
        });
      }
      if (url === '/api/admin/tokens/expiring') {
        return Promise.resolve({
          data: [
            {
              id: 'pc-1',
              userId: 'u-1',
              userEmail: 'user@test.com',
              platform: 'instagram',
              platformUsername: 'testuser',
              tokenExpiresAt: '2026-02-20T00:00:00.000Z',
              connectedAt: '2026-01-01T00:00:00.000Z',
            },
          ],
        });
      }
      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    });
  });

  it('renders Health tab by default with metrics', async () => {
    renderAdmin();

    await waitFor(() => {
      expect(screen.getByText('Publish Success Rate')).toBeInTheDocument();
    });
    expect(screen.getByText('95%')).toBeInTheDocument();
    expect(screen.getByText('Total Users')).toBeInTheDocument();
  });

  it('renders Errors tab with table', async () => {
    const user = userEvent.setup();
    renderAdmin();

    // Wait for Health tab to load first
    await waitFor(() => {
      expect(screen.getByText('Publish Success Rate')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Errors/ }));

    await waitFor(() => {
      expect(screen.getByText('1 failed publish jobs')).toBeInTheDocument();
    });
    expect(screen.getByText('user@test.com')).toBeInTheDocument();
    expect(screen.getByText('Token expired')).toBeInTheDocument();
  });

  it('renders Costs tab with cost data', async () => {
    const user = userEvent.setup();
    renderAdmin();

    await waitFor(() => {
      expect(screen.getByText('Publish Success Rate')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Costs/ }));

    await waitFor(() => {
      expect(screen.getByText('Cost by Service (30 days)')).toBeInTheDocument();
    });
    expect(screen.getByText('openai')).toBeInTheDocument();
    expect(screen.getByText('Top Users by Cost')).toBeInTheDocument();
  });

  it('renders Users tab with user table', async () => {
    const user = userEvent.setup();
    renderAdmin();

    await waitFor(() => {
      expect(screen.getByText('Publish Success Rate')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Users/ }));

    await waitFor(() => {
      expect(screen.getByText('1 users')).toBeInTheDocument();
    });
    expect(screen.getByText('Test User')).toBeInTheDocument();
  });

  it('renders Tokens tab with expiring tokens', async () => {
    const user = userEvent.setup();
    renderAdmin();

    await waitFor(() => {
      expect(screen.getByText('Publish Success Rate')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Tokens/ }));

    await waitFor(() => {
      expect(screen.getByText('1 tokens expiring within 7 days')).toBeInTheDocument();
    });
    expect(screen.getByText('testuser')).toBeInTheDocument();
  });
});
