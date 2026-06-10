import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ErrorBoundary } from '../components/ErrorBoundary';

vi.spyOn(console, 'error').mockImplementation(() => {});

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <>
      {ui}
    </>
  );
};

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render children normally when no error', () => {
    renderWithProviders(
      <ErrorBoundary>
        <div>Normal Content</div>
      </ErrorBoundary>
    );
    expect(screen.getByText('Normal Content')).toBeInTheDocument();
  });

  it('should not show error UI when no error occurs', () => {
    renderWithProviders(
      <ErrorBoundary>
        <div>Normal Content</div>
      </ErrorBoundary>
    );
    expect(screen.queryByText(/Algo salió mal/i)).not.toBeInTheDocument();
  });
});
