import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MusicSelector } from './MusicSelector';

describe('MusicSelector', () => {
  it('renders the auto-match option', () => {
    render(<MusicSelector selected="auto-match" onSelect={vi.fn()} />);

    expect(screen.getByText('Auto-match')).toBeInTheDocument();
    expect(screen.getByText(/ai selects music that fits your style/i)).toBeInTheDocument();
  });

  it('shows "coming soon" hint text', () => {
    render(<MusicSelector selected="auto-match" onSelect={vi.fn()} />);

    expect(screen.getByText(/more options coming soon/i)).toBeInTheDocument();
  });

  it('marks auto-match as selected with aria-checked', () => {
    render(<MusicSelector selected="auto-match" onSelect={vi.fn()} />);

    expect(screen.getByRole('radio', { name: /auto-match/i })).toHaveAttribute('aria-checked', 'true');
  });

  it('calls onSelect when clicked', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<MusicSelector selected="auto-match" onSelect={onSelect} />);

    await user.click(screen.getByText('Auto-match'));

    expect(onSelect).toHaveBeenCalledWith('auto-match');
  });

  it('renders a radiogroup with Music label', () => {
    render(<MusicSelector selected="auto-match" onSelect={vi.fn()} />);

    expect(screen.getByRole('radiogroup', { name: 'Music' })).toBeInTheDocument();
    expect(screen.getByText('Music')).toBeInTheDocument();
  });
});
