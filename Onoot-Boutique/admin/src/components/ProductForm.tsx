import React, { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import toast from 'react-hot-toast';
import { Check, ChevronDown, ImageIcon, Package, Video, X, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

export interface CategoryOption {
  name: string;
  slug: string;
}

interface ProductInput {
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
  const [imageUrl, setImageUrl] = useState(initialProduct?.imageUrl || '');
  const [, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState(initialProduct?.imageUrl || '');
  const [status, setStatus] = useState(initialProduct?.status || 'Publié');
  const [videoUrl, setVideoUrl] = useState(initialProduct?.videoUrls?.[0] || initialProduct?.video || '');
  const [, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState(initialProduct?.videoUrls?.[0] || initialProduct?.video || '');
  const [featured, setFeatured] = useState(Boolean(initialProduct?.featured));
  const [newArrival, setNewArrival] = useState(Boolean(initialProduct?.newArrival));
  const [bestSeller, setBestSeller] = useState(Boolean(initialProduct?.bestSeller));
  const [flashSale, setFlashSale] = useState(Boolean(initialProduct?.flashSale));
  const [flashSaleEndDate, setFlashSaleEndDate] = useState(toDateTimeLocal(initialProduct?.flashSaleEndDate || initialProduct?.flashSaleEnd));
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);

  const uploadFile = async (file: File): Promise<string> => {
    const token = localStorage.getItem('adminToken');
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/admin/upload', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => null);
      throw new Error(errData?.error || `Erreur de téléversement (${res.status})`);
    }
    const data = await res.json();
    return data.url;
  };

  // Track object URLs to revoke them on unmount to avoid memory leaks
  const objectUrls = useRef<string[]>([]);
  useEffect(() => {
    return () => {
      objectUrls.current.forEach(URL.revokeObjectURL);
    };
  }, []);

  useEffect(() => {
    setName(initialProduct?.name || '');
    setDescription(initialProduct?.description || '');
    setCategory(initialProduct?.category || '');
    setPrice(initialProduct ? String(initialProduct.price) : '');
    setDiscountPrice(initialProduct?.discountPrice ? String(initialProduct.discountPrice) : '');
    setStock(initialProduct ? String(initialProduct.stock) : '');
    setImageUrl(initialProduct?.imageUrl || '');
    setImageFile(null);
    setImagePreview(initialProduct?.imageUrl || '');
    setStatus(initialProduct?.status || 'Publié');
    setVideoUrl(initialProduct?.videoUrls?.[0] || initialProduct?.video || '');
    setVideoFile(null);
    setVideoPreview(initialProduct?.videoUrls?.[0] || initialProduct?.video || '');
    setFeatured(Boolean(initialProduct?.featured));
    setNewArrival(Boolean(initialProduct?.newArrival));
    setBestSeller(Boolean(initialProduct?.bestSeller));
    setFlashSale(Boolean(initialProduct?.flashSale));
    setFlashSaleEndDate(toDateTimeLocal(initialProduct?.flashSaleEndDate || initialProduct?.flashSaleEnd));
  }, [initialProduct]);

  const handleImageFile = async (file: File) => {
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
    setImageFile(file);
    setIsUploadingImage(true);
    try {
      const uploadedUrl = await uploadFile(file);
      setImageUrl(uploadedUrl);
      setImagePreview(uploadedUrl);
      toast.success('Image importée avec succès');
    } catch (err: any) {
      console.error('Erreur image:', err);
      toast.error(err.message || "Erreur lors de l'envoi de l'image");
      setImagePreview('');
      setImageUrl('');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleVideoFile = async (file: File) => {
    // Show instant local preview via object URL
    const previewUrl = URL.createObjectURL(file);
    setVideoPreview(previewUrl);
    setVideoFile(file);
    setIsUploadingVideo(true);
    try {
      const uploadedUrl = await uploadFile(file);
      setVideoUrl(uploadedUrl);
      // Keep working preview: if uploadedUrl is relative, it will load via static server
      setVideoPreview(uploadedUrl);
      toast.success('Vidéo importée avec succès !');
    } catch (err: any) {
      console.error('Erreur vidéo:', err);
      toast.error(err.message || "Erreur lors de l'importation de la vidéo. Vérifiez le format ou la taille.");
      setVideoPreview('');
      setVideoUrl('');
      setVideoFile(null);
    } finally {
      setIsUploadingVideo(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const priceNum = Number(price);
      const stockNum = Number(stock);
      const discountPriceNum = discountPrice ? Number(discountPrice) : undefined;

      // For file uploads: we only send the URL, not the file itself.
      // If a file was chosen but no URL exists, we send undefined (file stays local for preview only).
      // The imageUrl state holds the typed URL; imageFile holds the chosen file (local preview only).
      const finalImageUrl = imageUrl.trim() || undefined;
      const finalVideoUrl = videoUrl.trim() || undefined;

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

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50 p-4">
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
          <div className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1">
            <div className="space-y-4">
              <SectionHeader icon={Package} title="Informations generales" />
              <div>
                <label className={labelClass}>Nom du produit *</label>
                <input type="text" placeholder="Ex: Coque Premium iPhone 15" value={name} onChange={(e) => setName(e.target.value)} required className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Description</label>
                <textarea placeholder="Description complete du produit..." value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className={inputClass + ' resize-none'} />
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className={labelClass}>Categorie</label>
                <div className="relative">
                  <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass + ' appearance-none pr-8'}>
                    <option value="">Selectionner une categorie</option>
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

            <div>
              <SectionHeader icon={Check} title="Sections d'affichage" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <ToggleBox checked={featured} label="En vedette" onChange={setFeatured} />
                <ToggleBox checked={newArrival} label="Nouveaute" onChange={setNewArrival} />
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
            <div className="space-y-3">
              <SectionHeader icon={ImageIcon} title="Image principale" />
              <div>
                <label className={labelClass}>URL de l'image</label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={imageUrl}
                  onChange={(e) => {
                    setImageUrl(e.target.value);
                    setImageFile(null);
                    setImagePreview(e.target.value);
                  }}
                  className={inputClass}
                />
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground font-semibold">OU choisir un fichier :</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageFile(file);
                  }}
                  className="text-xs text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:font-medium file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                />
              </div>
              {isUploadingImage && (
                <p className="text-xs text-primary bg-primary/5 rounded-lg px-3 py-2 flex items-center gap-2">
                  <span className="animate-spin">⏳</span> Upload en cours...
                </p>
              )}
              <div className="h-40 rounded-xl border border-dashed border-border bg-muted/50 flex items-center justify-center overflow-hidden">
                {imagePreview
                  ? <img src={imagePreview} alt="Apercu" className="h-full w-full object-cover rounded-xl" />
                  : <div className="flex flex-col items-center gap-2 text-muted-foreground"><ImageIcon className="w-8 h-8 opacity-50" /><span className="text-xs">Apercu de l'image</span></div>
                }
              </div>
            </div>

            {/* Video Section */}
            <div className="space-y-3">
              <SectionHeader icon={Video} title="Vidéo du produit" />
              <div>
                <label className={labelClass}>URL de la vidéo</label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={videoUrl}
                  onChange={(e) => {
                    setVideoUrl(e.target.value);
                    setVideoFile(null);
                    setVideoPreview(e.target.value);
                  }}
                  className={inputClass}
                />
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground font-semibold">OU choisir un fichier :</span>
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleVideoFile(file);
                  }}
                  className="text-xs text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:font-medium file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                />
              </div>
              <div className="h-44 rounded-xl border border-dashed border-border bg-muted/50 flex items-center justify-center overflow-hidden relative">
                {isUploadingVideo && (
                  <div className="absolute inset-0 bg-background/80 backdrop-blur-xs flex flex-col items-center justify-center z-10 gap-2 p-3 text-center">
                    <RefreshCw className="w-6 h-6 text-primary animate-spin" />
                    <span className="text-xs font-semibold text-foreground">Importation de la vidéo en cours...</span>
                    <span className="text-[11px] text-muted-foreground">Veuillez patienter pendant l'envoi du fichier</span>
                  </div>
                )}
                {videoPreview ? (
                  <div className="relative w-full h-full flex items-center justify-center bg-black/90 group">
                    <video
                      key={videoPreview}
                      src={videoPreview}
                      controls
                      playsInline
                      className="h-full w-full object-contain"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setVideoPreview('');
                        setVideoUrl('');
                        setVideoFile(null);
                      }}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 hover:bg-red-600 text-white transition-colors z-20"
                      title="Supprimer la vidéo"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Video className="w-8 h-8 opacity-50" />
                    <span className="text-xs">Aperçu de la vidéo</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end items-center gap-3 px-6 py-4 border-t border-border bg-muted/20 flex-shrink-0">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl bg-muted hover:bg-border text-foreground font-medium transition-colors">Annuler</button>
            <button type="submit" disabled={isSaving} className="px-5 py-2 rounded-xl bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-60 font-semibold transition-opacity">
              {isSaving ? 'Enregistrement...' : submitLabel}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default ProductForm;
