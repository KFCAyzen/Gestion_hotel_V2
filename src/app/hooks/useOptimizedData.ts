import { useState, useEffect, useCallback, useMemo } from 'react';
import { dataCache } from '../utils/dataCache';
import { loadFromFirebase } from '../utils/syncData';

interface UseOptimizedDataOptions {
    pageSize?: number;
    sortBy?: string;
    filterBy?: (item: any) => boolean;
    cacheKey: string;
}

export function useOptimizedData<T>(
    collection: string,
    options: UseOptimizedDataOptions
) {
    const [data, setData] = useState<T[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const { pageSize = 20, sortBy, filterBy, cacheKey } = options;

    const loadData = useCallback(async () => {
        setLoading(true);
        
        // Check cache first
        const cached = dataCache.get<T[]>(cacheKey);
        if (cached) {
            setData(cached);
            setLoading(false);
            return;
        }

        try {
            const result = await loadFromFirebase(collection) as T[];
            dataCache.set(cacheKey, result);
            setData(result);
        } catch (error) {
            console.error(`Error loading ${collection}:`, error);
        } finally {
            setLoading(false);
        }
    }, [collection, cacheKey]);

    const paginatedData = useMemo(() => {
        let filtered = filterBy ? data.filter(filterBy) : data;
        
        if (sortBy) {
            filtered = [...filtered].sort((a, b) => {
                const aVal = a[sortBy as keyof T];
                const bVal = b[sortBy as keyof T];
                return String(aVal).localeCompare(String(bVal));
            });
        }

        const startIndex = (currentPage - 1) * pageSize;
        return filtered.slice(startIndex, startIndex + pageSize);
    }, [data, currentPage, pageSize, sortBy, filterBy]);

    const totalPages = Math.ceil(data.length / pageSize);

    useEffect(() => {
        loadData();
    }, [loadData]);

    return {
        data: paginatedData,
        loading,
        currentPage,
        totalPages,
        setCurrentPage,
        refresh: loadData,
        totalItems: data.length
    };
}