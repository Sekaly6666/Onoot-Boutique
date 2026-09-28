import React, { useState, useEffect, useMemo, useRef } from "react";
import { Link } from "wouter";
import { Layout } from "@/components/layout/Layout";
import { ProductCard } from "@/components/ui/product-card";
import { Button } from "@/components/ui/button";
import { Marquee } from "@/components/ui/marquee";
import { VideoShowcase } from "@/components/ui/VideoShowcase";
import { ArrowRight, ShoppingCart, ShieldCheck, Truck, Clock, Sparkles, Flame, Rocket, Gift, HeadphonesIcon, ChevronLeft, ChevronRight, Zap, Star } from "lucide-react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import {
  useGetFeaturedProducts,
  useGetNewArrivals,
  useGetBestSellers,
  useGetOnSaleProducts,
  useListCategories,
} from "@workspace/api-client-react";
const exampleProducts = [
  {
    id: "example-1",
    name: "Smartwatch Pro S8",
    price: 45000,
    discountPrice: 38000,
    images: ["/images/smartwatch.png"],
    category: "Montres Connectées",
    stock: 10,
    rating: 4.5,
    reviewCount: 24,
    featured: true,
  },
  {
    id: "example-2",
    name: "Écouteurs Bluetooth Sans Fil",
    price: 18000,
    discountPrice: null,
    images: ["/images/earbuds.png"],
    category: "Écouteurs",
    stock: 15,
    rating: 4.2,
    reviewCount: 18,
    featured: false,
  },
  {
    id: "example-3",
    name: "Coque Protection Premium",
    price: 5000,
    discountPrice: null,
    images: ["/images/case.png"],
    category: "Coques",
    stock: 30,
    rating: 4.0,
    reviewCount: 12,
    featured: false,
  },
  {
    id: "example-4",
    name: "Batterie Externe 20000mAh",
    price: 25000,
    discountPrice: 22000,
    images: ["/images/powerbank.png"],
    category: "Batteries",
    stock: 8,
    rating: 4.7,
    reviewCount: 31,
    featured: true,
  },
];
/* ─── Hero Carousel ─── */
const heroSlides = [
  {
    id: 0,
    bg: "from-[#0f172a] to-[#1e293b]",
    badgeText: "NOUVEAUTÉ",
    badgeIcon: Zap,
    badgeColor: "bg-[#F5C430]/20 text-[#F5C430] border-[#F5C430]/30",
    title: "L'excellence tech,",
    highlight: "livrée chez vous.",
    highlightColor: "text-[#F5C430]",
    desc: "Découvrez notre sélection premium d'accessoires pour smartphones. Qualité garantie, paiement à la livraison.",
    cta: "Acheter maintenant",
    ctaLink: "/products",
    cta2: "Voir les promotions",
    cta2Link: "/products?onSale=true",
    image: "/images/smartwatch.png",
    imageBg: "bg-[#4BB5E8]/10",
  },
  {
    id: 1,
    bg: "from-[#7c2d12] to-[#9a3412]",
    badgeText: "FLASH SALE",
    badgeIcon: Flame,
    badgeColor: "bg-white/20 text-white border-white/30",
    title: "Flash Sale",
    highlight: "jusqu'à -40% !",
    highlightColor: "text-[#F5C430]",
    desc: "Offres limitées sur les meilleures marques. Dépêchez-vous, les stocks s'épuisent vite !",
    cta: "Profiter des offres",
    ctaLink: "/products?onSale=true",
    cta2: "Voir le catalogue",
    cta2Link: "/products",
    image: "/images/earbuds.png",
    imageBg: "bg-white/10",
  },
  {
    id: 2,
    bg: "from-[#0c4a6e] to-[#0369a1]",
    badgeText: "NOUVEAUX ARRIVAGES",
    badgeIcon: Sparkles,
    badgeColor: "bg-white/20 text-white border-white/30",
    title: "Découvrez les",
    highlight: "dernières tendances.",
    highlightColor: "text-[#F5C430]",
    desc: "Smartphones, montres connectées, écouteurs... Restez à la pointe de la technologie avec Onoot Boutique.",
    cta: "Explorer maintenant",
    ctaLink: "/products",
    cta2: "Nos catégories",
    cta2Link: "/products",
    image: "/images/speaker.png",
    imageBg: "bg-white/10",
  },
];

