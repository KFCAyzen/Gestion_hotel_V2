"use client";

import { useState } from "react";
import { Images } from "./Images";
import Image from "next/image";

interface LoginProps {
    onLogin: () => void;
    showNotification: (message: string, type: 'success' | 'error' | 'info') => void;
}

export default function Login({ onLogin, showNotification }: LoginProps) {
    const [formData, setFormData] = useState({
        username: '',
        password: ''
    });
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.username || !formData.password) {
            showNotification("Veuillez remplir tous les champs", "error");
            return;
        }

        // Identifiants par défaut (à remplacer par une vraie authentification)
        if (formData.username === "admin" && formData.password === "admin123") {
            showNotification("Connexion réussie!", "success");
            onLogin();
        } else {
            showNotification("Identifiants incorrects", "error");
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
                {/* Logo et titre */}
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-4">
                        <Image src={Images.logo} alt="Logo PAULINA HÔTEL" width={80} height={80} className="rounded-xl" />
                    </div>
                    <h1 className="text-3xl font-bold mb-2" style={{color: '#7D3837'}}>
                        PAULINA HÔTEL
                    </h1>
                    <p className="text-slate-600">Système de gestion hôtelière</p>
                </div>

                {/* Formulaire de connexion */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Nom d'utilisateur
                        </label>
                        <input
                            type="text"
                            value={formData.username}
                            onChange={(e) => setFormData({...formData, username: e.target.value})}
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            placeholder="Entrez votre nom d'utilisateur"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Mot de passe
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                value={formData.password}
                                onChange={(e) => setFormData({...formData, password: e.target.value})}
                                className="w-full px-4 py-3 pr-12 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                placeholder="Entrez votre mot de passe"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-700 transition-colors"
                            >
                                {showPassword ? (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                                    </svg>
                                ) : (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full py-3 px-4 rounded-lg font-medium text-white transition-colors hover:opacity-90"
                        style={{backgroundColor: '#7D3837'}}
                    >
                        Se connecter
                    </button>
                </form>

                {/* Informations de test */}
                <div className="mt-6 p-4 rounded-lg" style={{backgroundColor: '#fff590'}}>
                    <p className="text-sm font-medium text-slate-700 mb-1">Identifiants de test :</p>
                    <p className="text-xs text-slate-600">Utilisateur: admin</p>
                    <p className="text-xs text-slate-600">Mot de passe: admin123</p>
                </div>
            </div>
        </div>
    );
}