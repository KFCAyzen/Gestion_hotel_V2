import { saveData } from './syncData';

export const generateTestData = async () => {
    // Données fictives pour les clients
    const testClients = [
        {
            id: 'client_001',
            name: 'Jean Dupont',
            phone: '674123456',
            email: 'jean.dupont@email.com',
            address: 'Akwa, Douala',
            createdBy: 'admin'
        },
        {
            id: 'client_002',
            name: 'Marie Ngono',
            phone: '699876543',
            email: 'marie.ngono@gmail.com',
            address: 'Bonanjo, Douala',
            createdBy: 'admin'
        },
        {
            id: 'client_003',
            name: 'Paul Mbarga',
            phone: '677555444',
            email: 'paul.mbarga@yahoo.fr',
            address: 'Bonapriso, Douala',
            createdBy: 'user1'
        },
        {
            id: 'client_004',
            name: 'Sophie Kamdem',
            phone: '655333222',
            email: 'sophie.kamdem@hotmail.com',
            address: 'Deido, Douala',
            createdBy: 'admin'
        },
        {
            id: 'client_005',
            name: 'Robert Johnson',
            phone: '698111000',
            email: 'robert.johnson@company.com',
            address: 'Hotel District, Douala',
            createdBy: 'user1'
        }
    ];

    // Données fictives pour les réservations
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);

    const testReservations = [
        {
            id: 'R2024001',
            clientName: 'Jean Dupont',
            phonePrefix: '+237',
            clientPhone: '674123456',
            clientEmail: 'jean.dupont@email.com',
            roomNumber: '102',
            checkIn: yesterday.toISOString().split('T')[0],
            checkOut: today.toISOString().split('T')[0],
            totalPrice: '15000',
            nationality: 'Camerounaise',
            address: 'Akwa, Douala',
            occupation: 'Ingénieur',
            gender: 'Masculin',
            createdBy: 'admin'
        },
        {
            id: 'R2024002',
            clientName: 'Marie Ngono',
            phonePrefix: '+237',
            clientPhone: '699876543',
            clientEmail: 'marie.ngono@gmail.com',
            roomNumber: '201',
            checkIn: today.toISOString().split('T')[0],
            checkOut: tomorrow.toISOString().split('T')[0],
            totalPrice: '25000',
            nationality: 'Camerounaise',
            address: 'Bonanjo, Douala',
            occupation: 'Médecin',
            gender: 'Féminin',
            createdBy: 'admin'
        },
        {
            id: 'R2024003',
            clientName: 'Paul Mbarga',
            phonePrefix: '+237',
            clientPhone: '677555444',
            clientEmail: 'paul.mbarga@yahoo.fr',
            roomNumber: '311',
            checkIn: tomorrow.toISOString().split('T')[0],
            checkOut: nextWeek.toISOString().split('T')[0],
            totalPrice: '270000',
            nationality: 'Camerounaise',
            address: 'Bonapriso, Douala',
            occupation: 'Avocat',
            gender: 'Masculin',
            createdBy: 'user1'
        },
        {
            id: 'R2024004',
            clientName: 'Robert Johnson',
            phonePrefix: '+1',
            clientPhone: '5551234567',
            clientEmail: 'robert.johnson@company.com',
            roomNumber: '320',
            checkIn: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            checkOut: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            totalPrice: '225000',
            nationality: 'Américaine',
            address: 'New York, USA',
            occupation: 'Business Manager',
            gender: 'Masculin',
            createdBy: 'admin'
        }
    ];

    // Données fictives pour les factures
    const testBills = [
        {
            id: 'B2024001',
            date: yesterday.toISOString().split('T')[0],
            amount: '15000',
            receivedFrom: 'Jean Dupont',
            amountInWords: 'quinze mille francs CFA',
            motif: 'Nuitée' as const,
            startDate: yesterday.toISOString().split('T')[0],
            endDate: today.toISOString().split('T')[0],
            roomNumber: '102',
            advance: '',
            remaining: '',
            clientSignature: 'Jean Dupont',
            createdBy: 'admin'
        },
        {
            id: 'B2024002',
            date: today.toISOString().split('T')[0],
            amount: '25000',
            receivedFrom: 'Marie Ngono',
            amountInWords: 'vingt-cinq mille francs CFA',
            motif: 'Nuitée' as const,
            startDate: today.toISOString().split('T')[0],
            endDate: tomorrow.toISOString().split('T')[0],
            roomNumber: '201',
            advance: '',
            remaining: '',
            clientSignature: 'Marie Ngono',
            createdBy: 'admin'
        },
        {
            id: 'B2024003',
            date: today.toISOString().split('T')[0],
            amount: '12000',
            receivedFrom: 'Sophie Kamdem',
            amountInWords: 'douze mille francs CFA',
            motif: 'Repos' as const,
            startDate: today.toISOString().split('T')[0],
            endDate: today.toISOString().split('T')[0],
            roomNumber: '103',
            advance: '',
            remaining: '',
            clientSignature: 'Sophie Kamdem',
            createdBy: 'user1'
        },
        {
            id: 'B2024004',
            date: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            amount: '45000',
            receivedFrom: 'Paul Mbarga',
            amountInWords: 'quarante-cinq mille francs CFA',
            motif: 'Nuitée' as const,
            startDate: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            endDate: yesterday.toISOString().split('T')[0],
            roomNumber: '311',
            advance: '',
            remaining: '',
            clientSignature: 'Paul Mbarga',
            createdBy: 'admin'
        },
        {
            id: 'B2024005',
            date: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            amount: '75000',
            receivedFrom: 'Robert Johnson',
            amountInWords: 'soixante-quinze mille francs CFA',
            motif: 'Nuitée' as const,
            startDate: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            endDate: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            roomNumber: '320',
            advance: '',
            remaining: '',
            clientSignature: 'Robert Johnson',
            createdBy: 'user1'
        }
    ];

    // Mettre à jour les statuts des chambres selon les réservations
    const roomUpdates = [
        { number: '102', status: 'Occupée' }, // Jean Dupont
        { number: '201', status: 'Occupée' }, // Marie Ngono
        { number: '104', status: 'Maintenance' },
        { number: '203', status: 'Nettoyage' },
        { number: '302', status: 'Occupée' }
    ];

    try {
        // Sauvegarder les clients
        for (const client of testClients) {
            await saveData('clients', client);
        }

        // Sauvegarder les réservations
        for (const reservation of testReservations) {
            await saveData('reservations', reservation);
        }

        // Sauvegarder les factures
        for (const bill of testBills) {
            await saveData('bills', bill);
        }

        // Mettre à jour les statuts des chambres
        const existingRooms = JSON.parse(localStorage.getItem('rooms') || '[]');
        const updatedRooms = existingRooms.map((room: any) => {
            const update = roomUpdates.find(u => u.number === room.number);
            return update ? { ...room, status: update.status } : room;
        });
        
        for (const room of updatedRooms) {
            await saveData('rooms', room);
        }

        console.log('Données de test générées avec succès!');
        return true;
    } catch (error) {
        console.error('Erreur lors de la génération des données de test:', error);
        return false;
    }
};

