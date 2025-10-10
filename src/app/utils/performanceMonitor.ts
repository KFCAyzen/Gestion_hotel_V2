class PerformanceMonitor {
    private metrics = new Map<string, number[]>();
    private readonly MAX_SAMPLES = 100;

    measure<T>(operation: string, fn: () => T): T {
        const start = performance.now();
        const result = fn();
        const duration = performance.now() - start;
        
        this.recordMetric(operation, duration);
        
        if (duration > 100) {
            console.warn(`Slow operation: ${operation} took ${duration.toFixed(2)}ms`);
        }
        
        return result;
    }

    async measureAsync<T>(operation: string, fn: () => Promise<T>): Promise<T> {
        const start = performance.now();
        const result = await fn();
        const duration = performance.now() - start;
        
        this.recordMetric(operation, duration);
        
        if (duration > 500) {
            console.warn(`Slow async operation: ${operation} took ${duration.toFixed(2)}ms`);
        }
        
        return result;
    }

    private recordMetric(operation: string, duration: number): void {
        if (!this.metrics.has(operation)) {
            this.metrics.set(operation, []);
        }
        
        const samples = this.metrics.get(operation)!;
        samples.push(duration);
        
        if (samples.length > this.MAX_SAMPLES) {
            samples.shift();
        }
    }

    getStats(operation: string) {
        const samples = this.metrics.get(operation) || [];
        if (samples.length === 0) return null;
        
        const sorted = [...samples].sort((a, b) => a - b);
        const avg = samples.reduce((a, b) => a + b, 0) / samples.length;
        const p50 = sorted[Math.floor(sorted.length * 0.5)];
        const p95 = sorted[Math.floor(sorted.length * 0.95)];
        const p99 = sorted[Math.floor(sorted.length * 0.99)];
        
        return { avg, p50, p95, p99, samples: samples.length };
    }

    getAllStats() {
        const stats: Record<string, any> = {};
        for (const operation of this.metrics.keys()) {
            stats[operation] = this.getStats(operation);
        }
        return stats;
    }

    // Memory usage monitoring
    getMemoryUsage() {
        if ('memory' in performance) {
            const memory = (performance as any).memory;
            return {
                used: Math.round(memory.usedJSHeapSize / 1024 / 1024),
                total: Math.round(memory.totalJSHeapSize / 1024 / 1024),
                limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024)
            };
        }
        return null;
    }
}

export const performanceMonitor = new PerformanceMonitor();

// Auto-report performance stats every 30 seconds in development
if (process.env.NODE_ENV === 'development') {
    setInterval(() => {
        const stats = performanceMonitor.getAllStats();
        const memory = performanceMonitor.getMemoryUsage();
        
        if (Object.keys(stats).length > 0) {
            console.group('Performance Stats');
            console.table(stats);
            if (memory) {
                console.log('Memory Usage:', memory);
            }
            console.groupEnd();
        }
    }, 30000);
}