import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MontageSettings } from './MontageSettings';
import type { MontageSettingsValues } from './MontageSettings';

const defaultSettings: MontageSettingsValues = {
  style: 'dynamic',
  format: '9:16',
  duration: 30,
  music: 'auto-match',
};

describe('MontageSettings', () => {
  it('renders expanded by default showing all options', () => {
    render(<MontageSettings value={defaultSettings} onChange={vi.fn()} />);

    expect(screen.getByText('Settings')).toBeInTheDocument();
    // Style options visible
    expect(screen.getByText('Dynamic')).toBeInTheDocument();
    expect(screen.getByText('Cinematic')).toBeInTheDocument();
    expect(screen.getByText('UGC')).toBeInTheDocument();
    expect(screen.getByText('Tutorial')).toBeInTheDocument();
    expect(screen.getByText('Hype')).toBeInTheDocument();
    // Format options visible
    expect(screen.getByText('9:16')).toBeInTheDocument();
    expect(screen.getByText('16:9')).toBeInTheDocument();
    expect(screen.getByText('1:1')).toBeInTheDocument();
    // Duration options visible
    expect(screen.getByText('15s')).toBeInTheDocument();
    expect(screen.getByText('30s')).toBeInTheDocument();
    expect(screen.getByText('60s')).toBeInTheDocument();
    // Music visible
    expect(screen.getByText('Auto-match')).toBeInTheDocument();
  });

  it('collapses on click to hide options', async () => {
    const user = userEvent.setup();
    render(<MontageSettings value={defaultSettings} onChange={vi.fn()} />);

    await user.click(screen.getByText('Settings'));

    expect(screen.queryByText('Dynamic')).not.toBeInTheDocument();
    expect(screen.queryByText('9:16')).not.toBeInTheDocument();
  });

  it('calls onChange when a style is selected', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<MontageSettings value={defaultSettings} onChange={onChange} />);

    await user.click(screen.getByText('Cinematic'));

    expect(onChange).toHaveBeenCalledWith({
      ...defaultSettings,
      style: 'cinematic',
    });
  });

  it('calls onChange when a format is selected', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<MontageSettings value={defaultSettings} onChange={onChange} />);

    await user.click(screen.getByText('1:1'));

    expect(onChange).toHaveBeenCalledWith({
      ...defaultSettings,
      format: '1:1',
    });
  });

  it('calls onChange when a duration is selected', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<MontageSettings value={defaultSettings} onChange={onChange} />);

    await user.click(screen.getByText('60s'));

    expect(onChange).toHaveBeenCalledWith({
      ...defaultSettings,
      duration: 60,
    });
  });

  it('shows correct default selections via aria-checked', () => {
    render(<MontageSettings value={defaultSettings} onChange={vi.fn()} />);

    expect(screen.getByRole('radio', { name: /dynamic/i })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('radio', { name: '9:16' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('radio', { name: '30s' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('radio', { name: /auto-match/i })).toHaveAttribute('aria-checked', 'true');
  });
});
