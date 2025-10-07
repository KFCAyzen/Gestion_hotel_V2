// Advanced data caching with compression and smart eviction
interface CacheEntry<T> {
    data: T;
    timestamp: number;
    ttl: number;
    accessCount: number;
    lastAccess: number;
    compressed?: boolean;
}

class DataCache {
    private cache = new Map<string, CacheEntry<any>>();
    private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
    private readonly MAX_CACHE_SIZE = 100; // Max entries
    private readonly COMPRESSION_THRESHOLD = 1000; // Compress if JSON > 1KB

    private compress(data: any): string {
        const json = JSON.stringify(data);
        if (json.length < this.COMPRESSION_THRESHOLD) return json;
        
        // Simple compression using repeated pattern replacement
        return json
            .replace(/"id":/g, '"i":')
            .replace(/"name":/g, '"n":')
            .replace(/"status":/g, '"s":')
            .replace(/"date":/g, '"d":')
            .replace(/"amount":/g, '"a":');
    }

    private decompress(compressed: string): any {
        const json = compressed
            .replace(/"i":/g, '"id":')
            .replace(/"n":/g, '"name":')
            .replace(/"s":/g, '"status":')
            .replace(/"d":/g, '"date":')
            .replace(/"a":/g, '"amount":');
        return JSON.parse(json);
    }

    set<T>(key: string, data: T, ttl = this.DEFAULT_TTL): void {
        // Evict old entries if cache is full
        if (this.cache.size >= this.MAX_CACHE_SIZE) {
            this.evictLeastUsed();
        }

        const json = JSON.stringify(data);
        const shouldCompress = json.length > this.COMPRESSION_THRESHOLD;
        
        this.cache.set(key, {
            data: shouldCompress ? this.compress(data) : data,
            timestamp: Date.now(),
            ttl,
            accessCount: 0,
            lastAccess: Date.now(),
            compressed: shouldCompress
        });
    }

    get<T>(key: string): T | null {
        const entry = this.cache.get(key);
        if (!entry) return null;

        if (Date.now() - entry.timestamp > entry.ttl) {
            this.cache.delete(key);
            return null;
        }

        // Update access statistics
        entry.accessCount++;
        entry.lastAccess = Date.now();

        return entry.compressed ? this.decompress(entry.data as string) : entry.data;
    }

    private evictLeastUsed(): void {
        let leastUsedKey = '';
        let leastUsedScore = Infinity;
        
        for (const [key, entry] of this.cache.entries()) {
            // Score based on access frequency and recency
            const score = entry.accessCount / (Date.now() - entry.lastAccess + 1);
            if (score < leastUsedScore) {
                leastUsedScore = score;
                leastUsedKey = key;
            }
        }
        
        if (leastUsedKey) {
            this.cache.delete(leastUsedKey);
        }
    }

    invalidate(key: string): void {
        this.cache.delete(key);
    }

    clear(): void {
        this.cache.clear();
    }

    // Memory cleanup
    cleanup(): void {
        const now = Date.now();
        for (const [key, entry] of this.cache.entries()) {
            if (now - entry.timestamp > entry.ttl) {
                this.cache.delete(key);
            }
        }
    }
}

export const dataCache = new DataCache();

// Auto cleanup every 10 minutes
setInterval(() => dataCache.cleanup(), 10 * 60 * 1000);