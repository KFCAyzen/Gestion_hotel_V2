"use client";

import { useState, useEffect, useCallback } from 'react';
import { PersistentStorage } from '../utils/persistentStorage';

interface OfflineData {
    type: string;
    data: any;
    timestamp: number;
    action: 'create' | 'update' | 'delete';
}

export function useOfflineMode() {
    const [isOnline, setIsOnline] = useState(true);
    const [pendingSync, setPendingSync] = useState<OfflineData[]>([]);

    // Détecter le statut de connexion
    useEffect(() => {
        const updateOnlineStatus = () => {
            setIsOnline(navigator.onLine);
        };

        window.addEventListener('online', updateOnlineStatus);
        window.addEventListener('offline', updateOnlineStatus);

        // Vérifier le statut initial
        updateOnlineStatus();

        return () => {
            window.removeEventListener('online', updateOnlineStatus);
            window.removeEventListener('offline', updateOnlineStatus);
        };
    }, []);

    // Charger les données en attente de synchronisation
    useEffect(() => {
        const loadPendingSync = async () => {
            try {
                const pending = await PersistentStorage.load('pendingSync');
                if (pending && Array.isArray(pending)) {
                    setPendingSync(pending);
                }
            } catch (error) {
                console.warn('Erreur lors du chargement des données en attente:', error);
            }
        };

        loadPendingSync();
    }, []);

    // Sauvegarder les données en attente avec double protection
    const savePendingSync = useCallback(async (data: OfflineData[]) => {
        try {
            await PersistentStorage.save('pendingSync', data);
            setPendingSync(data);
        } catch (error) {
            console.warn('Erreur lors de la sauvegarde des données en attente:', error);
            // Fallback localStorage
            localStorage.setItem('pendingSync', JSON.stringify(data));
            setPendingSync(data);
        }
    }, []);

    // Ajouter une opération en attente de synchronisation
    const addPendingOperation = useCallback((type: string, data: any, action: 'create' | 'update' | 'delete') => {
        const operation: OfflineData = {
            type,
            data,
            timestamp: Date.now(),
            action
        };

        const newPending = [...pendingSync, operation];
        savePendingSync(newPending);
    }, [pendingSync, savePendingSync]);

    // Synchroniser les données en attente
    const syncPendingData = useCallback(async () => {
        if (!isOnline || pendingSync.length === 0) return;

        try {
            const { saveData } = await import('../utils/syncData');
            
            for (const operation of pendingSync) {
                try {
                    await saveData(operation.type, operation.data);
                } catch (error) {
                    console.warn(`Erreur lors de la synchronisation de ${operation.type}:`, error);
                }
            }

            // Nettoyer les données synchronisées
            savePendingSync([]);
        } catch (error) {
            console.warn('Erreur lors de la synchronisation:', error);
        }
    }, [isOnline, pendingSync, savePendingSync]);

    // Synchroniser automatiquement quand la connexion revient
    useEffect(() => {
        if (isOnline && pendingSync.length > 0) {
            syncPendingData();
        }
    }, [isOnline, syncPendingData]);

    // Sauvegarder les données localement avec double protection
    const saveOfflineData = useCallback(async (type: string, data: any, action: 'create' | 'update' | 'delete' = 'create') => {
        try {
            // Charger les données existantes
            const existingData = await PersistentStorage.load(type) || [];
            
            let updatedData;
            if (action === 'create') {
                updatedData = [...existingData, data];
            } else if (action === 'update') {
                updatedData = existingData.map((item: any) => 
                    item.id === data.id ? { ...item, ...data } : item
                );
            } else if (action === 'delete') {
                updatedData = existingData.filter((item: any) => item.id !== data.id);
            }

            // Sauvegarder avec double protection
            await PersistentStorage.save(type, updatedData);

            // Ajouter à la file d'attente de synchronisation si hors ligne
            if (!isOnline) {
                addPendingOperation(type, data, action);
            }

            return true;
        } catch (error) {
            console.warn('Erreur lors de la sauvegarde hors ligne:', error);
            return false;
        }
    }, [isOnline, addPendingOperation]);

    // Charger les données avec fallback automatique
    const loadOfflineData = useCallback(async (type: string) => {
        try {
            const data = await PersistentStorage.load(type);
            return data || [];
        } catch (error) {
            console.warn('Erreur lors du chargement des données hors ligne:', error);
            return [];
        }
    }, []);

    return {
        isOnline,
        pendingSync: pendingSync.length,
        saveOfflineData,
        loadOfflineData,
        syncPendingData,
        addPendingOperation
    };
}