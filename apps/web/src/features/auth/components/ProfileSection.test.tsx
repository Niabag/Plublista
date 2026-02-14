import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

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

import { apiGet, apiPut } from '@/lib/apiClient';
import { ProfileSection } from './ProfileSection';

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

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
    },
  });
}

function renderProfileSection() {
  const queryClient = createTestQueryClient();
  // Pre-populate session cache so useAuth returns user
  queryClient.setQueryData(['auth', 'session'], mockUser);

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <ProfileSection />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('ProfileSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(apiGet).mockResolvedValue({ data: mockUser });
  });

  it('renders profile form with user data', () => {
    renderProfileSection();

    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByLabelText('Display name')).toHaveValue('Test User');
    expect(screen.getByLabelText('Email')).toHaveValue('test@example.com');
    expect(screen.getByLabelText('Email')).toBeDisabled();
    expect(screen.getByText('Free Plan')).toBeInTheDocument();
  });

  it('shows save button disabled when form is clean', () => {
    renderProfileSection();

    const saveButton = screen.getByRole('button', { name: 'Save changes' });
    expect(saveButton).toBeDisabled();
  });

  it('enables save button when displayName is changed', async () => {
    const user = userEvent.setup();
    renderProfileSection();

    const input = screen.getByLabelText('Display name');
    await user.clear(input);
    await user.type(input, 'New Name');

    const saveButton = screen.getByRole('button', { name: 'Save changes' });
    expect(saveButton).not.toBeDisabled();
  });

  it('submits profile update and shows success toast', async () => {
    const user = userEvent.setup();
    vi.mocked(apiPut).mockResolvedValue({
      data: { ...mockUser, displayName: 'New Name' },
    });

    renderProfileSection();

    const input = screen.getByLabelText('Display name');
    await user.clear(input);
    await user.type(input, 'New Name');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    const { toast } = await import('sonner');
    await waitFor(() => {
      expect(apiPut).toHaveBeenCalledWith('/api/auth/profile', { displayName: 'New Name' });
      expect(toast.success).toHaveBeenCalledWith('Profile updated successfully');
    });
  });

  it('shows validation error for empty displayName', async () => {
    const user = userEvent.setup();
    renderProfileSection();

    const input = screen.getByLabelText('Display name');
    await user.clear(input);
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => {
      expect(screen.getByText('Display name is required')).toBeInTheDocument();
    });
  });
});
