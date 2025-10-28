"use client";

import { Images } from "./Images";
import Image from "next/image";
import { useState, useEffect, useMemo, useCallback, memo } from "react";
import { formatPrice } from "../utils/formatPrice";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { dataCache } from "../utils/dataCache";
import { useProgressiveLoading } from "../hooks/useProgressiveLoading";
import ProgressiveLoader from "./ProgressiveLoader";
import SkeletonLoader from "./SkeletonLoader";

interface DashboardData {
    basicStats: {
        occupiedRooms: number;
        todayReservations: number;
        todayRevenue: number;
        totalRooms: number;
        occupancyRate: number;
    };
    roomStats: {
        availableRooms: number;
        maintenanceRooms: number;
        cleaningRooms: number;
        roomsByCategory: Record<string, any[]>;
    };
    revenueStats: {
        monthlyRevenue: number;
        dailyStats: any;
        weeklyStats: any;
    };
    activityData: {
        recentActivities: any[];
        weeklyReservations: any[];
        totalClients: number;
        totalBills: number;
    };
}

const StatCard = memo(({ stat, index }: { stat: any; index: number }) => (
    <div className={`${stat.bgColor} rounded-xl p-4 sm:p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300`}>
        <div className="flex items-center justify-between mb-4">
            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-r ${stat.color} flex items-center justify-center text-white p-2`}>
                <Image src={stat.icon} alt={stat.title} width={24} height={24} className="filter brightness-0 invert" />
            </div>
            <div className="text-right">
                <div className={`text-xl sm:text-2xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                    {stat.value}
                </div>
            </div>
        </div>
        <h3 className="text-sm sm:text-base font-semibold text-slate-700 mb-1">{stat.title}</h3>
        <p className="text-xs sm:text-sm text-slate-500">{stat.subtitle}</p>
    </div>
));

StatCard.displayName = 'StatCard';

interface OptimizedDashboardProps {
    onNavigate?: (page: string) => void;
}

