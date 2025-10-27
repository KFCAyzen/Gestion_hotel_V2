"use client";

import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import UserManagement from './UserManagement';
import ActivityHistory from './ActivityHistory';
import PerformanceHistory from './PerformanceHistory';
import StaffSchedulePage from './StaffSchedulePage';
import { generateTestData, clearAllData, resetRoomsToDefault } from '../utils/generateTestData';
import PageLoader from './PageLoader';

export default function AdminPage() {
    const { user } = useAuth();
    const [activeSection, setActiveSection] = useState('overview');

    const handleDataAction = async (action: 'generate' | 'reset' | 'clear') => {
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

    const renderContent = () => {
        switch (activeSection) {
            case 'users':
                return <UserManagement />;
            case 'history':
                return <ActivityHistory />;
            case 'performance':
                return <PerformanceHistory />;
            case 'schedule':
                return <StaffSchedulePage />;
            case 'overview':
            default:
                return (
                    <div className="space-y-6">
                        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                            <h2 className="text-xl font-bold text-slate-800 mb-4">Vue d'ensemble Administration</h2>
                            <p className="text-slate-600 mb-6">
                                Bienvenue dans l'espace d'administration. Utilisez les sections ci-dessous pour gérer votre hôtel.
                            </p>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                    <div className="flex items-center gap-3 mb-2">
                                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                                        </svg>
                                        <h3 className="font-semibold text-blue-800">Utilisateurs</h3>
                                    </div>
                                    <p className="text-sm text-blue-600">Gérer les comptes utilisateurs et leurs permissions</p>
                                </div>
                                
                                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                                    <div className="flex items-center gap-3 mb-2">
                                        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        <h3 className="font-semibold text-green-800">Historique</h3>
                                    </div>
                                    <p className="text-sm text-green-600">Consulter l'historique des activités et actions</p>
                                </div>
                                
                                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                                    <div className="flex items-center gap-3 mb-2">
                                        <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                        </svg>
                                        <h3 className="font-semibold text-purple-800">Performances</h3>
                                    </div>
                                    <p className="text-sm text-purple-600">Analyser les performances et métriques système</p>
                                </div>
                                
                                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                                    <div className="flex items-center gap-3 mb-2">
                                        <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        <h3 className="font-semibold text-orange-800">Planning</h3>
                                    </div>
                                    <p className="text-sm text-orange-600">Gérer les plannings des employés</p>
                                </div>
                            </div>
                        </div>

                        {/* Actions de données */}
                        {user?.role === 'super_admin' && (
                            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                                <h3 className="text-lg font-semibold text-slate-800 mb-4">Actions sur les Données</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <button
                                        onClick={() => handleDataAction('generate')}
                                        className="p-4 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors text-left"
                                    >
                                        <div className="flex items-center gap-3 mb-2">
                                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                            </svg>
                                            <span className="font-medium text-blue-800">Générer Données Test</span>
                                        </div>
                                        <p className="text-sm text-blue-600">Ajouter des données fictives pour les tests</p>
                                    </button>
                                    
                                    <button
                                        onClick={() => handleDataAction('reset')}
                                        className="p-4 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-lg transition-colors text-left"
                                    >
                                        <div className="flex items-center gap-3 mb-2">
                                            <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                            </svg>
                                            <span className="font-medium text-orange-800">Reset Chambres</span>
                                        </div>
                                        <p className="text-sm text-orange-600">Réinitialiser aux 27 chambres par défaut</p>
                                    </button>
                                    
                                    <button
                                        onClick={() => handleDataAction('clear')}
                                        className="p-4 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors text-left"
                                    >
                                        <div className="flex items-center gap-3 mb-2">
                                            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                            <span className="font-medium text-red-800">Vider Données</span>
                                        </div>
                                        <p className="text-sm text-red-600">Supprimer toutes les données (irréversible)</p>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                );
        }
    };

    return (
        <PageLoader
            loadingSteps={[
                'Chargement de l\'administration...',
                'Vérification des permissions...',
                'Finalisation...'
            ]}
            minLoadTime={600}
        >
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">Administration</h1>
                        <p className="text-slate-600">Gestion avancée de votre établissement</p>
                    </div>
                </div>

                {/* Navigation des sections */}
                <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                    <nav className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setActiveSection('overview')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                activeSection === 'overview'
                                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                                    : 'text-slate-600 hover:bg-slate-100'
                            }`}
                        >
                            Vue d'ensemble
                        </button>
                        <button
                            onClick={() => setActiveSection('users')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                activeSection === 'users'
                                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                                    : 'text-slate-600 hover:bg-slate-100'
                            }`}
                        >
                            Utilisateurs
                        </button>
                        <button
                            onClick={() => setActiveSection('history')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                activeSection === 'history'
                                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                                    : 'text-slate-600 hover:bg-slate-100'
                            }`}
                        >
                            Historique
                        </button>
                        <button
                            onClick={() => setActiveSection('performance')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                activeSection === 'performance'
                                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                                    : 'text-slate-600 hover:bg-slate-100'
                            }`}
                        >
                            Performances
                        </button>
                        <button
                            onClick={() => setActiveSection('schedule')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                activeSection === 'schedule'
                                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                                    : 'text-slate-600 hover:bg-slate-100'
                            }`}
                        >
                            Planning Employés
                        </button>
                    </nav>
                </div>

                {/* Contenu de la section active */}
                <div className="min-h-[400px]">
                    {renderContent()}
                </div>
            </div>
        </PageLoader>
    );
}