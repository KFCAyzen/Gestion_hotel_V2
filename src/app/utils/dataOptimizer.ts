// Optimisation des données avec limitation et indexation
export class DataOptimizer {
    private static readonly MAX_ITEMS = 1000;
    private static readonly CACHE_SIZE = 100;

    static limitData<T>(data: T[]): T[] {
        return data.slice(0, this.MAX_ITEMS);
    }

    static createIndex<T>(data: T[], keyFn: (item: T) => string): Map<string, T> {
        const index = new Map<string, T>();
        data.slice(0, this.CACHE_SIZE).forEach(item => {
            index.set(keyFn(item), item);
        });
        return index;
    }

    static searchOptimized<T>(
        data: T[], 
        searchTerm: string, 
        searchFields: (keyof T)[]
    ): T[] {
        if (!searchTerm.trim()) return data.slice(0, 50);
        
        const term = searchTerm.toLowerCase();
        const results: T[] = [];
        
        for (let i = 0; i < data.length && results.length < 50; i++) {
            const item = data[i];
            const matches = searchFields.some(field => {
                const value = item[field];
                return typeof value === 'string' && value.toLowerCase().includes(term);
            });
            
            if (matches) results.push(item);
        }
        
        return results;
    }

    static sortOptimized<T>(data: T[], sortFn: (a: T, b: T) => number): T[] {
        return data.slice(0, 200).sort(sortFn);
    }
}