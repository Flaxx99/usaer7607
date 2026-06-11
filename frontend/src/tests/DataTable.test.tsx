import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DataTable } from '../components/DataTable';
import type { ColumnDef } from '@tanstack/react-table';

interface TestItem {
  id: number;
  name: string;
  email: string;
}

const columns: ColumnDef<TestItem, unknown>[] = [
  { header: 'ID', accessorKey: 'id' },
  { header: 'Nombre', accessorKey: 'name' },
  { header: 'Email', accessorKey: 'email' },
];

const sampleData: TestItem[] = [
  { id: 1, name: 'Juan Pérez', email: 'juan@example.com' },
  { id: 2, name: 'María García', email: 'maria@example.com' },
  { id: 3, name: 'Carlos López', email: 'carlos@example.com' },
];

describe('DataTable', () => {
  it('renders table headers from columns', () => {
    render(<DataTable data={sampleData} columns={columns} />);
    // Headers render in BOTH mobile (as label spans) and desktop (as <th>) in JSDOM
    expect(screen.getAllByText('ID').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Nombre').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Email').length).toBeGreaterThan(0);
  });

  it('renders data rows', () => {
    render(<DataTable data={sampleData} columns={columns} />);
    // Data renders in BOTH mobile cards and desktop table cells in JSDOM
    expect(screen.getAllByText('Juan Pérez').length).toBeGreaterThan(0);
    expect(screen.getAllByText('María García').length).toBeGreaterThan(0);
    expect(screen.getAllByText('carlos@example.com').length).toBeGreaterThan(0);
  });

  it('shows TableSkeleton when isLoading is true', () => {
    const { container } = render(<DataTable data={[]} columns={columns} isLoading={true} />);
    // TableSkeleton renders DaisyUI skeleton class
    const skeleton = container.querySelector('.skeleton');
    expect(skeleton).toBeInTheDocument();
    // Should NOT render actual table
    expect(screen.queryByText('ID')).not.toBeInTheDocument();
  });

  it('shows search bar when onSearchChange is provided', () => {
    const onSearchChange = vi.fn();
    render(
      <DataTable
        data={sampleData}
        columns={columns}
        onSearchChange={onSearchChange}
        searchValue=""
      />
    );
    expect(screen.getByPlaceholderText('Buscar...')).toBeInTheDocument();
  });

  it('does not show search bar when onSearchChange is not provided', () => {
    render(<DataTable data={sampleData} columns={columns} />);
    expect(screen.queryByPlaceholderText('Buscar...')).not.toBeInTheDocument();
  });

  it('renders custom placeholder in search bar', () => {
    render(
      <DataTable
        data={sampleData}
        columns={columns}
        onSearchChange={vi.fn()}
        searchValue=""
        placeholder="Filtrar usuarios..."
      />
    );
    expect(screen.getByPlaceholderText('Filtrar usuarios...')).toBeInTheDocument();
  });

  it('shows pagination when totalCount and onPageChange are provided', () => {
    render(
      <DataTable
        data={sampleData}
        columns={columns}
        totalCount={30}
        page={1}
        onPageChange={vi.fn()}
      />
    );
    expect(screen.getByLabelText('Página anterior')).toBeInTheDocument();
    expect(screen.getByLabelText('Página siguiente')).toBeInTheDocument();
    expect(screen.getByText('1 / 3')).toBeInTheDocument();
  });

  it('does not show pagination when totalCount is not provided', () => {
    render(
      <DataTable
        data={sampleData}
        columns={columns}
        onPageChange={vi.fn()}
      />
    );
    expect(screen.queryByLabelText('Página anterior')).not.toBeInTheDocument();
  });

  it('does not show pagination when onPageChange is not provided', () => {
    render(
      <DataTable
        data={sampleData}
        columns={columns}
        totalCount={30}
      />
    );
    expect(screen.queryByLabelText('Página anterior')).not.toBeInTheDocument();
  });

  it('disables previous button on page 1', () => {
    render(
      <DataTable
        data={sampleData}
        columns={columns}
        totalCount={30}
        page={1}
        onPageChange={vi.fn()}
      />
    );
    expect(screen.getByLabelText('Página anterior')).toBeDisabled();
    expect(screen.getByLabelText('Página siguiente')).not.toBeDisabled();
  });

  it('disables next button on last page', () => {
    render(
      <DataTable
        data={sampleData}
        columns={columns}
        totalCount={30}
        page={3}
        onPageChange={vi.fn()}
      />
    );
    expect(screen.getByLabelText('Página anterior')).not.toBeDisabled();
    expect(screen.getByLabelText('Página siguiente')).toBeDisabled();
  });

  it('calls onPageChange when pagination buttons are clicked', () => {
    const onPageChange = vi.fn();
    render(
      <DataTable
        data={sampleData}
        columns={columns}
        totalCount={30}
        page={2}
        onPageChange={onPageChange}
      />
    );
    fireEvent.click(screen.getByLabelText('Página anterior'));
    expect(onPageChange).toHaveBeenCalledWith(1);

    fireEvent.click(screen.getByLabelText('Página siguiente'));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it('renders custom empty message when data is empty', () => {
    render(
      <DataTable
        data={[]}
        columns={columns}
        emptyMessage="No hay usuarios disponibles."
      />
    );
    // Empty message renders in BOTH mobile and desktop views in JSDOM
    const messages = screen.getAllByText('No hay usuarios disponibles.');
    expect(messages.length).toBeGreaterThan(0);
    expect(messages.length).toBe(2); // one in mobile, one in desktop
  });

  it('renders default empty message when data is empty', () => {
    render(<DataTable data={[]} columns={columns} />);
    const messages = screen.getAllByText('No se encontraron resultados.');
    expect(messages.length).toBeGreaterThan(0);
    expect(messages.length).toBe(2); // one in mobile, one in desktop
  });

  it('has aria-live="polite" on wrapper', () => {
    const { container } = render(<DataTable data={sampleData} columns={columns} />);
    const wrapper = container.querySelector('[aria-live="polite"]');
    expect(wrapper).toBeInTheDocument();
  });

  it('has scope="col" on all th elements', () => {
    const { container } = render(<DataTable data={sampleData} columns={columns} />);
    const headers = container.querySelectorAll('th');
    headers.forEach(th => {
      expect(th).toHaveAttribute('scope', 'col');
    });
  });
});
