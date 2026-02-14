import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CalendarPage } from './CalendarPage';

const mockUseCalendarContent = vi.fn();
const mockUseReschedule = vi.fn();

vi.mock('../hooks/useCalendarContent', () => ({
  useCalendarContent: (...args: unknown[]) => mockUseCalendarContent(...args),
  CALENDAR_CONTENT_QUERY_KEY: 'calendar-content',
}));

vi.mock('../hooks/useReschedule', () => ({
  useReschedule: () => mockUseReschedule(),
}));

// Mock dnd-kit to avoid complex DnD context in tests
vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DragOverlay: () => null,
  closestCenter: vi.fn(),
  useDraggable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    isDragging: false,
  }),
  useDroppable: () => ({
    setNodeRef: vi.fn(),
    isOver: false,
  }),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <CalendarPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const mockItems = [
  {
    id: 'item-1',
    userId: 'u1',
    type: 'reel',
    title: 'Reel One',
    status: 'scheduled',
    style: null,
    format: null,
    duration: null,
    mediaUrls: [],
    generatedMediaUrl: null,
    caption: null,
    hashtags: [],
    hookText: null,
    ctaText: null,
    musicUrl: null,
    musicPrompt: null,
    scheduledAt: new Date().toISOString(),
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'item-2',
    userId: 'u1',
    type: 'carousel',
    title: 'Carousel Two',
    status: 'scheduled',
    style: null,
    format: null,
    duration: null,
    mediaUrls: [],
    generatedMediaUrl: null,
    caption: null,
    hashtags: [],
    hookText: null,
    ctaText: null,
    musicUrl: null,
    musicPrompt: null,
    scheduledAt: new Date().toISOString(),
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
];

describe('CalendarPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseReschedule.mockReturnValue({
      reschedule: vi.fn(),
      isRescheduling: false,
    });
  });

  it('shows loading skeleton while pending', () => {
    mockUseCalendarContent.mockReturnValue({
      items: [],
      isPending: true,
      isError: false,
      refetch: vi.fn(),
    });

    renderPage();
    expect(document.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
  });

  it('renders month view by default with day headers', () => {
    mockUseCalendarContent.mockReturnValue({
      items: [],
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    });

    renderPage();

    expect(screen.getByText('Mon')).toBeInTheDocument();
    expect(screen.getByText('Sun')).toBeInTheDocument();
    expect(screen.getByText('Today')).toBeInTheDocument();
    expect(screen.getByTestId('calendar-grid')).toBeInTheDocument();
  });

  it('shows current month name in title', () => {
    mockUseCalendarContent.mockReturnValue({
      items: [],
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    });

    renderPage();

    const monthName = new Date().toLocaleString('en-US', { month: 'long' });
    expect(screen.getByText(new RegExp(monthName))).toBeInTheDocument();
  });

  it('toggles between month and week view', () => {
    mockUseCalendarContent.mockReturnValue({
      items: [],
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    });

    renderPage();

    const weekBtn = screen.getByText('Week');
    fireEvent.click(weekBtn);

    // Week view should show exactly 7 day cells
    const grid = screen.getByTestId('calendar-grid');
    const dayCells = grid.querySelectorAll('[data-testid^="day-"]');
    expect(dayCells.length).toBe(7);
  });

  it('renders content cards for items with scheduledAt', () => {
    mockUseCalendarContent.mockReturnValue({
      items: mockItems,
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    });

    renderPage();

    expect(screen.getByText('Reel One')).toBeInTheDocument();
    expect(screen.getByText('Carousel Two')).toBeInTheDocument();
  });

  it('shows content mix indicator with items', () => {
    mockUseCalendarContent.mockReturnValue({
      items: mockItems,
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    });

    renderPage();

    expect(screen.getByTestId('content-mix')).toBeInTheDocument();
  });

  it('navigates to next/previous month', () => {
    mockUseCalendarContent.mockReturnValue({
      items: [],
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    });

    renderPage();

    const nextBtn = screen.getByLabelText('Next');
    fireEvent.click(nextBtn);

    // The hook should be called with updated date range
    expect(mockUseCalendarContent).toHaveBeenCalledTimes(2);
  });
});
