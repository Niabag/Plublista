import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorDetailDialog } from './ErrorDetailDialog';
import type { ContentItem } from '@plublista/shared';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

const mockItem: ContentItem = {
  id: 'item-1',
  userId: 'user-1',
  type: 'reel',
  title: 'My Reel',
  status: 'failed',
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
};

const mockJobs = [
  {
    id: 'job-1',
    platform: 'instagram',
    status: 'failed',
    publishedUrl: null,
    errorMessage: 'Media format not supported',
  },
  {
    id: 'job-2',
    platform: 'youtube',
    status: 'failed',
    publishedUrl: null,
    errorMessage: 'Rate limit exceeded',
  },
];

describe('ErrorDetailDialog', () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    item: mockItem,
    jobs: mockJobs,
    onRetry: vi.fn(),
    isRetrying: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when open is false', () => {
    const { container } = render(<ErrorDetailDialog {...defaultProps} open={false} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders nothing when item is null', () => {
    const { container } = render(<ErrorDetailDialog {...defaultProps} item={null} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders dialog with title and error count', () => {
    render(<ErrorDetailDialog {...defaultProps} />);

    expect(screen.getByText('Publishing Failed')).toBeInTheDocument();
    expect(screen.getByText(/My Reel/)).toBeInTheDocument();
    expect(screen.getByText(/2 platforms failed/)).toBeInTheDocument();
  });

  it('shows per-platform error messages', () => {
    render(<ErrorDetailDialog {...defaultProps} />);

    expect(screen.getByText('Instagram')).toBeInTheDocument();
    expect(screen.getByText('Media format not supported')).toBeInTheDocument();
    expect(screen.getByText('YouTube')).toBeInTheDocument();
    expect(screen.getByText('Rate limit exceeded')).toBeInTheDocument();
  });

  it('shows default error message when errorMessage is null', () => {
    const jobsWithNull = [
      { id: 'job-1', platform: 'instagram', status: 'failed', publishedUrl: null, errorMessage: null },
    ];
    render(<ErrorDetailDialog {...defaultProps} jobs={jobsWithNull} />);
    expect(screen.getByText('An unexpected error occurred. Please try again.')).toBeInTheDocument();
  });

  it('calls onRetry with failed platforms when Retry clicked', () => {
    render(<ErrorDetailDialog {...defaultProps} />);
    fireEvent.click(screen.getByText('Retry'));
    expect(defaultProps.onRetry).toHaveBeenCalledWith(['instagram', 'youtube']);
  });

  it('calls onClose when Dismiss clicked', () => {
    render(<ErrorDetailDialog {...defaultProps} />);
    fireEvent.click(screen.getByText('Dismiss'));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('calls onClose when X button clicked', () => {
    render(<ErrorDetailDialog {...defaultProps} />);
    const buttons = screen.getAllByRole('button');
    // First button is the X close
    fireEvent.click(buttons[0]);
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('navigates to preview when View Content clicked', () => {
    render(<ErrorDetailDialog {...defaultProps} />);
    fireEvent.click(screen.getByText('View Content'));
    expect(defaultProps.onClose).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/create/reel/item-1/preview');
  });

  it('shows retrying state', () => {
    render(<ErrorDetailDialog {...defaultProps} isRetrying={true} />);
    expect(screen.getByText('Retrying...')).toBeInTheDocument();
    expect(screen.getByText('Retrying...').closest('button')).toBeDisabled();
  });

  it('handles single platform failure text correctly', () => {
    const singleJob = [mockJobs[0]];
    render(<ErrorDetailDialog {...defaultProps} jobs={singleJob} />);
    expect(screen.getByText(/1 platform failed/)).toBeInTheDocument();
  });
});
