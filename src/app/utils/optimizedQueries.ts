import { collection, query, where, orderBy, limit, startAfter, getDocs, DocumentSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { dataCache } from './dataCache';

interface QueryOptions {
    pageSize?: number;
    orderByField?: string;
    orderDirection?: 'asc' | 'desc';
    filters?: Array<{ field: string; operator: any; value: any }>;
    lastDoc?: DocumentSnapshot;
}

export class OptimizedQueries {
    static async getPaginatedData(
        collectionName: string,
        options: QueryOptions = {}
    ) {
        const {
            pageSize = 20,
            orderByField = 'createdAt',
            orderDirection = 'desc',
            filters = [],
            lastDoc
        } = options;

        const cacheKey = `${collectionName}_${JSON.stringify(options)}`;
        const cached = dataCache.get(cacheKey);
        if (cached && !lastDoc) return cached;

        try {
            let q = query(collection(db, collectionName));

            // Apply filters
            filters.forEach(filter => {
                q = query(q, where(filter.field, filter.operator, filter.value));
            });

            // Apply ordering
            q = query(q, orderBy(orderByField, orderDirection));

            // Apply pagination
            if (lastDoc) {
                q = query(q, startAfter(lastDoc));
            }
            q = query(q, limit(pageSize));

            const snapshot = await getDocs(q);
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            const result = {
                data,
                lastDoc: snapshot.docs[snapshot.docs.length - 1],
                hasMore: snapshot.docs.length === pageSize
            };

            if (!lastDoc) {
                dataCache.set(cacheKey, result, 2 * 60 * 1000); // 2 minutes cache
            }

            return result;
        } catch (error) {
            console.error('Query error:', error);
            return { data: [], lastDoc: null, hasMore: false };
        }
    }

    static async getRecentData(collectionName: string, count = 10) {
        const cacheKey = `recent_${collectionName}_${count}`;
        const cached = dataCache.get(cacheKey);
        if (cached) return cached;

        const result = await this.getPaginatedData(collectionName, {
            pageSize: count,
            orderByField: 'createdAt',
            orderDirection: 'desc'
        });

        dataCache.set(cacheKey, (result as any).data, 1 * 60 * 1000); // 1 minute cache
        return (result as any).data;
    }

    static async searchData(
        collectionName: string,
        searchField: string,
        searchTerm: string
    ) {
        if (!searchTerm.trim()) return [];

        const cacheKey = `search_${collectionName}_${searchField}_${searchTerm}`;
        const cached = dataCache.get(cacheKey);
        if (cached) return cached;

        const result = await this.getPaginatedData(collectionName, {
            filters: [
                { field: searchField, operator: '>=', value: searchTerm },
                { field: searchField, operator: '<=', value: searchTerm + '\uf8ff' }
            ]
        });

        dataCache.set(cacheKey, (result as any).data, 30 * 1000); // 30 seconds cache
        return (result as any).data;
    }
}