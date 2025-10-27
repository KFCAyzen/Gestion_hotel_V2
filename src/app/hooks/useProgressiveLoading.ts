"use client";

import { useState, useCallback } from 'react';

interface LoadingStep {
    name: string;
    action: () => Promise<any>;
}

interface UseProgressiveLoadingReturn {
    isLoading: boolean;
    currentStep: number;
    steps: string[];
    error: string | null;
    isComplete: boolean;
    executeSteps: (steps: LoadingStep[]) => Promise<any[]>;
    reset: () => void;
}

export function useProgressiveLoading(): UseProgressiveLoadingReturn {
    const [isLoading, setIsLoading] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [steps, setSteps] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isComplete, setIsComplete] = useState(false);

    const executeSteps = useCallback(async (loadingSteps: LoadingStep[]) => {
        setIsLoading(true);
        setCurrentStep(0);
        setSteps(loadingSteps.map(step => step.name));
        setError(null);
        setIsComplete(false);

        const results: any[] = [];

        try {
            for (let i = 0; i < loadingSteps.length; i++) {
                setCurrentStep(i);
                
                // Petit délai pour l'UX
                if (i > 0) {
                    await new Promise(resolve => setTimeout(resolve, 200));
                }
                
                const result = await loadingSteps[i].action();
                results.push(result);
            }

            setIsComplete(true);
            return results;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erreur inconnue');
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const reset = useCallback(() => {
        setIsLoading(false);
        setCurrentStep(0);
        setSteps([]);
        setError(null);
        setIsComplete(false);
    }, []);

    return {
        isLoading,
        currentStep,
        steps,
        error,
        isComplete,
        executeSteps,
        reset
    };
}