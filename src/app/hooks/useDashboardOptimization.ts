"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { dataCache } from '../utils/dataCache';

interface OptimizationOptions {
    enableVirtualization?: boolean;
    enableLazyLoading?: boolean;
    cacheTimeout?: number;
    debounceDelay?: number;
}

export function useDashboardOptimization(options: OptimizationOptions = {}) {
    const {
        enableVirtualization = true,
        enableLazyLoading = true,
        cacheTimeout = 2 * 60 * 1000, // 2 minutes
        debounceDelay = 500
    } = options;

    const [isOptimizing, setIsOptimizing] = useState(false);
    const [performanceMetrics, setPerformanceMetrics] = useState({
        loadTime: 0,
        cacheHitRate: 0,
        memoryUsage: 0
    });

    const debounceTimerRef = useRef<NodeJS.Timeout | undefined>(undefined);
    const performanceStartRef = useRef<number>(0);
    const cacheHitsRef = useRef(0);
    const cacheMissesRef = useRef(0);

    // Fonction de debounce pour les mises à jour
    const debounce = useCallback((func: Function, delay: number) => {
        return (...args: any[]) => {
            clearTimeout(debounceTimerRef.current);
            debounceTimerRef.current = setTimeout(() => func.apply(null, args), delay);
        };
    }, []);

    // Mesure des performances
    const startPerformanceMeasure = useCallback(() => {
        performanceStartRef.current = performance.now();
        setIsOptimizing(true);
    }, []);

    const endPerformanceMeasure = useCallback(() => {
        const loadTime = performance.now() - performanceStartRef.current;
        const cacheHitRate = cacheHitsRef.current / (cacheHitsRef.current + cacheMissesRef.current) * 100;
        
        setPerformanceMetrics({
            loadTime: Math.round(loadTime),
            cacheHitRate: Math.round(cacheHitRate),
            memoryUsage: Math.round((performance as any).memory?.usedJSHeapSize / 1024 / 1024) || 0
        });
        
        setIsOptimizing(false);
    }, []);

    // Cache optimisé avec métriques
    const optimizedCacheGet = useCallback(<T>(key: string): T | null => {
        const result = dataCache.get<T>(key);
        if (result) {
            cacheHitsRef.current++;
        } else {
            cacheMissesRef.current++;
        }
        return result;
    }, []);

    const optimizedCacheSet = useCallback(<T>(key: string, data: T, ttl = cacheTimeout): void => {
        dataCache.set(key, data, ttl);
    }, [cacheTimeout]);

    // Fonction de chargement lazy
    const lazyLoad = useCallback(async <T>(
        loadFunction: () => Promise<T>,
        cacheKey: string,
        dependencies: any[] = []
    ): Promise<T> => {
        if (!enableLazyLoading) {
            return await loadFunction();
        }

        // Vérifier le cache d'abord
        const cached = optimizedCacheGet<T>(cacheKey);
        if (cached) {
            return cached;
        }

        // Charger et mettre en cache
        const result = await loadFunction();
        optimizedCacheSet(cacheKey, result);
        return result;
    }, [enableLazyLoading, optimizedCacheGet, optimizedCacheSet]);

    // Fonction de virtualisation pour les listes
    const virtualizeList = useCallback(<T>(
        items: T[],
        visibleCount: number = 10,
        startIndex: number = 0
    ): T[] => {
        if (!enableVirtualization || items.length <= visibleCount) {
            return items;
        }
        
        return items.slice(startIndex, startIndex + visibleCount);
    }, [enableVirtualization]);

    // Nettoyage automatique du cache
    useEffect(() => {
        const cleanup = setInterval(() => {
            dataCache.cleanup();
        }, 5 * 60 * 1000); // Toutes les 5 minutes

        return () => clearInterval(cleanup);
    }, []);

    // Fonction de chargement optimisé avec retry
    const optimizedLoad = useCallback(async <T>(
        loadFunction: () => Promise<T>,
        retries: number = 3,
        delay: number = 1000
    ): Promise<T> => {
        let lastError: Error;
        
        for (let i = 0; i < retries; i++) {
            try {
                return await loadFunction();
            } catch (error) {
                lastError = error as Error;
                if (i < retries - 1) {
                    await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
                }
            }
        }
        
        throw lastError!;
    }, []);

    // Fonction de préchargement
    const preload = useCallback(async (
        preloadFunctions: Array<{ key: string; loader: () => Promise<any> }>
    ) => {
        const promises = preloadFunctions.map(async ({ key, loader }) => {
            try {
                const result = await loader();
                optimizedCacheSet(key, result);
                return { key, success: true };
            } catch (error) {
                console.warn(`Preload failed for ${key}:`, error);
                return { key, success: false, error };
            }
        });

        return await Promise.allSettled(promises);
    }, [optimizedCacheSet]);

    return {
        isOptimizing,
        performanceMetrics,
        startPerformanceMeasure,
        endPerformanceMeasure,
        optimizedCacheGet,
        optimizedCacheSet,
        lazyLoad,
        virtualizeList,
        optimizedLoad,
        preload,
        debounce: (func: Function) => debounce(func, debounceDelay)
    };
}