"use client";

import { ReactNode, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import PageLoader from './PageLoader';

interface GlobalPageWrapperProps {
    children: ReactNode;
}

const getLoadingStepsForRoute = (pathname: string): string[] => {
    switch (pathname) {
        case '/':
        case '/dashboard':
            return [
                'Initialisation du tableau de bord...',
                'Chargement des données des chambres...',
                'Calcul des statistiques...',
                'Finalisation...'
            ];
        case '/rooms':
            return [
                'Chargement des chambres...',
                'Vérification des statuts...',
                'Finalisation...'
            ];
        case '/clients':
            return [
                'Chargement des clients...',
                'Tri des données...',
                'Finalisation...'
            ];
        case '/reservations':
            return [
                'Chargement des réservations...',
                'Vérification des disponibilités...',
                'Finalisation...'
            ];
        case '/billing':
            return [
                'Chargement des factures...',
                'Calcul des totaux...',
                'Finalisation...'
            ];
        default:
            return [
                'Chargement de la page...',
                'Initialisation...',
                'Finalisation...'
            ];
    }
};

export default function GlobalPageWrapper({ children }: GlobalPageWrapperProps) {
    const pathname = usePathname();
    const [shouldShowLoader, setShouldShowLoader] = useState(true);
    const [loadingSteps, setLoadingSteps] = useState<string[]>([]);

    useEffect(() => {
        // Réinitialiser le loader à chaque changement de route
        setShouldShowLoader(true);
        setLoadingSteps(getLoadingStepsForRoute(pathname));

        // Désactiver le loader après un court délai pour les pages déjà visitées
        const timer = setTimeout(() => {
            setShouldShowLoader(false);
        }, 100);

        return () => clearTimeout(timer);
    }, [pathname]);

    // Ne pas afficher le loader pour certaines routes spécifiques
    const skipLoaderRoutes = ['/login', '/register'];
    if (skipLoaderRoutes.includes(pathname)) {
        return <>{children}</>;
    }

    // Afficher le loader seulement au premier chargement ou changement de route
    if (shouldShowLoader) {
        return (
            <PageLoader
                loadingSteps={loadingSteps}
                minLoadTime={600}
                onLoad={async () => {
                    // Précharger les données communes si nécessaire
                    await new Promise(resolve => setTimeout(resolve, 200));
                }}
            >
                {children}
            </PageLoader>
        );
    }

    return <>{children}</>;
}