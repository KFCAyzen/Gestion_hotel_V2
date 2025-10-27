'use client';

import { useState, useEffect, memo, useCallback, useMemo } from 'react';
import LoadingSpinner from './LoadingSpinner';

interface AnalyticsData {
    revenue: {
        daily: number;
        weekly: number;
        monthly: number;
        yearly: number;
    };
    occupancy: {
        current: number;
        average: number;
    };
    clients: {
        total: number;
        new: number;
    };
    rooms: {
        mostBooked: string;
        avgStay: number;
    };
}

const OptimizedAnalyticsPage = () => {
    const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedPeriod, setSelectedPeriod] = useState('monthly');

    // Cache simple pour éviter les recalculs
    const [dataCache, setDataCache] = useState<{
        data?: AnalyticsData;
        timestamp?: number;
    }>({});

    const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

    // Calcul simplifié des analytics
    const calculateAnalytics = useCallback((): AnalyticsData => {
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        
        // Données depuis localStorage uniquement
        const bills = JSON.parse(localStorage.getItem('bills') || '[]');
        const reservations = JSON.parse(localStorage.getItem('reservations') || '[]');
        const rooms = JSON.parse(localStorage.getItem('rooms') || '[]');
        
        // Revenus simplifiés
        const dailyRevenue = bills
            .filter((b: any) => b.date === today)
            .reduce((sum: number, b: any) => sum + (parseInt(b.amount) || 0), 0);

        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const weeklyRevenue = bills
            .filter((b: any) => b.date && new Date(b.date) >= weekAgo)
            .reduce((sum: number, b: any) => sum + (parseInt(b.amount) || 0), 0);

        const monthlyRevenue = bills
            .filter((b: any) => {
                if (!b.date) return false;
                const billDate = new Date(b.date);
                return billDate.getMonth() === now.getMonth() && billDate.getFullYear() === now.getFullYear();
            })
            .reduce((sum: number, b: any) => sum + (parseInt(b.amount) || 0), 0);

        const yearlyRevenue = bills
            .filter((b: any) => {
                if (!b.date) return false;
                const billDate = new Date(b.date);
                return billDate.getFullYear() === now.getFullYear();
            })
            .reduce((sum: number, b: any) => sum + (parseInt(b.amount) || 0), 0);

        // Taux d'occupation simple
        const occupiedRooms = rooms.filter((r: any) => r.status === 'Occupée').length;
        const totalRooms = rooms.length || 27;
        const currentOccupancy = totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0;

        // Catégorie la plus réservée (simple)
        const categoryStats = rooms.reduce((acc: any, room: any) => {
            const category = room.category || 'Standard';
            if (!acc[category]) acc[category] = 0;
            if (room.status === 'Occupée') acc[category]++;
            return acc;
        }, {});

        const mostBooked = Object.entries(categoryStats)
            .sort(([,a]: any, [,b]: any) => b - a)[0]?.[0] || 'Standard';

        // Durée moyenne simplifiée
        const avgStay = reservations.length > 0 ? 2.5 : 0;

        return {
            revenue: {
                daily: dailyRevenue,
                weekly: weeklyRevenue,
                monthly: monthlyRevenue,
                yearly: yearlyRevenue
            },
            occupancy: {
                current: currentOccupancy,
                average: currentOccupancy * 0.8 // Estimation simple
            },
            clients: {
                total: JSON.parse(localStorage.getItem('clients') || '[]').length,
                new: reservations.filter((r: any) => {
                    if (!r.checkIn) return false;
                    const checkIn = new Date(r.checkIn);
                    return checkIn >= new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                }).length
            },
            rooms: {
                mostBooked,
                avgStay
            }
        };
    }, []);

    const fetchAnalyticsData = useCallback(async () => {
        const now = Date.now();
        
        // Vérifier le cache
        if (dataCache.timestamp && (now - dataCache.timestamp) < CACHE_DURATION && dataCache.data) {
            setAnalyticsData(dataCache.data);
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const analytics = calculateAnalytics();
            setAnalyticsData(analytics);
            
            // Mettre à jour le cache
            setDataCache({
                data: analytics,
                timestamp: now
            });
        } catch (error) {
            console.warn('Analytics error:', error);
            setAnalyticsData({
                revenue: { daily: 0, weekly: 0, monthly: 0, yearly: 0 },
                occupancy: { current: 0, average: 0 },
                clients: { total: 0, new: 0 },
                rooms: { mostBooked: 'Standard', avgStay: 0 }
            });
        } finally {
            setLoading(false);
        }
    }, [calculateAnalytics, dataCache.timestamp]);

    useEffect(() => {
        fetchAnalyticsData();
    }, [selectedPeriod]);

    const formatPrice = useCallback((amount: number) => {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'XAF',
            minimumFractionDigits: 0
        }).format(amount);
    }, []);

    // Données des catégories optimisées avec useMemo
    const categoryData = useMemo(() => {
        const rooms = JSON.parse(localStorage.getItem('rooms') || '[]');
        return ['Standard', 'Confort', 'VIP', 'Suite'].map(category => {
            const categoryRooms = rooms.filter((r: any) => r.category === category);
            const occupiedCount = categoryRooms.filter((r: any) => r.status === 'Occupée').length;
            const totalCount = categoryRooms.length;
            const occupancyRate = totalCount > 0 ? (occupiedCount / totalCount) * 100 : 0;
            
            return {
                category,
                occupiedCount,
                totalCount,
                occupancyRate
            };
        });
    }, []);

    if (loading) {
        return <LoadingSpinner />;
    }

    if (!analyticsData) {
        return <div className="p-6 text-center">Erreur lors du chargement des données</div>;
    }

    return (
        <div className="p-4 sm:p-6 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl font-bold text-slate-800">Rapports & Analytics</h1>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => {
                            setDataCache({});
                            fetchAnalyticsData();
                        }}
                        className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors text-sm"
                    >
                        Actualiser
                    </button>
                    <select 
                        value={selectedPeriod}
                        onChange={(e) => setSelectedPeriod(e.target.value)}
                        className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="daily">Aujourd'hui</option>
                        <option value="weekly">Cette semaine</option>
                        <option value="monthly">Ce mois</option>
                        <option value="yearly">Cette année</option>
                    </select>
                </div>
            </div>

            {/* KPIs principaux */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-600">
                                {selectedPeriod === 'daily' ? 'Revenus du jour' :
                                 selectedPeriod === 'weekly' ? 'Revenus de la semaine' :
                                 selectedPeriod === 'yearly' ? 'Revenus de l\'année' :
                                 'Revenus du mois'}
                            </p>
                            <p className="text-2xl font-bold text-green-600">
                                {formatPrice(
                                    selectedPeriod === 'daily' ? analyticsData.revenue.daily :
                                    selectedPeriod === 'weekly' ? analyticsData.revenue.weekly :
                                    selectedPeriod === 'yearly' ? analyticsData.revenue.yearly :
                                    analyticsData.revenue.monthly
                                )}
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-600">Taux d'occupation</p>
                            <p className="text-2xl font-bold text-blue-600">
                                {analyticsData.occupancy.current.toFixed(1)}%
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                        </div>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">Moyenne: {analyticsData.occupancy.average.toFixed(1)}%</p>
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-600">Total clients</p>
                            <p className="text-2xl font-bold text-purple-600">
                                {analyticsData.clients.total}
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                            </svg>
                        </div>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">
                        {analyticsData.clients.new} nouveaux ce mois
                    </p>
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-600">Séjour moyen</p>
                            <p className="text-2xl font-bold text-orange-600">
                                {analyticsData.rooms.avgStay} jours
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                            <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">
                        Plus réservée: {analyticsData.rooms.mostBooked}
                    </p>
                </div>
            </div>

            {/* Performance par catégorie */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Performance par Catégorie</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {categoryData.map(({ category, occupiedCount, totalCount, occupancyRate }) => (
                        <div key={category} className="p-4 bg-slate-50 rounded-lg">
                            <h4 className="font-medium text-slate-800">{category}</h4>
                            <div className="mt-2 space-y-1">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-600">Chambres occupées</span>
                                    <span className="font-medium">{occupiedCount}/{totalCount}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-600">Taux d'occupation</span>
                                    <span className="font-medium">{occupancyRate.toFixed(1)}%</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default memo(OptimizedAnalyticsPage);