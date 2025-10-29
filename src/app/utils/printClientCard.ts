interface ClientData {
    id: string;
    name: string;
    phone: string;
    email: string;
    address?: string;
    nationality?: string;
    occupation?: string;
    birthPlace?: string;
    residenceCountry?: string;
    idNumber?: string;
    idIssueDate?: string;
    idIssuePlace?: string;
    idExpiryDate?: string;
    gender?: string;
    arrivalMode?: string;
    arrivalDate?: string;
    plateNumber?: string;
    departureMode?: string;
    departureDate?: string;
    comingFrom?: string;
    goingTo?: string;
    stayType?: string;
    mealPlan?: string;
    price?: string;
    signature?: string;
}

export const printClientCard = (client: ClientData) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const currentDate = new Date().toLocaleDateString('fr-FR');

    const clientCardHTML = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Fiche Client - ${client.name}</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
                .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #7D3837; padding-bottom: 20px; }
                .hotel-name { font-size: 24px; font-weight: bold; color: #7D3837; margin-bottom: 5px; }
                .card-title { font-size: 20px; color: #7D3837; margin-top: 15px; }
                .client-info { margin: 20px 0; }
                .section { margin-bottom: 25px; }
                .section-title { font-weight: bold; color: #7D3837; margin-bottom: 15px; border-bottom: 1px solid #ddd; padding-bottom: 5px; font-size: 16px; }
                .info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px; }
                .info-row { margin: 8px 0; }
                .label { font-weight: bold; display: inline-block; width: 150px; color: #333; }
                .value { color: #666; }
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
                <div class="card-title">FICHE CLIENT</div>
            </div>

            <div class="client-info">
                <div class="section">
                    <div class="section-title">Informations Personnelles</div>
                    <div class="info-grid">
                        <div class="info-row"><span class="label">Nom complet:</span> <span class="value">${client.name}</span></div>
                        <div class="info-row"><span class="label">ID Client:</span> <span class="value">${client.id}</span></div>
                        <div class="info-row"><span class="label">Téléphone:</span> <span class="value">${client.phone}</span></div>
                        <div class="info-row"><span class="label">Email:</span> <span class="value">${client.email || 'Non renseigné'}</span></div>
                        ${client.gender ? `<div class="info-row"><span class="label">Sexe:</span> <span class="value">${client.gender}</span></div>` : ''}
                        ${client.nationality ? `<div class="info-row"><span class="label">Nationalité:</span> <span class="value">${client.nationality}</span></div>` : ''}
                        ${client.occupation ? `<div class="info-row"><span class="label">Occupation:</span> <span class="value">${client.occupation}</span></div>` : ''}
                    </div>
                </div>

                ${client.address || client.birthPlace || client.residenceCountry ? `
                <div class="section">
                    <div class="section-title">Adresses et Lieux</div>
                    <div class="info-grid">
                        ${client.address ? `<div class="info-row"><span class="label">Adresse:</span> <span class="value">${client.address}</span></div>` : ''}
                        ${client.birthPlace ? `<div class="info-row"><span class="label">Lieu de naissance:</span> <span class="value">${client.birthPlace}</span></div>` : ''}
                        ${client.residenceCountry ? `<div class="info-row"><span class="label">Pays de résidence:</span> <span class="value">${client.residenceCountry}</span></div>` : ''}
                    </div>
                </div>
                ` : ''}

                ${client.idNumber || client.idIssueDate || client.idIssuePlace || client.idExpiryDate ? `
                <div class="section">
                    <div class="section-title">Pièce d'Identification</div>
                    <div class="info-grid">
                        ${client.idNumber ? `<div class="info-row"><span class="label">Numéro:</span> <span class="value">${client.idNumber}</span></div>` : ''}
                        ${client.idIssueDate ? `<div class="info-row"><span class="label">Date de délivrance:</span> <span class="value">${new Date(client.idIssueDate).toLocaleDateString('fr-FR')}</span></div>` : ''}
                        ${client.idIssuePlace ? `<div class="info-row"><span class="label">Lieu de délivrance:</span> <span class="value">${client.idIssuePlace}</span></div>` : ''}
                        ${client.idExpiryDate ? `<div class="info-row"><span class="label">Date d'expiration:</span> <span class="value">${new Date(client.idExpiryDate).toLocaleDateString('fr-FR')}</span></div>` : ''}
                    </div>
                </div>
                ` : ''}

                ${client.arrivalMode || client.arrivalDate || client.departureMode || client.departureDate || client.plateNumber || client.comingFrom || client.goingTo ? `
                <div class="section">
                    <div class="section-title">Transport et Déplacement</div>
                    <div class="info-grid">
                        ${client.arrivalMode ? `<div class="info-row"><span class="label">Mode d'arrivée:</span> <span class="value">${client.arrivalMode}</span></div>` : ''}
                        ${client.arrivalDate ? `<div class="info-row"><span class="label">Date d'arrivée:</span> <span class="value">${new Date(client.arrivalDate).toLocaleDateString('fr-FR')}</span></div>` : ''}
                        ${client.plateNumber ? `<div class="info-row"><span class="label">Plaque d'immatriculation:</span> <span class="value">${client.plateNumber}</span></div>` : ''}
                        ${client.departureMode ? `<div class="info-row"><span class="label">Mode de départ:</span> <span class="value">${client.departureMode}</span></div>` : ''}
                        ${client.departureDate ? `<div class="info-row"><span class="label">Date de départ:</span> <span class="value">${new Date(client.departureDate).toLocaleDateString('fr-FR')}</span></div>` : ''}
                        ${client.comingFrom ? `<div class="info-row"><span class="label">Venant de:</span> <span class="value">${client.comingFrom}</span></div>` : ''}
                        ${client.goingTo ? `<div class="info-row"><span class="label">Allant à:</span> <span class="value">${client.goingTo}</span></div>` : ''}
                    </div>
                </div>
                ` : ''}

                ${client.stayType || client.mealPlan || client.price || client.signature ? `
                <div class="section">
                    <div class="section-title">Séjour et Tarification</div>
                    <div class="info-grid">
                        ${client.stayType ? `<div class="info-row"><span class="label">Type de séjour:</span> <span class="value">${client.stayType}</span></div>` : ''}
                        ${client.mealPlan ? `<div class="info-row"><span class="label">Étage:</span> <span class="value">${client.mealPlan}</span></div>` : ''}
                        ${client.price ? `<div class="info-row"><span class="label">Prix:</span> <span class="value">${parseInt(client.price).toLocaleString('fr-FR')} FCFA</span></div>` : ''}
                        ${client.signature ? `<div class="info-row"><span class="label">Signature:</span> <span class="value">${client.signature}</span></div>` : ''}
                    </div>
                </div>
                ` : ''}
            </div>

            <div class="footer">
                <p>Fiche client générée automatiquement le ${currentDate}</p>
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

    printWindow.document.write(clientCardHTML);
    printWindow.document.close();
    printWindow.focus();
};