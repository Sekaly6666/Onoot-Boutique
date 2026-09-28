import React, { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
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
  Tag
} from "lucide-react";
import { Button } from "./button";
import { VideoMarquee } from "./VideoMarquee";

interface PromoVideo {
  _id: string;
  title: string;
  subtitle?: string;
  description?: string;
  videoUrl: string;
  thumbnailUrl?: string;
  productLink?: string;
  productName?: string;
  price?: number;
  discountPrice?: number;
  badge?: string;
  viewsCount?: number;
}

function cleanBadgeText(badge?: string): string {
  if (!badge) return "EN VEDETTE";
  return (
    badge
      .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{27BF}\u{2B50}\u{2B00}-\u{2BFF}\u{1F1E6}-\u{1F1FF}]/gu, "")
      .replace(/\p{Extended_Pictographic}/gu, "")
      .trim() || "EN VEDETTE"
  );
}

export function VideoShowcase() {
  const [videos, setVideos] = useState<PromoVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const modalVideoRef = useRef<HTMLVideoElement>(null);

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

  // Handle active video time update
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      const duration = videoRef.current.duration || 1;
      setProgress((current / duration) * 100);
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  // Change video selection
  const selectVideo = (index: number) => {
    setSelectedIndex(index);
    setProgress(0);
    setIsPlaying(true);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
    }
    // Track view
    if (videos[index]) {
      fetch(`/api/promo-videos/${videos[index]._id}/view`, { method: "POST" }).catch(() => {});
    }
  };

  if (loading || !activeVideo) {
    return null;
  }

  const hasDiscount =
    activeVideo.price &&
    activeVideo.discountPrice &&
    activeVideo.discountPrice < activeVideo.price;

  return (
    <section className="py-16 bg-gradient-to-b from-gray-950 via-[#0a0f1d] to-gray-950 text-white relative overflow-hidden">
      {/* Background neon ambient shapes */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-[#4BB5E8]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/20 border border-orange-500/30 text-orange-400 text-xs font-bold uppercase tracking-wider mb-3 backdrop-blur-md">
              <Tv className="w-3.5 h-3.5" />
              <span>Espace Démonstrations & Publicités</span>
            </div>
            <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight">
              Onoot Live & Démos Vidéos
            </h2>
            <p className="text-gray-400 text-sm md:text-base mt-1.5 max-w-xl">
              Découvrez nos accessoires phares en conditions réelles, tests qualité et présentations vidéo exclusives.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>Flux interactif • {videos.length} vidéos disponibles</span>
          </div>
        </div>

        {/* Main Showcase Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Cinematic Video Player (7 Cols on large) */}
          <div className="lg:col-span-8 flex flex-col">
            <div className="relative aspect-video rounded-3xl overflow-hidden bg-black border border-white/10 shadow-2xl shadow-black/80 group flex items-center justify-center">
              {/* HTML5 Video element */}
              <video
                ref={videoRef}
                key={activeVideo._id}
                src={activeVideo.videoUrl}
                poster={activeVideo.thumbnailUrl}
                autoPlay
                playsInline
                muted={isMuted}
                loop
                onTimeUpdate={handleTimeUpdate}
                onClick={togglePlay}
                className="w-full h-full object-contain cursor-pointer"
              />

              {/* Top Bar on video */}
              <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none z-20">
                <div className="flex items-center gap-2">
                  <span className="bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-extrabold uppercase px-3 py-1 rounded-full shadow-lg backdrop-blur-md flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5" />
                    <span>{cleanBadgeText(activeVideo.badge)}</span>
                  </span>
                  {activeVideo.viewsCount ? (
                    <span className="bg-black/50 backdrop-blur-md text-gray-300 text-xs px-2.5 py-1 rounded-full flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {activeVideo.viewsCount.toLocaleString("fr-FR")} vues
                    </span>
                  ) : null}
                </div>

                <div className="flex items-center gap-2 pointer-events-auto">
                  {/* Sound toggle button */}
                  <button
                    onClick={toggleMute}
                    className="w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md text-white flex items-center justify-center transition-all transform hover:scale-105"
                    title={isMuted ? "Activer le son" : "Couper le son"}
                  >
                    {isMuted ? <VolumeX className="w-4 h-4 text-gray-300" /> : <Volume2 className="w-4 h-4 text-orange-400" />}
                  </button>

                  {/* Fullscreen Modal trigger */}
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md text-white flex items-center justify-center transition-all transform hover:scale-105"
                    title="Plein écran"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Center Play/Pause button on hover */}
              <div
                onClick={togglePlay}
                className="absolute inset-0 flex items-center justify-center cursor-pointer pointer-events-none"
              >
                {!isPlaying && (
                  <div className="w-16 h-16 rounded-full bg-orange-500/90 text-white flex items-center justify-center shadow-2xl backdrop-blur-sm pointer-events-auto transform hover:scale-110 transition-transform">
                    <Play className="w-7 h-7 ml-1 fill-white" />
                  </div>
                )}
              </div>

              {/* Bottom Progress Bar */}
              <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/20 z-20">
                <div
                  className="h-full bg-gradient-to-r from-orange-500 to-amber-400 transition-all duration-150"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Video Info Card below player */}
            <div className="mt-4 p-5 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <span>{activeVideo.title}</span>
                </h3>
                {activeVideo.subtitle && (
                  <p className="text-sm text-orange-400 font-medium">{activeVideo.subtitle}</p>
                )}
                {activeVideo.description && (
                  <p className="text-xs text-gray-400 max-w-xl">{activeVideo.description}</p>
                )}
              </div>

              {/* Price & CTA Button */}
              <div className="flex items-center gap-4 flex-shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-white/10">
                {activeVideo.price && (
                  <div className="text-right">
                    {hasDiscount ? (
                      <>
                        <div className="text-xl font-extrabold text-orange-400">
                          {activeVideo.discountPrice?.toLocaleString("fr-FR")} FCFA
                        </div>
                        <div className="text-xs text-gray-400 line-through">
                          {activeVideo.price.toLocaleString("fr-FR")} FCFA
                        </div>
                      </>
                    ) : (
                      <div className="text-xl font-extrabold text-white">
                        {activeVideo.price.toLocaleString("fr-FR")} FCFA
                      </div>
                    )}
                  </div>
                )}

                <Button
                  asChild
                  className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-orange-500/25 transition-all transform hover:scale-102"
                >
                  <Link href={activeVideo.productLink || "/products"}>
                    <ShoppingBag className="w-4 h-4 mr-2" />
                    <span>Commander</span>
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          {/* Playlist / Thumbnails Sidebar (4 Cols on large) */}
          <div className="lg:col-span-4 flex flex-col space-y-3">
            <div className="flex items-center justify-between px-1 mb-1">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-300">
                Toutes les vidéos ({videos.length})
              </h4>
              <span className="text-[11px] text-orange-400">Cliquez pour lire</span>
            </div>

            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
              {videos.map((item, idx) => {
                const isCurrent = idx === selectedIndex;
                return (
                  <motion.div
                    key={item._id}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => selectVideo(idx)}
                    className={`flex items-center gap-3.5 p-3 rounded-2xl cursor-pointer transition-all duration-200 border ${
                      isCurrent
                        ? "bg-white/[0.08] border-orange-500 shadow-lg shadow-orange-500/10 ring-1 ring-orange-500/30"
                        : "bg-white/[0.02] hover:bg-white/[0.05] border-white/10"
                    }`}
                  >
                    {/* Thumbnail */}
                    <div className="relative w-24 h-16 rounded-xl overflow-hidden bg-black flex-shrink-0 border border-white/10">
                      <video
                        src={item.videoUrl}
                        poster={item.thumbnailUrl}
                        muted
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center ${
                            isCurrent ? "bg-orange-500 text-white" : "bg-black/60 text-white/80"
                          }`}
                        >
                          <Play className="w-3 h-3 ml-0.5 fill-current" />
                        </div>
                      </div>
                      {isCurrent && (
                        <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-orange-500 text-[9px] font-bold text-white uppercase">
                          En cours
                        </div>
                      )}
                    </div>

                    {/* Meta */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1 mb-0.5">
                        <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center gap-1">
                          <Flame className="w-2.5 h-2.5" />
                          <span>{cleanBadgeText(item.badge)}</span>
                        </span>
                      </div>
                      <h5
                        className={`text-xs font-bold truncate ${
                          isCurrent ? "text-orange-400" : "text-gray-200"
                        }`}
                      >
                        {item.title}
                      </h5>
                      <p className="text-[11px] text-gray-400 truncate mt-0.5">
                        {item.productName || item.subtitle || "Voir le produit"}
                      </p>
                      {item.price && (
                        <p className="text-[11px] font-semibold text-gray-300 mt-1">
                          {item.discountPrice
                            ? `${item.discountPrice.toLocaleString("fr-FR")} F`
                            : `${item.price.toLocaleString("fr-FR")} F`}
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
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-lg flex items-center justify-center p-4"
          >
            <div className="relative w-full max-w-4xl aspect-video bg-black rounded-3xl overflow-hidden border border-white/20 shadow-2xl">
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 z-30 p-2 rounded-full bg-black/60 text-white hover:bg-white hover:text-black transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              <video
                ref={modalVideoRef}
                src={activeVideo.videoUrl}
                autoPlay
                controls
                className="w-full h-full object-contain"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Video Marquee: défile en bas de la section ── */}
      <div className="mt-10 -mx-0 relative z-10">
        <VideoMarquee />
      </div>
    </section>
  );
}
