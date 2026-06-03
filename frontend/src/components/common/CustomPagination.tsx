interface PaginationProps {
    total: number;
    pageSize: number;
    currentPage: number;
    onPageChange: (page: number) => void;
}

const CustomPagination = ({ total, pageSize, currentPage, onPageChange }: PaginationProps) => {
    const totalPages = Math.ceil(total / pageSize);

    if (totalPages <= 1) return null;

    const getVisiblePages = () => {
        const pages: (number | 'ellipsis')[] = [];
        const range = 2;
        
        pages.push(1);
        
        if (currentPage - range > 2) {
            pages.push('ellipsis');
        }
        
        for (let i = Math.max(2, currentPage - range); i <= Math.min(totalPages - 1, currentPage + range); i++) {
            pages.push(i);
        }
        
        if (currentPage + range < totalPages - 1) {
            pages.push('ellipsis');
        }
        
        if (totalPages > 1) {
            pages.push(totalPages);
        }
        
        return pages;
    };

    return (
        <div className="flex items-center justify-center gap-4 mt-6">
            <div className="join">
                <button
                    className="join-item btn btn-sm"
                    disabled={currentPage === 1}
                    onClick={() => onPageChange(currentPage - 1)}
                >
                    &laquo;
                </button>
                {getVisiblePages().map((page, idx) =>
                    page === 'ellipsis' ? (
                        <button key={`ellipsis-${idx}`} className="join-item btn btn-sm btn-disabled">
                            &hellip;
                        </button>
                    ) : (
                        <button
                            key={page}
                            className={`join-item btn btn-sm ${page === currentPage ? 'btn-active btn-primary' : ''}`}
                            onClick={() => onPageChange(page)}
                        >
                            {page}
                        </button>
                    )
                )}
                <button
                    className="join-item btn btn-sm"
                    disabled={currentPage === totalPages}
                    onClick={() => onPageChange(currentPage + 1)}
                >
                    &raquo;
                </button>
            </div>
            <span className="text-sm text-base-content/60">
                Total: {total} registros
            </span>
        </div>
    );
};

export default CustomPagination;
