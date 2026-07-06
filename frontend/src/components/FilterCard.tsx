import { Filter } from 'lucide-react';
import { SearchBar } from './SearchBar';
import { FilterTabs } from './FilterTabs';
import type { FilterTab } from './FilterTabs';

interface FilterCardProps {
    searchValue: string;
    onSearchChange: (value: string) => void;
    searchPlaceholder?: string;
    searchLabel?: string;
    filterValue?: string;
    onFilterChange?: (value: string) => void;
    filterTabs?: FilterTab[];
    filterLabel?: string;
    filterColor?: 'primary' | 'warning' | 'info' | 'secondary';
    showHeader?: boolean;
}

/**
 * Card-paper wrapper with SearchBar + FilterTabs side by side.
 *
 * Usage:
 * ```tsx
 * <FilterCard
 *   searchValue={busqueda}
 *   onSearchChange={setBusqueda}
 *   searchPlaceholder="Buscar..."
 *   filterValue={filtroEstado}
 *   onFilterChange={setFiltroEstado}
 *   filterTabs={[
 *     { value: 'TODOS', label: 'Todos' },
 *     { value: 'ACTIVO', label: 'Activos' },
 *   ]}
 * />
 * ```
 */
export function FilterCard({
    searchValue,
    onSearchChange,
    searchPlaceholder = 'Buscar...',
    searchLabel = 'Buscar',
    filterValue,
    onFilterChange,
    filterTabs = [],
    filterLabel = 'Filtrar',
    filterColor = 'primary',
    showHeader = true,
}: FilterCardProps) {
    return (
        <div className="card-paper p-6 space-y-6">
            {showHeader && (
                <div className="flex items-center gap-2 text-base-content/60">
                    <Filter size={16} className="text-primary" />
                    <span className="text-xs font-bold uppercase tracking-widest">Filtros</span>
                </div>
            )}
            {filterTabs.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="form-control w-full">
                        <label className="label" htmlFor="filter_select"><span className="label-text font-bold">{filterLabel}</span></label>
                        <FilterTabs
                            tabs={filterTabs}
                            value={filterValue}
                            onChange={onFilterChange}
                            color={filterColor}
                        />
                    </div>
                    <div className="form-control w-full">
                        <label className="label" htmlFor="search_input"><span className="label-text font-bold">{searchLabel}</span></label>
                        <SearchBar value={searchValue} onChange={onSearchChange} placeholder={searchPlaceholder} />
                    </div>
                </div>
            ) : (
                <div className="form-control w-full">
                    <label className="label" htmlFor="search_input"><span className="label-text font-bold">{searchLabel}</span></label>
                    <SearchBar value={searchValue} onChange={onSearchChange} placeholder={searchPlaceholder} />
                </div>
            )}
        </div>
    );
}
