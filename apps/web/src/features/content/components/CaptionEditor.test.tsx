import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CaptionEditor } from './CaptionEditor';

describe('CaptionEditor', () => {
  const mockOnSave = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with initial value and counter', () => {
    render(<CaptionEditor value="Hello world" onSave={mockOnSave} />);

    const textarea = screen.getByPlaceholderText(
      'Write a caption for your content...',
    );
    expect(textarea).toBeInTheDocument();
    expect(textarea).toHaveValue('Hello world');
    expect(screen.getByText('11 / 2200')).toBeInTheDocument();
  });

  it('updates character counter as user types', () => {
    render(<CaptionEditor value="" onSave={mockOnSave} />);

    const textarea = screen.getByPlaceholderText(
      'Write a caption for your content...',
    );
    fireEvent.change(textarea, { target: { value: 'New text' } });
    expect(screen.getByText('8 / 2200')).toBeInTheDocument();
  });

  it('calls onSave on blur when value changed', () => {
    render(<CaptionEditor value="Original" onSave={mockOnSave} />);

    const textarea = screen.getByPlaceholderText(
      'Write a caption for your content...',
    );
    fireEvent.change(textarea, { target: { value: 'Updated' } });
    fireEvent.blur(textarea);

    expect(mockOnSave).toHaveBeenCalledWith('Updated');
  });

  it('does not call onSave on blur when value unchanged', () => {
    render(<CaptionEditor value="Same" onSave={mockOnSave} />);

    const textarea = screen.getByPlaceholderText(
      'Write a caption for your content...',
    );
    fireEvent.blur(textarea);

    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it('truncates text at max length', () => {
    render(<CaptionEditor value="" onSave={mockOnSave} />);

    const textarea = screen.getByPlaceholderText(
      'Write a caption for your content...',
    );
    const longText = 'a'.repeat(2300);
    fireEvent.change(textarea, { target: { value: longText } });

    expect(screen.getByText('2200 / 2200')).toBeInTheDocument();
  });

  it('shows warning style when approaching limit', () => {
    render(<CaptionEditor value={'x'.repeat(2050)} onSave={mockOnSave} />);

    const counter = screen.getByText('2050 / 2200');
    expect(counter).toHaveClass('text-orange-500');
  });

  it('shows red style at max length', () => {
    render(<CaptionEditor value={'z'.repeat(2200)} onSave={mockOnSave} />);

    const counter = screen.getByText('2200 / 2200');
    expect(counter).toHaveClass('text-red-500');
  });

  it('disables textarea when disabled prop is set', () => {
    render(<CaptionEditor value="Test" onSave={mockOnSave} disabled />);

    const textarea = screen.getByPlaceholderText(
      'Write a caption for your content...',
    );
    expect(textarea).toBeDisabled();
  });
});
