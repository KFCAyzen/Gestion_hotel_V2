"use client";

interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    text?: string;
}

export default function LoadingSpinner({ size = 'md', text = 'Chargement...' }: LoadingSpinnerProps) {
    const sizeClasses = {
        sm: 'w-3 h-3 sm:w-4 sm:h-4',
        md: 'w-6 h-6 sm:w-8 sm:h-8',
        lg: 'w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12'
    };

    const containerClasses = {
        sm: 'p-2 sm:p-3 lg:p-4',
        md: 'p-4 sm:p-6 lg:p-8',
        lg: 'p-6 sm:p-8 lg:p-12'
    };

    const borderClasses = {
        sm: 'border-2',
        md: 'border-3',
        lg: 'border-4'
    };

    const textClasses = {
        sm: 'text-xs sm:text-sm',
        md: 'text-xs sm:text-sm lg:text-base',
        lg: 'text-sm sm:text-base lg:text-lg'
    };

    return (
        <div className={`flex flex-col items-center justify-center ${containerClasses[size]}`}>
            <div className={`${sizeClasses[size]} ${borderClasses[size]} border-slate-200 border-t-4 rounded-full animate-spin mb-2 sm:mb-3 lg:mb-4`} 
                 style={{borderTopColor: '#7D3837'}}></div>
            <p className={`${textClasses[size]} text-slate-600 font-medium text-center px-2`}>{text}</p>
        </div>
    );
}