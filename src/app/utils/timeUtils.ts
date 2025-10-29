export function getRelativeTime(timestamp: string | number): string {
    if (!timestamp) return 'Récent';
    
    const now = Date.now();
    const time = typeof timestamp === 'string' ? new Date(timestamp).getTime() : timestamp;
    const diff = now - time;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'À l\'instant';
    if (minutes < 60) return `Il y a ${minutes}min`;
    if (hours < 24) return `Il y a ${hours}h`;
    if (days < 7) return `Il y a ${days}j`;
    return 'Il y a longtemps';
}