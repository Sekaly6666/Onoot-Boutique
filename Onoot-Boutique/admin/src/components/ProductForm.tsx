import React, { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import toast from 'react-hot-toast';
import { Check, ChevronDown, ImageIcon, Package, Video, X, RefreshCw, Eye, Upload, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { parseVideoSource, resolveMediaUrl, uploadMediaFile } from '../utils/videoUtils';

export interface CategoryOption {
  name: string;
  slug: string;
}

export interface ProductInput {
  name: string;
  description?: string;
  category: string;
  price: number;
  discountPrice?: number;
  stock: number;
  imageUrl?: string;
  images?: string[];
  videoUrls?: string[];
  flashSaleStart?: Date;
  flashSaleEnd?: Date;
  flashSaleEndDate?: string;
  status?: string;
  featured?: boolean;
  newArrival?: boolean;
  bestSeller?: boolean;
  flashSale?: boolean;
  video?: string;
  externalLink?: string;
}

interface ProductFormProps {
  categories: CategoryOption[];
  onClose: () => void;
  onSubmit: (product: ProductInput) => void | Promise<void>;
  initialProduct?: ProductInput;
  submitLabel?: string;
}

const inputClass = 'w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all';
const labelClass = 'block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5';

const SectionHeader = ({ icon: Icon, title }: { icon: any; title: string }) => (
  <div className="flex items-center gap-2 pb-2 border-b border-border mb-4">
    <div className="p-1.5 rounded-lg bg-primary/10"><Icon className="w-4 h-4 text-primary" /></div>
    <h3 className="font-semibold text-foreground text-sm">{title}</h3>
  </div>
);

const ToggleBox = ({ checked, label, onChange }: { checked: boolean; label: string; onChange: (checked: boolean) => void }) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${checked ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-background text-foreground hover:border-primary/50'}`}
  >
    <span className={`flex h-4 w-4 items-center justify-center rounded border ${checked ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/40'}`}>
      {checked && <Check className="h-3 w-3" />}
    </span>
    {label}
  </button>
);

const toDateTimeLocal = (value?: string | Date) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return offsetDate.toISOString().slice(0, 16);
};

const ProductForm: React.FC<ProductFormProps> = ({ categories, onClose, onSubmit, initialProduct, submitLabel = 'Ajouter' }) => {
  const [name, setName] = useState(initialProduct?.name || '');
  const [description, setDescription] = useState(initialProduct?.description || '');
  const [category, setCategory] = useState(initialProduct?.category || '');
  const [price, setPrice] = useState(initialProduct ? String(initialProduct.price) : '');
  const [discountPrice, setDiscountPrice] = useState(initialProduct?.discountPrice ? String(initialProduct.discountPrice) : '');
  const [stock, setStock] = useState(initialProduct ? String(initialProduct.stock) : '');
  
  const [imageUrl, setImageUrl] = useState(resolveMediaUrl(initialProduct?.imageUrl || initialProduct?.images?.[0] || ''));
  const [imagePreview, setImagePreview] = useState(resolveMediaUrl(initialProduct?.imageUrl || initialProduct?.images?.[0] || ''));
  const [imageError, setImageError] = useState(false);
  
  const [status, setStatus] = useState(initialProduct?.status || 'Publié');
  
  const initialVid = initialProduct?.video || initialProduct?.videoUrls?.[0] || '';
  const [videoUrl, setVideoUrl] = useState(initialVid);
  const [videoPreview, setVideoPreview] = useState(initialVid);
  
  const [featured, setFeatured] = useState(Boolean(initialProduct?.featured));
  const [newArrival, setNewArrival] = useState(Boolean(initialProduct?.newArrival));
  const [bestSeller, setBestSeller] = useState(Boolean(initialProduct?.bestSeller));
  const [flashSale, setFlashSale] = useState(Boolean(initialProduct?.flashSale));
  const [flashSaleEndDate, setFlashSaleEndDate] = useState(toDateTimeLocal(initialProduct?.flashSaleEndDate || initialProduct?.flashSaleEnd));
  
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);

  // Track object URLs to revoke them on unmount to avoid memory leaks
  const objectUrls = useRef<string[]>([]);
  useEffect(() => {
    return () => {
      objectUrls.current.forEach((u) => {
        try { URL.revokeObjectURL(u); } catch {}
      });
    };
  }, []);

  useEffect(() => {
    setName(initialProduct?.name || '');
    setDescription(initialProduct?.description || '');
    setCategory(initialProduct?.category || '');
    setPrice(initialProduct ? String(initialProduct.price) : '');
    setDiscountPrice(initialProduct?.discountPrice ? String(initialProduct.discountPrice) : '');
    setStock(initialProduct ? String(initialProduct.stock) : '');
    
    const initImg = resolveMediaUrl(initialProduct?.imageUrl || initialProduct?.images?.[0] || '');
    setImageUrl(initImg);
    setImagePreview(initImg);
    setImageError(false);
    
    setStatus(initialProduct?.status || 'Publié');
    
    const vid = initialProduct?.video || initialProduct?.videoUrls?.[0] || '';
    setVideoUrl(vid);
    setVideoPreview(vid);
    
    setFeatured(Boolean(initialProduct?.featured));
    setNewArrival(Boolean(initialProduct?.newArrival));
    setBestSeller(Boolean(initialProduct?.bestSeller));
    setFlashSale(Boolean(initialProduct?.flashSale));
    setFlashSaleEndDate(toDateTimeLocal(initialProduct?.flashSaleEndDate || initialProduct?.flashSaleEnd));
  }, [initialProduct]);

  const handleImageFile = async (file: File) => {
    const previewUrl = URL.createObjectURL(file);
    objectUrls.current.push(previewUrl);
    setImagePreview(previewUrl);
    setImageError(false);
    setIsUploadingImage(true);
    
    try {
      const result = await uploadMediaFile(file);
      setImageUrl(result.absoluteUrl);
      setImagePreview(result.absoluteUrl);
      toast.success('Image importée avec succès !');
    } catch (err: any) {
      console.error('Erreur image:', err);
      toast.error(err.message || "Erreur lors de l'envoi de l'image");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleVideoFile = async (file: File) => {
    // Instant local preview
    const previewUrl = URL.createObjectURL(file);
    objectUrls.current.push(previewUrl);
    setVideoPreview(previewUrl);
    setIsUploadingVideo(true);

    try {
      const result = await uploadMediaFile(file);
      setVideoUrl(result.absoluteUrl);
      setVideoPreview(result.absoluteUrl);
      toast.success('Vidéo importée avec succès !');
    } catch (err: any) {
      console.error('Erreur vidéo:', err);
      toast.error(err.message || "Erreur lors de l'importation de la vidéo. Vérifiez le format ou la taille.");
    } finally {
      setIsUploadingVideo(false);
    }
  };

  const handleVideoUrlChange = (val: string) => {
    setVideoUrl(val);
    setVideoPreview(val.trim());
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isUploadingImage || isUploadingVideo) {
      toast.error("Veuillez patienter pendant la fin de l'envoi du média.");
      return;
    }

    setIsSaving(true);
    try {
      const priceNum = Number(price);
      const stockNum = Number(stock);
      const discountPriceNum = discountPrice ? Number(discountPrice) : undefined;

      const trimmedImg = imageUrl.trim();
      const finalImageUrl = trimmedImg ? resolveMediaUrl(trimmedImg) : undefined;

      let finalVideoUrl: string | undefined = undefined;
      const trimmedVid = videoUrl.trim();
      if (trimmedVid) {
        const parsed = parseVideoSource(trimmedVid);
        finalVideoUrl = parsed.isEmbed && parsed.embedUrl ? parsed.embedUrl : (parsed.url || trimmedVid);
      }

      await onSubmit({
        name,
        description: description.trim() || undefined,
        category: category || 'autre',
        price: Number.isNaN(priceNum) ? 0 : priceNum,
        discountPrice: discountPriceNum && !Number.isNaN(discountPriceNum) ? discountPriceNum : undefined,
        stock: Number.isNaN(stockNum) ? 0 : stockNum,
        imageUrl: finalImageUrl,
        images: finalImageUrl ? [finalImageUrl] : undefined,
        video: finalVideoUrl,
        videoUrls: finalVideoUrl ? [finalVideoUrl] : undefined,
        status,
        featured,
        newArrival,
        bestSeller,
        flashSale,
        flashSaleEndDate: flashSale && flashSaleEndDate ? new Date(flashSaleEndDate).toISOString() : undefined,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const parsedVideo = parseVideoSource(videoPreview || videoUrl);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50 p-4">
      <motion.div initial={{ opacity: 0, scale: 0.96, y: 18 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 18 }} className="bg-card rounded-2xl shadow-2xl w-full max-w-2xl border border-border relative max-h-[92vh] flex flex-col overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-border bg-muted/30 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-foreground">{initialProduct ? 'Modifier le produit' : 'Ajouter un produit'}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Catalogue Onoot Boutique</p>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-4 sm:p-6 space-y-6 overflow-y-auto flex-1">
            {/* Informations Générales */}
            <div className="space-y-4">
              <SectionHeader icon={Package} title="Informations générales" />
              <div>
                <label className={labelClass}>Nom du produit *</label>
                <input type="text" placeholder="Ex: Coque Premium iPhone 15" value={name} onChange={(e) => setName(e.target.value)} required className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Description</label>
                <textarea placeholder="Description complète du produit..." value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className={inputClass + ' resize-none'} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Prix (FCFA) *</label>
                  <input type="number" min="0" placeholder="0" value={price} onChange={(e) => setPrice(e.target.value)} required className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Prix promo (FCFA)</label>
                  <input type="number" min="0" placeholder="Optionnel" value={discountPrice} onChange={(e) => setDiscountPrice(e.target.value)} className={inputClass} />
                </div>
              </div>
            </div>

            {/* Catégorie & Stock */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className={labelClass}>Catégorie</label>
                <div className="relative">
                  <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass + ' appearance-none pr-8'}>
                    <option value="">Sélectionner une catégorie</option>
                    {categories.map((cat) => <option key={cat.slug} value={cat.slug}>{cat.name}</option>)}
                    <option value="autre">Autre</option>
                  </select>
                  <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                </div>
              </div>
              <div>
                <label className={labelClass}>Stock</label>
                <input type="number" min="0" placeholder="0" value={stock} onChange={(e) => setStock(e.target.value)} required className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Statut</label>
                <select value={status} onChange={(e) => setStatus(e.target.value as any)} className={inputClass + ' appearance-none pr-8'}>
                  <option value="Publié">Publié</option>
                  <option value="Brouillon">Brouillon</option>
                  <option value="En attente">En attente</option>
                </select>
              </div>
            </div>

            {/* Sections d'affichage */}
            <div>
              <SectionHeader icon={Check} title="Sections d'affichage" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <ToggleBox checked={featured} label="En vedette" onChange={setFeatured} />
                <ToggleBox checked={newArrival} label="Nouveauté" onChange={setNewArrival} />
                <ToggleBox checked={bestSeller} label="Meilleure vente" onChange={setBestSeller} />
                <ToggleBox checked={flashSale} label="Vente Flash" onChange={setFlashSale} />
              </div>
              {flashSale && (
                <div className="mt-3">
                  <label className={labelClass}>Date et heure de fin de vente flash</label>
                  <input type="datetime-local" value={flashSaleEndDate} onChange={(e) => setFlashSaleEndDate(e.target.value)} className={inputClass} />
                </div>
              )}
            </div>

            {/* Image Section */}
            <div className="p-4 rounded-2xl bg-muted/40 border border-border space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-primary/10">
                    <ImageIcon className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground text-sm">Image principale du produit</h3>
                    <p className="text-[11px] text-muted-foreground">Visible sur PC, tablette et téléphone dans la boutique et l'admin.</p>
                  </div>
                </div>
                {imagePreview && !imageError && (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 flex items-center gap-1">
                    <Check className="w-3 h-3" /> Image prête
                  </span>
                )}
              </div>

              <div>
                <label className={labelClass}>Lien direct de l'image (URL Web)</label>
                <input
                  type="text"
                  placeholder="https://images.unsplash.com/... ou lien d'image"
                  value={imageUrl}
                  onChange={(e) => {
                    const val = e.target.value;
                    setImageUrl(val);
                    setImagePreview(resolveMediaUrl(val));
                    setImageError(false);
                  }}
                  className={inputClass}
                />
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
                <label className="flex-shrink-0 px-4 py-2.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-xl text-xs font-bold cursor-pointer flex items-center justify-center gap-2 transition-all">
                  <Upload className="w-4 h-4" />
                  <span>Choisir depuis PC / Téléphone</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/jpg,image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageFile(file);
                    }}
                    className="hidden"
                  />
                </label>
                <span className="text-[11px] text-muted-foreground text-center sm:text-left">
                  Formats acceptés : JPG, PNG, WEBP (Photos de votre galerie ou appareil)
                </span>
              </div>

              {isUploadingImage && (
                <div className="p-3 bg-primary/5 border border-primary/20 rounded-xl flex items-center gap-2 text-xs text-primary font-medium">
                  <RefreshCw className="w-4 h-4 animate-spin flex-shrink-0" />
                  <span>Téléversement de l'image en cours depuis votre appareil...</span>
                </div>
              )}

              {/* Image Preview Box */}
              <div className="relative w-full h-48 rounded-xl border border-dashed border-border bg-black/5 dark:bg-black/30 flex items-center justify-center overflow-hidden">
                {imagePreview && !imageError ? (
                  <div className="relative w-full h-full group flex items-center justify-center">
                    <img
                      src={imagePreview}
                      alt="Aperçu du produit"
                      className="h-full w-full object-contain p-2"
                      onError={() => setImageError(true)}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImageUrl('');
                        setImagePreview('');
                        setImageError(false);
                      }}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 hover:bg-red-600 text-white transition-colors z-20 shadow-md"
                      title="Supprimer l'image"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground p-4 text-center">
                    <ImageIcon className="w-8 h-8 opacity-40" />
                    <span className="text-xs">
                      {imageError ? "Impossible de charger l'image (Vérifiez le lien)" : "Aucune image sélectionnée — L'aperçu apparaîtra ici"}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Video Section */}
            <div className="p-4 rounded-2xl bg-muted/40 border border-border space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-orange-500/10">
                    <Video className="w-4 h-4 text-orange-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground text-sm">Vidéo du produit</h3>
                    <p className="text-[11px] text-muted-foreground">Compatible YouTube, Facebook Reels, TikTok, Vimeo ou fichier direct de votre PC/téléphone.</p>
                  </div>
                </div>
                {videoPreview && (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 flex items-center gap-1">
                    <Check className="w-3 h-3" /> Vidéo prête
                  </span>
                )}
              </div>

              <div>
                <label className={labelClass}>Lien Vidéo (YouTube, Facebook, TikTok ou lien MP4)</label>
                <input
                  type="text"
                  placeholder="https://www.youtube.com/watch?v=... ou https://fb.watch/... ou .mp4"
                  value={videoUrl}
                  onChange={(e) => handleVideoUrlChange(e.target.value)}
                  className={inputClass}
                />
              </div>

              {/* Supported Links Badges */}
              <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                <span className="font-bold uppercase tracking-wider text-[10px] text-foreground">Liens compatibles :</span>
                <span className="px-2 py-0.5 rounded-md bg-red-500/10 text-red-600 dark:text-red-400 font-semibold border border-red-500/20">YouTube (Watch & Shorts)</span>
                <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold border border-blue-500/20">Facebook (Reels & Vidéos)</span>
                <span className="px-2 py-0.5 rounded-md bg-muted border border-border font-medium">TikTok</span>
                <span className="px-2 py-0.5 rounded-md bg-muted border border-border font-medium">Lien MP4 direct</span>
                <span className="px-2 py-0.5 rounded-md bg-muted border border-border font-medium">Vimeo / Dropbox</span>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
                <label className="flex-shrink-0 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold cursor-pointer flex items-center justify-center gap-2 shadow-sm transition-all">
                  <Upload className="w-4 h-4" />
                  <span>Prendre vidéo PC / Téléphone</span>
                  <input
                    type="file"
                    accept="video/mp4,video/webm,video/ogg,video/quicktime,video/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleVideoFile(file);
                    }}
                    className="hidden"
                  />
                </label>
                <span className="text-[11px] text-muted-foreground text-center sm:text-left">
                  Téléversez directement une vidéo depuis votre appareil (jusqu'à 500 Mo).
                </span>
              </div>

              {isUploadingVideo && (
                <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-xl flex items-center gap-2 text-xs text-orange-600 dark:text-orange-400 font-medium">
                  <RefreshCw className="w-4 h-4 animate-spin flex-shrink-0" />
                  <span>Téléversement de la vidéo en cours... Veuillez patienter quelques instants.</span>
                </div>
              )}

              {/* Video Preview Player */}
              <div className="pt-2">
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-orange-500" />
                  <span>Aperçu du lecteur vidéo :</span>
                </p>
                <div className={`relative ${videoPreview && (videoPreview.includes('/reel/') || videoPreview.includes('/shorts/') || videoPreview.includes('tiktok.com')) ? 'h-64 aspect-[9/16]' : 'aspect-video max-h-52'} rounded-xl overflow-hidden bg-black mx-auto border border-border shadow-inner flex items-center justify-center`}>
                  {parsedVideo.embedUrl ? (
                    <div className="relative w-full h-full group">
                      <iframe
                        src={parsedVideo.embedUrl}
                        className="w-full h-full border-0"
                        allow="autoplay; encrypted-media; fullscreen"
                        allowFullScreen
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setVideoUrl('');
                          setVideoPreview('');
                        }}
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 hover:bg-red-600 text-white transition-colors z-20 shadow-md"
                        title="Supprimer la vidéo"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (parsedVideo.url || videoPreview) ? (
                    <div className="relative w-full h-full group flex items-center justify-center bg-black/95">
                      <video
                        key={parsedVideo.url || videoPreview}
                        src={parsedVideo.url || videoPreview}
                        controls
                        playsInline
                        className="h-full w-full object-contain"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setVideoUrl('');
                          setVideoPreview('');
                        }}
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 hover:bg-red-600 text-white transition-colors z-20 shadow-md"
                        title="Supprimer la vidéo"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground p-4 text-center">
                      <Video className="w-8 h-8 opacity-40 text-orange-500" />
                      <span className="text-xs">Aucune vidéo renseignée — L'aperçu vidéo apparaîtra ici</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end items-center gap-3 px-6 py-4 border-t border-border bg-muted/20 flex-shrink-0">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl bg-muted hover:bg-border text-foreground font-medium transition-colors">
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSaving || isUploadingImage || isUploadingVideo}
              className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground hover:opacity-95 disabled:opacity-50 font-semibold shadow-md transition-all active:scale-95"
            >
              {isSaving ? 'Enregistrement en cours...' : submitLabel}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default ProductForm;
