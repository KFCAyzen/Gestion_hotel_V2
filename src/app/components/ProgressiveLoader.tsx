"use client";

import { useState, useEffect } from 'react';

interface ProgressiveLoaderProps {
    steps: string[];
    currentStep: number;
    isComplete: boolean;
    error?: string;
}

export default function ProgressiveLoader({ steps, currentStep, isComplete, error }: ProgressiveLoaderProps) {
    const [dots, setDots] = useState('');

    useEffect(() => {
        if (isComplete || error) return;
        
        const interval = setInterval(() => {
            setDots(prev => prev.length >= 3 ? '' : prev + '.');
        }, 500);

        return () => clearInterval(interval);
    }, [isComplete, error]);

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center p-8">
                <div className="w-12 h-12 border-4 border-red-200 border-t-red-500 rounded-full mb-4"></div>
                <p className="text-sm text-red-600 font-medium">Erreur: {error}</p>
            </div>
        );
    }

    if (isComplete) {
        return (
            <div className="flex items-center justify-center p-4">
                <div className="w-6 h-6 border-2 border-green-500 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                </div>
                <span className="ml-2 text-sm text-green-600 font-medium">Chargé</span>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center p-8">
            <div className="w-12 h-12 border-4 border-slate-200 border-t-4 rounded-full animate-spin mb-4" 
                 style={{borderTopColor: '#7D3837'}}></div>
            
            <div className="space-y-2 text-center">
                <p className="text-sm text-slate-600 font-medium">
                    {steps[currentStep] || 'Chargement'}{dots}
                </p>
                
                <div className="w-48 bg-slate-200 rounded-full h-2">
                    <div 
                        className="h-2 rounded-full transition-all duration-300"
                        style={{
                            width: `${((currentStep + 1) / steps.length) * 100}%`,
                            backgroundColor: '#7D3837'
                        }}
                    ></div>
                </div>
                
                <p className="text-xs text-slate-500">
                    {currentStep + 1} / {steps.length}
                </p>
            </div>
        </div>
    );
}