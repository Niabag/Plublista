import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { DashboardPage } from './DashboardPage';

const mockUseContentList = vi.fn();

vi.mock('@/features/content/hooks/useContentList', () => ({
  useContentList: (...args: unknown[]) => mockUseContentList(...args),
}));

vi.mock('@/features/auth/components/QuotaIndicator', () => ({
  QuotaIndicator: () => <div data-testid="quota-indicator">Quota</div>,
}));

vi.mock('@/features/content/components/ContentCard', () => ({
  ContentCard: ({ item }: { item: { id: string; title: string } }) => (
    <div data-testid={`content-card-${item.id}`}>{item.title}</div>
  ),
}));

function renderDashboard() {
  return render(
    <MemoryRouter>
      <DashboardPage />
    </MemoryRouter>,
  );
}

function makeMockItem(id: string, title: string) {
  return {
    id,
    title,
    type: 'post',
    status: 'draft',
    caption: '',
    hashtags: [],
    mediaUrls: [],
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  };
}

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseContentList.mockReturnValue({
      items: [],
      isPending: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });
  });

  it('renders quick-create links with correct hrefs', () => {
    renderDashboard();

    const reelLink = screen.getByText('New Reel').closest('a');
    const carouselLink = screen.getByText('New Carousel').closest('a');
    const postLink = screen.getByText('New Post').closest('a');

    expect(reelLink).toHaveAttribute('href', '/create/reel');
    expect(carouselLink).toHaveAttribute('href', '/create/carousel');
    expect(postLink).toHaveAttribute('href', '/create/post');
  });

  it('renders QuotaIndicator widget', () => {
    renderDashboard();

    expect(screen.getByTestId('quota-indicator')).toBeInTheDocument();
  });

  it('shows skeleton loading state when content is pending', () => {
    mockUseContentList.mockReturnValue({
      items: [],
      isPending: true,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });

    const { container } = renderDashboard();

    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBe(8);
  });

  it('displays content cards when items are returned', () => {
    mockUseContentList.mockReturnValue({
      items: [makeMockItem('1', 'First Post'), makeMockItem('2', 'Second Post')],
      isPending: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });

    renderDashboard();

    expect(screen.getByTestId('content-card-1')).toBeInTheDocument();
    expect(screen.getByTestId('content-card-2')).toBeInTheDocument();
    expect(screen.getByText('First Post')).toBeInTheDocument();
    expect(screen.getByText('Second Post')).toBeInTheDocument();
  });

  it('shows empty state with CTA when no content exists', () => {
    mockUseContentList.mockReturnValue({
      items: [],
      isPending: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });

    renderDashboard();

    expect(screen.getByText('No content yet')).toBeInTheDocument();
    expect(screen.getByText('Create Content')).toBeInTheDocument();
    const ctaLink = screen.getByText('Create Content').closest('a');
    expect(ctaLink).toHaveAttribute('href', '/create');
  });

  it('shows error state with retry button when loading fails', () => {
    const mockRefetch = vi.fn();
    mockUseContentList.mockReturnValue({
      items: [],
      isPending: false,
      isError: true,
      error: new Error('Network error'),
      refetch: mockRefetch,
    });

    renderDashboard();

    expect(screen.getByText('Failed to load content')).toBeInTheDocument();
    const retryBtn = screen.getByText('Retry');
    fireEvent.click(retryBtn);
    expect(mockRefetch).toHaveBeenCalledOnce();
  });

  it('limits display to 8 items and shows View all link', () => {
    const items = Array.from({ length: 10 }, (_, i) =>
      makeMockItem(`item-${i}`, `Post ${i}`),
    );
    mockUseContentList.mockReturnValue({
      items,
      isPending: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });

    renderDashboard();

    // Only 8 cards rendered
    for (let i = 0; i < 8; i++) {
      expect(screen.getByTestId(`content-card-item-${i}`)).toBeInTheDocument();
    }
    expect(screen.queryByTestId('content-card-item-8')).not.toBeInTheDocument();
    expect(screen.queryByTestId('content-card-item-9')).not.toBeInTheDocument();

    // View all link visible
    const viewAll = screen.getByText('View all');
    expect(viewAll.closest('a')).toHaveAttribute('href', '/library');
  });
});
