import React, { useState, useEffect, useMemo } from "react";
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
import {
  Lock,
  Mail,
  User as UserIcon,
  Phone,
  ArrowRight,
  Eye,
  EyeOff,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { motion } from "framer-motion";
import { OnootLogo } from "@/components/ui/OnootLogo";

// ─── STRICT SECURITY VALIDATION SCHEMA ──────────────────────────────────────────
const registerSchema = z
  .object({
    name: z
      .string()
      .min(1, "Le nom et prénom sont obligatoires")
      .refine((val) => !val.startsWith(" ") && !val.endsWith(" "), {
        message:
          "Le nom et prénom ne doivent comporter aucun espace au début ou à la fin (aucun texte centré par des espaces).",
      })
      .refine((val) => !/\s{2,}/.test(val), {
        message: "Un seul espace est autorisé pour séparer le nom et le prénom (pas d'espaces multiples).",
      })
      .refine(
        (val) => {
          const parts = val.trim().split(" ");
          return parts.length >= 2 && parts.every((p) => p.length >= 2);
        },
        {
          message:
            "Veuillez renseigner à la fois votre Nom et votre Prénom séparés par un espace (ex: Sekou Amara).",
        }
      )
      .refine(
        (val) =>
          /^[a-zA-ZÀ-ÿ]+(?:[-'][a-zA-ZÀ-ÿ]+)?(?:\s[a-zA-ZÀ-ÿ]+(?:[-'][a-zA-ZÀ-ÿ]+)?)+$/.test(val),
        {
          message: "Le nom et prénom ne doivent contenir que des lettres, accents et tirets.",
        }
      ),

    email: z
      .string()
      .min(1, "L'adresse email est obligatoire")
      .refine((val) => !/\s/.test(val), {
        message: "L'adresse email ne doit contenir aucun espace.",
      })
      .refine((val) => !/[A-Z]/.test(val), {
        message:
          "L'adresse email ne doit pas contenir de majuscules. Veuillez l'écrire entièrement en minuscules (ex: sekou@gmail.com).",
      })
      .refine((val) => /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(val), {
        message: "Le format de l'adresse email est invalide.",
      }),

    phone: z
      .string()
      .optional()
      .refine((val) => !val || !/[a-zA-Z]/.test(val), {
        message: "Le numéro de téléphone ne doit contenir que des chiffres et un éventuel indicatif (+).",
      }),

    password: z
      .string()
      .min(1, "Le mot de passe est obligatoire")
      .min(8, "Le mot de passe doit comporter au moins 8 caractères pour votre sécurité.")
      .refine((val) => !/\s/.test(val), {
        message: "Le mot de passe ne doit contenir aucun espace.",
      })
      .refine((val) => /[a-zA-Z]/.test(val) && /[0-9]/.test(val), {
        message: "Le mot de passe doit comporter au moins une lettre et un chiffre (caractères spéciaux autorisés).",
      }),

    confirmPassword: z.string().min(1, "Veuillez confirmer votre mot de passe."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les deux mots de passe ne correspondent pas.",
    path: ["confirmPassword"],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

/** SVG Google logo (official colors) */
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

export default function Register() {
  const [, setLocation] = useLocation();
  const { isDark } = useTheme();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
        variant: "destructive",
      });
    }
  }, []);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      phone: "",
    },
  });

  const { watch } = form;
  const watchedEmail = watch("email") || "";
  const watchedName = watch("name") || "";
  const watchedPassword = watch("password") || "";
  const watchedConfirm = watch("confirmPassword") || "";

  // Real-time checks for Email
  const emailHasUppercase = useMemo(() => /[A-Z]/.test(watchedEmail), [watchedEmail]);
  const emailHasSpaces = useMemo(() => /\s/.test(watchedEmail), [watchedEmail]);

  // Real-time checks for Name
  const nameIsCenteredOrPadded = useMemo(
    () => watchedName.startsWith(" ") || watchedName.endsWith(" "),
    [watchedName]
  );
  const nameHasMultipleSpaces = useMemo(() => /\s{2,}/.test(watchedName), [watchedName]);

  // Real-time checks for Password strength & rules
  const passwordHasSpace = useMemo(() => /\s/.test(watchedPassword), [watchedPassword]);
  const passwordLengthOk = useMemo(() => watchedPassword.length >= 8, [watchedPassword]);
  const passwordHasNumber = useMemo(() => /[0-9]/.test(watchedPassword), [watchedPassword]);
  const passwordHasLetter = useMemo(() => /[a-zA-Z]/.test(watchedPassword), [watchedPassword]);
  const passwordHasSpecial = useMemo(
    () => /[^a-zA-Z0-9\s]/.test(watchedPassword),
    [watchedPassword]
  );

  const passwordStrengthScore = useMemo(() => {
    if (!watchedPassword || passwordHasSpace) return 0;
    let score = 0;
    if (passwordLengthOk) score += 1;
    if (passwordHasLetter && passwordHasNumber) score += 1;
    if (watchedPassword.length >= 10) score += 1;
    if (passwordHasSpecial) score += 1;
    return score;
  }, [watchedPassword, passwordHasSpace, passwordLengthOk, passwordHasLetter, passwordHasNumber, passwordHasSpecial]);

  const strengthLabels = ["Très faible", "Faible", "Moyen", "Fort", "Très sécurisé"];
  const strengthColors = [
    "bg-slate-200 dark:bg-slate-700",
    "bg-red-500",
    "bg-amber-500",
    "bg-blue-500",
    "bg-emerald-500",
  ];

  const registerMutation = useRegisterUser();

  const onSubmit = (data: RegisterFormValues) => {
    // Send only necessary API payload
    const payload = {
      name: data.name,
      email: data.email,
      password: data.password,
      phone: data.phone || undefined,
    };

    registerMutation.mutate(
      { data: payload },
      {
        onSuccess: () => {
          toast({
            title: "Inscription réussie !",
            description: "Votre compte sécurisé a été créé. Vous pouvez à présent vous connecter.",
          });
          setLocation("/auth/login");
        },
        onError: (error: any) => {
          const errMsg =
            error?.data?.error ??
            error?.message ??
            "Une erreur est survenue lors de l'inscription.";
          toast({ title: "Erreur de validation", description: errMsg, variant: "destructive" });
        },
      }
    );
  };

  const handleGoogleLogin = () => {
    setIsGoogleLoading(true);
    window.location.href = `/api/auth/google?origin=${encodeURIComponent(
      window.location.origin
    )}&from=register`;
  };

  return (
    <Layout>
      <div className="min-h-[calc(100vh-80px)] bg-slate-50 dark:bg-gray-950 flex flex-col justify-center py-8 px-4 sm:py-12 sm:px-6 lg:px-8 font-sans relative overflow-hidden transition-colors duration-200">
        {/* Decorative background elements */}
        <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] rounded-full bg-[#E87C2A]/10 dark:bg-[#E87C2A]/5 blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] rounded-full bg-[#4BB5E8]/10 dark:bg-[#4BB5E8]/5 blur-3xl pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md mx-auto z-10 flex flex-col items-center text-center"
        >
          <div className="mb-3 sm:mb-4 transform scale-90 sm:scale-100">
            <OnootLogo size="lg" variant={isDark ? "white" : "color"} />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Créer un compte
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-gray-400">
            Rejoignez Onoot Boutique en toute sécurité
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mt-5 w-full max-w-lg mx-auto z-10"
        >
          <div className="bg-white dark:bg-gray-900 py-6 px-5 sm:py-8 sm:px-8 shadow-xl shadow-slate-200/50 dark:shadow-black/40 rounded-2xl border border-slate-100 dark:border-gray-800 transition-colors">
            {/* Google Sign-In Button */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isGoogleLoading}
              className="w-full flex items-center justify-center gap-2.5 py-3 px-4 border border-slate-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-slate-700 dark:text-gray-200 text-xs sm:text-sm font-semibold hover:bg-slate-50 dark:hover:bg-gray-700 active:scale-[0.99] focus:outline-hidden focus:ring-2 focus:ring-[#E87C2A]/20 transition-all shadow-xs disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isGoogleLoading ? (
                <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
              ) : (
                <GoogleIcon className="w-5 h-5 shrink-0" />
              )}
              <span>{isGoogleLoading ? "Redirection sécurisée…" : "Continuer avec Google"}</span>
            </button>

            {/* Divider */}
            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200 dark:border-gray-700" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 bg-white dark:bg-gray-900 text-slate-400 dark:text-gray-500 font-medium uppercase tracking-wider">
                  ou avec votre email
                </span>
              </div>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {/* 1. NOM ET PRÉNOM */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-gray-300">
                          Nom et prénom <span className="text-red-500">*</span>
                        </label>
                        <span className="text-[11px] text-muted-foreground">Ex: Sekou Amara</span>
                      </div>
                      <FormControl>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                            <UserIcon className="h-4 w-4 text-slate-400 dark:text-gray-500" />
                          </div>
                          <input
                            {...field}
                            type="text"
                            autoComplete="name"
                            className={`appearance-none block w-full pl-10 pr-3 py-2.5 border rounded-xl shadow-xs bg-white dark:bg-gray-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-hidden focus:ring-2 transition-all text-sm ${
                              nameIsCenteredOrPadded || nameHasMultipleSpaces
                                ? "border-amber-400 focus:ring-amber-200 dark:focus:ring-amber-900"
                                : "border-slate-200 dark:border-gray-700 focus:ring-[#E87C2A]/20 focus:border-[#E87C2A]"
                            }`}
                            placeholder="Nom et prénom(s)"
                          />
                        </div>
                      </FormControl>

                      {/* Real-time warning for centered/spaced name */}
                      {nameIsCenteredOrPadded && (
                        <p className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1 font-medium mt-1">
                          <AlertTriangle className="h-3 w-3 shrink-0" />
                          Attention : Pas d'espaces au début ou à la fin (aucun texte centré).
                        </p>
                      )}
                      {nameHasMultipleSpaces && (
                        <p className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1 font-medium mt-1">
                          <AlertTriangle className="h-3 w-3 shrink-0" />
                          Un seul espace est autorisé entre le nom et le prénom.
                        </p>
                      )}
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                {/* 2. ADRESSE EMAIL */}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-gray-300">
                          Adresse Email <span className="text-red-500">*</span>
                        </label>
                        <span className="text-[11px] text-muted-foreground">Minuscules sans espaces</span>
                      </div>
                      <FormControl>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                            <Mail className="h-4 w-4 text-slate-400 dark:text-gray-500" />
                          </div>
                          <input
                            {...field}
                            type="email"
                            autoComplete="email"
                            className={`appearance-none block w-full pl-10 pr-3 py-2.5 border rounded-xl shadow-xs bg-white dark:bg-gray-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-hidden focus:ring-2 transition-all text-sm ${
                              emailHasUppercase || emailHasSpaces
                                ? "border-red-500 focus:ring-red-200 dark:focus:ring-red-950"
                                : "border-slate-200 dark:border-gray-700 focus:ring-[#E87C2A]/20 focus:border-[#E87C2A]"
                            }`}
                            placeholder="exemple: sekou@gmail.com"
                          />
                        </div>
                      </FormControl>

                      {/* Real-time warnings for email */}
                      {emailHasUppercase && (
                        <div className="flex items-center gap-1 text-[11px] text-red-600 dark:text-red-400 font-semibold bg-red-50 dark:bg-red-950/40 px-2.5 py-1 rounded-lg border border-red-200 dark:border-red-900 mt-1">
                          <XCircle className="h-3.5 w-3.5 shrink-0" />
                          <span>Erreur : Les majuscules sont interdites dans l'email (ex: sekou@gmail.com).</span>
                        </div>
                      )}
                      {emailHasSpaces && (
                        <div className="flex items-center gap-1 text-[11px] text-red-600 dark:text-red-400 font-semibold bg-red-50 dark:bg-red-950/40 px-2.5 py-1 rounded-lg border border-red-200 dark:border-red-900 mt-1">
                          <XCircle className="h-3.5 w-3.5 shrink-0" />
                          <span>Erreur : Les espaces sont interdits dans l'adresse email.</span>
                        </div>
                      )}
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                {/* 3. TÉLÉPHONE (OPTIONNEL) */}
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-gray-300">
                        Téléphone <span className="text-xs font-normal text-muted-foreground">(Optionnel)</span>
                      </label>
                      <FormControl>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                            <Phone className="h-4 w-4 text-slate-400 dark:text-gray-500" />
                          </div>
                          <input
                            {...field}
                            type="tel"
                            autoComplete="tel"
                            className="appearance-none block w-full pl-10 pr-3 py-2.5 border border-slate-200 dark:border-gray-700 rounded-xl shadow-xs bg-white dark:bg-gray-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-hidden focus:ring-2 focus:ring-[#E87C2A]/20 focus:border-[#E87C2A] transition-all text-sm"
                            placeholder="+225 07 00 00 00 00"
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                {/* 4. MOT DE PASSE */}
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-gray-300">
                          Mot de passe <span className="text-red-500">*</span>
                        </label>
                        <span className="text-[11px] text-muted-foreground">Min. 8 car. sans espace</span>
                      </div>
                      <FormControl>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                            <Lock className="h-4 w-4 text-slate-400 dark:text-gray-500" />
                          </div>
                          <input
                            {...field}
                            type={showPassword ? "text" : "password"}
                            autoComplete="new-password"
                            className={`appearance-none block w-full pl-10 pr-10 py-2.5 border rounded-xl shadow-xs bg-white dark:bg-gray-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-hidden focus:ring-2 transition-all text-sm ${
                              passwordHasSpace
                                ? "border-red-500 focus:ring-red-200 dark:focus:ring-red-950"
                                : "border-slate-200 dark:border-gray-700 focus:ring-[#E87C2A]/20 focus:border-[#E87C2A]"
                            }`}
                            placeholder="Au moins 8 caractères"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:text-gray-400 dark:hover:text-gray-200 transition-colors focus:outline-hidden"
                            aria-label="Afficher le mot de passe"
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </FormControl>

                      {passwordHasSpace && (
                        <p className="text-[11px] text-red-600 dark:text-red-400 flex items-center gap-1 font-semibold mt-1">
                          <XCircle className="h-3.5 w-3.5 shrink-0" />
                          Erreur : Le mot de passe ne doit contenir aucun espace.
                        </p>
                      )}

                      {/* Password Strength Meter */}
                      {watchedPassword.length > 0 && !passwordHasSpace && (
                        <div className="space-y-1.5 pt-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-muted-foreground">Force du mot de passe :</span>
                            <span className="font-semibold text-foreground">
                              {strengthLabels[passwordStrengthScore]}
                            </span>
                          </div>
                          <div className="grid grid-cols-4 gap-1.5 h-1.5">
                            {[1, 2, 3, 4].map((step) => (
                              <div
                                key={step}
                                className={`rounded-full transition-all duration-300 ${
                                  passwordStrengthScore >= step
                                    ? strengthColors[passwordStrengthScore]
                                    : "bg-slate-200 dark:bg-slate-700"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                {/* 5. CONFIRMER LE MOT DE PASSE */}
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-gray-300">
                        Confirmer le mot de passe <span className="text-red-500">*</span>
                      </label>
                      <FormControl>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                            <Lock className="h-4 w-4 text-slate-400 dark:text-gray-500" />
                          </div>
                          <input
                            {...field}
                            type={showConfirmPassword ? "text" : "password"}
                            autoComplete="new-password"
                            className={`appearance-none block w-full pl-10 pr-10 py-2.5 border rounded-xl shadow-xs bg-white dark:bg-gray-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-hidden focus:ring-2 transition-all text-sm ${
                              watchedConfirm && watchedPassword && watchedConfirm !== watchedPassword
                                ? "border-red-500 focus:ring-red-200 dark:focus:ring-red-950"
                                : watchedConfirm && watchedConfirm === watchedPassword
                                ? "border-emerald-500 focus:ring-emerald-200 dark:focus:ring-emerald-950"
                                : "border-slate-200 dark:border-gray-700 focus:ring-[#E87C2A]/20 focus:border-[#E87C2A]"
                            }`}
                            placeholder="Répétez votre mot de passe"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:text-gray-400 dark:hover:text-gray-200 transition-colors focus:outline-hidden"
                            aria-label="Afficher la confirmation du mot de passe"
                          >
                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </FormControl>

                      {watchedConfirm && watchedConfirm === watchedPassword && (
                        <p className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold mt-1">
                          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                          Les mots de passe correspondent parfaitement.
                        </p>
                      )}
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                {/* Security Tips List */}
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-200/80 dark:border-slate-700/80 text-[11px] text-slate-600 dark:text-slate-300 space-y-1">
                  <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5 text-[#E87C2A]" /> Règles de sécurité Onoot :
                  </div>
                  <ul className="list-disc pl-4 space-y-0.5 text-muted-foreground">
                    <li>Email : lettres minuscules uniquement (ex: <code className="text-xs text-foreground">sekou@gmail.com</code>).</li>
                    <li>Nom et prénom : un seul espace entre les deux, aucun espace au début ou à la fin.</li>
                    <li>Mot de passe : sans espace, au moins 8 caractères, caractères spéciaux autorisés.</li>
                  </ul>
                </div>

                {/* Submit Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={registerMutation.isPending}
                    className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-[#E87C2A] hover:bg-[#D06820] active:scale-[0.99] focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-[#E87C2A] transition-all disabled:opacity-70 disabled:cursor-not-allowed group"
                  >
                    {registerMutation.isPending ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Créer mon compte sécurisé</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </Form>

            <div className="mt-5 text-center text-xs sm:text-sm text-muted-foreground dark:text-gray-400">
              Déjà inscrit chez Onoot Boutique ?{" "}
              <Link href="/auth/login" className="font-semibold text-[#E87C2A] hover:underline">
                Se connecter
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}
