import React, { useState } from "react";
import { useLocation } from "wouter";
import { Layout } from "@/components/layout/Layout";
import { ProductCard } from "@/components/ui/product-card";
import { useListProducts, getListProductsQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

export default function Products() {
  const [location] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  
  const [category, setCategory] = useState<string>(searchParams.get("category") || "");
  const [search, setSearch] = useState<string>(searchParams.get("search") || "");
  const [inStock, setInStock] = useState<boolean>(searchParams.get("inStock") === "true");
  const [sortBy, setSortBy] = useState<string>(searchParams.get("sortBy") || "createdAt:desc");
  
  // Price range slider state
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000]);

  const { data, isLoading } = useListProducts({
    category: category || undefined,
    search: search || undefined,
    inStock: inStock || undefined,
    sortBy,
    minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
    maxPrice: priceRange[1] < 100000 ? priceRange[1] : undefined,
  }, {
    query: {
      queryKey: getListProductsQueryKey({ category, search, inStock, sortBy, minPrice: priceRange[0], maxPrice: priceRange[1] }),
    }
  });

  const categories = [
    { value: "", label: "Toutes les catégories" },
    { value: "smartwatches", label: "Montres Connectées" },
    { value: "earphones", label: "Écouteurs" },
    { value: "cases", label: "Coques" },
    { value: "power-banks", label: "Batteries externes" },
    { value: "chargers", label: "Chargeurs" },
    { value: "speakers", label: "Haut-parleurs" },
  ];

  const clearFilters = () => {
    setCategory("");
    setSearch("");
    setInStock(false);
    setPriceRange([0, 100000]);
    setSortBy("createdAt:desc");
  };

  const FilterSidebar = () => (
    <div className="space-y-8">
      <div>
        <h3 className="font-semibold mb-4 text-foreground">Catégories</h3>
        <div className="space-y-2">
          {categories.map((c) => (
            <div key={c.value} className="flex items-center">
              <button
                className={`text-sm ${category === c.value ? 'text-primary font-medium' : 'text-muted-foreground hover:text-foreground'}`}
                onClick={() => setCategory(c.value)}
              >
                {c.label}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-4 text-foreground">Prix (FCFA)</h3>
        <Slider
          defaultValue={[0, 100000]}
          max={100000}
          step={1000}
          value={priceRange}
          onValueChange={(v) => setPriceRange(v as [number, number])}
          className="mb-4"
        />
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{priceRange[0].toLocaleString()}</span>
          <span>{priceRange[1] === 100000 ? "100.000+" : priceRange[1].toLocaleString()}</span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="in-stock" className="text-foreground">En stock uniquement</Label>
        <Switch
          id="in-stock"
          checked={inStock}
          onCheckedChange={setInStock}
        />
      </div>

      <Button variant="outline" className="w-full" onClick={clearFilters}>
        <X className="mr-2 h-4 w-4" /> Réinitialiser
      </Button>
    </div>
  );

  return (
    <Layout>
      <div className="bg-gray-50 py-8 border-b border-border">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold text-foreground">Catalogue</h1>
          <p className="text-muted-foreground mt-2">Découvrez nos produits premium</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Desktop Filters */}
          <aside className="hidden md:block w-64 flex-shrink-0">
            <FilterSidebar />
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            {/* Top Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Rechercher..."
                  className="pl-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-4 w-full sm:w-auto">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" className="md:hidden flex-1">
                      <SlidersHorizontal className="mr-2 h-4 w-4" /> Filtres
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left">
                    <SheetHeader>
                      <SheetTitle>Filtres</SheetTitle>
                    </SheetHeader>
                    <div className="py-6">
                      <FilterSidebar />
                    </div>
                  </SheetContent>
                </Sheet>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Trier par" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="createdAt:desc">Plus récents</SelectItem>
                    <SelectItem value="price:asc">Prix croissant</SelectItem>
                    <SelectItem value="price:desc">Prix décroissant</SelectItem>
                    <SelectItem value="rating:desc">Meilleures notes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Product Grid */}
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="h-80 bg-gray-100 animate-pulse rounded-xl"></div>
                ))}
              </div>
            ) : !Array.isArray(data?.products) || data?.products.length === 0 ? (
              <div className="text-center py-20 bg-gray-50 rounded-xl border border-dashed border-border">
                <div className="bg-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <Search className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Aucun produit trouvé</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Essayez de modifier vos filtres ou de chercher avec d'autres mots-clés.
                </p>
                <Button onClick={clearFilters}>Réinitialiser les filtres</Button>
              </div>
            ) : (
              <>
                <p className="text-sm text-muted-foreground mb-4">{data?.total || 0} produits trouvés</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {Array.isArray(data?.products) && data.products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
