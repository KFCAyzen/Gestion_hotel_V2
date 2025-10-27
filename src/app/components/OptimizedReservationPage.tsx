"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { saveData, loadFromFirebase } from "../utils/syncData";
import { useNotificationContext } from "../context/NotificationContext";
import { formatPrice } from "../utils/formatPrice";
import { useActivityLog } from "../context/ActivityLogContext";
import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "./LoadingSpinner";

interface Reservation {
    id: string;
    clientName: string;
    roomNumber: string;
    checkIn: string;
    checkOut: string;
    totalPrice: string;
}

export default function OptimizedReservationPage() {
    const [showForm, setShowForm] = useState(false);
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [rooms, setRooms] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { showNotification } = useNotificationContext();
    const { addLog } = useActivityLog();
    const { user } = useAuth();
    
    const [formData, setFormData] = useState({
        clientName: '',
        phonePrefix: '+237',
        clientPhone: '',
        clientEmail: '',
        roomNumber: '',
        checkIn: '',
        checkOut: '',
        totalPrice: ''
    });

    // Cache pour les données
    const [dataCache, setDataCache] = useState<{
        reservations?: Reservation[];
        rooms?: any[];
        timestamp?: number;
    }>({});

    const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes

    const loadData = useCallback(async () => {
        const now = Date.now();
        
        // Vérifier le cache
        if (dataCache.timestamp && (now - dataCache.timestamp) < CACHE_DURATION) {
            if (dataCache.reservations) setReservations(dataCache.reservations);
            if (dataCache.rooms) setRooms(dataCache.rooms);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        try {
            const [reservationsData, roomsData] = await Promise.all([
                loadFromFirebase('reservations').catch(() => JSON.parse(localStorage.getItem('reservations') || '[]')),
                loadFromFirebase('rooms').catch(() => JSON.parse(localStorage.getItem('rooms') || '[]'))
            ]);

            const validReservations = Array.isArray(reservationsData) ? reservationsData : [];
            const validRooms = Array.isArray(roomsData) ? roomsData : [];

            setReservations(validReservations);
            setRooms(validRooms);
            
            // Mettre à jour le cache
            setDataCache({
                reservations: validReservations,
                rooms: validRooms,
                timestamp: now
            });
        } catch (error) {
            console.warn('Error loading data:', error);
            setReservations([]);
            setRooms([]);
        } finally {
            setIsLoading(false);
        }
    }, [dataCache.timestamp]);

    // Chambres disponibles optimisées avec useMemo
    const availableRooms = useMemo(() => {
        if (!formData.checkIn || !formData.checkOut || rooms.length === 0) return [];
        
        const newCheckIn = new Date(formData.checkIn);
        const newCheckOut = new Date(formData.checkOut);
        
        return rooms.filter(room => {
            if (room.status !== 'Disponible') return false;
            
            // Vérification rapide des conflits
            const hasConflict = reservations.some(reservation => {
                if (reservation.roomNumber !== room.number) return false;
                
                const existingCheckIn = new Date(reservation.checkIn);
                const existingCheckOut = new Date(reservation.checkOut || reservation.checkIn);
                
                return (
                    (newCheckIn >= existingCheckIn && newCheckIn < existingCheckOut) ||
                    (newCheckOut > existingCheckIn && newCheckOut <= existingCheckOut) ||
                    (newCheckIn <= existingCheckIn && newCheckOut >= existingCheckOut)
                );
            });
            
            return !hasConflict && (
                formData.roomNumber === '' || 
                room.number.toLowerCase().includes(formData.roomNumber.toLowerCase())
            );
        });
    }, [rooms, reservations, formData.checkIn, formData.checkOut, formData.roomNumber]);

    useEffect(() => {
        loadData();
    }, []);

    const generateId = () => `R${Date.now().toString().slice(-4)}${Math.random().toString(36).substr(2, 3).toUpperCase()}`;

    const handleSaveReservation = useCallback(async () => {
        if (!formData.clientName || !formData.clientPhone || !formData.roomNumber || !formData.checkIn) {
            showNotification("Veuillez remplir les champs obligatoires", "error");
            return;
        }

        const reservationData = {
            ...formData,
            id: generateId(),
            phone: `${formData.phonePrefix} ${formData.clientPhone}`,
            createdBy: user?.username || 'system'
        };

        try {
            await Promise.all([
                saveData('reservations', reservationData),
                saveData('clients', {
                    name: formData.clientName,
                    phone: reservationData.phone,
                    email: formData.clientEmail || '',
                    createdBy: user?.username || 'system'
                })
            ]);

            // Mettre à jour le statut de la chambre
            const room = rooms.find(r => r.number === formData.roomNumber);
            if (room) {
                await saveData('rooms', { ...room, status: 'Occupée' });
            }

            addLog('Création réservation', 'reservations', `Réservation: ${formData.clientName} - Chambre ${formData.roomNumber}`, reservationData);
            showNotification("Réservation enregistrée avec succès!", "success");
            
            setShowForm(false);
            setFormData({
                clientName: '', phonePrefix: '+237', clientPhone: '', clientEmail: '',
                roomNumber: '', checkIn: '', checkOut: '', totalPrice: ''
            });
            
            // Invalider le cache
            setDataCache({});
            await loadData();
        } catch (error) {
            showNotification("Erreur lors de l'enregistrement", "error");
        }
    }, [formData, rooms, user, showNotification, addLog, loadData]);

    if (isLoading) {
        return <LoadingSpinner size="lg" text="Chargement des réservations..." />;
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6" style={{color: '#7D3837'}}>Réservations</h1>
            
            <div className="mb-4 flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
                <button 
                    onClick={() => setShowForm(true)}
                    style={{backgroundColor: '#7D3837'}} 
                    className="text-yellow-300 px-4 py-3 sm:py-2 rounded hover:bg-opacity-80 font-medium"
                >
                    Nouvelle Réservation
                </button>
            </div>
            
            {showForm && (
                <div className="bg-yellow-50 border rounded p-4 sm:p-6 mb-4" style={{borderColor: '#7D3837'}}>
                    <h3 className="font-bold mb-4 sm:mb-6 text-lg sm:text-xl" style={{color: '#7D3837'}}>Nouvelle Réservation</h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6">
                        <input 
                            placeholder="Nom du client *" 
                            value={formData.clientName}
                            onChange={(e) => setFormData({...formData, clientName: e.target.value})}
                            className="p-3 border rounded-lg" 
                            style={{borderColor: '#7D3837'}} 
                        />
                        <div className="flex gap-2">
                            <select
                                value={formData.phonePrefix}
                                onChange={(e) => setFormData({...formData, phonePrefix: e.target.value})}
                                className="p-3 border rounded-lg w-24"
                                style={{borderColor: '#7D3837'}}
                            >
                                <option value="+237">+237</option>
                                <option value="+33">+33</option>
                                <option value="+1">+1</option>
                            </select>
                            <input 
                                placeholder="Téléphone *" 
                                value={formData.clientPhone}
                                onChange={(e) => setFormData({...formData, clientPhone: e.target.value.replace(/[^0-9]/g, '')})}
                                className="p-3 border rounded-lg flex-1" 
                                style={{borderColor: '#7D3837'}} 
                            />
                        </div>
                        <input 
                            placeholder="Email" 
                            type="email"
                            value={formData.clientEmail}
                            onChange={(e) => setFormData({...formData, clientEmail: e.target.value})}
                            className="p-3 border rounded-lg" 
                            style={{borderColor: '#7D3837'}} 
                        />
                        
                        <div className="relative">
                            <input 
                                placeholder="Numéro de chambre *" 
                                value={formData.roomNumber}
                                onChange={(e) => setFormData({...formData, roomNumber: e.target.value})}
                                className="p-3 border rounded-lg w-full" 
                                style={{borderColor: '#7D3837'}} 
                            />
                            {availableRooms.length > 0 && formData.roomNumber && (
                                <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                    {availableRooms.slice(0, 5).map((room) => (
                                        <div
                                            key={room.id}
                                            onClick={() => setFormData({...formData, roomNumber: room.number, totalPrice: room.price})}
                                            className="p-3 hover:bg-yellow-50 cursor-pointer border-b border-slate-100 flex justify-between"
                                        >
                                            <span>Chambre {room.number} ({room.category})</span>
                                            <span className="font-medium">{room.price} FCFA</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        
                        <input 
                            type="date" 
                            value={formData.checkIn}
                            min={new Date().toISOString().split('T')[0]}
                            onChange={(e) => setFormData({...formData, checkIn: e.target.value})}
                            className="p-3 border rounded-lg" 
                            style={{borderColor: '#7D3837'}} 
                        />
                        <input 
                            type="date" 
                            value={formData.checkOut}
                            min={formData.checkIn || new Date().toISOString().split('T')[0]}
                            onChange={(e) => setFormData({...formData, checkOut: e.target.value})}
                            className="p-3 border rounded-lg" 
                            style={{borderColor: '#7D3837'}} 
                        />
                        <input 
                            type="number"
                            placeholder="Prix total (FCFA)" 
                            value={formData.totalPrice}
                            onChange={(e) => setFormData({...formData, totalPrice: e.target.value.replace(/[^0-9]/g, '')})}
                            className="p-3 border rounded-lg" 
                            style={{borderColor: '#7D3837'}} 
                        />
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-3">
                        <button 
                            onClick={handleSaveReservation}
                            style={{backgroundColor: '#7D3837'}} 
                            className="text-yellow-300 px-6 py-3 rounded hover:opacity-80 transition-opacity font-medium"
                        >
                            Enregistrer
                        </button>
                        <button 
                            onClick={() => {
                                setShowForm(false);
                                setFormData({
                                    clientName: '', phonePrefix: '+237', clientPhone: '', clientEmail: '',
                                    roomNumber: '', checkIn: '', checkOut: '', totalPrice: ''
                                });
                            }} 
                            className="px-6 py-3 rounded border hover:bg-yellow-100 transition-colors font-medium" 
                            style={{borderColor: '#7D3837', color: '#7D3837'}}
                        >
                            Annuler
                        </button>
                    </div>
                </div>
            )}
            
            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                <div className="p-4 sm:p-6 border-b border-slate-200">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <h2 className="text-lg sm:text-xl font-semibold text-slate-800">Liste des Réservations</h2>
                        <div className="flex items-center gap-3">
                            <span className="text-xs sm:text-sm text-slate-600 bg-slate-100 px-2 sm:px-3 py-1 rounded-full">
                                {reservations.length} réservation(s)
                            </span>
                            <button 
                                onClick={() => {
                                    setDataCache({});
                                    loadData();
                                }}
                                className="px-3 sm:px-4 py-2 text-xs sm:text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                            >
                                Actualiser
                            </button>
                        </div>
                    </div>
                </div>
                
                <div className="p-4 sm:p-6">
                    {reservations.length === 0 ? (
                        <div className="text-center py-8 sm:py-12">
                            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0V6a2 2 0 012-2h2a2 2 0 012 2v1m-6 0h6m-6 0l-.5 9a2 2 0 002 2h3a2 2 0 002-2L15 7m-6 0h6" />
                                </svg>
                            </div>
                            <p className="text-slate-500 text-base sm:text-lg font-medium">Aucune réservation</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                            {reservations.map((reservation, index) => (
                                <div key={`${reservation.id}-${index}`} className="bg-gradient-to-br from-white to-slate-50 p-4 sm:p-6 rounded-xl border border-slate-200 hover:shadow-lg transition-all">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center" style={{backgroundColor: '#fff590'}}>
                                            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0V6a2 2 0 012-2h2a2 2 0 012 2v1m-6 0h6" />
                                            </svg>
                                        </div>
                                        <span className="text-xs font-medium px-2.5 py-0.5 rounded-full" style={{backgroundColor: '#fff590', color: '#7D3837'}}>
                                            Chambre {reservation.roomNumber}
                                        </span>
                                    </div>
                                    
                                    <h3 className="font-semibold text-slate-800 text-base sm:text-lg mb-4">{reservation.clientName}</h3>
                                    
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs sm:text-sm text-slate-600">Arrivée</span>
                                            <span className="text-xs sm:text-sm font-medium text-slate-800">{reservation.checkIn}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs sm:text-sm text-slate-600">Départ</span>
                                            <span className="text-xs sm:text-sm font-medium text-slate-800">{reservation.checkOut}</span>
                                        </div>
                                        {reservation.totalPrice && (
                                            <div className="pt-3 border-t border-slate-200">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs sm:text-sm text-slate-600">Prix total</span>
                                                    <span className="text-base sm:text-lg font-bold" style={{color: '#7D3837'}}>{formatPrice(reservation.totalPrice)}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}