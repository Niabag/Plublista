import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ClipCard } from './ClipCard';
import type { ClipData } from './ClipCard';

function createClip(overrides: Partial<ClipData> = {}): ClipData {
  return {
    id: 'clip-1',
    file: new File([''], 'test-video.mp4', { type: 'video/mp4' }),
    fileKey: 'users/123/uploads/abc.mp4',
    fileName: 'test-video.mp4',
    thumbnailUrl: 'data:image/jpeg;base64,abc',
    duration: 45.2,
    status: 'ready',
    ...overrides,
  };
}

describe('ClipCard', () => {
  it('renders thumbnail, filename, and duration', () => {
    render(<ClipCard clip={createClip()} onRemove={vi.fn()} />);

    expect(screen.getByAltText('Thumbnail of test-video.mp4')).toBeInTheDocument();
    expect(screen.getByText('test-video.mp4')).toBeInTheDocument();
    expect(screen.getByText('0:45')).toBeInTheDocument();
  });

  it('calls onRemove with clip id when remove button is clicked', async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    render(<ClipCard clip={createClip()} onRemove={onRemove} />);

    await user.click(screen.getByRole('button', { name: /remove/i }));
    expect(onRemove).toHaveBeenCalledWith('clip-1');
  });

  it('shows loading skeleton when status is processing', () => {
    const { container } = render(
      <ClipCard clip={createClip({ status: 'processing' })} onRemove={vi.fn()} />,
    );

    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('shows error icon when status is error', () => {
    render(
      <ClipCard
        clip={createClip({ status: 'error', error: 'Upload failed' })}
        onRemove={vi.fn()}
      />,
    );

    expect(screen.getByText('Upload failed')).toBeInTheDocument();
  });

  it('shows drag handle button', () => {
    render(<ClipCard clip={createClip()} onRemove={vi.fn()} />);

    expect(screen.getByRole('button', { name: /drag to reorder/i })).toBeInTheDocument();
  });

  it('applies dragging styles when isDragging is true', () => {
    const { container } = render(
      <ClipCard clip={createClip()} onRemove={vi.fn()} isDragging />,
    );

    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain('shadow-xl');
  });

  it('does not show duration badge when not ready', () => {
    render(
      <ClipCard clip={createClip({ status: 'uploading' })} onRemove={vi.fn()} />,
    );

    expect(screen.queryByText('0:45')).not.toBeInTheDocument();
  });
});
