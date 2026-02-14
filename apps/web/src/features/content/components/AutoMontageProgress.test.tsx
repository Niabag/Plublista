import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { AutoMontageProgress } from './AutoMontageProgress';

const mockUseContentStatus = vi.fn();

vi.mock('../hooks/useContentStatus', () => ({
  useContentStatus: (...args: unknown[]) => mockUseContentStatus(...args),
}));

describe('AutoMontageProgress', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders all 5 step labels', () => {
    mockUseContentStatus.mockReturnValue({
      status: 'generating',
      generatedMediaUrl: null,
      isPending: false,
      isError: false,
    });

    render(<AutoMontageProgress contentItemId="item-1" />);

    expect(screen.getByText('Analyzing clips')).toBeInTheDocument();
    expect(screen.getByText('Selecting best moments')).toBeInTheDocument();
    expect(screen.getByText('Matching music to content mood')).toBeInTheDocument();
    expect(screen.getByText('Rendering final video')).toBeInTheDocument();
    expect(screen.getByText('Adding text overlays')).toBeInTheDocument();
  });

  it('shows progress bar with correct aria attributes', () => {
    mockUseContentStatus.mockReturnValue({
      status: 'generating',
      generatedMediaUrl: null,
      isPending: false,
      isError: false,
    });

    render(<AutoMontageProgress contentItemId="item-1" />);

    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuemin', '0');
    expect(progressBar).toHaveAttribute('aria-valuemax', '100');
    expect(progressBar).toHaveAttribute('aria-valuenow');
    expect(progressBar).toHaveAttribute('aria-label', 'Generation progress');
  });

  it('displays loading spinner when pending', () => {
    mockUseContentStatus.mockReturnValue({
      status: null,
      generatedMediaUrl: null,
      isPending: true,
      isError: false,
    });

    const { container } = render(<AutoMontageProgress contentItemId="item-1" />);

    expect(screen.queryByText('Analyzing clips')).not.toBeInTheDocument();
    expect(container.querySelector('.animate-spin, .motion-safe\\:animate-spin')).toBeInTheDocument();
  });

  it('displays completion state when status is draft', () => {
    mockUseContentStatus.mockReturnValue({
      status: 'draft',
      generatedMediaUrl: 'https://example.com/video.mp4',
      isPending: false,
      isError: false,
    });

    render(<AutoMontageProgress contentItemId="item-1" />);

    expect(screen.getByText('Your Reel is ready!')).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('displays error state when status is failed', () => {
    mockUseContentStatus.mockReturnValue({
      status: 'failed',
      generatedMediaUrl: null,
      isPending: false,
      isError: false,
    });

    render(<AutoMontageProgress contentItemId="item-1" />);

    expect(screen.getByText('Generation failed')).toBeInTheDocument();
  });

  it('displays API error state when isError is true', () => {
    mockUseContentStatus.mockReturnValue({
      status: null,
      generatedMediaUrl: null,
      isPending: false,
      isError: true,
    });

    render(<AutoMontageProgress contentItemId="item-1" />);

    expect(screen.getByText('Unable to load progress')).toBeInTheDocument();
    expect(screen.queryByText('Analyzing clips')).not.toBeInTheDocument();
  });

  it('calls onError when API error occurs', () => {
    const onError = vi.fn();
    mockUseContentStatus.mockReturnValue({
      status: null,
      generatedMediaUrl: null,
      isPending: false,
      isError: true,
    });

    render(<AutoMontageProgress contentItemId="item-1" onError={onError} />);

    expect(onError).toHaveBeenCalled();
  });

  it('calls onComplete when status transitions to draft', () => {
    const onComplete = vi.fn();
    mockUseContentStatus.mockReturnValue({
      status: 'draft',
      generatedMediaUrl: 'https://example.com/video.mp4',
      isPending: false,
      isError: false,
    });

    render(<AutoMontageProgress contentItemId="item-1" onComplete={onComplete} />);

    expect(onComplete).toHaveBeenCalled();
  });

  it('calls onError when status transitions to failed', () => {
    const onError = vi.fn();
    mockUseContentStatus.mockReturnValue({
      status: 'failed',
      generatedMediaUrl: null,
      isPending: false,
      isError: false,
    });

    render(<AutoMontageProgress contentItemId="item-1" onError={onError} />);

    expect(onError).toHaveBeenCalled();
  });

  it('has aria-live polite region for step updates', () => {
    mockUseContentStatus.mockReturnValue({
      status: 'generating',
      generatedMediaUrl: null,
      isPending: false,
      isError: false,
    });

    render(<AutoMontageProgress contentItemId="item-1" />);

    const liveRegion = screen.getByRole('status');
    expect(liveRegion).toHaveAttribute('aria-live', 'polite');
  });

  it('advances simulated steps over time during generating', () => {
    mockUseContentStatus.mockReturnValue({
      status: 'generating',
      generatedMediaUrl: null,
      isPending: false,
      isError: false,
    });

    render(<AutoMontageProgress contentItemId="item-1" />);

    // Initially at step 0 — shows 10% (partial progress for active step)
    expect(screen.getByText('10%')).toBeInTheDocument();

    // Advance by 3 seconds — should move to step 1 (30%)
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(screen.getByText('30%')).toBeInTheDocument();

    // Advance by another 3 seconds — should move to step 2 (50%)
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('passes contentItemId to useContentStatus', () => {
    mockUseContentStatus.mockReturnValue({
      status: 'generating',
      generatedMediaUrl: null,
      isPending: false,
      isError: false,
    });

    render(<AutoMontageProgress contentItemId="test-id-123" />);

    expect(mockUseContentStatus).toHaveBeenCalledWith('test-id-123');
  });
});
