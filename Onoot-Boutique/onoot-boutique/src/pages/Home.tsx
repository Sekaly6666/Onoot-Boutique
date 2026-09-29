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
/* ─── Hero Carousel (Couleurs de marque : 1. Bleu, 2. Jaune, 3. Orange) ─── */
const heroSlides = [
  {
    id: 0,
    name: "Bleu",
    bg: "from-[#034f75] via-[#0284c7] to-[#0ea5e9]",
    textColor: "text-white",
    badgeText: "NOUVEAUTÉ 2026",
    badgeIcon: Zap,
    badgeColor: "bg-white/20 text-white border-white/30 backdrop-blur-md",
    title: "L'excellence tech,",
    titleColor: "text-white",
    highlight: "livrée chez vous.",
    highlightColor: "text-[#F5C430] drop-shadow-sm",
    desc: "Découvrez notre sélection premium d'accessoires pour smartphones. Qualité garantie, garantie 1 an & paiement à la livraison.",
    descColor: "text-white/85",
    cta: "Acheter maintenant",
    ctaLink: "/products",
    ctaClass: "bg-[#E87C2A] hover:bg-[#D06820] text-white shadow-lg shadow-[#E87C2A]/40",
    cta2: "Voir les promotions",
    cta2Link: "/products?onSale=true",
    cta2Class: "text-white border-white/30 hover:bg-white/15",
    image: "/images/smartwatch.png",
    imageBg: "bg-white/15",
    tagIcon: Star,
    tagColor: "text-[#F5C430]",
    tagText: "4.9/5 • Meilleure Vente",
  },
  {
    id: 1,
    name: "Jaune",
    bg: "from-[#ca8a04] via-[#f5c430] to-[#fde047]",
    textColor: "text-slate-950",
    badgeText: "VENTE FLASH DU JOUR",
    badgeIcon: Flame,
    badgeColor: "bg-slate-950 text-[#facc15] border-slate-950/30 backdrop-blur-md shadow-sm",
    title: "Flash Sale,",
    titleColor: "text-slate-950",
    highlight: "jusqu'à -40% !",
    highlightColor: "text-red-600 drop-shadow-xs",
    desc: "Offres exceptionnelles limitées sur le son et la haute technologie. Stocks réduits, profitez-en avant rupture !",
    descColor: "text-slate-900/90 font-medium",
    cta: "Profiter des offres",
    ctaLink: "/products?onSale=true",
    ctaClass: "bg-slate-950 hover:bg-slate-900 text-white shadow-xl shadow-black/25",
    cta2: "Voir le catalogue",
    cta2Link: "/products",
    cta2Class: "text-slate-950 border-slate-950/40 hover:bg-slate-950/10 font-bold",
    image: "/images/earbuds.png",
    imageBg: "bg-white/40 border border-slate-900/10 shadow-xl",
    tagIcon: Flame,
    tagColor: "text-red-600",
    tagText: "-40% Remise Immédiate",
  },
  {
    id: 2,
    name: "Orange",
    bg: "from-[#7c2d12] via-[#c2410c] to-[#ea580c]",
    textColor: "text-white",
    badgeText: "NOUVEAUX ARRIVAGES",
    badgeIcon: Sparkles,
    badgeColor: "bg-white/20 text-white border-white/30 backdrop-blur-md",
    title: "Découvrez les",
    titleColor: "text-white",
    highlight: "dernières tendances.",
    highlightColor: "text-[#F5C430] drop-shadow-sm",
    desc: "Smartphones, montres connectées, écouteurs sans fil... Restez à la pointe de l'innovation avec Onoot Boutique.",
    descColor: "text-white/85",
    cta: "Explorer maintenant",
    ctaLink: "/products",
    ctaClass: "bg-slate-950 hover:bg-slate-900 text-white shadow-xl shadow-black/30",
    cta2: "Nos catégories",
    cta2Link: "/products",
    cta2Class: "text-white border-white/30 hover:bg-white/15",
    image: "/images/speaker.png",
    imageBg: "bg-white/15",
    tagIcon: Sparkles,
    tagColor: "text-[#F5C430]",
    tagText: "100% Produit Original",
  },
];

