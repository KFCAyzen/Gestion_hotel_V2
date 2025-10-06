"use client";

import { createContext, useContext, ReactNode } from 'react';

interface NotificationContextType {
    showNotification: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotificationContext = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotificationContext must be used within NotificationProvider');
    }
    return context;
};

interface NotificationProviderProps {
    children: ReactNode;
    showNotification: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const NotificationProvider = ({ children, showNotification }: NotificationProviderProps) => {
    return (
        <NotificationContext.Provider value={{ showNotification }}>
            {children}
        </NotificationContext.Provider>
    );
};