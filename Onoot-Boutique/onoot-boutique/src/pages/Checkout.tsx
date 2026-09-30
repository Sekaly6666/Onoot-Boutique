import React, { useState, useMemo } from "react";
import { useLocation, Link } from "wouter";
import { Layout } from "@/components/layout/Layout";
import { useCartContext } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useCreateOrder, CartItem } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  DELIVERY_ZONES,
  getDeliveryZoneById,
  searchDeliveryZones,
  detectZoneFromCoordinates,
  buildInteriorWhatsAppUrl,
  DeliveryZone,
} from "@/lib/deliveryZones";
import {
  Truck,
  MapPin,
  Banknote,
  CheckCircle2,
  ShieldCheck,
  Building2,
  Navigation,
  Loader2,
  Search,
  MessageCircle,
  AlertCircle,
  Check,
} from "lucide-react";

const checkoutSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(1, "Le nom complet est obligatoire")
    .min(2, "Le nom complet doit comporter au moins 2 caractères"),
  phone: z
    .string()
    .trim()
    .min(1, "Le numéro de téléphone est obligatoire")
    .min(8, "Le numéro de téléphone doit comporter au moins 8 caractères"),
  address: z
    .string()
    .trim()
    .min(1, "L'adresse complète est obligatoire")
    .min(3, "Veuillez renseigner une adresse complète (quartier, rue, repère)"),
  city: z
    .string()
    .trim()
    .min(1, "La zone ou commune de livraison est obligatoire"),
  country: z
    .string()
    .trim()
    .min(1, "Le pays est obligatoire"),
  postalCode: z.string().optional(),
  paymentMethod: z.string().min(1, "Veuillez sélectionner une méthode de paiement"),
  notes: z.string().optional(),
});

type CheckoutFormValues = z.infer<typeof checkoutSchema>;

