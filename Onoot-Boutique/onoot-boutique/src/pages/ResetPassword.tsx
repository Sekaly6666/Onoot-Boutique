import React, { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { Layout } from "@/components/layout/Layout";
import { useTheme } from "@/contexts/ThemeContext";
import { useToast } from "@/hooks/use-toast";
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, ArrowRight, ShieldCheck, KeyRound } from "lucide-react";
import { motion } from "framer-motion";
import { OnootLogo } from "@/components/ui/OnootLogo";

export default function ResetPassword() {
  const [, setLocation] = useLocation();
  const { isDark } = useTheme();
  const { toast } = useToast();

  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("token") || "";
    const e = params.get("email") || "";
    setToken(t);
    setEmail(e);

    if (!t || !e) {
      setErrorMessage("Le lien de réinitialisation est incomplet ou invalide. Veuillez effectuer une nouvelle demande.");
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!token || !email) {
      setErrorMessage("Lien invalide. Veuillez refaire une demande de réinitialisation.");
      return;
    }

    if (/\s/.test(password)) {
      setErrorMessage("Le mot de passe ne doit contenir aucun espace.");
      return;
    }

    if (password.length < 8) {
      setErrorMessage("Le mot de passe doit comporter au moins 8 caractères.");
      return;
    }

    if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
      setErrorMessage("Le mot de passe doit contenir au moins une lettre et un chiffre.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Les deux mots de passe ne correspondent pas.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Une erreur est survenue lors de la réinitialisation.");
      }

      setIsSuccess(true);
      toast({
        title: "Mot de passe réinitialisé !",
        description: "Votre mot de passe a été mis à jour avec succès.",
      });
    } catch (err: any) {
      setErrorMessage(err.message || "Erreur de connexion au serveur.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-[80vh] flex flex-col justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Ambient background glows */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/10 dark:bg-primary/5 blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/10 dark:bg-blue-500/5 blur-3xl pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-sm sm:max-w-md mx-auto z-10 flex flex-col items-center text-center"
        >
          <div className="mb-3 sm:mb-5 transform scale-90 sm:scale-100">
            <OnootLogo size="lg" variant={isDark ? "white" : "color"} />
          </div>
          <h2 className="text-xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Nouveau mot de passe
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-gray-400">
            Choisissez un nouveau mot de passe sécurisé pour votre compte
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mt-4 sm:mt-6 w-full max-w-sm sm:max-w-md mx-auto z-10"
        >
          <div className="bg-white dark:bg-gray-900 py-6 px-4 sm:py-8 sm:px-8 shadow-lg sm:shadow-xl shadow-slate-200/50 dark:shadow-black/40 rounded-2xl border border-slate-100 dark:border-gray-800 transition-colors">
            {isSuccess ? (
              <div className="text-center py-4 space-y-4">
                <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Mot de passe réinitialisé !
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-gray-300 mt-1">
                    Votre mot de passe a été modifié avec succès. Vous pouvez maintenant vous connecter en toute sécurité.
                  </p>
                </div>
                <Link
                  href="/auth/login"
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl shadow-md text-sm font-bold text-white bg-[#E87C2A] hover:bg-[#D06820] active:scale-[0.99] transition-all"
                >
                  <span>Aller à la connexion</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {errorMessage && (
                  <div className="flex items-start gap-2 p-3 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 rounded-xl border border-red-200 dark:border-red-900">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {email && (
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-gray-700 text-xs text-slate-600 dark:text-gray-300">
                    Compte : <strong className="text-slate-900 dark:text-white font-mono">{email}</strong>
                  </div>
                )}

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">
                    Nouveau mot de passe
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-4 w-4 text-slate-400 dark:text-gray-500" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      className="appearance-none block w-full pl-9 pr-9 py-2.5 border border-slate-200 dark:border-gray-700 rounded-xl shadow-sm bg-white dark:bg-gray-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#E87C2A]/20 focus:border-[#E87C2A] text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-gray-200"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">
                    Confirmer le nouveau mot de passe
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <KeyRound className="h-4 w-4 text-slate-400 dark:text-gray-500" />
                    </div>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      className="appearance-none block w-full pl-9 pr-9 py-2.5 border border-slate-200 dark:border-gray-700 rounded-xl shadow-sm bg-white dark:bg-gray-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#E87C2A]/20 focus:border-[#E87C2A] text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-gray-200"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Password requirements */}
                <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-3 border border-slate-200/80 dark:border-slate-700/80 text-[11px] text-muted-foreground space-y-1">
                  <div className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5 text-[#E87C2A]" /> Exigences :
                  </div>
                  <ul className="list-disc pl-4 space-y-0.5">
                    <li>Au moins 8 caractères</li>
                    <li>Au moins une lettre et un chiffre</li>
                    <li>Aucun espace autorisé</li>
                  </ul>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !token || !email}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-[#E87C2A] hover:bg-[#D06820] active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#E87C2A] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <span>Valider mon nouveau mot de passe</span>
                  )}
                </button>

                <div className="text-center pt-2">
                  <Link
                    href="/auth/login"
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Retour à la page de connexion
                  </Link>
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}
