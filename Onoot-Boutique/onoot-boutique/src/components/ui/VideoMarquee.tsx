import React, { useEffect, useState } from "react";
import { Link } from "wouter";
import { Marquee } from "./marquee";
import { Flame, Sparkles, ArrowRight, Play, Volume2, VolumeX, Eye, Radio, Tag } from "lucide-react";

interface PromoVideoItem {
  _id: string;
  title: string;
  subtitle?: string;
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
  if (!badge) return "PROMO";
  return (
    badge
      .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{27BF}\u{2B50}\u{2B00}-\u{2BFF}\u{1F1E6}-\u{1F1FF}]/gu, "")
      .replace(/\p{Extended_Pictographic}/gu, "")
      .trim() || "PROMO"
  );
}

export function VideoMarquee() {
  const [videos, setVideos] = useState<PromoVideoItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/promo-videos?placement=marquee")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setVideos(data);
        }
      })
      .catch((err) => {
        console.warn("Could not fetch promo videos for marquee", err);
      })
      .finally(() => setLoading(false));
  }, []);

  // If no videos yet, do not render or show a subtle skeleton
  if (loading || videos.length === 0) {
    return null;
  }

  return (
    <section className="relative bg-gradient-to-r from-[#0b0f19] via-[#111827] to-[#0b0f19] border-y border-white/10 py-3 overflow-hidden shadow-inner select-none">
      {/* Decorative ambient lights */}
      <div className="absolute -top-12 left-1/4 w-72 h-20 bg-orange-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 right-1/4 w-72 h-20 bg-[#4BB5E8]/10 blur-3xl pointer-events-none" />

      {/* Marquee Header Tag */}
      <div className="container mx-auto px-4 mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Radio className="w-3.5 h-3.5 text-red-500 animate-pulse" />
          <span className="text-[11px] font-bold uppercase tracking-widest text-orange-400 flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-orange-500" />
            Vidéos & Publicités en direct
          </span>
        </div>
        <span className="text-[10px] text-gray-400 hidden sm:inline-block">
          Survolez pour mettre en pause • Cliquez pour voir le produit
        </span>
      </div>

      <Marquee className="[--duration:38s] [--gap:1.5rem] py-1" pauseOnHover repeat={4}>
        {videos.map((item) => {
          const discountPercent =
            item.price && item.discountPrice && item.discountPrice < item.price
              ? Math.round((1 - item.discountPrice / item.price) * 100)
              : null;

          const targetUrl = item.productLink && item.productLink !== "/products" 
            ? item.productLink 
            : (item.productId ? `/products/${item.productId}` : "/products");

          const thumb = item.thumbnailUrl || "/images/smartwatch.png";

          return (
            <Link
              key={item._id}
              href={targetUrl}
              className="group/card flex items-center gap-3.5 bg-white/[0.04] hover:bg-white/[0.09] border border-white/10 hover:border-orange-500/50 p-2 pr-4 rounded-2xl backdrop-blur-md transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-xl hover:shadow-orange-500/10 cursor-pointer text-white"
            >
              {/* Mini Video / Product Box */}
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-slate-900 flex-shrink-0 border border-white/15 group-hover/card:border-orange-500 transition-colors shadow-sm p-1">
                <img
                  src={thumb}
                  alt={item.title}
                  className="w-full h-full object-contain group-hover/card:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black/20 group-hover/card:bg-transparent transition-colors flex items-center justify-center">
                  <div className="w-6 h-6 rounded-full bg-black/60 backdrop-blur-xs flex items-center justify-center text-white/90 group-hover/card:scale-110 group-hover/card:bg-orange-500 transition-all shadow-md">
                    <Play className="w-2.5 h-2.5 ml-0.5 fill-current" />
                  </div>
                </div>
              </div>

              {/* Text / Details */}
              <div className="flex flex-col justify-center min-w-[150px] max-w-[220px]">
                {/* Badge */}
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full tracking-wider shadow-xs flex items-center gap-1">
                    <Flame className="w-2.5 h-2.5 text-white fill-white" />
                    <span>{cleanBadgeText(item.badge)}</span>
                  </span>
                  {discountPercent && (
                    <span className="text-[10px] font-bold text-amber-300">
                      -{discountPercent}%
                    </span>
                  )}
                </div>

                {/* Title */}
                <h4 className="text-xs font-bold text-gray-100 group-hover/card:text-orange-400 transition-colors truncate">
                  {item.title}
                </h4>

                {/* Subtitle / Product name */}
                <p className="text-[11px] text-gray-400 truncate">
                  {item.productName || item.subtitle || "Voir le produit"}
                </p>

                {/* Pricing & CTA */}
                <div className="flex items-center justify-between mt-1 pt-1 border-t border-white/5">
                  <div className="flex items-center gap-1.5 text-xs">
                    {item.discountPrice ? (
                      <>
                        <span className="font-extrabold text-orange-400">
                          {item.discountPrice.toLocaleString("fr-FR")} F
                        </span>
                        <span className="text-[10px] text-gray-400 line-through">
                          {item.price?.toLocaleString("fr-FR")} F
                        </span>
                      </>
                    ) : item.price ? (
                      <span className="font-bold text-gray-200">
                        {item.price.toLocaleString("fr-FR")} F
                      </span>
                    ) : (
                      <span className="text-[10px] text-orange-400 font-semibold">Exclusivité</span>
                    )}
                  </div>

                  <span className="w-5 h-5 rounded-full bg-white/10 group-hover/card:bg-orange-500 text-white flex items-center justify-center transition-colors">
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </Marquee>
    </section>
  );
}