export default function Checkout() {
  const { cart, isLoading: isCartLoading, sessionId } = useCartContext();
  const { user, isLoading: isAuthLoading } = useAuth();
  const [location, setLocation] = useLocation();
  const { toast } = useToast();

  const [selectedZoneId, setSelectedZoneId] = useState<string>("cocody");
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [detectedAddress, setDetectedAddress] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);

  // Pour l'expédition intérieur du pays
  const [interiorCity, setInteriorCity] = useState<string>("");
  const [interiorStation, setInteriorStation] = useState<string>("");

  const selectedZone = getDeliveryZoneById(selectedZoneId);
  const isInterior = Boolean(selectedZone.isInterior);

  const itemsTotal = cart?.totalAmount || 0;
  // Si c'est l'intérieur du pays, les frais seront convenus sur WhatsApp
  const shippingCost = isInterior ? 0 : selectedZone.fee;
  const grandTotal = itemsTotal + shippingCost;

  React.useEffect(() => {
    if (!isAuthLoading && !user) {
      toast({
        title: "Connexion requise",
        description: "Veuillez vous connecter pour passer à la caisse.",
        variant: "destructive",
      });
      setLocation("/auth/login?redirect=/checkout");
    }
  }, [user, isAuthLoading, setLocation, toast]);

  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    mode: "onTouched",
    defaultValues: {
      fullName: user?.name || "",
      phone: user?.phone || "",
      address: user?.address || "",
      city: selectedZone.commune,
      country: user?.country || "Côte d'Ivoire",
      postalCode: "",
      paymentMethod: "Paiement à la livraison",
      notes: "",
    },
  });

  // Filtrage des zones de livraison selon la recherche
  const filteredZones = useMemo(() => {
    return searchDeliveryZones(searchQuery);
  }, [searchQuery]);

  const handleSelectZone = (zone: DeliveryZone) => {
    setSelectedZoneId(zone.id);
    form.setValue("city", zone.commune, { shouldValidate: true });
    setIsSearchOpen(false);
    setSearchQuery("");
  };

  // Géolocalisation automatique GPS
  const handleAutoGeolocate = () => {
    if (!("geolocation" in navigator)) {
      toast({
        title: "Géolocalisation indisponible",
        description: "Votre navigateur ne prend pas en charge la géolocalisation GPS.",
        variant: "destructive",
      });
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const detected = await detectZoneFromCoordinates(latitude, longitude);

          if (detected) {
            setSelectedZoneId(detected.zone.id);
            form.setValue("city", detected.zone.commune, { shouldValidate: true });
            setDetectedAddress(detected.addressDetails);
            toast({
              title: "Position détectée avec succès !",
              description: `Commune identifiée : ${detected.zone.label} (${detected.addressDetails}).`,
            });
          } else {
            toast({
              title: "Commune non identifiée",
              description: "Veuillez sélectionner votre commune dans la liste ci-dessous.",
            });
          }
        } catch {
          toast({
            title: "Erreur de géolocalisation",
            description: "Impossible d'identifier votre commune. Veuillez la sélectionner manuellement.",
          });
        } finally {
          setIsLocating(false);
        }
      },
      (err) => {
        setIsLocating(false);
        let msg = "Impossible d'accéder à votre position.";
        if (err.code === 1) {
          msg = "Veuillez autoriser l'accès à la localisation dans votre navigateur.";
        }
        toast({
          title: "Accès GPS refusé",
          description: msg,
          variant: "destructive",
        });
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Lien WhatsApp direct pour les frais d'expédition en gare
  const whatsAppInteriorUrl = useMemo(() => {
    if (!cart?.items) return "#";
    return buildInteriorWhatsAppUrl({
      items: cart.items.map((it: CartItem) => ({
        name: it.product.name,
        quantity: it.quantity,
        price: it.price,
      })),
      itemsTotal,
      destinationCity: interiorCity,
      preferredStation: interiorStation,
    });
  }, [cart, itemsTotal, interiorCity, interiorStation]);

  const createOrder = useCreateOrder();

  const onInvalid = () => {
    toast({
      title: "Adresse de livraison incomplète",
      description: "Tous les champs de l'adresse de livraison doivent obligatoirement être remplis pour confirmer la commande.",
      variant: "destructive",
    });
  };

  const onSubmit = (data: CheckoutFormValues) => {
    if (!cart || cart.items.length === 0) return;

    if (isInterior && !interiorCity.trim()) {
      toast({
        title: "Ville de destination requise",
        description: "Veuillez renseigner votre ville de destination pour l'expédition en gare.",
        variant: "destructive",
      });
      return;
    }

    let finalCity = selectedZone.commune;
    let orderNotes = data.notes?.trim() || "";

    if (isInterior) {
      finalCity = `Intérieur: ${interiorCity.trim()}${interiorStation.trim() ? ` (${interiorStation.trim()})` : ""}`;
      const interiorNote = `[Expédition Hors Abidjan en gare : ${interiorCity.trim()} - Gare : ${interiorStation.trim() || "À convenir"} - Frais de transport à confirmer sur WhatsApp]`;
      orderNotes = orderNotes ? `${orderNotes}\n${interiorNote}` : interiorNote;
    }

    createOrder.mutate(
      {
        data: {
          userId: user?.id,
          customerEmail: user?.email,
          sessionId,
          items: cart.items.map((item: CartItem) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
            productName: item.product.name,
            productImage: item.product.images?.[0],
          })),
          totalAmount: grandTotal,
          shippingCost: isInterior ? 0 : shippingCost,
          itemsTotal: itemsTotal,
          paymentMethod: data.paymentMethod,
          shippingAddress: {
            fullName: data.fullName.trim(),
            phone: data.phone.trim(),
            address: data.address.trim(),
            city: finalCity,
            country: data.country.trim(),
            postalCode: data.postalCode,
          },
          notes: orderNotes || undefined,
        },
      },
      {
        onSuccess: (order) => {
          if (isInterior) {
            toast({
              title: "Commande enregistrée en attente d'expédition !",
              description: "Notre équipe va convenir avec vous des frais d'expédition sur WhatsApp.",
            });
          } else {
            toast({
              title: "Commande confirmée !",
              description: "Votre commande a été enregistrée. Vous paierez directement au livreur à la réception.",
            });
          }
          setLocation(`/orders/${order.id}`);
        },
        onError: (err: any) => {
          const errorMsg =
            err?.message ||
            "Impossible de passer la commande. Veuillez vérifier vos informations.";
          toast({ title: "Erreur", description: errorMsg, variant: "destructive" });
        },
      }
    );
  };

  if (isCartLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 text-center text-slate-800 dark:text-slate-200">
          Chargement...
        </div>
      </Layout>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4 text-slate-900 dark:text-slate-100">Votre panier est vide</h1>
          <Button asChild>
            <Link href="/products">Retour aux achats</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-10 max-w-6xl transition-colors duration-200">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Paiement &amp; Livraison
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Sélectionnez votre zone de livraison et confirmez votre commande en toute sérénité.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Formulaire Client & Livraison */}
          <div className="lg:col-span-2">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} className="space-y-6">
                
                {/* 1. Coordonnées & Lieu de livraison */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                        1
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Adresse de livraison</h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Renseignez vos coordonnées de réception</p>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800 px-2.5 py-1 rounded-full w-fit">
                      <span className="text-red-500 font-black">*</span> Champs obligatoires
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Nom complet */}
                    <FormField
                      control={form.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-1 font-semibold text-xs text-slate-700 dark:text-slate-300">
                            Nom &amp; Prénoms <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Ex: Kouassi Jean"
                              {...field}
                              className="h-11 rounded-xl bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Téléphone */}
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-1 font-semibold text-xs text-slate-700 dark:text-slate-300">
                            Numéro de téléphone <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Ex: 0503648312 / 0708091011"
                              {...field}
                              className="h-11 rounded-xl bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* ZONE DE LIVRAISON : Recherche intelligente + Bouton GPS */}
                    <div className="md:col-span-2 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                          <Truck className="w-3.5 h-3.5 text-primary" />
                          Commune / Zone de livraison <span className="text-red-500">*</span>
                        </label>

                        {/* Bouton Géolocalisation automatique */}
                        <button
                          type="button"
                          onClick={handleAutoGeolocate}
                          disabled={isLocating}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 transition-all cursor-pointer shadow-2xs self-start sm:self-auto"
                        >
                          {isLocating ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Localisation GPS en cours...</span>
                            </>
                          ) : (
                            <>
                              <Navigation className="w-3.5 h-3.5" />
                              <span>Me géolocaliser automatiquement</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Sélecteur et recherche de commune */}
                      <div className="relative">
                        {/* Zone active affichée */}
                        <div
                          onClick={() => setIsSearchOpen(!isSearchOpen)}
                          className="w-full min-h-[50px] p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between cursor-pointer hover:border-primary/50 transition-all shadow-xs"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                              <MapPin className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                                {selectedZone.label}
                              </div>
                              <div className="text-xs text-slate-500 dark:text-slate-400">
                                {isInterior ? "Frais à convenir avec la boutique" : `Frais fixes : ${selectedZone.badge}`}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <Badge
                              className={
                                isInterior
                                  ? "bg-amber-600 text-white hover:bg-amber-600 text-xs font-semibold"
                                  : "bg-primary text-white hover:bg-primary text-xs font-semibold"
                              }
                            >
                              {selectedZone.badge}
                            </Badge>
                            <span className="text-xs text-slate-400 font-bold">▼</span>
                          </div>
                        </div>

                        {/* Menu déroulant de recherche et sélection */}
                        {isSearchOpen && (
                          <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl overflow-hidden animate-in fade-in-50 duration-150">
                            {/* Barre de recherche */}
                            <div className="p-3 border-b border-slate-100 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/60">
                              <div className="relative">
                                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                                <input
                                  type="text"
                                  placeholder="Rechercher une commune, quartier (ex: Angré, Yop, Bassam, Bouaké...)"
                                  value={searchQuery}
                                  onChange={(e) => setSearchQuery(e.target.value)}
                                  autoFocus
                                  className="w-full h-10 pl-9 pr-3 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                />
                              </div>
                            </div>

                            {/* Liste filtrée */}
                            <div className="max-h-64 overflow-y-auto p-1.5 space-y-1">
                              {filteredZones.length === 0 ? (
                                <div className="p-4 text-center text-xs text-slate-400">
                                  Aucune commune trouvée pour cette recherche.
                                </div>
                              ) : (
                                filteredZones.map((z) => {
                                  const isCurrent = z.id === selectedZone.id;
                                  return (
                                    <div
                                      key={z.id}
                                      onClick={() => handleSelectZone(z)}
                                      className={`p-2.5 rounded-xl flex items-center justify-between cursor-pointer transition-colors ${
                                        isCurrent
                                          ? "bg-primary/10 border border-primary/20 text-primary font-bold"
                                          : "hover:bg-slate-100 dark:hover:bg-slate-700/60 text-slate-800 dark:text-slate-200 font-medium"
                                      }`}
                                    >
                                      <div className="flex items-center gap-2 text-xs truncate">
                                        {isCurrent && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
                                        <span className="truncate">{z.label}</span>
                                      </div>
                                      <span
                                        className={`text-xs font-bold shrink-0 ml-2 ${
                                          z.isInterior ? "text-amber-600 dark:text-amber-400" : "text-slate-700 dark:text-slate-300"
                                        }`}
                                      >
                                        {z.badge}
                                      </span>
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Indication visuelle si géolocalisé */}
                      {detectedAddress && (
                        <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Adresse GPS détectée : {detectedAddress}</span>
                        </div>
                      )}
                    </div>

                    {/* SECTION EXPÉDITION INTÉRIEUR DU PAYS (OPTION 2 PRO) */}
                    {isInterior && (
                      <div className="md:col-span-2 p-5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 space-y-4">
                        <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-bold text-sm">
                          <Building2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                          <span>Expédition Hors d'Abidjan (En gare / car)</span>
                        </div>

                        <p className="text-xs text-amber-800 dark:text-amber-300/90 leading-relaxed">
                          Les frais de transport en car dépendent de votre ville et de la compagnie choisie. 
                          Vous pouvez valider votre commande maintenant, et nous conviendrons ensemble des frais d'expédition sur WhatsApp avant l'envoi de votre colis.
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                          <div>
                            <label className="text-xs font-bold text-amber-950 dark:text-amber-200 block mb-1">
                              Ville de destination <span className="text-red-500">*</span>
                            </label>
                            <Input
                              placeholder="Ex: Bouaké, Yamoussoukro, Korhogo..."
                              value={interiorCity}
                              onChange={(e) => setInteriorCity(e.target.value)}
                              className="h-11 bg-white dark:bg-slate-900 border-amber-300 dark:border-amber-800 text-slate-900 dark:text-slate-100 rounded-xl"
                            />
                          </div>

                          <div>
                            <label className="text-xs font-bold text-amber-950 dark:text-amber-200 block mb-1">
                              Compagnie / Gare souhaitée (Optionnel)
                            </label>
                            <Input
                              placeholder="Ex: UTB, CTE, STIF, etc."
                              value={interiorStation}
                              onChange={(e) => setInteriorStation(e.target.value)}
                              className="h-11 bg-white dark:bg-slate-900 border-amber-300 dark:border-amber-800 text-slate-900 dark:text-slate-100 rounded-xl"
                            />
                          </div>
                        </div>

                        {/* Bouton WhatsApp direct */}
                        <div className="pt-2">
                          <a
                            href={whatsAppInteriorUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full inline-flex items-center justify-center gap-2 h-11 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition-all"
                          >
                            <MessageCircle className="w-4 h-4" />
                            <span>Convenir des frais d'expédition sur WhatsApp</span>
                          </a>
                        </div>
                      </div>
                    )}

                    {/* Adresse précise (Quartier, Rue, Repère) */}
                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel className="flex items-center gap-1 font-semibold text-xs text-slate-700 dark:text-slate-300">
                            Adresse exacte / Quartier &amp; Repère <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Ex: Angré 8ème Tranche, pharmacie du carrefour, villa 45"
                              {...field}
                              className="h-11 rounded-xl bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Pays */}
                    <FormField
                      control={form.control}
                      name="country"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel className="flex items-center gap-1 font-semibold text-xs text-slate-700 dark:text-slate-300">
                            Pays <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <div>
                              <Input
                                placeholder="Ex: Côte d'Ivoire, Mali, Sénégal, Burkina Faso, France..."
                                list="country-suggestions"
                                {...field}
                                onChange={(e) => {
                                  field.onChange(e);
                                  const val = e.target.value.trim().toLowerCase();
                                  const isCI = val === "côte d'ivoire" || val === "cote d'ivoire" || val === "ci";
                                  if (!isCI && val.length >= 2 && selectedZoneId !== "hors-abidjan") {
                                    setSelectedZoneId("hors-abidjan");
                                    form.setValue("city", "Expédition Hors Côte d'Ivoire", { shouldValidate: true });
                                    if (!interiorCity) {
                                      setInteriorCity(e.target.value);
                                    }
                                  }
                                }}
                                className="h-11 rounded-xl bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                              />
                              <datalist id="country-suggestions">
                                <option value="Côte d'Ivoire" />
                                <option value="Mali" />
                                <option value="Burkina Faso" />
                                <option value="Sénégal" />
                                <option value="Guinée" />
                                <option value="Ghana" />
                                <option value="Togo" />
                                <option value="Bénin" />
                                <option value="Niger" />
                                <option value="Cameroun" />
                                <option value="Gabon" />
                                <option value="Congo" />
                                <option value="France" />
                                <option value="Belgique" />
                                <option value="Canada" />
                                <option value="États-Unis" />
                              </datalist>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Instructions spécifiques */}
                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel className="font-semibold text-xs text-slate-700 dark:text-slate-300">
                            Instructions spécifiques pour la livraison (Optionnel)
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Ex : Appeler avant d'arriver, livraison souhaitée l'après-midi..."
                              {...field}
                              className="h-11 rounded-xl bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* 2. Méthode de paiement */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm space-y-4">
                  <div className="flex items-center gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold text-sm">
                      2
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Mode de règlement</h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Comment souhaitez-vous régler votre commande ?</p>
                    </div>
                  </div>

                  {/* Option 1 : Paiement à la livraison */}
                  <div className="relative border-2 border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20 rounded-xl p-4 transition-all">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full border-2 border-emerald-600 bg-emerald-600 flex items-center justify-center text-white mt-0.5 shrink-0">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-1.5">
                              <Banknote className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                              Paiement à la livraison (En espèces)
                            </span>
                            <Badge className="bg-emerald-600 text-white hover:bg-emerald-600 text-[10px] px-2 py-0.5">
                              Disponible &bull; Recommandé
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
                            {isInterior ? (
                              <span>
                                Vous réglez les articles (<strong>{itemsTotal.toLocaleString()} FCFA</strong>) + les frais de gare convenus avec la boutique lors de la remise de votre colis.
                              </span>
                            ) : (
                              <span>
                                Payez directement au livreur en espèces dès réception de votre colis. 
                                Vous réglez le prix des articles (<strong>{itemsTotal.toLocaleString()} FCFA</strong>) + les frais de livraison (<strong>{shippingCost.toLocaleString()} FCFA</strong>).
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Options indisponibles */}
                  <div className="space-y-2 pt-2">
                    <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                      Autres modes de paiement (En cours d'intégration)
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 opacity-60 pointer-events-none">
                      <div className="flex items-center justify-between p-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-600"></div>
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Wave</span>
                        </div>
                        <span className="text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-full font-medium">
                          Bientôt disponible
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-600"></div>
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Orange Money</span>
                        </div>
                        <span className="text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-full font-medium">
                          Bientôt disponible
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-600"></div>
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">MTN Money</span>
                        </div>
                        <span className="text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-full font-medium">
                          Bientôt disponible
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-600"></div>
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Carte bancaire</span>
                        </div>
                        <span className="text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-full font-medium">
                          Bientôt disponible
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Information sérénité */}
                  <div className="flex items-start gap-2.5 p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/60 text-xs text-blue-900 dark:text-blue-300 mt-2">
                    <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                    <span>
                      <strong>Achat sans risque :</strong> Vous ne payez rien à l'avance en ligne. Le règlement s'effectue directement en main propre lors de la livraison.
                    </span>
                  </div>
                </div>

                {/* Bouton de confirmation */}
                <div className="space-y-3 pt-2">
                  <Button
                    type="submit"
                    className="w-full bg-primary hover:bg-primary/90 text-white h-14 text-base font-bold shadow-lg hover:shadow-xl transition-all rounded-xl flex items-center justify-center gap-2 cursor-pointer"
                    disabled={createOrder.isPending}
                  >
                    {createOrder.isPending ? (
                      "Validation en cours..."
                    ) : isInterior ? (
                      <>
                        <span>Confirmer la commande &bull;</span>
                        <span className="text-yellow-300">{itemsTotal.toLocaleString()} FCFA</span>
                        <span className="text-xs text-white/80">(+ frais en gare)</span>
                      </>
                    ) : (
                      <>
                        <span>Confirmer ma commande &bull;</span>
                        <span className="text-yellow-300">{grandTotal.toLocaleString()} FCFA</span>
                      </>
                    )}
                  </Button>
                  <p className="text-center text-xs text-slate-400 dark:text-slate-500">
                    En confirmant, vous vous engagez à régler le livreur lors de la réception de votre colis.
                  </p>
                </div>
              </form>
            </Form>
          </div>

          {/* Sidebar Résumé de la commande */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sticky top-24 shadow-sm space-y-5">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span>Résumé de la commande</span>
                <span className="text-xs font-normal text-slate-400 dark:text-slate-500">
                  {cart.items.reduce((acc, it) => acc + it.quantity, 0)} article(s)
                </span>
              </h2>

              {/* Liste des articles */}
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {cart.items.map((item: CartItem) => (
                  <div key={item.productId} className="flex justify-between items-start text-xs gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {item.product.name}
                      </div>
                      <div className="text-slate-400 dark:text-slate-500 mt-0.5">
                        Qté: {item.quantity} &times; {item.price.toLocaleString()} FCFA
                      </div>
                    </div>
                    <span className="font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                      {(item.price * item.quantity).toLocaleString()} FCFA
                    </span>
                  </div>
                ))}
              </div>

              <Separator className="dark:bg-slate-800" />

              {/* Décomposition des prix */}
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                  <span>Sous-total articles :</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{itemsTotal.toLocaleString()} FCFA</span>
                </div>

                <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                  <span className="flex items-center gap-1">
                    <Truck className="w-3.5 h-3.5 text-primary" />
                    Frais de livraison :
                  </span>
                  {isInterior ? (
                    <span className="font-bold text-amber-600 dark:text-amber-400">
                      À convenir sur WhatsApp
                    </span>
                  ) : (
                    <span className="font-bold text-primary">
                      +{shippingCost.toLocaleString()} FCFA
                    </span>
                  )}
                </div>

                <div className="text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 space-y-1">
                  <div>
                    Zone : <strong className="text-slate-800 dark:text-slate-200">{selectedZone.commune}</strong>
                  </div>
                  {isInterior ? (
                    <div className="text-amber-600 dark:text-amber-400 italic">
                      Frais fixés avec la boutique après échange WhatsApp.
                    </div>
                  ) : (
                    <div className="text-slate-400 dark:text-slate-500 italic">
                      Tarif unique fixe pour tout le panier.
                    </div>
                  )}
                </div>
              </div>

              <Separator className="dark:bg-slate-800" />

              {/* Total à payer */}
              <div className="p-4 rounded-xl bg-slate-900 dark:bg-slate-950 text-white space-y-1.5 border border-slate-800">
                <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                  Total à payer au livreur
                </div>
                <div className="text-2xl font-black text-amber-400 tracking-tight">
                  {grandTotal.toLocaleString()} FCFA
                  {isInterior && <span className="text-xs text-white/80 font-normal ml-1.5">(+ frais gare)</span>}
                </div>
                <div className="text-[11px] text-slate-300 pt-1.5 border-t border-slate-800 flex items-center gap-1">
                  <Banknote className="w-3.5 h-3.5 text-emerald-400" />
                  Règlement en espèces à la livraison
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
