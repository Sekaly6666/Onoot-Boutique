import React from "react";
import { Link } from "wouter";
import { Layout } from "@/components/layout/Layout";
import { ProductCard } from "@/components/ui/product-card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Truck, ShieldCheck, HeadphonesIcon } from "lucide-react";
import { 
  useGetFeaturedProducts, 
  useGetNewArrivals, 
  useGetBestSellers, 
  useGetOnSaleProducts 
} from "@workspace/api-client-react";

export default function Home() {
  const { data: featuredProducts, isLoading: isFeaturedLoading } = useGetFeaturedProducts();
  const { data: newArrivals, isLoading: isNewArrivalsLoading } = useGetNewArrivals();
  const { data: bestSellers, isLoading: isBestSellersLoading } = useGetBestSellers();
  const { data: onSaleProducts, isLoading: isOnSaleLoading } = useGetOnSaleProducts();

  const categories = [
    { name: "Montres Connectées", slug: "smartwatches", image: "/images/smartwatch.png", color: "bg-blue-50" },
    { name: "Écouteurs", slug: "earphones", image: "/images/earbuds.png", color: "bg-gray-100" },
    { name: "Coques", slug: "cases", image: "/images/case.png", color: "bg-stone-100" },
    { name: "Batteries", slug: "power-banks", image: "/images/powerbank.png", color: "bg-slate-100" },
    { name: "Chargeurs", slug: "chargers", image: "/images/charger.png", color: "bg-zinc-100" },
    { name: "Haut-parleurs", slug: "speakers", image: "/images/speaker.png", color: "bg-neutral-100" },
  ];

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative bg-[#111827] text-white overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="/images/hero-banner.png" 
            alt="Hero Background" 
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#111827] via-[#111827]/80 to-transparent"></div>
        </div>
        
        <div className="container mx-auto px-4 py-24 md:py-32 relative z-10">
          <div className="max-w-2xl">
            <span className="inline-block py-1 px-3 rounded-full bg-accent/20 text-accent text-sm font-semibold tracking-wider uppercase mb-6 border border-accent/30">
              Nouveauté
            </span>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              L'excellence tech, <br/>
              <span className="text-accent">livrée chez vous.</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-300 mb-8 max-w-lg">
              Découvrez notre sélection premium d'accessoires pour smartphones. Qualité garantie, paiement à la livraison, satisfaction totale.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/products">
                <Button size="lg" className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-white font-semibold">
                  Acheter maintenant <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/products?onSale=true">
                <Button size="lg" variant="outline" className="w-full sm:w-auto text-white border-gray-600 hover:bg-gray-800">
                  Voir les promotions
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-white border-b border-border">
        <div className="container mx-auto px-4 py-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 divide-y md:divide-y-0 md:divide-x divide-border">
            <div className="flex items-center gap-4 pt-4 md:pt-0 px-4">
              <div className="bg-primary/10 p-3 rounded-full text-primary">
                <Truck className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Livraison Rapide</h3>
                <p className="text-sm text-muted-foreground">Partout en Côte d'Ivoire</p>
              </div>
            </div>
            <div className="flex items-center gap-4 pt-4 md:pt-0 px-4">
              <div className="bg-primary/10 p-3 rounded-full text-primary">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Garantie Qualité</h3>
                <p className="text-sm text-muted-foreground">Produits 100% originaux</p>
              </div>
            </div>
            <div className="flex items-center gap-4 pt-4 md:pt-0 px-4">
              <div className="bg-primary/10 p-3 rounded-full text-primary">
                <HeadphonesIcon className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Service Client</h3>
                <p className="text-sm text-muted-foreground">Assistance 7j/7</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">Catégories</h2>
              <p className="text-muted-foreground mt-2">Trouvez l'accessoire parfait</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((category) => (
              <Link key={category.slug} href={`/products?category=${category.slug}`}>
                <div className="group cursor-pointer bg-white rounded-xl p-4 text-center border border-border hover:border-primary/50 hover:shadow-md transition-all">
                  <div className={`w-20 h-20 mx-auto rounded-full ${category.color} flex items-center justify-center p-3 mb-4 group-hover:scale-110 transition-transform`}>
                    <img src={category.image} alt={category.name} className="object-contain mix-blend-multiply" />
                  </div>
                  <h3 className="font-medium text-sm text-foreground">{category.name}</h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">En Vedette</h2>
              <p className="text-muted-foreground mt-2">Notre sélection premium</p>
            </div>
            <Link href="/products?featured=true" className="text-primary font-medium hover:underline flex items-center">
              Voir tout <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
          
          {isFeaturedLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-80 bg-gray-100 animate-pulse rounded-xl"></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {featuredProducts?.slice(0, 4).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* New Arrivals & Best Sellers */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <div className="flex justify-between items-end mb-8">
                <h2 className="text-2xl font-bold text-foreground">Nouveautés</h2>
                <Link href="/products" className="text-primary font-medium hover:underline text-sm">
                  Voir tout
                </Link>
              </div>
              <div className="space-y-4">
                {isNewArrivalsLoading ? (
                  [...Array(3)].map((_, i) => <div key={i} className="h-24 bg-white border animate-pulse rounded-xl"></div>)
                ) : (
                  newArrivals?.slice(0, 3).map((product) => (
                    <Link key={product.id} href={`/products/${product.id}`}>
                      <div className="flex items-center p-3 bg-white border border-border rounded-xl hover:shadow-sm transition-all group">
                        <div className="w-20 h-20 bg-gray-50 rounded-lg p-2 flex-shrink-0">
                          <img src={product.images[0] || "/images/smartwatch.png"} alt={product.name} className="w-full h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform" />
                        </div>
                        <div className="ml-4 flex-1">
                          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{product.category}</p>
                          <h4 className="font-semibold text-sm line-clamp-1 group-hover:text-primary transition-colors">{product.name}</h4>
                          <div className="mt-2 flex items-center justify-between">
                            <span className="font-bold text-sm">{product.price.toLocaleString()} FCFA</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>

            <div>
              <div className="flex justify-between items-end mb-8">
                <h2 className="text-2xl font-bold text-foreground">Meilleures Ventes</h2>
                <Link href="/products?bestSeller=true" className="text-primary font-medium hover:underline text-sm">
                  Voir tout
                </Link>
              </div>
              <div className="space-y-4">
                {isBestSellersLoading ? (
                  [...Array(3)].map((_, i) => <div key={i} className="h-24 bg-white border animate-pulse rounded-xl"></div>)
                ) : (
                  bestSellers?.slice(0, 3).map((product) => (
                    <Link key={product.id} href={`/products/${product.id}`}>
                      <div className="flex items-center p-3 bg-white border border-border rounded-xl hover:shadow-sm transition-all group">
                        <div className="w-20 h-20 bg-gray-50 rounded-lg p-2 flex-shrink-0">
                          <img src={product.images[0] || "/images/smartwatch.png"} alt={product.name} className="w-full h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform" />
                        </div>
                        <div className="ml-4 flex-1">
                          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{product.category}</p>
                          <h4 className="font-semibold text-sm line-clamp-1 group-hover:text-primary transition-colors">{product.name}</h4>
                          <div className="mt-2 flex items-center justify-between">
                            <span className="font-bold text-sm">{product.price.toLocaleString()} FCFA</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
