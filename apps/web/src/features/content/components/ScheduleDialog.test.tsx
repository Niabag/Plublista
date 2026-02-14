import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ScheduleDialog } from './ScheduleDialog';

// Mock shadcn Calendar to avoid complex date-picker rendering in tests
vi.mock('@/components/ui/calendar', () => ({
  Calendar: ({
    onSelect,
    selected,
  }: {
    onSelect: (date: Date) => void;
    selected?: Date;
  }) => (
    <div data-testid="mock-calendar">
      <button
        data-testid="pick-tomorrow"
        onClick={() => {
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          tomorrow.setHours(0, 0, 0, 0);
          onSelect(tomorrow);
        }}
      >
        Pick Tomorrow
      </button>
      {selected && (
        <span data-testid="selected-date">{selected.toISOString()}</span>
      )}
    </div>
  ),
}));

const defaultProps = {
  open: true,
  onClose: vi.fn(),
  onConfirm: vi.fn(),
  isPending: false,
  userTier: 'free',
  connectedPlatforms: ['instagram'],
  ayrshareConnectUrl: null,
  instagramUsername: 'testuser',
};

describe('ScheduleDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not render when open is false', () => {
    render(<ScheduleDialog {...defaultProps} open={false} />);
    expect(screen.queryByText('Schedule Content')).not.toBeInTheDocument();
  });

  it('renders dialog with title, calendar, time selects, and platform list', () => {
    render(<ScheduleDialog {...defaultProps} />);
    expect(screen.getByText('Schedule Content')).toBeInTheDocument();
    expect(screen.getByTestId('mock-calendar')).toBeInTheDocument();
    expect(screen.getByText('Time')).toBeInTheDocument();
    expect(screen.getByText('Instagram')).toBeInTheDocument();
    expect(screen.getByText('@testuser')).toBeInTheDocument();
  });

  it('disables Schedule button when no platform selected and no date', () => {
    render(<ScheduleDialog {...defaultProps} />);
    const scheduleBtn = screen.getByRole('button', { name: /^schedule$/i });
    expect(scheduleBtn).toBeDisabled();
  });

  it('disables Schedule button when only date is selected (no platform)', () => {
    render(<ScheduleDialog {...defaultProps} />);
    fireEvent.click(screen.getByTestId('pick-tomorrow'));
    const scheduleBtn = screen.getByRole('button', { name: /^schedule$/i });
    expect(scheduleBtn).toBeDisabled();
  });

  it('enables Schedule button with valid date and selected platform', () => {
    render(<ScheduleDialog {...defaultProps} />);

    // Select date
    fireEvent.click(screen.getByTestId('pick-tomorrow'));

    // Select Instagram
    fireEvent.click(screen.getByText('Instagram'));

    const scheduleBtn = screen.getByRole('button', { name: /^schedule$/i });
    expect(scheduleBtn).not.toBeDisabled();
  });

  it('calls onConfirm with platforms and ISO scheduledAt object', () => {
    render(<ScheduleDialog {...defaultProps} />);

    // Select date
    fireEvent.click(screen.getByTestId('pick-tomorrow'));

    // Select Instagram
    fireEvent.click(screen.getByText('Instagram'));

    // Click Schedule
    const scheduleBtn = screen.getByRole('button', { name: /^schedule$/i });
    fireEvent.click(scheduleBtn);

    expect(defaultProps.onConfirm).toHaveBeenCalledWith({
      platforms: ['instagram'],
      scheduledAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/),
    });
  });

  it('calls onClose when Cancel is clicked', () => {
    render(<ScheduleDialog {...defaultProps} />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('locks non-Instagram platforms for free users', () => {
    render(<ScheduleDialog {...defaultProps} />);
    const youtubeBtn = screen.getByText('YouTube').closest('button')!;
    expect(youtubeBtn).toBeDisabled();
    expect(screen.getAllByText('Upgrade').length).toBeGreaterThan(0);
  });

  it('shows Scheduling... when isPending', () => {
    render(<ScheduleDialog {...defaultProps} isPending={true} />);
    expect(screen.getByText('Scheduling...')).toBeInTheDocument();
  });
});