function HeroCarousel() {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);

  useEffect(() => {
    const timer = setInterval(() => {
      setDirection(1);
      setCurrent((c) => (c + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const go = (idx: number) => {
    setDirection(idx > current ? 1 : -1);
    setCurrent(idx);
  };

  const slide = heroSlides[current];

  return (
    <section className="relative overflow-hidden" style={{ minHeight: 480 }}>
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={current}
          custom={direction}
          initial={{ x: direction * 80, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -direction * 80, opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className={`absolute inset-0 bg-gradient-to-r ${slide.bg}`}
        />
      </AnimatePresence>

      <div className="relative z-10 container mx-auto px-4 py-20 md:py-28 flex items-center">
        <div className="flex-1 text-white max-w-2xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={`content-${current}`}
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <span className={`inline-flex items-center py-1 px-3 rounded-full text-sm font-semibold tracking-wider uppercase mb-6 border ${slide.badgeColor}`}>
                <slide.badgeIcon className="h-4 w-4 mr-1.5" />
                {slide.badgeText}
              </span>
              <h1 className="text-4xl md:text-6xl font-bold mb-4 leading-tight">
                {slide.title} <br />
                <span className={slide.highlightColor}>{slide.highlight}</span>
              </h1>
              <p className="text-lg text-white/80 mb-8 max-w-lg">{slide.desc}</p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="w-full sm:w-auto bg-[#E87C2A] hover:bg-[#D06820] text-white font-semibold shadow-lg shadow-[#E87C2A]/30" asChild>
                  <Link href={slide.ctaLink}>
                    {slide.cta} <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="w-full sm:w-auto text-white border-white/40 hover:bg-white/10" asChild>
                  <Link href={slide.cta2Link}>
                    {slide.cta2}
                  </Link>
                </Button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={`img-${current}`}
            initial={{ scale: 0.8, opacity: 0, rotate: -5 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.5 }}
            className={`hidden md:flex flex-1 items-center justify-center`}
          >
            <div className={`w-72 h-72 rounded-full ${slide.imageBg} flex items-center justify-center p-8 backdrop-blur-sm`}>
              <img src={slide.image} alt="" className="w-full h-full object-contain drop-shadow-2xl" />
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Arrows */}
      <button
        onClick={() => go((current - 1 + heroSlides.length) % heroSlides.length)}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-white/10 hover:bg-white/20 text-white rounded-full p-2 backdrop-blur-sm transition"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>
      <button
        onClick={() => go((current + 1) % heroSlides.length)}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-white/10 hover:bg-white/20 text-white rounded-full p-2 backdrop-blur-sm transition"
      >
        <ChevronRight className="h-6 w-6" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex gap-2">
        {heroSlides.map((_, i) => (
          <button
            key={i}
            onClick={() => go(i)}
            className={`rounded-full transition-all duration-300 ${i === current ? "bg-[#F5C430] w-6 h-2" : "bg-white/40 w-2 h-2"}`}
          />
        ))}
      </div>
    </section>
  );
}

/* ─── Countdown ─── */
function useCountdown(targetDate: Date) {
  const calc = () => {
    const diff = targetDate.getTime() - Date.now();
    if (diff <= 0) return { h: 0, m: 0, s: 0 };
    const s = Math.floor(diff / 1000) % 60;
    const m = Math.floor(diff / 60000) % 60;
    const h = Math.floor(diff / 3600000);
    return { h, m, s };
  };
  const [time, setTime] = useState(calc);
  useEffect(() => {
    const t = setInterval(() => setTime(calc()), 1000);
    return () => clearInterval(t);
  }, []);
  return time;
}

function FlashSaleSection({ products }: { products: any[] }) {
  const target = useMemo(() => {
    const datedProducts = products
      .map((product) => product.flashSaleEndDate ? new Date(product.flashSaleEndDate) : null)
      .filter((date): date is Date => Boolean(date) && !Number.isNaN(date.getTime()) && date.getTime() > Date.now())
      .sort((a, b) => a.getTime() - b.getTime());
    if (datedProducts[0]) return datedProducts[0];
    const fallback = new Date();
    fallback.setHours(23, 59, 59, 0);
    return fallback;
  }, [products]);
  const { h, m, s } = useCountdown(target);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <motion.section
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6 }}
      className="py-12 bg-gradient-to-r from-[#7c2d12] to-[#E87C2A]"
    >
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div className="flex items-center gap-3 text-white">
            <Zap className="h-8 w-8 fill-[#F5C430] text-[#F5C430] animate-pulse" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest opacity-80">Offres du jour</p>
              <h2 className="text-2xl md:text-3xl font-bold">Flash Sale</h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-white/80 text-sm mr-2">Se termine dans :</span>
            {[{ label: "H", val: h }, { label: "M", val: m }, { label: "S", val: s }].map(({ label, val }, i) => (
              <React.Fragment key={label}>
                <div className="bg-[#111827] text-white rounded-lg w-14 h-14 flex flex-col items-center justify-center shadow-lg">
                  <span className="text-xl font-bold tabular-nums">{pad(val)}</span>
                  <span className="text-[10px] text-gray-400 uppercase">{label}</span>
                </div>
                {i < 2 && <span className="text-white font-bold text-xl animate-pulse">:</span>}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.isArray(products) && products.slice(0, 4).map((product, i) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: i * 0.1 }}
            >
              <ProductCard product={product} className="bg-white" />
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}

/* ─── Animated Section Wrapper ─── */
function FadeInSection({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay }}
    >
      {children}
    </motion.div>
  );
}

/* ─── Promo Marquee ─── */
function PromoMarquee() {
  return (
    <div className="bg-[#111827] text-white py-2.5 text-sm font-medium relative z-20">
      <Marquee className="[--duration:30s] [--gap:4rem]" repeat={8} pauseOnHover>
        <span className="flex items-center gap-2"><Flame size={16} className="text-[#E87C2A]" /> Promotions exclusives cette semaine !</span>
        <span className="flex items-center gap-2"><Rocket size={16} className="text-[#4BB5E8]" /> Livraison rapide partout en Côte d'Ivoire</span>
        <span className="flex items-center gap-2"><Gift size={16} className="text-[#F5C430]" /> Cadeau offert pour commande +50.000 FCFA</span>
        <span className="flex items-center gap-2"><ShieldCheck size={16} className="text-green-500" /> Produits 100% originaux garantis</span>
      </Marquee>
    </div>
  );
}

/* ─── Main Page ─── */
export default function Home() {
  const { data: featuredProductsRaw, isLoading: isFeaturedLoading } = useGetFeaturedProducts();
  const { data: newArrivalsRaw, isLoading: isNewArrivalsLoading } = useGetNewArrivals();
  const { data: bestSellersRaw, isLoading: isBestSellersLoading } = useGetBestSellers();
  const { data: onSaleProductsRaw, isLoading: isOnSaleLoading } = useGetOnSaleProducts();
  const { data: categoriesRaw } = useListCategories();

  // Fall back to example placeholders when no real products exist yet
  const featuredProducts = Array.isArray(featuredProductsRaw) && featuredProductsRaw.length > 0 ? featuredProductsRaw : exampleProducts;
  const newArrivals = Array.isArray(newArrivalsRaw) && newArrivalsRaw.length > 0 ? newArrivalsRaw : exampleProducts;
  const bestSellers = Array.isArray(bestSellersRaw) && bestSellersRaw.length > 0 ? bestSellersRaw : exampleProducts;
  const onSaleProducts = Array.isArray(onSaleProductsRaw) && onSaleProductsRaw.length > 0 ? onSaleProductsRaw : [];

  const fallbackCategories = [
    { name: "Montres Connectees", slug: "smartwatches", image: "/images/smartwatch.png", color: "bg-blue-50", accent: "#4BB5E8" },
    { name: "Ecouteurs", slug: "earphones", image: "/images/earbuds.png", color: "bg-gray-100", accent: "#E87C2A" },
    { name: "Coques", slug: "cases", image: "/images/case.png", color: "bg-stone-100", accent: "#F5C430" },
    { name: "Batteries", slug: "power-banks", image: "/images/powerbank.png", color: "bg-slate-100", accent: "#4BB5E8" },
    { name: "Chargeurs", slug: "chargers", image: "/images/charger.png", color: "bg-zinc-100", accent: "#E87C2A" },
    { name: "Haut-parleurs", slug: "speakers", image: "/images/speaker.png", color: "bg-neutral-100", accent: "#F5C430" },
  ];

  const categories = Array.isArray(categoriesRaw) && categoriesRaw.length > 0
    ? categoriesRaw.map((category, index) => ({
        name: category.name,
        slug: category.slug,
        image: category.image || fallbackCategories[index % fallbackCategories.length].image,
        color: fallbackCategories[index % fallbackCategories.length].color,
        accent: fallbackCategories[index % fallbackCategories.length].accent,
      }))
    : fallbackCategories;

// Example placeholder products displayed when no real products are available
// exampleProducts moved above

  return (
    <Layout>
      <PromoMarquee />
      <HeroCarousel />
      
      {/* Brands Marquee */}
      <div className="bg-white dark:bg-gray-900 py-8 border-y border-border overflow-hidden">
        <div className="container mx-auto px-4 mb-6 text-center">
          <h2 className="text-sm font-bold text-muted-foreground dark:text-gray-400 tracking-widest uppercase">Nos Marques Partenaires</h2>
        </div>
        <Marquee className="[--duration:40s] [--gap:5rem]" pauseOnHover>
          {["APPLE", "SAMSUNG", "ORAIMO", "JBL", "XIAOMI", "HUAWEI", "SONY", "BEATS", "BASEUS"].map((brand) => (
            <div key={brand} className="text-3xl md:text-4xl font-black text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 transition-colors cursor-pointer select-none">
              {brand}
            </div>
          ))}
        </Marquee>
      </div>

      {/* Trust Badges */}
      <section className="bg-white dark:bg-gray-900 border-b border-border">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-0 divide-y md:divide-y-0 md:divide-x divide-border">
            {[
              { icon: <Truck className="h-6 w-6" />, title: "Livraison Rapide", desc: "Partout en Côte d'Ivoire", color: "#4BB5E8" },
              { icon: <ShieldCheck className="h-6 w-6" />, title: "Garantie Qualité", desc: "Produits 100% originaux", color: "#E87C2A" },
              { icon: <HeadphonesIcon className="h-6 w-6" />, title: "Service Client 7j/7", desc: "+225 05 03 64 83 12", color: "#F5C430" },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="flex items-center gap-4 py-6 px-6"
              >
                <div className="p-3 rounded-full flex-shrink-0" style={{ backgroundColor: `${item.color}20`, color: item.color }}>
                  {item.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-foreground dark:text-white">{item.title}</h3>
                  <p className="text-sm text-muted-foreground dark:text-gray-400">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-14 bg-gray-50 dark:bg-gray-950">
        <div className="container mx-auto px-4">
          <FadeInSection>
            <div className="text-center mb-10">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground dark:text-white">Nos Catégories</h2>
              <p className="text-muted-foreground dark:text-gray-400 mt-2">Trouvez l'accessoire parfait pour votre style</p>
            </div>
          </FadeInSection>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((category, i) => (
              <motion.div
                key={category.slug}
                initial={{ opacity: 0, scale: 0.85 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: i * 0.07 }}
                whileHover={{ y: -4 }}
              >
                <Link href={`/products?category=${category.slug}`}>
                  <div className="group cursor-pointer bg-white dark:bg-gray-800 rounded-2xl p-4 text-center border border-border hover:border-transparent hover:shadow-lg transition-all duration-300">
                    <div
                      className={`w-20 h-20 mx-auto rounded-full ${category.color} flex items-center justify-center overflow-hidden mb-4 group-hover:scale-110 transition-transform duration-300`}
                      style={{ boxShadow: `0 0 0 0px ${category.accent}40` }}
                    >
                      <img src={category.image} alt={category.name} className="w-full h-full object-cover" />
                    </div>
                    <h3 className="font-semibold text-sm text-foreground dark:text-white group-hover:text-primary transition-colors">{category.name}</h3>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Flash Sale */}
      {!isOnSaleLoading && (
        <FlashSaleSection products={Array.isArray(onSaleProducts) && onSaleProducts.length > 0 ? onSaleProducts : exampleProducts} />
      )}

      {/* Featured Products */}
      <section className="py-14 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <FadeInSection>
            <div className="flex justify-between items-end mb-8">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Star className="h-5 w-5 fill-[#F5C430] text-[#F5C430]" />
                  <span className="text-sm font-semibold text-[#E87C2A] uppercase tracking-wider">Sélection Premium</span>
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground dark:text-white">En Vedette</h2>
              </div>
              <Link href="/products?featured=true" className="text-primary font-medium hover:underline flex items-center gap-1 text-sm">
                Voir tout <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </FadeInSection>

          {isFeaturedLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-80 bg-gray-100 animate-pulse rounded-2xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {featuredProducts.slice(0, 4).map((product, i) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                >
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Video & Ads Showcase Section */}
      <VideoShowcase />

      {/* Promo Banner */}
      <FadeInSection>
        <section className="py-8 bg-[#111827]">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-white">
              <div className="flex items-center gap-4">
                <div className="bg-[#F5C430] rounded-full p-3">
                  <Gift className="h-6 w-6 text-[#111827]" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider">Offre spéciale</p>
                  <h3 className="text-xl font-bold">Livraison gratuite dès 25 000 FCFA d'achat !</h3>
                </div>
              </div>
              <Button className="bg-[#E87C2A] hover:bg-[#D06820] text-white font-semibold px-8 shrink-0" asChild>
                <Link href="/products">
                  En profiter <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </FadeInSection>

      {/* New Arrivals & Best Sellers */}
      <section className="py-14 bg-gray-50 dark:bg-gray-950">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* New Arrivals */}
            <FadeInSection>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <span className="text-xs font-semibold text-[#4BB5E8] uppercase tracking-wider">Derniers arrivages</span>
                  <h2 className="text-2xl font-bold text-foreground dark:text-white mt-1">Nouveautés</h2>
                </div>
                <Link href="/products" className="text-primary font-medium hover:underline text-sm flex items-center gap-1">
                  Voir tout <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              <div className="space-y-3">
                {isNewArrivalsLoading
                  ? [...Array(3)].map((_, i) => <div key={i} className="h-24 bg-white border animate-pulse rounded-xl" />)
                  : newArrivals.slice(0, 4).map((product, i) => (
                      <motion.div
                        key={product.id}
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.35, delay: i * 0.08 }}
                      >
                        <Link href={`/products/${product.id}`}>
                          <div className="flex items-center p-3 bg-white dark:bg-gray-800 border border-border rounded-xl hover:border-[#4BB5E8]/40 hover:shadow-md transition-all group">
                            <div className="w-20 h-20 bg-gray-50 dark:bg-gray-700 rounded-lg p-2 flex-shrink-0 overflow-hidden">
                              <img src={product.images[0] || "/images/smartwatch.png"} alt={product.name} className="w-full h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-300" />
                            </div>
                            <div className="ml-4 flex-1 min-w-0">
                              <p className="text-[10px] text-[#4BB5E8] uppercase tracking-wider font-semibold mb-1">{product.category}</p>
                              <h4 className="font-semibold text-sm text-foreground dark:text-white line-clamp-1 group-hover:text-primary transition-colors">{product.name}</h4>
                              <div className="mt-2 flex items-center justify-between">
                                {product.discountPrice ? (
                                  <div>
                                    <span className="text-xs text-muted-foreground line-through mr-2">{product.price.toLocaleString()} FCFA</span>
                                    <span className="font-bold text-sm text-[#E87C2A]">{product.discountPrice.toLocaleString()} FCFA</span>
                                  </div>
                                ) : (
                                  <span className="font-bold text-sm">{product.price.toLocaleString()} FCFA</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </Link>
                      </motion.div>
                    ))}
              </div>
            </FadeInSection>

            {/* Best Sellers */}
            <FadeInSection delay={0.15}>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <span className="text-xs font-semibold text-[#E87C2A] uppercase tracking-wider">Top ventes</span>
                  <h2 className="text-2xl font-bold text-foreground dark:text-white mt-1">Meilleures Ventes</h2>
                </div>
                <Link href="/products?bestSeller=true" className="text-primary font-medium hover:underline text-sm flex items-center gap-1">
                  Voir tout <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              <div className="space-y-3">
                {isBestSellersLoading
                  ? [...Array(3)].map((_, i) => <div key={i} className="h-24 bg-white border animate-pulse rounded-xl" />)
                  : bestSellers.slice(0, 4).map((product, i) => (
                      <motion.div
                        key={product.id}
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.35, delay: i * 0.08 }}
                      >
                        <Link href={`/products/${product.id}`}>
                          <div className="flex items-center p-3 bg-white dark:bg-gray-800 border border-border rounded-xl hover:border-[#E87C2A]/40 hover:shadow-md transition-all group">
                            <div className="relative w-20 h-20 bg-gray-50 dark:bg-gray-700 rounded-lg p-2 flex-shrink-0 overflow-hidden">
                              <img src={product.images[0] || "/images/smartwatch.png"} alt={product.name} className="w-full h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-300" />
                              <span className="absolute top-1 left-1 bg-[#E87C2A] text-white text-[9px] font-bold px-1 rounded">#{i + 1}</span>
                            </div>
                            <div className="ml-4 flex-1 min-w-0">
                              <p className="text-[10px] text-[#E87C2A] uppercase tracking-wider font-semibold mb-1">{product.category}</p>
                              <h4 className="font-semibold text-sm text-foreground dark:text-white line-clamp-1 group-hover:text-primary transition-colors">{product.name}</h4>
                              <div className="mt-2">
                                {product.discountPrice ? (
                                  <div>
                                    <span className="text-xs text-muted-foreground line-through mr-2">{product.price.toLocaleString()} FCFA</span>
                                    <span className="font-bold text-sm text-[#E87C2A]">{product.discountPrice.toLocaleString()} FCFA</span>
                                  </div>
                                ) : (
                                  <span className="font-bold text-sm">{product.price.toLocaleString()} FCFA</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </Link>
                      </motion.div>
                    ))}
              </div>
            </FadeInSection>
          </div>
        </div>
      </section>
    </Layout>
  );
}
