import { useState } from 'react';

/**
 * Interface pour définir la structure d'une notification
 */
interface NotificationState {
    id: number;
    message: string;
    type: 'success' | 'error' | 'info';
}

/**
 * Hook personnalisé pour gérer les notifications toast
 * Permet d'afficher plusieurs notifications simultanément
 */
export const useNotification = () => {
    const [notifications, setNotifications] = useState<NotificationState[]>([]);

    /**
     * Afficher une nouvelle notification
     * @param message - Texte à afficher
     * @param type - Type de notification (success, error, info)
     */
    const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
        const id = Date.now(); // ID unique basé sur le timestamp
        setNotifications(prev => [...prev, { id, message, type }]);
    };

    /**
     * Supprimer une notification par son ID
     * @param id - ID unique de la notification à supprimer
     */
    const removeNotification = (id: number) => {
        setNotifications(prev => prev.filter(notification => notification.id !== id));
    };

    return {
        notifications,
        showNotification,
        removeNotification
    };
};