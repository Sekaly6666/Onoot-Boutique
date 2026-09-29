import React, { useState, useEffect, useMemo } from "react";
import { useLocation, Link } from "wouter";
import { Layout } from "@/components/layout/Layout";
import { ProductCard } from "@/components/ui/product-card";
import { useListProducts, useListCategories, getListProductsQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Search, 
  SlidersHorizontal, 
  X, 
  Flame, 
  Sparkles, 
  PackageCheck, 
  Tag, 
  Percent, 
  ChevronRight, 
  RotateCcw,
  Check
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

// Default placeholder products shown when the catalogue is empty
const exampleProducts = [
  { id: "example-1", name: "Smartwatch Pro S8", price: 45000, discountPrice: 38000, images: ["/images/smartwatch.png"], category: "smartwatches", stock: 10, rating: 4.5, reviewCount: 24, featured: true, bestSeller: true },
  { id: "example-2", name: "Écouteurs Bluetooth Pro ANC", price: 25000, discountPrice: 19000, images: ["/images/earbuds.png"], category: "earphones", stock: 15, rating: 4.2, reviewCount: 18, featured: false, onSale: true },
  { id: "example-3", name: "Coque Protection Premium Armor", price: 6000, discountPrice: 5000, images: ["/images/case.png"], category: "cases", stock: 30, rating: 4.0, reviewCount: 12, featured: false, onSale: true },
  { id: "example-4", name: "Batterie Externe 20000mAh Ultra", price: 22000, discountPrice: 18500, images: ["/images/powerbank.png"], category: "power-banks", stock: 8, rating: 4.7, reviewCount: 31, featured: true, bestSeller: true },
  { id: "example-5", name: "Chargeur Rapide 65W GaN", price: 14000, discountPrice: 12000, images: ["/images/charger.png"], category: "chargers", stock: 20, rating: 4.3, reviewCount: 9, featured: false, onSale: true },
  { id: "example-6", name: "Haut-parleur Bluetooth Portable Bass", price: 32000, discountPrice: 27000, images: ["/images/speaker.png"], category: "speakers", stock: 5, rating: 4.6, reviewCount: 41, featured: true, onSale: true },
  { id: "example-7", name: "Smartwatch Sport Ultra", price: 55000, discountPrice: null, images: ["/images/smartwatch.png"], category: "smartwatches", stock: 7, rating: 4.8, reviewCount: 56, featured: true, bestSeller: true },
  { id: "example-8", name: "Écouteurs ANC Pro", price: 35000, discountPrice: 29000, images: ["/images/earbuds.png"], category: "earphones", stock: 12, rating: 4.4, reviewCount: 27, featured: false, onSale: true },
];

const PRICE_PRESETS = [
  { label: "Tous", min: 0, max: 500000 },
  { label: "< 15 000 F", min: 0, max: 15000 },
  { label: "15 000 - 30 000 F", min: 15000, max: 30000 },
  { label: "30 000 - 60 000 F", min: 30000, max: 60000 },
  { label: "> 60 000 F", min: 60000, max: 500000 },
];

export default function Products() {
  const [location] = useLocation();

  // Helper to read current URL search query params
  const readQueryParams = () => {
    const sp = new URLSearchParams(window.location.search);
    return {
      category: sp.get("category") || "",
      search: sp.get("search") || "",
      inStock: sp.get("inStock") === "true",
      onSale: sp.get("onSale") === "true",
      bestSeller: sp.get("bestSeller") === "true",
      sortBy: sp.get("sortBy") || "createdAt_desc",
      minPrice: sp.get("minPrice") ? Number(sp.get("minPrice")) : 0,
      maxPrice: sp.get("maxPrice") ? Number(sp.get("maxPrice")) : 500000,
    };
  };

  const initial = readQueryParams();

  const [category, setCategory] = useState<string>(initial.category);
  const [search, setSearch] = useState<string>(initial.search);
  const [inStock, setInStock] = useState<boolean>(initial.inStock);
  const [onSale, setOnSale] = useState<boolean>(initial.onSale);
  const [bestSeller, setBestSeller] = useState<boolean>(initial.bestSeller);
  const [sortBy, setSortBy] = useState<string>(initial.sortBy);
  const [priceRange, setPriceRange] = useState<[number, number]>([initial.minPrice, initial.maxPrice]);
  const [minInput, setMinInput] = useState<string>(initial.minPrice > 0 ? String(initial.minPrice) : "");
  const [maxInput, setMaxInput] = useState<string>(initial.maxPrice < 500000 ? String(initial.maxPrice) : "");
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  // Sync state if URL changes (e.g. clicking banner "Profiter des offres" or browser back/forward)
  useEffect(() => {
    const params = readQueryParams();
    setCategory(params.category);
    setSearch(params.search);
    setInStock(params.inStock);
    setOnSale(params.onSale);
    setBestSeller(params.bestSeller);
    setSortBy(params.sortBy);
    setPriceRange([params.minPrice, params.maxPrice]);
    setMinInput(params.minPrice > 0 ? String(params.minPrice) : "");
    setMaxInput(params.maxPrice < 500000 ? String(params.maxPrice) : "");
  }, [location]);

  // Keep min/max text inputs synced with priceRange slider
  useEffect(() => {
    setMinInput(String(priceRange[0]));
    setMaxInput(String(priceRange[1]));
  }, [priceRange]);

  // Push state to URL query string smoothly
  const syncToUrl = (updates: Partial<{
    category: string;
    search: string;
    inStock: boolean;
    onSale: boolean;
    bestSeller: boolean;
    sortBy: string;
    minPrice: number;
    maxPrice: number;
  }>) => {
    const current = {
      category,
      search,
      inStock,
      onSale,
      bestSeller,
      sortBy,
      minPrice: priceRange[0],
      maxPrice: priceRange[1],
      ...updates,
    };

    const sp = new URLSearchParams();
    if (current.category) sp.set("category", current.category);
    if (current.search) sp.set("search", current.search);
    if (current.inStock) sp.set("inStock", "true");
    if (current.onSale) sp.set("onSale", "true");
    if (current.bestSeller) sp.set("bestSeller", "true");
    if (current.sortBy && current.sortBy !== "createdAt_desc") sp.set("sortBy", current.sortBy);
    if (current.minPrice > 0) sp.set("minPrice", String(current.minPrice));
    if (current.maxPrice < 500000) sp.set("maxPrice", String(current.maxPrice));

    const newQuery = sp.toString();
    const newUrl = `${window.location.pathname}${newQuery ? `?${newQuery}` : ""}`;
    window.history.replaceState(null, "", newUrl);
  };

  const handlePriceRangeChange = (val: [number, number]) => {
    setPriceRange(val);
    setMinInput(val[0] === 0 ? "" : String(val[0]));
    setMaxInput(val[1] >= 500000 ? "" : String(val[1]));
    syncToUrl({ minPrice: val[0], maxPrice: val[1] });
  };

  const applyManualPriceInputs = () => {
    const rawMin = minInput.trim() ? Number(minInput) : 0;
    const rawMax = maxInput.trim() ? Number(maxInput) : 500000;
    const min = isNaN(rawMin) || rawMin < 0 ? 0 : rawMin;
    const max = isNaN(rawMax) || rawMax <= 0 ? 500000 : Math.max(min, rawMax);
    setPriceRange([min, max]);
    syncToUrl({ minPrice: min, maxPrice: max });
  };

  // Backend API query
  const { data, isLoading } = useListProducts({
    category: category || undefined,
    search: search || undefined,
    inStock: inStock ? true : undefined,
    onSale: onSale ? true : undefined,
    bestSeller: bestSeller ? true : undefined,
    sortBy,
    minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
    maxPrice: priceRange[1] < 500000 ? priceRange[1] : undefined,
  }, {
    query: {
      queryKey: getListProductsQueryKey({ 
        category, 
        search, 
        inStock, 
        onSale, 
        bestSeller, 
        sortBy, 
        minPrice: priceRange[0], 
        maxPrice: priceRange[1] 
      }),
    }
  });

  const { data: categoriesRaw } = useListCategories();

  const fetchedCategories = Array.isArray(categoriesRaw) && categoriesRaw.length > 0
    ? categoriesRaw.map(c => ({ value: c.slug, label: c.name }))
    : [
        { value: "smartwatches", label: "Montres Connectées" },
        { value: "earphones", label: "Écouteurs" },
        { value: "cases", label: "Coques & Protections" },
        { value: "power-banks", label: "Batteries externes" },
        { value: "chargers", label: "Chargeurs & Câbles" },
        { value: "speakers", label: "Haut-parleurs" },
      ];

  const categories = [
    { value: "", label: "Toutes les catégories" },
    ...fetchedCategories
  ];

  const clearFilters = () => {
    setCategory("");
    setSearch("");
    setInStock(false);
    setOnSale(false);
    setBestSeller(false);
    setPriceRange([0, 500000]);
    setMinInput("");
    setMaxInput("");
    setSortBy("createdAt_desc");
    window.history.replaceState(null, "", window.location.pathname);
  };

  // Local fallback filtering and sorting if API returns 0 products or uses fallback
  const filteredExampleProducts = useMemo(() => {
    let list = [...exampleProducts];

    if (category) {
      list = list.filter(p => p.category.toLowerCase().includes(category.toLowerCase()));
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q) || (p as any).description?.toLowerCase().includes(q));
    }
    if (inStock) {
      list = list.filter(p => p.stock > 0);
    }
    if (onSale) {
      list = list.filter(p => (p.discountPrice && p.discountPrice < p.price) || (p as any).onSale);
    }
    if (bestSeller) {
      list = list.filter(p => p.bestSeller);
    }
    if (priceRange[0] > 0) {
      list = list.filter(p => (p.discountPrice ?? p.price) >= priceRange[0]);
    }
    if (priceRange[1] < 500000) {
      list = list.filter(p => (p.discountPrice ?? p.price) <= priceRange[1]);
    }

    // Sort
    if (sortBy === "price_asc" || sortBy === "price:asc") {
      list.sort((a, b) => (a.discountPrice ?? a.price) - (b.discountPrice ?? b.price));
    } else if (sortBy === "price_desc" || sortBy === "price:desc") {
      list.sort((a, b) => (b.discountPrice ?? b.price) - (a.discountPrice ?? a.price));
    } else if (sortBy === "rating_desc" || sortBy === "rating:desc") {
      list.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === "sales_desc" || sortBy === "sales:desc") {
      list.sort((a, b) => b.reviewCount - a.reviewCount);
    }

    return list;
  }, [category, search, inStock, onSale, bestSeller, priceRange, sortBy]);

  const displayedProducts = (Array.isArray(data?.products) && data?.products.length > 0)
    ? data.products
    : filteredExampleProducts;

  const totalCount = (Array.isArray(data?.products) && data?.products.length > 0)
    ? (data.total ?? data.products.length)
    : filteredExampleProducts.length;

  const activeFiltersCount = [
    Boolean(category),
    Boolean(search),
    Boolean(inStock),
    Boolean(onSale),
    Boolean(bestSeller),
    priceRange[0] > 0 || priceRange[1] < 500000,
  ].filter(Boolean).length;

  // Filter Sidebar Content (shared between desktop aside and mobile sheet)
  const FilterSidebar = () => (
    <div className="space-y-6">
      {/* Quick Promos & Stock Switches */}
      <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200/70 dark:border-slate-800 space-y-3.5">
        <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Avantages & Disponibilité
        </h3>
        
        {/* Toggle En Promotion */}
        <div className="flex items-center justify-between">
          <Label htmlFor="on-sale-toggle" className="text-sm font-semibold flex items-center gap-2 cursor-pointer text-slate-800 dark:text-slate-200">
            <span className="p-1 rounded-md bg-amber-500/10 text-amber-600">
              <Percent className="w-3.5 h-3.5" />
            </span>
            <span>En Promotion</span>
          </Label>
          <Switch
            id="on-sale-toggle"
            checked={onSale}
            onCheckedChange={(val) => {
              setOnSale(val);
              syncToUrl({ onSale: val });
            }}
          />
        </div>

        {/* Toggle En Stock */}
        <div className="flex items-center justify-between">
          <Label htmlFor="in-stock-toggle" className="text-sm font-semibold flex items-center gap-2 cursor-pointer text-slate-800 dark:text-slate-200">
            <span className="p-1 rounded-md bg-emerald-500/10 text-emerald-600">
              <PackageCheck className="w-3.5 h-3.5" />
            </span>
            <span>En stock uniquement</span>
          </Label>
          <Switch
            id="in-stock-toggle"
            checked={inStock}
            onCheckedChange={(val) => {
              setInStock(val);
              syncToUrl({ inStock: val });
            }}
          />
        </div>

        {/* Toggle Meilleures Ventes */}
        <div className="flex items-center justify-between">
          <Label htmlFor="bestseller-toggle" className="text-sm font-semibold flex items-center gap-2 cursor-pointer text-slate-800 dark:text-slate-200">
            <span className="p-1 rounded-md bg-orange-500/10 text-orange-600">
              <Flame className="w-3.5 h-3.5" />
            </span>
            <span>Top Ventes</span>
          </Label>
          <Switch
            id="bestseller-toggle"
            checked={bestSeller}
            onCheckedChange={(val) => {
              setBestSeller(val);
              syncToUrl({ bestSeller: val });
            }}
          />
        </div>
      </div>

      {/* Categories */}
      <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200/70 dark:border-slate-800">
        <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
          Catégories
        </h3>
        <div className="space-y-1">
          {categories.map((c) => {
            const isSelected = category === c.value;
            return (
              <button
                key={c.value}
                onClick={() => {
                  setCategory(c.value);
                  syncToUrl({ category: c.value });
                  setIsMobileFiltersOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  isSelected
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800"
                }`}
              >
                <span className="truncate">{c.label}</span>
                {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Prix (FCFA) - Simple, rapide et facile */}
      <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200/70 dark:border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Prix (FCFA)
          </h3>
          {(priceRange[0] > 0 || priceRange[1] < 500000) && (
            <button
              type="button"
              onClick={() => handlePriceRangeChange([0, 500000])}
              className="text-[11px] text-primary hover:underline font-semibold"
            >
              Réinitialiser
            </button>
          )}
        </div>

        {/* Saisie Min (F) - Max (F) */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Min (FCFA)</span>
            <input
              type="number"
              min={0}
              step={1000}
              placeholder="0"
              value={minInput}
              onChange={(e) => setMinInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && applyManualPriceInputs()}
              className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-xs"
            />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Max (FCFA)</span>
            <input
              type="number"
              min={0}
              step={1000}
              placeholder="Ex: 50 000"
              value={maxInput}
              onChange={(e) => setMaxInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && applyManualPriceInputs()}
              className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-xs"
            />
          </div>
        </div>

        {/* Bouton Appliquer */}
        <Button
          type="button"
          size="sm"
          onClick={applyManualPriceInputs}
          className="w-full h-9 text-xs font-bold rounded-xl bg-primary hover:bg-primary/90 text-white shadow-xs"
        >
          Appliquer le prix
        </Button>

        {/* Raccourcis budget 1-clic */}
        <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 flex flex-wrap gap-1.5">
          <span className="text-[10px] text-slate-400 font-medium block w-full mb-0.5">Budget rapide :</span>
          {PRICE_PRESETS.map((preset) => {
            const isPresetActive = priceRange[0] === preset.min && priceRange[1] === preset.max;
            return (
              <button
                key={preset.label}
                type="button"
                onClick={() => handlePriceRangeChange([preset.min, preset.max])}
                className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all text-center border ${
                  isPresetActive
                    ? "bg-primary text-white border-primary shadow-xs"
                    : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-primary/40"
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Clear Filters Button */}
      {activeFiltersCount > 0 && (
        <Button 
          variant="outline" 
          className="w-full rounded-xl border-dashed border-slate-300 hover:border-red-400 hover:text-red-600 hover:bg-red-50/50" 
          onClick={clearFilters}
        >
          <RotateCcw className="mr-2 h-4 w-4" /> Réinitialiser tous les filtres
        </Button>
      )}
    </div>
  );

  return (
    <Layout>
      {/* Banner Titre + Breadcrumbs */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 text-white py-8 border-b border-slate-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#4BB5E8_1px,transparent_1px)] [background-size:16px_16px] opacity-15" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-2 font-medium">
            <Link href="/" className="hover:text-[#4BB5E8] transition-colors">Accueil</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-white font-semibold">Catalogue</span>
            {category && (
              <>
                <ChevronRight className="w-3.5 h-3.5" />
                <span className="text-[#F5C430] font-semibold capitalize">
                  {categories.find(c => c.value === category)?.label || category}
                </span>
              </>
            )}
            {onSale && (
              <span className="ml-2 bg-gradient-to-r from-amber-500 to-[#E87C2A] text-white px-2 py-0.5 rounded-full text-[10px] font-bold">
                Offres & Promotions
              </span>
            )}
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Catalogue Onoot Boutique
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
                Explorez nos montres connectées, écouteurs sans fil, coques et accessoires high-tech 100% originaux.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[#F5C430]">
                {totalCount} {totalCount > 1 ? "produits disponibles" : "produit disponible"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 sm:py-8">
        {/* Horizontal Quick Category Chips (Style Jumia / E-commerce Moderne) */}
        <div className="relative mb-6">
          <div 
            className="flex items-center gap-2 overflow-x-auto py-1 px-0.5 scrollbar-none scroll-smooth touch-pan-x"
            style={{
              scrollbarWidth: "none",
              msOverflowStyle: "none",
              WebkitOverflowScrolling: "touch",
            }}
          >
            {categories.map((c) => {
              const isSelected = category === c.value;
              return (
                <button
                  key={c.value}
                  onClick={() => {
                    setCategory(c.value);
                    syncToUrl({ category: c.value });
                  }}
                  className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border whitespace-nowrap active:scale-95 ${
                    isSelected
                      ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-sm"
                      : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-primary/50 hover:bg-slate-50"
                  }`}
                >
                  {c.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Desktop Filters Sidebar */}
          <aside className="hidden lg:block w-72 flex-shrink-0">
            <div className="sticky top-24">
              <FilterSidebar />
            </div>
          </aside>

          {/* Main Product Area */}
          <div className="flex-1 min-w-0">
            {/* Top Toolbar (Recherche, Filtres Mobiles, Tri, Badges Actifs) */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs mb-6 space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
                {/* Search Bar */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    type="search"
                    placeholder="Rechercher par nom, marque, modèle..."
                    className="pl-9 pr-4 rounded-xl border-slate-200 dark:border-slate-700 focus:ring-primary/30"
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      syncToUrl({ search: e.target.value });
                    }}
                  />
                  {search && (
                    <button
                      onClick={() => {
                        setSearch("");
                        syncToUrl({ search: "" });
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2.5">
                  {/* Mobile Filters Trigger */}
                  <Sheet open={isMobileFiltersOpen} onOpenChange={setIsMobileFiltersOpen}>
                    <SheetTrigger asChild>
                      <Button variant="outline" className="lg:hidden flex-1 sm:flex-none rounded-xl font-bold text-xs gap-2 relative">
                        <SlidersHorizontal className="h-4 w-4 text-primary" />
                        <span>Filtres</span>
                        {activeFiltersCount > 0 && (
                          <span className="w-5 h-5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">
                            {activeFiltersCount}
                          </span>
                        )}
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="dark:bg-slate-950 w-80 sm:w-96 overflow-y-auto">
                      <SheetHeader className="mb-4">
                        <SheetTitle className="text-lg font-bold flex items-center gap-2">
                          <SlidersHorizontal className="w-5 h-5 text-primary" />
                          <span>Filtres Catalogue</span>
                        </SheetTitle>
                      </SheetHeader>
                      <div className="py-2">
                        <FilterSidebar />
                      </div>
                      <div className="pt-6 border-t mt-6">
                        <Button 
                          onClick={() => setIsMobileFiltersOpen(false)} 
                          className="w-full rounded-xl font-bold bg-primary hover:bg-primary/90 text-white shadow-md"
                        >
                          Afficher les résultats ({totalCount})
                        </Button>
                      </div>
                    </SheetContent>
                  </Sheet>

                  {/* Tri / Sorting Dropdown */}
                  <div className="w-full sm:w-60">
                    <Select 
                      value={sortBy} 
                      onValueChange={(val) => {
                        setSortBy(val);
                        syncToUrl({ sortBy: val });
                      }}
                    >
                      <SelectTrigger className="w-full rounded-xl border-slate-200 dark:border-slate-700 font-semibold text-xs text-slate-700 dark:text-slate-200">
                        <SelectValue placeholder="Trier par..." />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="price_asc" className="text-xs font-medium">Prix croissant (Moins cher d'abord)</SelectItem>
                        <SelectItem value="price_desc" className="text-xs font-medium">Prix décroissant (Plus cher d'abord)</SelectItem>
                        <SelectItem value="createdAt_desc" className="text-xs font-medium">Nouveautés (Plus récents)</SelectItem>
                        <SelectItem value="rating_desc" className="text-xs font-medium">Meilleures notes clients</SelectItem>
                        <SelectItem value="sales_desc" className="text-xs font-medium">Plus populaires (Top ventes)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Active Filter Pills (chips) */}
              {activeFiltersCount > 0 && (
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <span className="text-slate-400 font-bold uppercase text-[10px]">Filtres actifs :</span>
                  
                  {category && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary font-semibold border border-primary/20">
                      <span>{categories.find(c => c.value === category)?.label || category}</span>
                      <button onClick={() => { setCategory(""); syncToUrl({ category: "" }); }}>
                        <X className="w-3 h-3 hover:scale-125 transition-transform" />
                      </button>
                    </span>
                  )}

                  {onSale && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-700 font-semibold border border-amber-300">
                      <span>Promotions</span>
                      <button onClick={() => { setOnSale(false); syncToUrl({ onSale: false }); }}>
                        <X className="w-3 h-3 hover:scale-125 transition-transform" />
                      </button>
                    </span>
                  )}

                  {inStock && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 font-semibold border border-emerald-300">
                      <span>En stock</span>
                      <button onClick={() => { setInStock(false); syncToUrl({ inStock: false }); }}>
                        <X className="w-3 h-3 hover:scale-125 transition-transform" />
                      </button>
                    </span>
                  )}

                  {bestSeller && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-500/10 text-orange-700 font-semibold border border-orange-300">
                      <span>Top ventes</span>
                      <button onClick={() => { setBestSeller(false); syncToUrl({ bestSeller: false }); }}>
                        <X className="w-3 h-3 hover:scale-125 transition-transform" />
                      </button>
                    </span>
                  )}

                  {(priceRange[0] > 0 || priceRange[1] < 100000) && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold border border-slate-300 dark:border-slate-700">
                      <span>{priceRange[0].toLocaleString()} - {priceRange[1] >= 100000 ? "100.000+" : priceRange[1].toLocaleString()} F</span>
                      <button onClick={() => handlePriceRangeChange([0, 100000])}>
                        <X className="w-3 h-3 hover:scale-125 transition-transform" />
                      </button>
                    </span>
                  )}

                  <button
                    onClick={clearFilters}
                    className="text-red-600 hover:text-red-700 text-xs font-bold underline ml-auto"
                  >
                    Effacer tout
                  </button>
                </div>
              )}
            </div>

            {/* Product Grid */}
            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="h-80 bg-slate-100 dark:bg-slate-800/50 animate-pulse rounded-2xl border border-slate-200/50" />
                ))}
              </div>
            ) : displayedProducts.length === 0 ? (
              // Empty State
              <div className="text-center py-16 sm:py-24 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 p-8 shadow-xs">
                <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
                  <Search className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
                  Aucun produit ne correspond à vos filtres
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-md mx-auto leading-relaxed">
                  Essayez d'élargir la tranche de prix, de décocher les options ou de réinitialiser vos critères de recherche.
                </p>
                <Button 
                  onClick={clearFilters} 
                  className="rounded-xl px-6 font-bold shadow-md bg-primary hover:bg-primary/90 text-white"
                >
                  <RotateCcw className="mr-2 h-4 w-4" /> Réinitialiser tous les filtres
                </Button>
              </div>
            ) : (
              // Grid with products
              <>
                <div className="flex items-center justify-between mb-4 px-1">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    {displayedProducts.length} {displayedProducts.length > 1 ? "articles trouvés" : "article trouvé"}
                  </p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                  {displayedProducts.map((product) => (
                    <ProductCard key={product.id} product={product as any} />
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
