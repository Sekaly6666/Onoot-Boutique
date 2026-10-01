import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { OnootLogo } from '../components/ui/OnootLogo';

const Login: React.FC = () => {
  const [email, setEmail] = useState(import.meta.env.VITE_ADMIN_EMAIL || '');
  const [password, setPassword] = useState(import.meta.env.VITE_ADMIN_PASSWORD || '');
  const isExpired = typeof window !== 'undefined' && window.location.search.includes('expired=true');
  const [error, setError] = useState(isExpired ? 'Votre session a expiré. Veuillez vous reconnecter.' : '');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const text = await res.text();
      const data = text ? JSON.parse(text) : {};
      if (!res.ok) {
        throw new Error(data.error || "Erreur d'authentification");
      }
      // Store JWT token
      localStorage.setItem('adminToken', data.token);
      navigate('/admin/dashboard');
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la connexion');
      setIsLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="min-h-screen bg-slate-50 flex flex-col justify-center py-6 px-4 sm:py-12 sm:px-6 lg:px-8 font-sans relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/10 blur-3xl pointer-events-none"></div>

      <div 
        className="sm:mx-auto sm:w-full sm:max-w-md z-10 flex flex-col items-center"
      >
        <div className="mb-3 sm:mb-5 transform scale-90 sm:scale-100">
          <OnootLogo size="md" />
        </div>
        <h2 className="text-center text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
          Onoot Administration
        </h2>
        <p className="mt-1 sm:mt-2 text-center text-xs sm:text-sm text-slate-500">
          Connectez-vous pour gérer votre boutique
        </p>
      </div>

      <div 
        className="mt-4 sm:mt-6 sm:mx-auto sm:w-full sm:max-w-md z-10"
      >
        <div className="bg-white py-6 px-5 sm:py-8 sm:px-10 shadow-lg shadow-slate-200/50 rounded-2xl border border-slate-100">
          {error && (
            <div 
              className="mb-4 sm:mb-6 p-3 sm:p-4 rounded-xl bg-red-50 border border-red-100 flex items-center gap-2.5 sm:gap-3 text-red-600 text-xs sm:text-sm font-medium"
            >
              <div className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0"></div>
              <p>{String(error)}</p>
            </div>
          )}

          <form className="space-y-4 sm:space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1 sm:mb-1.5">
                Adresse Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-slate-400" />
                </div>
                <input
                  type="email"
                  required
                  className="appearance-none block w-full pl-9 sm:pl-10 pr-3 py-2.5 sm:py-3 border border-slate-200 rounded-xl shadow-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-base sm:text-sm"
                  placeholder="admin@onoot.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1 sm:mb-1.5">
                Mot de passe
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 sm:h-5 sm:w-5 text-slate-400" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  className="appearance-none block w-full pl-9 sm:pl-10 pr-9 sm:pr-10 py-2.5 sm:py-3 border border-slate-200 rounded-xl shadow-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-base sm:text-sm"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
                >
                  {showPassword ? <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" /> : <Eye className="h-4 w-4 sm:h-5 sm:w-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs sm:text-sm">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary focus:ring-primary/20 border-slate-300 rounded cursor-pointer"
                />
                <label htmlFor="remember-me" className="ml-1.5 sm:ml-2 block text-xs sm:text-sm text-slate-600 cursor-pointer">
                  Se souvenir de moi
                </label>
              </div>
              <div>
                <a href="#" className="font-medium text-primary hover:text-primary/80 transition-colors text-xs sm:text-sm">
                  Mot de passe oublié ?
                </a>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center gap-2 py-2.5 sm:py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm sm:text-base font-bold text-white bg-[#F97316] hover:bg-[#EA580C] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F97316] transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <span className="flex items-center gap-1">
                    Connexion
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </motion.div>
  );
};

export default Login;
