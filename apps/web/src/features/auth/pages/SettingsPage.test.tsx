import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
  Toaster: () => null,
}));

import { apiGet } from '@/lib/apiClient';
import { SettingsPage } from './SettingsPage';

const mockUser = {
  id: 'test-uuid-123',
  email: 'test@example.com',
  displayName: 'Test User',
  role: 'user',
  subscriptionTier: 'free',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  onboardingCompletedAt: '2026-01-01T00:00:00Z',
};

const mockQuota = {
  tier: 'free',
  quotas: [
    { resource: 'reels', used: 0, limit: 3, percentage: 0 },
    { resource: 'carousels', used: 0, limit: 3, percentage: 0 },
    { resource: 'aiImages', used: 0, limit: 5, percentage: 0 },
  ],
  period: { start: '2026-02-01', end: '2026-02-28' },
};

function createTestQueryClient() {
  const qc = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
    },
  });
  // Pre-populate session so ProfileSection renders
  qc.setQueryData(['auth', 'session'], mockUser);
  return qc;
}

function renderSettingsPage(route = '/settings') {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route]}>
        <SettingsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('SettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: connections returns empty array, quotas return mock
    vi.mocked(apiGet).mockImplementation((path: string) => {
      if (path === '/api/quotas') {
        return Promise.resolve({ data: mockQuota });
      }
      // Default for connections and other calls
      return Promise.resolve({ data: [] });
    });
  });

  it('renders all three sections: Profile, Quota, Connected Accounts', async () => {
    renderSettingsPage();

    // Profile section
    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByLabelText('Display name')).toHaveValue('Test User');

    // Quota section
    expect(await screen.findByText('Usage This Month')).toBeInTheDocument();

    // Connected Accounts section
    expect(screen.getByText('Connected Accounts')).toBeInTheDocument();
  });

  it('renders the Connected Accounts section', () => {
    renderSettingsPage();

    expect(screen.getByText('Connected Accounts')).toBeInTheDocument();
    expect(
      screen.getByText(/Connect your social media accounts/),
    ).toBeInTheDocument();
  });

  it('renders Instagram as connectable and other platforms as Coming Soon', () => {
    renderSettingsPage();

    expect(screen.getByText('Instagram')).toBeInTheDocument();

    const comingSoonTexts = screen.getAllByText('Coming Soon');
    expect(comingSoonTexts).toHaveLength(5);
  });

  it('shows success toast on OAuth callback', async () => {
    const { toast } = await import('sonner');
    renderSettingsPage('/settings?oauth=success&platform=instagram');

    expect(toast.success).toHaveBeenCalledWith('Instagram connected successfully!');
  });

  it('shows error toast on OAuth error callback', async () => {
    const { toast } = await import('sonner');
    renderSettingsPage('/settings?oauth=error&platform=instagram&reason=access_denied');

    expect(toast.error).toHaveBeenCalledWith(
      'Failed to connect instagram: access_denied',
    );
  });

  it('renders connected Instagram card when connection exists', async () => {
    vi.mocked(apiGet).mockImplementation((path: string) => {
      if (path === '/api/quotas') {
        return Promise.resolve({ data: mockQuota });
      }
      return Promise.resolve({
        data: [
          {
            id: 'conn-1',
            platform: 'instagram',
            platformUserId: '12345',
            platformUsername: 'testuser',
            connectedAt: '2026-01-01T00:00:00Z',
            tokenExpiresAt: '2026-03-01T00:00:00Z',
          },
        ],
      });
    });

    renderSettingsPage();

    expect(await screen.findByText(/Connected as @testuser/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Disconnect' })).toBeInTheDocument();
  });

  it('renders subscription tier badge', () => {
    renderSettingsPage();

    expect(screen.getByText('Free Plan')).toBeInTheDocument();
  });

  it('renders email as read-only', () => {
    renderSettingsPage();

    const emailInput = screen.getByLabelText('Email');
    expect(emailInput).toHaveValue('test@example.com');
    expect(emailInput).toBeDisabled();
  });

  // ── GDPR / Data & Privacy ────────────────────────

  it('renders Data & Privacy section with export and delete buttons', () => {
    renderSettingsPage();

    expect(screen.getByText('Data & Privacy')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /export my data/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /delete my account/i })).toBeInTheDocument();
  });

  it('opens delete account dialog when Delete button is clicked', async () => {
    const user = userEvent.setup();
    renderSettingsPage();

    await user.click(screen.getByRole('button', { name: /delete my account/i }));

    await waitFor(() => {
      expect(screen.getByText('Delete your account?')).toBeInTheDocument();
    });
    expect(screen.getByPlaceholderText('Type DELETE to confirm')).toBeInTheDocument();
  });

  it('keeps Permanently delete button disabled until DELETE is typed', async () => {
    const user = userEvent.setup();
    renderSettingsPage();

    await user.click(screen.getByRole('button', { name: /delete my account/i }));

    await waitFor(() => {
      expect(screen.getByText('Delete your account?')).toBeInTheDocument();
    });

    const confirmButton = screen.getByRole('button', { name: /permanently delete/i });
    expect(confirmButton).toBeDisabled();

    await user.type(screen.getByPlaceholderText('Type DELETE to confirm'), 'DELETE');

    expect(confirmButton).not.toBeDisabled();
  });
});
