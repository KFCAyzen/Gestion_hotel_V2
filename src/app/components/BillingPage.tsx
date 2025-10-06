"use client";

import { useState, useEffect } from "react";
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
    startTime?: string;
    endTime?: string;
    startDate?: string;
    endDate?: string;
    roomNumber: string;
    advance: string;
    remaining: string;
    clientSignature: string;
}

export default function BillingPage() {
    const [showForm, setShowForm] = useState(false);
    const [bills, setBills] = useState<Bill[]>([]);
    const [filteredBills, setFilteredBills] = useState<Bill[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { showNotification } = useNotificationContext();
    const { addLog } = useActivityLog();
    const { user } = useAuth();
    
    const generateBillId = () => {
        const timestamp = Date.now().toString().slice(-4);
        const random = Math.random().toString(36).substr(2, 3).toUpperCase();
        return `B${timestamp}${random}`;
    };
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

    const convertNumberToWords = (num: number): string => {
        const ones = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf'];
        const teens = ['dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
        const tens = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante-dix', 'quatre-vingt', 'quatre-vingt-dix'];
        
        if (num === 0) return 'zéro';
        if (num < 10) return ones[num];
        if (num < 20) return teens[num - 10];
        if (num < 100) {
            const ten = Math.floor(num / 10);
            const one = num % 10;
            if (ten === 7) return 'soixante-' + (one === 0 ? 'dix' : teens[one]);
            if (ten === 9) return 'quatre-vingt-' + (one === 0 ? 'dix' : teens[one]);
            return tens[ten] + (one ? '-' + ones[one] : '');
        }
        if (num < 1000) {
            const hundred = Math.floor(num / 100);
            const rest = num % 100;
            return (hundred === 1 ? 'cent' : ones[hundred] + ' cent') + (rest ? ' ' + convertNumberToWords(rest) : '');
        }
        if (num < 1000000) {
            const thousand = Math.floor(num / 1000);
            const rest = num % 1000;
            return (thousand === 1 ? 'mille' : convertNumberToWords(thousand) + ' mille') + (rest ? ' ' + convertNumberToWords(rest) : '');
        }
        return num.toString();
    };

    const handleAddBill = () => {
        setShowForm(true);
    };

    const loadBills = async () => {
        setIsLoading(true);
        try {
            // Prioriser localStorage pour les données récentes
            let billsData = JSON.parse(localStorage.getItem('bills') || '[]');
            
            // Si localStorage est vide, charger depuis Firebase
            if (!Array.isArray(billsData) || billsData.length === 0) {
                billsData = await loadFromFirebase('bills');
            }
            
            const validData = Array.isArray(billsData) ? billsData : [];
            setBills(validData);
            setFilteredBills(validData);
        } catch (error) {
            console.warn('Error loading bills:', error);
            setBills([]);
            setFilteredBills([]);
        } finally {
            setIsLoading(false);
        }
    };

    const printBill = (bill: Bill) => {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(`
                <html>
                    <head>
                        <title>Reçu - ${bill.receivedFrom}</title>
                        <style>
                            @page { margin: 10mm; size: A4; }
                            * { box-sizing: border-box; }
                            body { 
                                font-family: Arial, sans-serif; 
                                margin: 0; padding: 0; 
                                color: #000; 
                                line-height: 1.2;
                                font-size: 12px;
                            }
                            .header { 
                                text-align: center; 
                                margin-bottom: 15px; 
                                border-bottom: 2px solid #000;
                                padding-bottom: 10px;
                            }
                            .hotel-name { 
                                font-size: 18px; 
                                font-weight: bold; 
                                margin: 0;
                            }
                            .hotel-info {
                                font-size: 10px;
                                color: #666;
                                margin: 8px 0;
                                line-height: 1.3;
                            }
                            .document-title { 
                                font-size: 14px; 
                                margin: 5px 0;
                            }
                            .receipt-number {
                                font-weight: bold;
                                margin-top: 5px;
                            }
                            .receipt-line {
                                margin: 8px 0;
                                font-size: 12px;
                            }
                            .amount-box {
                                border: 1px solid #000;
                                padding: 8px;
                                text-align: center;
                                margin: 10px 0;
                            }
                            .amount-number {
                                font-size: 16px;
                                font-weight: bold;
                                margin-bottom: 5px;
                            }
                            .amount-words {
                                font-size: 11px;
                                font-style: italic;
                            }
                            .details {
                                margin: 10px 0;
                            }
                            .detail-line {
                                margin: 5px 0;
                                font-size: 11px;
                            }
                            .signature-section {
                                margin-top: 20px;
                                display: table;
                                width: 100%;
                            }
                            .signature-box {
                                display: table-cell;
                                width: 50%;
                                text-align: center;
                                padding: 10px;
                                border: 1px solid #000;
                                vertical-align: top;
                            }
                            .signature-label {
                                font-weight: bold;
                                margin-bottom: 20px;
                                font-size: 11px;
                            }
                            .underline {
                                border-bottom: 1px solid #000;
                                display: inline-block;
                                min-width: 150px;
                                padding-bottom: 2px;
                            }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <div class="header">
                                <h1 class="hotel-name">PAULINA HOTEL</h1>
                                <div class="hotel-info">
                                    BP : 7352 Yaoundé, N° Cont : P116012206442N<br>
                                    Tel : (+237) 674 94 44 17 / 699 01 56 81<br>
                                    Email: paulinahotel@yahoo.com
                                </div>
                                <h2 class="document-title">RECU DE PAIEMENT</h2>
                                <div class="receipt-number">No ${bill.id}</div>
                            </div>
                            
                            <div class="receipt-line">
                                <strong>Date :</strong> <span class="underline">${bill.date}</span>
                            </div>
                            
                            <div class="receipt-line">
                                <strong>Recu de M./Mme :</strong> <span class="underline">${bill.receivedFrom}</span>
                            </div>
                            
                            <div class="amount-box">
                                <div class="amount-number">${formatPrice(bill.amount)}</div>
                                <div class="amount-words">${bill.amountInWords}</div>
                            </div>
                            
                            <div class="receipt-line">
                                <strong>Pour :</strong> <span class="underline">${bill.motif} - Chambre ${bill.roomNumber}</span>
                            </div>
                            
                            <div class="details">
                                <div class="detail-line">
                                    <strong>Periode :</strong> ${bill.motif === 'Repos' 
                                        ? `${bill.startTime} - ${bill.endTime}` 
                                        : `Du ${bill.startDate} au ${bill.endDate}`
                                    }
                                </div>
                                ${bill.advance ? `
                                    <div class="detail-line"><strong>Avance :</strong> ${formatPrice(bill.advance)}</div>
                                    <div class="detail-line"><strong>Reste a payer :</strong> ${formatPrice(bill.remaining)}</div>
                                ` : ''}
                            </div>
                            
                            <div class="signature-section">
                                <div class="signature-box">
                                    <div class="signature-label">Signature Client</div>
                                    <div style="height: 30px;"></div>
                                    <div>${bill.clientSignature}</div>
                                </div>
                                <div class="signature-box">
                                    <div class="signature-label">Cachet Hotel</div>
                                    <div style="height: 30px;"></div>
                                    <div>PAULINA HOTEL</div>
                                </div>
                            </div>
                        </div>
                    </body>
                </html>
            `);
            printWindow.document.close();
            printWindow.print();
        }
    };

    useEffect(() => {
        let isMounted = true;
        let debounceTimer: NodeJS.Timeout;
        
        const loadData = async () => {
            if (isMounted) {
                await loadBills();
            }
        };
        
        const debouncedLoadData = () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                if (isMounted) {
                    loadData();
                }
            }, 500);
        };
        
        loadData();
        
        const handleStorageChange = (event: StorageEvent) => {
            if (event.storageArea === localStorage && event.key && isMounted) {
                debouncedLoadData();
            }
        };
        
        const handleDataUpdate = () => {
            if (isMounted) {
                debouncedLoadData();
            }
        };
        
        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('dashboardUpdate', handleDataUpdate);
        window.addEventListener('dataChanged', handleDataUpdate);
        
        return () => {
            isMounted = false;
            clearTimeout(debounceTimer);
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('dashboardUpdate', handleDataUpdate);
            window.removeEventListener('dataChanged', handleDataUpdate);
        };
    }, []);

    const handleSaveBill = async () => {
        const requiredFields = ['date', 'amount', 'receivedFrom', 'amountInWords', 'roomNumber', 'clientSignature'];
        const missingFields = requiredFields.filter(field => !formData[field as keyof typeof formData]);
        
        if (missingFields.length > 0) {
            showNotification("Veuillez remplir tous les champs obligatoires", "error");
            return;
        }
        
        if (formData.motif === 'Repos' && (!formData.startTime || !formData.endTime)) {
            showNotification("Veuillez renseigner les heures de début et fin pour le repos", "error");
            return;
        }
        
        if (formData.motif === 'Nuitée' && (!formData.startDate || !formData.endDate)) {
            showNotification("Veuillez renseigner les dates de début et fin pour la nuitée", "error");
            return;
        }
        
        const billData = { 
            ...formData, 
            id: generateBillId(),
            createdBy: user?.username || 'system'
        };
        await saveData('bills', billData);
        addLog('Création facture', 'bills', `Facture créée: ${formData.receivedFrom} - ${formatPrice(formData.amount)}`, billData);
        showNotification("Reçu enregistré avec succès!", "success");
        setShowForm(false);
        setFormData({
            date: '', amount: '', receivedFrom: '', amountInWords: '', motif: 'Nuitée',
            startTime: '', endTime: '', startDate: '', endDate: '', roomNumber: '',
            advance: '', remaining: '', clientSignature: ''
        });
        await loadBills();
    };

    if (isLoading) {
        return <LoadingSpinner size="lg" text="Chargement des reçus..." />;
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6" style={{color: '#7D3837'}}>Reçus</h1>
            <div className="mb-4 flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
                <button 
                    onClick={handleAddBill}
                    style={{backgroundColor: '#7D3837'}} 
                    className="text-yellow-300 px-4 py-3 sm:py-2 rounded hover:bg-opacity-80 font-medium"
                >
                    Nouveau Reçu
                </button>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 flex-1 max-w-2xl">
                    <input
                        type="text"
                        placeholder="Rechercher par ID reçu..."
                        className="flex-1 px-4 py-2 border rounded-lg"
                        style={{borderColor: '#7D3837'}}
                        onChange={(e) => {
                            const value = e.target.value;
                            if (value.trim() === '') {
                                setFilteredBills(bills);
                            } else {
                                const filtered = bills.filter(bill => 
                                    bill.id.toLowerCase().includes(value.toLowerCase())
                                );
                                setFilteredBills(filtered);
                            }
                        }}
                    />
                    <input
                        type="text"
                        placeholder="Rechercher par nom client..."
                        className="flex-1 px-4 py-2 border rounded-lg"
                        style={{borderColor: '#7D3837'}}
                        onChange={(e) => {
                            const value = e.target.value;
                            if (value.trim() === '') {
                                setFilteredBills(bills);
                            } else {
                                const filtered = bills.filter(bill => 
                                    bill.receivedFrom.toLowerCase().includes(value.toLowerCase())
                                );
                                setFilteredBills(filtered);
                            }
                        }}
                    />
                </div>
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
                    
                    <div className="mt-6 flex flex-col sm:flex-row gap-3">
                        <button 
                            onClick={handleSaveBill}
                            style={{backgroundColor: '#7D3837'}} 
                            className="text-yellow-300 px-6 py-3 rounded hover:opacity-80 transition-opacity font-medium"
                        >
                            Enregistrer
                        </button>
                        <button 
                            onClick={() => setShowForm(false)} 
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
                                onClick={loadBills}
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
                            <p className="text-slate-500 text-base sm:text-lg font-medium">Aucun reçu pour le moment</p>
                            <p className="text-slate-400 text-sm mt-1">Les reçus apparaîtront ici après leur création</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                            {filteredBills.map((bill) => (
                                <div key={bill.id} className="bg-gradient-to-br from-white to-slate-50 p-4 sm:p-5 rounded-xl border border-slate-200 hover:shadow-lg transition-all duration-200 hover:border-slate-300 group">
                                    <div className="flex items-start justify-between mb-3 sm:mb-4">
                                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                                            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                        </div>
                                        <div className="flex flex-col sm:flex-row items-end sm:items-start gap-2">
                                            <button
                                                onClick={() => {
                                                    printBill(bill);
                                                    addLog('Impression facture', 'bills', `Facture imprimée: ${bill.receivedFrom}`);
                                                }}
                                                className="opacity-0 group-hover:opacity-100 w-8 h-8 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center transition-all"
                                                title="Imprimer le reçu"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                                </svg>
                                            </button>
                                            {(user?.role === 'admin' || user?.role === 'super_admin') && (
                                                <button
                                                    onClick={() => {
                                                        if (confirm(`Supprimer la facture de ${bill.receivedFrom} ?`)) {
                                                            const updatedBills = bills.filter(b => b.id !== bill.id);
                                                            setBills(updatedBills);
                                                            setFilteredBills(updatedBills);
                                                            localStorage.setItem('bills', JSON.stringify(updatedBills));
                                                            addLog('Suppression facture', 'bills', `Facture supprimée: ${bill.receivedFrom}`);
                                                            showNotification('Facture supprimée avec succès', 'success');
                                                        }
                                                    }}
                                                    className="opacity-0 group-hover:opacity-100 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-all"
                                                    title="Supprimer la facture"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            )}
                                        </div>
                                        <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2 sm:px-2.5 py-0.5 rounded-full">
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
                                            {bill.advance && (
                                                <div className="flex justify-between text-xs sm:text-sm">
                                                    <span className="text-slate-600">Avance:</span>
                                                    <span className="font-medium">{formatPrice(bill.advance)}</span>
                                                </div>
                                            )}
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