"use client";

import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

interface ChangePasswordModalProps {
    onPasswordChanged: () => void;
}

export default function ChangePasswordModal({ onPasswordChanged }: ChangePasswordModalProps) {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { changePassword, user } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (newPassword.length < 6) {
            setError('Le mot de passe doit contenir au moins 6 caractères');
            setLoading(false);
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('Les mots de passe ne correspondent pas');
            setLoading(false);
            return;
        }

        if (newPassword === 'temp123') {
            setError('Vous ne pouvez pas utiliser le mot de passe temporaire');
            setLoading(false);
            return;
        }

        const success = await changePassword(newPassword);
        if (success) {
            onPasswordChanged();
        } else {
            setError('Erreur lors du changement de mot de passe');
        }
        setLoading(false);
    };

    return (
        <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center overflow-hidden" style={{zIndex: 9999, backdropFilter: 'blur(10px)', background: 'rgba(255, 255, 255, 0.1)'}}>
            <div className="bg-white/90 backdrop-blur-md rounded-xl p-8 w-full max-w-md shadow-2xl transform transition-all duration-300 scale-100 border border-white/20">
                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold mb-2" style={{color: '#7D3837'}}>
                        Changement de Mot de Passe Requis
                    </h2>
                    <p className="text-gray-600">
                        Bonjour {user?.name}, vous devez changer votre mot de passe temporaire avant de continuer.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-2" style={{color: '#7D3837'}}>
                            Nouveau mot de passe
                        </label>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2"
                            style={{borderColor: '#7D3837'}}
                            placeholder="Minimum 6 caractères"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2" style={{color: '#7D3837'}}>
                            Confirmer le mot de passe
                        </label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2"
                            style={{borderColor: '#7D3837'}}
                            placeholder="Retapez le mot de passe"
                            required
                        />
                    </div>

                    {error && (
                        <div className="text-red-600 text-sm bg-red-50 p-3 rounded">
                            {error}
                        </div>
                    )}

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-sm text-blue-800">
                            <strong>Mot de passe temporaire actuel :</strong> temp123
                        </p>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 px-4 rounded-lg text-white font-medium hover:opacity-90 disabled:opacity-50"
                        style={{backgroundColor: '#7D3837'}}
                    >
                        {loading ? 'Changement...' : 'Changer le mot de passe'}
                    </button>
                </form>
            </div>
        </div>
    );
}