class IndexedDBManager {
    private db: IDBDatabase | null = null;
    private readonly dbName = 'HotelManagementDB';
    private readonly version = 1;

    async init(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (typeof window === 'undefined' || !window.indexedDB) {
                reject(new Error('IndexedDB not available'));
                return;
            }
            const request = window.indexedDB.open(this.dbName, this.version);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };
            
            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                
                // Create stores
                if (!db.objectStoreNames.contains('rooms')) {
                    const roomStore = db.createObjectStore('rooms', { keyPath: 'id' });
                    roomStore.createIndex('status', 'status', { unique: false });
                    roomStore.createIndex('category', 'category', { unique: false });
                }
                
                if (!db.objectStoreNames.contains('clients')) {
                    const clientStore = db.createObjectStore('clients', { keyPath: 'id' });
                    clientStore.createIndex('name', 'name', { unique: false });
                }
                
                if (!db.objectStoreNames.contains('bills')) {
                    const billStore = db.createObjectStore('bills', { keyPath: 'id' });
                    billStore.createIndex('date', 'date', { unique: false });
                }
                
                if (!db.objectStoreNames.contains('reservations')) {
                    const reservationStore = db.createObjectStore('reservations', { keyPath: 'id' });
                    reservationStore.createIndex('checkIn', 'checkIn', { unique: false });
                }
            };
        });
    }

    async set(storeName: string, data: any): Promise<void> {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(data);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve();
        });
    }

    async get(storeName: string, key: string): Promise<any> {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(key);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
        });
    }

    async getAll(storeName: string): Promise<any[]> {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
        });
    }

    async query(storeName: string, indexName: string, value: any): Promise<any[]> {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const index = store.index(indexName);
            const request = index.getAll(value);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
        });
    }

    async bulkInsert(storeName: string, items: any[]): Promise<void> {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            
            let completed = 0;
            const total = items.length;
            
            items.forEach(item => {
                const request = store.put(item);
                request.onsuccess = () => {
                    completed++;
                    if (completed === total) resolve();
                };
                request.onerror = () => reject(request.error);
            });
        });
    }
}

export const indexedDB = new IndexedDBManager();