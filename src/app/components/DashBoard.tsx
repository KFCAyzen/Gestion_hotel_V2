import OptimizedDashboard from './OptimizedDashboard';
import PageLoader from './PageLoader';
import { useAuth } from '../context/AuthContext';


function DashBoard() {
    const { user } = useAuth();

    if (user?.role !== 'admin' && user?.role !== 'super_admin') {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center p-8 bg-white rounded-xl border border-slate-200 shadow-sm">
                    <svg className="w-16 h-16 text-slate-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <h3 className="text-lg font-semibold text-slate-800 mb-2">Accès Restreint</h3>
                    <p className="text-slate-600">Le tableau de bord est réservé aux administrateurs.</p>
                </div>
            </div>
        );
    }

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
            <OptimizedDashboard />
        </PageLoader>
    );
}

export default DashBoard;