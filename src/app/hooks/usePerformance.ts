import { useEffect, useRef } from 'react';

export function usePerformance(componentName: string) {
    const renderStart = useRef<number>(0);

    useEffect(() => {
        renderStart.current = performance.now();
    });

    useEffect(() => {
        const renderTime = performance.now() - renderStart.current;
        if (renderTime > 16) { // More than one frame (60fps)
            console.warn(`${componentName} render took ${renderTime.toFixed(2)}ms`);
        }
    });

    const measureAsync = async <T>(operation: () => Promise<T>, operationName: string): Promise<T> => {
        const start = performance.now();
        try {
            const result = await operation();
            const duration = performance.now() - start;
            if (duration > 100) {
                console.warn(`${componentName}.${operationName} took ${duration.toFixed(2)}ms`);
            }
            return result;
        } catch (error) {
            console.error(`${componentName}.${operationName} failed:`, error);
            throw error;
        }
    };

    return { measureAsync };
}