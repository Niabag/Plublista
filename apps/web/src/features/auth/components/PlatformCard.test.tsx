import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PlatformCard } from './PlatformCard';
import type { PlatformConnection } from '@publista/shared';

const mockConnect = vi.fn();
const mockDisconnect = vi.fn();

const mockConnection: PlatformConnection = {
  id: 'conn-1',
  platform: 'instagram',
  platformUserId: '12345',
  platformUsername: 'testuser',
  connectedAt: '2026-01-01T00:00:00Z',
  tokenExpiresAt: '2026-03-01T00:00:00Z',
};

describe('PlatformCard', () => {
  it('renders "Coming Soon" state', () => {
    render(
      <PlatformCard
        platform="tiktok"
        connection={null}
        onConnect={mockConnect}
        onDisconnect={mockDisconnect}
        comingSoon
      />,
    );

    expect(screen.getByText('TikTok')).toBeInTheDocument();
    expect(screen.getByText('Coming Soon')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders error state with Try Again button', async () => {
    const user = userEvent.setup();

    render(
      <PlatformCard
        platform="instagram"
        connection={null}
        onConnect={mockConnect}
        onDisconnect={mockDisconnect}
        error="Token expired"
      />,
    );

    expect(screen.getByText('Instagram')).toBeInTheDocument();
    expect(screen.getByText('Token expired')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Try Again' }));
    expect(mockConnect).toHaveBeenCalledWith('instagram');
  });

  it('renders connected state with username and Disconnect button', async () => {
    const user = userEvent.setup();

    render(
      <PlatformCard
        platform="instagram"
        connection={mockConnection}
        onConnect={mockConnect}
        onDisconnect={mockDisconnect}
      />,
    );

    expect(screen.getByText('Instagram')).toBeInTheDocument();
    expect(screen.getByText(/Connected as @testuser/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Disconnect' }));
    expect(mockDisconnect).toHaveBeenCalledWith('instagram');
  });

  it('renders disconnected state with Connect button', async () => {
    const user = userEvent.setup();

    render(
      <PlatformCard
        platform="instagram"
        connection={null}
        onConnect={mockConnect}
        onDisconnect={mockDisconnect}
      />,
    );

    expect(screen.getByText('Instagram')).toBeInTheDocument();
    expect(screen.getByText('Not connected')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Connect' }));
    expect(mockConnect).toHaveBeenCalledWith('instagram');
  });

  it('disables Connect button when disabled prop is true', () => {
    render(
      <PlatformCard
        platform="instagram"
        connection={null}
        onConnect={mockConnect}
        onDisconnect={mockDisconnect}
        disabled
      />,
    );

    expect(screen.getByRole('button', { name: 'Connect' })).toBeDisabled();
  });
});
