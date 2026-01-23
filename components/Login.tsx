
import React, { useState } from 'react';
import { User } from '../types';
import { authService } from '../services/authService';
import { CheckCircle, ArrowRight, Shield, Lock, Loader2, User as UserIcon, AlertCircle } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsAuthenticating(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      const session = await authService.login(identifier, password);
      
      if (session) {
        onLogin(session.user);
      } else {
        setError("Identifiants incorrects. Veuillez réessayer.");
      }
    } catch (err) {
      setError("Une erreur est survenue lors de la connexion.");
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full opacity-50">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-indigo-600/20 rounded-full blur-[160px]"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-violet-600/20 rounded-full blur-[160px]"></div>
      </div>

      <div className="bg-white/5 backdrop-blur-2xl border border-white/10 w-full max-w-md p-10 rounded-[2.5rem] shadow-2xl relative z-10 animate-in fade-in zoom-in-95 duration-500">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-indigo-600 rounded-3xl shadow-2xl shadow-indigo-500/20 mb-6 group hover:rotate-6 transition-transform">
            <CheckCircle className="text-white w-12 h-12" />
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter mb-2">ZenTask Pro</h1>
          <p className="text-slate-400 font-medium">Connectez-vous à votre espace</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-400 text-sm animate-in slide-in-from-top-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="font-semibold">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Identifiant ou Email</label>
            <div className="relative group">
              <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
              <input 
                required
                type="text"
                placeholder="arivera ou alex@zentask.pro"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full bg-slate-900/50 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-600"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center px-1">
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest">Mot de passe</label>
            </div>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
              <input 
                required
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-900/50 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-600"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isAuthenticating}
            className="w-full bg-white text-slate-950 font-black py-4 rounded-2xl hover:bg-indigo-50 transition-all flex items-center justify-center gap-3 disabled:opacity-50 shadow-xl mt-8 group"
          >
            {isAuthenticating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Validation...</span>
              </>
            ) : (
              <>
                <span>Connexion</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="mt-10 pt-8 border-t border-white/5 flex flex-col items-center gap-4">
          <p className="text-[10px] text-slate-600 flex items-center gap-2 uppercase tracking-[0.2em] font-black">
            <Shield className="w-4 h-4 text-indigo-500/50" />
            SÉCURITÉ JWT ACTIVE
          </p>
          <div className="flex gap-4 opacity-30 hover:opacity-100 transition-opacity">
            <span className="text-[10px] text-slate-400 font-bold italic">astuce: arivera / password123</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
