/**
 * Déclenche une mise à jour du dashboard
 * Cette fonction doit être appelée après toute modification des données
 * qui affectent les statistiques du dashboard
 */
export const triggerDashboardUpdate = () => {
    window.dispatchEvent(new Event('dashboardUpdate'));
};