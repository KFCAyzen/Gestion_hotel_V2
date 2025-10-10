interface BatchRequest {
    id: string;
    collection: string;
    resolve: (data: any) => void;
    reject: (error: any) => void;
}

class RequestBatcher {
    private pendingRequests = new Map<string, BatchRequest[]>();
    private batchTimeout: NodeJS.Timeout | null = null;
    private readonly BATCH_DELAY = 50; // 50ms batching window

    async batchedRequest(collection: string, id?: string): Promise<any> {
        const requestKey = `${collection}${id ? `_${id}` : ''}`;
        
        // Check if identical request is already pending
        if (this.pendingRequests.has(requestKey)) {
            return new Promise((resolve, reject) => {
                this.pendingRequests.get(requestKey)!.push({
                    id: id || 'all',
                    collection,
                    resolve,
                    reject
                });
            });
        }

        return new Promise((resolve, reject) => {
            this.pendingRequests.set(requestKey, [{
                id: id || 'all',
                collection,
                resolve,
                reject
            }]);

            if (this.batchTimeout) {
                clearTimeout(this.batchTimeout);
            }

            this.batchTimeout = setTimeout(() => {
                this.executeBatch();
            }, this.BATCH_DELAY);
        });
    }

    private async executeBatch(): Promise<void> {
        const requests = new Map(this.pendingRequests);
        this.pendingRequests.clear();
        this.batchTimeout = null;

        // Group by collection for efficient Firebase queries
        const collections = new Map<string, BatchRequest[]>();
        
        for (const [key, requestList] of requests) {
            const collection = requestList[0].collection;
            if (!collections.has(collection)) {
                collections.set(collection, []);
            }
            collections.get(collection)!.push(...requestList);
        }

        // Execute batched requests
        for (const [collection, requestList] of collections) {
            try {
                const data = await this.fetchCollection(collection);
                
                requestList.forEach(request => {
                    if (request.id === 'all') {
                        request.resolve(data);
                    } else {
                        const item = data.find((d: any) => d.id === request.id);
                        request.resolve(item);
                    }
                });
            } catch (error) {
                requestList.forEach(request => request.reject(error));
            }
        }
    }

    private async fetchCollection(collection: string): Promise<any[]> {
        // Use IndexedDB first, then Firebase
        const { indexedDB } = await import('./indexedDB');
        
        try {
            const cachedData = await indexedDB.getAll(collection);
            if (cachedData.length > 0) {
                return cachedData;
            }
        } catch (error) {
            console.warn('IndexedDB error, falling back to Firebase:', error);
        }

        // Fallback to Firebase
        const { loadFromFirebase } = await import('./syncData');
        const data = await loadFromFirebase(collection);
        
        // Cache in IndexedDB for next time
        try {
            await indexedDB.bulkInsert(collection, data);
        } catch (error) {
            console.warn('Failed to cache in IndexedDB:', error);
        }
        
        return data;
    }
}

export const requestBatcher = new RequestBatcher();