interface BillData {
    id: string;
    date: string;
    amount: string;
    receivedFrom: string;
    amountInWords: string;
    motif: 'Repos' | 'Nuitée';
    roomNumber: string;
    clientSignature: string;
    startTime?: string;
    endTime?: string;
    startDate?: string;
    endDate?: string;
    advance?: string;
    remaining?: string;
}

export const printBill = (bill: BillData) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const currentDate = new Date().toLocaleDateString('fr-FR');

    const billHTML = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Reçu - ${bill.id}</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
                .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #7D3837; padding-bottom: 20px; }
                .hotel-name { font-size: 24px; font-weight: bold; color: #7D3837; margin-bottom: 5px; }
                .bill-title { font-size: 20px; color: #7D3837; margin-top: 15px; }
                .bill-info { margin: 20px 0; }
                .section { margin-bottom: 25px; }
                .section-title { font-weight: bold; color: #7D3837; margin-bottom: 15px; border-bottom: 1px solid #ddd; padding-bottom: 5px; font-size: 16px; }
                .info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px; }
                .info-row { margin: 8px 0; }
                .label { font-weight: bold; display: inline-block; width: 150px; color: #333; }
                .value { color: #666; }
                .amount-section { text-align: center; margin: 30px 0; padding: 20px; border: 2px solid #7D3837; border-radius: 10px; }
                .amount-value { font-size: 24px; font-weight: bold; color: #7D3837; margin-bottom: 10px; }
                .amount-words { font-style: italic; color: #666; }
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
                <div class="bill-title">REÇU</div>
            </div>

            <div class="bill-info">
                <div class="section">
                    <div class="section-title">Informations du Reçu</div>
                    <div class="info-grid">
                        <div class="info-row"><span class="label">N° Reçu:</span> <span class="value">${bill.id}</span></div>
                        <div class="info-row"><span class="label">Date:</span> <span class="value">${new Date(bill.date).toLocaleDateString('fr-FR')}</span></div>
                        <div class="info-row"><span class="label">Reçu de M.:</span> <span class="value">${bill.receivedFrom}</span></div>
                        <div class="info-row"><span class="label">Chambre:</span> <span class="value">${bill.roomNumber}</span></div>
                        <div class="info-row"><span class="label">Motif:</span> <span class="value">${bill.motif}</span></div>
                        <div class="info-row"><span class="label">Signature:</span> <span class="value">${bill.clientSignature}</span></div>
                    </div>
                </div>

                ${bill.motif === 'Repos' && (bill.startTime || bill.endTime) ? `
                <div class="section">
                    <div class="section-title">Horaires de Repos</div>
                    <div class="info-grid">
                        <div class="info-row"><span class="label">Heure de début:</span> <span class="value">${bill.startTime || 'Non renseigné'}</span></div>
                        <div class="info-row"><span class="label">Heure de fin:</span> <span class="value">${bill.endTime || 'Non renseigné'}</span></div>
                    </div>
                </div>
                ` : ''}

                ${bill.motif === 'Nuitée' && (bill.startDate || bill.endDate) ? `
                <div class="section">
                    <div class="section-title">Période de Nuitée</div>
                    <div class="info-grid">
                        <div class="info-row"><span class="label">Date de début:</span> <span class="value">${bill.startDate ? new Date(bill.startDate).toLocaleDateString('fr-FR') : 'Non renseigné'}</span></div>
                        <div class="info-row"><span class="label">Date de fin:</span> <span class="value">${bill.endDate ? new Date(bill.endDate).toLocaleDateString('fr-FR') : 'Non renseigné'}</span></div>
                    </div>
                </div>
                ` : ''}

                ${bill.advance || bill.remaining ? `
                <div class="section">
                    <div class="section-title">Détails de Paiement</div>
                    <div class="info-grid">
                        ${bill.advance ? `<div class="info-row"><span class="label">Avance:</span> <span class="value">${parseInt(bill.advance).toLocaleString('fr-FR')} FCFA</span></div>` : ''}
                        ${bill.remaining ? `<div class="info-row"><span class="label">Reste:</span> <span class="value">${parseInt(bill.remaining).toLocaleString('fr-FR')} FCFA</span></div>` : ''}
                    </div>
                </div>
                ` : ''}

                <div class="amount-section">
                    <div class="amount-value">${parseInt(bill.amount).toLocaleString('fr-FR')} FCFA</div>
                    <div class="amount-words">${bill.amountInWords}</div>
                </div>
            </div>

            <div class="footer">
                <p>Reçu généré automatiquement le ${currentDate}</p>
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

    printWindow.document.write(billHTML);
    printWindow.document.close();
    printWindow.focus();
};