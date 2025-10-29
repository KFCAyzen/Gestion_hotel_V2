interface Room {
    id: string;
    number: string;
    price: string;
    status: 'Disponible' | 'Occupée' | 'Maintenance' | 'Nettoyage';
    category: string;
}

export const printRoomsList = (rooms: Room[]) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const currentDate = new Date().toLocaleDateString('fr-FR');
    const currentTime = new Date().toLocaleTimeString('fr-FR');

    // Grouper les chambres par catégorie
    const roomsByCategory = rooms.reduce((acc, room) => {
        if (!acc[room.category]) {
            acc[room.category] = [];
        }
        acc[room.category].push(room);
        return acc;
    }, {} as Record<string, Room[]>);

    // Statistiques
    const totalRooms = rooms.length;
    const availableRooms = rooms.filter(r => r.status === 'Disponible').length;
    const occupiedRooms = rooms.filter(r => r.status === 'Occupée').length;
    const maintenanceRooms = rooms.filter(r => r.status === 'Maintenance').length;
    const cleaningRooms = rooms.filter(r => r.status === 'Nettoyage').length;

    const roomsListHTML = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Liste des Chambres</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
                .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #7D3837; padding-bottom: 20px; }
                .hotel-name { font-size: 24px; font-weight: bold; color: #7D3837; margin-bottom: 5px; }
                .list-title { font-size: 20px; color: #7D3837; margin-top: 15px; }
                .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 20px 0; }
                .stat-card { border: 1px solid #ddd; padding: 15px; border-radius: 8px; text-align: center; }
                .stat-number { font-size: 24px; font-weight: bold; color: #7D3837; }
                .stat-label { font-size: 14px; color: #666; margin-top: 5px; }
                .category-section { margin: 30px 0; }
                .category-title { font-size: 18px; font-weight: bold; color: #7D3837; margin-bottom: 15px; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
                .rooms-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                .rooms-table th, .rooms-table td { border: 1px solid #ddd; padding: 10px; text-align: left; }
                .rooms-table th { background-color: #7D3837; color: white; }
                .status-disponible { background-color: #dcfce7; color: #166534; padding: 4px 8px; border-radius: 4px; font-size: 12px; }
                .status-occupee { background-color: #dbeafe; color: #1e40af; padding: 4px 8px; border-radius: 4px; font-size: 12px; }
                .status-maintenance { background-color: #fef3c7; color: #92400e; padding: 4px 8px; border-radius: 4px; font-size: 12px; }
                .status-nettoyage { background-color: #e9d5ff; color: #7c2d12; padding: 4px 8px; border-radius: 4px; font-size: 12px; }
                .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #ddd; padding-top: 20px; }
                @media print {
                    body { margin: 0; }
                    .no-print { display: none; }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="hotel-name">HÔTEL GESTION</div>
                <div>Système de Gestion Hôtelière</div>
                <div class="list-title">LISTE DES CHAMBRES</div>
                <div style="font-size: 14px; color: #666; margin-top: 10px;">
                    Généré le ${currentDate} à ${currentTime}
                </div>
            </div>

            <div class="stats">
                <div class="stat-card">
                    <div class="stat-number">${totalRooms}</div>
                    <div class="stat-label">Total Chambres</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${availableRooms}</div>
                    <div class="stat-label">Disponibles</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${occupiedRooms}</div>
                    <div class="stat-label">Occupées</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${maintenanceRooms}</div>
                    <div class="stat-label">Maintenance</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${cleaningRooms}</div>
                    <div class="stat-label">Nettoyage</div>
                </div>
            </div>

            ${Object.keys(roomsByCategory).map(category => `
                <div class="category-section">
                    <div class="category-title">${category} (${roomsByCategory[category].length} chambres)</div>
                    <table class="rooms-table">
                        <thead>
                            <tr>
                                <th>Numéro</th>
                                <th>Prix/Nuit</th>
                                <th>Statut</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${roomsByCategory[category]
                                .sort((a, b) => parseInt(a.number) - parseInt(b.number))
                                .map(room => `
                                <tr>
                                    <td>Chambre ${room.number}</td>
                                    <td>${parseInt(room.price).toLocaleString('fr-FR')} FCFA</td>
                                    <td>
                                        <span class="status-${room.status.toLowerCase().replace('é', 'e')}">${room.status}</span>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `).join('')}

            <div class="footer">
                <p>Liste des chambres générée automatiquement le ${currentDate} à ${currentTime}</p>
                <p>HÔTEL GESTION - Système de Gestion Hôtelière</p>
            </div>

            <div class="no-print" style="margin-top: 30px; text-align: center;">
                <button onclick="window.print()" style="background: #7D3837; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer;">
                    Imprimer
                </button>
                <button onclick="window.close()" style="background: #666; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; margin-left: 10px;">
                    Fermer
                </button>
            </div>
        </body>
        </html>
    `;

    printWindow.document.write(roomsListHTML);
    printWindow.document.close();
    printWindow.focus();
};