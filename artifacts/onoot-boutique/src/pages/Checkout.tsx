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
  fullName: z.string().min(2, "Le nom est requis"),
  phone: z.string().min(8, "Le numéro de téléphone est requis"),
  address: z.string().min(5, "L'adresse est requise"),
  city: z.string().min(2, "La ville est requise"),
  country: z.string().min(2, "Le pays est requis"),
  postalCode: z.string().optional(),
  paymentMethod: z.string().min(1, "Veuillez sélectionner une méthode de paiement"),
  notes: z.string().optional(),
});

type CheckoutFormValues = z.infer<typeof checkoutSchema>;

export default function Checkout() {
  const { cart, isLoading: isCartLoading, sessionId } = useCartContext();
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  const { toast } = useToast();

  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
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

  const onSubmit = (data: CheckoutFormValues) => {
    if (!cart || cart.items.length === 0) return;

    createOrder.mutate({
      data: {
        userId: user?.id,
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
          fullName: data.fullName,
          phone: data.phone,
          address: data.address,
          city: data.city,
          country: data.country,
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
      onError: () => {
        toast({ title: "Erreur", description: "Impossible de passer la commande.", variant: "destructive" });
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
          <Link href="/products"><Button>Retour aux achats</Button></Link>
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
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="bg-card border border-border p-6 rounded-xl">
                  <h2 className="text-xl font-bold mb-4">Adresse de livraison</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="fullName" render={({ field }) => (
                      <FormItem><FormLabel>Nom complet</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="phone" render={({ field }) => (
                      <FormItem><FormLabel>Téléphone</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="address" render={({ field }) => (
                      <FormItem className="md:col-span-2"><FormLabel>Adresse complète</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="city" render={({ field }) => (
                      <FormItem><FormLabel>Ville</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="country" render={({ field }) => (
                      <FormItem><FormLabel>Pays</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
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

                <Button type="submit" className="w-full bg-primary hover:bg-primary/90 h-12 text-lg" disabled={createOrder.isPending}>
                  {createOrder.isPending ? "Traitement..." : "Confirmer la commande"}
                </Button>
              </form>
            </Form>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-gray-50 border border-border rounded-xl p-6 sticky top-24">
              <h2 className="text-xl font-bold mb-6">Résumé de la commande</h2>
              <div className="space-y-4 mb-6">
                {cart.items.map((item: CartItem) => (
                  <div key={item.productId} className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <span className="font-medium text-muted-foreground">{item.quantity}x</span>
                      <span className="truncate">{item.product.name}</span>
                    </div>
                    <span className="font-medium whitespace-nowrap ml-2">{(item.price * item.quantity).toLocaleString()} FCFA</span>
                  </div>
                ))}
              </div>
              <Separator className="my-4" />
              <div className="flex justify-between items-center font-bold text-lg">
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
