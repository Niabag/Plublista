import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormatPreview } from './FormatPreview';

describe('FormatPreview', () => {
  it('renders all 3 format options', () => {
    render(<FormatPreview selected="9:16" onSelect={vi.fn()} />);

    expect(screen.getByText('9:16')).toBeInTheDocument();
    expect(screen.getByText('16:9')).toBeInTheDocument();
    expect(screen.getByText('1:1')).toBeInTheDocument();
  });

  it('marks the selected format with aria-checked', () => {
    render(<FormatPreview selected="16:9" onSelect={vi.fn()} />);

    expect(screen.getByRole('radio', { name: '16:9' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('radio', { name: '9:16' })).toHaveAttribute('aria-checked', 'false');
    expect(screen.getByRole('radio', { name: '1:1' })).toHaveAttribute('aria-checked', 'false');
  });

  it('calls onSelect when a format is clicked', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<FormatPreview selected="9:16" onSelect={onSelect} />);

    await user.click(screen.getByText('1:1'));

    expect(onSelect).toHaveBeenCalledWith('1:1');
  });

  it('renders a radiogroup with Format label', () => {
    render(<FormatPreview selected="9:16" onSelect={vi.fn()} />);

    expect(screen.getByRole('radiogroup', { name: 'Format' })).toBeInTheDocument();
    expect(screen.getByText('Format')).toBeInTheDocument();
  });
});
