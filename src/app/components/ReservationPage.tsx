"use client";

import { useState, useEffect } from "react";
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
    duration: string;
    totalPrice: string;
}

export default function ReservationPage() {
    const [showForm, setShowForm] = useState(false);
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [rooms, setRooms] = useState<any[]>([]);
    const [availableRooms, setAvailableRooms] = useState<any[]>([]);
    const [showRoomSuggestions, setShowRoomSuggestions] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const { showNotification } = useNotificationContext();
    const { addLog } = useActivityLog();
    const { user } = useAuth();
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

    const handleAddReservation = () => {
        setShowForm(true);
    };

    const loadReservations = async () => {
        setIsLoading(true);
        try {
            // Prioriser localStorage pour les données récentes
            let reservationsData = JSON.parse(localStorage.getItem('reservations') || '[]');
            
            // Si localStorage est vide, charger depuis Firebase
            if (!Array.isArray(reservationsData) || reservationsData.length === 0) {
                reservationsData = await loadFromFirebase('reservations');
            }
            
            setReservations(Array.isArray(reservationsData) ? reservationsData : []);
        } catch (error) {
            console.warn('Error loading reservations:', error);
            setReservations([]);
        } finally {
            setIsLoading(false);
        }
    };

    const loadRooms = async () => {
        try {
            // Prioriser localStorage pour les données récentes
            let roomsData = JSON.parse(localStorage.getItem('rooms') || '[]');
            
            // Si localStorage est vide, charger depuis Firebase
            if (!Array.isArray(roomsData) || roomsData.length === 0) {
                roomsData = await loadFromFirebase('rooms');
            }
            
            setRooms(Array.isArray(roomsData) ? roomsData : []);
        } catch (error) {
            console.warn('Error loading rooms:', error);
            setRooms([]);
        }
    };

    const checkRoomAvailability = (roomNumber: string, checkIn: string, checkOut: string) => {
        if (!checkIn || !checkOut) return true;
        
        const newCheckIn = new Date(checkIn);
        const newCheckOut = new Date(checkOut);
        
        return !reservations.some(reservation => {
            if (reservation.roomNumber !== roomNumber) return false;
            
            const existingCheckIn = new Date(reservation.checkIn);
            const existingCheckOut = new Date(reservation.checkOut || reservation.checkIn);
            
            // Vérifier les chevauchements de dates
            return (
                (newCheckIn >= existingCheckIn && newCheckIn < existingCheckOut) ||
                (newCheckOut > existingCheckIn && newCheckOut <= existingCheckOut) ||
                (newCheckIn <= existingCheckIn && newCheckOut >= existingCheckOut)
            );
        });
    };

    const updateAvailableRooms = () => {
        const filtered = rooms.filter(room => {
            // Chambre doit être disponible ou libre selon les dates
            const isRoomStatusAvailable = room.status === 'Disponible';
            const isRoomDateAvailable = checkRoomAvailability(room.number, formData.checkIn, formData.checkOut);
            
            // Filtrer par numéro si l'utilisateur tape
            const matchesSearch = formData.roomNumber === '' || 
                room.number.toLowerCase().includes(formData.roomNumber.toLowerCase());
            
            return isRoomStatusAvailable && isRoomDateAvailable && matchesSearch;
        });
        
        setAvailableRooms(filtered);
    };

    useEffect(() => {
        let isMounted = true;
        let debounceTimer: NodeJS.Timeout;
        
        const loadData = async () => {
            if (isMounted) {
                await Promise.all([loadReservations(), loadRooms()]);
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

    useEffect(() => {
        if (rooms.length > 0) {
            updateAvailableRooms();
        }
    }, [rooms, reservations, formData.roomNumber, formData.checkIn, formData.checkOut]);

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

    const generateBillId = () => {
        const timestamp = Date.now().toString().slice(-4);
        const random = Math.random().toString(36).substr(2, 3).toUpperCase();
        return `B${timestamp}${random}`;
    };

    const createAutomaticBill = async (reservationData: any) => {
        if (!reservationData.totalPrice) return;
        
        const billData = {
            id: generateBillId(),
            date: reservationData.checkIn,
            amount: reservationData.totalPrice,
            receivedFrom: reservationData.clientName,
            amountInWords: convertNumberToWords(parseInt(reservationData.totalPrice)) + ' francs CFA',
            motif: 'Nuitée' as const,
            startDate: reservationData.checkIn,
            endDate: reservationData.checkOut || reservationData.checkIn,
            roomNumber: reservationData.roomNumber,
            advance: '',
            remaining: '',
            clientSignature: reservationData.clientName,
            createdBy: user?.username || 'system'
        };
        
        await saveData('bills', billData);
        addLog('Création facture automatique', 'bills', `Facture générée automatiquement: ${billData.receivedFrom} - ${formatPrice(billData.amount)}`, billData);
    };

    const updateRoomStatus = async (roomNumber: string, status: string) => {
        const room = rooms.find(r => r.number === roomNumber);
        if (room) {
            const updatedRoom = { ...room, status };
            await saveData('rooms', updatedRoom);
            await loadRooms();
            window.dispatchEvent(new Event('dashboardUpdate'));
        }
    };

    const handleSaveReservation = async () => {
        if (!formData.clientName || !formData.clientPhone || !formData.roomNumber || !formData.checkIn) {
            showNotification("Veuillez remplir les champs obligatoires (nom, téléphone, chambre, date d'arrivée)", "error");
            return;
        }
        
        // Vérifier la disponibilité de la chambre
        if (!checkRoomAvailability(formData.roomNumber, formData.checkIn, formData.checkOut)) {
            showNotification("Cette chambre n'est pas disponible pour les dates sélectionnées", "error");
            return;
        }
        
        // Vérifier que la chambre existe et est disponible
        const selectedRoom = rooms.find(r => r.number === formData.roomNumber);
        if (!selectedRoom) {
            showNotification("Chambre introuvable", "error");
            return;
        }
        
        if (selectedRoom.status === 'Occupée' && !checkRoomAvailability(formData.roomNumber, formData.checkIn, formData.checkOut)) {
            showNotification("Cette chambre est déjà occupée", "error");
            return;
        }
        
        // Ajouter automatiquement le client
        const clientData = {
            name: formData.clientName,
            phone: formData.clientPhone,
            email: formData.clientEmail || '',
            address: '',
            createdBy: user?.username || 'system'
        };
        await saveData('clients', clientData);
        
        // Ajouter la réservation
        const cleanFormData = {
            ...formData,
            id: generateReservationId(),
            totalPrice: formData.totalPrice.replace(' FCFA', ''),
            createdBy: user?.username || 'system'
        };
        await saveData('reservations', cleanFormData);
        
        // Mettre à jour le statut de la chambre à "Occupée"
        await updateRoomStatus(formData.roomNumber, 'Occupée');
        
        // Générer automatiquement la facture
        await createAutomaticBill(cleanFormData);
        
        addLog('Création réservation', 'reservations', `Réservation créée: ${formData.clientName} - Chambre ${formData.roomNumber}`, cleanFormData);
        showNotification("Réservation, client et facture enregistrés avec succès! Chambre marquée comme occupée.", "success");
        setShowForm(false);
        setFormData({ clientName: '', phonePrefix: '+237', clientPhone: '', clientEmail: '', address: '', occupation: '', nationality: '', birthPlace: '', residenceCountry: '', idNumber: '', idIssueDate: '', idIssuePlace: '', idExpiryDate: '', gender: '', arrivalMode: 'A pied', plateNumber: '', departureMode: '', comingFrom: '', goingTo: '', stayType: 'Nuitée', mealPlan: 'RB', signature: '', roomNumber: '', checkIn: '', checkOut: '', duration: '', totalPrice: '' });
        setShowRoomSuggestions(false);
        await loadReservations();
    };

    const generateReservationId = () => {
        const timestamp = Date.now().toString().slice(-4);
        const random = Math.random().toString(36).substr(2, 3).toUpperCase();
        return `R${timestamp}${random}`;
    };

    const handlePrint = (reservation: any) => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const printContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Fiche de Réservation - ${reservation.clientName}</title>
                <style>
                    @page { margin: 15mm; size: A4; }
                    * { box-sizing: border-box; }
                    body { 
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                        margin: 0; padding: 0; 
                        color: #333; 
                        line-height: 1.5;
                        font-size: 12px;
                        background: white;
                    }
                    .container { max-width: 100%; margin: 0 auto; }
                    .header { 
                        text-align: center; 
                        margin-bottom: 30px; 
                        border-bottom: 3px solid #7D3837;
                        padding-bottom: 20px;
                        background: linear-gradient(135deg, #f8f9fa 0%, #fff590 100%);
                        padding: 25px;
                        border-radius: 10px 10px 0 0;
                    }
                    .hotel-logo {
                        width: 80px;
                        height: 80px;
                        background: #7D3837;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: #fff590;
                        font-weight: bold;
                        font-size: 24px;
                        margin: 0 auto 15px;
                        box-shadow: 0 4px 15px rgba(125, 56, 55, 0.3);
                    }
                    .hotel-name { 
                        color: #7D3837; 
                        font-size: 28px; 
                        font-weight: bold; 
                        margin: 0;
                        letter-spacing: 2px;
                        text-shadow: 1px 1px 2px rgba(0,0,0,0.1);
                    }
                    .hotel-info { 
                        font-size: 11px; 
                        color: #666;
                        margin-top: 8px;
                        font-style: italic;
                    }
                    .document-title { 
                        color: #7D3837; 
                        font-size: 20px; 
                        margin: 15px 0;
                        font-weight: bold;
                        text-transform: uppercase;
                        letter-spacing: 1px;
                    }
                    .reservation-id {
                        background: #fff590;
                        padding: 8px 20px;
                        border-radius: 25px;
                        display: inline-block;
                        margin-top: 10px;
                        font-weight: bold;
                        color: #7D3837;
                        border: 2px solid #7D3837;
                    }
                    .section { 
                        margin-bottom: 25px; 
                        background: #f9f9f9;
                        padding: 20px;
                        border-radius: 10px;
                        border-left: 5px solid #7D3837;
                        box-shadow: 0 2px 5px rgba(0,0,0,0.05);
                    }
                    .section-title { 
                        color: #7D3837; 
                        font-size: 16px; 
                        font-weight: bold; 
                        margin: 0 0 15px 0;
                        text-transform: uppercase;
                        letter-spacing: 1px;
                    }
                    .info-grid {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 15px;
                    }
                    .field {
                        background: white;
                        padding: 12px;
                        border-radius: 6px;
                        border: 1px solid #e0e0e0;
                        box-shadow: 0 1px 3px rgba(0,0,0,0.05);
                    }
                    .field-full {
                        grid-column: 1 / -1;
                    }
                    .label { 
                        font-weight: bold; 
                        color: #7D3837;
                        display: block;
                        font-size: 10px;
                        text-transform: uppercase;
                        margin-bottom: 4px;
                        letter-spacing: 0.5px;
                    }
                    .value {
                        color: #333;
                        font-size: 13px;
                        font-weight: 500;
                    }
                    .price-highlight {
                        background: linear-gradient(135deg, #7D3837, #a04948);
                        color: white;
                        padding: 15px;
                        border-radius: 8px;
                        text-align: center;
                        font-size: 18px;
                        font-weight: bold;
                        margin: 20px 0;
                        box-shadow: 0 4px 15px rgba(125, 56, 55, 0.3);
                    }
                    .signature-section {
                        margin-top: 40px;
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 30px;
                    }
                    .signature-box {
                        text-align: center;
                        padding: 25px;
                        border: 2px dashed #7D3837;
                        border-radius: 10px;
                        background: #f8f9fa;
                    }
                    .signature-label {
                        font-weight: bold;
                        color: #7D3837;
                        margin-bottom: 40px;
                        font-size: 14px;
                        text-transform: uppercase;
                    }
                    .signature-line {
                        border-top: 2px solid #7D3837;
                        padding-top: 8px;
                        font-size: 11px;
                        color: #666;
                    }
                    .footer {
                        margin-top: 40px;
                        text-align: center;
                        font-size: 10px;
                        color: #666;
                        border-top: 2px solid #7D3837;
                        padding-top: 20px;
                        background: #f8f9fa;
                        padding: 20px;
                        border-radius: 0 0 10px 10px;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <div class="hotel-logo">PH</div>
                        <h1 class="hotel-name">PAULINA HÔTEL</h1>
                        <div class="hotel-info">
                            Avenue de l'Indépendance, Douala, Cameroun<br>
                            Tél: +237 123 456 789 | Email: contact@paulina-hotel.cm
                        </div>
                        <h2 class="document-title">Fiche de Réservation</h2>
                        <div class="reservation-id">ID: ${reservation.id}</div>
                    </div>
                    
                    <div class="section">
                        <h3 class="section-title">Informations Client</h3>
                        <div class="info-grid">
                            <div class="field">
                                <span class="label">Nom Complet</span>
                                <div class="value">${reservation.clientName || 'Non renseigné'}</div>
                            </div>
                            <div class="field">
                                <span class="label">Téléphone</span>
                                <div class="value">${reservation.phonePrefix || ''} ${reservation.clientPhone || 'Non renseigné'}</div>
                            </div>
                            <div class="field">
                                <span class="label">Email</span>
                                <div class="value">${reservation.clientEmail || 'Non renseigné'}</div>
                            </div>
                            <div class="field">
                                <span class="label">Nationalité</span>
                                <div class="value">${reservation.nationality || 'Non renseigné'}</div>
                            </div>
                            <div class="field field-full">
                                <span class="label">Adresse Complète</span>
                                <div class="value">${reservation.address || 'Non renseigné'}</div>
                            </div>
                        </div>
                    </div>

                    <div class="section">
                        <h3 class="section-title">Détails de la Réservation</h3>
                        <div class="info-grid">
                            <div class="field">
                                <span class="label">Numéro de Chambre</span>
                                <div class="value">${reservation.roomNumber}</div>
                            </div>
                            <div class="field">
                                <span class="label">Date d'Arrivée</span>
                                <div class="value">${new Date(reservation.checkIn).toLocaleDateString('fr-FR')}</div>
                            </div>
                            <div class="field">
                                <span class="label">Date de Départ</span>
                                <div class="value">${reservation.checkOut ? new Date(reservation.checkOut).toLocaleDateString('fr-FR') : 'Non définie'}</div>
                            </div>
                            <div class="field">
                                <span class="label">Durée du Séjour</span>
                                <div class="value">${reservation.checkOut ? Math.ceil((new Date(reservation.checkOut).getTime() - new Date(reservation.checkIn).getTime()) / (1000 * 60 * 60 * 24)) : '0'} nuit(s)</div>
                            </div>
                        </div>
                        
                        ${reservation.totalPrice ? `
                        <div class="price-highlight">
                            Prix Total: ${formatPrice(reservation.totalPrice)}
                        </div>
                        ` : ''}
                    </div>

                    <div class="signature-section">
                        <div class="signature-box">
                            <div class="signature-label">Signature du Client</div>
                            <div style="height: 50px;"></div>
                            <div class="signature-line">
                                ${reservation.signature || 'Non renseignée'}
                            </div>
                        </div>
                        <div class="signature-box">
                            <div class="signature-label">Cachet de l'Hôtel</div>
                            <div style="height: 50px;"></div>
                            <div class="signature-line">
                                PAULINA HÔTEL<br>
                                ${new Date().toLocaleDateString('fr-FR')}
                            </div>
                        </div>
                    </div>

                    <div class="footer">
                        <p><strong>PAULINA HÔTEL</strong> - Fiche générée le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}</p>
                        <p>Document confidentiel - Usage interne uniquement</p>
                        <p>Réservation ID: ${reservation.id}</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
    };

    if (isLoading) {
        return <LoadingSpinner size="lg" text="Chargement des réservations..." />;
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6" style={{color: '#7D3837'}}>Réservations</h1>
            <div className="mb-4 flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
                <button 
                    onClick={handleAddReservation}
                    style={{backgroundColor: '#7D3837'}} 
                    className="text-yellow-300 px-4 py-3 sm:py-2 rounded hover:bg-opacity-80 font-medium"
                >
                    Nouvelle Réservation
                </button>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 flex-1 max-w-2xl">
                    <input
                        type="text"
                        placeholder="Rechercher par ID réservation..."
                        className="flex-1 px-4 py-2 border rounded-lg"
                        style={{borderColor: '#7D3837'}}
                        onChange={(e) => {
                            const value = e.target.value;
                            if (value.trim() === '') {
                                loadReservations();
                            } else {
                                const filtered = reservations.filter(reservation => 
                                    reservation.id.toLowerCase().includes(value.toLowerCase())
                                );
                                setReservations(filtered);
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
                                loadReservations();
                            } else {
                                const filtered = reservations.filter(reservation => 
                                    reservation.clientName.toLowerCase().includes(value.toLowerCase())
                                );
                                setReservations(filtered);
                            }
                        }}
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
                        {formData.checkIn && formData.checkOut && availableRooms.length === 0 && (
                            <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 15.5c-.77.833.192 2.5 1.732 2.5z" />
                                    </svg>
                                    <span className="text-orange-800 font-medium text-sm sm:text-base">Aucune chambre disponible pour ces dates</span>
                                </div>
                                <p className="text-orange-700 text-xs sm:text-sm mt-1">Veuillez choisir d'autres dates ou vérifier les chambres occupées.</p>
                            </div>
                        )}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                            <div className="relative">
                                <input 
                                    placeholder="Numéro de chambre *" 
                                    value={formData.roomNumber}
                                    onChange={(e) => {
                                        setFormData({...formData, roomNumber: e.target.value});
                                        setShowRoomSuggestions(e.target.value.length > 0);
                                    }}
                                    onFocus={() => setShowRoomSuggestions(true)}
                                    onBlur={() => setTimeout(() => setShowRoomSuggestions(false), 200)}
                                    className="p-3 border rounded-lg w-full" 
                                    style={{borderColor: '#7D3837'}} 
                                />
                                {showRoomSuggestions && (
                                    <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto" style={{borderColor: '#7D3837'}}>
                                        {availableRooms.length > 0 ? (
                                            availableRooms.slice(0, 10).map((room) => (
                                                <div
                                                    key={`room-${room.id || room.number}`}
                                                    onClick={() => {
                                                        setFormData({...formData, roomNumber: room.number, totalPrice: room.price});
                                                        setShowRoomSuggestions(false);
                                                    }}
                                                    className="p-3 hover:bg-yellow-50 cursor-pointer border-b border-slate-100 flex justify-between items-center"
                                                >
                                                    <div>
                                                        <span className="font-medium">Chambre {room.number}</span>
                                                        <span className="text-sm text-slate-600 ml-2">({room.category})</span>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-sm font-medium" style={{color: '#7D3837'}}>{room.price} FCFA</div>
                                                        <div className={`text-xs px-2 py-1 rounded ${
                                                            room.status === 'Disponible' ? 'bg-green-100 text-green-800' :
                                                            'bg-blue-100 text-blue-800'
                                                        }`}>
                                                            {room.status}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="p-3 text-center text-slate-500">
                                                {formData.checkIn && formData.checkOut ? 
                                                    'Aucune chambre disponible pour ces dates' :
                                                    'Sélectionnez les dates pour voir les chambres disponibles'
                                                }
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div className="relative">
                                <input 
                                    type="date" 
                                    value={formData.checkIn}
                                    min={new Date().toISOString().split('T')[0]}
                                    onChange={(e) => {
                                        setFormData({...formData, checkIn: e.target.value});
                                        // Si la date de départ est antérieure à la date d'arrivée, la réinitialiser
                                        if (formData.checkOut && e.target.value > formData.checkOut) {
                                            setFormData(prev => ({...prev, checkIn: e.target.value, checkOut: ''}));
                                        }
                                    }}
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
                    <div className="mt-6 flex flex-col sm:flex-row gap-3">
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
                                setShowRoomSuggestions(false);
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
                                onClick={loadReservations}
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
                            <p className="text-slate-500 text-base sm:text-lg font-medium">Aucune réservation pour le moment</p>
                            <p className="text-slate-400 text-sm mt-1">Les réservations apparaîtront ici après leur création</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                            {reservations.map((reservation, index) => (
                                <div key={`reservation-${reservation.id}-${index}`} className="bg-gradient-to-br from-white to-slate-50 p-4 sm:p-6 rounded-xl border border-slate-200 hover:shadow-lg transition-all duration-200 hover:border-slate-300">
                                    <div className="flex items-start justify-between mb-3 sm:mb-4">
                                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center" style={{backgroundColor: '#fff590'}}>
                                            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0V6a2 2 0 012-2h2a2 2 0 012 2v1m-6 0h6m-6 0l-.5 9a2 2 0 002 2h3a2 2 0 002-2L15 7m-6 0h6" />
                                            </svg>
                                        </div>
                                        <span className="text-xs font-medium px-2 sm:px-2.5 py-0.5 rounded-full" style={{backgroundColor: '#fff590', color: '#7D3837'}}>
                                            Chambre {reservation.roomNumber}
                                        </span>
                                    </div>
                                    
                                    <h3 className="font-semibold text-slate-800 text-base sm:text-lg mb-3 sm:mb-4">{reservation.clientName}</h3>
                                    
                                    <div className="space-y-2 sm:space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <svg className="w-3 h-3 sm:w-4 sm:h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0V6a2 2 0 012-2h2a2 2 0 012 2v1m-6 0h6" />
                                                </svg>
                                                <span className="text-xs sm:text-sm text-slate-600">Arrivée</span>
                                            </div>
                                            <span className="text-xs sm:text-sm font-medium text-slate-800">{reservation.checkIn}</span>
                                        </div>
                                        
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <svg className="w-3 h-3 sm:w-4 sm:h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                                </svg>
                                                <span className="text-xs sm:text-sm text-slate-600">Départ</span>
                                            </div>
                                            <span className="text-xs sm:text-sm font-medium text-slate-800">{reservation.checkOut}</span>
                                        </div>
                                        
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <svg className="w-3 h-3 sm:w-4 sm:h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <span className="text-xs sm:text-sm text-slate-600">Durée</span>
                                            </div>
                                            <span className="text-xs sm:text-sm font-medium text-slate-800">
                                                {reservation.duration || 
                                                    (reservation.checkIn && reservation.checkOut ? 
                                                        Math.ceil((new Date(reservation.checkOut).getTime() - new Date(reservation.checkIn).getTime()) / (1000 * 60 * 60 * 24)) 
                                                        : '0'
                                                    )
                                                } jour(s)
                                            </span>
                                        </div>
                                        
                                        {reservation.totalPrice && (
                                            <div className="pt-2 sm:pt-3 border-t border-slate-200">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs sm:text-sm text-slate-600">Prix total</span>
                                                    <span className="text-base sm:text-lg font-bold" style={{color: '#7D3837'}}>{formatPrice(reservation.totalPrice)}</span>
                                                </div>
                                            </div>
                                        )}
                                        
                                        <div className="pt-3 sm:pt-4 border-t border-slate-200 mt-3 sm:mt-4">
                                            <div className="flex flex-col sm:flex-row gap-2">
                                                <button
                                                    onClick={() => {
                                                        handlePrint(reservation);
                                                        addLog('Impression réservation', 'reservations', `Fiche imprimée: ${reservation.clientName}`);
                                                    }}
                                                    className="flex-1 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white rounded-lg transition-colors"
                                                    style={{backgroundColor: '#7D3837'}}
                                                >
                                                    Imprimer la fiche
                                                </button>
                                                {(user?.role === 'admin' || user?.role === 'super_admin') && (
                                                    <button
                                                        onClick={async () => {
                                                            if (confirm(`Supprimer la réservation de ${reservation.clientName} ?`)) {
                                                                // Libérer la chambre (remettre à "Disponible")
                                                                await updateRoomStatus(reservation.roomNumber, 'Disponible');
                                                                
                                                                const updatedReservations = reservations.filter(r => r.id !== reservation.id);
                                                                setReservations(updatedReservations);
                                                                localStorage.setItem('reservations', JSON.stringify(updatedReservations));
                                                                addLog('Suppression réservation', 'reservations', `Réservation supprimée: ${reservation.clientName} - Chambre ${reservation.roomNumber} libérée`);
                                                                showNotification('Réservation supprimée et chambre libérée avec succès', 'success');
                                                            }
                                                        }}
                                                        className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors flex items-center justify-center"
                                                        title="Supprimer la réservation"
                                                    >
                                                        <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
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
        </div>
    );
}