export const clearAllData = () => {
    localStorage.removeItem('clients');
    localStorage.removeItem('reservations');
    localStorage.removeItem('bills');
    localStorage.removeItem('rooms');
    console.log('Toutes les données ont été supprimées');
};

export const resetRoomsToDefault = () => {
    // Chambres exactes (27 au total)
    const defaultRooms = [
        // Standard (101-104) = 4 chambres
        { id: 'std_101', number: '101', price: '15000', status: 'Disponible', category: 'Standard' },
        { id: 'std_102', number: '102', price: '15000', status: 'Disponible', category: 'Standard' },
        { id: 'std_103', number: '103', price: '15000', status: 'Disponible', category: 'Standard' },
        { id: 'std_104', number: '104', price: '15000', status: 'Disponible', category: 'Standard' },
        // Confort (201-203, 301-310) = 13 chambres
        { id: 'conf_201', number: '201', price: '25000', status: 'Disponible', category: 'Confort' },
        { id: 'conf_202', number: '202', price: '25000', status: 'Disponible', category: 'Confort' },
        { id: 'conf_203', number: '203', price: '25000', status: 'Disponible', category: 'Confort' },
        { id: 'conf_301', number: '301', price: '25000', status: 'Disponible', category: 'Confort' },
        { id: 'conf_302', number: '302', price: '25000', status: 'Disponible', category: 'Confort' },
        { id: 'conf_303', number: '303', price: '25000', status: 'Disponible', category: 'Confort' },
        { id: 'conf_304', number: '304', price: '25000', status: 'Disponible', category: 'Confort' },
        { id: 'conf_305', number: '305', price: '25000', status: 'Disponible', category: 'Confort' },
        { id: 'conf_306', number: '306', price: '25000', status: 'Disponible', category: 'Confort' },
        { id: 'conf_307', number: '307', price: '25000', status: 'Disponible', category: 'Confort' },
        { id: 'conf_308', number: '308', price: '25000', status: 'Disponible', category: 'Confort' },
        { id: 'conf_309', number: '309', price: '25000', status: 'Disponible', category: 'Confort' },
        { id: 'conf_310', number: '310', price: '25000', status: 'Disponible', category: 'Confort' },
        // VIP (311-319) = 9 chambres
        { id: 'vip_311', number: '311', price: '45000', status: 'Disponible', category: 'VIP' },
        { id: 'vip_312', number: '312', price: '45000', status: 'Disponible', category: 'VIP' },
        { id: 'vip_313', number: '313', price: '45000', status: 'Disponible', category: 'VIP' },
        { id: 'vip_314', number: '314', price: '45000', status: 'Disponible', category: 'VIP' },
        { id: 'vip_315', number: '315', price: '45000', status: 'Disponible', category: 'VIP' },
        { id: 'vip_316', number: '316', price: '45000', status: 'Disponible', category: 'VIP' },
        { id: 'vip_317', number: '317', price: '45000', status: 'Disponible', category: 'VIP' },
        { id: 'vip_318', number: '318', price: '45000', status: 'Disponible', category: 'VIP' },
        { id: 'vip_319', number: '319', price: '45000', status: 'Disponible', category: 'VIP' },
        // Suite (320) = 1 chambre
        { id: 'suite_320', number: '320', price: '75000', status: 'Disponible', category: 'Suite' }
    ];
    
    localStorage.setItem('rooms', JSON.stringify(defaultRooms));
    console.log('Chambres réinitialisées aux 27 chambres par défaut');
    return defaultRooms;
};