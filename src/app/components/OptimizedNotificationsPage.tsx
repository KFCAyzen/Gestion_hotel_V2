"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { loadFromFirebase } from "../utils/syncData";
import LoadingSpinner from "./LoadingSpinner";

interface Notification {
    id: string;
    type: 'checkout' | 'user_action';
    title: string;
    message: string;
    timestamp: string;
    read: boolean;
}

export default function OptimizedNotificationsPage() {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'unread' | 'checkout' | 'actions'>('all');

    // Cache simple
    const [dataCache, setDataCache] = useState<{
        notifications?: Notification[];
        timestamp?: number;
    }>({});

    const CACHE_DURATION = 60 * 1000; // 1 minute

    const generateNotificationId = () => `notif_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

    const loadNotifications = useCallback(async () => {
        const now = Date.now();
        
        // Vérifier le cache
        if (dataCache.timestamp && (now - dataCache.timestamp) < CACHE_DURATION && dataCache.notifications) {
            setNotifications(dataCache.notifications);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        try {
            const allNotifications: Notification[] = [];
            
            // Charger les réservations pour les rappels de checkout (simplifié)
            const reservations = JSON.parse(localStorage.getItem('reservations') || '[]');
            const today = new Date().toISOString().split('T')[0];
            const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            
            // Notifications de checkout (limitées)
            reservations.slice(0, 10).forEach((reservation: any, index: number) => {
                if (reservation.checkOut === today || reservation.checkOut === tomorrow) {
                    const isToday = reservation.checkOut === today;
                    allNotifications.push({
                        id: `checkout_${reservation.id}_${index}`,
                        type: 'checkout',
                        title: isToday ? 'Checkout Aujourd\'hui' : 'Checkout Demain',
                        message: `${reservation.clientName} - Chambre ${reservation.roomNumber}`,
                        timestamp: new Date().toISOString(),
                        read: false
                    });
                }
            });

            // Actions utilisateurs (simplifiées)
            if (user?.role === 'admin' || user?.role === 'super_admin') {
                const activities = JSON.parse(localStorage.getItem('activityLog') || '[]');
                const recentActivities = activities
                    .filter((activity: any) => activity.userId !== user.username)
                    .slice(-10); // Limiter à 10
                
                recentActivities.forEach((activity: any, index: number) => {
                    allNotifications.push({
                        id: `activity_${activity.id || Date.now()}_${index}`,
                        type: 'user_action',
                        title: 'Action Utilisateur',
                        message: `${activity.userName || activity.userId}: ${activity.action}`,
                        timestamp: activity.timestamp,
                        read: false
                    });
                });
            }

            // Trier par timestamp décroissant (limité)
            allNotifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            const limitedNotifications = allNotifications.slice(0, 50); // Limiter à 50
            
            setNotifications(limitedNotifications);
            
            // Mettre à jour le cache
            setDataCache({
                notifications: limitedNotifications,
                timestamp: now
            });
        } catch (error) {
            console.error('Erreur chargement notifications:', error);
            setNotifications([]);
        } finally {
            setIsLoading(false);
        }
    }, [user, dataCache.timestamp]);

    useEffect(() => {
        loadNotifications();
        const interval = setInterval(() => {
            setDataCache({}); // Invalider le cache
            loadNotifications();
        }, 2 * 60 * 1000); // Actualiser toutes les 2 minutes
        return () => clearInterval(interval);
    }, [user]);

    const markAsRead = useCallback((notificationId: string) => {
        setNotifications(prev => 
            prev.map(notif => 
                notif.id === notificationId ? { ...notif, read: true } : notif
            )
        );
    }, []);

    const markAllAsRead = useCallback(() => {
        setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
    }, []);

    // Filtrage optimisé avec useMemo
    const filteredNotifications = useMemo(() => {
        switch (filter) {
            case 'unread': return notifications.filter(notif => !notif.read);
            case 'checkout': return notifications.filter(notif => notif.type === 'checkout');
            case 'actions': return notifications.filter(notif => notif.type === 'user_action');
            default: return notifications;
        }
    }, [notifications, filter]);

    const getNotificationIcon = useCallback((type: string) => {
        switch (type) {
            case 'checkout':
                return (
                    <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                );
            case 'user_action':
                return (
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                );
            default:
                return (
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5-5-5h5v-5a7.5 7.5 0 015.5-7.21" />
                    </svg>
                );
        }
    }, []);

    if (isLoading) {
        return <LoadingSpinner size="lg" text="Chargement des notifications..." />;
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
                <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-0" style={{color: '#7D3837'}}>
                    Notifications
                </h1>
                <div className="flex flex-col sm:flex-row gap-3">
                    <button
                        onClick={markAllAsRead}
                        className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm transition-colors"
                    >
                        Tout marquer comme lu
                    </button>
                    <button
                        onClick={() => {
                            setDataCache({});
                            loadNotifications();
                        }}
                        className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm transition-colors"
                    >
                        Actualiser
                    </button>
                </div>
            </div>

            {/* Filtres */}
            <div className="flex flex-wrap gap-2 mb-6">
                {[
                    { key: 'all', label: 'Toutes' },
                    { key: 'unread', label: 'Non lues' },
                    { key: 'checkout', label: 'Checkouts' },
                    { key: 'actions', label: 'Actions' }
                ].map(({ key, label }) => (
                    <button
                        key={key}
                        onClick={() => setFilter(key as any)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            filter === key
                                ? 'text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                        style={filter === key ? {backgroundColor: '#7D3837'} : {}}
                    >
                        {label}
                        {key === 'unread' && notifications.filter(n => !n.read).length > 0 && (
                            <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                                {notifications.filter(n => !n.read).length}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Liste des notifications */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                {filteredNotifications.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5-5-5h5v-5a7.5 7.5 0 015.5-7.21" />
                            </svg>
                        </div>
                        <p className="text-slate-500 text-lg font-medium">Aucune notification</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-200">
                        {filteredNotifications.map((notification, index) => (
                            <div
                                key={`${notification.id}-${index}`}
                                className={`p-4 sm:p-6 hover:bg-slate-50 transition-colors cursor-pointer ${
                                    !notification.read ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                                }`}
                                onClick={() => markAsRead(notification.id)}
                            >
                                <div className="flex items-start gap-4">
                                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                                        {getNotificationIcon(notification.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <h3 className="text-sm font-semibold text-slate-900">
                                                {notification.title}
                                            </h3>
                                            <span className="text-xs text-slate-500">
                                                {new Date(notification.timestamp).toLocaleString('fr-FR')}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-600 mb-2">
                                            {notification.message}
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                notification.type === 'checkout' ? 'bg-orange-100 text-orange-800' :
                                                notification.type === 'user_action' ? 'bg-blue-100 text-blue-800' :
                                                'bg-gray-100 text-gray-800'
                                            }`}>
                                                {notification.type === 'checkout' ? 'Checkout' :
                                                 notification.type === 'user_action' ? 'Action' : 'Système'}
                                            </span>
                                            {!notification.read && (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                    Non lu
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}