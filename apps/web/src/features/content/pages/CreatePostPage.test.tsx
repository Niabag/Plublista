import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';

// Mock apiClient
vi.mock('@/lib/apiClient', () => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  apiPut: vi.fn(),
  apiPatch: vi.fn(),
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

// Mock useFileUpload
vi.mock('@/features/upload/hooks/useFileUpload', () => ({
  useFileUpload: () => ({
    uploads: [],
    isUploading: false,
    uploadFile: vi.fn().mockResolvedValue({ fileKey: 'test-key' }),
    removeUpload: vi.fn(),
    clearUploads: vi.fn(),
    completedKeys: [],
  }),
}));

// Mock useStandaloneImageGeneration
vi.mock('../hooks/useStandaloneImageGeneration', () => ({
  useStandaloneImageGeneration: () => ({
    generate: vi.fn(),
    imageUrl: null,
    fileKey: null,
    isPending: false,
    isError: false,
    error: null,
    reset: vi.fn(),
  }),
}));

// Mock uiStore
vi.mock('@/stores/useUiStore', () => ({
  useUiStore: Object.assign(
    (selector: (s: Record<string, unknown>) => unknown) =>
      selector({
        sidebarCollapsed: true,
        toggleSidebar: vi.fn(),
      }),
    { getState: () => ({ sidebarCollapsed: true, toggleSidebar: vi.fn() }) },
  ),
}));

import { CreatePostPage } from './CreatePostPage';

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
    },
  });
}

function renderPage() {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <MemoryRouter initialEntries={['/create/post']}>
          <CreatePostPage />
        </MemoryRouter>
      </TooltipProvider>
    </QueryClientProvider>,
  );
}

describe('CreatePostPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the page header', () => {
    renderPage();
    expect(screen.getByText('New Post')).toBeInTheDocument();
  });

  it('renders format selector', () => {
    renderPage();
    expect(screen.getByText('9:16')).toBeInTheDocument();
    expect(screen.getByText('16:9')).toBeInTheDocument();
    expect(screen.getByText('1:1')).toBeInTheDocument();
  });

  it('shows empty state with Upload and AI Generate buttons', () => {
    renderPage();
    expect(screen.getByText('Add an image for your post')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /upload/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ai generate/i })).toBeInTheDocument();
  });

  it('has Create Post button disabled initially', () => {
    renderPage();
    const createBtn = screen.getByRole('button', { name: /create post/i });
    expect(createBtn).toBeDisabled();
  });

  it('shows AI prompt textarea when AI Generate is clicked', async () => {
    const user = userEvent.setup();
    renderPage();

    const aiBtn = screen.getByRole('button', { name: /ai generate/i });
    await user.click(aiBtn);

    expect(screen.getByPlaceholderText('Describe the image you want...')).toBeInTheDocument();
    expect(screen.getByText('Generate')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('hides AI prompt when Cancel is clicked', async () => {
    const user = userEvent.setup();
    renderPage();

    const aiBtn = screen.getByRole('button', { name: /ai generate/i });
    await user.click(aiBtn);

    const cancelBtn = screen.getByText('Cancel').closest('button')!;
    await user.click(cancelBtn);

    expect(screen.queryByPlaceholderText('Describe the image you want...')).not.toBeInTheDocument();
  });

  it('shows prompt character counter', async () => {
    const user = userEvent.setup();
    renderPage();

    const aiBtn = screen.getByRole('button', { name: /ai generate/i });
    await user.click(aiBtn);

    expect(screen.getByText('0/1000')).toBeInTheDocument();

    const textarea = screen.getByPlaceholderText('Describe the image you want...');
    await user.type(textarea, 'Hello');

    expect(screen.getByText('5/1000')).toBeInTheDocument();
  });

  it('disables Generate button when prompt is empty', async () => {
    const user = userEvent.setup();
    renderPage();

    const aiBtn = screen.getByRole('button', { name: /ai generate/i });
    await user.click(aiBtn);

    const generateBtn = screen.getByRole('button', { name: /^generate$/i });
    expect(generateBtn).toBeDisabled();
  });
});
