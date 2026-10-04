import React, { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import toast from 'react-hot-toast';
import { 
  Check, 
  ChevronDown, 
  ImageIcon, 
  Package, 
  Video, 
  X, 
  RefreshCw, 
  Eye, 
  Upload, 
  Trash2, 
  Plus, 
  Sparkles, 
  Layers, 
  ExternalLink,
  Film
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  parseVideoSource, 
  resolveMediaUrl, 
  uploadMediaFile, 
  captureVideoFrame 
} from '../utils/videoUtils';

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
  video?: string;
  videoUrls?: string[];
  flashSaleStart?: Date;
  flashSaleEnd?: Date;
  flashSaleEndDate?: string;
  status?: string;
  featured?: boolean;
  newArrival?: boolean;
  bestSeller?: boolean;
  flashSale?: boolean;
  externalLink?: string;
}

export interface VideoItem {
  url: string;
  thumbnail?: string;
  platform?: string;
  label?: string;
}

interface ProductFormProps {
  categories: CategoryOption[];
  onClose: () => void;
  onSubmit: (product: ProductInput | ProductInput[]) => void | Promise<void>;
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
  const isEditing = Boolean(initialProduct);

  const [name, setName] = useState(initialProduct?.name || '');
  const [description, setDescription] = useState(initialProduct?.description || '');
  const [category, setCategory] = useState(initialProduct?.category || '');
  const [price, setPrice] = useState(initialProduct ? String(initialProduct.price) : '');
  const [discountPrice, setDiscountPrice] = useState(initialProduct?.discountPrice ? String(initialProduct.discountPrice) : '');
  const [stock, setStock] = useState(initialProduct ? String(initialProduct.stock) : '');
  const [status, setStatus] = useState(initialProduct?.status || 'Publié');

  // Images list state
  const initialImages: string[] = initialProduct?.images?.length
    ? initialProduct.images.map(resolveMediaUrl)
    : initialProduct?.imageUrl
    ? [resolveMediaUrl(initialProduct.imageUrl)]
    : [];
  const [imagesList, setImagesList] = useState<string[]>(initialImages);
  const [singleImageUrlInput, setSingleImageUrlInput] = useState('');
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [uploadImagesProgress, setUploadImagesProgress] = useState({ current: 0, total: 0 });

  // Videos list state
  const initialVideos: VideoItem[] = initialProduct?.videoUrls?.length
    ? initialProduct.videoUrls.map((u) => {
        const parsed = parseVideoSource(u);
        return { url: parsed.url || u, thumbnail: parsed.thumbnail, platform: parsed.platform, label: parsed.label };
      })
    : initialProduct?.video
    ? (() => {
        const parsed = parseVideoSource(initialProduct.video);
        return [{ url: parsed.url || initialProduct.video, thumbnail: parsed.thumbnail, platform: parsed.platform, label: parsed.label }];
      })()
    : [];
  const [videosList, setVideosList] = useState<VideoItem[]>(initialVideos);
  const [singleVideoUrlInput, setSingleVideoUrlInput] = useState('');
  const [isUploadingVideos, setIsUploadingVideos] = useState(false);
  const [uploadVideosProgress, setUploadVideosProgress] = useState({ current: 0, total: 0 });

  const [featured, setFeatured] = useState(Boolean(initialProduct?.featured));
  const [newArrival, setNewArrival] = useState(Boolean(initialProduct?.newArrival));
  const [bestSeller, setBestSeller] = useState(Boolean(initialProduct?.bestSeller));
  const [flashSale, setFlashSale] = useState(Boolean(initialProduct?.flashSale));
  const [flashSaleEndDate, setFlashSaleEndDate] = useState(toDateTimeLocal(initialProduct?.flashSaleEndDate || (initialProduct as any)?.flashSaleEnd));

  const [isSaving, setIsSaving] = useState(false);

  // Track object URLs to revoke them on unmount
  const objectUrls = useRef<string[]>([]);
  useEffect(() => {
    return () => {
      objectUrls.current.forEach((u) => {
        try { URL.revokeObjectURL(u); } catch {}
      });
    };
  }, []);

