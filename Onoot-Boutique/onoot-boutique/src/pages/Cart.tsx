import React from "react";
import { Link, useLocation } from "wouter";
import { Layout } from "@/components/layout/Layout";
import { useCartContext } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { CartItem } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Trash2, ArrowRight, ShoppingBag, Lock } from "lucide-react";
import DeleteConfirm from "@/components/DeleteConfirm";
import { Separator } from "@/components/ui/separator";

export default function Cart() {
  const { cart, isLoading, updateItem, removeItem } = useCartContext();
  const [productToDelete, setProductToDelete] = React.useState<CartItem | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);

  const handleDelete = (item: CartItem) => {
    setProductToDelete(item);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (productToDelete) {
      removeItem(productToDelete.productId);
    }
    setShowDeleteConfirm(false);
    setProductToDelete(null);
  };
  const { user } = useAuth();
  const [location, setLocation] = useLocation();

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16">
          <h1 className="text-3xl font-bold mb-8">Mon Panier</h1>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {[1, 2].map(i => <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse"></div>)}
            </div>
            <div className="h-64 bg-gray-100 rounded-xl animate-pulse"></div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-24 text-center">
          <div className="bg-primary/5 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-4">Votre panier est vide</h1>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Vous n'avez pas encore ajouté de produits à votre panier. Découvrez notre catalogue pour trouver ce qu'il vous faut.
          </p>
          <Button size="lg" className="bg-primary hover:bg-primary/90" asChild>
            <Link href="/products">Découvrir nos produits</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8 text-foreground">Mon Panier</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cart.items.map((item: CartItem) => (
              <div key={item.productId} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-card border border-border p-4 rounded-xl shadow-sm">
                <div className="w-24 h-24 bg-gray-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <img 
                    src={item.product.images?.[0] || "/images/smartwatch.png"} 
                    alt={item.product.name}
                    className="w-full h-full object-contain mix-blend-multiply"
                  />
                </div>
                
                <div className="flex-1 min-w-0">
                  <Link href={`/products/${item.productId}`}>
                    <h3 className="font-semibold text-foreground hover:text-primary transition-colors line-clamp-1">
                      {item.product.name}
                    </h3>
                  </Link>
                  <p className="text-accent font-bold mt-1">{item.price.toLocaleString()} FCFA</p>
                  
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center border border-border rounded-md">
                      <button 
                        className="px-3 py-1 text-muted-foreground hover:bg-gray-100 disabled:opacity-50 transition-colors"
                        onClick={() => updateItem(item.productId, Math.max(1, item.quantity - 1))}
                        disabled={item.quantity <= 1}
                      >
                        -
                      </button>
                      <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                      <button 
                        className="px-3 py-1 text-muted-foreground hover:bg-gray-100 disabled:opacity-50 transition-colors"
                        onClick={() => updateItem(item.productId, Math.min(item.product.stock, item.quantity + 1))}
                        disabled={item.quantity >= item.product.stock}
                      >
                        +
                      </button>
                    </div>
                    
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDelete(item)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" /> Supprimer
                    </Button>
                  </div>
                </div>
              </div>

            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-card border border-border rounded-xl p-6 sticky top-24 shadow-sm">
              <h2 className="text-xl font-bold mb-6 text-slate-900 dark:text-primary">Résumé de la commande</h2>
              
              <div className="space-y-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sous-total ({cart.totalItems} articles)</span>
                  <span className="font-medium text-foreground">{cart.totalAmount.toLocaleString()} FCFA</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Frais de livraison</span>
                  <span className="font-medium text-foreground">Calculés à l'étape suivante</span>
                </div>
              </div>
              
              <Separator className="my-6" />
              
              <div className="flex justify-between items-center mb-6">
                <span className="font-bold text-foreground">Total estimé</span>
                <span className="text-xl font-bold text-accent">{cart.totalAmount.toLocaleString()} FCFA</span>
              </div>
              
              {user ? (
                <Button 
                  className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-12"
                  onClick={() => setLocation("/checkout")}
                >
                  Passer la commande <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-center text-muted-foreground">Vous devez être connecté(e) pour commander.</p>
                  <Button 
                    className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-12"
                    onClick={() => setLocation("/auth/login?redirect=/checkout")}
                  >
                    <Lock className="mr-2 h-4 w-4" />
                    Se connecter pour commander
                  </Button>
                  <Link href="/auth/register" className="block text-center text-sm text-primary hover:underline">
                    Pas encore de compte ? S'inscrire
                  </Link>
                </div>
              )}
              
              <div className="mt-4 flex justify-center">
                <Link href="/products" className="text-sm text-primary hover:underline font-medium">
                  Continuer vos achats
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
      {showDeleteConfirm && productToDelete && (
        <DeleteConfirm
          title="Supprimer le produit"
          message={`Êtes‑vous sûr de vouloir supprimer ${productToDelete.product.name} ?`}
          onClose={() => setShowDeleteConfirm(false)}
          onConfirm={confirmDelete}
        />
      )}
      </Layout>
    );
  
}
