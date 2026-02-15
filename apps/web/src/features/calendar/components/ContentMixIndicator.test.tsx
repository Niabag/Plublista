import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ContentMixIndicator } from './ContentMixIndicator';
import type { ContentItem } from '@publista/shared';

const makeItem = (type: ContentItem['type']): ContentItem => ({
  id: `item-${type}-${Math.random()}`,
  userId: 'u1',
  type,
  title: `Test ${type}`,
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
  scheduledAt: '2026-02-15T10:00:00Z',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
});

describe('ContentMixIndicator', () => {
  it('shows correct counts per type', () => {
    const items = [
      makeItem('reel'),
      makeItem('reel'),
      makeItem('carousel'),
      makeItem('post'),
      makeItem('post'),
      makeItem('post'),
    ];

    render(<ContentMixIndicator items={items} />);

    expect(screen.getByText('2')).toBeInTheDocument(); // reels
    expect(screen.getByText('1')).toBeInTheDocument(); // carousels
    expect(screen.getByText('3')).toBeInTheDocument(); // posts
  });

  it('renders nothing for empty items', () => {
    const { container } = render(<ContentMixIndicator items={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('only shows types that have items', () => {
    const items = [makeItem('reel'), makeItem('reel')];
    render(<ContentMixIndicator items={items} />);

    expect(screen.getByTestId('content-mix')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    // Should not show carousel or post counts
    expect(screen.queryAllByText('0')).toHaveLength(0);
  });
});