  // Update when initialProduct changes
  useEffect(() => {
    if (initialProduct) {
      setName(initialProduct.name || '');
      setDescription(initialProduct.description || '');
      setCategory(initialProduct.category || '');
      setPrice(String(initialProduct.price));
      setDiscountPrice(initialProduct.discountPrice ? String(initialProduct.discountPrice) : '');
      setStock(String(initialProduct.stock));
      setStatus(initialProduct.status || 'Publié');

      const imgs = initialProduct.images?.length
        ? initialProduct.images.map(resolveMediaUrl)
        : initialProduct.imageUrl
        ? [resolveMediaUrl(initialProduct.imageUrl)]
        : [];
      setImagesList(imgs);

      const vids: VideoItem[] = initialProduct.videoUrls?.length
        ? initialProduct.videoUrls.map((u) => {
            const parsed = parseVideoSource(u);
            return { url: parsed.url || u, thumbnail: parsed.thumbnail, platform: parsed.platform, label: parsed.label };
          })
        : initialProduct.video
        ? (() => {
            const parsed = parseVideoSource(initialProduct.video);
            return [{ url: parsed.url || initialProduct.video, thumbnail: parsed.thumbnail, platform: parsed.platform, label: parsed.label }];
          })()
        : [];
      setVideosList(vids);

      setFeatured(Boolean(initialProduct.featured));
      setNewArrival(Boolean(initialProduct.newArrival));
      setBestSeller(Boolean(initialProduct.bestSeller));
      setFlashSale(Boolean(initialProduct.flashSale));
      setFlashSaleEndDate(toDateTimeLocal(initialProduct.flashSaleEndDate || (initialProduct as any)?.flashSaleEnd));
    }
  }, [initialProduct]);

  // Handle uploading multiple image files
  const handleMultipleImageFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const fileArray = Array.from(files);

    setIsUploadingImages(true);
    setUploadImagesProgress({ current: 0, total: fileArray.length });

