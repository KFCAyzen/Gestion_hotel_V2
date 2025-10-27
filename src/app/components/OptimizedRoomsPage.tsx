"use client";

import { useState, useEffect, useMemo, useCallback, memo } from "react";
import { saveData, loadFromFirebase } from "../utils/syncData";
import { useNotificationContext } from "../context/NotificationContext";
import { formatPrice } from "../utils/formatPrice";
import { useActivityLog } from "../context/ActivityLogContext";
import { useAuth } from "../context/AuthContext";
import { dataCache } from "../utils/dataCache";

interface Room {
    id: string;
    number: string;
    price: string;
    status: 'Disponible' | 'Occupée' | 'Maintenance' | 'Nettoyage';
    category: string;
}

const RoomCard = memo(({ room, categoryStyle, user, onEdit, onDelete, onStatusChange }: {
    room: Room;
    categoryStyle: any;
    user: any;
    onEdit: (room: Room) => void;
    onDelete: (id: string) => void;
    onStatusChange: (id: string, status: Room['status']) => void;
}) => (
    <div 
        className={`${categoryStyle.bgColor} p-4 sm:p-5 rounded-xl border border-slate-200 hover:shadow-lg transition-all duration-200 hover:border-slate-300 ${(user?.role === 'admin' || user?.role === 'super_admin') ? 'cursor-pointer' : ''} group`} 
        onClick={(user?.role === 'admin' || user?.role === 'super_admin') ? () => onEdit(room) : undefined}
    >
        <div className="flex items-start justify-between mb-3 sm:mb-4">
            <div className={`w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br ${categoryStyle.color} rounded-lg flex items-center justify-center`}>
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
            </div>
            <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
                <select
                    value={room.status}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => {
                        e.stopPropagation();
                        onStatusChange(room.id, e.target.value as Room['status']);
                    }}
                    className={`text-xs font-medium px-2 py-1 rounded border-0 cursor-pointer ${
                        room.status === 'Disponible' ? 'bg-green-100 text-green-800' :
                        room.status === 'Occupée' ? 'bg-blue-100 text-blue-800' :
                        room.status === 'Maintenance' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-purple-100 text-purple-800'
                    }`}
                >
                    <option value="Disponible">Disponible</option>
                    <option value="Occupée">Occupée</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Nettoyage">Nettoyage</option>
                </select>
                {(user?.role === 'admin' || user?.role === 'super_admin') && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(room.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-all"
                    >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}
            </div>
        </div>
        
        <h4 className="font-semibold text-slate-800 text-base sm:text-lg mb-2">Chambre {room.number}</h4>
        <p className={`text-xs font-medium mb-2 sm:mb-3 ${categoryStyle.textColor}`}>{room.category}</p>
        
        <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm text-slate-600">Prix/nuit</span>
            <span className={`text-base sm:text-lg font-bold bg-gradient-to-r ${categoryStyle.color} bg-clip-text text-transparent`}>{formatPrice(room.price)}</span>
        </div>
    </div>
));

RoomCard.displayName = 'RoomCard';

