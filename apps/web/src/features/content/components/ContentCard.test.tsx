import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ContentCard } from './ContentCard';
import type { ContentItem } from '@plublista/shared';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

const makeItem = (overrides: Partial<ContentItem> = {}): ContentItem => ({
  id: 'item-1',
  userId: 'user-1',
  type: 'reel',
  title: 'Test Reel',
  status: 'draft',
  style: null,
  format: '9:16',
  duration: 30,
  mediaUrls: [],
  generatedMediaUrl: null,
  caption: null,
  hashtags: [],
  hookText: null,
  ctaText: null,
  musicUrl: null,
  musicPrompt: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

describe('ContentCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders title and status badge', () => {
    render(<ContentCard item={makeItem()} />);

    expect(screen.getByText('Test Reel')).toBeInTheDocument();
    expect(screen.getByText('Draft')).toBeInTheDocument();
    expect(screen.getByText('Reel')).toBeInTheDocument();
  });

  it('renders "Untitled" when title is null', () => {
    render(<ContentCard item={makeItem({ title: null })} />);
    expect(screen.getByText('Untitled')).toBeInTheDocument();
  });

  it('shows red left border for failed items', () => {
    const { container } = render(<ContentCard item={makeItem({ status: 'failed' })} />);
    const button = container.querySelector('button');
    expect(button?.className).toContain('border-l-rose-500');
  });

  it('does not show red border for draft items', () => {
    const { container } = render(<ContentCard item={makeItem({ status: 'draft' })} />);
    const button = container.querySelector('button');
    expect(button?.className).not.toContain('border-l-rose-500');
  });

  it('navigates to reel preview on click', () => {
    render(<ContentCard item={makeItem({ type: 'reel', id: 'reel-1' })} />);
    fireEvent.click(screen.getByRole('button'));
    expect(mockNavigate).toHaveBeenCalledWith('/create/reel/reel-1/preview');
  });

  it('navigates to carousel preview on click', () => {
    render(<ContentCard item={makeItem({ type: 'carousel', id: 'car-1' })} />);
    fireEvent.click(screen.getByRole('button'));
    expect(mockNavigate).toHaveBeenCalledWith('/create/carousel/car-1/preview');
  });

  it('navigates to post preview on click', () => {
    render(<ContentCard item={makeItem({ type: 'post', id: 'post-1' })} />);
    fireEvent.click(screen.getByRole('button'));
    expect(mockNavigate).toHaveBeenCalledWith('/create/post/post-1/preview');
  });

  it('calls onFailedClick instead of navigating for failed items', () => {
    const onFailedClick = vi.fn();
    const failedItem = makeItem({ status: 'failed' });

    render(<ContentCard item={failedItem} onFailedClick={onFailedClick} />);
    fireEvent.click(screen.getByRole('button'));

    expect(onFailedClick).toHaveBeenCalledWith(failedItem);
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('navigates to preview for failed items when no onFailedClick provided', () => {
    render(<ContentCard item={makeItem({ status: 'failed', type: 'post', id: 'p-1' })} />);
    fireEvent.click(screen.getByRole('button'));
    expect(mockNavigate).toHaveBeenCalledWith('/create/post/p-1/preview');
  });

  it('shows correct type labels', () => {
    const { rerender } = render(<ContentCard item={makeItem({ type: 'carousel' })} />);
    expect(screen.getByText('Carousel')).toBeInTheDocument();

    rerender(<ContentCard item={makeItem({ type: 'post' })} />);
    expect(screen.getByText('Post')).toBeInTheDocument();
  });
});
