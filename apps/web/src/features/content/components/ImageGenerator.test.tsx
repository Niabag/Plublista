import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import { ImageGenerator } from './ImageGenerator';

const mockApiPost = vi.fn();

vi.mock('@/lib/apiClient', () => ({
  apiPost: (...args: unknown[]) => mockApiPost(...args),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

function renderComponent(props?: Partial<React.ComponentProps<typeof ImageGenerator>>) {
  const defaultProps = {
    contentItemId: 'item-123',
    onImageGenerated: vi.fn(),
    ...props,
  };

  return render(
    createElement(createWrapper(), null, createElement(ImageGenerator, defaultProps)),
  );
}

describe('ImageGenerator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders prompt textarea and generate button', () => {
    renderComponent();

    expect(screen.getByLabelText('Image Prompt')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Describe the image you want to generate...')).toBeInTheDocument();
    expect(screen.getByText('Generate')).toBeInTheDocument();
    expect(screen.getByText('0 / 1000')).toBeInTheDocument();
  });

  it('updates character counter as user types', () => {
    renderComponent();

    const textarea = screen.getByPlaceholderText('Describe the image you want to generate...');
    fireEvent.change(textarea, { target: { value: 'A beautiful sunset' } });

    expect(screen.getByText('18 / 1000')).toBeInTheDocument();
  });

  it('disables generate button when prompt is empty', () => {
    renderComponent();

    const button = screen.getByText('Generate');
    expect(button).toBeDisabled();
  });

  it('enables generate button when prompt has text', () => {
    renderComponent();

    const textarea = screen.getByPlaceholderText('Describe the image you want to generate...');
    fireEvent.change(textarea, { target: { value: 'A mountain landscape' } });

    const button = screen.getByText('Generate');
    expect(button).not.toBeDisabled();
  });

  it('calls API when Generate is clicked', async () => {
    mockApiPost.mockResolvedValue({ data: { imageUrl: 'https://r2.example.com/image.webp' } });

    renderComponent();

    const textarea = screen.getByPlaceholderText('Describe the image you want to generate...');
    fireEvent.change(textarea, { target: { value: 'A cat wearing a hat' } });
    fireEvent.click(screen.getByText('Generate'));

    await waitFor(() => {
      expect(mockApiPost).toHaveBeenCalledWith(
        '/api/content-items/item-123/generate-image',
        { prompt: 'A cat wearing a hat' },
      );
    });
  });

  it('shows loading state while generating', async () => {
    let resolvePost: (value: unknown) => void;
    mockApiPost.mockImplementation(() => new Promise((resolve) => { resolvePost = resolve; }));

    renderComponent();

    const textarea = screen.getByPlaceholderText('Describe the image you want to generate...');
    fireEvent.change(textarea, { target: { value: 'Test prompt' } });
    fireEvent.click(screen.getByText('Generate'));

    await waitFor(() => {
      expect(screen.getByText('Generating...')).toBeInTheDocument();
    });

    // Cleanup
    resolvePost!({ data: { imageUrl: 'https://example.com/img.webp' } });
  });

  it('displays generated image preview after successful generation', async () => {
    mockApiPost.mockResolvedValue({ data: { imageUrl: 'https://r2.example.com/generated.webp' } });

    renderComponent();

    const textarea = screen.getByPlaceholderText('Describe the image you want to generate...');
    fireEvent.change(textarea, { target: { value: 'A sunset over ocean' } });
    fireEvent.click(screen.getByText('Generate'));

    await waitFor(() => {
      expect(screen.getByAltText('Generated preview')).toBeInTheDocument();
    });

    const img = screen.getByAltText('Generated preview') as HTMLImageElement;
    expect(img.src).toBe('https://r2.example.com/generated.webp');

    expect(screen.getByText('Accept')).toBeInTheDocument();
    expect(screen.getByText('Regenerate')).toBeInTheDocument();
  });

  it('calls onImageGenerated when Accept is clicked', async () => {
    mockApiPost.mockResolvedValue({ data: { imageUrl: 'https://r2.example.com/img.webp' } });

    const onImageGenerated = vi.fn();
    renderComponent({ onImageGenerated });

    const textarea = screen.getByPlaceholderText('Describe the image you want to generate...');
    fireEvent.change(textarea, { target: { value: 'A test image' } });
    fireEvent.click(screen.getByText('Generate'));

    await waitFor(() => {
      expect(screen.getByText('Accept')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Accept'));

    expect(onImageGenerated).toHaveBeenCalledWith('https://r2.example.com/img.webp');
  });

  it('shows quota exceeded message on 429 error', async () => {
    mockApiPost.mockRejectedValue({ code: 'QUOTA_EXCEEDED', message: 'Not enough credits. Upgrade your plan for more.' });

    renderComponent();

    const textarea = screen.getByPlaceholderText('Describe the image you want to generate...');
    fireEvent.change(textarea, { target: { value: 'Test prompt' } });
    fireEvent.click(screen.getByText('Generate'));

    await waitFor(() => {
      expect(screen.getByText(/Not enough credits/)).toBeInTheDocument();
    });
  });

  it('shows error toast on non-quota error', async () => {
    const { toast } = await import('sonner');
    mockApiPost.mockRejectedValue({ code: 'EXTERNAL_API_ERROR', message: 'Service unavailable' });

    renderComponent();

    const textarea = screen.getByPlaceholderText('Describe the image you want to generate...');
    fireEvent.change(textarea, { target: { value: 'Test prompt' } });
    fireEvent.click(screen.getByText('Generate'));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Service unavailable');
    });
  });

  it('disables textarea and button when disabled prop is true', () => {
    renderComponent({ disabled: true });

    const textarea = screen.getByPlaceholderText('Describe the image you want to generate...');
    expect(textarea).toBeDisabled();

    // Generate button should be disabled too (both from disabled prop and empty prompt)
    expect(screen.getByText('Generate')).toBeDisabled();
  });

  it('calls API again when Regenerate is clicked', async () => {
    mockApiPost.mockResolvedValue({ data: { imageUrl: 'https://r2.example.com/first.webp' } });

    renderComponent();

    const textarea = screen.getByPlaceholderText('Describe the image you want to generate...');
    fireEvent.change(textarea, { target: { value: 'A mountain scene' } });
    fireEvent.click(screen.getByText('Generate'));

    await waitFor(() => {
      expect(screen.getByText('Regenerate')).toBeInTheDocument();
    });

    // Click regenerate — should call API again
    mockApiPost.mockResolvedValue({ data: { imageUrl: 'https://r2.example.com/second.webp' } });
    fireEvent.click(screen.getByText('Regenerate'));

    await waitFor(() => {
      expect(mockApiPost).toHaveBeenCalledTimes(2);
    });
  });

  it('shows red counter at max length', () => {
    renderComponent();

    const textarea = screen.getByPlaceholderText('Describe the image you want to generate...');
    fireEvent.change(textarea, { target: { value: 'x'.repeat(1000) } });

    const counter = screen.getByText('1000 / 1000');
    expect(counter).toHaveClass('text-red-500');
  });
});
