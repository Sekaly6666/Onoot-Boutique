import React from "react";
import { useLocation, Link } from "wouter";
import { Layout } from "@/components/layout/Layout";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRegisterUser } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Lock, Mail, User as UserIcon, Phone, ArrowRight, Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";
import { OnootLogo } from "@/components/ui/OnootLogo";
import { useState, useEffect } from "react";

const registerSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  email: z.string().email("Adresse email invalide"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
  phone: z.string().optional(),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

/** SVG Google logo (official colors) */
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

export default function Register() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const { isDark } = useTheme();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Show toast if redirected from failed Google auth
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const error = params.get("error");
    const reason = params.get("reason");
    if (error === "google_cancelled") {
      toast({ title: "Inscription annulée", description: "La connexion Google a été annulée.", variant: "destructive" });
    } else if (error === "google_failed") {
      toast({
        title: "Erreur Google",
        description: reason ? `Détail : ${reason}` : "Impossible de continuer avec Google. Réessayez.",
        variant: "destructive"
      });
    }
  }, []);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "", phone: "" },
  });

  const registerMutation = useRegisterUser();

  const onSubmit = (data: RegisterFormValues) => {
    registerMutation.mutate({ data }, {
      onSuccess: () => {
        toast({ title: "Inscription réussie", description: "Veuillez vous connecter à présent." });
        setLocation("/auth/login");
      },
      onError: (error: any) => {
        const errMsg =
          error?.data?.error ??
          error?.message ??
          "Une erreur est survenue lors de l'inscription.";
        toast({ title: "Erreur", description: errMsg, variant: "destructive" });
      }
    });
  };

  const handleGoogleLogin = () => {
    setIsGoogleLoading(true);
    window.location.href = `/api/auth/google?origin=${encodeURIComponent(window.location.origin)}&from=register`;
  };

  return (
    <Layout>
      <div className="min-h-[calc(100vh-80px)] bg-slate-50 dark:bg-gray-950 flex flex-col justify-center py-6 px-4 sm:py-12 sm:px-6 lg:px-8 font-sans relative overflow-hidden transition-colors duration-200">
        {/* Decorative background elements */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/10 dark:bg-primary/5 blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/10 dark:bg-blue-500/5 blur-3xl pointer-events-none"></div>

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
            Inscription
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-gray-400">
            Créez votre compte client
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mt-4 sm:mt-6 w-full max-w-sm sm:max-w-md mx-auto z-10"
        >
          <div className="bg-white dark:bg-gray-900 py-5 px-4 sm:py-8 sm:px-8 shadow-lg sm:shadow-xl shadow-slate-200/50 dark:shadow-black/40 rounded-2xl border border-slate-100 dark:border-gray-800 transition-colors">
            
            {/* Google Sign-In Button */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isGoogleLoading}
              className="w-full flex items-center justify-center gap-2.5 py-2.5 sm:py-3 px-4 border border-slate-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-slate-700 dark:text-gray-200 text-xs sm:text-sm font-semibold hover:bg-slate-50 dark:hover:bg-gray-700 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isGoogleLoading ? (
                <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
              ) : (
                <GoogleIcon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              )}
              <span>{isGoogleLoading ? "Redirection…" : "Continuer avec Google"}</span>
            </button>

            {/* Divider */}
            <div className="relative my-4 sm:my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200 dark:border-gray-700" />
              </div>
              <div className="relative flex justify-center text-xs sm:text-sm">
                <span className="px-3 bg-white dark:bg-gray-900 text-slate-400 dark:text-gray-500 font-medium">
                  ou avec email
                </span>
              </div>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 sm:space-y-4">
                
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-gray-300 mb-1 sm:mb-1.5">Nom complet</label>
                      <FormControl>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <UserIcon className="h-4 w-4 sm:h-5 sm:w-5 text-slate-400 dark:text-gray-500" />
                          </div>
                          <input
                            {...field}
                            type="text"
                            className="appearance-none block w-full pl-9 sm:pl-10 pr-3 py-2 sm:py-2.5 border border-slate-200 dark:border-gray-700 rounded-xl shadow-sm bg-white dark:bg-gray-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-base sm:text-sm"
                            placeholder="votre nom et prenom(s)"
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-gray-300 mb-1 sm:mb-1.5">Adresse Email</label>
                      <FormControl>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-slate-400 dark:text-gray-500" />
                          </div>
                          <input
                            {...field}
                            type="email"
                            className="appearance-none block w-full pl-9 sm:pl-10 pr-3 py-2 sm:py-2.5 border border-slate-200 dark:border-gray-700 rounded-xl shadow-sm bg-white dark:bg-gray-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-base sm:text-sm"
                            placeholder="votre@email.com"
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-gray-300 mb-1 sm:mb-1.5">Téléphone (Optionnel)</label>
                      <FormControl>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Phone className="h-4 w-4 sm:h-5 sm:w-5 text-slate-400 dark:text-gray-500" />
                          </div>
                          <input
                            {...field}
                            type="tel"
                            className="appearance-none block w-full pl-9 sm:pl-10 pr-3 py-2 sm:py-2.5 border border-slate-200 dark:border-gray-700 rounded-xl shadow-sm bg-white dark:bg-gray-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-base sm:text-sm"
                            placeholder="+225 00 00 00 00"
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-gray-300 mb-1 sm:mb-1.5">Mot de passe</label>
                      <FormControl>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Lock className="h-4 w-4 sm:h-5 sm:w-5 text-slate-400 dark:text-gray-500" />
                          </div>
                          <input
                            {...field}
                            type={showPassword ? "text" : "password"}
                            className="appearance-none block w-full pl-9 sm:pl-10 pr-9 sm:pr-10 py-2 sm:py-2.5 border border-slate-200 dark:border-gray-700 rounded-xl shadow-sm bg-white dark:bg-gray-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-base sm:text-sm"
                            placeholder="••••••••"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:text-gray-400 dark:hover:text-gray-200 transition-colors focus:outline-none"
                          >
                            {showPassword ? <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" /> : <Eye className="h-4 w-4 sm:h-5 sm:w-5" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                <div className="pt-1">
                  <button
                    type="submit"
                    disabled={registerMutation.isPending}
                    className="w-full flex justify-center items-center gap-2 py-2.5 sm:py-3 px-4 border border-transparent rounded-xl shadow-sm text-xs sm:text-sm font-bold text-white bg-primary hover:bg-primary/90 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all disabled:opacity-70 disabled:cursor-not-allowed group"
                  >
                    {registerMutation.isPending ? (
                      <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <span>S'inscrire</span>
                        <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </Form>

            <div className="mt-4 sm:mt-5 text-center text-xs sm:text-sm text-muted-foreground dark:text-gray-400">
              Déjà un compte ?{" "}
              <Link href="/auth/login" className="font-medium text-primary hover:text-primary/80 transition-colors">
                Se connecter
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}
