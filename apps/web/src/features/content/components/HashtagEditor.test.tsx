import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { HashtagEditor } from './HashtagEditor';

describe('HashtagEditor', () => {
  const mockOnSave = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders existing tags as badges', () => {
    render(
      <HashtagEditor value={['react', 'vitest']} onSave={mockOnSave} />,
    );

    expect(screen.getByText('react')).toBeInTheDocument();
    expect(screen.getByText('vitest')).toBeInTheDocument();
    expect(screen.getByText('2 / 30 tags. Press Enter to add.')).toBeInTheDocument();
  });

  it('adds a new tag on Enter', () => {
    render(
      <HashtagEditor value={['existing']} onSave={mockOnSave} />,
    );

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'newtag' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(mockOnSave).toHaveBeenCalledWith(['existing', 'newtag']);
  });

  it('strips # prefix when adding tag', () => {
    render(
      <HashtagEditor value={[]} onSave={mockOnSave} />,
    );

    const input = screen.getByPlaceholderText('Add hashtags...');
    fireEvent.change(input, { target: { value: '#trending' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(mockOnSave).toHaveBeenCalledWith(['trending']);
  });

  it('removes a tag when X button is clicked', () => {
    render(
      <HashtagEditor value={['remove', 'keep']} onSave={mockOnSave} />,
    );

    const removeButton = screen.getByLabelText('Remove remove');
    fireEvent.click(removeButton);

    expect(mockOnSave).toHaveBeenCalledWith(['keep']);
  });

  it('does not add duplicate tags', () => {
    render(
      <HashtagEditor value={['unique']} onSave={mockOnSave} />,
    );

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'unique' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it('strips special characters from tags', () => {
    render(
      <HashtagEditor value={[]} onSave={mockOnSave} />,
    );

    const input = screen.getByPlaceholderText('Add hashtags...');
    fireEvent.change(input, { target: { value: 'hello world!' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(mockOnSave).toHaveBeenCalledWith(['helloworld']);
  });

  it('removes last tag on Backspace when input is empty', () => {
    render(
      <HashtagEditor value={['first', 'last']} onSave={mockOnSave} />,
    );

    const input = screen.getByRole('textbox');
    fireEvent.keyDown(input, { key: 'Backspace' });

    expect(mockOnSave).toHaveBeenCalledWith(['first']);
  });
});
