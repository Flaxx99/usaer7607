import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { PageSkeleton, CardGridSkeleton, TableSkeleton } from '../components/Skeletons';

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <>
      {ui}
    </>
  );
};

describe('Skeletons', () => {
  it('PageSkeleton should render', () => {
    const { container } = renderWithProviders(<PageSkeleton />);
    expect(container).toBeInTheDocument();
  });

  it('CardGridSkeleton should render', () => {
    const { container } = renderWithProviders(<CardGridSkeleton />);
    expect(container).toBeInTheDocument();
  });

  it('TableSkeleton should render', () => {
    const { container } = renderWithProviders(<TableSkeleton />);
    expect(container).toBeInTheDocument();
  });
});
