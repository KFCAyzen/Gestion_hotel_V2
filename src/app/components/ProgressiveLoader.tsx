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
            <div className="flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
                <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 border-2 sm:border-3 lg:border-4 border-red-200 border-t-red-500 rounded-full mb-3 sm:mb-4"></div>
                <p className="text-xs sm:text-sm text-red-600 font-medium text-center px-2">Erreur: {error}</p>
            </div>
        );
    }

    if (isComplete) {
        return (
            <div className="flex items-center justify-center p-3 sm:p-4">
                <div className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-green-500 rounded-full flex items-center justify-center">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full"></div>
                </div>
                <span className="ml-2 text-xs sm:text-sm text-green-600 font-medium">Chargé</span>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
            <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 border-2 sm:border-3 lg:border-4 border-slate-200 border-t-4 rounded-full animate-spin mb-3 sm:mb-4" 
                 style={{borderTopColor: '#7D3837'}}></div>
            
            <div className="space-y-2 sm:space-y-3 text-center w-full max-w-xs sm:max-w-sm">
                <p className="text-xs sm:text-sm lg:text-base text-slate-600 font-medium px-2">
                    {steps[currentStep] || 'Chargement'}{dots}
                </p>
                
                <div className="w-full max-w-[200px] sm:max-w-[250px] lg:max-w-[300px] bg-slate-200 rounded-full h-1.5 sm:h-2 mx-auto">
                    <div 
                        className="h-1.5 sm:h-2 rounded-full transition-all duration-300"
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