"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { saveData, loadFromFirebase } from "../utils/syncData";
import { useNotificationContext } from "../context/NotificationContext";
import { useActivityLog } from "../context/ActivityLogContext";
import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "./LoadingSpinner";

interface Client {
    id: string;
    name: string;
    phone: string;
    email: string;
    address: string;
    nationality: string;
}

export default function OptimizedClientsPage() {
    const [showForm, setShowForm] = useState(false);
    const [clients, setClients] = useState<Client[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [periodFilter, setPeriodFilter] = useState('all');
    
    const { showNotification } = useNotificationContext();
    const { addLog } = useActivityLog();
    const { user } = useAuth();
    
    const [formData, setFormData] = useState({
        name: '',
        phonePrefix: '+237',
        phone: '',
        email: '',
        address: '',
        occupation: '',
        nationality: '',
        birthPlace: '',
        residenceCountry: '',
        idNumber: '',
        idIssueDate: '',
        idIssuePlace: '',
        idExpiryDate: '',
        arrivalMode: 'A pied',
        arrivalDate: '',
        plateNumber: '',
        departureMode: '',
        departureDate: '',
        gender: '',
        comingFrom: '',
        goingTo: '',
        stayType: 'Nuitée',
        mealPlan: 'RB',
        price: '',
        signature: ''
    });

    // Cache simple
    const [dataCache, setDataCache] = useState<{
        clients?: Client[];
        timestamp?: number;
    }>({});

    const CACHE_DURATION = 3 * 60 * 1000; // 3 minutes

    const generateClientId = () => `C${Date.now().toString().slice(-4)}${Math.random().toString(36).substr(2, 3).toUpperCase()}`;

    const loadClients = useCallback(async () => {
        const now = Date.now();
        
        // Vérifier le cache
        if (dataCache.timestamp && (now - dataCache.timestamp) < CACHE_DURATION && dataCache.clients) {
            setClients(dataCache.clients);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        try {
            const clientsData = await loadFromFirebase('clients').catch(() => 
                JSON.parse(localStorage.getItem('clients') || '[]')
            );
            
            const validClients = Array.isArray(clientsData) ? clientsData : [];
            setClients(validClients);
            
            // Mettre à jour le cache
            setDataCache({
                clients: validClients,
                timestamp: now
            });
        } catch (error) {
            console.warn('Error loading clients:', error);
            setClients([]);
        } finally {
            setIsLoading(false);
        }
    }, [dataCache.timestamp]);

    // Filtrage par période
    const periodFilteredClients = useMemo(() => {
        if (periodFilter === 'all') return clients;
        
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        
        return clients.filter(client => {
            if (!client.createdAt) return false;
            const clientDate = new Date(client.createdAt);
            
            switch (periodFilter) {
                case 'today':
                    return clientDate.toISOString().split('T')[0] === today;
                case 'week':
                    const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
                    const weekEnd = new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000);
                    return clientDate >= weekStart && clientDate <= weekEnd;
                case 'month':
                    return clientDate.getMonth() === now.getMonth() && clientDate.getFullYear() === now.getFullYear();
                default:
                    return true;
            }
        });
    }, [clients, periodFilter]);

    // Filtrage par recherche (nom, ID, téléphone, email)
    const filteredClients = useMemo(() => {
        if (!searchTerm.trim()) return periodFilteredClients;
        
        const term = searchTerm.toLowerCase();
        return periodFilteredClients.filter(client => 
            client.name.toLowerCase().includes(term) ||
            client.id.toLowerCase().includes(term) ||
            client.phone.toLowerCase().includes(term) ||
            client.email.toLowerCase().includes(term)
        );
    }, [periodFilteredClients, searchTerm]);

    useEffect(() => {
        loadClients();
    }, []);

    const handleSaveClient = useCallback(async () => {
        const requiredFields = ['name', 'phone', 'email', 'nationality'];
        const missingFields = requiredFields.filter(field => !formData[field as keyof typeof formData]);
        
        if (missingFields.length > 0) {
            showNotification("Veuillez remplir tous les champs obligatoires", "error");
            return;
        }
        
        try {
            const clientWithId = { 
                ...formData, 
                id: generateClientId(),
                phone: `${formData.phonePrefix} ${formData.phone}`,
                createdBy: user?.username || 'system'
            };
            
            await saveData('clients', clientWithId);
            addLog('Création client', 'clients', `Client créé: ${formData.name}`, clientWithId);
            showNotification("Client enregistré avec succès!", "success");
            
            setShowForm(false);
            setFormData({ 
                name: '', phonePrefix: '+237', phone: '', email: '', address: '', occupation: '', nationality: '', 
                birthPlace: '', residenceCountry: '', idNumber: '', idIssueDate: '', idIssuePlace: '',
                idExpiryDate: '', arrivalMode: 'A pied', arrivalDate: '', plateNumber: '', departureMode: '', 
                departureDate: '', gender: '', comingFrom: '', goingTo: '', stayType: 'Nuitée', mealPlan: 'RB', price: '', signature: '' 
            });
            
            // Invalider le cache
            setDataCache({});
            await loadClients();
        } catch (error) {
            showNotification("Erreur lors de l'enregistrement", "error");
        }
    }, [formData, user, showNotification, addLog, loadClients]);

    if (isLoading) {
        return <LoadingSpinner size="lg" text="Chargement des clients..." />;
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6" style={{color: '#7D3837'}}>Clients</h1>
            
            <div className="mb-4 flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
                <button 
                    onClick={() => setShowForm(true)}
                    style={{backgroundColor: '#7D3837'}} 
                    className="text-yellow-300 px-4 py-3 sm:py-2 rounded hover:bg-opacity-80 font-medium"
                >
                    Nouveau Client
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
                        placeholder="Rechercher par nom, ID, téléphone ou email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="flex-1 max-w-md px-4 py-2 border rounded-lg"
                        style={{borderColor: '#7D3837'}}
                    />
                </div>
            </div>
            
            {showForm && (
                <div className="bg-yellow-50 border rounded p-4 sm:p-6 mb-4" style={{borderColor: '#7D3837'}}>
                    <h3 className="font-bold mb-4 sm:mb-6 text-lg sm:text-xl" style={{color: '#7D3837'}}>Nouveau Client</h3>
                    
                    {/* Informations personnelles */}
                    <div className="mb-4 sm:mb-6">
                        <h4 className="font-semibold mb-3 text-base sm:text-lg" style={{color: '#7D3837'}}>Informations personnelles</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                            <input 
                                placeholder="Nom complet *" 
                                value={formData.name}
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
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
                                    value={formData.phone}
                                    onChange={(e) => {
                                        const value = e.target.value.replace(/[^0-9]/g, '');
                                        setFormData({...formData, phone: value});
                                    }}
                                    className="p-3 border rounded-lg flex-1" 
                                    style={{borderColor: '#7D3837'}} 
                                />
                            </div>
                            <input 
                                placeholder="Email *" 
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({...formData, email: e.target.value})}
                                className="p-3 border rounded-lg" 
                                style={{borderColor: '#7D3837'}} 
                            />
                            <input 
                                placeholder="Occupation *" 
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
                                <option value="">Sexe *</option>
                                <option value="Masculin">Masculin</option>
                                <option value="Féminin">Féminin</option>
                            </select>
                            <input 
                                placeholder="Nationalité *" 
                                value={formData.nationality}
                                onChange={(e) => setFormData({...formData, nationality: e.target.value})}
                                className="p-3 border rounded-lg" 
                                style={{borderColor: '#7D3837'}} 
                            />
                        </div>
                    </div>

                    {/* Adresses et lieux */}
                    <div className="mb-4 sm:mb-6">
                        <h4 className="font-semibold mb-3 text-base sm:text-lg" style={{color: '#7D3837'}}>Adresses et lieux</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                            <input 
                                placeholder="Lieu de naissance *" 
                                value={formData.birthPlace}
                                onChange={(e) => setFormData({...formData, birthPlace: e.target.value})}
                                className="p-3 border rounded-lg" 
                                style={{borderColor: '#7D3837'}} 
                            />
                            <input 
                                placeholder="Pays de résidence *" 
                                value={formData.residenceCountry}
                                onChange={(e) => setFormData({...formData, residenceCountry: e.target.value})}
                                className="p-3 border rounded-lg" 
                                style={{borderColor: '#7D3837'}} 
                            />
                            <input 
                                placeholder="Adresse *" 
                                value={formData.address}
                                onChange={(e) => setFormData({...formData, address: e.target.value})}
                                className="p-3 border rounded-lg col-span-full" 
                                style={{borderColor: '#7D3837'}} 
                            />
                        </div>
                    </div>

                    {/* Pièce d'identification */}
                    <div className="mb-4 sm:mb-6">
                        <h4 className="font-semibold mb-3 text-base sm:text-lg" style={{color: '#7D3837'}}>Pièce d'identification</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                            <input 
                                placeholder="No. Pièce d'identification *" 
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
                                <label className="absolute -top-2 left-3 bg-yellow-50 px-1 text-xs" style={{color: '#7D3837'}}>Date de délivrance *</label>
                            </div>
                            <input 
                                placeholder="Lieu de délivrance *" 
                                value={formData.idIssuePlace}
                                onChange={(e) => setFormData({...formData, idIssuePlace: e.target.value})}
                                className="p-3 border rounded-lg" 
                                style={{borderColor: '#7D3837'}} 
                            />
                            <div className="relative">
                                <input 
                                    type="date" 
                                    value={formData.idExpiryDate}
                                    onChange={(e) => setFormData({...formData, idExpiryDate: e.target.value})}
                                    className="p-3 border rounded-lg w-full" 
                                    style={{borderColor: '#7D3837'}} 
                                />
                                <label className="absolute -top-2 left-3 bg-yellow-50 px-1 text-xs" style={{color: '#7D3837'}}>Date d'expiration *</label>
                            </div>
                        </div>
                    </div>

                    {/* Transport et déplacement */}
                    <div className="mb-4 sm:mb-6">
                        <h4 className="font-semibold mb-3 text-base sm:text-lg" style={{color: '#7D3837'}}>Transport et déplacement</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-2" style={{color: '#7D3837'}}>Mode d'arrivée *</label>
                                <div className="flex gap-4">
                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            name="arrivalMode"
                                            value="A pied"
                                            checked={formData.arrivalMode === 'A pied'}
                                            onChange={(e) => setFormData({...formData, arrivalMode: e.target.value, plateNumber: ''})}
                                            className="mr-2"
                                        />
                                        A pied
                                    </label>
                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            name="arrivalMode"
                                            value="En voiture"
                                            checked={formData.arrivalMode === 'En voiture'}
                                            onChange={(e) => setFormData({...formData, arrivalMode: e.target.value})}
                                            className="mr-2"
                                        />
                                        En voiture
                                    </label>
                                </div>
                            </div>
                            
                            <div className="relative">
                                <input 
                                    type="date" 
                                    value={formData.arrivalDate}
                                    onChange={(e) => setFormData({...formData, arrivalDate: e.target.value})}
                                    className="p-3 border rounded-lg w-full" 
                                    style={{borderColor: '#7D3837'}} 
                                />
                                <label className="absolute -top-2 left-3 bg-yellow-50 px-1 text-xs" style={{color: '#7D3837'}}>Date d'arrivée *</label>
                            </div>
                            
                            {formData.arrivalMode === 'En voiture' && (
                                <input 
                                    placeholder="No. plaque d'immatriculation *" 
                                    value={formData.plateNumber}
                                    onChange={(e) => setFormData({...formData, plateNumber: e.target.value})}
                                    className="p-3 border rounded-lg" 
                                    style={{borderColor: '#7D3837'}} 
                                />
                            )}
                            
                            <input 
                                placeholder="Mode de départ *" 
                                value={formData.departureMode}
                                onChange={(e) => setFormData({...formData, departureMode: e.target.value})}
                                className="p-3 border rounded-lg" 
                                style={{borderColor: '#7D3837'}} 
                            />
                            
                            <div className="relative">
                                <input 
                                    type="date" 
                                    value={formData.departureDate}
                                    onChange={(e) => setFormData({...formData, departureDate: e.target.value})}
                                    className="p-3 border rounded-lg w-full" 
                                    style={{borderColor: '#7D3837'}} 
                                />
                                <label className="absolute -top-2 left-3 bg-yellow-50 px-1 text-xs" style={{color: '#7D3837'}}>Date de départ *</label>
                            </div>
                            
                            <input 
                                placeholder="Venant de" 
                                value={formData.comingFrom}
                                onChange={(e) => setFormData({...formData, comingFrom: e.target.value})}
                                className="p-3 border rounded-lg" 
                                style={{borderColor: '#7D3837'}} 
                            />
                            
                            <input 
                                placeholder="Allant à" 
                                value={formData.goingTo}
                                onChange={(e) => setFormData({...formData, goingTo: e.target.value})}
                                className="p-3 border rounded-lg" 
                                style={{borderColor: '#7D3837'}} 
                            />
                        </div>
                    </div>

                    {/* Séjour et tarification */}
                    <div className="mb-4 sm:mb-6">
                        <h4 className="font-semibold mb-3 text-base sm:text-lg" style={{color: '#7D3837'}}>Séjour et tarification</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-2" style={{color: '#7D3837'}}>Type de séjour *</label>
                                <div className="flex gap-4">
                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            name="stayType"
                                            value="Nuitée"
                                            checked={formData.stayType === 'Nuitée'}
                                            onChange={(e) => setFormData({...formData, stayType: e.target.value})}
                                            className="mr-2"
                                        />
                                        Nuitée
                                    </label>
                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            name="stayType"
                                            value="Sieste"
                                            checked={formData.stayType === 'Sieste'}
                                            onChange={(e) => setFormData({...formData, stayType: e.target.value})}
                                            className="mr-2"
                                        />
                                        Sieste
                                    </label>
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium mb-2" style={{color: '#7D3837'}}>Étage *</label>
                                <div className="flex gap-2">
                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            name="mealPlan"
                                            value="RB"
                                            checked={formData.mealPlan === 'RB'}
                                            onChange={(e) => setFormData({...formData, mealPlan: e.target.value})}
                                            className="mr-1"
                                        />
                                        RB
                                    </label>
                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            name="mealPlan"
                                            value="HB"
                                            checked={formData.mealPlan === 'HB'}
                                            onChange={(e) => setFormData({...formData, mealPlan: e.target.value})}
                                            className="mr-1"
                                        />
                                        HB
                                    </label>
                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            name="mealPlan"
                                            value="FB"
                                            checked={formData.mealPlan === 'FB'}
                                            onChange={(e) => setFormData({...formData, mealPlan: e.target.value})}
                                            className="mr-1"
                                        />
                                        FB
                                    </label>
                                </div>
                            </div>
                            
                            <input 
                                type="number"
                                placeholder="Prix *" 
                                value={formData.price}
                                onChange={(e) => {
                                    const value = e.target.value.replace(/[^0-9]/g, '');
                                    setFormData({...formData, price: value});
                                }}
                                className="p-3 border rounded-lg" 
                                style={{borderColor: '#7D3837'}} 
                            />
                            
                            <input 
                                placeholder="Signature" 
                                value={formData.signature}
                                onChange={(e) => setFormData({...formData, signature: e.target.value})}
                                className="p-3 border rounded-lg" 
                                style={{borderColor: '#7D3837'}} 
                            />
                        </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-3">
                        <button 
                            onClick={handleSaveClient}
                            style={{backgroundColor: '#7D3837'}} 
                            className="text-yellow-300 px-6 py-3 rounded hover:opacity-80 transition-opacity font-medium"
                        >
                            Enregistrer
                        </button>
                        <button 
                            onClick={() => {
                                setShowForm(false);
                                setFormData({ 
                                    name: '', phonePrefix: '+237', phone: '', email: '', address: '', occupation: '', nationality: '', 
                                    birthPlace: '', residenceCountry: '', idNumber: '', idIssueDate: '', idIssuePlace: '',
                                    idExpiryDate: '', arrivalMode: 'A pied', arrivalDate: '', plateNumber: '', departureMode: '', 
                                    departureDate: '', gender: '', comingFrom: '', goingTo: '', stayType: 'Nuitée', mealPlan: 'RB', price: '', signature: '' 
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
                        <h2 className="text-lg sm:text-xl font-semibold text-slate-800">Liste des Clients</h2>
                        <div className="flex items-center gap-3">
                            <span className="text-xs sm:text-sm text-slate-600 bg-slate-100 px-2 sm:px-3 py-1 rounded-full">
                                {filteredClients.length} client(s)
                                {periodFilter !== 'all' && (
                                    <span className="ml-1 text-slate-500">(
                                        {periodFilter === 'today' ? "aujourd'hui" :
                                         periodFilter === 'week' ? 'cette semaine' :
                                         periodFilter === 'month' ? 'ce mois' : ''}
                                    )</span>
                                )}
                            </span>
                            <button 
                                onClick={() => {
                                    setDataCache({});
                                    loadClients();
                                }}
                                className="px-3 sm:px-4 py-2 text-xs sm:text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                            >
                                Actualiser
                            </button>
                        </div>
                    </div>
                </div>
                
                <div className="p-4 sm:p-6">
                    {filteredClients.length === 0 ? (
                        <div className="text-center py-8 sm:py-12">
                            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                            <p className="text-slate-500 text-base sm:text-lg font-medium">
                                {searchTerm ? 'Aucun client trouvé' : 'Aucun client enregistré'}
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                            {filteredClients.map((client, index) => (
                                <div key={`${client.id}-${index}`} className="bg-gradient-to-br from-white to-slate-50 p-4 sm:p-5 rounded-xl border border-slate-200 hover:shadow-md transition-all">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center" style={{backgroundColor: '#fff590'}}>
                                            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                        </div>
                                    </div>
                                    
                                    <div className="mb-3">
                                        <h3 className="font-semibold text-slate-800 text-base sm:text-lg">{client.name}</h3>
                                        <p className="text-xs text-slate-500 font-mono">ID: {client.id}</p>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-xs sm:text-sm">
                                            <svg className="w-3 h-3 sm:w-4 sm:h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                            </svg>
                                            <span className="text-slate-600 truncate">{client.phone}</span>
                                        </div>
                                        {client.email && (
                                            <div className="flex items-center gap-2 text-xs sm:text-sm">
                                                <svg className="w-3 h-3 sm:w-4 sm:h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                </svg>
                                                <span className="text-slate-600 truncate">{client.email}</span>
                                            </div>
                                        )}
                                        {client.nationality && (
                                            <div className="flex items-center gap-2 text-xs sm:text-sm">
                                                <svg className="w-3 h-3 sm:w-4 sm:h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <span className="text-slate-600">{client.nationality}</span>
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