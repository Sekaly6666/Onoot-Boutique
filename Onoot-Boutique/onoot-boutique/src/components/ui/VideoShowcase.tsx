import React, { useState, useEffect, useRef, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  Sparkles,
  ShoppingBag,
  ArrowRight,
  Eye,
  Tv,
  Flame,
  CheckCircle,
  ExternalLink,
  X,
  Radio,
  Tag,
  Plus,
  Check,
  ShoppingCart,
  SkipForward,
  SkipBack,
} from "lucide-react";
import { Button } from "./button";
import { VideoMarquee } from "./VideoMarquee";
import { useListProducts } from "@workspace/api-client-react";
import { useCartContext } from "@/contexts/CartContext";

interface PromoVideo {
  _id: string;
  title: string;
  subtitle?: string;
  description?: string;
  videoUrl: string;
  thumbnailUrl?: string;
  productLink?: string;
  productName?: string;
  productId?: string;
  price?: number;
  discountPrice?: number;
  badge?: string;
  viewsCount?: number;
}

// Fallback high-performance CDN videos verified to return 200 OK without hotlink blocking
const RELIABLE_CDN_VIDEOS = [
  "https://vjs.zencdn.net/v/oceans.mp4",
  "https://res.cloudinary.com/demo/video/upload/sea_turtle.mp4",
  "https://res.cloudinary.com/demo/video/upload/dog.mp4",
];

function cleanBadgeText(badge?: string): string {
  if (!badge) return "LIVE DÉMO";
  return (
    badge
      .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{27BF}\u{2B50}\u{2B00}-\u{2BFF}\u{1F1E6}-\u{1F1FF}]/gu, "")
      .replace(/\p{Extended_Pictographic}/gu, "")
      .trim() || "LIVE DÉMO"
  );
}

function isEmbedVideo(url?: string): boolean {
  if (!url) return false;
  return (
    url.includes("youtube.com") ||
    url.includes("youtu.be") ||
    url.includes("vimeo.com") ||
    url.includes("facebook.com") ||
    url.includes("fb.watch") ||
    url.includes("plugins/video.php") ||
    url.includes("tiktok.com") ||
    url.includes("/embed/")
  );
}

function isVerticalVideo(url?: string): boolean {
  if (!url) return false;
  return (
    url.includes("/reel/") ||
    url.includes("/shorts/") ||
    url.includes("tiktok.com") ||
    url.includes("instagram.com")
  );
}

