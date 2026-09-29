import React from "react";
import { Link } from "wouter";
import { Product } from "@workspace/api-client-react";
import { useCartContext } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { StarRating } from "./star-rating";
import { Button } from "./button";
import { ShoppingCart, Eye } from "lucide-react";
import { Badge } from "./badge";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface ProductCardProps {
  product: Product;
  className?: string;
}

export function ProductCard({ product, className }: ProductCardProps) {
  const { addItem } = useCartContext();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast({
        title: "Connexion requise",
        description: "Veuillez vous connecter pour ajouter des produits au panier.",
        variant: "destructive"
      });
      setLocation("/auth/login");
      return;
    }
    addItem(product.id, 1);
    toast({ title: "Produit ajouté au panier" });
  };

  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;
  const hasDiscount = product.discountPrice && product.discountPrice < product.price;
  const discountPct = hasDiscount
    ? Math.round(((product.price - (product.discountPrice ?? 0)) / product.price) * 100)
    : 0;

  const isExample = product.id.startsWith("example-");

  const CardContent = (
    <motion.div
      whileHover={{ y: -2 }}
      className={cn(
        "group relative flex flex-col bg-card dark:bg-gray-800 rounded-2xl border border-border overflow-hidden shadow-sm hover:shadow",
        className
      )}
    >
      {/* Badges */}
      <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
        {hasDiscount && (
          <Badge className="bg-[#E87C2A] hover:bg-[#D06820] text-white font-bold text-[10px] px-2">
            -{discountPct}%
          </Badge>
        )}
        {isOutOfStock ? (
          <Badge variant="destructive" className="font-semibold text-[10px]">
            Rupture
          </Badge>
        ) : isLowStock ? (
          <Badge className="bg-amber-500 hover:bg-amber-600 text-white font-semibold text-[10px]">
            Stock Limité
          </Badge>
        ) : null}
        {product.featured && !hasDiscount && (
          <Badge className="bg-[#4BB5E8] hover:bg-[#3A9FD4] text-white font-semibold text-[10px]">
            Nouveau
          </Badge>
        )}
      </div>

      {/* Image */}
      <div className="relative aspect-square bg-gray-50 overflow-hidden flex items-center justify-center p-6">
        <img
          src={product.images?.[0] || product.imageUrl || "/images/smartwatch.png"}
          alt={product.name}
          className="object-contain w-full h-full mix-blend-multiply transition-transform duration-500 group-hover:scale-110"
          onError={(e) => { e.currentTarget.src = "/images/smartwatch.png"; }}
        />
        {/* Quick action overlay (desktop/hover) */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-end justify-center pb-4 opacity-0 group-hover:opacity-100">
          <motion.div initial={{ y: 10, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} className="flex gap-2">
            <Button
              size="sm"
              className="bg-[#E87C2A] hover:bg-[#D06820] text-white shadow-lg font-semibold text-xs px-2.5 md:px-3"
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              title="Ajouter au panier"
            >
              <ShoppingCart className="h-3.5 w-3.5" />
              <span className="hidden md:inline ml-1.5">Ajouter</span>
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="bg-white dark:bg-gray-800 dark:text-white text-[#111827] hover:bg-gray-100 dark:hover:bg-gray-700 shadow-lg text-xs px-2.5 md:px-3"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setLocation(`/products/${product.id}`);
              }}
              title="Voir le produit"
            >
              <Eye className="h-3.5 w-3.5" />
              <span className="hidden md:inline ml-1.5">Voir</span>
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <p className="text-[10px] text-[#4BB5E8] font-semibold uppercase tracking-wider mb-1">
          {product.category}
        </p>
        <h3 className="font-semibold text-sm text-foreground dark:text-white line-clamp-2 mb-2 group-hover:text-primary transition-colors leading-snug">
          {product.name}
        </h3>
        <div className="mt-auto pt-2">
          <StarRating rating={product.rating} count={product.reviewCount} className="mb-3" />
          <div className="flex items-center justify-between gap-1.5 sm:gap-2">
            <div className="min-w-0 pr-1">
              {hasDiscount ? (
                <div>
                  <span className="text-[10px] sm:text-[11px] text-muted-foreground line-through block leading-tight">
                    {product.price.toLocaleString()} FCFA
                  </span>
                  <span className="text-sm sm:text-base font-bold text-[#E87C2A] leading-tight">
                    {product.discountPrice?.toLocaleString()} FCFA
                  </span>
                </div>
              ) : (
                <span className="text-sm sm:text-base font-bold text-foreground leading-tight">
                  {product.price.toLocaleString()} FCFA
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {/* Bouton Voir: Icône seule sur mobile, Icône + Texte sur tablette et PC */}
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-8 w-8 md:h-8 md:w-auto p-0 md:px-2.5 rounded-full md:rounded-lg border-border/80 bg-background/80 hover:bg-muted text-foreground transition-all duration-200 shadow-xs flex items-center justify-center active:scale-95"
                title="Voir le produit"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setLocation(`/products/${product.id}`);
                }}
              >
                <Eye className="h-3.5 w-3.5 md:h-4 md:w-4 text-muted-foreground group-hover:text-foreground" />
                <span className="hidden md:inline text-xs font-medium ml-1.5">Voir</span>
              </Button>

              {/* Bouton Panier: Icône seule sur mobile, Icône + Texte sur tablette et PC */}
              <Button
                type="button"
                size="sm"
                className="h-8 w-8 md:h-8 md:w-auto p-0 md:px-3 rounded-full md:rounded-lg bg-[#E87C2A] hover:bg-[#D06820] text-white transition-all duration-200 shadow-sm flex items-center justify-center font-medium active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                title="Ajouter au panier"
                onClick={handleAddToCart}
                disabled={isOutOfStock}
              >
                <ShoppingCart className="h-3.5 w-3.5 md:h-4 md:w-4" />
                <span className="hidden md:inline text-xs font-semibold ml-1.5">Ajouter</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );

  return (
    <Link href={`/products/${product.id}`} className="block">
      {CardContent}
    </Link>
  );
}
