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
                body { font-family: Arial, sans-serif; margin: 0; padding: 10px; width: 80mm; font-size: 12px; }
                .header { text-align: center; margin-bottom: 15px; border-bottom: 1px solid #000; padding-bottom: 10px; }
                .hotel-name { font-size: 16px; font-weight: bold; margin-bottom: 5px; }
                .invoice-title { font-size: 14px; font-weight: bold; }
                .info-row { margin: 3px 0; display: flex; justify-content: space-between; }
                .label { font-weight: bold; }
                .separator { border-top: 1px dashed #000; margin: 10px 0; }
                .total-section { text-align: center; margin: 10px 0; padding: 5px; border: 1px solid #000; }
                .total-amount { font-size: 14px; font-weight: bold; }
                .footer { text-align: center; margin-top: 15px; font-size: 10px; }
                @media print {
                    body { margin: 0; width: 80mm; }
                    .no-print { display: none; }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="hotel-name">PAULINA HÔTEL</div>
                <div class="invoice-title">FACTURE</div>
            </div>

            <div class="info-row">
                <span class="label">N°:</span>
                <span>${reservation.id}</span>
            </div>
            <div class="info-row">
                <span class="label">Date:</span>
                <span>${currentDate}</span>
            </div>
            <div class="info-row">
                <span class="label">Client:</span>
                <span>${reservation.clientName}</span>
            </div>
            ${reservation.clientPhone ? `<div class="info-row"><span class="label">Tél:</span><span>${reservation.clientPhone}</span></div>` : ''}
            <div class="info-row">
                <span class="label">Chambre:</span>
                <span>${reservation.roomNumber}</span>
            </div>

            <div class="separator"></div>

            <div class="info-row">
                <span>Séjour - Ch. ${reservation.roomNumber}</span>
            </div>
            <div class="info-row">
                <span class="label">Arrivée:</span>
                <span>${new Date(reservation.checkIn).toLocaleDateString('fr-FR')}</span>
            </div>
            <div class="info-row">
                <span class="label">Départ:</span>
                <span>${new Date(reservation.checkOut).toLocaleDateString('fr-FR')}</span>
            </div>
            <div class="info-row">
                <span class="label">Nuits:</span>
                <span>${nights}</span>
            </div>

            <div class="separator"></div>

            <div class="total-section">
                <div class="total-amount">
                    TOTAL: ${parseInt(reservation.totalPrice).toLocaleString('fr-FR')} FCFA
                </div>
            </div>

            <div class="footer">
                <p>Merci pour votre séjour</p>
                <p>PAULINA HÔTEL</p>
            </div>

            <div class="no-print" style="margin-top: 20px; text-align: center;">
                <button onclick="window.print()" style="background: #000; color: white; padding: 8px 15px; border: none; border-radius: 3px; cursor: pointer; font-size: 12px;">
                    Imprimer
                </button>
                <button onclick="window.close()" style="background: #666; color: white; padding: 8px 15px; border: none; border-radius: 3px; cursor: pointer; margin-left: 10px; font-size: 12px;">
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