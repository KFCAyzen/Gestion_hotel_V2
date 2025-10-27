import OptimizedDashboard from './OptimizedDashboard';
import PageLoader from './PageLoader';
import { useAuth } from '../context/AuthContext';
import { generateTestData, clearAllData, resetRoomsToDefault } from '../utils/generateTestData';
import { useState } from 'react';

function DashBoard() {
    const { user } = useAuth();
    const [showAdminButtons, setShowAdminButtons] = useState(false);

    const handleAdminAction = async (action: 'generate' | 'reset' | 'clear') => {
        let message = '';
        let confirmMessage = '';
        
        switch (action) {
            case 'generate':
                message = 'Générer des données de test ? Cela ajoutera des clients, réservations et factures fictives.';
                confirmMessage = 'Données de test générées avec succès!';
                break;
            case 'reset':
                message = 'Réinitialiser les chambres aux 27 par défaut ?';
                confirmMessage = 'Chambres réinitialisées aux 27 par défaut';
                break;
            case 'clear':
                message = 'Supprimer toutes les données ? Cette action est irréversible.';
                confirmMessage = 'Toutes les données ont été supprimées';
                break;
        }
        
        if (confirm(message)) {
            let success = false;
            
            switch (action) {
                case 'generate':
                    success = await generateTestData();
                    break;
                case 'reset':
                    resetRoomsToDefault();
                    success = true;
                    break;
                case 'clear':
                    clearAllData();
                    success = true;
                    break;
            }
            
            if (success) {
                alert(confirmMessage);
                window.location.reload();
            } else {
                alert('Erreur lors de l\'opération');
            }
        }
    };

    return (
        <PageLoader
            loadingSteps={[
                'Initialisation du tableau de bord...',
                'Chargement des données des chambres...',
                'Calcul des statistiques...',
                'Finalisation...'
            ]}
            minLoadTime={800}
        >
            <div className="space-y-6">
                <OptimizedDashboard />
                
                {/* Boutons admin */}
                {user?.role === 'super_admin' && (
                    <div className="fixed bottom-4 right-4 z-50">
                        <div className="flex flex-col gap-2">
                            {showAdminButtons && (
                                <div className="flex flex-col gap-2 mb-2">
                                    <button
                                        onClick={() => handleAdminAction('generate')}
                                        className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs transition-colors shadow-lg"
                                    >
                                        Données test
                                    </button>
                                    <button
                                        onClick={() => handleAdminAction('reset')}
                                        className="px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs transition-colors shadow-lg"
                                    >
                                        Reset chambres
                                    </button>
                                    <button
                                        onClick={() => handleAdminAction('clear')}
                                        className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs transition-colors shadow-lg"
                                    >
                                        Vider données
                                    </button>
                                </div>
                            )}
                            <button
                                onClick={() => setShowAdminButtons(!showAdminButtons)}
                                className="w-12 h-12 bg-slate-800 hover:bg-slate-900 text-white rounded-full flex items-center justify-center shadow-lg transition-colors"
                            >
                                {showAdminButtons ? '×' : '⚙'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </PageLoader>
    );
}

export default DashBoard;