function HeroCarousel() {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);

  useEffect(() => {
    const timer = setInterval(() => {
      setDirection(1);
      setCurrent((c) => (c + 1) % heroSlides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const go = (idx: number) => {
    setDirection(idx > current ? 1 : -1);
    setCurrent(idx);
  };

  const slide = heroSlides[current];
  const BadgeIcon = slide.badgeIcon;
  const TagIcon = slide.tagIcon;

  return (
    <section className="relative overflow-hidden min-h-[580px] sm:min-h-[540px] md:min-h-[620px] lg:min-h-[660px] flex items-center">
      {/* Dynamic Animated Gradient Background */}
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={current}
          custom={direction}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          className={`absolute inset-0 bg-gradient-to-r ${slide.bg}`}
        />
      </AnimatePresence>

      {/* Decorative ambient glowing orbs */}
      <div className="absolute -top-24 -left-24 w-80 h-80 sm:w-96 sm:h-96 rounded-full bg-[#F5C430]/15 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-80 h-80 sm:w-96 sm:h-96 rounded-full bg-[#4BB5E8]/20 blur-3xl pointer-events-none" />

      {/* Main Content Grid */}
      <div className="relative z-10 container mx-auto px-4 pt-8 pb-16 sm:py-16 md:py-24 flex flex-col md:flex-row items-center justify-between gap-6 sm:gap-8 md:gap-12 w-full">
        
        {/* Left Column: Text & CTAs */}
        <div className={`flex-1 ${slide.textColor || "text-white"} max-w-2xl text-center md:text-left flex flex-col items-center md:items-start`}>
          <AnimatePresence mode="wait">
            <motion.div
              key={`content-${current}`}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="flex flex-col items-center md:items-start"
            >
              {/* Badge */}
              <span className={`inline-flex items-center py-1.5 px-3.5 rounded-full text-xs sm:text-sm font-bold tracking-wider uppercase mb-3 sm:mb-5 border backdrop-blur-md shadow-sm ${slide.badgeColor}`}>
                <BadgeIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                {slide.badgeText}
              </span>

              {/* Title */}
              <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-3 sm:mb-4 leading-tight sm:leading-none tracking-tight">
                <span className={slide.titleColor || ""}>{slide.title}</span> <br className="hidden sm:inline" />
                <span className={`${slide.highlightColor} block sm:inline mt-1 sm:mt-0 drop-shadow-sm`}>
                  {slide.highlight}
                </span>
              </h1>

              {/* Description */}
              <p className={`text-xs sm:text-base md:text-lg mb-5 sm:mb-8 max-w-md md:max-w-lg leading-relaxed ${slide.descColor || "text-white/85"}`}>
                {slide.desc}
              </p>

              {/* CTAs */}
              <div className="flex flex-row items-center gap-3 sm:gap-4 w-full sm:w-auto justify-center md:justify-start">
                <Button
                  size="default"
                  className={`flex-1 sm:flex-none active:scale-[0.98] font-bold text-xs sm:text-sm md:text-base px-4 sm:px-7 py-2.5 sm:py-3.5 rounded-xl transition-all ${
                    slide.ctaClass || "bg-[#E87C2A] hover:bg-[#D06820] text-white shadow-lg shadow-[#E87C2A]/40"
                  }`}
                  asChild
                >
                  <Link href={slide.ctaLink}>
                    <span>{slide.cta}</span>
                    <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  size="default"
                  variant="outline"
                  className={`flex-1 sm:flex-none active:scale-[0.98] backdrop-blur-md text-xs sm:text-sm md:text-base px-4 sm:px-6 py-2.5 sm:py-3.5 rounded-xl font-semibold transition-all ${
                    slide.cta2Class || "text-white border-white/30 hover:bg-white/15"
                  }`}
                  asChild
                >
                  <Link href={slide.cta2Link}>
                    {slide.cta2}
                  </Link>
                </Button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Right Column: Hero Visual Image with Floating Halo */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`img-${current}`}
            initial={{ scale: 0.85, opacity: 0, rotate: -3 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            exit={{ scale: 0.85, opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-1 items-center justify-center my-2 sm:my-0 w-full"
          >
            <div className="relative flex items-center justify-center">
              {/* Radial ambient backlight */}
              <div className="absolute -inset-4 sm:-inset-8 rounded-full bg-gradient-to-tr from-[#F5C430]/25 via-[#E87C2A]/20 to-transparent blur-2xl pointer-events-none" />

              {/* Main Product Showcase Circle */}
              <div className={`relative w-44 h-44 sm:w-60 sm:h-60 md:w-80 md:h-80 lg:w-96 lg:h-96 rounded-3xl sm:rounded-full ${slide.imageBg} border border-white/15 flex items-center justify-center p-5 sm:p-7 md:p-10 backdrop-blur-md shadow-2xl`}>
                <motion.img 
                  src={slide.image} 
                  alt={slide.title} 
                  className="w-full h-full object-contain drop-shadow-[0_20px_35px_rgba(0,0,0,0.55)] select-none"
                  animate={{ y: [0, -8, 0] }}
                  transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }}
                />

                {/* Floating mini badge for luxury trust */}
                <div className="absolute -bottom-2 sm:bottom-4 -right-1 sm:right-2 bg-slate-900/85 backdrop-blur-md border border-white/20 px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-xl text-[11px] sm:text-xs text-white font-medium select-none pointer-events-none">
                  <TagIcon className={`w-3.5 h-3.5 ${slide.tagColor} flex-shrink-0`} />
                  <span>{slide.tagText}</span>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Desktop Arrows */}
      <button
        onClick={() => go((current - 1 + heroSlides.length) % heroSlides.length)}
        className="hidden sm:flex absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-black/25 hover:bg-black/50 text-white rounded-full p-2.5 backdrop-blur-md border border-white/15 transition-all hover:scale-110 active:scale-95"
        aria-label="Diapositive précédente"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        onClick={() => go((current + 1) % heroSlides.length)}
        className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-black/25 hover:bg-black/50 text-white rounded-full p-2.5 backdrop-blur-md border border-white/15 transition-all hover:scale-110 active:scale-95"
        aria-label="Diapositive suivante"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      {/* Pagination Dots */}
      <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/30 backdrop-blur-md border border-white/10">
        {heroSlides.map((_, i) => (
          <button
            key={i}
            onClick={() => go(i)}
            aria-label={`Aller au slide ${i + 1}`}
            className={`rounded-full transition-all duration-300 ${
              i === current ? "bg-white w-7 h-2 shadow-sm" : "bg-white/40 hover:bg-white/70 w-2 h-2"
            }`}
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
      <div className="bg-slate-50/80 dark:bg-gray-900/80 py-6 sm:py-8 border-b border-slate-200/70 dark:border-gray-800 overflow-hidden transition-colors">
        <div className="container mx-auto px-4 mb-4 sm:mb-6 text-center flex items-center justify-center gap-3">
          <span className="h-px w-8 sm:w-16 bg-slate-200 dark:bg-gray-800" />
          <h2 className="text-xs sm:text-sm font-bold text-slate-400 dark:text-gray-500 tracking-widest uppercase">
            Nos Marques Partenaires
          </h2>
          <span className="h-px w-8 sm:w-16 bg-slate-200 dark:bg-gray-800" />
        </div>
        <Marquee className="[--duration:35s] [--gap:3.5rem] sm:[--gap:5rem]" pauseOnHover>
          {["APPLE", "SAMSUNG", "ORAIMO", "JBL", "XIAOMI", "HUAWEI", "SONY", "BEATS", "BASEUS"].map((brand) => (
            <div key={brand} className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-300 dark:text-gray-700 hover:text-[#E87C2A] dark:hover:text-[#F5C430] transition-colors cursor-pointer select-none tracking-wider">
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
