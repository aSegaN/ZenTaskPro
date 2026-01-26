import React, { useState } from 'react';
import { User } from '../types';
import { authService } from '../services/authService';
import { Eye, EyeOff, LogIn, AlertCircle, Loader2 } from 'lucide-react';

interface LoginProps {
    onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!identifier.trim() || !password.trim()) {
            setError('Veuillez remplir tous les champs');
            return;
        }

        setIsLoading(true);

        try {
            const user = await authService.login({ identifier, password });
            onLogin(user);
        } catch (err: any) {
            console.error('Erreur de connexion:', err);
            
            // Extraire le message d'erreur
            const errorMessage = err.response?.data?.message 
                || err.response?.data?.error 
                || 'Identifiants incorrects';
            
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 flex items-center justify-center p-4">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-30">
                <div className="absolute inset-0" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.08'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }}></div>
            </div>

            <div className="relative w-full max-w-md">
                {/* Logo et titre */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl shadow-2xl shadow-indigo-500/30 mb-6">
                        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                        </svg>
                    </div>
                    <h1 className="text-4xl font-black text-white tracking-tight mb-2">
                        ZenTask <span className="text-indigo-400">Pro</span>
                    </h1>
                    <p className="text-slate-400 font-medium">Gestion de projets intelligente</p>
                </div>

                {/* Formulaire */}
                <div className="bg-white/10 backdrop-blur-xl rounded-[2rem] p-8 shadow-2xl border border-white/10">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Message d'erreur */}
                        {error && (
                            <div className="flex items-center gap-3 p-4 bg-red-500/20 border border-red-500/30 rounded-2xl text-red-200 animate-in slide-in-from-top-2">
                                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                <p className="text-sm font-medium">{error}</p>
                            </div>
                        )}

                        {/* Champ identifiant */}
                        <div>
                            <label className="block text-[10px] font-black text-slate-300 uppercase tracking-widest mb-3">
                                Email ou Username
                            </label>
                            <input
                                type="text"
                                value={identifier}
                                onChange={(e) => setIdentifier(e.target.value)}
                                placeholder="ex: asega ou asega@email.com"
                                className="w-full bg-white/10 border border-white/20 rounded-2xl p-4 text-white placeholder-slate-400 font-medium focus:ring-4 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none transition-all"
                                disabled={isLoading}
                                autoComplete="username"
                            />
                        </div>

                        {/* Champ mot de passe */}
                        <div>
                            <label className="block text-[10px] font-black text-slate-300 uppercase tracking-widest mb-3">
                                Mot de passe
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full bg-white/10 border border-white/20 rounded-2xl p-4 pr-12 text-white placeholder-slate-400 font-medium focus:ring-4 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none transition-all"
                                    disabled={isLoading}
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        {/* Bouton de connexion */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-500/30 flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 uppercase tracking-widest text-[11px]"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Connexion en cours...
                                </>
                            ) : (
                                <>
                                    <LogIn className="w-5 h-5" />
                                    Se connecter
                                </>
                            )}
                        </button>
                    </form>

                    {/* Hint pour le compte de démo */}
                    <div className="mt-8 pt-6 border-t border-white/10 text-center">
                        <p className="text-slate-400 text-sm">
                            Compte de démo : <span className="text-white font-bold">asega</span> / <span className="text-white font-bold">password123</span>
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <p className="text-center text-slate-500 text-xs mt-8">
                    © 2024 ZenTask Pro. Tous droits réservés.
                </p>
            </div>
        </div>
    );
};

export default Login;
