import React from "react";
import { Link } from "wouter";
import { Product } from "@workspace/api-client-react";
import { useCartContext } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { StarRating } from "./star-rating";
import { Button } from "./button";
import { ShoppingCart, Eye, Play } from "lucide-react";
import { Badge } from "./badge";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { resolveMediaUrl } from "@/lib/videoUtils";

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
  const videoRaw = (product as any).video as string | undefined;
  const imageRaw = product.images?.[0] || product.imageUrl;

  // Extraction automatique de la miniature YouTube si aucune image n'est renseignée
  const youtubeThumbnail = React.useMemo(() => {
    if (!videoRaw) return null;
    const ytMatch = videoRaw.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([^"&?\/\s]{11})/i);
    if (ytMatch && ytMatch[1]) {
      return `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`;
    }
    return null;
  }, [videoRaw]);

  const displayImage = imageRaw ? resolveMediaUrl(imageRaw) : (youtubeThumbnail || null);

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
        {videoRaw && (
          <Badge className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-[10px] px-2 flex items-center gap-1 shadow-sm">
            <Play className="w-2.5 h-2.5 fill-white" /> Vidéo
          </Badge>
        )}
      </div>

      {/* Image / Video thumbnail */}
      <div className="relative aspect-square bg-gray-50 dark:bg-gray-900/50 overflow-hidden flex items-center justify-center p-4">
        {videoRaw && !displayImage ? (
          <div className="w-full h-full flex flex-col items-center justify-center bg-muted/40 rounded-xl text-orange-500 relative group-hover:scale-105 transition-transform duration-300">
            <div className="w-12 h-12 rounded-full bg-orange-500 text-white flex items-center justify-center shadow-lg shadow-orange-500/30">
              <Play className="w-5 h-5 fill-white ml-0.5" />
            </div>
            <span className="text-[11px] font-bold text-foreground mt-2">Voir la vidéo</span>
          </div>
        ) : (
          <div className="relative w-full h-full flex items-center justify-center">
            <img
              src={displayImage || "/images/smartwatch.png"}
              alt={product.name}
              className="object-contain w-full h-full mix-blend-multiply dark:mix-blend-normal transition-transform duration-500 group-hover:scale-110"
              onError={(e) => { e.currentTarget.src = "/images/smartwatch.png"; }}
            />
            {videoRaw && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-xs text-white flex items-center justify-center shadow-md opacity-85 group-hover:opacity-100 group-hover:scale-110 transition-all">
                  <Play className="w-4 h-4 fill-white ml-0.5" />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Quick action overlay (desktop/hover) */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-end justify-center pb-4 opacity-0 group-hover:opacity-100">
          <motion.div initial={{ y: 10, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} className="flex gap-2">
            <Button
              size="icon"
              className="h-9 w-9 rounded-full bg-[#E87C2A] hover:bg-[#D06820] text-white shadow-lg active:scale-95 transition-all"
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              title="Ajouter au panier"
              aria-label="Ajouter au panier"
            >
              <ShoppingCart className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="secondary"
              className="h-9 w-9 rounded-full bg-white dark:bg-gray-800 text-[#111827] dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 shadow-lg active:scale-95 transition-all"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setLocation(`/products/${product.id}`);
              }}
              title="Voir le produit"
              aria-label="Voir le produit"
            >
              <Eye className="h-4 w-4" />
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
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {/* Bouton Voir: Icône uniquement sur téléphone, tablette et PC */}
              <Button
                type="button"
                size="icon"
                variant="outline"
                className="h-8 w-8 sm:h-9 sm:w-9 p-0 rounded-full border-border/80 bg-background/80 hover:bg-muted text-foreground transition-all duration-200 shadow-xs flex items-center justify-center active:scale-95 shrink-0"
                title="Voir le produit"
                aria-label="Voir le produit"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setLocation(`/products/${product.id}`);
                }}
              >
                <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground group-hover:text-foreground" />
              </Button>

              {/* Bouton Panier: Icône uniquement sur téléphone, tablette et PC */}
              <Button
                type="button"
                size="icon"
                className="h-8 w-8 sm:h-9 sm:w-9 p-0 rounded-full bg-[#E87C2A] hover:bg-[#D06820] text-white transition-all duration-200 shadow-sm flex items-center justify-center active:scale-95 disabled:opacity-50 disabled:pointer-events-none shrink-0"
                title="Ajouter au panier"
                aria-label="Ajouter au panier"
                onClick={handleAddToCart}
                disabled={isOutOfStock}
              >
                <ShoppingCart className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
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
