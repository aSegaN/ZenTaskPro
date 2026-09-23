import React, { useState } from 'react';
import { User } from '../types';
import { authService } from '../services/authService';
import { Eye, EyeOff, ArrowRight, AlertCircle, Loader2, Layers, ShieldCheck, Zap, Sparkles } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import ThemeToggle from './ThemeToggle';

interface LoginProps {
    onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { theme, toggleTheme } = useTheme();

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
            const errorMessage = err.response?.data?.message || err.response?.data?.error || 'Identifiants incorrects';
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex bg-canvas text-ink relative overflow-hidden">
            {/* Bascule de thème */}
            <div className="absolute top-6 right-6 z-30">
                <ThemeToggle theme={theme} onToggle={toggleTheme} variant="icon" className="bg-surface/60 backdrop-blur border border-line" />
            </div>

            {/* ===== Panneau marque (gauche, desktop) ===== */}
            <div className="hidden lg:flex lg:w-[46%] relative overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-slate-900 dark:from-indigo-900 dark:via-slate-900 dark:to-black p-14 flex-col justify-between">
                {/* Aurora blobs */}
                <div className="absolute -top-24 -left-24 w-96 h-96 bg-indigo-400/30 rounded-full blur-[100px] animate-pulse"></div>
                <div className="absolute bottom-0 right-0 w-[28rem] h-[28rem] bg-purple-500/20 rounded-full blur-[120px]"></div>
                <div className="absolute inset-0 opacity-[0.15]" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }}></div>

                <div className="relative z-10 flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/15 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/20">
                        <Layers className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-2xl font-bold text-white tracking-tight">ZenTask <span className="text-indigo-300">Pro</span></span>
                </div>

                <div className="relative z-10">
                    <h2 className="text-4xl font-bold text-white leading-tight tracking-tight mb-6">
                        Pilotez vos projets<br />avec clarté.
                    </h2>
                    <p className="text-indigo-100/70 font-medium text-[15px] leading-relaxed max-w-sm mb-12">
                        Un espace de travail intelligent qui transforme vos tâches en résultats. Conçu pour la performance, pensé pour les équipes.
                    </p>
                    <div className="space-y-5">
                        <Feature icon={<Zap className="w-5 h-5" />} title="Priorisation intelligente" desc="L'essentiel remonte en premier, chaque jour." />
                        <Feature icon={<ShieldCheck className="w-5 h-5" />} title="Sécurité de session" desc="Jetons chiffrés, expiration automatique." />
                        <Feature icon={<Sparkles className="w-5 h-5" />} title="Assistant IA intégré" desc="Analyse de charge et recommandations." />
                    </div>
                </div>

                <div className="relative z-10 text-indigo-200/50 text-xs font-medium">
                    © {new Date().getFullYear()} ZenTask Pro. Tous droits réservés.
                </div>
            </div>

            {/* ===== Formulaire (droite) ===== */}
            <div className="flex-1 flex items-center justify-center p-6 sm:p-10 relative">
                {/* Aurora douce en fond du formulaire (mobile + light) */}
                <div className="absolute top-10 right-10 w-72 h-72 bg-brand/10 rounded-full blur-[100px] pointer-events-none"></div>

                <div className="relative w-full max-w-md">
                    {/* Logo (mobile) */}
                    <div className="lg:hidden flex items-center gap-3 mb-10">
                        <div className="w-11 h-11 bg-brand rounded-2xl flex items-center justify-center shadow-lg">
                            <Layers className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-xl font-bold text-ink tracking-tight">ZenTask <span className="text-brand">Pro</span></span>
                    </div>

                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-ink tracking-tight mb-2">Bon retour 👋</h1>
                        <p className="text-inksoft font-medium text-[15px]">Connectez-vous pour accéder à votre espace.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {error && (
                            <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/25 rounded-2xl text-red-600 dark:text-red-300" style={{ animation: 'slideUp .25s ease' }}>
                                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                <p className="text-sm font-semibold">{error}</p>
                            </div>
                        )}

                        <div>
                            <label className="block text-[11px] font-bold text-inkmuted uppercase tracking-wide mb-2.5">Email ou identifiant</label>
                            <input
                                type="text"
                                value={identifier}
                                onChange={(e) => setIdentifier(e.target.value)}
                                placeholder="ex : asega ou asega@email.com"
                                className="w-full bg-surface2 border border-line rounded-2xl p-4 text-[15px] font-semibold text-ink placeholder:text-inkmuted focus:ring-4 focus:ring-brand/15 focus:border-brand outline-none transition-all"
                                disabled={isLoading}
                                autoComplete="username"
                            />
                        </div>

                        <div>
                            <label className="block text-[11px] font-bold text-inkmuted uppercase tracking-wide mb-2.5">Mot de passe</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full bg-surface2 border border-line rounded-2xl p-4 pr-12 text-[15px] font-semibold text-ink placeholder:text-inkmuted focus:ring-4 focus:ring-brand/15 focus:border-brand outline-none transition-all"
                                    disabled={isLoading}
                                    autoComplete="current-password"
                                />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-inkmuted hover:text-ink transition-colors">
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-brand text-white font-bold py-4 rounded-2xl shadow-lg shadow-brand/25 flex items-center justify-center gap-2.5 hover:brightness-110 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-60 disabled:cursor-not-allowed uppercase tracking-wide text-[12px]"
                        >
                            {isLoading ? (
                                <><Loader2 className="w-5 h-5 animate-spin" /> Connexion…</>
                            ) : (
                                <>Se connecter <ArrowRight className="w-4 h-4" /></>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-line text-center">
                        <p className="text-inksoft text-sm">
                            Compte de démo : <span className="text-ink font-bold">asega</span> / <span className="text-ink font-bold">password123</span>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

const Feature = ({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) => (
    <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-xl border border-white/15 flex items-center justify-center text-white flex-shrink-0">
            {icon}
        </div>
        <div>
            <p className="text-white font-bold text-[15px] leading-tight">{title}</p>
            <p className="text-indigo-100/60 text-[13px] font-medium mt-0.5">{desc}</p>
        </div>
    </div>
);

export default Login;
