"use client";

// Système de stockage persistant avec double sauvegarde
export class PersistentStorage {
    private static dbName = 'HotelGestionDB';
    private static version = 1;

    // Sauvegarder avec double protection (localStorage + IndexedDB)
    static async save(key: string, data: any): Promise<void> {
        try {
            // Sauvegarde principale : localStorage
            localStorage.setItem(key, JSON.stringify(data));
            
            // Sauvegarde de sécurité : IndexedDB
            await this.saveToIndexedDB(key, data);
        } catch (error) {
            console.warn('Erreur sauvegarde persistante:', error);
            // Au minimum, localStorage fonctionne toujours
            localStorage.setItem(key, JSON.stringify(data));
        }
    }

    // Charger avec fallback automatique
    static async load(key: string): Promise<any> {
        try {
            // Essayer localStorage d'abord (plus rapide)
            const localData = localStorage.getItem(key);
            if (localData) {
                return JSON.parse(localData);
            }

            // Fallback : IndexedDB
            return await this.loadFromIndexedDB(key);
        } catch (error) {
            console.warn('Erreur chargement persistant:', error);
            return null;
        }
    }

    // Sauvegarde IndexedDB (survit même si localStorage est effacé)
    private static async saveToIndexedDB(key: string, data: any): Promise<void> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);
            
            request.onerror = () => reject(request.error);
            
            request.onsuccess = () => {
                const db = request.result;
                try {
                    if (!db.objectStoreNames.contains('data')) {
                        reject(new Error('Object store not found'));
                        return;
                    }
                    const transaction = db.transaction(['data'], 'readwrite');
                    const store = transaction.objectStore('data');
                    
                    store.put({ key, data, timestamp: Date.now() });
                    transaction.oncomplete = () => resolve();
                    transaction.onerror = () => reject(transaction.error);
                } catch (error) {
                    reject(error);
                }
            };
            
            request.onupgradeneeded = () => {
                const db = request.result;
                if (!db.objectStoreNames.contains('data')) {
                    db.createObjectStore('data', { keyPath: 'key' });
                }
            };
        });
    }

    // Chargement IndexedDB
    private static async loadFromIndexedDB(key: string): Promise<any> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);
            
            request.onerror = () => reject(request.error);
            
            request.onsuccess = () => {
                const db = request.result;
                try {
                    if (!db.objectStoreNames.contains('data')) {
                        resolve(null);
                        return;
                    }
                    const transaction = db.transaction(['data'], 'readonly');
                    const store = transaction.objectStore('data');
                    const getRequest = store.get(key);
                    
                    getRequest.onsuccess = () => {
                        resolve(getRequest.result?.data || null);
                    };
                    getRequest.onerror = () => reject(getRequest.error);
                } catch (error) {
                    resolve(null);
                }
            };
        });
    }
}