    const newUrls: string[] = [];
    let successCount = 0;

    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      setUploadImagesProgress({ current: i + 1, total: fileArray.length });
      try {
        const result = await uploadMediaFile(file);
        newUrls.push(result.absoluteUrl);
        successCount++;
      } catch (err: any) {
        console.error(`Erreur d'importation pour ${file.name}:`, err);
        toast.error(`Erreur pour "${file.name}": ${err.message || 'Échec de téléversement'}`);
      }
    }

    setIsUploadingImages(false);
    if (newUrls.length > 0) {
      setImagesList((prev) => [...prev, ...newUrls]);
      toast.success(`${successCount} image(s) ajoutée(s) avec succès !`);
    }
  };

  // Add image URL manually
  const handleAddImageUrl = () => {
    const trimmed = singleImageUrlInput.trim();
    if (!trimmed) return;
    const resolved = resolveMediaUrl(trimmed);
    if (imagesList.includes(resolved)) {
      toast.error('Cette image est déjà dans la liste');
      return;
    }
    setImagesList((prev) => [...prev, resolved]);
    setSingleImageUrlInput('');
    toast.success('Image ajoutée à la liste !');
  };

  // Remove image from list
  const handleRemoveImage = (indexToRemove: number) => {
    setImagesList((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // Handle uploading multiple video files
  const handleMultipleVideoFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const fileArray = Array.from(files);

    setIsUploadingVideos(true);
    setUploadVideosProgress({ current: 0, total: fileArray.length });

    const newVideos: VideoItem[] = [];
    let successCount = 0;

    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      setUploadVideosProgress({ current: i + 1, total: fileArray.length });
      try {
        // Try extracting thumbnail frame first
        let thumbnailBlob: Blob | null = null;
        try {
          thumbnailBlob = await captureVideoFrame(file);
        } catch {}

        let thumbnailUrl = '';
        if (thumbnailBlob) {
          try {
            const thumbFile = new File([thumbnailBlob], `thumb-${Date.now()}.jpg`, { type: 'image/jpeg' });
            const thumbRes = await uploadMediaFile(thumbFile);
            thumbnailUrl = thumbRes.absoluteUrl;
          } catch {}
        }

        const videoRes = await uploadMediaFile(file);
        newVideos.push({
          url: videoRes.absoluteUrl,
          thumbnail: thumbnailUrl || undefined,
          platform: 'direct',
          label: file.name.slice(0, 24),
        });
        successCount++;
      } catch (err: any) {
        console.error(`Erreur d'importation pour ${file.name}:`, err);
        toast.error(`Erreur vidéo "${file.name}": ${err.message || 'Échec de téléversement'}`);
      }
    }

    setIsUploadingVideos(false);
    if (newVideos.length > 0) {
      setVideosList((prev) => [...prev, ...newVideos]);
      toast.success(`${successCount} vidéo(s) ajoutée(s) avec succès !`);
    }
  };

  // Add video URL manually (YouTube, Facebook, TikTok, MP4 direct)
  const handleAddVideoUrl = () => {
    const trimmed = singleVideoUrlInput.trim();
    if (!trimmed) return;
    const parsed = parseVideoSource(trimmed);
    const finalUrl = parsed.url || trimmed;

    if (videosList.some((v) => v.url === finalUrl)) {
      toast.error('Cette vidéo est déjà dans la liste');
      return;
    }

    setVideosList((prev) => [
      ...prev,
      {
        url: finalUrl,
        thumbnail: parsed.thumbnail || undefined,
        platform: parsed.platform,
        label: parsed.label,
      },
    ]);
    setSingleVideoUrlInput('');
    toast.success(`Vidéo ${parsed.label} ajoutée à la liste !`);
  };

  // Remove video from list
  const handleRemoveVideo = (indexToRemove: number) => {
    setVideosList((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // Total medias count
  const totalMedias = imagesList.length + videosList.length;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isUploadingImages || isUploadingVideos) {
      toast.error("Veuillez patienter pendant la fin de l'envoi des médias.");
      return;
    }

    setIsSaving(true);
    try {
      const priceNum = Number(price);
      const stockNum = Number(stock);
      const discountPriceNum = discountPrice ? Number(discountPrice) : undefined;

      const commonFields: Omit<ProductInput, 'imageUrl' | 'images' | 'video' | 'videoUrls'> = {
        name,
        description: description.trim() || undefined,
        category: category || 'autre',
        price: Number.isNaN(priceNum) ? 0 : priceNum,
        discountPrice: discountPriceNum && !Number.isNaN(discountPriceNum) ? discountPriceNum : undefined,
        stock: Number.isNaN(stockNum) ? 0 : stockNum,
        status,
        featured,
        newArrival,
        bestSeller,
        flashSale,
        flashSaleEndDate: flashSale && flashSaleEndDate ? new Date(flashSaleEndDate).toISOString() : undefined,
      };

      // Si on est en mode édition (mise à jour d'un produit existant)
      if (isEditing) {
        const primaryImage = imagesList[0] || undefined;
        const primaryVideo = videosList[0]?.url || undefined;
        await onSubmit({
          ...commonFields,
          imageUrl: primaryImage,
          images: imagesList.length > 0 ? imagesList : (primaryImage ? [primaryImage] : undefined),
          video: primaryVideo,
          videoUrls: videosList.length > 0 ? videosList.map((v) => v.url) : (primaryVideo ? [primaryVideo] : undefined),
        });
        return;
      }

      // Si on est en mode création (ajout de nouveaux produits)
      // Si l'administrateur a ajouté plusieurs images ou plusieurs vidéos :
      // On crée des produits individuels pour chaque média (séparés individuellement dans la boutique et catalogue)
      if (totalMedias > 1) {
        const productsToCreate: ProductInput[] = [];

        // 1. Un produit individuel pour chaque image
        imagesList.forEach((imgUrl) => {
          productsToCreate.push({
            ...commonFields,
            imageUrl: imgUrl,
            images: [imgUrl],
            video: undefined,
            videoUrls: undefined,
          });
        });

        // 2. Un produit individuel pour chaque vidéo
        videosList.forEach((vid) => {
          productsToCreate.push({
            ...commonFields,
            imageUrl: vid.thumbnail || undefined,
            images: vid.thumbnail ? [vid.thumbnail] : [],
            video: vid.url,
            videoUrls: [vid.url],
          });
        });

        await onSubmit(productsToCreate);
      } else if (totalMedias === 1) {
        // Un seul média au total
        if (imagesList.length === 1) {
          await onSubmit({
            ...commonFields,
            imageUrl: imagesList[0],
            images: [imagesList[0]],
          });
        } else if (videosList.length === 1) {
          const vid = videosList[0];
          await onSubmit({
            ...commonFields,
            imageUrl: vid.thumbnail || undefined,
            images: vid.thumbnail ? [vid.thumbnail] : [],
            video: vid.url,
            videoUrls: [vid.url],
          });
        }
      } else {
        // Aucun média renseigné
        await onSubmit({
          ...commonFields,
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50 p-3 sm:p-4">
      <motion.div initial={{ opacity: 0, scale: 0.96, y: 18 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 18 }} className="bg-card rounded-2xl shadow-2xl w-full max-w-3xl border border-border relative max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 border-b border-border bg-muted/30 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-foreground">
              {isEditing ? 'Modifier le produit' : 'Ajouter un ou plusieurs produits'}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Catalogue Onoot Boutique • Multi-images et multi-vidéos
            </p>
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
                <input 
                  type="text" 
                  placeholder="Ex: Coque Antichoc iPhone 15 Pro Max" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  required 
                  className={inputClass} 
                />
              </div>
              <div>
                <label className={labelClass}>Description</label>
                <textarea 
                  placeholder="Description complète du produit, caractéristiques..." 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                  rows={3} 
                  className={inputClass + ' resize-none'} 
                />
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
                <label className={labelClass}>Stock disponible</label>
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

            {/* Section Multi-Images */}
            <div className="p-4 sm:p-5 rounded-2xl bg-muted/30 border border-border space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-primary/10 text-primary">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                      <span>Images du produit</span>
                      <span className="px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary font-semibold">
                        {imagesList.length} ajoutée{imagesList.length > 1 ? 's' : ''}
                      </span>
                    </h3>
                    <p className="text-[11px] text-muted-foreground">
                      Sélectionnez plusieurs photos en même temps depuis votre appareil ou ajoutez des liens web.
                    </p>
                  </div>
                </div>
              </div>

              {/* Input lien URL image + bouton Ajouter */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Coller un lien d'image direct (https://...)"
                  value={singleImageUrlInput}
                  onChange={(e) => setSingleImageUrlInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddImageUrl();
                    }
                  }}
                  className={inputClass + ' flex-1'}
                />
                <button
                  type="button"
                  onClick={handleAddImageUrl}
                  disabled={!singleImageUrlInput.trim()}
                  className="px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-xs font-bold hover:opacity-90 disabled:opacity-40 transition-all flex items-center gap-1.5 shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Ajouter</span>
                </button>
              </div>

              {/* Bouton choix multi-fichiers */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <label className="flex-shrink-0 px-4 py-2.5 bg-primary/15 hover:bg-primary/25 text-primary border border-primary/20 rounded-xl text-xs font-bold cursor-pointer flex items-center justify-center gap-2 transition-all shadow-xs">
                  <Upload className="w-4 h-4" />
                  <span>Choisir plusieurs photos (PC / Téléphone)</span>
                  <input
                    type="file"
                    multiple
                    accept="image/png,image/jpeg,image/webp,image/jpg,image/*"
                    onChange={(e) => handleMultipleImageFiles(e.target.files)}
                    className="hidden"
                  />
                </label>
                <span className="text-[11px] text-muted-foreground text-center sm:text-left">
                  Vous pouvez sélectionner <strong>plusieurs photos à la fois</strong> dans votre galerie.
                </span>
              </div>

              {/* Indicateur de chargement multi-images */}
              {isUploadingImages && (
                <div className="p-3 bg-primary/10 border border-primary/20 rounded-xl flex items-center gap-2.5 text-xs text-primary font-medium animate-pulse">
                  <RefreshCw className="w-4 h-4 animate-spin flex-shrink-0" />
                  <span>
                    Téléversement des images en cours : {uploadImagesProgress.current} / {uploadImagesProgress.total}...
                  </span>
                </div>
              )}

              {/* Galerie d'aperçu des images ajoutées */}
              {imagesList.length > 0 ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
                    <span>Photos prêtes ({imagesList.length}) :</span>
                    <button
                      type="button"
                      onClick={() => setImagesList([])}
                      className="text-red-500 hover:underline text-[11px]"
                    >
                      Tout effacer
                    </button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
                    {imagesList.map((imgUrl, idx) => (
                      <motion.div
                        key={`${imgUrl}-${idx}`}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="group relative aspect-square rounded-xl border border-border bg-background overflow-hidden shadow-xs flex items-center justify-center p-1"
                      >
                        <img
                          src={imgUrl}
                          alt={`Aperçu image ${idx + 1}`}
                          className="w-full h-full object-contain rounded-lg"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/images/smartwatch.png';
                          }}
                        />
                        <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-black/70 text-[10px] text-white font-bold">
                          #{idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          className="absolute top-1.5 right-1.5 p-1 rounded-full bg-red-600/90 text-white hover:bg-red-700 transition-colors shadow-sm"
                          title="Supprimer cette image"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl border border-dashed border-border bg-black/5 dark:bg-black/20 text-center text-muted-foreground text-xs flex flex-col items-center gap-1.5">
                  <ImageIcon className="w-6 h-6 opacity-40" />
                  <span>Aucune image ajoutée pour le moment.</span>
                </div>
              )}
            </div>

            {/* Section Multi-Vidéos */}
            <div className="p-4 sm:p-5 rounded-2xl bg-muted/30 border border-border space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-orange-500/10 text-orange-500">
                    <Video className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                      <span>Vidéos du produit</span>
                      <span className="px-2 py-0.5 rounded-full text-xs bg-orange-500/10 text-orange-600 dark:text-orange-400 font-semibold">
                        {videosList.length} ajoutée{videosList.length > 1 ? 's' : ''}
                      </span>
                    </h3>
                    <p className="text-[11px] text-muted-foreground">
                      Sélectionnez plusieurs vidéos depuis votre appareil ou collez des liens YouTube, Facebook Reels, TikTok, MP4.
                    </p>
                  </div>
                </div>
              </div>

              {/* Input lien URL vidéo + bouton Ajouter */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Lien YouTube, Facebook Reel, TikTok, ou lien .mp4 direct"
                  value={singleVideoUrlInput}
                  onChange={(e) => setSingleVideoUrlInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddVideoUrl();
                    }
                  }}
                  className={inputClass + ' flex-1'}
                />
                <button
                  type="button"
                  onClick={handleAddVideoUrl}
                  disabled={!singleVideoUrlInput.trim()}
                  className="px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold disabled:opacity-40 transition-all flex items-center gap-1.5 shrink-0 shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Ajouter la vidéo</span>
                </button>
              </div>

              {/* Badges compatibilité liens */}
              <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                <span className="font-bold uppercase tracking-wider text-[10px] text-foreground">Compatible :</span>
                <span className="px-2 py-0.5 rounded-md bg-red-500/10 text-red-600 dark:text-red-400 font-semibold border border-red-500/20">YouTube</span>
                <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold border border-blue-500/20">Facebook Reels</span>
                <span className="px-2 py-0.5 rounded-md bg-muted border border-border font-medium">TikTok</span>
                <span className="px-2 py-0.5 rounded-md bg-muted border border-border font-medium">MP4 direct</span>
              </div>

              {/* Bouton choix multi-fichiers vidéos */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <label className="flex-shrink-0 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold cursor-pointer flex items-center justify-center gap-2 shadow-xs transition-all">
                  <Upload className="w-4 h-4" />
                  <span>Prendre plusieurs vidéos (PC / Téléphone)</span>
                  <input
                    type="file"
                    multiple
                    accept="video/mp4,video/webm,video/ogg,video/quicktime,video/*"
                    onChange={(e) => handleMultipleVideoFiles(e.target.files)}
                    className="hidden"
                  />
                </label>
                <span className="text-[11px] text-muted-foreground text-center sm:text-left">
                  Téléversez plusieurs vidéos en même temps (jusqu'à 500 Mo par vidéo).
                </span>
              </div>

              {/* Indicateur de chargement multi-vidéos */}
              {isUploadingVideos && (
                <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-xl flex items-center gap-2.5 text-xs text-orange-600 dark:text-orange-400 font-medium animate-pulse">
                  <RefreshCw className="w-4 h-4 animate-spin flex-shrink-0" />
                  <span>
                    Téléversement des vidéos en cours : {uploadVideosProgress.current} / {uploadVideosProgress.total}... Veuillez patienter.
                  </span>
                </div>
              )}

              {/* Liste des vidéos ajoutées */}
              {videosList.length > 0 ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
                    <span>Vidéos prêtes ({videosList.length}) :</span>
                    <button
                      type="button"
                      onClick={() => setVideosList([])}
                      className="text-red-500 hover:underline text-[11px]"
                    >
                      Tout effacer
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {videosList.map((vid, idx) => {
                      const parsed = parseVideoSource(vid.url);
                      return (
                        <div
                          key={`${vid.url}-${idx}`}
                          className="p-3 rounded-xl border border-border bg-background flex flex-col gap-2 relative shadow-xs"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="px-2 py-0.5 rounded-md bg-orange-500/10 text-orange-600 dark:text-orange-400 text-xs font-bold">
                                Vidéo #{idx + 1}
                              </span>
                              <span className="px-2 py-0.5 rounded-md bg-muted text-[10px] font-semibold text-muted-foreground">
                                {parsed.label}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveVideo(idx)}
                              className="p-1 rounded-lg text-muted-foreground hover:bg-red-500/10 hover:text-red-500 transition-colors"
                              title="Supprimer cette vidéo"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Mini player or preview */}
                          <div className="relative aspect-video max-h-36 rounded-lg bg-black overflow-hidden flex items-center justify-center">
                            {parsed.embedUrl ? (
                              <iframe
                                src={parsed.embedUrl}
                                className="w-full h-full border-0 pointer-events-none"
                                title={`Aperçu vidéo ${idx + 1}`}
                              />
                            ) : vid.thumbnail ? (
                              <img src={vid.thumbnail} alt={`Miniature vidéo ${idx + 1}`} className="w-full h-full object-cover" />
                            ) : (
                              <video
                                src={vid.url}
                                playsInline
                                muted
                                preload="metadata"
                                className="w-full h-full object-contain"
                              />
                            )}
                          </div>

                          <div className="flex items-center justify-between gap-2 text-[11px]">
                            <span className="truncate text-muted-foreground font-mono text-[10px]">
                              {vid.url}
                            </span>
                            <a
                              href={vid.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-orange-500 hover:underline shrink-0 flex items-center gap-1 font-semibold"
                            >
                              <span>Ouvrir</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl border border-dashed border-border bg-black/5 dark:bg-black/20 text-center text-muted-foreground text-xs flex flex-col items-center gap-1.5">
                  <Film className="w-6 h-6 opacity-40 text-orange-500" />
                  <span>Aucune vidéo ajoutée pour le moment.</span>
                </div>
              )}
            </div>

            {/* Récapitulatif dynamique des produits créés */}
            {!isEditing && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 space-y-2">
                <div className="flex items-center gap-2 text-primary font-bold text-sm">
                  <Sparkles className="w-4 h-4" />
                  <span>
                    {totalMedias > 1 
                      ? `${totalMedias} produits individuels seront créés !`
                      : totalMedias === 1
                      ? '1 produit individuel sera créé'
                      : 'Informations prêtes'}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {totalMedias > 1 ? (
                    <>
                      Vous avez sélectionné <strong>{imagesList.length} image(s)</strong> et <strong>{videosList.length} vidéo(s)</strong>.
                      <br />
                      Comme demandé, <strong>chacun apparaîtra séparément de façon individuelle</strong> sur la page <strong>Boutique</strong> et le <strong>Catalogue</strong> avec toutes les mêmes informations saisies ci-dessus (nom, prix, catégorie, description, etc.).
                    </>
                  ) : (
                    <>
                      Sur la page boutique et catalogue, ce produit apparaîtra avec les informations et médias configurés ci-dessus.
                    </>
                  )}
                </p>
              </div>
            )}
          </div>

          {/* Footer Submit */}
          <div className="flex justify-end items-center gap-3 px-4 sm:px-6 py-4 border-t border-border bg-muted/20 flex-shrink-0">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-4 py-2.5 rounded-xl bg-muted hover:bg-border text-foreground font-semibold text-sm transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSaving || isUploadingImages || isUploadingVideos}
              className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground hover:opacity-95 disabled:opacity-50 font-bold text-sm shadow-md transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Enregistrement en cours...</span>
                </>
              ) : isEditing ? (
                'Mettre à jour le produit'
              ) : totalMedias > 1 ? (
                `Créer les ${totalMedias} produits individuels`
              ) : (
                submitLabel
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default ProductForm;
