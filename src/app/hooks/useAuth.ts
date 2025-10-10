import { useState, useEffect } from 'react';

/**
 * Hook personnalisé pour gérer l'authentification
 * Utilise localStorage pour persister l'état de connexion
 */
export const useAuth = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Vérifier l'état d'authentification au chargement
        const authStatus = localStorage.getItem('isAuthenticated');
        if (authStatus === 'true') {
            setIsAuthenticated(true);
        }
        setIsLoading(false);
    }, []);

    /**
     * Connecter l'utilisateur et sauvegarder l'état
     */
    const login = () => {
        setIsAuthenticated(true);
        localStorage.setItem('isAuthenticated', 'true');
    };

    /**
     * Déconnecter l'utilisateur et nettoyer l'état
     */
    const logout = () => {
        setIsAuthenticated(false);
        localStorage.removeItem('isAuthenticated');
    };

    return {
        isAuthenticated,
        isLoading,
        login,
        logout
    };
};