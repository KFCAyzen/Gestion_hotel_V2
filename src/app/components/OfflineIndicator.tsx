"use client";

import { useOfflineMode } from '../hooks/useOfflineMode';

export default function OfflineIndicator() {
    const { isOnline, pendingSync } = useOfflineMode();

    if (isOnline && pendingSync === 0) return null;

    return (
        <div className="fixed top-4 right-4 z-50">
            {!isOnline ? (
                <div className="bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-12.728 12.728m0-12.728l12.728 12.728" />
                    </svg>
                    <span className="text-sm font-medium">Mode hors ligne</span>
                    {pendingSync > 0 && (
                        <span className="bg-red-600 text-xs px-2 py-1 rounded-full">
                            {pendingSync} en attente
                        </span>
                    )}
                </div>
            ) : pendingSync > 0 ? (
                <div className="bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    <span className="text-sm font-medium">Synchronisation...</span>
                    <span className="bg-blue-600 text-xs px-2 py-1 rounded-full">
                        {pendingSync}
                    </span>
                </div>
            ) : null}
        </div>
    );
}