function getEmbedAutoplayUrl(url: string, muted: boolean): string {
  if (!url) return "";

  // Facebook video & reels plugin
  if (url.includes("facebook.com") || url.includes("fb.watch")) {
    if (url.includes("plugins/video.php")) {
      try {
        const u = new URL(url);
        u.searchParams.delete("width");
        u.searchParams.set("show_text", "0");
        u.searchParams.set("autoplay", "1");
        u.searchParams.set("mute", muted ? "1" : "0");
        return u.toString();
      } catch {
        const cleaned = url.replace(/&width=\d+/g, "");
        const sep = cleaned.includes("?") ? "&" : "?";
        return `${cleaned}${sep}autoplay=1&mute=${muted ? "1" : "0"}`;
      }
    }
    return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=0&autoplay=1&mute=${muted ? "1" : "0"}`;
  }

  try {
    const parsed = new URL(url);
    parsed.searchParams.set("autoplay", "1");
    parsed.searchParams.set("mute", muted ? "1" : "0");
    parsed.searchParams.set("rel", "0");
    return parsed.toString();
  } catch {
    const sep = url.includes("?") ? "&" : "?";
    return `${url}${sep}autoplay=1&mute=${muted ? "1" : "0"}&rel=0`;
  }
}


export function VideoShowcase() {
  const [videos, setVideos] = useState<PromoVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const [, setLocation] = useLocation();

  const { addItem } = useCartContext();
  const { data: productsData } = useListProducts();
  const allProducts = Array.isArray(productsData?.products) ? productsData.products : [];

  const videoRef = useRef<HTMLVideoElement>(null);
  const modalVideoRef = useRef<HTMLVideoElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const playlistContainerRef = useRef<HTMLDivElement>(null);
  const isInitialMount = useRef(true);

  // Fetch showcase videos
  useEffect(() => {
    fetch("/api/promo-videos?placement=showcase")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setVideos(data);
        }
      })
      .catch((err) => console.warn("Failed to load showcase videos", err))
      .finally(() => setLoading(false));
  }, []);

  const activeVideo = videos[selectedIndex] || null;
  const isVertical = isVerticalVideo(activeVideo?.videoUrl);

  // Resolve matching product dynamically to ensure 100% accurate direct redirection
  const resolvedProduct = useMemo(() => {
    if (!activeVideo || allProducts.length === 0) return null;

    // 1. Match by exact productId
    if (activeVideo.productId) {
      const match = allProducts.find((p) => p.id === activeVideo.productId);
      if (match) return match;
    }

    // 2. Match by productName
    if (activeVideo.productName) {
      const q = activeVideo.productName.toLowerCase();
      const match = allProducts.find((p) => p.name.toLowerCase().includes(q) || q.includes(p.name.toLowerCase()));
      if (match) return match;
    }

    // 3. Match by video title keywords
    const titleWords = activeVideo.title.toLowerCase().split(/\s+/);
    for (const w of titleWords) {
      if (w.length > 4) {
        const match = allProducts.find((p) => p.name.toLowerCase().includes(w));
        if (match) return match;
      }
    }

    // 4. Match by productLink if it has an id
    if (activeVideo.productLink && activeVideo.productLink.startsWith("/products/")) {
      const linkId = activeVideo.productLink.replace("/products/", "").trim();
      const match = allProducts.find((p) => p.id === linkId);
      if (match) return match;
    }

    return null;
  }, [activeVideo, allProducts]);

  // Direct product target URL
  const targetProductUrl = resolvedProduct 
    ? `/products/${resolvedProduct.id}` 
    : (activeVideo?.productId ? `/products/${activeVideo.productId}` : (activeVideo?.productLink && activeVideo.productLink !== "/products" ? activeVideo.productLink : "/products"));

  // Sequential playlist controls: 1 -> 2 -> 3... -> loops back to 1
  const nextVideo = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (videos.length === 0) return;
    setSelectedIndex((prev) => (prev + 1) % videos.length);
  };

  const prevVideo = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (videos.length === 0) return;
    setSelectedIndex((prev) => (prev - 1 + videos.length) % videos.length);
  };

  // Called automatically when current video reaches the end
  const handleVideoEnded = () => {
    nextVideo();
  };

  // Smoothly scroll active video inside the playlist sidebar container ONLY (NEVER scroll the browser window)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    const container = playlistContainerRef.current;
    const item = itemRefs.current[selectedIndex];
    if (container && item) {
      const containerTop = container.scrollTop;
      const containerHeight = container.clientHeight;
      const itemTop = item.offsetTop - container.offsetTop;
      const itemHeight = item.clientHeight;

      if (itemTop < containerTop) {
        container.scrollTo({ top: itemTop, behavior: "smooth" });
      } else if (itemTop + itemHeight > containerTop + containerHeight) {
        container.scrollTo({ top: itemTop + itemHeight - containerHeight, behavior: "smooth" });
      }
    }
  }, [selectedIndex]);

  // Update video playback when selectedIndex changes
  useEffect(() => {
    setVideoError(false);
    setProgress(0);

    if (!activeVideo) return;

    if (isEmbedVideo(activeVideo.videoUrl)) {
      setIsPlaying(true);
      fetch(`/api/promo-videos/${activeVideo._id}/view`, { method: "POST" }).catch(() => {});
      return;
    }

    if (videoRef.current) {
      let sourceUrl = activeVideo.videoUrl;
      if (!sourceUrl || sourceUrl.includes("mixkit.co")) {
        sourceUrl = RELIABLE_CDN_VIDEOS[selectedIndex % RELIABLE_CDN_VIDEOS.length];
      }

      videoRef.current.src = sourceUrl;
      videoRef.current.load();
      
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsPlaying(true))
          .catch((err) => {
            console.warn("Autoplay notice, falling back to muted playback:", err);
            // If browser blocks unmuted playback during sequential transitions, mute and resume
            if (videoRef.current && !videoRef.current.muted) {
              videoRef.current.muted = true;
              setIsMuted(true);
              videoRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
            } else {
              setIsPlaying(false);
            }
          });
      }
    }

    // Synchronize modal video if open
    if (isModalOpen && modalVideoRef.current && !isEmbedVideo(activeVideo.videoUrl)) {
      let sourceUrl = activeVideo.videoUrl;
      if (!sourceUrl || sourceUrl.includes("mixkit.co")) {
        sourceUrl = RELIABLE_CDN_VIDEOS[selectedIndex % RELIABLE_CDN_VIDEOS.length];
      }
      modalVideoRef.current.src = sourceUrl;
      modalVideoRef.current.load();
      modalVideoRef.current.play().catch(() => {});
    }

    // View counter
    fetch(`/api/promo-videos/${activeVideo._id}/view`, { method: "POST" }).catch(() => {});
  }, [selectedIndex, activeVideo, isModalOpen]);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      const duration = videoRef.current.duration || 1;
      setProgress((current / duration) * 100);
    }
  };

  const handleVideoError = () => {
    if (activeVideo && isEmbedVideo(activeVideo.videoUrl)) {
      return;
    }
    console.warn("Video failed to play, switching to reliable fallback stream");
    setVideoError(true);
    if (videoRef.current) {
      const fallback = RELIABLE_CDN_VIDEOS[selectedIndex % RELIABLE_CDN_VIDEOS.length];
      videoRef.current.src = fallback;
      videoRef.current.load();
      videoRef.current.play().catch(() => {});
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const selectVideo = (index: number) => {
    if (index === selectedIndex) {
      togglePlay();
    } else {
      setSelectedIndex(index);
    }
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (resolvedProduct) {
      addItem(resolvedProduct.id, 1);
    } else if (activeVideo?.productId) {
      addItem(activeVideo.productId, 1);
    } else {
      setLocation(targetProductUrl);
      return;
    }
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2000);
  };

  if (loading || !activeVideo) {
    return null;
  }

  // Displayed prices & metadata: prioritize activeVideo's own data, then fallback to matched product
  const displayPrice = activeVideo.price ?? resolvedProduct?.price ?? 25000;
  const displayDiscount = activeVideo.discountPrice ?? resolvedProduct?.discountPrice ?? null;
  const hasDiscount = Boolean(displayDiscount && displayDiscount < displayPrice);
  const displayTitle = activeVideo.title || activeVideo.productName || resolvedProduct?.name || "Produit Démo";
  const displayImage = activeVideo.thumbnailUrl || resolvedProduct?.images?.[0] || "/images/zfold_case.jpg";

  return (
    <section className="py-12 sm:py-16 bg-gradient-to-b from-slate-950 via-[#0a0f1d] to-slate-950 text-white relative overflow-hidden select-none">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-[#4BB5E8]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-orange-500/20 to-amber-500/20 border border-orange-500/30 text-orange-400 text-xs font-bold uppercase tracking-wider mb-2.5 backdrop-blur-md">
              <Tv className="w-3.5 h-3.5" />
              <span>Espace Démonstrations & Publicités</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white">
              Onoot Live & Démos Vidéos
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-xl">
              Regardez nos démonstrations haute définition, tests qualité et commandez le produit présenté en un clic !
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-300 font-semibold bg-white/5 border border-white/10 px-3.5 py-1.5 rounded-full self-start md:self-auto backdrop-blur-md">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>Flux Direct • {videos.length} démos disponibles</span>
          </div>
        </div>

        {/* Main Showcase Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* Main Cinematic Video Player (8 Cols on large) */}
          <div className="lg:col-span-8 flex flex-col">
            <div 
              onClick={activeVideo && !isEmbedVideo(activeVideo.videoUrl) ? togglePlay : undefined}
              className={`relative w-full rounded-3xl overflow-hidden bg-black border border-white/10 shadow-2xl shadow-black/90 group flex items-center justify-center cursor-pointer transition-all duration-300 ${
                isVertical 
                  ? "h-[500px] sm:h-[560px] md:h-[620px] max-w-sm sm:max-w-md mx-auto aspect-[9/16]" 
                  : "aspect-video"
              }`}
            >
              {/* Single persistent Video element or Iframe */}
              {activeVideo && isEmbedVideo(activeVideo.videoUrl) ? (
                <iframe
                  src={getEmbedAutoplayUrl(activeVideo.videoUrl, isMuted)}
                  title={activeVideo.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="w-full h-full border-0 pointer-events-auto"
                />
              ) : (
                <video
                  ref={videoRef}
                  poster={activeVideo?.thumbnailUrl || displayImage}
                  autoPlay
                  playsInline
                  muted={isMuted}
                  onEnded={handleVideoEnded}
                  onTimeUpdate={handleTimeUpdate}
                  onError={handleVideoError}
                  className="w-full h-full object-contain bg-black"
                />
              )}

              {/* Top Controls Overlay */}
              <div className="absolute top-3 sm:top-4 left-3 sm:left-4 right-3 sm:right-4 flex items-center justify-between z-20 pointer-events-none">
                <div className="flex items-center gap-2">
                  <span className="bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[10px] sm:text-xs font-black uppercase px-2.5 sm:px-3 py-1 rounded-full shadow-lg backdrop-blur-md flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 fill-white" />
                    <span>{cleanBadgeText(activeVideo?.badge)}</span>
                  </span>
                  <span className="bg-black/60 backdrop-blur-md text-slate-300 text-[11px] px-2.5 py-1 rounded-full flex items-center gap-1 font-medium border border-white/10">
                    <Eye className="w-3 h-3 text-orange-400" />
                    {(activeVideo?.viewsCount || 1240).toLocaleString("fr-FR")} vues
                  </span>
                </div>

                <div className="flex items-center gap-2 pointer-events-auto">
                  {/* Skip to previous video */}
                  <button
                    type="button"
                    onClick={prevVideo}
                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center transition-all transform hover:scale-105 border border-white/20 shadow-lg"
                    title="Vidéo précédente"
                  >
                    <SkipBack className="w-4 h-4 text-slate-300 hover:text-white" />
                  </button>

                  {/* Skip to next video */}
                  <button
                    type="button"
                    onClick={nextVideo}
                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center transition-all transform hover:scale-105 border border-white/20 shadow-lg"
                    title="Vidéo suivante (1 ➔ 2 ➔ 3...)"
                  >
                    <SkipForward className="w-4 h-4 text-orange-400 hover:text-orange-300" />
                  </button>

                  {/* Sound toggle button (for native video) */}
                  {activeVideo && !isEmbedVideo(activeVideo.videoUrl) && (
                    <button
                      type="button"
                      onClick={toggleMute}
                      className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center transition-all transform hover:scale-105 border border-white/20 shadow-lg"
                      title={isMuted ? "Activer le son" : "Couper le son"}
                    >
                      {isMuted ? <VolumeX className="w-4 h-4 text-slate-400" /> : <Volume2 className="w-4 h-4 text-orange-400" />}
                    </button>
                  )}

                  {/* Fullscreen modal trigger */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsModalOpen(true);
                    }}
                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center transition-all transform hover:scale-105 border border-white/20 shadow-lg"
                    title="Plein écran"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Big Center Play / Pause Indicator (native video) */}
              {activeVideo && !isEmbedVideo(activeVideo.videoUrl) && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <AnimatePresence>
                    {!isPlaying && (
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-orange-500 to-amber-500 text-white flex items-center justify-center shadow-2xl shadow-orange-500/50 backdrop-blur-sm pointer-events-auto cursor-pointer"
                      >
                        <Play className="w-8 h-8 ml-1 fill-white" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Bottom Progress Bar */}
              {activeVideo && !isEmbedVideo(activeVideo.videoUrl) && (
                <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/20 z-20">
                  <div
                    className="h-full bg-gradient-to-r from-orange-500 via-amber-400 to-[#F5C430] transition-all duration-150"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              )}
            </div>

            {/* Product Card Directly Below Video (Jumia Live Shopping Style) */}
            <div className="mt-4 p-4 sm:p-5 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Product Info with direct Click to detail */}
              <Link 
                href={targetProductUrl}
                className="flex items-center gap-3.5 group/prod flex-1 min-w-0"
              >
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-white/10 p-1.5 flex-shrink-0 border border-white/15 group-hover/prod:border-orange-500 transition-colors">
                  <img
                    src={displayImage}
                    alt={displayTitle}
                    className="w-full h-full object-contain group-hover/prod:scale-105 transition-transform"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 text-[10px] text-orange-400 font-bold uppercase tracking-wider mb-1">
                    <Sparkles className="w-3 h-3" />
                    <span>Produit présenté dans la vidéo</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-white group-hover/prod:text-orange-400 transition-colors truncate">
                    {displayTitle}
                  </h3>
                  {activeVideo.subtitle && (
                    <p className="text-xs text-slate-300 truncate mt-0.5">
                      {activeVideo.subtitle}
                    </p>
                  )}
                </div>
              </Link>

              {/* Price & Action Buttons */}
              <div className="flex items-center justify-between md:justify-end gap-3.5 flex-shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-white/10">
                <div className="text-left md:text-right">
                  {hasDiscount ? (
                    <>
                      <div className="text-lg sm:text-xl font-extrabold text-orange-400">
                        {displayDiscount?.toLocaleString("fr-FR")} FCFA
                      </div>
                      <div className="text-xs text-slate-400 line-through">
                        {displayPrice.toLocaleString("fr-FR")} FCFA
                      </div>
                    </>
                  ) : (
                    <div className="text-lg sm:text-xl font-extrabold text-white">
                      {displayPrice.toLocaleString("fr-FR")} FCFA
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {/* Quick Add To Cart with ShoppingCart icon */}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddToCart}
                    className={`border-white/20 transition-all rounded-xl px-3.5 py-2 text-xs font-bold gap-1.5 shadow-sm ${
                      justAdded
                        ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                        : "bg-white/5 hover:bg-white/15 text-white hover:border-orange-500/50"
                    }`}
                    title="Ajouter au panier directement"
                  >
                    {justAdded ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-400" />
                        <span>Ajouté !</span>
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-4 h-4 text-orange-400" />
                        <span>Ajouter</span>
                      </>
                    )}
                  </Button>

                  {/* Commander / Direct to Product */}
                  <Button
                    asChild
                    className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold px-4 sm:px-5 py-2 rounded-xl shadow-lg shadow-orange-500/25 transition-all transform hover:scale-102 text-xs sm:text-sm"
                  >
                    <Link href={targetProductUrl}>
                      <ShoppingBag className="w-4 h-4 mr-1.5" />
                      <span>Commander</span>
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Playlist Sidebar (4 Cols on large) - 5 vidéos visibles max, le reste défilable */}
          <div className="lg:col-span-4 flex flex-col space-y-3">
            <div className="flex items-center justify-between px-1 mb-1">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-orange-400" />
                <span>Sélection Vidéos ({videos.length})</span>
              </h4>
              <div className="flex items-center gap-1.5">
                {videos.length > 5 && (
                  <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">
                    (5 visibles • Défiler ↓)
                  </span>
                )}
                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-semibold bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Lecture auto</span>
                </span>
              </div>
            </div>

            {/* Exactement 5 vidéos visibles à la fois (466px), défilement fluide pour les suivantes */}
            <div
              ref={playlistContainerRef}
              className="space-y-2 max-h-[466px] overflow-y-auto pr-1.5 scroll-smooth [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.25)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-white/5 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-orange-500/50"
            >
              {videos.map((item, idx) => {
                const isCurrent = idx === selectedIndex;
                const itemThumb = item.thumbnailUrl || (allProducts.find((p) => p.id === item.productId || p.name === item.productName)?.images?.[0]) || "/images/zfold_case.jpg";

                return (
                  <motion.div
                    key={item._id}
                    ref={(el) => {
                      itemRefs.current[idx] = el;
                    }}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => selectVideo(idx)}
                    className={`flex items-center gap-3 p-2.5 rounded-2xl cursor-pointer transition-all duration-200 border relative ${
                      isCurrent
                        ? "bg-white/[0.08] border-orange-500 shadow-lg shadow-orange-500/10 ring-1 ring-orange-500/30"
                        : "bg-white/[0.02] hover:bg-white/[0.06] border-white/10"
                    }`}
                  >
                    {/* Thumbnail Image with Play overlay (fast, no heavy video loading) */}
                    <div className="relative w-20 h-16 sm:w-22 sm:h-16 rounded-xl overflow-hidden bg-black flex-shrink-0 border border-white/10">
                      <img
                        src={itemThumb}
                        alt={item.title}
                        className="w-full h-full object-cover bg-slate-900"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                            isCurrent
                              ? "bg-orange-500 text-white shadow-md scale-110"
                              : "bg-black/60 text-white/90"
                          }`}
                        >
                          <Play className="w-3.5 h-3.5 ml-0.5 fill-current" />
                        </div>
                      </div>
                      {isCurrent ? (
                        <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-orange-500 text-[8px] font-black text-white uppercase tracking-wider flex items-center gap-1 shadow">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                          <span>N° {idx + 1} • En cours</span>
                        </div>
                      ) : (
                        <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-xs text-[9px] font-bold text-slate-300 border border-white/10">
                          N° {idx + 1}
                        </div>
                      )}
                    </div>

                    {/* Metadata */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center gap-1">
                          <Flame className="w-2.5 h-2.5" />
                          <span>{cleanBadgeText(item.badge)}</span>
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">Vidéo {idx + 1}/{videos.length}</span>
                      </div>
                      <h5
                        className={`text-xs sm:text-sm font-bold truncate ${
                          isCurrent ? "text-orange-400" : "text-white"
                        }`}
                      >
                        {item.title}
                      </h5>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {item.productName || item.subtitle || "Voir la démo"}
                      </p>
                      {item.price && (
                        <p className="text-[11px] font-bold text-slate-200 mt-1">
                          {item.discountPrice
                            ? `${item.discountPrice.toLocaleString("fr-FR")} FCFA`
                            : `${item.price.toLocaleString("fr-FR")} FCFA`}
                        </p>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen Video Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 sm:p-6"
          >
            <div className={`relative w-full ${isVertical ? "max-w-sm sm:max-w-md h-[88vh] aspect-[9/16]" : "max-w-5xl aspect-video"} bg-black rounded-3xl overflow-hidden border border-white/20 shadow-2xl flex flex-col justify-center items-center`}>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 z-30 p-2.5 rounded-full bg-black/70 text-white hover:bg-white hover:text-black transition-colors border border-white/20 shadow-lg"
              >
                <X className="w-5 h-5" />
              </button>

              {activeVideo && isEmbedVideo(activeVideo.videoUrl) ? (
                <iframe
                  src={getEmbedAutoplayUrl(activeVideo.videoUrl, false)}
                  title={activeVideo.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="w-full h-full border-0"
                />
              ) : (
                <video
                  ref={modalVideoRef}
                  src={videoRef.current?.src || activeVideo?.videoUrl}
                  autoPlay
                  controls
                  onEnded={handleVideoEnded}
                  className="w-full h-full object-contain"
                />
              )}

              {/* Direct Buy Bar inside modal */}
              <div className="absolute bottom-4 left-4 right-4 bg-black/80 backdrop-blur-md p-3 rounded-2xl border border-white/20 flex items-center justify-between gap-4 z-30">
                <div className="flex items-center gap-3 min-w-0">
                  <img src={displayImage} alt={displayTitle} className="w-10 h-10 object-contain rounded-lg bg-white/10 p-1" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">{displayTitle}</p>
                    <p className="text-xs font-bold text-orange-400">
                      {(displayDiscount ?? displayPrice).toLocaleString("fr-FR")} FCFA
                    </p>
                  </div>
                </div>

                <Button
                  asChild
                  onClick={() => setIsModalOpen(false)}
                  className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl px-4 py-2 shrink-0"
                >
                  <Link href={targetProductUrl}>
                    <ShoppingBag className="w-3.5 h-3.5 mr-1.5" />
                    <span>Acheter maintenant</span>
                  </Link>
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Video Marquee */}
      <div className="mt-10 relative z-10">
        <VideoMarquee />
      </div>
    </section>
  );
}
