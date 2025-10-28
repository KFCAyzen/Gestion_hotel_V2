"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type UserRole = 'super_admin' | 'admin' | 'user';

export interface User {
    id: string;
    username: string;
    role: UserRole;
    name: string;
    mustChangePassword: boolean;
}

interface AuthContextType {
    user: User | null;
    users: User[];
    login: (username: string, password: string) => Promise<boolean>;
    logout: () => void;
    hasPermission: (requiredRole: UserRole) => boolean;
    createUser: (userData: Omit<User, 'id' | 'mustChangePassword'>) => Promise<boolean>;
    canCreateRole: (role: UserRole) => boolean;
    changePassword: (newPassword: string) => Promise<boolean>;
    deleteUser: (userId: string) => Promise<boolean>;
    canDeleteUser: (targetUser: User) => boolean;
    resetUserPassword: (userId: string) => Promise<boolean>;
    canResetPassword: (targetUser: User) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const defaultUsers: User[] = [
    { id: '1', username: 'superadmin', role: 'super_admin', name: 'Super Administrateur', mustChangePassword: false },
    { id: '2', username: 'admin', role: 'admin', name: 'Administrateur', mustChangePassword: false },
    { id: '3', username: 'user', role: 'user', name: 'Utilisateur', mustChangePassword: false }
];

const defaultPasswords: Record<string, string> = {
    'superadmin': 'super123',
    'admin': 'admin123',
    'user': 'user123'
};

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [users, setUsers] = useState<User[]>(defaultUsers);
    const [passwords, setPasswords] = useState<Record<string, string>>(defaultPasswords);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const restoreSession = () => {
            try {
                const savedUser = localStorage.getItem('currentUser');
                const sessionToken = localStorage.getItem('sessionToken');
                const sessionExpiry = localStorage.getItem('sessionExpiry');
                const savedUsers = localStorage.getItem('systemUsers');
                const savedPasswords = localStorage.getItem('systemPasswords');
                
                // Vérifier si la session est valide
                if (savedUser && sessionToken && sessionExpiry) {
                    const expiryTime = parseInt(sessionExpiry);
                    const currentTime = Date.now();
                    
                    if (currentTime < expiryTime) {
                        // Session valide, restaurer l'utilisateur
                        setUser(JSON.parse(savedUser));
                    } else {
                        // Session expirée, nettoyer
                        localStorage.removeItem('currentUser');
                        localStorage.removeItem('sessionToken');
                        localStorage.removeItem('sessionExpiry');
                    }
                }
                
                if (savedUsers) {
                    setUsers(JSON.parse(savedUsers));
                }
                if (savedPasswords) {
                    setPasswords(JSON.parse(savedPasswords));
                }
            } catch (error) {
                console.error('Erreur lors de la restauration de session:', error);
                // En cas d'erreur, nettoyer le localStorage
                localStorage.removeItem('currentUser');
                localStorage.removeItem('sessionToken');
                localStorage.removeItem('sessionExpiry');
            } finally {
                setIsLoading(false);
            }
        };
        
