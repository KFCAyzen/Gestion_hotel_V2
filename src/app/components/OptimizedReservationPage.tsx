"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { saveData, loadFromFirebase } from "../utils/syncData";
import { useNotificationContext } from "../context/NotificationContext";
import { formatPrice } from "../utils/formatPrice";
import { useActivityLog } from "../context/ActivityLogContext";
import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "./LoadingSpinner";
import { useOfflineMode } from "../hooks/useOfflineMode";

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
    const [loadingStep, setLoadingStep] = useState('');
    const [isSyncing, setIsSyncing] = useState(false);
    const [periodFilter, setPeriodFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const { showNotification } = useNotificationContext();
    const { addLog } = useActivityLog();
    const { user } = useAuth();
    const { isOnline, saveOfflineData, loadOfflineData } = useOfflineMode();
    
    const [formData, setFormData] = useState({
        clientName: '',
        phonePrefix: '+237',
        clientPhone: '',
        clientEmail: '',
        address: '',
        occupation: '',
        nationality: '',
        birthPlace: '',
        residenceCountry: '',
        idNumber: '',
        idIssueDate: '',
        idIssuePlace: '',
        idExpiryDate: '',
        gender: '',
        arrivalMode: 'A pied',
        plateNumber: '',
        departureMode: '',
        comingFrom: '',
        goingTo: '',
        stayType: 'Nuitée',
        mealPlan: 'RB',
        signature: '',
        roomNumber: '',
        checkIn: '',
        checkOut: '',
        duration: '',
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
            // Charger d'abord depuis localStorage pour un affichage rapide
            setLoadingStep('Chargement des données locales...');
            const localReservations = JSON.parse(localStorage.getItem('reservations') || '[]');
            const localRooms = JSON.parse(localStorage.getItem('rooms') || '[]');
            
            if (localReservations.length > 0 || localRooms.length > 0) {
                setReservations(localReservations);
                setRooms(localRooms);
                setIsLoading(false);
            }
            
            // Puis synchroniser avec Firebase en arrière-plan
            setLoadingStep('Synchronisation avec le serveur...');
            setIsSyncing(true);
            const [reservationsData, roomsData] = await Promise.all([
                loadFromFirebase('reservations').catch(() => localReservations),
                loadFromFirebase('rooms').catch(() => localRooms)
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
            
            // Sauvegarder en local pour la prochaine fois
            localStorage.setItem('reservations', JSON.stringify(validReservations));
            localStorage.setItem('rooms', JSON.stringify(validRooms));
            
        } catch (error) {
            console.warn('Error loading data:', error);
            setReservations([]);
            setRooms([]);
        } finally {
            setIsLoading(false);
            setLoadingStep('');
            setIsSyncing(false);
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

    // Filtrage des réservations par période
    const periodFilteredReservations = useMemo(() => {
        if (periodFilter === 'all') return reservations;
        
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        
        switch (periodFilter) {
            case 'today':
                return reservations.filter(r => r.checkIn === today);
            case 'week':
                const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
                const weekEnd = new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000);
                return reservations.filter(r => {
                    const checkIn = new Date(r.checkIn);
                    return checkIn >= weekStart && checkIn <= weekEnd;
                });
            case 'month':
                const currentMonth = now.getMonth();
                const currentYear = now.getFullYear();
                return reservations.filter(r => {
                    const checkIn = new Date(r.checkIn);
                    return checkIn.getMonth() === currentMonth && checkIn.getFullYear() === currentYear;
                });
            default:
                return reservations;
        }
    }, [reservations, periodFilter]);

    // Filtrage par recherche (nom, ID, chambre)
    const filteredReservations = useMemo(() => {
        if (!searchTerm.trim()) return periodFilteredReservations;
        
        const term = searchTerm.toLowerCase();
        return periodFilteredReservations.filter(reservation => 
            reservation.clientName.toLowerCase().includes(term) ||
            reservation.id.toLowerCase().includes(term) ||
            reservation.roomNumber.toLowerCase().includes(term)
        );
    }, [periodFilteredReservations, searchTerm]);

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
            if (isOnline) {
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
            } else {
                // Mode hors ligne
                saveOfflineData('reservations', reservationData);
                saveOfflineData('clients', {
                    name: formData.clientName,
                    phone: reservationData.phone,
                    email: formData.clientEmail || '',
                    createdBy: user?.username || 'system'
                });
                
                const room = rooms.find(r => r.number === formData.roomNumber);
                if (room) {
                    saveOfflineData('rooms', { ...room, status: 'Occupée' }, 'update');
                }
            }

            addLog('Création réservation', 'reservations', `Réservation: ${formData.clientName} - Chambre ${formData.roomNumber}`, reservationData);
            showNotification(
                isOnline 
                    ? "Réservation enregistrée avec succès!" 
                    : "Réservation sauvegardée hors ligne. Sera synchronisée à la reconnexion.", 
                "success"
            );
            
            setShowForm(false);
            setFormData({ clientName: '', phonePrefix: '+237', clientPhone: '', clientEmail: '', address: '', occupation: '', nationality: '', birthPlace: '', residenceCountry: '', idNumber: '', idIssueDate: '', idIssuePlace: '', idExpiryDate: '', gender: '', arrivalMode: 'A pied', plateNumber: '', departureMode: '', comingFrom: '', goingTo: '', stayType: 'Nuitée', mealPlan: 'RB', signature: '', roomNumber: '', checkIn: '', checkOut: '', duration: '', totalPrice: '' });
            
            // Invalider le cache
            setDataCache({});
            await loadData();
        } catch (error) {
            showNotification("Erreur lors de l'enregistrement", "error");
        }
    }, [formData, rooms, user, showNotification, addLog, loadData]);

    // Affichage pendant le chargement avec bouton accessible
    if (isLoading && reservations.length === 0) {
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
                        
                        {/* Informations de base */}
                        <div className="mb-4 sm:mb-6">
                            <h4 className="font-semibold mb-3 text-base sm:text-lg" style={{color: '#7D3837'}}>Informations de base</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
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
                                        <option value="+44">+44</option>
                                        <option value="+49">+49</option>
                                        <option value="+234">+234</option>
                                        <option value="+225">+225</option>
                                    </select>
                                    <input 
                                        placeholder="Téléphone *" 
                                        value={formData.clientPhone}
                                        onChange={(e) => {
                                            const value = e.target.value.replace(/[^0-9]/g, '');
                                            setFormData({...formData, clientPhone: value});
                                        }}
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
                            </div>
                        </div>
                        
                        {/* Réservation */}
                        <div className="mb-4 sm:mb-6">
                            <h4 className="font-semibold mb-3 text-base sm:text-lg" style={{color: '#7D3837'}}>Détails de la réservation</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                                <input 
                                    placeholder="Numéro de chambre *" 
                                    value={formData.roomNumber}
                                    onChange={(e) => setFormData({...formData, roomNumber: e.target.value})}
                                    className="p-3 border rounded-lg w-full" 
                                    style={{borderColor: '#7D3837'}} 
                                />
                                <div className="relative">
                                    <input 
                                        type="date" 
                                        value={formData.checkIn}
                                        min={new Date().toISOString().split('T')[0]}
                                        onChange={(e) => setFormData({...formData, checkIn: e.target.value})}
                                        className="p-3 border rounded-lg w-full" 
                                        style={{borderColor: '#7D3837'}} 
                                    />
                                    <label className="absolute -top-2 left-3 bg-yellow-50 px-1 text-xs" style={{color: '#7D3837'}}>Date d'arrivée *</label>
                                </div>
                                <div className="relative">
                                    <input 
                                        type="date" 
                                        value={formData.checkOut}
                                        min={formData.checkIn || new Date().toISOString().split('T')[0]}
                                        onChange={(e) => setFormData({...formData, checkOut: e.target.value})}
                                        className="p-3 border rounded-lg w-full" 
                                        style={{borderColor: '#7D3837'}} 
                                    />
                                    <label className="absolute -top-2 left-3 bg-yellow-50 px-1 text-xs" style={{color: '#7D3837'}}>Date de départ</label>
                                </div>
                                <input 
                                    type="number"
                                    placeholder="Prix total (FCFA)" 
                                    value={formData.totalPrice}
                                    onChange={(e) => {
                                        const value = e.target.value.replace(/[^0-9]/g, '');
                                        setFormData({...formData, totalPrice: value});
                                    }}
                                    className="p-3 border rounded-lg w-full" 
                                    style={{borderColor: '#7D3837'}} 
                                />
                            </div>
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
                                    setFormData({ clientName: '', phonePrefix: '+237', clientPhone: '', clientEmail: '', address: '', occupation: '', nationality: '', birthPlace: '', residenceCountry: '', idNumber: '', idIssueDate: '', idIssuePlace: '', idExpiryDate: '', gender: '', arrivalMode: 'A pied', plateNumber: '', departureMode: '', comingFrom: '', goingTo: '', stayType: 'Nuitée', mealPlan: 'RB', signature: '', roomNumber: '', checkIn: '', checkOut: '', duration: '', totalPrice: '' });
                                }} 
                                className="px-6 py-3 rounded border hover:bg-yellow-100 transition-colors font-medium" 
                                style={{borderColor: '#7D3837', color: '#7D3837'}}
                            >
                                Annuler
                            </button>
                        </div>
                    </div>
                )}
                
                <div className="flex flex-col items-center justify-center min-h-[300px] space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{borderColor: '#7D3837'}}></div>
                    <div className="text-center">
                        <p className="text-lg font-medium" style={{color: '#7D3837'}}>Chargement des réservations...</p>
                        {loadingStep && <p className="text-sm text-slate-600 mt-2">{loadingStep}</p>}
                    </div>
                </div>
            </div>
        );
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
                
                <div className="flex gap-2 flex-1">
                    <select
                        value={periodFilter}
                        onChange={(e) => setPeriodFilter(e.target.value)}
                        className="px-3 py-2 border rounded-lg text-sm"
                        style={{borderColor: '#7D3837'}}
                    >
                        <option value="all">Toutes les périodes</option>
                        <option value="today">Aujourd'hui</option>
                        <option value="week">Cette semaine</option>
                        <option value="month">Ce mois</option>
                    </select>
                    
                    <input
                        type="text"
                        placeholder="Rechercher par nom, ID ou chambre..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="flex-1 max-w-md px-4 py-2 border rounded-lg"
                        style={{borderColor: '#7D3837'}}
                    />
                </div>
            </div>
            
            {showForm && (
                <div className="bg-yellow-50 border rounded p-4 sm:p-6 mb-4" style={{borderColor: '#7D3837'}}>
                    <h3 className="font-bold mb-4 sm:mb-6 text-lg sm:text-xl" style={{color: '#7D3837'}}>Nouvelle Réservation</h3>
                    
                    {/* Informations de base */}
                    <div className="mb-4 sm:mb-6">
                        <h4 className="font-semibold mb-3 text-base sm:text-lg" style={{color: '#7D3837'}}>Informations de base</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
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
                                    <option value="+44">+44</option>
                                    <option value="+49">+49</option>
                                    <option value="+234">+234</option>
                                    <option value="+225">+225</option>
                                </select>
                                <input 
                                    placeholder="Téléphone *" 
                                    value={formData.clientPhone}
                                    onChange={(e) => {
                                        const value = e.target.value.replace(/[^0-9]/g, '');
                                        setFormData({...formData, clientPhone: value});
                                    }}
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
                            <input 
                                placeholder="Adresse" 
                                value={formData.address}
                                onChange={(e) => setFormData({...formData, address: e.target.value})}
                                className="p-3 border rounded-lg" 
                                style={{borderColor: '#7D3837'}} 
                            />
                            <input 
                                placeholder="Occupation" 
                                value={formData.occupation}
                                onChange={(e) => setFormData({...formData, occupation: e.target.value})}
                                className="p-3 border rounded-lg" 
                                style={{borderColor: '#7D3837'}} 
                            />
                            <select
                                value={formData.gender}
                                onChange={(e) => setFormData({...formData, gender: e.target.value})}
                                className="p-3 border rounded-lg"
                                style={{borderColor: '#7D3837'}}
                            >
                                <option value="">Sexe</option>
                                <option value="Masculin">Masculin</option>
                                <option value="Féminin">Féminin</option>
                            </select>
                        </div>
                    </div>
                    
                    {/* Informations optionnelles */}
                    <div className="mb-4 sm:mb-6">
                        <h4 className="font-semibold mb-3 text-base sm:text-lg" style={{color: '#7D3837'}}>Informations complémentaires (optionnel)</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                            <input 
                                placeholder="Nationalité" 
                                value={formData.nationality}
                                onChange={(e) => setFormData({...formData, nationality: e.target.value})}
                                className="p-3 border rounded-lg" 
                                style={{borderColor: '#7D3837'}} 
                            />
                            <input 
                                placeholder="Lieu de naissance" 
                                value={formData.birthPlace}
                                onChange={(e) => setFormData({...formData, birthPlace: e.target.value})}
                                className="p-3 border rounded-lg" 
                                style={{borderColor: '#7D3837'}} 
                            />
                            <input 
                                placeholder="Pays de résidence" 
                                value={formData.residenceCountry}
                                onChange={(e) => setFormData({...formData, residenceCountry: e.target.value})}
                                className="p-3 border rounded-lg" 
                                style={{borderColor: '#7D3837'}} 
                            />
                            <input 
                                placeholder="No. pièce d'identité" 
                                value={formData.idNumber}
                                onChange={(e) => setFormData({...formData, idNumber: e.target.value})}
                                className="p-3 border rounded-lg" 
                                style={{borderColor: '#7D3837'}} 
                            />
                            <div className="relative">
                                <input 
                                    type="date" 
                                    value={formData.idIssueDate}
                                    onChange={(e) => setFormData({...formData, idIssueDate: e.target.value})}
                                    className="p-3 border rounded-lg w-full" 
                                    style={{borderColor: '#7D3837'}} 
                                />
                                <label className="absolute -top-2 left-3 bg-yellow-50 px-1 text-xs" style={{color: '#7D3837'}}>Date délivrance ID</label>
                            </div>
                            <input 
                                placeholder="Lieu délivrance ID" 
                                value={formData.idIssuePlace}
                                onChange={(e) => setFormData({...formData, idIssuePlace: e.target.value})}
                                className="p-3 border rounded-lg" 
                                style={{borderColor: '#7D3837'}} 
                            />
                        </div>
                    </div>
                    
                    {/* Réservation */}
                    <div className="mb-4 sm:mb-6">
                        <h4 className="font-semibold mb-3 text-base sm:text-lg" style={{color: '#7D3837'}}>Détails de la réservation</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
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
                            <div className="relative">
                                <input 
                                    type="date" 
                                    value={formData.checkIn}
                                    min={new Date().toISOString().split('T')[0]}
                                    onChange={(e) => setFormData({...formData, checkIn: e.target.value})}
                                    className="p-3 border rounded-lg w-full" 
                                    style={{borderColor: '#7D3837'}} 
                                />
                                <label className="absolute -top-2 left-3 bg-yellow-50 px-1 text-xs" style={{color: '#7D3837'}}>Date d'arrivée *</label>
                            </div>
                            <div className="relative">
                                <input 
                                    type="date" 
                                    value={formData.checkOut}
                                    min={formData.checkIn || new Date().toISOString().split('T')[0]}
                                    onChange={(e) => setFormData({...formData, checkOut: e.target.value})}
                                    className="p-3 border rounded-lg w-full" 
                                    style={{borderColor: '#7D3837'}} 
                                />
                                <label className="absolute -top-2 left-3 bg-yellow-50 px-1 text-xs" style={{color: '#7D3837'}}>Date de départ</label>
                            </div>
                            <div className="relative">
                                <input 
                                    type="number"
                                    placeholder="Prix total (FCFA)" 
                                    value={formData.totalPrice}
                                    onChange={(e) => {
                                        const value = e.target.value.replace(/[^0-9]/g, '');
                                        setFormData({...formData, totalPrice: value});
                                    }}
                                    className="p-3 border rounded-lg w-full" 
                                    style={{borderColor: '#7D3837'}} 
                                />
                                {formData.roomNumber && formData.checkIn && formData.checkOut && (
                                    <div className="absolute -top-2 right-3 bg-yellow-50 px-2 py-1 text-xs rounded" style={{color: '#7D3837'}}>
                                        {Math.ceil((new Date(formData.checkOut).getTime() - new Date(formData.checkIn).getTime()) / (1000 * 60 * 60 * 24))} nuit(s)
                                    </div>
                                )}
                            </div>
                        </div>
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
                                setFormData({ clientName: '', phonePrefix: '+237', clientPhone: '', clientEmail: '', address: '', occupation: '', nationality: '', birthPlace: '', residenceCountry: '', idNumber: '', idIssueDate: '', idIssuePlace: '', idExpiryDate: '', gender: '', arrivalMode: 'A pied', plateNumber: '', departureMode: '', comingFrom: '', goingTo: '', stayType: 'Nuitée', mealPlan: 'RB', signature: '', roomNumber: '', checkIn: '', checkOut: '', duration: '', totalPrice: '' });
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
                                {filteredReservations.length} réservation(s)
                                {periodFilter !== 'all' && (
                                    <span className="ml-1 text-slate-500">(
                                        {periodFilter === 'today' ? "aujourd'hui" :
                                         periodFilter === 'week' ? 'cette semaine' :
                                         periodFilter === 'month' ? 'ce mois' : ''}
                                    )</span>
                                )}
                            </span>
                            {isSyncing && (
                                <div className="flex items-center gap-2 text-xs text-slate-600">
                                    <div className="animate-spin rounded-full h-3 w-3 border border-slate-400 border-t-transparent"></div>
                                    <span>Synchronisation...</span>
                                </div>
                            )}
                            <button 
                                onClick={() => {
                                    setDataCache({});
                                    loadData();
                                }}
                                disabled={isSyncing}
                                className="px-3 sm:px-4 py-2 text-xs sm:text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors disabled:opacity-50"
                            >
                                Actualiser
                            </button>
                        </div>
                    </div>
                </div>
                
                <div className="p-4 sm:p-6">
                    {filteredReservations.length === 0 ? (
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
                            {filteredReservations.map((reservation, index) => (
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
                                    
                                    {/* Boutons d'action */}
                                    <div className="flex gap-2 mb-3">
                                        <button
                                            onClick={() => window.print()}
                                            className="px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded text-xs transition-colors"
                                            title="Imprimer"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                            </svg>
                                        </button>
                                        {(user?.role === 'admin' || user?.role === 'super_admin') && (
                                            <>
                                                <button
                                                    className="px-3 py-1 bg-green-100 hover:bg-green-200 text-green-700 rounded text-xs transition-colors"
                                                    title="Modifier"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded text-xs transition-colors"
                                                    title="Supprimer"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </>
                                        )}
                                    </div>
                                    
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