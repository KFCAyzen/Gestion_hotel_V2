"use client";

import { useState, useEffect } from "react";
import { saveData, loadFromFirebase } from "../utils/syncData";
import { useNotificationContext } from "../context/NotificationContext";
import { useActivityLog } from "../context/ActivityLogContext";
import { useAuth } from "../context/AuthContext";

interface Client {
    id: string;
    name: string;
    phone: string;
    email: string;
    address: string;
    occupation: string;
    nationality: string;
    birthPlace: string;
    residenceCountry: string;
    idNumber: string;
    idIssueDate: string;
    idIssuePlace: string;
    idExpiryDate: string;
    arrivalMode: string;
    arrivalDate: string;
    plateNumber?: string;
    departureMode: string;
    departureDate: string;
    gender: string;
    comingFrom?: string;
    goingTo?: string;
    stayType: string;
    mealPlan: string;
    price: string;
    signature?: string;
}

export default function ClientsPage() {
    const [showForm, setShowForm] = useState(false);
    const [clients, setClients] = useState<Client[]>([]);
    const [filteredClients, setFilteredClients] = useState<Client[]>([]);
    const [searchId, setSearchId] = useState('');
    const [searchName, setSearchName] = useState('');
    
    // Générateur d'ID unique
    const generateClientId = () => {
        const timestamp = Date.now().toString().slice(-4);
        const random = Math.random().toString(36).substring(2, 5).toUpperCase();
        return `C${timestamp}${random}`;
    };
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

    const handleAddClient = () => {
        setShowForm(true);
    };

    const loadClients = async () => {
        try {
            // Prioriser localStorage pour les données récentes
            let clientsData = JSON.parse(localStorage.getItem('clients') || '[]');
            
            // Si localStorage est vide, charger depuis Firebase
            if (!Array.isArray(clientsData) || clientsData.length === 0) {
                clientsData = await loadFromFirebase('clients');
                if (!Array.isArray(clientsData)) {
                    throw new Error('Invalid data format');
                }
            }
            
            // Ajouter un client fictif pour les tests
            const fictifClient: Client = {
                id: `fictif_${Date.now()}`,
                name: 'Jean Dupont',
                phone: '+237 690 123 456',
                email: 'jean.dupont@email.com',
                address: '123 Rue de la Paix, Douala',
                occupation: 'Ingénieur',
                nationality: 'Camerounaise',
                birthPlace: 'Yaoundé',
                residenceCountry: 'Cameroun',
                idNumber: 'CNI123456789',
                idIssueDate: '2020-01-15',
                idIssuePlace: 'Yaoundé',
                idExpiryDate: '2030-01-15',
                arrivalMode: 'En voiture',
                arrivalDate: '2024-01-20',
                plateNumber: 'LT 1234 AA',
                departureMode: 'En voiture',
                departureDate: '2024-01-25',
                gender: 'Masculin',
                comingFrom: 'Yaoundé',
                goingTo: 'Bafoussam',
                stayType: 'Nuitée',
                mealPlan: 'HB',
                price: '45000',
                signature: 'J. Dupont'
            };
            
            // Vérifier si le client fictif existe déjà
            const hasTestClient = clientsData.some((client: Client) => client.name === 'Jean Dupont' && client.phone === '+237 690 123 456');
            const allClients = hasTestClient ? clientsData : [fictifClient, ...clientsData];
            setClients(allClients);
            setFilteredClients(allClients);
        } catch (error) {
            // Fallback vers localStorage
            const localClients = JSON.parse(localStorage.getItem('clients') || '[]');
            const fictifClient: Client = {
                id: `fictif_${Date.now()}`,
                name: 'Jean Dupont',
                phone: '+237 690 123 456',
                email: 'jean.dupont@email.com',
                address: '123 Rue de la Paix, Douala',
                occupation: 'Ingénieur',
                nationality: 'Camerounaise',
                birthPlace: 'Yaoundé',
                residenceCountry: 'Cameroun',
                idNumber: 'CNI123456789',
                idIssueDate: '2020-01-15',
                idIssuePlace: 'Yaoundé',
                idExpiryDate: '2030-01-15',
                arrivalMode: 'En voiture',
                arrivalDate: '2024-01-20',
                plateNumber: 'LT 1234 AA',
                departureMode: 'En voiture',
                departureDate: '2024-01-25',
                gender: 'Masculin',
                comingFrom: 'Yaoundé',
                goingTo: 'Bafoussam',
                stayType: 'Nuitée',
                mealPlan: 'HB',
                price: '45000',
                signature: 'J. Dupont'
            };
            
            // Vérifier si le client fictif existe déjà
            const hasTestClient = localClients.some((client: any) => client.name === 'Jean Dupont' && client.phone === '+237 690 123 456');
            let allClients;
            if (!hasTestClient) {
                allClients = [fictifClient, ...localClients];
                localStorage.setItem('clients', JSON.stringify(allClients));
            } else {
                allClients = localClients;
            }
            setClients(allClients);
            setFilteredClients(allClients);
        }
    };

    useEffect(() => {
        let isMounted = true;
        let debounceTimer: NodeJS.Timeout;
        
        const loadData = async () => {
            if (isMounted) {
                await loadClients();
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

    const { showNotification } = useNotificationContext();
    const { addLog } = useActivityLog();
    const { user } = useAuth();

    const printClientForm = (client: Client) => {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(`
                <html>
                    <head>
                        <title>Fiche Client - ${client.name}</title>
                        <style>
                            @page { margin: 20mm; size: A4; }
                            * { box-sizing: border-box; }
                            body { 
                                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                                margin: 0; padding: 0; 
                                color: #333; 
                                line-height: 1.2;
                                font-size: 10px;
                            }
                            .container { max-width: 100%; margin: 0 auto; }
                            .header { 
                                display: flex;
                                justify-content: center;
                                align-items: center;
                                margin-bottom: 15px; 
                                border-bottom: 2px solid #7D3837;
                                padding-bottom: 10px;
                            }
                            .header-text {
                                text-align: center;
                            }
                            .hotel-name { 
                                color: #7D3837; 
                                font-size: 22px; 
                                font-weight: bold; 
                                margin: 0;
                                letter-spacing: 1px;
                            }
                            .document-title { 
                                color: #666; 
                                font-size: 14px; 
                                margin: 5px 0 0 0;
                                font-weight: normal;
                            }
                            .client-id {
                                background: #fff590;
                                padding: 3px 10px;
                                border-radius: 15px;
                                display: inline-block;
                                margin-top: 5px;
                                font-weight: bold;
                                color: #7D3837;
                                font-size: 9px;
                            }
                            .section { 
                                margin-bottom: 15px; 
                                background: #f9f9f9;
                                padding: 10px;
                                border-radius: 6px;
                                border-left: 3px solid #7D3837;
                            }
                            .section-title { 
                                color: #7D3837; 
                                font-size: 12px; 
                                font-weight: bold; 
                                margin: 0 0 8px 0;
                                text-transform: uppercase;
                                letter-spacing: 0.5px;
                            }
                            .fields-grid {
                                display: grid;
                                grid-template-columns: 1fr 1fr;
                                gap: 8px;
                            }
                            .field-full {
                                grid-column: 1 / -1;
                            }
                            .field { 
                                background: white;
                                padding: 5px 8px;
                                border-radius: 3px;
                                border: 1px solid #e0e0e0;
                            }
                            .label { 
                                font-weight: bold; 
                                color: #7D3837;
                                display: block;
                                font-size: 8px;
                                text-transform: uppercase;
                                margin-bottom: 2px;
                            }
                            .value {
                                color: #333;
                                font-size: 10px;
                            }
                            .footer {
                                margin-top: 20px;
                                text-align: center;
                                font-size: 8px;
                                color: #666;
                                border-top: 1px solid #ddd;
                                padding-top: 10px;
                            }
                            .signature-section {
                                margin-top: 20px;
                                display: grid;
                                grid-template-columns: 1fr 1fr;
                                gap: 20px;
                            }
                            .signature-box {
                                text-align: center;
                                padding: 15px;
                                border: 1px dashed #ccc;
                                border-radius: 3px;
                            }
                            .signature-label {
                                font-weight: bold;
                                color: #7D3837;
                                margin-bottom: 20px;
                                font-size: 9px;
                            }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <div class="header">
                                <div class="header-text">
                                    <h1 class="hotel-name">PAULINA HÔTEL</h1>
                                    <h2 class="document-title">FICHE CLIENT</h2>
                                    <div class="client-id">ID: ${client.id}</div>
                                </div>
                            </div>
                            
                            <div class="section">
                                <h3 class="section-title">Informations Personnelles</h3>
                                <div class="fields-grid">
                                    <div class="field">
                                        <span class="label">Nom Complet</span>
                                        <div class="value">${client.name}</div>
                                    </div>
                                    <div class="field">
                                        <span class="label">Sexe</span>
                                        <div class="value">${client.gender}</div>
                                    </div>
                                    <div class="field">
                                        <span class="label">Téléphone</span>
                                        <div class="value">${client.phone}</div>
                                    </div>
                                    <div class="field">
                                        <span class="label">Email</span>
                                        <div class="value">${client.email}</div>
                                    </div>
                                    <div class="field">
                                        <span class="label">Occupation</span>
                                        <div class="value">${client.occupation}</div>
                                    </div>
                                    <div class="field">
                                        <span class="label">Nationalité</span>
                                        <div class="value">${client.nationality}</div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="section">
                                <h3 class="section-title">Adresses & Lieux</h3>
                                <div class="fields-grid">
                                    <div class="field">
                                        <span class="label">Lieu de Naissance</span>
                                        <div class="value">${client.birthPlace}</div>
                                    </div>
                                    <div class="field">
                                        <span class="label">Pays de Résidence</span>
                                        <div class="value">${client.residenceCountry}</div>
                                    </div>
                                    <div class="field field-full">
                                        <span class="label">Adresse Complète</span>
                                        <div class="value">${client.address}</div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="section">
                                <h3 class="section-title">Pièce d'Identification</h3>
                                <div class="fields-grid">
                                    <div class="field">
                                        <span class="label">Numéro</span>
                                        <div class="value">${client.idNumber}</div>
                                    </div>
                                    <div class="field">
                                        <span class="label">Lieu de Délivrance</span>
                                        <div class="value">${client.idIssuePlace}</div>
                                    </div>
                                    <div class="field">
                                        <span class="label">Date de Délivrance</span>
                                        <div class="value">${client.idIssueDate}</div>
                                    </div>
                                    <div class="field">
                                        <span class="label">Date d'Expiration</span>
                                        <div class="value">${client.idExpiryDate}</div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="section">
                                <h3 class="section-title">Informations de Séjour</h3>
                                <div class="fields-grid">
                                    <div class="field">
                                        <span class="label">Type de Séjour</span>
                                        <div class="value">${client.stayType}</div>
                                    </div>
                                    <div class="field">
                                        <span class="label">Étage</span>
                                        <div class="value">${client.mealPlan}</div>
                                    </div>
                                    <div class="field">
                                        <span class="label">Date d'Arrivée</span>
                                        <div class="value">${client.arrivalDate}</div>
                                    </div>
                                    <div class="field">
                                        <span class="label">Date de Départ</span>
                                        <div class="value">${client.departureDate}</div>
                                    </div>
                                    <div class="field">
                                        <span class="label">Mode d'Arrivée</span>
                                        <div class="value">${client.arrivalMode}${client.plateNumber ? ' - ' + client.plateNumber : ''}</div>
                                    </div>
                                    <div class="field">
                                        <span class="label">Prix du Séjour</span>
                                        <div class="value" style="font-weight: bold; color: #7D3837;">${client.price} FCFA</div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="signature-section">
                                <div class="signature-box">
                                    <div class="signature-label">Signature du Client</div>
                                    <div style="height: 25px;"></div>
                                    <div style="border-top: 1px solid #ccc; padding-top: 3px; font-size: 8px;">
                                        ${client.signature || 'Non renseignée'}
                                    </div>
                                </div>
                                <div class="signature-box">
                                    <div class="signature-label">Cachet de l'Hôtel</div>
                                    <div style="height: 25px;"></div>
                                    <div style="border-top: 1px solid #ccc; padding-top: 3px; font-size: 8px;">
                                        Date: ${new Date().toLocaleDateString('fr-FR')}
                                    </div>
                                </div>
                            </div>
                            
                            <div class="footer">
                                <p>PAULINA HÔTEL - Fiche générée le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}</p>
                                <p>Document confidentiel - Usage interne uniquement</p>
                            </div>
                        </div>
                    </body>
                </html>
            `);
            printWindow.document.close();
            printWindow.print();
        }
    };

    const handleSaveClient = async () => {
        const requiredFields = [
            'name', 'phone', 'email', 'address', 'occupation', 'nationality', 
            'birthPlace', 'residenceCountry', 'idNumber', 'idIssueDate', 'idIssuePlace',
            'idExpiryDate', 'arrivalMode', 'arrivalDate', 'departureMode', 'departureDate', 'gender', 'stayType', 'mealPlan', 'price'
        ];
        
        const missingFields = requiredFields.filter(field => !formData[field as keyof typeof formData]);
        
        if (missingFields.length > 0) {
            showNotification("Veuillez remplir tous les champs obligatoires", "error");
            return;
        }
        
        if (formData.arrivalMode === 'En voiture' && !formData.plateNumber) {
            showNotification("Veuillez renseigner le numéro de plaque d'immatriculation", "error");
            return;
        }
        try {
            const clientWithId = { 
                ...formData, 
                id: generateClientId(),
                phone: `${formData.phonePrefix} ${formData.phone}`
            };
            await saveData('clients', clientWithId);
            addLog('Création client', 'clients', `Client créé: ${formData.name}`, clientWithId);
            window.dispatchEvent(new Event('dashboardUpdate'));
            showNotification("Client enregistré avec succès!", "success");
            
            // Proposer d'imprimer la fiche
            if (confirm("Voulez-vous imprimer la fiche client ?")) {
                const newClient = { id: generateClientId(), ...formData };
                printClientForm(newClient as Client);
            }
            
            setShowForm(false);
            setFormData({ 
                name: '', phonePrefix: '+237', phone: '', email: '', address: '', occupation: '', nationality: '', 
                birthPlace: '', residenceCountry: '', idNumber: '', idIssueDate: '', idIssuePlace: '',
                idExpiryDate: '', arrivalMode: 'A pied', arrivalDate: '', plateNumber: '', departureMode: '', 
                departureDate: '', gender: '', comingFrom: '', goingTo: '', stayType: 'Nuitée', mealPlan: 'RB', price: '', signature: '' 
            });
            await loadClients();
        } catch (error) {
            // Utiliser le système unifié
            const newClient = { 
                id: generateClientId(), 
                ...formData,
                phone: `${formData.phonePrefix} ${formData.phone}`,
                createdBy: user?.username || 'system'
            };
            await saveData('clients', newClient);
            const updatedClients = await loadFromFirebase('clients');
            setClients(updatedClients);
            addLog('Création client', 'clients', `Client créé: ${formData.name}`, newClient);
            window.dispatchEvent(new Event('dashboardUpdate'));
            showNotification("Client enregistré localement!", "success");
            
            // Proposer d'imprimer la fiche
            if (confirm("Voulez-vous imprimer la fiche client ?")) {
                printClientForm(newClient as Client);
            }
            
            setShowForm(false);
            setFormData({ 
                name: '', phonePrefix: '+237', phone: '', email: '', address: '', occupation: '', nationality: '', 
                birthPlace: '', residenceCountry: '', idNumber: '', idIssueDate: '', idIssuePlace: '',
                idExpiryDate: '', arrivalMode: 'A pied', arrivalDate: '', plateNumber: '', departureMode: '', 
                departureDate: '', gender: '', comingFrom: '', goingTo: '', stayType: 'Nuitée', mealPlan: 'RB', price: '', signature: '' 
            });
        }
    };

    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold mb-6" style={{color: '#7D3837'}}>Clients</h1>
            <div className="mb-4 flex gap-4 items-center">
                <button 
                    onClick={handleAddClient}
                    style={{backgroundColor: '#7D3837'}} 
                    className="text-yellow-300 px-4 py-2 rounded hover:bg-opacity-80"
                >
                    Nouveau Client
                </button>
                <div className="flex gap-4 flex-1 max-w-2xl">
                    <input
                        type="text"
                        placeholder="Rechercher par ID client..."
                        value={searchId}
                        onChange={(e) => {
                            const value = e.target.value;
                            setSearchId(value);
                            const nameFilter = searchName.toLowerCase();
                            const idFilter = value.toLowerCase();
                            
                            if (value.trim() === '' && searchName.trim() === '') {
                                setFilteredClients(clients);
                            } else {
                                const filtered = clients.filter(client => 
                                    (idFilter === '' || client.id.toLowerCase().includes(idFilter)) &&
                                    (nameFilter === '' || client.name.toLowerCase().includes(nameFilter))
                                );
                                setFilteredClients(filtered);
                            }
                        }}
                        className="flex-1 px-4 py-2 border rounded-lg"
                        style={{borderColor: '#7D3837'}}
                    />
                    <input
                        type="text"
                        placeholder="Rechercher par nom client..."
                        value={searchName}
                        onChange={(e) => {
                            const value = e.target.value;
                            setSearchName(value);
                            const nameFilter = value.toLowerCase();
                            const idFilter = searchId.toLowerCase();
                            
                            if (value.trim() === '' && searchId.trim() === '') {
                                setFilteredClients(clients);
                            } else {
                                const filtered = clients.filter(client => 
                                    (idFilter === '' || client.id.toLowerCase().includes(idFilter)) &&
                                    (nameFilter === '' || client.name.toLowerCase().includes(nameFilter))
                                );
                                setFilteredClients(filtered);
                            }
                        }}
                        className="flex-1 px-4 py-2 border rounded-lg"
                        style={{borderColor: '#7D3837'}}
                    />
                </div>
            </div>
            
            {showForm && (
                <div className="bg-yellow-50 border rounded p-6 mb-4" style={{borderColor: '#7D3837'}}>
                    <h3 className="font-bold mb-6 text-xl" style={{color: '#7D3837'}}>Nouveau Client</h3>
                    
                    {/* Informations personnelles */}
                    <div className="mb-6">
                        <h4 className="font-semibold mb-3 text-lg" style={{color: '#7D3837'}}>Informations personnelles</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                    <div className="mb-6">
                        <h4 className="font-semibold mb-3 text-lg" style={{color: '#7D3837'}}>Adresses et lieux</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <div className="mb-6">
                        <h4 className="font-semibold mb-3 text-lg" style={{color: '#7D3837'}}>Pièce d'identification</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                    <div className="mb-6">
                        <h4 className="font-semibold mb-3 text-lg" style={{color: '#7D3837'}}>Transport et déplacement</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                    <div className="mb-6">
                        <h4 className="font-semibold mb-3 text-lg" style={{color: '#7D3837'}}>Séjour et tarification</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                    <div className="mt-4">
                        <button 
                            onClick={handleSaveClient}
                            style={{backgroundColor: '#7D3837'}} 
                            className="text-yellow-300 px-4 py-2 rounded mr-2 hover:opacity-80 transition-opacity"
                        >
                            Enregistrer
                        </button>
                        <button 
                            onClick={() => setShowForm(false)} 
                            className="px-4 py-2 rounded border hover:bg-yellow-100 transition-colors" 
                            style={{borderColor: '#7D3837', color: '#7D3837'}}
                        >
                            Annuler
                        </button>
                    </div>
                </div>
            )}
            
            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                <div className="p-6 border-b border-slate-200">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-slate-800">Liste des Clients</h2>
                        <div className="flex items-center gap-3">
                            <span className="text-sm text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
                                {filteredClients.length} client(s) {searchId && `sur ${clients.length}`}
                            </span>
                            <button 
                                onClick={loadClients}
                                className="px-4 py-2 text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                            >
                                Actualiser
                            </button>
                        </div>
                    </div>
                </div>
                
                <div className="p-6">
                    {filteredClients.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                            <p className="text-slate-500 text-lg font-medium">
                                {searchId ? 'Aucun client trouvé' : 'Aucun client enregistré'}
                            </p>
                            <p className="text-slate-400 text-sm mt-1">
                                {searchId ? 'Essayez un autre ID' : 'Les clients apparaîtront ici après leur ajout'}
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredClients.map((client) => (
                                <div key={client.id} className="bg-gradient-to-br from-white to-slate-50 p-5 rounded-xl border border-slate-200 hover:shadow-md transition-all duration-200 hover:border-slate-300 group">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{backgroundColor: '#fff590'}}>
                                            <svg className="w-5 h-5 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => {
                                                    printClientForm(client);
                                                    addLog('Impression fiche', 'clients', `Fiche imprimée: ${client.name}`);
                                                }}
                                                className="opacity-0 group-hover:opacity-100 w-8 h-8 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center transition-all"
                                                title="Imprimer la fiche"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                                </svg>
                                            </button>
                                            {(user?.role === 'admin' || user?.role === 'super_admin') && (
                                                <button
                                                    onClick={() => {
                                                        if (confirm(`Supprimer le client ${client.name} ?`)) {
                                                            const updatedClients = clients.filter(c => c.id !== client.id);
                                                            setClients(updatedClients);
                                                            setFilteredClients(updatedClients);
                                                            localStorage.setItem('clients', JSON.stringify(updatedClients));
                                                            addLog('Suppression client', 'clients', `Client supprimé: ${client.name}`);
                                                            showNotification('Client supprimé avec succès', 'success');
                                                        }
                                                    }}
                                                    className="opacity-0 group-hover:opacity-100 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-all"
                                                    title="Supprimer le client"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <div className="mb-3">
                                        <h3 className="font-semibold text-slate-800 text-lg">{client.name}</h3>
                                        <p className="text-xs text-slate-500 font-mono">ID: {client.id}</p>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-sm">
                                            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                            </svg>
                                            <span className="text-slate-600">{client.phone}</span>
                                        </div>
                                        {client.email && (
                                            <div className="flex items-center gap-2 text-sm">
                                                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                </svg>
                                                <span className="text-slate-600">{client.email}</span>
                                            </div>
                                        )}
                                        {client.address && (
                                            <div className="flex items-center gap-2 text-sm">
                                                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                                <span className="text-slate-600">{client.address}</span>
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