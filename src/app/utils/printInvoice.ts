interface ReservationData {
    id: string;
    clientName: string;
    roomNumber: string;
    checkIn: string;
    checkOut: string;
    totalPrice: string;
    clientPhone?: string;
    clientEmail?: string;
}

export const printInvoice = (reservation: ReservationData) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const nights = Math.ceil((new Date(reservation.checkOut).getTime() - new Date(reservation.checkIn).getTime()) / (1000 * 60 * 60 * 24));
    const currentDate = new Date().toLocaleDateString('fr-FR');

    const invoiceHTML = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Facture - ${reservation.id}</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
                .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #7D3837; padding-bottom: 20px; }
                .hotel-name { font-size: 24px; font-weight: bold; color: #7D3837; margin-bottom: 5px; }
                .invoice-title { font-size: 20px; color: #7D3837; margin-top: 15px; }
                .invoice-info { display: flex; justify-content: space-between; margin: 20px 0; }
                .client-info, .reservation-info { width: 48%; }
                .section-title { font-weight: bold; color: #7D3837; margin-bottom: 10px; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
                .info-row { margin: 8px 0; }
                .label { font-weight: bold; display: inline-block; width: 120px; }
                .details-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                .details-table th, .details-table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
                .details-table th { background-color: #7D3837; color: white; }
                .total-section { text-align: right; margin-top: 20px; }
                .total-amount { font-size: 18px; font-weight: bold; color: #7D3837; }
                .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; }
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
                <div class="invoice-title">FACTURE</div>
            </div>

            <div class="invoice-info">
                <div class="client-info">
                    <div class="section-title">Informations Client</div>
                    <div class="info-row"><span class="label">Nom:</span> ${reservation.clientName}</div>
                    ${reservation.clientPhone ? `<div class="info-row"><span class="label">Téléphone:</span> ${reservation.clientPhone}</div>` : ''}
                    ${reservation.clientEmail ? `<div class="info-row"><span class="label">Email:</span> ${reservation.clientEmail}</div>` : ''}
                </div>
                <div class="reservation-info">
                    <div class="section-title">Détails Facture</div>
                    <div class="info-row"><span class="label">N° Facture:</span> ${reservation.id}</div>
                    <div class="info-row"><span class="label">Date:</span> ${currentDate}</div>
                    <div class="info-row"><span class="label">Chambre:</span> ${reservation.roomNumber}</div>
                </div>
            </div>

            <table class="details-table">
                <thead>
                    <tr>
                        <th>Description</th>
                        <th>Date d'arrivée</th>
                        <th>Date de départ</th>
                        <th>Nombre de nuits</th>
                        <th>Montant</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Séjour - Chambre ${reservation.roomNumber}</td>
                        <td>${new Date(reservation.checkIn).toLocaleDateString('fr-FR')}</td>
                        <td>${new Date(reservation.checkOut).toLocaleDateString('fr-FR')}</td>
                        <td>${nights}</td>
                        <td>${parseInt(reservation.totalPrice).toLocaleString('fr-FR')} FCFA</td>
                    </tr>
                </tbody>
            </table>

            <div class="total-section">
                <div class="total-amount">
                    TOTAL: ${parseInt(reservation.totalPrice).toLocaleString('fr-FR')} FCFA
                </div>
            </div>

            <div class="footer">
                <p>Merci pour votre séjour dans notre établissement</p>
                <p>Cette facture a été générée automatiquement le ${currentDate}</p>
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

    printWindow.document.write(invoiceHTML);
    printWindow.document.close();
    printWindow.focus();
};