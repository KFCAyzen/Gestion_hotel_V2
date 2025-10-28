"use client";

import { useState, useEffect, useCallback } from 'react';

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
        const loadPendingSync = () => {
            try {
                const pending = localStorage.getItem('pendingSync');
                if (pending) {
                    setPendingSync(JSON.parse(pending));
                }
            } catch (error) {
                console.warn('Erreur lors du chargement des données en attente:', error);
            }
        };

        loadPendingSync();
    }, []);

    // Sauvegarder les données en attente
    const savePendingSync = useCallback((data: OfflineData[]) => {
        try {
            localStorage.setItem('pendingSync', JSON.stringify(data));
            setPendingSync(data);
        } catch (error) {
            console.warn('Erreur lors de la sauvegarde des données en attente:', error);
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

    // Sauvegarder les données localement (mode hors ligne)
    const saveOfflineData = useCallback((type: string, data: any, action: 'create' | 'update' | 'delete' = 'create') => {
        try {
            // Sauvegarder dans localStorage
            const existingData = JSON.parse(localStorage.getItem(type) || '[]');
            
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

            localStorage.setItem(type, JSON.stringify(updatedData));

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

    // Charger les données (priorité localStorage si hors ligne)
    const loadOfflineData = useCallback((type: string) => {
        try {
            const data = localStorage.getItem(type);
            return data ? JSON.parse(data) : [];
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