export default function OptimizedRoomsPage() {
    const [showForm, setShowForm] = useState(false);
    const [editingRoom, setEditingRoom] = useState<Room | null>(null);
    const [rooms, setRooms] = useState<Room[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const { showNotification } = useNotificationContext();
    const { addLog } = useActivityLog();
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        number: '',
        price: '',
        category: 'Standard'
    });

    const predefinedRooms: Room[] = useMemo(() => [
        { id: 'std_101', number: '101', price: '15000', status: 'Disponible' as const, category: 'Standard' },
        { id: 'std_102', number: '102', price: '15000', status: 'Disponible' as const, category: 'Standard' },
        { id: 'std_103', number: '103', price: '15000', status: 'Disponible' as const, category: 'Standard' },
        { id: 'std_104', number: '104', price: '15000', status: 'Disponible' as const, category: 'Standard' },
        { id: 'conf_201', number: '201', price: '25000', status: 'Disponible' as const, category: 'Confort' },
        { id: 'conf_202', number: '202', price: '25000', status: 'Disponible' as const, category: 'Confort' },
        { id: 'conf_203', number: '203', price: '25000', status: 'Disponible' as const, category: 'Confort' },
        { id: 'conf_301', number: '301', price: '25000', status: 'Disponible' as const, category: 'Confort' },
        { id: 'conf_302', number: '302', price: '25000', status: 'Disponible' as const, category: 'Confort' },
        { id: 'conf_303', number: '303', price: '25000', status: 'Disponible' as const, category: 'Confort' },
        { id: 'conf_304', number: '304', price: '25000', status: 'Disponible' as const, category: 'Confort' },
        { id: 'conf_305', number: '305', price: '25000', status: 'Disponible' as const, category: 'Confort' },
        { id: 'conf_306', number: '306', price: '25000', status: 'Disponible' as const, category: 'Confort' },
        { id: 'conf_307', number: '307', price: '25000', status: 'Disponible' as const, category: 'Confort' },
        { id: 'conf_308', number: '308', price: '25000', status: 'Disponible' as const, category: 'Confort' },
        { id: 'conf_309', number: '309', price: '25000', status: 'Disponible' as const, category: 'Confort' },
        { id: 'conf_310', number: '310', price: '25000', status: 'Disponible' as const, category: 'Confort' },
        { id: 'vip_311', number: '311', price: '45000', status: 'Disponible' as const, category: 'VIP' },
        { id: 'vip_312', number: '312', price: '45000', status: 'Disponible' as const, category: 'VIP' },
        { id: 'vip_313', number: '313', price: '45000', status: 'Disponible' as const, category: 'VIP' },
        { id: 'vip_314', number: '314', price: '45000', status: 'Disponible' as const, category: 'VIP' },
        { id: 'vip_315', number: '315', price: '45000', status: 'Disponible' as const, category: 'VIP' },
        { id: 'vip_316', number: '316', price: '45000', status: 'Disponible' as const, category: 'VIP' },
        { id: 'vip_317', number: '317', price: '45000', status: 'Disponible' as const, category: 'VIP' },
        { id: 'vip_318', number: '318', price: '45000', status: 'Disponible' as const, category: 'VIP' },
        { id: 'vip_319', number: '319', price: '45000', status: 'Disponible' as const, category: 'VIP' },
        { id: 'suite_320', number: '320', price: '75000', status: 'Disponible' as const, category: 'Suite' }
    ], []);

    const categories = useMemo(() => ({
        'Standard': { color: 'from-blue-500 to-blue-600', bgColor: 'bg-blue-50', textColor: 'text-blue-800' },
        'Confort': { color: 'from-green-500 to-green-600', bgColor: 'bg-green-50', textColor: 'text-green-800' },
        'VIP': { color: 'from-purple-500 to-purple-600', bgColor: 'bg-purple-50', textColor: 'text-purple-800' },
        'Suite': { color: 'from-amber-500 to-amber-600', bgColor: 'bg-amber-50', textColor: 'text-amber-800' }
    }), []);

    const loadRooms = useCallback(async () => {
        const cacheKey = 'rooms_data';
        const cached = dataCache.get<Room[]>(cacheKey);
        if (cached && Array.isArray(cached)) {
            setRooms(cached);
            return;
        }

        setIsLoading(true);
        try {
            const localData = localStorage.getItem('rooms');
            if (localData) {
                const parsedData = JSON.parse(localData);
                if (Array.isArray(parsedData) && parsedData.length > 0) {
                    const uniqueRooms = parsedData.filter((room, index, self) => 
                        index === self.findIndex(r => r.number === room.number)
                    );
                    setRooms(uniqueRooms);
                    dataCache.set(cacheKey, uniqueRooms, 5 * 60 * 1000);
                    return;
                }
            }

            const roomsData = await loadFromFirebase('rooms');
            if (!Array.isArray(roomsData) || roomsData.length === 0) {
                setRooms(predefinedRooms);
                dataCache.set(cacheKey, predefinedRooms, 5 * 60 * 1000);
                localStorage.setItem('rooms', JSON.stringify(predefinedRooms));
            } else {
                const uniqueRooms = roomsData.filter((room, index, self) => 
                    index === self.findIndex(r => r.number === room.number)
                );
                setRooms(uniqueRooms);
                dataCache.set(cacheKey, uniqueRooms, 5 * 60 * 1000);
            }
        } catch (error) {
            setRooms(predefinedRooms);
            dataCache.set(cacheKey, predefinedRooms, 5 * 60 * 1000);
        } finally {
            setIsLoading(false);
        }
    }, [predefinedRooms]);

    useEffect(() => {
        loadRooms();
    }, [loadRooms]);

    const handleSaveRoom = useCallback(async () => {
        if (!formData.number || !formData.price || !formData.category) {
            showNotification("Veuillez remplir tous les champs", "error");
            return;
        }
        
        const existingRoom = rooms.find(room => 
            room.number === formData.number && 
            (!editingRoom || room.id !== editingRoom.id)
        );
        
        if (existingRoom) {
            showNotification(`La chambre ${formData.number} existe déjà`, "error");
            return;
        }
        
        try {
            const cleanFormData = {
                ...formData,
                price: formData.price.replace(' FCFA', '')
            };
            
            if (editingRoom) {
                const updatedRoom = { ...editingRoom, ...cleanFormData };
                await saveData('rooms', updatedRoom);
                addLog('Modification chambre', 'rooms', `Chambre modifiée: ${formData.number}`, updatedRoom);
                showNotification("Chambre modifiée avec succès!", "success");
            } else {
                const newRoom = { 
                    id: Date.now().toString(), 
                    ...cleanFormData, 
                    status: "Disponible" as const,
                    createdBy: user?.username || 'system'
                };
                await saveData('rooms', newRoom);
                addLog('Création chambre', 'rooms', `Chambre créée: ${formData.number} (${formData.category})`, newRoom);
                showNotification("Chambre ajoutée avec succès!", "success");
            }
            
            dataCache.invalidate('rooms_data');
            await loadRooms();
            window.dispatchEvent(new Event('dashboardUpdate'));
            
            setShowForm(false);
            setEditingRoom(null);
            setFormData({ number: '', price: '', category: 'Standard' });
        } catch (error) {
            showNotification("Erreur lors de la sauvegarde", "error");
        }
    }, [formData, editingRoom, rooms, showNotification, addLog, user, loadRooms]);
    
    const handleEditRoom = useCallback((room: Room) => {
        setEditingRoom(room);
        setFormData({
            number: room.number,
            price: room.price,
            category: room.category
        });
        setShowForm(true);
    }, []);
    
    const handleDeleteRoom = useCallback((roomId: string) => {
        const roomToDelete = rooms.find(r => r.id === roomId);
        if (confirm("Voulez-vous vraiment supprimer cette chambre ?")) {
            const updatedRooms = rooms.filter(room => room.id !== roomId);
            setRooms(updatedRooms);
            localStorage.setItem('rooms', JSON.stringify(updatedRooms));
            dataCache.invalidate('rooms_data');
            if (roomToDelete) {
                addLog('Suppression chambre', 'rooms', `Chambre supprimée: ${roomToDelete.number}`);
            }
            showNotification("Chambre supprimée avec succès!", "success");
        }
    }, [rooms, addLog, showNotification]);
    
    const updateRoomStatus = useCallback(async (roomId: string, newStatus: Room['status']) => {
        const room = rooms.find(r => r.id === roomId);
        if (!room) return;
        
        const updatedRoom = { ...room, status: newStatus };
        const updatedRooms = rooms.map(r => 
            r.id === roomId ? updatedRoom : r
        );
        
        setRooms(updatedRooms);
        localStorage.setItem('rooms', JSON.stringify(updatedRooms));
        dataCache.invalidate('rooms_data');
        
        try {
            await saveData('rooms', updatedRoom);
        } catch (error) {
            console.warn('Erreur sauvegarde Firebase:', error);
        }
        
        addLog('Changement statut', 'rooms', `Chambre ${room.number}: ${newStatus}`);
        
        setTimeout(() => {
            window.dispatchEvent(new Event('dashboardUpdate'));
            window.dispatchEvent(new Event('roomStatusChanged'));
        }, 100);
        
        showNotification(`Statut mis à jour: ${newStatus}`, "success");
    }, [rooms, addLog, showNotification]);

    const roomsByCategory = useMemo(() => {
        const result: Record<string, Room[]> = {};
        Object.keys(categories).forEach(category => {
            result[category] = rooms
                .filter(room => room.category === category)
                .sort((a, b) => parseInt(a.number) - parseInt(b.number));
        });
        return result;
    }, [rooms, categories]);

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6" style={{color: '#7D3837'}}>Chambres</h1>
            
            {showForm && (
                <div className="bg-yellow-50 border rounded p-4 sm:p-6 mb-4" style={{borderColor: '#7D3837'}}>
                    <h3 className="font-bold mb-4 text-lg sm:text-xl" style={{color: '#7D3837'}}>
                        {editingRoom ? 'Modifier Chambre' : 'Nouvelle Chambre'}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <input 
                            placeholder="Numéro de chambre" 
                            value={formData.number}
                            onChange={(e) => setFormData({...formData, number: e.target.value})}
                            className="p-2 border rounded" 
                            style={{borderColor: '#7D3837'}} 
                        />
                        <select
                            value={formData.category}
                            onChange={(e) => setFormData({...formData, category: e.target.value})}
                            className="p-2 border rounded"
                            style={{borderColor: '#7D3837'}}
                        >
                            <option value="Standard">Standard</option>
                            <option value="Confort">Confort</option>
                            <option value="VIP">VIP</option>
                            <option value="Suite">Suite</option>
                        </select>
                        <input 
                            type="number"
                            placeholder="Prix par nuit (FCFA)" 
                            value={formData.price}
                            onChange={(e) => {
                                const value = e.target.value.replace(/[^0-9]/g, '');
                                setFormData({...formData, price: value});
                            }}
                            className="p-2 border rounded" 
                            style={{borderColor: '#7D3837'}} 
                        />
                    </div>
                    <div className="mt-6 flex flex-col sm:flex-row gap-3">
                        <button 
                            onClick={handleSaveRoom}
                            style={{backgroundColor: '#7D3837'}} 
                            className="text-yellow-300 px-6 py-3 rounded hover:opacity-80 transition-opacity font-medium"
                        >
                            {editingRoom ? 'Modifier' : 'Enregistrer'}
                        </button>
                        <button 
                            onClick={() => {
                                setShowForm(false);
                                setEditingRoom(null);
                                setFormData({ number: '', price: '', category: 'Standard' });
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
                        <h2 className="text-lg sm:text-xl font-semibold text-slate-800">Liste des Chambres</h2>
                        <div className="flex items-center gap-3">
                            <span className="text-xs sm:text-sm text-slate-600 bg-slate-100 px-2 sm:px-3 py-1 rounded-full">
                                {rooms.length} chambre(s)
                            </span>
                            <button 
                                onClick={loadRooms}
                                disabled={isLoading}
                                className="px-3 sm:px-4 py-2 text-xs sm:text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors disabled:opacity-50"
                            >
                                {isLoading ? 'Chargement...' : 'Actualiser'}
                            </button>
                        </div>
                    </div>
                </div>
                
                <div className="p-4 sm:p-6">
                    {rooms.length === 0 ? (
                        <div className="text-center py-8 sm:py-12">
                            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                            </div>
                            <p className="text-slate-500 text-base sm:text-lg font-medium">Aucune chambre enregistrée</p>
                            <p className="text-slate-400 text-sm mt-1">Les chambres apparaîtront ici après leur ajout</p>
                        </div>
                    ) : (
                        <div className="space-y-6 sm:space-y-8">
                            {Object.keys(categories).map(category => {
                                const categoryRooms = roomsByCategory[category];
                                const categoryStyle = categories[category as keyof typeof categories];
                                
                                return (
                                    <div key={category}>
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-1 h-6 sm:h-8 bg-gradient-to-b ${categoryStyle.color} rounded-full`}></div>
                                                <h3 className="text-lg sm:text-xl font-bold text-slate-800">{category}</h3>
                                            </div>
                                            <span className={`text-xs sm:text-sm px-2 sm:px-3 py-1 rounded-full ${categoryStyle.bgColor} ${categoryStyle.textColor} self-start sm:self-auto`}>
                                                {categoryRooms.length} chambre(s)
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4">
                                            {(user?.role === 'admin' || user?.role === 'super_admin') && (
                                                <div 
                                                    onClick={() => {
                                                        setFormData({ ...formData, category });
                                                        setShowForm(true);
                                                    }}
                                                    className={`${categoryStyle.bgColor} p-4 sm:p-5 rounded-xl border-2 border-dashed border-slate-300 hover:border-slate-400 hover:shadow-lg transition-all duration-200 cursor-pointer group flex flex-col items-center justify-center min-h-[120px] sm:min-h-[140px]`}
                                                >
                                                    <div className={`w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br ${categoryStyle.color} rounded-lg flex items-center justify-center mb-2 sm:mb-3 group-hover:scale-110 transition-transform`}>
                                                        <svg className="w-4 h-4 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                        </svg>
                                                    </div>
                                                    <p className="text-xs sm:text-sm font-medium text-slate-600 text-center">Ajouter une chambre</p>
                                                    <p className={`text-xs ${categoryStyle.textColor} text-center mt-1`}>{category}</p>
                                                </div>
                                            )}
                                            
                                            {categoryRooms.map((room) => (
                                                <RoomCard
                                                    key={room.id}
                                                    room={room}
                                                    categoryStyle={categoryStyle}
                                                    user={user}
                                                    onEdit={handleEditRoom}
                                                    onDelete={handleDeleteRoom}
                                                    onStatusChange={updateRoomStatus}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}