import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StylePicker } from './StylePicker';

describe('StylePicker', () => {
  it('renders all 5 style options', () => {
    render(<StylePicker selected="dynamic" onSelect={vi.fn()} />);

    expect(screen.getByText('Dynamic')).toBeInTheDocument();
    expect(screen.getByText('Cinematic')).toBeInTheDocument();
    expect(screen.getByText('UGC')).toBeInTheDocument();
    expect(screen.getByText('Tutorial')).toBeInTheDocument();
    expect(screen.getByText('Hype')).toBeInTheDocument();
  });

  it('renders descriptions for each style', () => {
    render(<StylePicker selected="dynamic" onSelect={vi.fn()} />);

    expect(screen.getByText(/fast cuts, energetic transitions/i)).toBeInTheDocument();
    expect(screen.getByText(/smooth movements, film-like/i)).toBeInTheDocument();
    expect(screen.getByText(/natural, authentic look/i)).toBeInTheDocument();
    expect(screen.getByText(/clear step-by-step flow/i)).toBeInTheDocument();
    expect(screen.getByText(/high-energy with effects/i)).toBeInTheDocument();
  });

  it('marks the selected style with aria-checked', () => {
    render(<StylePicker selected="cinematic" onSelect={vi.fn()} />);

    expect(screen.getByRole('radio', { name: /cinematic/i })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('radio', { name: /dynamic/i })).toHaveAttribute('aria-checked', 'false');
  });

  it('calls onSelect when a style is clicked', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<StylePicker selected="dynamic" onSelect={onSelect} />);

    await user.click(screen.getByText('Tutorial'));

    expect(onSelect).toHaveBeenCalledWith('tutorial');
  });

  it('renders a radiogroup with Style label', () => {
    render(<StylePicker selected="dynamic" onSelect={vi.fn()} />);

    expect(screen.getByRole('radiogroup', { name: 'Style' })).toBeInTheDocument();
    expect(screen.getByText('Style')).toBeInTheDocument();
  });
});
