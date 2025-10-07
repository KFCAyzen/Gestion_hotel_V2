"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import Image from "next/image";
import { Images } from "./Images";

interface WelcomeScreenProps {
    onComplete: () => void;
}

export default function WelcomeScreen({ onComplete }: WelcomeScreenProps) {
    const { user } = useAuth();
    const [isVisible, setIsVisible] = useState(true);
    const [showContent, setShowContent] = useState(false);
    const [showButton, setShowButton] = useState(false);
    const [ripples, setRipples] = useState<Array<{id: number, x: number, y: number}>>([]);

    useEffect(() => {
        // Empêcher le scroll du body
        document.body.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
        document.body.style.width = '100%';
        document.body.style.height = '100%';
        
        const contentTimer = setTimeout(() => setShowContent(true), 800);
        const buttonTimer = setTimeout(() => setShowButton(true), 2500);
        
        // Générer des ondulations périodiques
        const rippleInterval = setInterval(() => {
            const newRipple = {
                id: Date.now(),
                x: Math.random() * 100,
                y: Math.random() * 100
            };
            setRipples(prev => [...prev.slice(-2), newRipple]);
        }, 3000);

        return () => {
            // Restaurer le scroll du body
            document.body.style.overflow = '';
            document.body.style.position = '';
            document.body.style.width = '';
            document.body.style.height = '';
            
            clearTimeout(contentTimer);
            clearTimeout(buttonTimer);
            clearInterval(rippleInterval);
        };
    }, []);

    const handleContinue = () => {
        setIsVisible(false);
        setTimeout(onComplete, 300);
    };

    const getRoleDisplayName = (role: string) => {
        switch (role) {
            case 'super_admin': return 'Super Administrateur';
            case 'admin': return 'Administrateur';
            default: return 'Utilisateur';
        }
    };

    const getCurrentGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Bonjour';
        if (hour < 18) return 'Bon après-midi';
        return 'Bonsoir';
    };

    return (
        <div className={`fixed inset-0 z-[9999] flex items-center justify-center transition-all duration-600 overflow-hidden ${
            isVisible ? 'opacity-100' : 'opacity-0'
        }`} style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
            touchAction: 'none'
        }}>
            {/* Particules flottantes */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {[...Array(30)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute w-1 h-1 bg-white opacity-20 rounded-full animate-float hidden sm:block"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 5}s`,
                            animationDuration: `${3 + Math.random() * 4}s`
                        }}
                    />
                ))}
            </div>

            {/* Modal Windows 11 */}
            <div className={`relative w-[95vw] h-[95vh] sm:w-[85vw] sm:h-[80vh] max-w-4xl transform transition-all duration-800 ${
                isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
            }`}>
                <div className="relative w-full h-full rounded-2xl overflow-hidden" style={{
                    background: 'rgba(30, 41, 59, 0.8)',
                    backdropFilter: 'blur(40px) saturate(180%)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                }}>
                    {/* Grille Windows 11 */}
                    <div className="flex flex-col lg:grid lg:grid-cols-2 h-full">
                        {/* Panneau gauche - Visuel */}
                        <div className="relative flex items-center justify-center p-4 sm:p-8 lg:p-12 flex-shrink-0 h-1/3 lg:h-full" style={{
                            background: 'linear-gradient(135deg, rgba(125, 56, 55, 0.9) 0%, rgba(160, 74, 73, 0.8) 100%)'
                        }}>
                            {/* Motif décoratif */}
                            <div className="absolute inset-0 opacity-10 hidden sm:block">
                                <div className="absolute top-1/4 left-1/4 w-16 sm:w-32 h-16 sm:h-32 border border-white rounded-full animate-pulse"></div>
                                <div className="absolute bottom-1/4 right-1/4 w-12 sm:w-24 h-12 sm:h-24 border border-white rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
                                <div className="absolute top-1/2 right-1/3 w-8 sm:w-16 h-8 sm:h-16 border border-white rounded-full animate-pulse" style={{animationDelay: '2s'}}></div>
                            </div>
                            
                            <div className="relative text-center text-white">
                                <div className="mb-3 sm:mb-8">
                                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl sm:rounded-3xl p-3 sm:p-6">
                                        <Image 
                                            src={Images.logo} 
                                            alt="Logo PAULINA HÔTEL" 
                                            width={60} 
                                            height={60} 
                                            className="rounded-xl sm:rounded-2xl mx-auto sm:w-[100px] sm:h-[100px]"
                                        />
                                    </div>
                                </div>
                                <h1 className="text-2xl sm:text-4xl font-light mb-1 sm:mb-2 tracking-wider">
                                    PAULINA
                                </h1>
                                <div className="w-12 sm:w-16 h-px bg-white/50 mx-auto mb-1 sm:mb-2"></div>
                                <p className="text-sm sm:text-lg font-light opacity-90 tracking-widest">
                                    HÔTEL
                                </p>
                            </div>
                        </div>

                        {/* Panneau droit - Connexion */}
                        <div className="flex flex-col justify-center p-4 sm:p-8 lg:p-12 text-white flex-1 min-h-0">
                            <div className={`transform transition-all duration-1000 delay-300 ${
                                showContent ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0'
                            }`} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {/* Salutation */}
                                <div>
                                    <h2 className="text-xl sm:text-3xl font-light mb-1 sm:mb-2">
                                        {getCurrentGreeting()}
                                    </h2>
                                    <p className="text-slate-300 text-sm sm:text-lg">
                                        Connectez-vous à votre espace
                                    </p>
                                </div>

                                {/* Utilisateur */}
                                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-white/10">
                                    <div className="flex items-center space-x-3 sm:space-x-4">
                                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-slate-400 to-slate-600 rounded-full flex items-center justify-center flex-shrink-0">
                                            <span className="text-white font-semibold text-xs sm:text-sm">
                                                {user?.role === 'super_admin' ? 'SA' :
                                                 user?.role === 'admin' ? 'AD' : 'US'}
                                            </span>
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-lg sm:text-2xl font-light truncate">
                                                {user?.name || 'Utilisateur'}
                                            </p>
                                            <p className="text-slate-400 text-xs sm:text-sm">
                                                Prêt à commencer
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Bouton */}
                                {showButton ? (
                                    <button
                                        onClick={handleContinue}
                                        className="w-full py-3 sm:py-4 px-4 sm:px-6 rounded-xl font-medium text-white text-base sm:text-lg transition-all duration-300 hover:scale-105 group touch-manipulation"
                                        style={{
                                            background: 'linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%)',
                                            boxShadow: '0 8px 25px rgba(59, 130, 246, 0.3)'
                                        }}
                                    >
                                        <span className="flex items-center justify-center gap-2">
                                            Se connecter
                                            <svg className="w-4 h-4 sm:w-5 sm:h-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                            </svg>
                                        </span>
                                    </button>
                                ) : (
                                    <div className="flex justify-center py-3 sm:py-4">
                                        <div className="w-6 h-6 sm:w-8 sm:h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                @keyframes ripple {
                    0% { transform: translate(-50%, -50%) scale(0); opacity: 0.8; }
                    50% { opacity: 0.4; }
                    100% { transform: translate(-50%, -50%) scale(4); opacity: 0; }
                }
                
                @keyframes float {
                    0%, 100% { transform: translateY(0px) rotate(0deg); }
                    50% { transform: translateY(-20px) rotate(180deg); }
                }
                
                .animate-float {
                    animation: float 6s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
}