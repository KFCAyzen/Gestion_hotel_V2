import { useState, useMemo } from 'react';

interface UsePaginationProps<T> {
    data: T[];
    itemsPerPage?: number;
}

export function usePagination<T>({ data, itemsPerPage = 20 }: UsePaginationProps<T>) {
    const [currentPage, setCurrentPage] = useState(1);

    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return data.slice(startIndex, startIndex + itemsPerPage);
    }, [data, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(data.length / itemsPerPage);

    return {
        currentPage,
        setCurrentPage,
        paginatedData,
        totalPages,
        totalItems: data.length,
        hasNext: currentPage < totalPages,
        hasPrev: currentPage > 1
    };
}