"use client";

import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

interface LoginPageProps {
    onLoginSuccess: () => void;
}

export default function LoginPage({ onLoginSuccess }: LoginPageProps) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const success = await login(username, password);
        if (success) {
            onLoginSuccess();
        } else {
            setError('Nom d\'utilisateur ou mot de passe incorrect');
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 to-yellow-100">
            <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold mb-2" style={{color: '#7D3837'}}>
                        PAULINA HÔTEL
                    </h1>
                    <p className="text-gray-600">Système de Gestion</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium mb-2" style={{color: '#7D3837'}}>
                            Nom d'utilisateur
                        </label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2"
                            style={{borderColor: '#7D3837'}}
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2" style={{color: '#7D3837'}}>
                            Mot de passe
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2"
                            style={{borderColor: '#7D3837'}}
                            required
                        />
                    </div>

                    {error && (
                        <div className="text-red-600 text-sm text-center bg-red-50 p-2 rounded">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 px-4 rounded-lg text-white font-medium hover:opacity-90 disabled:opacity-50"
                        style={{backgroundColor: '#7D3837'}}
                    >
                        {loading ? 'Connexion...' : 'Se connecter'}
                    </button>
                </form>

                <div className="mt-8 text-xs text-gray-500 space-y-1">
                    <p><strong>Comptes de test :</strong></p>
                    <p>Admin: admin / admin123</p>
                    <p>Utilisateur: user / user123</p>
                </div>
            </div>
        </div>
    );
}