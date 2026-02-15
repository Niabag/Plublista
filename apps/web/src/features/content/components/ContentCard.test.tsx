import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ContentCard } from './ContentCard';
import type { ContentItem } from '@publista/shared';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

// Mock radix-based shadcn components to render inline (no portals)
vi.mock('@/components/ui/dropdown-menu', () => {
  const React = require('react');
  return {
    DropdownMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    DropdownMenuTrigger: ({ children, asChild, ...props }: any) => {
      if (asChild) return <>{children}</>;
      return <button {...props}>{children}</button>;
    },
    DropdownMenuContent: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="dropdown-content">{children}</div>
    ),
    DropdownMenuItem: ({ children, onClick, ...props }: any) => (
      <button role="menuitem" onClick={onClick} {...props}>{children}</button>
    ),
  };
});

vi.mock('@/components/ui/alert-dialog', () => {
  const React = require('react');
  return {
    AlertDialog: ({ children, open }: { children: React.ReactNode; open: boolean; onOpenChange: (v: boolean) => void }) => (
      open ? <div role="alertdialog">{children}</div> : null
    ),
    AlertDialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    AlertDialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    AlertDialogTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
    AlertDialogDescription: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
    AlertDialogFooter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    AlertDialogCancel: ({ children }: { children: React.ReactNode }) => (
      <button>{children}</button>
    ),
    AlertDialogAction: ({ children, onClick, ...props }: any) => (
      <button onClick={onClick} {...props}>{children}</button>
    ),
  };
});

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
  scheduledAt: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

function getCard() {
  return screen.getAllByRole('button').find(
    (el) => el.classList.contains('cursor-pointer'),
  )!;
}

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
    render(<ContentCard item={makeItem({ status: 'failed' })} />);
    const card = getCard();
    expect(card.className).toContain('border-l-rose-500');
  });

  it('does not show red border for draft items', () => {
    render(<ContentCard item={makeItem({ status: 'draft' })} />);
    const card = getCard();
    expect(card.className).not.toContain('border-l-rose-500');
  });

  it('navigates to reel preview on click', () => {
    render(<ContentCard item={makeItem({ type: 'reel', id: 'reel-1' })} />);
    fireEvent.click(getCard());
    expect(mockNavigate).toHaveBeenCalledWith('/create/reel/reel-1/preview');
  });

  it('navigates to carousel preview on click', () => {
    render(<ContentCard item={makeItem({ type: 'carousel', id: 'car-1' })} />);
    fireEvent.click(getCard());
    expect(mockNavigate).toHaveBeenCalledWith('/create/carousel/car-1/preview');
  });

  it('navigates to post preview on click', () => {
    render(<ContentCard item={makeItem({ type: 'post', id: 'post-1' })} />);
    fireEvent.click(getCard());
    expect(mockNavigate).toHaveBeenCalledWith('/create/post/post-1/preview');
  });

  it('calls onFailedClick instead of navigating for failed items', () => {
    const onFailedClick = vi.fn();
    const failedItem = makeItem({ status: 'failed' });

    render(<ContentCard item={failedItem} onFailedClick={onFailedClick} />);
    fireEvent.click(getCard());

    expect(onFailedClick).toHaveBeenCalledWith(failedItem);
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('navigates to preview for failed items when no onFailedClick provided', () => {
    render(<ContentCard item={makeItem({ status: 'failed', type: 'post', id: 'p-1' })} />);
    fireEvent.click(getCard());
    expect(mockNavigate).toHaveBeenCalledWith('/create/post/p-1/preview');
  });

  it('shows correct type labels', () => {
    const { rerender } = render(<ContentCard item={makeItem({ type: 'carousel' })} />);
    expect(screen.getByText('Carousel')).toBeInTheDocument();

    rerender(<ContentCard item={makeItem({ type: 'post' })} />);
    expect(screen.getByText('Post')).toBeInTheDocument();
  });

  it('shows "..." menu button when onDuplicate or onDelete provided', () => {
    render(
      <ContentCard
        item={makeItem()}
        onDuplicate={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByLabelText('Content actions')).toBeInTheDocument();
  });

  it('does not show "..." menu when no action callbacks provided', () => {
    render(<ContentCard item={makeItem()} />);
    expect(screen.queryByLabelText('Content actions')).not.toBeInTheDocument();
  });

  it('calls onDuplicate when Duplicate is clicked', () => {
    const onDuplicate = vi.fn();
    render(
      <ContentCard
        item={makeItem({ id: 'dup-1' })}
        onDuplicate={onDuplicate}
      />,
    );

    // Click Duplicate menu item (rendered inline via mock)
    fireEvent.click(screen.getByText('Duplicate'));

    expect(onDuplicate).toHaveBeenCalledWith('dup-1');
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('shows delete confirmation dialog and calls onDelete on confirm', () => {
    const onDelete = vi.fn();
    render(
      <ContentCard
        item={makeItem({ id: 'del-1', title: 'My Content' })}
        onDelete={onDelete}
      />,
    );

    // Click Delete menu item to open AlertDialog
    fireEvent.click(screen.getByRole('menuitem', { name: /delete/i }));

    // AlertDialog should show
    expect(screen.getByText('Delete content?')).toBeInTheDocument();
    expect(screen.getByText(/permanently delete/)).toBeInTheDocument();

    // Confirm delete (the AlertDialogAction button inside the dialog)
    const dialog = screen.getByRole('alertdialog');
    const deleteBtn = dialog.querySelector('button:last-child')!;
    fireEvent.click(deleteBtn);

    expect(onDelete).toHaveBeenCalledWith('del-1');
  });

  it('does not navigate when menu button is clicked', () => {
    render(
      <ContentCard
        item={makeItem()}
        onDuplicate={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByLabelText('Content actions'));
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
