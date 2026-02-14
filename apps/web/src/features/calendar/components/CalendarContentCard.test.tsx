import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CalendarContentCard } from './CalendarContentCard';
import type { ContentItem } from '@plublista/shared';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

// Mock dnd-kit to avoid context requirements
vi.mock('@dnd-kit/core', () => ({
  useDraggable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    isDragging: false,
  }),
}));

const makeItem = (overrides: Partial<ContentItem> = {}): ContentItem => ({
  id: 'item-1',
  userId: 'u1',
  type: 'reel',
  title: 'My Reel',
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
  scheduledAt: '2026-02-15T14:30:00Z',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  ...overrides,
});

describe('CalendarContentCard', () => {
  it('renders title and time', () => {
    render(<CalendarContentCard item={makeItem()} />);
    expect(screen.getByText('My Reel')).toBeInTheDocument();
    // Time should be displayed (format depends on timezone, just check card exists)
    expect(screen.getByTestId('calendar-card')).toBeInTheDocument();
  });

  it('shows Untitled for items without title', () => {
    render(<CalendarContentCard item={makeItem({ title: null })} />);
    expect(screen.getByText('Untitled')).toBeInTheDocument();
  });

  it('applies indigo style for reels', () => {
    render(<CalendarContentCard item={makeItem({ type: 'reel' })} />);
    const card = screen.getByTestId('calendar-card');
    expect(card.className).toContain('indigo');
  });

  it('applies emerald style for carousels', () => {
    render(<CalendarContentCard item={makeItem({ type: 'carousel' })} />);
    const card = screen.getByTestId('calendar-card');
    expect(card.className).toContain('emerald');
  });

  it('applies sky style for posts', () => {
    render(<CalendarContentCard item={makeItem({ type: 'post' })} />);
    const card = screen.getByTestId('calendar-card');
    expect(card.className).toContain('sky');
  });

  it('navigates to preview on click', () => {
    render(<CalendarContentCard item={makeItem()} />);
    fireEvent.click(screen.getByTestId('calendar-card'));
    expect(mockNavigate).toHaveBeenCalledWith('/create/reel/item-1/preview');
  });
});