export default function OptimizedDashboard({ onNavigate }: OptimizedDashboardProps = {}) {
    const { user } = useAuth();
    const { isLoading, currentStep, steps, error, isComplete, executeSteps } = useProgressiveLoading();
    
    const [dashboardData, setDashboardData] = useState<DashboardData>({
        basicStats: {
            occupiedRooms: 0,
            todayReservations: 0,
            todayRevenue: 0,
            totalRooms: 27,
            occupancyRate: 0
        },
        roomStats: {
            availableRooms: 27,
            maintenanceRooms: 0,
            cleaningRooms: 0,
            roomsByCategory: {}
        },
        revenueStats: {
            monthlyRevenue: 0,
            dailyStats: { nuitee: { count: 0, amount: 0 }, repos: { count: 0, amount: 0 } },
            weeklyStats: { nuitee: { count: 0, amount: 0 }, repos: { count: 0, amount: 0 } }
        },
        activityData: {
            recentActivities: [],
            weeklyReservations: [],
            totalClients: 0,
            totalBills: 0
        }
    });

    const [loadedSections, setLoadedSections] = useState({
        basicStats: false,
        roomStats: false,
        revenueStats: false,
        activityData: false
    });

    // Fonctions de chargement optimisées
    const loadBasicStats = useCallback(async () => {
        const cacheKey = `basic_stats_${user?.username || 'all'}`;
        const cached = dataCache.get(cacheKey);
        if (cached) return cached;

        const rooms = JSON.parse(localStorage.getItem('rooms') || '[]');
        const reservations = JSON.parse(localStorage.getItem('reservations') || '[]');
        const bills = JSON.parse(localStorage.getItem('bills') || '[]');

        const today = new Date().toISOString().split('T')[0];
        const todayReservations = reservations.filter((r: any) => r.checkIn === today).length;
        const todayBills = bills.filter((b: any) => b.date === today);
        const todayRevenue = todayBills.reduce((sum: number, bill: any) => sum + (parseInt(bill.amount) || 0), 0);

        const roomStatusCounts = { 'Disponible': 0, 'Occupée': 0, 'Maintenance': 0, 'Nettoyage': 0 };
        rooms.forEach((room: any) => {
            if (room?.status && roomStatusCounts.hasOwnProperty(room.status)) {
                roomStatusCounts[room.status as keyof typeof roomStatusCounts]++;
            }
        });

        const result = {
            occupiedRooms: roomStatusCounts['Occupée'],
            todayReservations,
            todayRevenue,
            totalRooms: rooms.length || 27,
            occupancyRate: Math.round((roomStatusCounts['Occupée'] / (rooms.length || 27)) * 100)
        };

        dataCache.set(cacheKey, result, 2 * 60 * 1000);
        return result;
    }, [user?.username]);

    const loadRoomStats = useCallback(async () => {
        const cacheKey = `room_stats_${user?.username || 'all'}`;
        const cached = dataCache.get(cacheKey);
        if (cached) return cached;

        const rooms = JSON.parse(localStorage.getItem('rooms') || '[]');
        const roomStatusCounts = { 'Disponible': 0, 'Occupée': 0, 'Maintenance': 0, 'Nettoyage': 0 };
        const roomsByCategory: Record<string, any[]> = {};

        rooms.forEach((room: any) => {
            if (room?.status && roomStatusCounts.hasOwnProperty(room.status)) {
                roomStatusCounts[room.status as keyof typeof roomStatusCounts]++;
            }
            if (!roomsByCategory[room.category]) roomsByCategory[room.category] = [];
            roomsByCategory[room.category].push(room);
        });

        const result = {
            availableRooms: roomStatusCounts['Disponible'],
            maintenanceRooms: roomStatusCounts['Maintenance'],
            cleaningRooms: roomStatusCounts['Nettoyage'],
            roomsByCategory
        };

        dataCache.set(cacheKey, result, 2 * 60 * 1000);
        return result;
    }, [user?.username]);

    const loadRevenueStats = useCallback(async () => {
        const cacheKey = `revenue_stats_${user?.username || 'all'}`;
        const cached = dataCache.get(cacheKey);
        if (cached) return cached;

        const bills = JSON.parse(localStorage.getItem('bills') || '[]');
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        let monthlyRevenue = 0;
        let dailyNuitee = 0, dailyNuiteeAmount = 0, dailyRepos = 0, dailyReposAmount = 0;
        let weeklyNuitee = 0, weeklyNuiteeAmount = 0, weeklyRepos = 0, weeklyReposAmount = 0;

        const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
        const weekEnd = new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000);

        bills.forEach((bill: any) => {
            if (!bill?.date) return;
            const amount = parseInt(bill.amount) || 0;
            const billDate = new Date(bill.date);

            if (billDate.getMonth() === currentMonth && billDate.getFullYear() === currentYear) {
                monthlyRevenue += amount;
            }

            if (bill.date === today) {
                if (bill.motif === 'Nuitée') {
                    dailyNuitee++;
                    dailyNuiteeAmount += amount;
                } else if (bill.motif === 'Repos') {
                    dailyRepos++;
                    dailyReposAmount += amount;
                }
            }

            if (billDate >= weekStart && billDate <= weekEnd) {
                if (bill.motif === 'Nuitée') {
                    weeklyNuitee++;
                    weeklyNuiteeAmount += amount;
                } else if (bill.motif === 'Repos') {
                    weeklyRepos++;
                    weeklyReposAmount += amount;
                }
            }
        });

        const result = {
            monthlyRevenue,
            dailyStats: { nuitee: { count: dailyNuitee, amount: dailyNuiteeAmount }, repos: { count: dailyRepos, amount: dailyReposAmount } },
            weeklyStats: { nuitee: { count: weeklyNuitee, amount: weeklyNuiteeAmount }, repos: { count: weeklyRepos, amount: weeklyReposAmount } }
        };

        dataCache.set(cacheKey, result, 2 * 60 * 1000);
        return result;
    }, [user?.username]);

    const loadActivityData = useCallback(async () => {
        const cacheKey = `activity_data_${user?.username || 'all'}`;
        const cached = dataCache.get(cacheKey);
        if (cached) return cached;

        const clients = JSON.parse(localStorage.getItem('clients') || '[]');
        const bills = JSON.parse(localStorage.getItem('bills') || '[]');
        const reservations = JSON.parse(localStorage.getItem('reservations') || '[]');

        const formatActivityTime = (timestamp: string | number) => {
            if (!timestamp) return 'Heure inconnue';
            const date = new Date(timestamp);
            if (isNaN(date.getTime())) return 'Heure inconnue';
            
            const today = new Date();
            const isToday = date.toDateString() === today.toDateString();
            
            if (isToday) {
                return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
            } else {
                return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }) + ' ' + 
                       date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
            }
        };

        const recentActivities = [...reservations.slice(-3), ...clients.slice(-2), ...bills.slice(-2)]
            .filter(item => item && typeof item === 'object')
            .slice(-5)
            .map((item: any) => {
                const timestamp = item.createdAt || item.timestamp || Date.now();
                const time = formatActivityTime(timestamp);
                
                if (item.clientName) return { type: 'reservation', message: `Nouvelle réservation - ${item.clientName}`, detail: `Chambre ${item.roomNumber || 'N/A'}`, time };
                if (item.name) return { type: 'client', message: `Nouveau client - ${item.name}`, detail: item.phone || 'Téléphone non renseigné', time };
                return { type: 'billing', message: `Nouveau reçu - ${item.receivedFrom || 'Client'}`, detail: formatPrice(item.amount || '0'), time };
            });

        const weeklyReservations = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day, index) => ({
            day,
            count: Math.floor(Math.random() * 10),
            maxCount: 10
        }));

        const result = {
            recentActivities,
            weeklyReservations,
            totalClients: clients.length,
            totalBills: bills.length
        };

        dataCache.set(cacheKey, result, 2 * 60 * 1000);
        return result;
    }, [user?.username]);

    const loadDashboardData = useCallback(async () => {
        const steps = [
            { name: 'Chargement des statistiques de base', action: loadBasicStats },
            { name: 'Chargement des données des chambres', action: loadRoomStats },
            { name: 'Calcul des revenus', action: loadRevenueStats },
            { name: 'Chargement des activités récentes', action: loadActivityData }
        ];

        try {
            const results = await executeSteps(steps);
            
            setDashboardData({
                basicStats: results[0],
                roomStats: results[1],
                revenueStats: results[2],
                activityData: results[3]
            });

            setLoadedSections({
                basicStats: true,
                roomStats: true,
                revenueStats: true,
                activityData: true
            });
        } catch (error) {
            console.error('Erreur lors du chargement:', error);
        }
    }, [executeSteps, loadBasicStats, loadRoomStats, loadRevenueStats, loadActivityData]);

    useEffect(() => {
        loadDashboardData();
    }, [loadDashboardData]);

    const stats = useMemo(() => [
        {
            title: "Chambres Occupées",
            value: dashboardData.basicStats.occupiedRooms.toString(),
            subtitle: `sur ${dashboardData.basicStats.totalRooms} chambres`,
            color: "from-blue-500 to-blue-600",
            bgColor: "bg-blue-50",
            icon: Images.room
        },
        {
            title: "Réservations Aujourd'hui",
            value: dashboardData.basicStats.todayReservations.toString(),
            subtitle: "nouvelles réservations",
            color: "from-green-500 to-green-600",
            bgColor: "bg-green-50",
            icon: Images.reservation
        },
        {
            title: "Revenus du Jour",
            value: formatPrice(dashboardData.basicStats.todayRevenue.toString()),
            subtitle: "chiffre d'affaires",
            color: "from-purple-500 to-purple-600",
            bgColor: "bg-purple-50",
            icon: Images.billing
        }
    ], [dashboardData.basicStats]);

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="mb-6 sm:mb-8">
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-2">Tableau de Bord</h1>
                    <p className="text-sm sm:text-base text-slate-600">Chargement en cours...</p>
                </div>
                
                <ProgressiveLoader 
                    steps={steps} 
                    currentStep={currentStep} 
                    isComplete={isComplete} 
                    error={error || undefined} 
                />
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    <SkeletonLoader type="card" count={3} />
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                    <SkeletonLoader type="table" count={2} />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="mb-6 sm:mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-2">Tableau de Bord</h1>
                        <p className="text-sm sm:text-base text-slate-600">
                            Vue d'ensemble de votre établissement
                        </p>
                    </div>
                    <button
                        onClick={loadDashboardData}
                        className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm transition-colors"
                    >
                        Actualiser
                    </button>
                </div>
            </div>

            {/* Statistiques principales */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {loadedSections.basicStats ? (
                    stats.map((stat, index) => {
                        const getNavigationPage = () => {
                            if (stat.title.includes('Réservations')) return 'reservations';
                            if (stat.title.includes('Revenus')) return 'admin';
                            return 'chambres';
                        };
                        
                        return (
                            <div key={index} onClick={() => onNavigate?.(getNavigationPage())} className="cursor-pointer">
                                <StatCard stat={stat} index={index} />
                            </div>
                        );
                    })
                ) : (
                    <SkeletonLoader type="card" count={3} />
                )}
            </div>

            {/* Aperçu rapide et statut des chambres */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {loadedSections.basicStats && loadedSections.roomStats ? (
                    <>
                        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                            <h3 className="text-lg font-semibold text-slate-800 mb-4">Aperçu Rapide</h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-600">Taux d'occupation</span>
                                    <span className={`font-semibold ${
                                        dashboardData.basicStats.occupancyRate > 80 ? 'text-red-600' :
                                        dashboardData.basicStats.occupancyRate > 60 ? 'text-orange-600' :
                                        dashboardData.basicStats.occupancyRate > 30 ? 'text-yellow-600' :
                                        'text-green-600'
                                    }`}>
                                        {dashboardData.basicStats.occupancyRate}%
                                    </span>
                                </div>
                                <div className="w-full bg-slate-200 rounded-full h-3">
                                    <div 
                                        className={`h-3 rounded-full transition-all duration-500 ${
                                            dashboardData.basicStats.occupancyRate > 80 ? 'bg-gradient-to-r from-red-500 to-red-600' :
                                            dashboardData.basicStats.occupancyRate > 60 ? 'bg-gradient-to-r from-orange-500 to-orange-600' :
                                            dashboardData.basicStats.occupancyRate > 30 ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' :
                                            'bg-gradient-to-r from-green-500 to-green-600'
                                        }`}
                                        style={{width: `${dashboardData.basicStats.occupancyRate}%`}}
                                    ></div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm cursor-pointer hover:shadow-md transition-shadow" onClick={() => onNavigate?.('chambres')}>
                            <h3 className="text-lg font-semibold text-slate-800 mb-4">Statut des Chambres</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="text-center p-4 bg-green-50 rounded-lg">
                                    <div className="text-2xl font-bold text-green-600">{dashboardData.roomStats.availableRooms}</div>
                                    <div className="text-sm text-green-700">Disponibles</div>
                                </div>
                                <div className="text-center p-4 bg-blue-50 rounded-lg">
                                    <div className="text-2xl font-bold text-blue-600">{dashboardData.basicStats.occupiedRooms}</div>
                                    <div className="text-sm text-blue-700">Occupées</div>
                                </div>
                                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                                    <div className="text-2xl font-bold text-yellow-600">{dashboardData.roomStats.maintenanceRooms}</div>
                                    <div className="text-sm text-yellow-700">Maintenance</div>
                                </div>
                                <div className="text-center p-4 bg-purple-50 rounded-lg">
                                    <div className="text-2xl font-bold text-purple-600">{dashboardData.roomStats.cleaningRooms}</div>
                                    <div className="text-sm text-purple-700">Nettoyage</div>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <SkeletonLoader type="table" count={2} />
                )}
            </div>

            {/* Revenus */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {loadedSections.revenueStats ? (
                    <>
                        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm cursor-pointer hover:shadow-md transition-shadow" onClick={() => onNavigate?.('admin')}>
                            <h3 className="text-lg font-semibold text-slate-800 mb-4">Rendement Journalier</h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                                    <div>
                                        <p className="text-sm font-medium text-blue-800">Nuitées</p>
                                        <p className="text-xs text-blue-600">{dashboardData.revenueStats.dailyStats.nuitee.count} chambres</p>
                                    </div>
                                    <p className="text-lg font-bold text-blue-600">{formatPrice(dashboardData.revenueStats.dailyStats.nuitee.amount.toString())}</p>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                                    <div>
                                        <p className="text-sm font-medium text-green-800">Repos</p>
                                        <p className="text-xs text-green-600">{dashboardData.revenueStats.dailyStats.repos.count} chambres</p>
                                    </div>
                                    <p className="text-lg font-bold text-green-600">{formatPrice(dashboardData.revenueStats.dailyStats.repos.amount.toString())}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm cursor-pointer hover:shadow-md transition-shadow" onClick={() => onNavigate?.('admin')}>
                            <h3 className="text-lg font-semibold text-slate-800 mb-4">Revenus du Mois</h3>
                            <div className="text-center">
                                <div className="text-3xl font-bold" style={{color: '#7D3837'}}>
                                    {formatPrice(dashboardData.revenueStats.monthlyRevenue.toString())}
                                </div>
                                <div className="text-sm text-slate-500">Revenus du mois en cours</div>
                            </div>
                        </div>
                    </>
                ) : (
                    <SkeletonLoader type="card" count={2} />
                )}
            </div>

            {/* Activités récentes */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {loadedSections.activityData ? (
                    <>
                        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm cursor-pointer hover:shadow-md transition-shadow" onClick={() => onNavigate?.('admin')}>
                            <h3 className="text-lg font-semibold text-slate-800 mb-4">Activités Récentes</h3>
                            <div className="space-y-3">
                                {dashboardData.activityData.recentActivities.length === 0 ? (
                                    <div className="text-center py-4 text-slate-500 text-sm">
                                        Aucune activité récente
                                    </div>
                                ) : (
                                    dashboardData.activityData.recentActivities.map((activity, index) => (
                                        <div key={index} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                                <Image src={Images.dashboard} alt="Activity" width={16} height={16} />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-slate-700">{activity.message}</p>
                                                <p className="text-xs text-slate-500">{activity.detail} • {activity.time}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                            <h3 className="text-lg font-semibold text-slate-800 mb-4">Réservations par Jour</h3>
                            <div className="space-y-3">
                                {dashboardData.activityData.weeklyReservations.map((dayData, index) => (
                                    <div key={index} className="flex items-center gap-3">
                                        <div className="w-8 text-xs text-slate-600">{dayData.day}</div>
                                        <div className="flex-1 bg-slate-200 rounded-full h-2">
                                            <div 
                                                className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300"
                                                style={{width: `${(dayData.count / dayData.maxCount) * 100}%`}}
                                            ></div>
                                        </div>
                                        <div className="w-6 text-xs text-slate-700 font-medium">{dayData.count}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                ) : (
                    <SkeletonLoader type="list" count={2} />
                )}
            </div>
        </div>
    );
}