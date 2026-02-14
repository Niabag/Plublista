import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ContentPreviewPage } from './ContentPreviewPage';

const mockUseContentItem = vi.fn();
const mockUseContentEdit = vi.fn();
const mockUsePublishContent = vi.fn();
const mockUsePublishStatus = vi.fn();
const mockUsePlatformConnections = vi.fn();
const mockUseAuth = vi.fn();

vi.mock('../hooks/useContentItem', () => ({
  useContentItem: (...args: unknown[]) => mockUseContentItem(...args),
  CONTENT_ITEM_QUERY_KEY: 'content-item',
}));

vi.mock('../hooks/useContentEdit', () => ({
  useContentEdit: (...args: unknown[]) => mockUseContentEdit(...args),
}));

vi.mock('../hooks/usePublishContent', () => ({
  usePublishContent: (...args: unknown[]) => mockUsePublishContent(...args),
}));

vi.mock('../hooks/usePublishStatus', () => ({
  usePublishStatus: (...args: unknown[]) => mockUsePublishStatus(...args),
}));

vi.mock('../hooks/usePlatformConnections', () => ({
  usePlatformConnections: (...args: unknown[]) => mockUsePlatformConnections(...args),
}));

vi.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: (...args: unknown[]) => mockUseAuth(...args),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const mockUseScheduleContent = vi.fn();
vi.mock('../hooks/useScheduleContent', () => ({
  useScheduleContent: (...args: unknown[]) => mockUseScheduleContent(...args),
}));

const mockApiPost = vi.fn();
vi.mock('@/lib/apiClient', () => ({
  apiPost: (...args: unknown[]) => mockApiPost(...args),
  apiPatch: vi.fn(),
  apiDelete: vi.fn(),
}));

