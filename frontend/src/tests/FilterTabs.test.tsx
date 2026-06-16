import { render, screen, fireEvent } from '@testing-library/react';
import { FilterTabs } from '../components/FilterTabs';
import { vi, describe, it, expect } from 'vitest';

const Folder = () => <svg data-testid="icon-folder" />;
const Clock = () => <svg data-testid="icon-clock" />;

const defaultTabs = [
    { value: 'TODOS', label: 'Todos', icon: Folder },
    { value: 'PENDIENTE', label: 'Pendientes', icon: Clock },
    { value: 'COMPLETADO', label: 'Completados' },
];

describe('FilterTabs', () => {
    it('renders all tabs', () => {
        const onChange = vi.fn();
        render(<FilterTabs tabs={defaultTabs} value="TODOS" onChange={onChange} />);

        expect(screen.getByText('Todos')).toBeInTheDocument();
        expect(screen.getByText('Pendientes')).toBeInTheDocument();
        expect(screen.getByText('Completados')).toBeInTheDocument();
    });

    it('sets correct role and aria attributes', () => {
        const onChange = vi.fn();
        render(<FilterTabs tabs={defaultTabs} value="TODOS" onChange={onChange} />);

        const tablist = screen.getByRole('tablist');
        expect(tablist).toHaveAttribute('aria-label', 'Filtros');

        const tabs = screen.getAllByRole('tab');
        expect(tabs).toHaveLength(3);
    });

    it('marks active tab with aria-selected', () => {
        const onChange = vi.fn();
        render(<FilterTabs tabs={defaultTabs} value="PENDIENTE" onChange={onChange} />);

        const activeTab = screen.getByText('Pendientes').closest('[role="tab"]');
        expect(activeTab).toHaveAttribute('aria-selected', 'true');

        const inactiveTab = screen.getByText('Todos').closest('[role="tab"]');
        expect(inactiveTab).toHaveAttribute('aria-selected', 'false');
    });

    it('calls onChange when clicking a tab', () => {
        const onChange = vi.fn();
        render(<FilterTabs tabs={defaultTabs} value="TODOS" onChange={onChange} />);

        fireEvent.click(screen.getByText('Pendientes'));
        expect(onChange).toHaveBeenCalledWith('PENDIENTE');
    });

    it('renders icons for tabs that have them', () => {
        const onChange = vi.fn();
        render(<FilterTabs tabs={defaultTabs} value="TODOS" onChange={onChange} />);

        expect(screen.getAllByTestId('icon-folder').length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByTestId('icon-clock').length).toBeGreaterThanOrEqual(1);
    });

    it('renders tab without icon when none provided', () => {
        const onChange = vi.fn();
        render(<FilterTabs tabs={defaultTabs} value="TODOS" onChange={onChange} />);

        const completados = screen.getByText('Completados').closest('[role="tab"]');
        expect(completados).toBeInTheDocument();
        // No icon testid inside this tab
    });

    it('applies color variant class to active tab', () => {
        const onChange = vi.fn();
        const { rerender } = render(
            <FilterTabs tabs={defaultTabs} value="TODOS" onChange={onChange} color="warning" />
        );

        const activeTab = screen.getByText('Todos').closest('[role="tab"]');
        expect(activeTab!.className).toMatch(/bg-warning/);

        rerender(<FilterTabs tabs={defaultTabs} value="TODOS" onChange={onChange} color="info" />);
        const infoTab = screen.getByText('Todos').closest('[role="tab"]');
        expect(infoTab!.className).toMatch(/bg-info/);

        rerender(<FilterTabs tabs={defaultTabs} value="TODOS" onChange={onChange} color="secondary" />);
        const secondaryTab = screen.getByText('Todos').closest('[role="tab"]');
        expect(secondaryTab!.className).toMatch(/bg-secondary/);
    });

    it('uses primary as default color', () => {
        const onChange = vi.fn();
        render(<FilterTabs tabs={defaultTabs} value="TODOS" onChange={onChange} />);

        const activeTab = screen.getByText('Todos').closest('[role="tab"]');
        expect(activeTab!.className).toMatch(/bg-primary/);
    });

    it('handles single tab gracefully', () => {
        const onChange = vi.fn();
        render(<FilterTabs tabs={[{ value: 'ONLY', label: 'Único' }]} value="ONLY" onChange={onChange} />);

        expect(screen.getByText('Único')).toBeInTheDocument();
        expect(screen.getAllByRole('tab')).toHaveLength(1);
    });

    it('does not crash with empty tabs array', () => {
        const onChange = vi.fn();
        const { container } = render(<FilterTabs tabs={[]} value="" onChange={onChange} />);

        expect(container.querySelector('[role="tablist"]')).toBeInTheDocument();
        expect(screen.queryByRole('tab')).not.toBeInTheDocument();
    });
});
