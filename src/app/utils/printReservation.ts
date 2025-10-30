interface ReservationData {
    id: string;
    clientName: string;
    roomNumber: string;
    checkIn: string;
    checkOut: string;
    totalPrice: string;
    clientPhone?: string;
    clientEmail?: string;
    address?: string;
    occupation?: string;
    nationality?: string;
    birthPlace?: string;
    residenceCountry?: string;
    idNumber?: string;
    idIssueDate?: string;
    idIssuePlace?: string;
    idExpiryDate?: string;
    gender?: string;
    arrivalMode?: string;
    plateNumber?: string;
    departureMode?: string;
    comingFrom?: string;
    goingTo?: string;
    stayType?: string;
    mealPlan?: string;
    signature?: string;
    duration?: string;
}

export const printReservation = (reservation: ReservationData) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const currentDate = new Date().toLocaleDateString('fr-FR');
    const nights = reservation.checkOut ? Math.ceil((new Date(reservation.checkOut).getTime() - new Date(reservation.checkIn).getTime()) / (1000 * 60 * 60 * 24)) : 1;

    const reservationHTML = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Fiche Réservation - ${reservation.id}</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
                .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #7D3837; padding-bottom: 20px; }
                .hotel-name { font-size: 24px; font-weight: bold; color: #7D3837; margin-bottom: 5px; }
                .reservation-title { font-size: 20px; color: #7D3837; margin-top: 15px; }
                .reservation-info { margin: 20px 0; }
                .section { margin-bottom: 25px; }
                .section-title { font-weight: bold; color: #7D3837; margin-bottom: 15px; border-bottom: 1px solid #ddd; padding-bottom: 5px; font-size: 16px; }
                .info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px; }
                .info-row { margin: 8px 0; }
                .label { font-weight: bold; display: inline-block; width: 150px; color: #333; }
                .value { color: #666; }
                .highlight-section { background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #7D3837; }
                .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #ddd; padding-top: 20px; }
                @media print {
                    body { margin: 0; }
                    .no-print { display: none; }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="hotel-name">PAULINA HÔTEL</div>
                <div class="reservation-title">FICHE DE RÉSERVATION</div>
            </div>

            <div class="reservation-info">
                <div class="highlight-section">
                    <div class="section-title">Informations de Réservation</div>
                    <div class="info-grid">
                        <div class="info-row"><span class="label">N° Réservation:</span> <span class="value">${reservation.id}</span></div>
                        <div class="info-row"><span class="label">Chambre:</span> <span class="value">${reservation.roomNumber}</span></div>
                        <div class="info-row"><span class="label">Date d'arrivée:</span> <span class="value">${new Date(reservation.checkIn).toLocaleDateString('fr-FR')}</span></div>
                        <div class="info-row"><span class="label">Date de départ:</span> <span class="value">${reservation.checkOut ? new Date(reservation.checkOut).toLocaleDateString('fr-FR') : 'Non renseigné'}</span></div>
                        <div class="info-row"><span class="label">Nombre de nuits:</span> <span class="value">${nights}</span></div>
                        <div class="info-row"><span class="label">Prix total:</span> <span class="value">${reservation.totalPrice ? parseInt(reservation.totalPrice).toLocaleString('fr-FR') + ' FCFA' : 'Non renseigné'}</span></div>
                    </div>
                </div>

                <div class="section">
                    <div class="section-title">Informations Client</div>
                    <div class="info-grid">
                        <div class="info-row"><span class="label">Nom complet:</span> <span class="value">${reservation.clientName}</span></div>
                        <div class="info-row"><span class="label">Téléphone:</span> <span class="value">${reservation.clientPhone || 'Non renseigné'}</span></div>
                        <div class="info-row"><span class="label">Email:</span> <span class="value">${reservation.clientEmail || 'Non renseigné'}</span></div>
                        <div class="info-row"><span class="label">Sexe:</span> <span class="value">${reservation.gender || 'Non renseigné'}</span></div>
                        <div class="info-row"><span class="label">Nationalité:</span> <span class="value">${reservation.nationality || 'Non renseigné'}</span></div>
                        <div class="info-row"><span class="label">Occupation:</span> <span class="value">${reservation.occupation || 'Non renseigné'}</span></div>
                    </div>
                </div>

                <div class="section">
                    <div class="section-title">Adresses et Lieux</div>
                    <div class="info-grid">
                        <div class="info-row"><span class="label">Adresse:</span> <span class="value">${reservation.address || 'Non renseigné'}</span></div>
                        <div class="info-row"><span class="label">Lieu de naissance:</span> <span class="value">${reservation.birthPlace || 'Non renseigné'}</span></div>
                        <div class="info-row"><span class="label">Pays de résidence:</span> <span class="value">${reservation.residenceCountry || 'Non renseigné'}</span></div>
                    </div>
                </div>

                <div class="section">
                    <div class="section-title">Pièce d'Identification</div>
                    <div class="info-grid">
                        <div class="info-row"><span class="label">Numéro:</span> <span class="value">${reservation.idNumber || 'Non renseigné'}</span></div>
                        <div class="info-row"><span class="label">Date de délivrance:</span> <span class="value">${reservation.idIssueDate ? new Date(reservation.idIssueDate).toLocaleDateString('fr-FR') : 'Non renseigné'}</span></div>
                        <div class="info-row"><span class="label">Lieu de délivrance:</span> <span class="value">${reservation.idIssuePlace || 'Non renseigné'}</span></div>
                        <div class="info-row"><span class="label">Date d'expiration:</span> <span class="value">${reservation.idExpiryDate ? new Date(reservation.idExpiryDate).toLocaleDateString('fr-FR') : 'Non renseigné'}</span></div>
                    </div>
                </div>

                <div class="section">
                    <div class="section-title">Transport et Déplacement</div>
                    <div class="info-grid">
                        <div class="info-row"><span class="label">Mode d'arrivée:</span> <span class="value">${reservation.arrivalMode || 'Non renseigné'}</span></div>
                        <div class="info-row"><span class="label">Plaque d'immatriculation:</span> <span class="value">${reservation.plateNumber || 'Non renseigné'}</span></div>
                        <div class="info-row"><span class="label">Mode de départ:</span> <span class="value">${reservation.departureMode || 'Non renseigné'}</span></div>
                        <div class="info-row"><span class="label">Venant de:</span> <span class="value">${reservation.comingFrom || 'Non renseigné'}</span></div>
                        <div class="info-row"><span class="label">Allant à:</span> <span class="value">${reservation.goingTo || 'Non renseigné'}</span></div>
                    </div>
                </div>

                <div class="section">
                    <div class="section-title">Séjour</div>
                    <div class="info-grid">
                        <div class="info-row"><span class="label">Type de séjour:</span> <span class="value">${reservation.stayType || 'Non renseigné'}</span></div>
                        <div class="info-row"><span class="label">Étage:</span> <span class="value">${reservation.mealPlan || 'Non renseigné'}</span></div>
                        <div class="info-row"><span class="label">Signature:</span> <span class="value">${reservation.signature || 'Non renseigné'}</span></div>
                    </div>
                </div>
            </div>

            <div class="footer">
                <p>Fiche de réservation générée automatiquement le ${currentDate}</p>
                <p>PAULINA HÔTEL</p>
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

    printWindow.document.write(reservationHTML);
    printWindow.document.close();
    printWindow.focus();
};