function renderWithProviders(id: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/create/reel/${id}/preview`]}>
        <Routes>
          <Route
            path="/create/reel/:id/preview"
            element={<ContentPreviewPage />}
          />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const baseMockItem = {
  id: 'item-1',
  title: 'My Reel',
  type: 'reel',
  status: 'draft',
  caption: 'Test caption',
  hashtags: ['tag1', 'tag2'],
  hookText: 'Hook here',
  ctaText: 'Follow me',
  musicPrompt: 'upbeat',
  format: '9:16',
  duration: 30,
  generatedMediaUrl: null,
  musicUrl: null,
  style: 'dynamic',
  mediaUrls: [],
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
};

describe('ContentPreviewPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: { id: 'u1', subscriptionTier: 'free' },
      isAuthenticated: true,
      isSessionLoading: false,
    });
    mockUseContentEdit.mockReturnValue({
      updateContent: vi.fn(),
      isUpdating: false,
    });
    mockUsePublishContent.mockReturnValue({
      publish: vi.fn(),
      isPending: false,
    });
    mockUseScheduleContent.mockReturnValue({
      schedule: vi.fn(),
      isScheduling: false,
      cancelSchedule: vi.fn(),
      isCancelling: false,
    });
    mockUsePublishStatus.mockReturnValue({
      jobs: [],
      latestJob: null,
      isPending: false,
      refetch: vi.fn(),
    });
    mockUsePlatformConnections.mockReturnValue({
      connections: [],
      connectedPlatforms: [],
      ayrshareConnectUrl: null,
      isPending: false,
      hasInstagram: false,
      getConnection: () => undefined,
    });
  });

  it('shows loading spinner when pending', () => {
    mockUseContentItem.mockReturnValue({
      item: null,
      isPending: true,
      isError: false,
      refetch: vi.fn(),
    });

    renderWithProviders('item-1');
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('shows error state when content not found', () => {
    mockUseContentItem.mockReturnValue({
      item: null,
      isPending: false,
      isError: true,
      refetch: vi.fn(),
    });

    renderWithProviders('item-1');
    expect(screen.getByText('Content item not found.')).toBeInTheDocument();
  });

  it('renders split panel with content item data', () => {
    mockUseContentItem.mockReturnValue({
      item: baseMockItem,
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    });

    renderWithProviders('item-1');

    expect(screen.getByText('My Reel')).toBeInTheDocument();
    expect(screen.getByText('Video preview')).toBeInTheDocument();
    expect(screen.getByText('Regenerate Copy')).toBeInTheDocument();
    expect(screen.getByText('Schedule')).toBeInTheDocument();
    expect(screen.getByText('Publish Now')).toBeInTheDocument();
    expect(screen.getByText('Generated Music')).toBeInTheDocument();
  });

  it('enables Schedule and Publish Now buttons for draft content', () => {
    mockUseContentItem.mockReturnValue({
      item: { ...baseMockItem, status: 'draft' },
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    });

    renderWithProviders('item-1');

    expect(screen.getByText('Schedule').closest('button')).not.toBeDisabled();
    expect(screen.getByText('Publish Now').closest('button')).not.toBeDisabled();
  });

  it('opens schedule dialog when Schedule button is clicked', () => {
    mockUseContentItem.mockReturnValue({
      item: { ...baseMockItem, status: 'draft' },
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    });
    mockUsePlatformConnections.mockReturnValue({
      connections: [{ id: '1', platform: 'instagram', platformUsername: 'testuser' }],
      connectedPlatforms: ['instagram'],
      ayrshareConnectUrl: null,
      isPending: false,
      hasInstagram: true,
      getConnection: () => ({ platformUsername: 'testuser' }),
    });

    renderWithProviders('item-1');

    const scheduleBtn = screen.getByText('Schedule').closest('button')!;
    fireEvent.click(scheduleBtn);

    expect(screen.getByText('Schedule Content')).toBeInTheDocument();
  });

  it('disables Publish Now for published content', () => {
    mockUsePublishStatus.mockReturnValue({
      jobs: [{ id: 'j1', platform: 'instagram', status: 'published', publishedUrl: 'https://instagram.com/p/abc' }],
      latestJob: { publishedUrl: 'https://instagram.com/p/abc' },
      isPending: false,
      refetch: vi.fn(),
    });
    mockUseContentItem.mockReturnValue({
      item: { ...baseMockItem, status: 'published' },
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    });

    renderWithProviders('item-1');

    expect(screen.getByText('Published')).toBeInTheDocument();
  });

  it('shows Publishing spinner for scheduled content', () => {
    mockUseContentItem.mockReturnValue({
      item: { ...baseMockItem, status: 'scheduled' },
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    });

    renderWithProviders('item-1');

    expect(screen.getByText('Publishing...')).toBeInTheDocument();
  });

  it('opens publish dialog when Publish Now is clicked', () => {
    mockUseContentItem.mockReturnValue({
      item: { ...baseMockItem, status: 'draft' },
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    });
    mockUsePlatformConnections.mockReturnValue({
      connections: [{ id: '1', platform: 'instagram', platformUsername: 'testuser' }],
      connectedPlatforms: ['instagram'],
      ayrshareConnectUrl: null,
      isPending: false,
      hasInstagram: true,
      getConnection: () => ({ platformUsername: 'testuser' }),
    });

    renderWithProviders('item-1');

    const publishBtn = screen.getByText('Publish Now').closest('button')!;
    fireEvent.click(publishBtn);

    expect(screen.getByText('Publish Content')).toBeInTheDocument();
    expect(screen.getByText('Instagram')).toBeInTheDocument();
  });

  it('calls generate-copy API when Regenerate Copy is clicked', async () => {
    const mockRefetch = vi.fn();
    mockApiPost.mockResolvedValue({ data: {} });

    mockUseContentItem.mockReturnValue({
      item: baseMockItem,
      isPending: false,
      isError: false,
      refetch: mockRefetch,
    });

    renderWithProviders('item-1');

    const regenButton = screen.getByText('Regenerate Copy').closest('button')!;
    fireEvent.click(regenButton);

    await waitFor(() => {
      expect(mockApiPost).toHaveBeenCalledWith(
        '/api/content-items/item-1/generate-copy',
        {},
      );
    });

    await waitFor(() => {
      expect(mockRefetch).toHaveBeenCalled();
    });
  });
});
