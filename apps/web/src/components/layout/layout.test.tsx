import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';

// Mock apiClient before imports that use it
vi.mock('@/lib/apiClient', () => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
}));

// Mock Sentry
vi.mock('@sentry/react', () => ({
  init: vi.fn(),
  reactErrorHandler: () => vi.fn(),
  browserTracingIntegration: vi.fn(),
  replayIntegration: vi.fn(),
}));

// Mock PaymentFailedBanner to avoid QueryClient issues in layout tests
vi.mock('@/features/billing/components/PaymentFailedBanner', () => ({
  PaymentFailedBanner: () => null,
}));

import { apiGet } from '@/lib/apiClient';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { AppLayout } from './AppLayout';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { RegisterPage } from '@/features/auth/pages/RegisterPage';

const mockUser = {
  id: '1',
  email: 'test@example.com',
  displayName: 'Test User',
  role: 'user' as const,
  subscriptionTier: 'free' as const,
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
  onboardingCompletedAt: '2026-01-01',
};

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
    },
  });
}

function renderWithProviders(ui: React.ReactElement, { route = '/' } = {}) {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
      </TooltipProvider>
    </QueryClientProvider>,
  );
}

describe('Sidebar', () => {
  it('renders all navigation items', () => {
    renderWithProviders(<Sidebar />);
    // Sidebar starts collapsed — labels are inside Tooltip (not rendered until hover).
    // Verify all nav links exist: 4 main + 2 bottom + 1 logo link = 7
    const links = screen.getAllByRole('link');
    expect(links.length).toBeGreaterThanOrEqual(7);
  });

  it('starts in collapsed state', () => {
    const { container } = renderWithProviders(<Sidebar />);
    // Sidebar uses hover-based expand/collapse — starts collapsed (w-16)
    const nav = container.querySelector('nav');
    expect(nav?.className).toContain('w-16');
  });

  it('has main navigation landmark', () => {
    renderWithProviders(<Sidebar />);
    expect(screen.getByRole('navigation', { name: /main navigation/i })).toBeInTheDocument();
  });
});

describe('TopBar', () => {
  beforeEach(() => {
    vi.mocked(apiGet).mockRejectedValue(new Error('not logged in'));
  });

  it('renders page title', () => {
    renderWithProviders(<TopBar title="Dashboard" />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('renders mobile menu button', () => {
    renderWithProviders(<TopBar title="Test" />);
    expect(screen.getByLabelText('Open menu')).toBeInTheDocument();
  });
});

describe('AppLayout', () => {
  it('redirects to /login when not authenticated', async () => {
    vi.mocked(apiGet).mockRejectedValue(new Error('Unauthorized'));

    const queryClient = createTestQueryClient();
    let currentPath = '/dashboard';

    render(
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <MemoryRouter initialEntries={['/dashboard']}>
            <Routes>
              <Route element={<AppLayout />}>
                <Route path="/dashboard" element={<div>Dashboard</div>} />
              </Route>
              <Route
                path="/login"
                element={
                  <div>
                    {(() => {
                      currentPath = '/login';
                      return 'Login Page';
                    })()}
                  </div>
                }
              />
            </Routes>
          </MemoryRouter>
        </TooltipProvider>
      </QueryClientProvider>,
    );

    // Wait for the redirect
    await screen.findByText('Login Page');
    expect(currentPath).toBe('/login');
  });

  it('renders layout with sidebar when authenticated', async () => {
    vi.mocked(apiGet).mockResolvedValue({ data: mockUser });

    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <MemoryRouter initialEntries={['/dashboard']}>
            <Routes>
              <Route element={<AppLayout />}>
                <Route path="/dashboard" element={<div>Dashboard Content</div>} />
              </Route>
            </Routes>
          </MemoryRouter>
        </TooltipProvider>
      </QueryClientProvider>,
    );

    await screen.findByText('Dashboard Content');
    // Sidebar navigation should exist
    expect(screen.getByRole('navigation', { name: /main navigation/i })).toBeInTheDocument();
    // TopBar page title (h1)
    expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
  });

  it('shows loading spinner while checking session', () => {
    // Make apiGet hang forever to simulate loading
    vi.mocked(apiGet).mockImplementation(() => new Promise(() => {}));

    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <MemoryRouter initialEntries={['/dashboard']}>
            <Routes>
              <Route element={<AppLayout />}>
                <Route path="/dashboard" element={<div>Dashboard</div>} />
              </Route>
            </Routes>
          </MemoryRouter>
        </TooltipProvider>
      </QueryClientProvider>,
    );

    // Should show loading spinner (animated div)
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
  });
});

describe('Auth page redirects', () => {
  it('LoginPage redirects to /dashboard when already authenticated', async () => {
    vi.mocked(apiGet).mockResolvedValue({ data: mockUser });

    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <MemoryRouter initialEntries={['/login']}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/dashboard" element={<div>Dashboard Page</div>} />
            </Routes>
          </MemoryRouter>
        </TooltipProvider>
      </QueryClientProvider>,
    );

    await screen.findByText('Dashboard Page');
  });

  it('RegisterPage redirects to /dashboard when already authenticated', async () => {
    vi.mocked(apiGet).mockResolvedValue({ data: mockUser });

    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <MemoryRouter initialEntries={['/register']}>
            <Routes>
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/dashboard" element={<div>Dashboard Page</div>} />
            </Routes>
          </MemoryRouter>
        </TooltipProvider>
      </QueryClientProvider>,
    );

    await screen.findByText('Dashboard Page');
  });

  it('LoginPage renders form when not authenticated', async () => {
    vi.mocked(apiGet).mockRejectedValue(new Error('Unauthorized'));

    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <MemoryRouter initialEntries={['/login']}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
            </Routes>
          </MemoryRouter>
        </TooltipProvider>
      </QueryClientProvider>,
    );

    await screen.findByText('Welcome back');
  });
});
