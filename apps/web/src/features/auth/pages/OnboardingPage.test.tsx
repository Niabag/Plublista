import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
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

import { apiGet, apiPost } from '@/lib/apiClient';
import { OnboardingPage } from './OnboardingPage';
import { AppLayout } from '@/components/layout/AppLayout';
import { TooltipProvider } from '@/components/ui/tooltip';

const mockUserNoOnboarding = {
  id: 'test-uuid-123',
  email: 'test@example.com',
  displayName: 'Test User',
  role: 'user',
  subscriptionTier: 'free',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  onboardingCompletedAt: null,
};

const mockUserWithOnboarding = {
  ...mockUserNoOnboarding,
  onboardingCompletedAt: '2026-02-13T12:00:00Z',
};

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
    },
  });
}

function renderOnboardingPage(route = '/onboarding') {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <MemoryRouter initialEntries={[route]}>
          <Routes>
            <Route path="/onboarding" element={<OnboardingPage />} />
            <Route path="/login" element={<div>Login Page</div>} />
            <Route path="/dashboard" element={<div>Dashboard Page</div>} />
          </Routes>
        </MemoryRouter>
      </TooltipProvider>
    </QueryClientProvider>,
  );
}

describe('OnboardingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders stepper with 3 steps, first step active', async () => {
    vi.mocked(apiGet)
      .mockResolvedValueOnce({ data: mockUserNoOnboarding }) // session
      .mockResolvedValue({ data: [] }); // connections

    renderOnboardingPage();

    // Stepper labels exist (step 1 label appears multiple times — in stepper and content)
    const connectInstagramElements = await screen.findAllByText('Connect Instagram');
    expect(connectInstagramElements.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Upload Clips')).toBeInTheDocument();
    expect(screen.getByText('Create Your Reel')).toBeInTheDocument();
  });

  it('renders Instagram connect button on step 1', async () => {
    vi.mocked(apiGet)
      .mockResolvedValueOnce({ data: mockUserNoOnboarding }) // session
      .mockResolvedValue({ data: [] }); // connections

    renderOnboardingPage();

    await screen.findByRole('button', { name: /connect instagram/i });
    expect(screen.getByText(/why connect/i)).toBeInTheDocument();
  });

  it('shows skip link on step 1', async () => {
    vi.mocked(apiGet)
      .mockResolvedValueOnce({ data: mockUserNoOnboarding })
      .mockResolvedValue({ data: [] });

    renderOnboardingPage();

    await screen.findByText(/skip for now/i);
  });

  it('redirects to /login when not authenticated', async () => {
    vi.mocked(apiGet).mockRejectedValue(new Error('Unauthorized'));

    renderOnboardingPage();

    await screen.findByText('Login Page');
  });

  it('redirects to /dashboard when onboarding already completed', async () => {
    vi.mocked(apiGet).mockResolvedValue({ data: mockUserWithOnboarding });

    renderOnboardingPage();

    await screen.findByText('Dashboard Page');
  });

  it('navigates to step 2 when Next is clicked', async () => {
    const user = userEvent.setup();
    vi.mocked(apiGet)
      .mockResolvedValueOnce({ data: mockUserNoOnboarding })
      .mockResolvedValue({ data: [] });

    renderOnboardingPage();

    const nextButton = await screen.findByRole('button', { name: /next/i });
    await user.click(nextButton);

    await screen.findByText(/drop your video clips here, or click to browse/i);
  });

  it('calls completion endpoint and redirects on Complete Onboarding', async () => {
    const user = userEvent.setup();
    vi.mocked(apiGet)
      .mockResolvedValueOnce({ data: mockUserNoOnboarding })
      .mockResolvedValue({ data: [] });

    vi.mocked(apiPost).mockResolvedValue({ data: mockUserWithOnboarding });

    renderOnboardingPage();

    // Navigate to step 2
    const nextButton = await screen.findByRole('button', { name: /next/i });
    await user.click(nextButton);

    // Navigate to step 3
    const skipButton = await screen.findByRole('button', { name: /skip/i });
    await user.click(skipButton);

    // Click Complete Onboarding
    const completeButton = await screen.findByRole('button', { name: /complete onboarding/i });
    await user.click(completeButton);

    await waitFor(() => {
      expect(apiPost).toHaveBeenCalledWith('/api/auth/onboarding/complete', {});
    });
  });
});

describe('Route guard — AppLayout redirects to /onboarding', () => {
  it('redirects to /onboarding when onboardingCompletedAt is null', async () => {
    vi.mocked(apiGet).mockResolvedValue({ data: mockUserNoOnboarding });

    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <MemoryRouter initialEntries={['/dashboard']}>
            <Routes>
              <Route element={<AppLayout />}>
                <Route path="/dashboard" element={<div>Dashboard Content</div>} />
              </Route>
              <Route path="/onboarding" element={<div>Onboarding Page</div>} />
            </Routes>
          </MemoryRouter>
        </TooltipProvider>
      </QueryClientProvider>,
    );

    await screen.findByText('Onboarding Page');
  });

  it('shows dashboard when onboarding is completed', async () => {
    vi.mocked(apiGet).mockResolvedValue({ data: mockUserWithOnboarding });

    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <MemoryRouter initialEntries={['/dashboard']}>
            <Routes>
              <Route element={<AppLayout />}>
                <Route path="/dashboard" element={<div>Dashboard Content</div>} />
              </Route>
              <Route path="/onboarding" element={<div>Onboarding Page</div>} />
            </Routes>
          </MemoryRouter>
        </TooltipProvider>
      </QueryClientProvider>,
    );

    await screen.findByText('Dashboard Content');
  });
});
