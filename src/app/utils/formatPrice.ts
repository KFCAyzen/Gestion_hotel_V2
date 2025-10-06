/**
 * Utilitaire pour formater les prix avec le suffixe FCFA
 * Ajoute automatiquement " FCFA" à la fin du prix
 * @param price - Prix à formater (string ou number)
 * @returns Prix formaté avec " FCFA"
 */
export const formatPrice = (price: string | number): string => {
    // Gérer les valeurs vides ou nulles
    if (!price || price === '' || price === '0') return '0 FCFA';
    return `${price} FCFA`;
};