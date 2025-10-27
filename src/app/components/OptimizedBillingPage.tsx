"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { saveData, loadFromFirebase } from "../utils/syncData";
import { useNotificationContext } from "../context/NotificationContext";
import { formatPrice } from "../utils/formatPrice";
import { useActivityLog } from "../context/ActivityLogContext";
import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "./LoadingSpinner";

interface Bill {
    id: string;
    date: string;
    amount: string;
    receivedFrom: string;
    amountInWords: string;
    motif: 'Repos' | 'Nuitée';
    roomNumber: string;
    clientSignature: string;
}

export default function OptimizedBillingPage() {
    const [showForm, setShowForm] = useState(false);
    const [bills, setBills] = useState<Bill[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    
    const { showNotification } = useNotificationContext();
    const { addLog } = useActivityLog();
    const { user } = useAuth();
    
    const [formData, setFormData] = useState({
        date: '',
        amount: '',
        receivedFrom: '',
        amountInWords: '',
        motif: 'Nuitée' as 'Repos' | 'Nuitée',
        startTime: '',
        endTime: '',
        startDate: '',
        endDate: '',
        roomNumber: '',
        advance: '',
        remaining: '',
        clientSignature: ''
    });

    // Cache simple
    const [dataCache, setDataCache] = useState<{
        bills?: Bill[];
        timestamp?: number;
    }>({});

    const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes

    const generateBillId = () => `B${Date.now().toString().slice(-4)}${Math.random().toString(36).substr(2, 3).toUpperCase()}`;

    // Conversion simplifiée en mots
    const convertNumberToWords = useCallback((num: number): string => {
        if (num === 0) return 'zéro';
        if (num < 1000) return `${num}`;
        if (num < 1000000) return `${Math.floor(num / 1000)} mille ${num % 1000 || ''}`.trim();
        return num.toString();
    }, []);

    const loadBills = useCallback(async () => {
        const now = Date.now();
        
        // Vérifier le cache
        if (dataCache.timestamp && (now - dataCache.timestamp) < CACHE_DURATION && dataCache.bills) {
            setBills(dataCache.bills);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        try {
            const billsData = await loadFromFirebase('bills').catch(() => 
                JSON.parse(localStorage.getItem('bills') || '[]')
            );
            
            const validBills = Array.isArray(billsData) ? billsData : [];
            setBills(validBills);
            
            // Mettre à jour le cache
            setDataCache({
                bills: validBills,
                timestamp: now
            });
        } catch (error) {
            console.warn('Error loading bills:', error);
            setBills([]);
        } finally {
            setIsLoading(false);
        }
    }, [dataCache.timestamp]);

    // Filtrage optimisé
    const filteredBills = useMemo(() => {
        if (!searchTerm.trim()) return bills;
        
        const term = searchTerm.toLowerCase();
        return bills.filter(bill => 
            bill.receivedFrom.toLowerCase().includes(term) ||
            bill.id.toLowerCase().includes(term) ||
            bill.roomNumber.toLowerCase().includes(term)
        );
    }, [bills, searchTerm]);

    useEffect(() => {
        loadBills();
    }, []);

    const handleSaveBill = useCallback(async () => {
        const requiredFields = ['date', 'amount', 'receivedFrom', 'roomNumber', 'clientSignature'];
        const missingFields = requiredFields.filter(field => !formData[field as keyof typeof formData]);
        
        if (missingFields.length > 0) {
            showNotification("Veuillez remplir tous les champs obligatoires", "error");
            return;
        }
        
        try {
            const billData = { 
                ...formData, 
                id: generateBillId(),
                createdBy: user?.username || 'system'
            };
            
            await saveData('bills', billData);
            addLog('Création facture', 'bills', `Facture: ${formData.receivedFrom} - ${formatPrice(formData.amount)}`, billData);
            showNotification("Reçu enregistré avec succès!", "success");
            
            setShowForm(false);
            setFormData({
                date: '', amount: '', receivedFrom: '', amountInWords: '', motif: 'Nuitée',
                roomNumber: '', clientSignature: ''
            });
            
            // Invalider le cache
            setDataCache({});
            await loadBills();
        } catch (error) {
            showNotification("Erreur lors de l'enregistrement", "error");
        }
    }, [formData, user, showNotification, addLog, loadBills]);

    if (isLoading) {
        return <LoadingSpinner size="lg" text="Chargement des reçus..." />;
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6" style={{color: '#7D3837'}}>Reçus</h1>
            
            <div className="mb-4 flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
                <button 
                    onClick={() => setShowForm(true)}
                    style={{backgroundColor: '#7D3837'}} 
                    className="text-yellow-300 px-4 py-3 sm:py-2 rounded hover:bg-opacity-80 font-medium"
                >
                    Nouveau Reçu
                </button>
                <input
                    type="text"
                    placeholder="Rechercher un reçu..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 max-w-md px-4 py-2 border rounded-lg"
                    style={{borderColor: '#7D3837'}}
                />
            </div>
            
            {showForm && (
                <div className="bg-yellow-50 border rounded p-4 sm:p-6 mb-4" style={{borderColor: '#7D3837'}}>
                    <h3 className="font-bold mb-4 sm:mb-6 text-lg sm:text-xl" style={{color: '#7D3837'}}>Nouveau Reçu</h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
                        <div className="relative">
                            <input 
                                type="date" 
                                value={formData.date}
                                onChange={(e) => setFormData({...formData, date: e.target.value})}
                                className="p-3 border rounded-lg w-full" 
                                style={{borderColor: '#7D3837'}} 
                            />
                            <label className="absolute -top-2 left-3 bg-yellow-50 px-1 text-xs" style={{color: '#7D3837'}}>Date *</label>
                        </div>
                        
                        <input 
                            type="number"
                            placeholder="Montant *" 
                            value={formData.amount}
                            onChange={(e) => {
                                const value = e.target.value.replace(/[^0-9]/g, '');
                                const words = value ? convertNumberToWords(parseInt(value)) + ' francs CFA' : '';
                                setFormData({...formData, amount: value, amountInWords: words});
                            }}
                            className="p-3 border rounded-lg" 
                            style={{borderColor: '#7D3837'}} 
                        />
                        
                        <input 
                            placeholder="Reçu de M. *" 
                            value={formData.receivedFrom}
                            onChange={(e) => setFormData({...formData, receivedFrom: e.target.value})}
                            className="p-3 border rounded-lg" 
                            style={{borderColor: '#7D3837'}} 
                        />
                        
                        <input 
                            placeholder="La somme de (en lettres) *" 
                            value={formData.amountInWords}
                            onChange={(e) => setFormData({...formData, amountInWords: e.target.value})}
                            className="p-3 border rounded-lg col-span-full" 
                            style={{borderColor: '#7D3837'}} 
                        />
                    </div>
                    
                    <div className="mb-4 sm:mb-6">
                        <h4 className="font-semibold mb-3 text-base sm:text-lg" style={{color: '#7D3837'}}>Motif *</h4>
                        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 mb-4">
                            <label className="flex items-center">
                                <input
                                    type="radio"
                                    name="motif"
                                    value="Repos"
                                    checked={formData.motif === 'Repos'}
                                    onChange={(e) => setFormData({...formData, motif: e.target.value as 'Repos' | 'Nuitée'})}
                                    className="mr-2"
                                />
                                Repos
                            </label>
                            <label className="flex items-center">
                                <input
                                    type="radio"
                                    name="motif"
                                    value="Nuitée"
                                    checked={formData.motif === 'Nuitée'}
                                    onChange={(e) => setFormData({...formData, motif: e.target.value as 'Repos' | 'Nuitée'})}
                                    className="mr-2"
                                />
                                Nuitée
                            </label>
                        </div>
                        
                        {formData.motif === 'Repos' ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                <div className="relative">
                                    <input 
                                        type="time" 
                                        value={formData.startTime}
                                        onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                                        className="p-3 border rounded-lg w-full" 
                                        style={{borderColor: '#7D3837'}} 
                                    />
                                    <label className="absolute -top-2 left-3 bg-yellow-50 px-1 text-xs" style={{color: '#7D3837'}}>Heure de début *</label>
                                </div>
                                <div className="relative">
                                    <input 
                                        type="time" 
                                        value={formData.endTime}
                                        onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                                        className="p-3 border rounded-lg w-full" 
                                        style={{borderColor: '#7D3837'}} 
                                    />
                                    <label className="absolute -top-2 left-3 bg-yellow-50 px-1 text-xs" style={{color: '#7D3837'}}>Heure de fin *</label>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                <div className="relative">
                                    <input 
                                        type="date" 
                                        value={formData.startDate}
                                        onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                                        className="p-3 border rounded-lg w-full" 
                                        style={{borderColor: '#7D3837'}} 
                                    />
                                    <label className="absolute -top-2 left-3 bg-yellow-50 px-1 text-xs" style={{color: '#7D3837'}}>Date de début *</label>
                                </div>
                                <div className="relative">
                                    <input 
                                        type="date" 
                                        value={formData.endDate}
                                        onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                                        className="p-3 border rounded-lg w-full" 
                                        style={{borderColor: '#7D3837'}} 
                                    />
                                    <label className="absolute -top-2 left-3 bg-yellow-50 px-1 text-xs" style={{color: '#7D3837'}}>Date de fin *</label>
                                </div>
                            </div>
                        )}
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
                        <input 
                            placeholder="No. de chambre *" 
                            value={formData.roomNumber}
                            onChange={(e) => setFormData({...formData, roomNumber: e.target.value})}
                            className="p-3 border rounded-lg" 
                            style={{borderColor: '#7D3837'}} 
                        />
                        
                        <input 
                            type="number"
                            placeholder="Avance" 
                            value={formData.advance}
                            onChange={(e) => {
                                const value = e.target.value.replace(/[^0-9]/g, '');
                                const amount = parseInt(formData.amount) || 0;
                                const advance = parseInt(value) || 0;
                                const remaining = Math.max(0, amount - advance).toString();
                                setFormData({...formData, advance: value, remaining});
                            }}
                            className="p-3 border rounded-lg" 
                            style={{borderColor: '#7D3837'}} 
                        />
                        
                        <input 
                            type="number"
                            placeholder="Reste" 
                            value={formData.remaining}
                            readOnly
                            className="p-3 border rounded-lg bg-gray-100" 
                            style={{borderColor: '#7D3837'}} 
                        />
                        
                        <input 
                            placeholder="Signature client *" 
                            value={formData.clientSignature}
                            onChange={(e) => setFormData({...formData, clientSignature: e.target.value})}
                            className="p-3 border rounded-lg" 
                            style={{borderColor: '#7D3837'}} 
                        />
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-3">
                        <button 
                            onClick={handleSaveBill}
                            style={{backgroundColor: '#7D3837'}} 
                            className="text-yellow-300 px-6 py-3 rounded hover:opacity-80 transition-opacity font-medium"
                        >
                            Enregistrer
                        </button>
                        <button 
                            onClick={() => {
                                setShowForm(false);
                                setFormData({
                                    date: '', amount: '', receivedFrom: '', amountInWords: '', motif: 'Nuitée',
                                    startTime: '', endTime: '', startDate: '', endDate: '', roomNumber: '',
                                    advance: '', remaining: '', clientSignature: ''
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
                        <h2 className="text-lg sm:text-xl font-semibold text-slate-800">Liste des Reçus</h2>
                        <div className="flex items-center gap-3">
                            <span className="text-xs sm:text-sm text-slate-600 bg-slate-100 px-2 sm:px-3 py-1 rounded-full">
                                {filteredBills.length} reçu(s)
                            </span>
                            <button 
                                onClick={() => {
                                    setDataCache({});
                                    loadBills();
                                }}
                                className="px-3 sm:px-4 py-2 text-xs sm:text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                            >
                                Actualiser
                            </button>
                        </div>
                    </div>
                </div>
                
                <div className="p-4 sm:p-6">
                    {filteredBills.length === 0 ? (
                        <div className="text-center py-8 sm:py-12">
                            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <p className="text-slate-500 text-base sm:text-lg font-medium">Aucun reçu</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                            {filteredBills.map((bill, index) => (
                                <div key={`${bill.id}-${index}`} className="bg-gradient-to-br from-white to-slate-50 p-4 sm:p-5 rounded-xl border border-slate-200 hover:shadow-lg transition-all">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                                            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                        </div>
                                        <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                                            {bill.date}
                                        </span>
                                    </div>
                                    
                                    <h3 className="font-semibold text-slate-800 text-base sm:text-lg mb-3">{bill.receivedFrom}</h3>
                                    
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs sm:text-sm text-slate-600">Montant</span>
                                            <span className="text-base sm:text-lg font-bold text-purple-600">{formatPrice(bill.amount)}</span>
                                        </div>
                                        
                                        <div className="pt-3 border-t border-slate-200 space-y-2">
                                            <div className="flex justify-between text-xs sm:text-sm">
                                                <span className="text-slate-600">Motif:</span>
                                                <span className="font-medium">{bill.motif}</span>
                                            </div>
                                            <div className="flex justify-between text-xs sm:text-sm">
                                                <span className="text-slate-600">Chambre:</span>
                                                <span className="font-medium">{bill.roomNumber}</span>
                                            </div>
                                        </div>
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