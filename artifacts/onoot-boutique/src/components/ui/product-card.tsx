import React from "react";
import { Link } from "wouter";
import { Product } from "@workspace/api-client-react";
import { useCartContext } from "@/contexts/CartContext";
import { StarRating } from "./star-rating";
import { Button } from "./button";
import { ShoppingCart } from "lucide-react";
import { Badge } from "./badge";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  product: Product;
  className?: string;
}

export function ProductCard({ product, className }: ProductCardProps) {
  const { addItem } = useCartContext();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigating to product detail
    addItem(product.id, 1);
  };

  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;
  const hasDiscount = product.discountPrice && product.discountPrice < product.price;

  return (
    <Link href={`/products/${product.id}`}>
      <div className={cn(
        "group relative flex flex-col bg-card rounded-xl border border-border overflow-hidden transition-all duration-300 hover:shadow-md hover:-translate-y-1",
        className
      )}>
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
          {isOutOfStock ? (
            <Badge variant="destructive" className="font-semibold uppercase tracking-wider text-[10px]">Rupture</Badge>
          ) : isLowStock ? (
            <Badge className="bg-orange-500 hover:bg-orange-600 font-semibold uppercase tracking-wider text-[10px]">Stock Limité</Badge>
          ) : null}
          
          {hasDiscount && (
            <Badge className="bg-red-500 hover:bg-red-600 font-semibold uppercase tracking-wider text-[10px]">Promo</Badge>
          )}
          
          {product.featured && (
            <Badge className="bg-accent text-accent-foreground font-semibold uppercase tracking-wider text-[10px]">Nouveau</Badge>
          )}
        </div>

        {/* Image */}
        <div className="aspect-square bg-muted/30 overflow-hidden p-6 flex items-center justify-center">
          <img 
            src={product.images?.[0] || "/images/smartwatch.png"} 
            alt={product.name}
            className="object-contain w-full h-full mix-blend-multiply group-hover:scale-110 transition-transform duration-500"
          />
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col flex-1">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">{product.category}</p>
          <h3 className="font-semibold text-foreground line-clamp-2 mb-2 group-hover:text-primary transition-colors">
            {product.name}
          </h3>
          
          <div className="mt-auto pt-2">
            <StarRating rating={product.rating} count={product.reviewCount} className="mb-3" />
            
            <div className="flex items-end justify-between">
              <div>
                {hasDiscount ? (
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground line-through">{product.price.toLocaleString()} FCFA</span>
                    <span className="text-lg font-bold text-accent">{product.discountPrice?.toLocaleString()} FCFA</span>
                  </div>
                ) : (
                  <span className="text-lg font-bold text-foreground">{product.price.toLocaleString()} FCFA</span>
                )}
              </div>
              
              <Button 
                size="icon" 
                variant="secondary"
                className="h-10 w-10 rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors"
                onClick={handleAddToCart}
                disabled={isOutOfStock}
              >
                <ShoppingCart className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
