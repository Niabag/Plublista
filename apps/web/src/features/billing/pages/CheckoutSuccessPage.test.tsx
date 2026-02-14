import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CheckoutSuccessPage } from './CheckoutSuccessPage';

function renderSuccessPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });

  const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

  const result = render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <CheckoutSuccessPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );

  return { ...result, invalidateSpy };
}

describe('CheckoutSuccessPage', () => {
  it('renders success message', () => {
    renderSuccessPage();

    expect(screen.getByText('Welcome to your new plan!')).toBeInTheDocument();
    expect(screen.getByText(/7-day free trial has started/)).toBeInTheDocument();
  });

  it('renders dashboard link', () => {
    renderSuccessPage();

    const link = screen.getByText('Go to Dashboard').closest('a');
    expect(link).toHaveAttribute('href', '/dashboard');
  });

  it('invalidates session query on mount', () => {
    const { invalidateSpy } = renderSuccessPage();

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['auth', 'session'],
    });
  });
});
