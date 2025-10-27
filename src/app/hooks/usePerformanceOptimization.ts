"use client";

import { useEffect, useCallback, useRef } from 'react';
import { dataCache } from '../utils/dataCache';

interface PerformanceConfig {
    enableImageOptimization?: boolean;
    enableDataPrefetching?: boolean;
    enableMemoryCleanup?: boolean;
    cleanupInterval?: number;
}

export function usePerformanceOptimization(config: PerformanceConfig = {}) {
    const {
        enableImageOptimization = true,
        enableDataPrefetching = true,
        enableMemoryCleanup = true,
        cleanupInterval = 5 * 60 * 1000 // 5 minutes
    } = config;

    const cleanupTimerRef = useRef<NodeJS.Timeout | undefined>(undefined);
    const observerRef = useRef<IntersectionObserver | undefined>(undefined);

    // Optimisation des images avec lazy loading
    const optimizeImages = useCallback(() => {
        if (!enableImageOptimization) return;

        const images = document.querySelectorAll('img[data-src]');
        
        if (observerRef.current) {
            observerRef.current.disconnect();
        }

        observerRef.current = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    const img = entry.target as HTMLImageElement;
                    const src = img.getAttribute('data-src');
                    if (src) {
                        img.src = src;
                        img.removeAttribute('data-src');
                        observerRef.current?.unobserve(img);
                    }
                }
            });
        }, {
            rootMargin: '50px'
        });

        images.forEach((img) => {
            observerRef.current?.observe(img);
        });
    }, [enableImageOptimization]);

    // Préchargement des données critiques
    const prefetchCriticalData = useCallback(async () => {
        if (!enableDataPrefetching) return;

        const criticalKeys = ['rooms', 'clients', 'bills', 'reservations'];
        
        try {
            await Promise.all(
                criticalKeys.map(async (key) => {
                    const cached = dataCache.get(key);
                    if (!cached) {
                        const data = localStorage.getItem(key);
                        if (data) {
                            dataCache.set(key, JSON.parse(data), 10 * 60 * 1000); // 10 minutes
                        }
                    }
                })
            );
        } catch (error) {
            console.warn('Prefetch failed:', error);
        }
    }, [enableDataPrefetching]);

    // Nettoyage mémoire automatique
    const setupMemoryCleanup = useCallback(() => {
        if (!enableMemoryCleanup) return;

        const cleanup = () => {
            // Nettoyer le cache
            dataCache.cleanup();
            
            // Forcer le garbage collection si disponible
            if ('gc' in window && typeof (window as any).gc === 'function') {
                try {
                    (window as any).gc();
                } catch (e) {
                    // Ignore si gc n'est pas disponible
                }
            }
            
            // Nettoyer les event listeners orphelins
            const events = ['resize', 'scroll', 'click', 'keydown'];
            events.forEach(event => {
                const listeners = (window as any)._eventListeners?.[event] || [];
                if (listeners.length > 50) {
                    console.warn(`Too many ${event} listeners detected:`, listeners.length);
                }
            });
        };

        cleanupTimerRef.current = setInterval(cleanup, cleanupInterval);
        
        return () => {
            if (cleanupTimerRef.current) {
                clearInterval(cleanupTimerRef.current);
            }
        };
    }, [enableMemoryCleanup, cleanupInterval]);

    // Optimisation du rendu avec requestIdleCallback
    const optimizeRendering = useCallback((callback: () => void) => {
        if ('requestIdleCallback' in window) {
            (window as any).requestIdleCallback(callback, { timeout: 1000 });
        } else {
            setTimeout(callback, 0);
        }
    }, []);

    // Détection des fuites mémoire
    const detectMemoryLeaks = useCallback(() => {
        if (typeof (performance as any).memory !== 'undefined') {
            const memory = (performance as any).memory;
            const usedMB = Math.round(memory.usedJSHeapSize / 1024 / 1024);
            const totalMB = Math.round(memory.totalJSHeapSize / 1024 / 1024);
            
            if (usedMB > 100) { // Plus de 100MB
                console.warn(`High memory usage detected: ${usedMB}MB / ${totalMB}MB`);
                
                // Nettoyer agressivement
                dataCache.clear();
                
                // Suggérer un rechargement si critique
                if (usedMB > 200) {
                    console.error('Critical memory usage. Consider page reload.');
                }
            }
        }
    }, []);

    // Optimisation des requêtes réseau
    const optimizeNetworkRequests = useCallback(() => {
        // Implémenter un système de batch pour les requêtes
        const pendingRequests = new Map();
        
        return {
            batchRequest: (key: string, request: () => Promise<any>) => {
                if (pendingRequests.has(key)) {
                    return pendingRequests.get(key);
                }
                
                const promise = request().finally(() => {
                    pendingRequests.delete(key);
                });
                
                pendingRequests.set(key, promise);
                return promise;
            }
        };
    }, []);

    // Initialisation
    useEffect(() => {
        let mounted = true;
        
        const init = async () => {
            if (!mounted) return;
            
            // Optimiser les images
            optimizeImages();
            
            // Précharger les données critiques
            await prefetchCriticalData();
            
            // Configurer le nettoyage mémoire
            const cleanupFn = setupMemoryCleanup();
            
            // Détecter les fuites mémoire périodiquement
            const memoryCheckInterval = setInterval(detectMemoryLeaks, 30000); // 30 secondes
            
            return () => {
                mounted = false;
                cleanupFn?.();
                clearInterval(memoryCheckInterval);
                observerRef.current?.disconnect();
            };
        };
        
        init();
        
        return () => {
            mounted = false;
        };
    }, [optimizeImages, prefetchCriticalData, setupMemoryCleanup, detectMemoryLeaks]);

    return {
        optimizeRendering,
        optimizeNetworkRequests: optimizeNetworkRequests(),
        detectMemoryLeaks,
        prefetchCriticalData
    };
}