import { 
    useReactTable, 
    getCoreRowModel, 
    flexRender, 
    getPaginationRowModel,
    getFilteredRowModel,
    getSortedRowModel,
} from '@tanstack/react-table';
import type { ColumnDef } from '@tanstack/react-table';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { TableSkeleton } from './Skeletons';

interface DataTableProps<TData> {
    data: TData[];
    columns: ColumnDef<TData, any>[];
    isLoading?: boolean;
    totalCount?: number;
    page?: number;
    onPageChange?: (page: number) => void;
    onSearchChange?: (value: string) => void;
    searchValue?: string;
    placeholder?: string;
    emptyMessage?: string;
}

export function DataTable<TData>({
    data,
    columns,
    isLoading = false,
    totalCount,
    page = 1,
    onPageChange,
    onSearchChange,
    searchValue,
    placeholder = 'Buscar...',
    emptyMessage = 'No se encontraron resultados.'
}: DataTableProps<TData>) {
    
    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(),
    });

    if (isLoading) {
        return <TableSkeleton rows={10} />;
    }

    return (
        <div className="space-y-4">
            {onSearchChange && (
                <div className="relative max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" size={18} />
                    <input 
                        type="text" 
                        placeholder={placeholder} 
                        className="input input-bordered pl-10 w-full" 
                        value={searchValue} 
                        onChange={(e) => onSearchChange?.(e.target.value)} 
                    />
                </div>
            )}

            <div className="card bg-base-100 shadow-sm border border-base-300 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="table table-md table-zebra w-full">
                        <thead className="bg-base-200">
                            {table.getHeaderGroups().map(headerGroup => (
                                <tr key={headerGroup.id} className="text-xs uppercase opacity-60">
                                    {headerGroup.headers.map(header => (
                                        <th key={header.id} className="text-left">
                                            {flexRender(header.column.columnDef.header, header.getContext())}
                                        </th>
                                    ))}
                                </tr>
                            ))}
                        </thead>
                        <tbody>
                            {table.getRowModel().rows.length > 0 ? (
                                table.getRowModel().rows.map(row => (
                                    <tr key={row.id} className="hover">
                                        {row.getVisibleCells().map(cell => (
                                            <td key={cell.id} className="text-sm">
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={columns.length} className="text-center py-12 opacity-50 italic">
                                        {emptyMessage}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                
                {totalCount && onPageChange && (
                    <div className="flex justify-center p-4 border-t border-base-200">
                        <div className="join">
                            <button 
                                className="join-item btn btn-sm" 
                                disabled={page === 1} 
                                onClick={() => onPageChange?.(page - 1)}
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <button className="join-item btn btn-sm no-animation">
                                {page} / {Math.ceil(totalCount / 10)}
                            </button>
                            <button 
                                className="join-item btn btn-sm" 
                                disabled={page >= Math.ceil(totalCount / 10)} 
                                onClick={() => onPageChange?.(page + 1)}
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
