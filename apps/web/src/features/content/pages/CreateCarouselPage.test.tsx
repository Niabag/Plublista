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

import { CreateCarouselPage } from './CreateCarouselPage';

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
        <MemoryRouter initialEntries={['/create/carousel']}>
          <CreateCarouselPage />
        </MemoryRouter>
      </TooltipProvider>
    </QueryClientProvider>,
  );
}

describe('CreateCarouselPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the page header', () => {
    renderPage();
    expect(screen.getByText('New Carousel')).toBeInTheDocument();
  });

  it('renders format selector', () => {
    renderPage();
    expect(screen.getByText('9:16')).toBeInTheDocument();
    expect(screen.getByText('16:9')).toBeInTheDocument();
    expect(screen.getByText('1:1')).toBeInTheDocument();
  });

  it('starts with 2 empty slide slots', () => {
    renderPage();
    // 2 slides + add slide button
    const addImageTexts = screen.getAllByText('Add image');
    expect(addImageTexts).toHaveLength(2);
  });

  it('shows Add Slide button', () => {
    renderPage();
    expect(screen.getByText('Add Slide')).toBeInTheDocument();
  });

  it('has Create Carousel button disabled initially', () => {
    renderPage();
    const createBtn = screen.getByRole('button', { name: /create carousel/i });
    expect(createBtn).toBeDisabled();
  });

  it('adds a new slide when Add Slide is clicked', async () => {
    const user = userEvent.setup();
    renderPage();

    const addSlideBtn = screen.getByText('Add Slide').closest('button')!;
    await user.click(addSlideBtn);

    const addImageTexts = screen.getAllByText('Add image');
    expect(addImageTexts).toHaveLength(3);
  });

  it('shows slide numbers on each card', () => {
    renderPage();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('shows ready count in header', () => {
    renderPage();
    expect(screen.getByText(/0 \/ 2 slides ready/)).toBeInTheDocument();
  });

  it('shows Upload and AI buttons on empty slide', () => {
    renderPage();
    const uploadBtns = screen.getAllByRole('button', { name: /upload/i });
    const aiBtns = screen.getAllByRole('button', { name: /ai/i });
    expect(uploadBtns.length).toBeGreaterThanOrEqual(2);
    expect(aiBtns.length).toBeGreaterThanOrEqual(2);
  });

  it('shows AI prompt textarea when AI button is clicked', async () => {
    const user = userEvent.setup();
    renderPage();

    // Find the AI text spans and click their parent button
    const aiTexts = screen.getAllByText('AI');
    const aiBtn = aiTexts[0].closest('button')!;
    await user.click(aiBtn);

    expect(screen.getByPlaceholderText('Describe the image...')).toBeInTheDocument();
    expect(screen.getByText('Generate')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('hides AI prompt when Cancel is clicked', async () => {
    const user = userEvent.setup();
    renderPage();

    const aiTexts = screen.getAllByText('AI');
    const aiBtn = aiTexts[0].closest('button')!;
    await user.click(aiBtn);

    const cancelBtn = screen.getByText('Cancel').closest('button')!;
    await user.click(cancelBtn);

    expect(screen.queryByPlaceholderText('Describe the image...')).not.toBeInTheDocument();
  });
});
