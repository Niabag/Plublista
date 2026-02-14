import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PublishConfirmDialog } from './PublishConfirmDialog';

describe('PublishConfirmDialog', () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
    isPending: false,
    userTier: 'free' as string,
    connectedPlatforms: ['instagram'],
    ayrshareConnectUrl: null as string | null,
    instagramUsername: 'testuser',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when open is false', () => {
    const { container } = render(
      <PublishConfirmDialog {...defaultProps} open={false} />,
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders dialog with title and platform list', () => {
    render(<PublishConfirmDialog {...defaultProps} />);

    expect(screen.getByText('Publish Content')).toBeInTheDocument();
    expect(screen.getByText('Instagram')).toBeInTheDocument();
    expect(screen.getByText('@testuser')).toBeInTheDocument();
    expect(screen.getByText('YouTube')).toBeInTheDocument();
    expect(screen.getByText('TikTok')).toBeInTheDocument();
  });

  it('shows lock icons and Upgrade on non-Instagram platforms for free tier', () => {
    render(<PublishConfirmDialog {...defaultProps} />);

    const upgrades = screen.getAllByText('Upgrade');
    // YouTube, TikTok, Facebook, LinkedIn, X = 5 locked platforms
    expect(upgrades).toHaveLength(5);
  });

  it('shows Not connected for platforms not in connectedPlatforms (free tier)', () => {
    render(
      <PublishConfirmDialog
        {...defaultProps}
        connectedPlatforms={[]}
        instagramUsername={undefined}
      />,
    );

    expect(screen.getByText('Not connected')).toBeInTheDocument();
  });

  it('allows selecting a connected platform', () => {
    render(<PublishConfirmDialog {...defaultProps} />);

    // Click Instagram to select it
    fireEvent.click(screen.getByText('Instagram'));
    expect(screen.getByText('Publish to Instagram')).toBeInTheDocument();
  });

  it('calls onConfirm with selected platforms array', () => {
    render(<PublishConfirmDialog {...defaultProps} />);

    fireEvent.click(screen.getByText('Instagram'));
    fireEvent.click(screen.getByText('Publish to Instagram'));
    expect(defaultProps.onConfirm).toHaveBeenCalledWith(['instagram']);
  });

  it('calls onClose when Cancel is clicked', () => {
    render(<PublishConfirmDialog {...defaultProps} />);

    fireEvent.click(screen.getByText('Cancel'));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('shows loading state when isPending', () => {
    render(<PublishConfirmDialog {...defaultProps} isPending={true} />);

    expect(screen.getByText('Publishing...')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeDisabled();
  });

  it('calls onClose when X button is clicked', () => {
    render(<PublishConfirmDialog {...defaultProps} />);

    const buttons = screen.getAllByRole('button');
    // First button is the X close
    fireEvent.click(buttons[0]);
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('allows multi-select for paid users with multiple connected platforms', () => {
    render(
      <PublishConfirmDialog
        {...defaultProps}
        userTier="pro"
        connectedPlatforms={['instagram', 'youtube', 'tiktok']}
        ayrshareConnectUrl="https://app.ayrshare.com/connect/abc"
      />,
    );

    // No Upgrade labels for paid tier
    expect(screen.queryByText('Upgrade')).not.toBeInTheDocument();

    // Select multiple
    fireEvent.click(screen.getByText('Instagram'));
    fireEvent.click(screen.getByText('YouTube'));
    fireEvent.click(screen.getByText('TikTok'));

    expect(screen.getByText('Publish to 3 Platforms')).toBeInTheDocument();
  });

  it('shows Connect link for unconnected platforms on paid tier', () => {
    render(
      <PublishConfirmDialog
        {...defaultProps}
        userTier="pro"
        connectedPlatforms={['instagram']}
        ayrshareConnectUrl="https://app.ayrshare.com/connect/abc"
      />,
    );

    const connectLinks = screen.getAllByText('Connect');
    expect(connectLinks.length).toBeGreaterThan(0);
  });

  it('disables confirm button when no platforms selected', () => {
    render(<PublishConfirmDialog {...defaultProps} />);

    const selectBtn = screen.getByText('Select platforms');
    expect(selectBtn).toBeDisabled();
  });

  it('shows watermark notice for free-tier users', () => {
    render(<PublishConfirmDialog {...defaultProps} userTier="free" />);

    expect(screen.getByText(/watermark will be added/i)).toBeInTheDocument();
  });

  it('hides watermark notice for paid-tier users', () => {
    render(
      <PublishConfirmDialog
        {...defaultProps}
        userTier="pro"
        connectedPlatforms={['instagram']}
      />,
    );

    expect(screen.queryByText(/watermark will be added/i)).not.toBeInTheDocument();
  });
});