        restoreSession();
    }, []);

    const login = async (username: string, password: string): Promise<boolean> => {
        const foundUser = users.find(u => u.username === username);
        if (foundUser && passwords[username] === password) {
            setUser(foundUser);
            
            // Créer une session avec token et expiration (24 heures)
            const sessionToken = btoa(Math.random().toString(36).substring(2) + Date.now().toString());
            const sessionExpiry = Date.now() + (24 * 60 * 60 * 1000); // 24 heures
            
            localStorage.setItem('currentUser', JSON.stringify(foundUser));
            localStorage.setItem('sessionToken', sessionToken);
            localStorage.setItem('sessionExpiry', sessionExpiry.toString());
            
            return true;
        }
        return false;
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('currentUser');
        localStorage.removeItem('sessionToken');
        localStorage.removeItem('sessionExpiry');
    };

    const hasPermission = (requiredRole: UserRole): boolean => {
        if (!user) return false;
        
        const roleHierarchy: Record<UserRole, number> = {
            'user': 1,
            'admin': 2,
            'super_admin': 3
        };
        
        return roleHierarchy[user.role] >= roleHierarchy[requiredRole];
    };

    const canCreateRole = (role: UserRole): boolean => {
        if (!user) return false;
        if (user.role === 'super_admin') return true;
        if (user.role === 'admin' && role === 'user') return true;
        return false;
    };

    const createUser = async (userData: Omit<User, 'id' | 'mustChangePassword'>): Promise<boolean> => {
        if (!canCreateRole(userData.role)) return false;
        
        // Vérifier si l'utilisateur existe déjà
        if (users.find(u => u.username === userData.username)) {
            return false;
        }
        
        const defaultPassword = 'temp123';
        const newUser: User = {
            ...userData,
            id: Date.now().toString(),
            mustChangePassword: true
        };
        
        const updatedUsers = [...users, newUser];
        const updatedPasswords = { ...passwords, [userData.username]: defaultPassword };
        
        setUsers(updatedUsers);
        setPasswords(updatedPasswords);
        
        localStorage.setItem('systemUsers', JSON.stringify(updatedUsers));
        localStorage.setItem('systemPasswords', JSON.stringify(updatedPasswords));
        
        return true;
    };

    const changePassword = async (newPassword: string): Promise<boolean> => {
        if (!user) return false;
        
        const updatedUser = { ...user, mustChangePassword: false };
        const updatedUsers = users.map(u => u.id === user.id ? updatedUser : u);
        const updatedPasswords = { ...passwords, [user.username]: newPassword };
        
        setUser(updatedUser);
        setUsers(updatedUsers);
        setPasswords(updatedPasswords);
        
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        localStorage.setItem('systemUsers', JSON.stringify(updatedUsers));
        localStorage.setItem('systemPasswords', JSON.stringify(updatedPasswords));
        
        return true;
    };

    const canDeleteUser = (targetUser: User): boolean => {
        if (!user) return false;
        if (user.id === targetUser.id) return false; // Ne peut pas se supprimer soi-même
        if (targetUser.username === 'superadmin') return false; // Ne peut pas supprimer le super admin par défaut
        
        if (user.role === 'super_admin') {
            return targetUser.role !== 'super_admin'; // Super admin peut supprimer admin et user
        }
        if (user.role === 'admin') {
            return targetUser.role === 'user'; // Admin peut supprimer seulement user
        }
        return false;
    };

    const deleteUser = async (userId: string): Promise<boolean> => {
        const targetUser = users.find(u => u.id === userId);
        if (!targetUser || !canDeleteUser(targetUser)) return false;
        
        const updatedUsers = users.filter(u => u.id !== userId);
        const updatedPasswords = { ...passwords };
        delete updatedPasswords[targetUser.username];
        
        setUsers(updatedUsers);
        setPasswords(updatedPasswords);
        
        localStorage.setItem('systemUsers', JSON.stringify(updatedUsers));
        localStorage.setItem('systemPasswords', JSON.stringify(updatedPasswords));
        
        return true;
    };

    const canResetPassword = (targetUser: User): boolean => {
        if (!user) return false;
        if (user.id === targetUser.id) return false; // Ne peut pas réinitialiser son propre mot de passe
        
        if (user.role === 'super_admin') {
            return targetUser.role !== 'super_admin'; // Super admin peut réinitialiser admin et user
        }
        if (user.role === 'admin') {
            return targetUser.role === 'user'; // Admin peut réinitialiser seulement user
        }
        return false;
    };

    const resetUserPassword = async (userId: string): Promise<boolean> => {
        const targetUser = users.find(u => u.id === userId);
        if (!targetUser || !canResetPassword(targetUser)) return false;
        
        const updatedUser = { ...targetUser, mustChangePassword: true };
        const updatedUsers = users.map(u => u.id === userId ? updatedUser : u);
        const updatedPasswords = { ...passwords, [targetUser.username]: 'temp123' };
        
        setUsers(updatedUsers);
        setPasswords(updatedPasswords);
        
        localStorage.setItem('systemUsers', JSON.stringify(updatedUsers));
        localStorage.setItem('systemPasswords', JSON.stringify(updatedPasswords));
        
        return true;
    };

    // Afficher un loader pendant la vérification de session
    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <AuthContext.Provider value={{ user, users, login, logout, hasPermission, createUser, canCreateRole, changePassword, deleteUser, canDeleteUser, resetUserPassword, canResetPassword }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}