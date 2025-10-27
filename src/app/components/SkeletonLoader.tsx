"use client";

interface SkeletonLoaderProps {
    type: 'card' | 'list' | 'chart' | 'table';
    count?: number;
}

export default function SkeletonLoader({ type, count = 1 }: SkeletonLoaderProps) {
    const renderSkeleton = () => {
        switch (type) {
            case 'card':
                return (
                    <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm animate-pulse">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-slate-200 rounded-lg"></div>
                            <div className="w-16 h-8 bg-slate-200 rounded"></div>
                        </div>
                        <div className="w-32 h-4 bg-slate-200 rounded mb-2"></div>
                        <div className="w-24 h-3 bg-slate-200 rounded"></div>
                    </div>
                );
            
            case 'list':
                return (
                    <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm animate-pulse">
                        <div className="w-40 h-5 bg-slate-200 rounded mb-4"></div>
                        <div className="space-y-3">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                                    <div className="w-8 h-8 bg-slate-200 rounded-full"></div>
                                    <div className="flex-1">
                                        <div className="w-32 h-4 bg-slate-200 rounded mb-1"></div>
                                        <div className="w-24 h-3 bg-slate-200 rounded"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            
            case 'chart':
                return (
                    <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm animate-pulse">
                        <div className="w-40 h-5 bg-slate-200 rounded mb-4"></div>
                        <div className="space-y-3">
                            {Array.from({ length: 7 }).map((_, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <div className="w-8 h-3 bg-slate-200 rounded"></div>
                                    <div className="flex-1 bg-slate-200 rounded-full h-2"></div>
                                    <div className="w-6 h-3 bg-slate-200 rounded"></div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            
            case 'table':
                return (
                    <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm animate-pulse">
                        <div className="w-40 h-5 bg-slate-200 rounded mb-4"></div>
                        <div className="grid grid-cols-2 gap-4">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="text-center p-4 bg-slate-50 rounded-lg">
                                    <div className="w-8 h-8 bg-slate-200 rounded mx-auto mb-2"></div>
                                    <div className="w-16 h-3 bg-slate-200 rounded mx-auto"></div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            
            default:
                return (
                    <div className="w-full h-32 bg-slate-200 rounded-xl animate-pulse"></div>
                );
        }
    };

    return (
        <>
            {Array.from({ length: count }).map((_, index) => (
                <div key={index}>
                    {renderSkeleton()}
                </div>
            ))}
        </>
    );
}