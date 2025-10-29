"use client";

interface InlineSpinnerProps {
    size?: 'xs' | 'sm' | 'md';
    className?: string;
}

export default function InlineSpinner({ size = 'sm', className = '' }: InlineSpinnerProps) {
    const sizeClasses = {
        xs: 'w-3 h-3 border',
        sm: 'w-4 h-4 border-2',
        md: 'w-5 h-5 border-2'
    };

    return (
        <div 
            className={`${sizeClasses[size]} border-slate-300 border-t-slate-600 rounded-full animate-spin ${className}`}
            style={{ borderTopColor: 'currentColor' }}
        />
    );
}