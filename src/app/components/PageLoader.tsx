"use client";

import { useState, useEffect, ReactNode } from 'react';
import ProgressiveLoader from './ProgressiveLoader';

interface PageLoaderProps {
    children: ReactNode;
    loadingSteps?: string[];
    minLoadTime?: number;
    onLoad?: () => Promise<void>;
}

export default function PageLoader({ 
    children, 
    loadingSteps = ['Initialisation...', 'Chargement des données...', 'Finalisation...'],
    minLoadTime = 1000,
    onLoad
}: PageLoaderProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [currentStep, setCurrentStep] = useState(0);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;
        
        const loadPage = async () => {
            const startTime = Date.now();
            
            try {
                // Simuler les étapes de chargement
                for (let i = 0; i < loadingSteps.length; i++) {
                    if (!isMounted) return;
                    
                    setCurrentStep(i);
                    
                    // Délai minimum entre les étapes
                    await new Promise(resolve => setTimeout(resolve, 300));
                    
                    // Exécuter la fonction de chargement personnalisée à la dernière étape
                    if (i === loadingSteps.length - 1 && onLoad) {
                        await onLoad();
                    }
                }
                
                // Assurer un temps de chargement minimum pour l'UX
                const elapsedTime = Date.now() - startTime;
                if (elapsedTime < minLoadTime) {
                    await new Promise(resolve => setTimeout(resolve, minLoadTime - elapsedTime));
                }
                
                if (isMounted) {
                    setIsLoading(false);
                }
            } catch (err) {
                if (isMounted) {
                    setError(err instanceof Error ? err.message : 'Erreur de chargement');
                    setIsLoading(false);
                }
            }
        };

        loadPage();

        return () => {
            isMounted = false;
        };
    }, [loadingSteps, minLoadTime, onLoad]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
                <div className="bg-white rounded-lg sm:rounded-xl p-4 sm:p-6 lg:p-8 shadow-lg border border-slate-200 w-full max-w-sm sm:max-w-md">
                    <ProgressiveLoader
                        steps={loadingSteps}
                        currentStep={currentStep}
                        isComplete={false}
                        error={error || undefined}
                    />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
                <div className="bg-white rounded-lg sm:rounded-xl p-4 sm:p-6 lg:p-8 shadow-lg border border-red-200 w-full max-w-sm sm:max-w-md">
                    <div className="text-center">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                            <svg className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                        </div>
                        <h3 className="text-base sm:text-lg font-semibold text-slate-800 mb-2">Erreur de chargement</h3>
                        <p className="text-xs sm:text-sm text-slate-600 mb-4 px-2">{error}</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs sm:text-sm transition-colors w-full sm:w-auto"
                        >
                            Recharger la page
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}