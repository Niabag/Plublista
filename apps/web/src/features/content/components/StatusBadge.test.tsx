import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusBadge } from './StatusBadge';
import type { ContentStatus } from '@publista/shared';

describe('StatusBadge', () => {
  const statuses: { status: ContentStatus; label: string; colorClass: string }[] = [
    { status: 'draft', label: 'Draft', colorClass: 'bg-gray-100' },
    { status: 'generating', label: 'Generating', colorClass: 'bg-amber-100' },
    { status: 'scheduled', label: 'Scheduled', colorClass: 'bg-sky-100' },
    { status: 'published', label: 'Published', colorClass: 'bg-emerald-100' },
    { status: 'failed', label: 'Failed', colorClass: 'bg-rose-100' },
    { status: 'retrying', label: 'Retrying', colorClass: 'bg-amber-100' },
  ];

  statuses.forEach(({ status, label, colorClass }) => {
    it(`renders "${label}" badge for ${status} status`, () => {
      render(<StatusBadge status={status} />);

      const badge = screen.getByText(label);
      expect(badge).toBeInTheDocument();
      expect(badge.className).toContain(colorClass);
    });
  });

  it('applies generating pulse animation', () => {
    render(<StatusBadge status="generating" />);
    const badge = screen.getByText('Generating');
    expect(badge.className).toContain('animate-pulse');
  });

  it('applies retrying pulse animation', () => {
    render(<StatusBadge status="retrying" />);
    const badge = screen.getByText('Retrying');
    expect(badge.className).toContain('animate-pulse');
  });

  it('accepts additional className', () => {
    render(<StatusBadge status="draft" className="extra-class" />);
    const badge = screen.getByText('Draft');
    expect(badge.className).toContain('extra-class');
  });
});
