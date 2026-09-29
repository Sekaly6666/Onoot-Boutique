import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Layout } from "@/components/layout/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  useUpdateUser,
  useListOrders,
  getListOrdersQueryKey,
  getGetCurrentUserQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Building,
  Globe,
  ShieldCheck,
  Package,
  LogOut,
  Calendar,
  BadgeCheck,
  Save,
  Loader2,
  Clock,
  ArrowRight,
  Sparkles,
  ShoppingBag,
  Lock,
  ExternalLink,
  Crown,
  Eye,
  EyeOff,
  Copy,
  Check,
} from "lucide-react";
import { motion } from "framer-motion";

const profileSchema = z.object({
  name: z.string().min(2, "Le nom doit comporter au moins 2 caractères"),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function Profile() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSavedSuccessfully, setIsSavedSuccessfully] = useState(false);

  const updateUser = useUpdateUser();

  // Fetch recent orders for stats and quick view
  const { data: ordersData, isLoading: isOrdersLoading } = useListOrders(
    { userId: user?.id },
    {
      query: {
        enabled: !!user?.id,
        queryKey: getListOrdersQueryKey({ userId: user?.id }),
      },
    }
  );

  const orders = ordersData?.orders || [];
  const totalOrders = ordersData?.total ?? orders.length;

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || "",
      phone: user?.phone || "",
      address: user?.address || "",
      city: user?.city || "",
      country: user?.country || "",
    },
  });

  useEffect(() => {
    if (user) {
      form.reset({
        name: user.name || "",
        phone: user.phone || "",
        address: user.address || "",
        city: user.city || "",
        country: user.country || "",
      });
    }
  }, [user, form]);

  if (!user) {
    setLocation("/auth/login");
    return null;
  }

  const onSubmit = (data: ProfileFormValues) => {
    updateUser.mutate(
      { id: user.id, data },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() });
          setIsSavedSuccessfully(true);
          toast({
            title: "Profil mis à jour avec succès",
            description: "Vos informations personnelles ont été enregistrées.",
          });
          setTimeout(() => setIsSavedSuccessfully(false), 3000);
        },
        onError: () => {
          toast({
            title: "Erreur",
            description: "Impossible d'enregistrer les modifications du profil.",
            variant: "destructive",
          });
        },
      }
    );
  };

  const handleLogout = () => {
    logout();
    setLocation("/");
  };

  // Format member join date
  const memberSince = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString("fr-FR", {
        month: "long",
        year: "numeric",
      })
    : "Récemment";

  // Initials for avatar fallback
  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "ON";

  const isGoogleAccount = !!user.avatar?.includes("googleusercontent.com");

  return (
    <Layout>
      <div className="min-h-screen bg-slate-50/60 dark:bg-slate-950 pb-16">
        {/* Cover Hero Banner */}
        <div className="relative h-48 md:h-60 w-full overflow-hidden bg-gradient-to-r from-slate-900 via-[#1E293B] to-[#0F172A]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(232,124,42,0.18),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(75,181,232,0.15),transparent_50%)]" />
          <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#ffffff12_1px,transparent_1px),linear-gradient(to_bottom,#ffffff12_1px,transparent_1px)] bg-[size:24px_24px]" />

          <div className="container mx-auto px-4 h-full flex flex-col justify-end pb-6 relative z-10">
            <div className="flex items-center gap-2 text-xs md:text-sm text-slate-300 font-medium">
              <Link href="/" className="hover:text-white transition-colors">
                Accueil
              </Link>
              <span>/</span>
              <span className="text-[#E87C2A]">Mon Compte</span>
            </div>
          </div>
        </div>

        {/* Main Content Container */}
        <div className="container mx-auto px-4 max-w-5xl">
          {/* Header Identity Card */}
          <div className="relative -mt-16 md:-mt-20 mb-8 z-20">
            <div className="bg-card dark:bg-slate-900 border border-border/80 rounded-2xl p-6 md:p-8 shadow-xl shadow-slate-200/50 dark:shadow-none backdrop-blur-sm">
              <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
                {/* Left: Avatar + Info */}
                <div className="flex flex-col md:flex-row items-center gap-5 text-center md:text-left">
                  {/* Avatar with Ring */}
                  <div className="relative group">
                    <div className="w-24 h-24 md:w-28 md:h-28 rounded-full ring-4 ring-background bg-gradient-to-tr from-[#E87C2A] via-[#F5C430] to-[#4BB5E8] p-1 shadow-lg">
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="w-full h-full object-cover rounded-full bg-slate-900"
                          onError={(e) => {
                            // Fallback if image fails to load
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center text-white font-bold text-2xl md:text-3xl tracking-wider">
                          {initials}
                        </div>
                      )}
                    </div>
                    {/* Status Dot */}
                    <span
                      className="absolute bottom-1 right-1 w-5 h-5 bg-emerald-500 border-2 border-background rounded-full shadow"
                      title="En ligne & actif"
                    />
                  </div>

                  {/* Name and Tags */}
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                      <h1 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">
                        {user.name}
                      </h1>
                      <BadgeCheck className="h-6 w-6 text-[#4BB5E8] shrink-0" title="Compte Vérifié" />
                    </div>

                    <p className="text-sm text-muted-foreground flex items-center justify-center md:justify-start gap-1.5">
                      <Mail className="h-4 w-4 text-slate-400" />
                      <span>{user.email}</span>
                    </p>

                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 pt-1">
                      <Badge
                        variant="secondary"
                        className="bg-amber-100 text-amber-900 dark:bg-amber-950/70 dark:text-amber-200 border-amber-300 dark:border-amber-800 text-xs font-semibold px-2.5 py-0.5 inline-flex items-center gap-1.5"
                      >
                        {user.role === "admin" ? (
                          <>
                            <ShieldCheck className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                            <span>Administrateur</span>
                          </>
                        ) : (
                          <>
                            <Crown className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                            <span>Client Onoot Privilégié</span>
                          </>
                        )}
                      </Badge>

                      {isGoogleAccount ? (
                        <Badge
                          variant="outline"
                          className="text-xs bg-slate-100 dark:bg-slate-800/80 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 flex items-center gap-1.5"
                        >
                          <svg className="w-3 h-3" viewBox="0 0 24 24">
                            <path
                              fill="#4285F4"
                              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                              fill="#34A853"
                              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                              fill="#FBBC05"
                              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                            />
                            <path
                              fill="#EA4335"
                              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                            />
                          </svg>
                          Google Connecté
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="text-xs bg-slate-100 dark:bg-slate-800/80 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 flex items-center gap-1"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                          Compte Onoot Sécurisé
                        </Badge>
                      )}

                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        Inscrit en {memberSince}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Quick Action Buttons */}
                <div className="flex flex-wrap items-center justify-center gap-2.5 w-full md:w-auto">
                  <Link href="/orders">
                    <Button
                      variant="outline"
                      className="gap-2 border-border/80 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                    >
                      <Package className="h-4 w-4 text-[#E87C2A]" />
                      <span>Mes Commandes</span>
                      {totalOrders > 0 && (
                        <span className="ml-1 px-1.5 py-0.5 text-xs bg-[#E87C2A]/10 text-[#E87C2A] font-bold rounded-full">
                          {totalOrders}
                        </span>
                      )}
                    </Button>
                  </Link>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-xl"
                      >
                        <LogOut className="h-4 w-4" />
                        <span className="hidden sm:inline">Déconnexion</span>
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="rounded-2xl">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Se déconnecter ?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Êtes-vous sûr de vouloir vous déconnecter de votre compte Onoot Boutique ? Vos
                          articles enregistrés et commandes restent en sécurité.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-xl">Annuler</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleLogout}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl"
                        >
                          Déconnexion
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>
          </div>

          {/* Key Metric Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {/* Card 1: Commandes */}
            <Link href="/orders">
              <div className="bg-card dark:bg-slate-900 border border-border/70 hover:border-[#E87C2A]/50 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer group">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-[#E87C2A] flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Package className="h-6 w-6" />
                  </div>
                  <span className="text-xs text-muted-foreground group-hover:text-[#E87C2A] flex items-center gap-1">
                    Historique <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
                <div className="mt-4">
                  <div className="text-2xl font-bold text-foreground">
                    {isOrdersLoading ? <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /> : totalOrders}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">Commandes passées au total</p>
                </div>
              </div>
            </Link>

            {/* Card 2: Sécurité */}
            <div className="bg-card dark:bg-slate-900 border border-border/70 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <Badge variant="outline" className="text-[11px] text-emerald-600 border-emerald-300 dark:border-emerald-800">
                  Actif
                </Badge>
              </div>
              <div className="mt-4">
                <div className="text-2xl font-bold text-foreground">Protégé</div>
                <p className="text-xs text-muted-foreground mt-0.5">Session chiffrée SSL 256-bit</p>
              </div>
            </div>

            {/* Card 3: Livraison */}
            <div className="bg-card dark:bg-slate-900 border border-border/70 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-sky-100 dark:bg-sky-950/60 text-[#4BB5E8] flex items-center justify-center">
                  <MapPin className="h-6 w-6" />
                </div>
                <span className="text-xs text-muted-foreground">Standard & Express</span>
              </div>
              <div className="mt-4">
                <div className="text-2xl font-bold text-foreground truncate">
                  {user.city || user.country ? `${user.city || "Abidjan"}, ${user.country || "CI"}` : "Non renseignée"}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">Zone de livraison par défaut</p>
              </div>
            </div>
          </div>

          {/* Main Tabbed Sections */}
          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="bg-slate-200/70 dark:bg-slate-800/80 p-1 rounded-xl h-auto flex flex-wrap gap-1">
              <TabsTrigger
                value="profile"
                className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm px-4 py-2 text-sm font-semibold flex items-center gap-2"
              >
                <User className="h-4 w-4 text-[#E87C2A]" />
                <span>Informations Personnelles</span>
              </TabsTrigger>
              <TabsTrigger
                value="orders"
                className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm px-4 py-2 text-sm font-semibold flex items-center gap-2"
              >
                <ShoppingBag className="h-4 w-4 text-[#4BB5E8]" />
                <span>Mes Commandes Récentes</span>
              </TabsTrigger>
              <TabsTrigger
                value="security"
                className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm px-4 py-2 text-sm font-semibold flex items-center gap-2"
              >
                <Lock className="h-4 w-4 text-emerald-500" />
                <span>Sécurité & Compte</span>
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: Informations Personnelles */}
            <TabsContent value="profile" className="space-y-6 outline-hidden">
              <div className="bg-card dark:bg-slate-900 border border-border/80 rounded-2xl p-6 md:p-8 shadow-sm">
                <div className="border-b border-border/60 pb-5 mb-6">
                  <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                    <User className="h-5 w-5 text-[#E87C2A]" />
                    Coordonnées et adresse de livraison
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Ces informations permettent de pré-remplir automatiquement vos commandes pour une livraison rapide.
                  </p>
                </div>

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {/* Section: Identité */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-semibold text-foreground flex items-center gap-1.5">
                              <User className="h-3.5 w-3.5 text-slate-400" /> Nom complet
                            </FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  placeholder="Ex: Kouamé Sekou"
                                  className="h-11 rounded-xl bg-background border-border/80 focus:border-[#E87C2A]"
                                  {...field}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                          <Mail className="h-3.5 w-3.5 text-slate-400" /> Adresse Email
                        </label>
                        <div className="relative">
                          <Input
                            value={user.email}
                            disabled
                            className="h-11 rounded-xl bg-muted/60 text-muted-foreground border-border/60 cursor-not-allowed"
                          />
                          <span className="absolute right-3 top-3 text-[11px] bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 font-semibold px-2 py-0.5 rounded-full">
                            Vérifié
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-1">
                          L'email est votre identifiant unique sécurisé et ne peut être modifié directement.
                        </p>
                      </div>
                    </div>

                    {/* Section: Téléphone & Adresse */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-semibold text-foreground flex items-center gap-1.5">
                              <Phone className="h-3.5 w-3.5 text-slate-400" /> Numéro de téléphone
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Ex: +225 07 00 00 00 00"
                                className="h-11 rounded-xl bg-background border-border/80 focus:border-[#E87C2A]"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-semibold text-foreground flex items-center gap-1.5">
                              <MapPin className="h-3.5 w-3.5 text-slate-400" /> Adresse de livraison (Rue, Quartier)
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Ex: Cocody Angré 8ème Tranche"
                                className="h-11 rounded-xl bg-background border-border/80 focus:border-[#E87C2A]"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Section: Ville & Pays */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-semibold text-foreground flex items-center gap-1.5">
                              <Building className="h-3.5 w-3.5 text-slate-400" /> Ville
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Ex: Abidjan"
                                className="h-11 rounded-xl bg-background border-border/80 focus:border-[#E87C2A]"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="country"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-semibold text-foreground flex items-center gap-1.5">
                              <Globe className="h-3.5 w-3.5 text-slate-400" /> Pays
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Ex: Côte d'Ivoire"
                                className="h-11 rounded-xl bg-background border-border/80 focus:border-[#E87C2A]"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Submit Bar */}
                    <div className="pt-4 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <Sparkles className="h-4 w-4 text-[#F5C430]" />
                        <span>Vos données sont strictement confidentielles et chiffrées.</span>
                      </div>

                      <Button
                        type="submit"
                        disabled={updateUser.isPending}
                        className="w-full sm:w-auto h-11 px-8 rounded-xl bg-[#E87C2A] hover:bg-[#D06820] text-white font-semibold shadow-md transition-all duration-200 gap-2"
                      >
                        {updateUser.isPending ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Enregistrement...</span>
                          </>
                        ) : isSavedSuccessfully ? (
                          <>
                            <BadgeCheck className="h-4 w-4 text-white" />
                            <span>Enregistré !</span>
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4" />
                            <span>Enregistrer les modifications</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </div>
            </TabsContent>

            {/* TAB 2: Mes Commandes Récentes */}
            <TabsContent value="orders" className="space-y-4 outline-hidden">
              <div className="bg-card dark:bg-slate-900 border border-border/80 rounded-2xl p-6 md:p-8 shadow-sm">
                <div className="flex items-center justify-between border-b border-border/60 pb-5 mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                      <ShoppingBag className="h-5 w-5 text-[#4BB5E8]" />
                      Mes Commandes Récentes
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Suivez l'état de livraison de vos achats chez Onoot Boutique.
                    </p>
                  </div>
                  <Link href="/orders">
                    <Button variant="outline" size="sm" className="rounded-xl gap-1.5 text-xs font-semibold">
                      Voir tout <ExternalLink className="h-3 w-3" />
                    </Button>
                  </Link>
                </div>

                {isOrdersLoading ? (
                  <div className="py-12 flex flex-col items-center justify-center gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-[#E87C2A]" />
                    <p className="text-sm text-muted-foreground">Chargement de vos commandes...</p>
                  </div>
                ) : orders.length === 0 ? (
                  <div className="py-12 text-center">
                    <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-4">
                      <ShoppingBag className="h-8 w-8" />
                    </div>
                    <h3 className="font-bold text-lg text-foreground mb-1">Aucune commande pour le moment</h3>
                    <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
                      Explorez notre catalogue de montres, accessoires tech et appareils connectés premium.
                    </p>
                    <Link href="/products">
                      <Button className="rounded-xl bg-[#E87C2A] hover:bg-[#D06820] text-white">
                        Découvrir les produits
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {orders.slice(0, 3).map((ord) => (
                      <div
                        key={ord.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-border/60 hover:border-[#E87C2A]/40 bg-slate-50/50 dark:bg-slate-800/40 transition-colors gap-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-950/60 text-[#E87C2A] flex items-center justify-center shrink-0">
                            <Package className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-semibold text-sm text-foreground">
                              Commande #{ord.id.slice(-6).toUpperCase()}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {ord.items?.length || 1} article(s) •{" "}
                              {new Date(ord.createdAt).toLocaleDateString("fr-FR", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-4">
                          <div className="text-right">
                            <span className="font-bold text-sm text-foreground block">
                              {ord.totalAmount?.toLocaleString()} FCFA
                            </span>
                            <span className="text-[11px] text-muted-foreground uppercase font-medium">
                              {ord.paymentMethod === "cod" ? "Paiement à la livraison" : ord.paymentMethod}
                            </span>
                          </div>

                          <Link href={`/orders`}>
                            <Button size="sm" variant="ghost" className="rounded-lg h-8 px-2 text-xs">
                              Détails
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))}

                    {orders.length > 3 && (
                      <div className="pt-2 text-center">
                        <Link href="/orders">
                          <Button variant="link" className="text-xs text-[#E87C2A]">
                            Voir toutes vos {orders.length} commandes →
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* TAB 3: Sécurité & Compte */}
            <TabsContent value="security" className="space-y-6 outline-hidden">
              <div className="bg-card dark:bg-slate-900 border border-border/80 rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
                <div className="border-b border-border/60 pb-5">
                  <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-emerald-500" />
                    Sécurité et Protection du Compte
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Paramètres de confidentialité et statut de protection de votre profil.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl border border-border/60 bg-slate-50/50 dark:bg-slate-800/40">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                        <ShieldCheck className="h-4 w-4" />
                      </div>
                      <h4 className="font-semibold text-sm">Chiffrement de bout en bout</h4>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Toutes les transactions et informations personnelles sont protégées par le protocole HTTPS / TLS 1.3
                      sécurisé 256 bits.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border border-border/60 bg-slate-50/50 dark:bg-slate-800/40">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
                        <Lock className="h-4 w-4" />
                      </div>
                      <h4 className="font-semibold text-sm">Authentification</h4>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {isGoogleAccount
                        ? "Votre compte est synchronisé avec Google OAuth 2.0 pour une sécurité maximale sans mot de passe local."
                        : "Vos identifiants sont hachés de manière irréversible via Argon2id pour prévenir toute compromission."}
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-border/60 flex items-center justify-end">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" className="text-destructive hover:bg-destructive/10 rounded-xl gap-2">
                        <LogOut className="h-4 w-4" />
                        Déconnexion sécurisée
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="rounded-2xl">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Se déconnecter ?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Voulez-vous fermer votre session active sur cet appareil ?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-xl">Annuler</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleLogout}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl"
                        >
                          Déconnexion
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
}
