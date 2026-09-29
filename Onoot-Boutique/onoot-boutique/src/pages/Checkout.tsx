import React, { useState } from "react";
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
import { DELIVERY_ZONES, getDeliveryZoneById, DeliveryZone } from "@/lib/deliveryZones";
import {
  Truck,
  MapPin,
  Banknote,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Building2,
  HelpCircle,
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
  const [interiorDetails, setInteriorDetails] = useState<string>("");

  const selectedZone = getDeliveryZoneById(selectedZoneId);
  const itemsTotal = cart?.totalAmount || 0;
  // Frais uniques par commande (ne s'additionnent pas, ne se multiplient pas par article)
  const shippingCost = selectedZone.fee;
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

  // Keep form city in sync when zone changes
  const handleZoneChange = (zoneId: string) => {
    setSelectedZoneId(zoneId);
    const zone = getDeliveryZoneById(zoneId);
    form.setValue("city", zone.commune, { shouldValidate: true });
  };

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

    if (selectedZone.isInterior && !interiorDetails.trim()) {
      toast({
        title: "Détails d'expédition requis",
        description: "Veuillez préciser votre ville de destination et la compagnie/gare de transport.",
        variant: "destructive",
      });
      return;
    }

    let finalCity = selectedZone.commune;
    if (selectedZone.isInterior && interiorDetails.trim()) {
      finalCity = `Intérieur: ${interiorDetails.trim()} (Gare)`;
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
          shippingCost: shippingCost,
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
          notes: data.notes ? data.notes.trim() : undefined,
        },
      },
      {
        onSuccess: (order) => {
          toast({
            title: "Commande confirmée !",
            description: "Votre commande a été passée avec succès. Vous paierez directement au livreur à la réception.",
          });
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
        <div className="container mx-auto px-4 py-16 text-center">Chargement...</div>
      </Layout>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Votre panier est vide</h1>
          <Button asChild>
            <Link href="/products">Retour aux achats</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-10 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Paiement &amp; Livraison</h1>
          <p className="text-sm text-slate-500 mt-1">
            Sélectionnez votre zone de livraison et confirmez votre commande.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Formulaire Client & Livraison */}
          <div className="lg:col-span-2">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} className="space-y-6">
                
                {/* 1. Coordonnées & Lieu de livraison */}
                <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                        1
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-slate-900">Adresse de livraison</h2>
                        <p className="text-xs text-slate-500">Renseignez vos coordonnées de réception</p>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full w-fit">
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
                          <FormLabel className="flex items-center gap-1 font-semibold text-xs text-slate-700">
                            Nom &amp; Prénoms <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: Kouassi Jean" {...field} className="h-11 rounded-xl" />
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
                          <FormLabel className="flex items-center gap-1 font-semibold text-xs text-slate-700">
                            Numéro de téléphone <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: 0503648312 / 0708091011" {...field} className="h-11 rounded-xl" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Commune / Zone de livraison (Tarification dynamique) */}
                    <div className="md:col-span-2 space-y-2">
                      <label className="flex items-center justify-between text-xs font-semibold text-slate-700">
                        <span className="flex items-center gap-1.5">
                          <Truck className="w-3.5 h-3.5 text-primary" />
                          Commune / Zone de livraison <span className="text-red-500">*</span>
                        </span>
                        <span className="text-[11px] text-slate-500 font-normal">
                          Frais fixes : <strong>{selectedZone.badge}</strong>
                        </span>
                      </label>

                      <div className="relative">
                        <select
                          value={selectedZoneId}
                          onChange={(e) => handleZoneChange(e.target.value)}
                          className="w-full h-12 px-3.5 pr-8 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer appearance-none"
                        >
                          {DELIVERY_ZONES.map((zone) => (
                            <option key={zone.id} value={zone.id}>
                              {zone.label} — {zone.badge}
                            </option>
                          ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                          <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                          </svg>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs text-slate-600">
                        <MapPin className="w-4 h-4 text-primary shrink-0" />
                        <span>
                          Frais de livraison pour cette zone : <strong className="text-slate-900">{selectedZone.badge}</strong> (tarif unique pour tout votre panier).
                        </span>
                      </div>
                    </div>

                    {/* Champ supplémentaire si expédition intérieur du pays */}
                    {selectedZone.isInterior && (
                      <div className="md:col-span-2 space-y-1.5 p-4 rounded-xl bg-amber-50/70 border border-amber-200">
                        <label className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                          <Building2 className="w-4 h-4 text-amber-600" />
                          Précisez la Ville de destination &amp; la Compagnie de car / Gare <span className="text-red-500">*</span>
                        </label>
                        <Input
                          placeholder="Ex : Bouaké, Gare UTB (ou CTE / STIF / etc.)"
                          value={interiorDetails}
                          onChange={(e) => setInteriorDetails(e.target.value)}
                          className="h-11 bg-white border-amber-300 focus:border-amber-500 rounded-xl"
                        />
                        <p className="text-[11px] text-amber-700">
                          Le colis sera expédié à la gare indiquée dans votre ville. Les frais d'expédition sont de 2 500 FCFA.
                        </p>
                      </div>
                    )}

                    {/* Adresse précise (Quartier, Rue, Repère) */}
                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel className="flex items-center gap-1 font-semibold text-xs text-slate-700">
                            Adresse exacte / Quartier &amp; Repère <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Ex: Angré 8ème Tranche, pharmacie du carrefour, villa 45"
                              {...field}
                              className="h-11 rounded-xl"
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
                          <FormLabel className="flex items-center gap-1 font-semibold text-xs text-slate-700">
                            Pays <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input {...field} readOnly className="h-11 bg-slate-50 text-slate-600 rounded-xl cursor-not-allowed" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Note facultative */}
                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel className="font-semibold text-xs text-slate-700">
                            Instructions spécifiques pour le livreur (Optionnel)
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Ex : Appeler avant d'arriver, livraison souhaitée l'après-midi..."
                              {...field}
                              className="h-11 rounded-xl"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* 2. Méthode de paiement */}
                <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4">
                  <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
                      2
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">Mode de règlement</h2>
                      <p className="text-xs text-slate-500">Comment souhaitez-vous régler votre commande ?</p>
                    </div>
                  </div>

                  {/* Option 1 : Paiement à la livraison (ACTIVE & SÉLECTIONNÉE) */}
                  <div className="relative border-2 border-emerald-500 bg-emerald-50/40 rounded-xl p-4 transition-all">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full border-2 border-emerald-600 bg-emerald-600 flex items-center justify-center text-white mt-0.5 shrink-0">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                              <Banknote className="w-4 h-4 text-emerald-600" />
                              Paiement à la livraison (En espèces)
                            </span>
                            <Badge className="bg-emerald-600 text-white hover:bg-emerald-600 text-[10px] px-2 py-0.5">
                              Disponible &bull; Recommandé
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                            Payez en toute sécurité directement au livreur en espèces dès réception de votre colis.
                            Vous réglez le prix des articles (<strong>{itemsTotal.toLocaleString()} FCFA</strong>) + les frais de livraison (<strong>{shippingCost.toLocaleString()} FCFA</strong>).
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Options indisponibles (Bientôt disponibles) */}
                  <div className="space-y-2 pt-2">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                      Autres modes de paiement (En cours d'intégration)
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 opacity-60 pointer-events-none">
                      <div className="flex items-center justify-between p-3 border border-slate-200 rounded-xl bg-slate-50">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full border border-slate-300"></div>
                          <span className="text-xs font-semibold text-slate-700">Wave</span>
                        </div>
                        <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                          Bientôt disponible
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-3 border border-slate-200 rounded-xl bg-slate-50">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full border border-slate-300"></div>
                          <span className="text-xs font-semibold text-slate-700">Orange Money</span>
                        </div>
                        <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                          Bientôt disponible
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-3 border border-slate-200 rounded-xl bg-slate-50">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full border border-slate-300"></div>
                          <span className="text-xs font-semibold text-slate-700">MTN Money</span>
                        </div>
                        <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                          Bientôt disponible
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-3 border border-slate-200 rounded-xl bg-slate-50">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full border border-slate-300"></div>
                          <span className="text-xs font-semibold text-slate-700">Carte bancaire (Visa / Mastercard)</span>
                        </div>
                        <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                          Bientôt disponible
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Information sérénité */}
                  <div className="flex items-start gap-2.5 p-3 rounded-xl bg-blue-50/70 border border-blue-100 text-xs text-blue-900 mt-2">
                    <ShieldCheck className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                    <span>
                      <strong>Achat sans risque :</strong> Vous ne payez rien à l'avance en ligne. Le règlement s'effectue directement en main propre lors de la livraison.
                    </span>
                  </div>
                </div>

                {/* Bouton de confirmation */}
                <div className="space-y-3 pt-2">
                  <Button
                    type="submit"
                    className="w-full bg-primary hover:bg-primary/90 h-14 text-base font-bold shadow-lg hover:shadow-xl transition-all rounded-xl flex items-center justify-center gap-2"
                    disabled={createOrder.isPending}
                  >
                    {createOrder.isPending ? (
                      "Validation en cours..."
                    ) : (
                      <>
                        <span>Confirmer ma commande &bull;</span>
                        <span className="text-yellow-300">{grandTotal.toLocaleString()} FCFA</span>
                      </>
                    )}
                  </Button>
                  <p className="text-center text-xs text-slate-400">
                    En confirmant, vous vous engagez à régler le livreur lors de la réception de votre colis.
                  </p>
                </div>
              </form>
            </Form>
          </div>

          {/* Sidebar Résumé de la commande */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 sticky top-24 shadow-sm space-y-5">
              <h2 className="text-lg font-bold text-slate-900 pb-3 border-b border-slate-100 flex items-center justify-between">
                <span>Résumé de la commande</span>
                <span className="text-xs font-normal text-slate-400">
                  {cart.items.reduce((acc, it) => acc + it.quantity, 0)} article(s)
                </span>
              </h2>

              {/* Liste des articles */}
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {cart.items.map((item: CartItem) => (
                  <div key={item.productId} className="flex justify-between items-start text-xs gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-800 truncate">
                        {item.product.name}
                      </div>
                      <div className="text-slate-400 mt-0.5">
                        Qté: {item.quantity} &times; {item.price.toLocaleString()} FCFA
                      </div>
                    </div>
                    <span className="font-bold text-slate-800 whitespace-nowrap">
                      {(item.price * item.quantity).toLocaleString()} FCFA
                    </span>
                  </div>
                ))}
              </div>

              <Separator />

              {/* Décomposition des prix */}
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between items-center text-slate-600">
                  <span>Sous-total articles :</span>
                  <span className="font-semibold text-slate-800">{itemsTotal.toLocaleString()} FCFA</span>
                </div>

                <div className="flex justify-between items-center text-slate-600">
                  <span className="flex items-center gap-1">
                    <Truck className="w-3.5 h-3.5 text-primary" />
                    Frais de livraison :
                  </span>
                  <span className="font-bold text-primary">
                    +{shippingCost.toLocaleString()} FCFA
                  </span>
                </div>

                <div className="text-[11px] text-slate-400 bg-slate-50 p-2 rounded-lg border border-slate-100">
                  Zone : <strong>{selectedZone.commune}</strong>
                  <br />
                  <span className="italic">Tarif unique fixe pour tout le panier.</span>
                </div>
              </div>

              <Separator />

              {/* Total à payer */}
              <div className="p-4 rounded-xl bg-slate-900 text-white space-y-1">
                <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                  Total à payer au livreur
                </div>
                <div className="text-2xl font-black text-amber-400 tracking-tight">
                  {grandTotal.toLocaleString()} FCFA
                </div>
                <div className="text-[11px] text-slate-300 pt-1 border-t border-slate-800 flex items-center gap-1">
                  <Banknote className="w-3 h-3 text-emerald-400" />
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
