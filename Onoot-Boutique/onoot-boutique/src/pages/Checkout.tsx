import React from "react";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";

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
    .min(1, "La ville ou commune est obligatoire")
    .min(2, "La ville doit comporter au moins 2 caractères"),
  country: z
    .string()
    .trim()
    .min(1, "Le pays est obligatoire")
    .min(2, "Le pays doit comporter au moins 2 caractères"),
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
      city: user?.city || "",
      country: user?.country || "Côte d'Ivoire",
      postalCode: "",
      paymentMethod: "Paiement à la livraison",
      notes: "",
    },
  });

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

    createOrder.mutate({
      data: {
        userId: user?.id,
        customerEmail: user?.email,
        sessionId,
        items: cart.items.map((item: CartItem) => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          productName: item.product.name,
          productImage: item.product.images?.[0]
        })),
        totalAmount: cart.totalAmount,
        paymentMethod: data.paymentMethod,
        shippingAddress: {
          fullName: data.fullName.trim(),
          phone: data.phone.trim(),
          address: data.address.trim(),
          city: data.city.trim(),
          country: data.country.trim(),
          postalCode: data.postalCode
        },
        notes: data.notes
      }
    }, {
      onSuccess: (order) => {
        toast({ title: "Commande confirmée", description: "Votre commande a été passée avec succès." });
        setLocation(`/orders/${order.id}`);
        // Cart should ideally be cleared here via a backend mutation or context clear
      },
      onError: (err: any) => {
        const errorMsg = err?.message || "Impossible de passer la commande. Veuillez vérifier vos informations.";
        toast({ title: "Erreur", description: errorMsg, variant: "destructive" });
      }
    });
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
          <Button asChild><Link href="/products">Retour aux achats</Link></Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8">Paiement et Livraison</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} className="space-y-8">
                <div className="bg-card border border-border p-6 rounded-xl">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-border gap-2">
                    <div>
                      <h2 className="text-xl font-bold">Adresse de livraison</h2>
                      <p className="text-xs text-muted-foreground mt-0.5">Renseignez vos coordonnées de livraison</p>
                    </div>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 px-2.5 py-1 rounded-full w-fit">
                      <span className="text-red-500 font-black">*</span> Tous les champs sont obligatoires
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="fullName" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1 font-semibold">
                          Nom complet <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Kouassi Jean" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={form.control} name="phone" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1 font-semibold">
                          Téléphone <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: 0503648312" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={form.control} name="address" render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel className="flex items-center gap-1 font-semibold">
                          Adresse complète (Quartier, Rue, Repère) <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Angré 8ème Tranche, pharmacie du carrefour" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={form.control} name="city" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1 font-semibold">
                          Ville / Commune <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Abidjan, Cocody" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={form.control} name="country" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1 font-semibold">
                          Pays <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Côte d'Ivoire" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                </div>

                <div className="bg-card border border-border p-6 rounded-xl">
                  <h2 className="text-xl font-bold mb-4">Méthode de paiement</h2>
                  <FormField control={form.control} name="paymentMethod" render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormControl>
                        <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex flex-col space-y-2">
                          <FormItem className="flex items-center space-x-3 space-y-0 p-3 border rounded-md">
                            <FormControl><RadioGroupItem value="Paiement à la livraison" /></FormControl>
                            <FormLabel className="font-normal cursor-pointer">Paiement à la livraison</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0 p-3 border rounded-md">
                            <FormControl><RadioGroupItem value="Orange Money" /></FormControl>
                            <FormLabel className="font-normal cursor-pointer">Orange Money</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0 p-3 border rounded-md">
                            <FormControl><RadioGroupItem value="MTN Money" /></FormControl>
                            <FormLabel className="font-normal cursor-pointer">MTN Money</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0 p-3 border rounded-md">
                            <FormControl><RadioGroupItem value="Carte bancaire" /></FormControl>
                            <FormLabel className="font-normal cursor-pointer">Carte bancaire</FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <div className="space-y-2">
                  <Button
                    type="submit"
                    className="w-full bg-primary hover:bg-primary/90 h-12 text-lg font-semibold shadow-md"
                    disabled={createOrder.isPending}
                  >
                    {createOrder.isPending ? "Traitement..." : "Confirmer la commande"}
                  </Button>
                  <p className="text-center text-xs text-muted-foreground">
                    Tous les champs marqués d'une étoile (*) sont requis pour valider votre commande.
                  </p>
                </div>
              </form>
            </Form>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-card border border-border rounded-xl p-6 sticky top-24 shadow-sm">
              <h2 className="text-xl font-bold mb-6 text-slate-900 dark:text-primary">Résumé de la commande</h2>
              <div className="space-y-4 mb-6">
                {cart.items.map((item: CartItem) => (
                  <div key={item.productId} className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <span className="font-medium text-muted-foreground">{item.quantity}x</span>
                      <span className="truncate text-foreground font-medium">{item.product.name}</span>
                    </div>
                    <span className="font-medium whitespace-nowrap ml-2 text-foreground">{(item.price * item.quantity).toLocaleString()} FCFA</span>
                  </div>
                ))}
              </div>
              <Separator className="my-4" />
              <div className="flex justify-between items-center font-bold text-lg text-foreground">
                <span>Total</span>
                <span className="text-accent">{cart.totalAmount.toLocaleString()} FCFA</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
