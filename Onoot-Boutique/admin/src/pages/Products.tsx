import React, { useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { Edit2, Eye, Filter, ImageIcon, Package, Plus, Search, Trash2, X, Video, Link2, CheckCircle, Clock, FileText, Play, ExternalLink } from 'lucide-react';
import DeleteConfirm from '../components/DeleteConfirm';
import ProductForm, { type CategoryOption } from '../components/ProductForm';
import { resolveMediaUrl, parseVideoSource } from '../utils/videoUtils';

type Product = {
  _id?: string;
  id?: string;
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
  externalLink?: string;
  status?: 'Publié' | 'Brouillon' | 'En attente';
  featured?: boolean;
  newArrival?: boolean;
  bestSeller?: boolean;
  flashSale?: boolean;
  flashSaleEndDate?: string;
  createdAt?: string;
};

type ProductInput = {
  name: string;
  category: string;
  price: number;
  discountPrice?: number;
  stock: number;
  imageUrl?: string;
  images?: string[];
  video?: string;
  videoUrls?: string[];
  externalLink?: string;
  status?: string;
  featured?: boolean;
  newArrival?: boolean;
  bestSeller?: boolean;
  flashSale?: boolean;
  flashSaleEndDate?: string;
  description?: string;
};

const productId = (product: Product) => product._id || product.id || product.name;
const formatMoney = (value: number) => `${Math.round(value).toLocaleString('fr-FR')} FCFA`;

async function adminFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('adminToken');
  const res = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.status === 204 ? (undefined as T) : res.json();
}

const STATUS_CONFIG = {
  'Publié':    { label: 'Publié',    icon: CheckCircle, className: 'bg-green-500/10 text-green-500 border border-green-500/20' },
  'Brouillon': { label: 'Brouillon', icon: FileText,    className: 'bg-muted text-muted-foreground border border-border' },
  'En attente':{ label: 'En attente',icon: Clock,       className: 'bg-accent-yellow/20 text-amber-600 dark:text-accent-yellow border border-amber-500/20' },
} as const;

const StatusBadge = ({ status }: { status?: string }) => {
  const normalizedStatus = status === 'Publi?' ? 'Publié' : status;
  const cfg = STATUS_CONFIG[normalizedStatus as keyof typeof STATUS_CONFIG] || STATUS_CONFIG['Brouillon'];
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.className}`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
};

/**
 * Thumbnail composant avec fallback multi-sources automatique (Local Vite, Vercel CDN, Render, alternatives)
 */
const ProductImageThumb = ({
  rawUrl,
  videoUrl,
  alt,
  hasVideo,
  className = "w-12 h-12",
}: {
  rawUrl?: string;
  videoUrl?: string;
  alt: string;
  hasVideo?: boolean;
  className?: string;
}) => {
  const [hasError, setHasError] = useState(false);
  const [srcIndex, setSrcIndex] = useState(0);

  const effectiveMedia = useMemo(() => {
    if (rawUrl && rawUrl.trim()) return rawUrl.trim();
    if (videoUrl && videoUrl.trim()) {
      const parsed = parseVideoSource(videoUrl.trim());
      if (parsed.thumbnail) return parsed.thumbnail;
    }
    return '';
  }, [rawUrl, videoUrl]);

  const candidates = useMemo(() => {
    if (!effectiveMedia) return [];

    const resolved = resolveMediaUrl(effectiveMedia);
    const list: string[] = [resolved];

    const path = effectiveMedia.startsWith('/') ? effectiveMedia : `/${effectiveMedia}`;
    if (path.startsWith('/images/')) {
      const cdnUrl = `https://onoot-boutique.vercel.app${path}`;
      if (!list.includes(cdnUrl)) list.push(cdnUrl);
      if (!list.includes(path)) list.push(path);
      const renderUrl = `https://onoot-boutique.onrender.com${path}`;
      if (!list.includes(renderUrl)) list.push(renderUrl);
    } else if (path.startsWith('/uploads/')) {
      const renderUrl = `https://onoot-boutique.onrender.com${path}`;
      if (!list.includes(renderUrl)) list.push(renderUrl);
      if (!list.includes(path)) list.push(path);
    }

    return list;
  }, [effectiveMedia]);

  React.useEffect(() => {
    setHasError(false);
    setSrcIndex(0);
  }, [effectiveMedia]);

  const currentSrc = candidates[srcIndex];

  const handleImgError = () => {
    if (srcIndex + 1 < candidates.length) {
      setSrcIndex((prev) => prev + 1);
    } else {
      setHasError(true);
    }
  };

  return (
    <div className={`${className} bg-accent-yellow/10 rounded-xl flex items-center justify-center overflow-hidden relative border border-border/50 shrink-0`}>
      {currentSrc && !hasError ? (
        <img
          key={currentSrc}
          src={currentSrc}
          alt={alt}
          className="w-full h-full object-cover transition-transform hover:scale-105"
          onError={handleImgError}
          loading="lazy"
        />
      ) : hasVideo ? (
        <div className="flex flex-col items-center justify-center text-orange-500">
          <Video className="w-5 h-5" />
          <span className="text-[9px] font-bold mt-0.5">Vidéo</span>
        </div>
      ) : (
        <ImageIcon className="w-5 h-5 text-accent-yellow opacity-60" />
      )}
      {hasVideo && currentSrc && !hasError && (
        <span
          className="absolute bottom-0 right-0 bg-orange-500 text-white p-0.5 rounded-tl-lg shadow"
          title="Ce produit contient une vidéo"
        >
          <Video className="w-3 h-3" />
        </span>
      )}
    </div>
  );
};

const Products: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [viewProduct, setViewProduct] = useState<Product | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const productsQuery = useQuery({
    queryKey: ['admin-products'],
    queryFn: () => adminFetch<Product[]>('/api/admin/products'),
  });

  const categoriesQuery = useQuery({
    queryKey: ['admin-categories'],
    queryFn: () => adminFetch<CategoryOption[]>('/api/admin/categories'),
  });

  const createProduct = useMutation({
    mutationFn: (data: ProductInput | ProductInput[]) =>
      adminFetch<Product | Product[]>('/api/admin/products', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: (_, variables) => {
      const count = Array.isArray(variables) ? variables.length : 1;
      toast.success(count > 1 ? `${count} produits individuels créés avec succès !` : 'Produit ajouté avec succès !');
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    },
    onError: (error: any) => { toast.error(error.message || "Erreur lors de l'ajout"); },
  });

  const updateProduct = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ProductInput> }) =>
      adminFetch<Product>(`/api/admin/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => {
      toast.success('Produit mis à jour avec succès !');
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    },
    onError: (error: any) => { toast.error(error.message || 'Erreur lors de la mise à jour'); },
  });

  const deleteProduct = useMutation({
    mutationFn: (id: string) => adminFetch(`/api/admin/products/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      toast.success('Produit supprimé avec succès !');
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    },
    onError: (error: any) => { toast.error(error.message || 'Erreur lors de la suppression du produit'); },
  });

  const products = productsQuery.data || [];
  const fallbackCategories = useMemo(
    () => Array.from(new Set(products.map((p) => p.category).filter(Boolean))).map((slug) => ({ name: slug, slug })),
    [products]
  );
  const categoryOptions = categoriesQuery.data?.length ? categoriesQuery.data : fallbackCategories;
  const categoryLabel = (slug: string) => categoryOptions.find((category) => category.slug === slug)?.name || slug;

  const filteredProducts = products.filter((product) => {
    const matchesSearch = `${product.name} ${product.category} ${product.description || ''}`.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || product.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleSubmit = async (product: ProductInput | ProductInput[]) => {
    if (editingProduct) {
      const single = Array.isArray(product) ? product[0] : product;
      await updateProduct.mutateAsync({ id: productId(editingProduct), data: single });
      setEditingProduct(null);
    } else {
      await createProduct.mutateAsync(product);
    }
    setShowForm(false);
  };

  const [productToDelete, setProductToDelete] = React.useState<Product | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);

  const handleDelete = (product: Product) => {
    setProductToDelete(product);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (productToDelete) {
      await deleteProduct.mutateAsync(productId(productToDelete));
    }
    setShowDeleteConfirm(false);
    setProductToDelete(null);
  };

  const counts = {
    all: products.length,
    'Publié': products.filter((p) => p.status === 'Publié').length,
    'Brouillon': products.filter((p) => p.status === 'Brouillon').length,
    'En attente': products.filter((p) => p.status === 'En attente').length,
  };

  return (
    <div className="space-y-6">
      {/* Confirm Delete Modal */}
      {showDeleteConfirm && productToDelete && (
        <DeleteConfirm
          title="Confirmer la suppression"
          message={`Supprimer "${productToDelete.name}" ? Cette action est irréversible.`}
          onClose={() => setShowDeleteConfirm(false)}
          onConfirm={confirmDelete}
        />
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Produits</h1>
          <p className="text-muted-foreground mt-1 text-sm">Gérez tous les produits, photos et vidéos de la boutique Onoot</p>
        </div>
        <button
          className="w-full sm:w-auto min-h-[44px] flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl shadow-md hover:opacity-95 active:scale-[0.98] transition-all text-sm sm:text-base cursor-pointer"
          onClick={() => { setEditingProduct(null); setShowForm(true); }}
        >
          <Plus className="w-5 h-5 flex-shrink-0" />
          <span>Ajouter un produit</span>
        </button>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-2 flex-wrap">
        {(['all', 'Publié', 'Brouillon', 'En attente'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all active:scale-95 cursor-pointer ${
              statusFilter === s
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-card text-muted-foreground border border-border hover:border-primary/50 hover:text-foreground'
            }`}
          >
            {s === 'all' ? 'Tous les produits' : s}
            <span
              className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${
                statusFilter === s ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}
            >
              {counts[s]}
            </span>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-card p-4 rounded-2xl border border-border shadow-sm flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher un produit par nom, description ou catégorie..."
            className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
          />
        </div>
        <div className="relative md:w-64">
          <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full appearance-none pl-10 pr-4 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          >
            <option value="all">Toutes les catégories</option>
            {categoryOptions.map((category) => (
              <option key={category.slug} value={category.slug}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Mobile Card Grid View (Parfait pour Téléphone) */}
      <div className="block md:hidden space-y-3">
        {productsQuery.isLoading && (
          [...Array(3)].map((_, i) => (
            <div key={i} className="p-4 rounded-2xl border border-border bg-card animate-pulse space-y-3">
              <div className="h-40 bg-muted rounded-xl" />
              <div className="h-4 bg-muted rounded w-2/3" />
              <div className="h-4 bg-muted rounded w-1/3" />
            </div>
          ))
        )}

        {!productsQuery.isLoading && filteredProducts.map((product) => {
          const image = product.imageUrl || product.images?.[0];
          const inStock = product.stock > 0;
          return (
            <motion.div
              key={productId(product)}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card rounded-2xl border border-border shadow-sm p-4 space-y-3"
            >
              <div className="flex gap-3">
                <ProductImageThumb
                  rawUrl={image}
                  videoUrl={product.video}
                  alt={product.name}
                  hasVideo={Boolean(product.video)}
                  className="w-20 h-20"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-1">
                    <h3 className="font-bold text-foreground text-sm line-clamp-1">{product.name}</h3>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{categoryLabel(product.category)}</p>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="font-bold text-foreground text-sm">{formatMoney(product.price)}</span>
                    {product.discountPrice && (
                      <span className="text-xs text-primary font-semibold">{formatMoney(product.discountPrice)}</span>
                    )}
                  </div>
                  <div className="mt-1.5 flex items-center gap-2">
                    <StatusBadge status={product.status} />
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${inStock ? 'bg-muted text-foreground' : 'bg-red-500/10 text-red-500'}`}>
                      {inStock ? `${product.stock} en stock` : 'Rupture'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons on Mobile */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/50">
                <button
                  onClick={() => setViewProduct(product)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-muted hover:bg-border text-foreground transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Aperçu</span>
                </button>
                <button
                  onClick={() => { setEditingProduct(product); setShowForm(true); }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Modifier</span>
                </button>
                <button
                  onClick={() => handleDelete(product)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Supprimer</span>
                </button>
              </div>
            </motion.div>
          );
        })}

        {!productsQuery.isLoading && filteredProducts.length === 0 && (
          <div className="bg-card rounded-2xl border border-border p-8 text-center text-muted-foreground">
            <Package className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Aucun produit trouvé.</p>
          </div>
        )}
      </div>

      {/* Desktop Table View */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="hidden md:block bg-card rounded-2xl border border-border shadow-sm overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="text-left px-6 py-4 font-semibold text-muted-foreground">Média</th>
                <th className="text-left px-6 py-4 font-semibold text-muted-foreground">Produit</th>
                <th className="text-left px-6 py-4 font-semibold text-muted-foreground">Catégorie</th>
                <th className="text-left px-6 py-4 font-semibold text-muted-foreground">Prix</th>
                <th className="text-left px-6 py-4 font-semibold text-muted-foreground">Stock</th>
                <th className="text-left px-6 py-4 font-semibold text-muted-foreground">Fin Promo</th>
                <th className="text-left px-6 py-4 font-semibold text-muted-foreground">Statut</th>
                <th className="text-right px-6 py-4 font-semibold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {productsQuery.isLoading && (
                [...Array(4)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={8} className="px-6 py-4">
                      <div className="h-10 animate-pulse rounded-lg bg-muted" />
                    </td>
                  </tr>
                ))
              )}

              {productsQuery.isError && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-red-500">
                    Impossible de charger les produits.
                  </td>
                </tr>
              )}

              {!productsQuery.isLoading && filteredProducts.map((product) => {
                const image = product.imageUrl || product.images?.[0];
                const inStock = product.stock > 0;
                return (
                  <tr key={productId(product)} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <div
                        className="cursor-pointer"
                        onClick={() => setViewProduct(product)}
                        title="Cliquer pour voir l'aperçu"
                      >
                        <ProductImageThumb
                          rawUrl={image}
                          videoUrl={product.video}
                          alt={product.name}
                          hasVideo={Boolean(product.video)}
                          className="w-12 h-12"
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <span className="font-semibold text-foreground hover:text-primary transition-colors cursor-pointer" onClick={() => setViewProduct(product)}>
                          {product.name}
                        </span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {product.featured && <span className="text-[10px] bg-primary/10 text-primary px-1.5 rounded font-medium">Vedette</span>}
                          {product.newArrival && <span className="text-[10px] bg-sky-500/10 text-sky-600 px-1.5 rounded font-medium">Nouveauté</span>}
                          {product.bestSeller && <span className="text-[10px] bg-accent-yellow/20 text-amber-600 dark:text-accent-yellow px-1.5 rounded font-medium">Best Seller</span>}
                          {product.flashSale && <span className="text-[10px] bg-red-500/10 text-red-600 px-1.5 rounded font-medium">Flash</span>}
                          {product.video && <span className="text-[10px] bg-orange-500/10 text-orange-600 px-1.5 rounded font-medium flex items-center gap-0.5"><Video className="w-2.5 h-2.5" /> Vidéo</span>}
                          {product.externalLink && (
                            <a href={product.externalLink} target="_blank" rel="noopener noreferrer" title="Lien externe">
                              <Link2 className="w-3 h-3 text-accent-blue hover:underline" />
                            </a>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{categoryLabel(product.category)}</td>
                    <td className="px-6 py-4">
                      <div>
                        <span className="font-semibold text-foreground">{formatMoney(product.price)}</span>
                        {product.discountPrice && <p className="text-xs text-primary font-medium">{formatMoney(product.discountPrice)}</p>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={inStock ? 'text-foreground font-medium' : 'text-red-500 font-semibold'}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground text-xs">
                      {(product as any).flashSaleEndDate
                        ? new Date((product as any).flashSaleEndDate).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                        : '–'}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={product.status} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          title="Aperçu du produit"
                          className="p-2 sm:p-1.5 text-muted-foreground hover:text-accent-blue hover:bg-accent-blue/10 rounded-lg transition-colors active:scale-95 cursor-pointer"
                          onClick={() => setViewProduct(product)}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          title="Modifier"
                          className="p-2 sm:p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors active:scale-95 cursor-pointer"
                          onClick={() => { setEditingProduct(product); setShowForm(true); }}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          title="Supprimer"
                          className="p-2 sm:p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors active:scale-95 cursor-pointer"
                          onClick={() => handleDelete(product)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {!productsQuery.isLoading && filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-muted-foreground">
                    <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    Aucun produit trouvé dans cette sélection.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Product Form Modal (Add / Edit) */}
      <AnimatePresence>
        {showForm && (
          <ProductForm
            categories={categoryOptions}
            initialProduct={
              editingProduct
                ? {
                    name: editingProduct.name,
                    description: editingProduct.description,
                    category: editingProduct.category,
                    price: editingProduct.price,
                    discountPrice: editingProduct.discountPrice,
                    stock: editingProduct.stock,
                    imageUrl: (editingProduct as any).imageUrl || editingProduct.images?.[0],
                    images: editingProduct.images,
                    video: editingProduct.video,
                    videoUrls: (editingProduct as any).videoUrls || (editingProduct.video ? [editingProduct.video] : undefined),
                    externalLink: editingProduct.externalLink,
                    status: editingProduct.status,
                    featured: editingProduct.featured,
                    newArrival: editingProduct.newArrival,
                    bestSeller: editingProduct.bestSeller,
                    flashSale: editingProduct.flashSale,
                    flashSaleEndDate: editingProduct.flashSaleEndDate,
                  }
                : undefined
            }
            submitLabel={editingProduct ? 'Enregistrer les modifications' : 'Ajouter le produit'}
            onClose={() => { setShowForm(false); setEditingProduct(null); }}
            onSubmit={handleSubmit}
          />
        )}
      </AnimatePresence>

      {/* View Product Modal (Grand Aperçu Image & Lecteur Vidéo) */}
      <AnimatePresence>
        {viewProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setViewProduct(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 20 }}
              className="relative z-10 w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <button
                className="absolute right-4 top-4 rounded-xl p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer z-20"
                onClick={() => setViewProduct(null)}
              >
                <X className="h-5 w-5" />
              </button>

              {/* Grande Image Principale */}
              <div className="relative w-full h-56 rounded-2xl bg-muted/40 border border-border overflow-hidden flex items-center justify-center mb-4">
                {viewProduct.imageUrl || viewProduct.images?.[0] ? (
                  <img
                    src={resolveMediaUrl(viewProduct.imageUrl || viewProduct.images?.[0])}
                    alt={viewProduct.name}
                    className="w-full h-full object-contain p-2"
                    onError={(e) => {
                      const raw = viewProduct.imageUrl || viewProduct.images?.[0] || '';
                      const path = raw.startsWith('/') ? raw : `/${raw}`;
                      if (path.startsWith('/images/')) {
                        e.currentTarget.src = `https://onoot-boutique.vercel.app${path}`;
                      }
                    }}
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Package className="h-10 w-10 text-primary opacity-60" />
                    <span className="text-xs">Aucune image renseignée</span>
                  </div>
                )}
              </div>

              {/* Titre et badges */}
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <h2 className="text-xl font-bold text-foreground">{viewProduct.name}</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">{categoryLabel(viewProduct.category)}</p>
                </div>
                <StatusBadge status={viewProduct.status} />
              </div>

              {viewProduct.description && (
                <p className="text-sm text-muted-foreground leading-relaxed my-3 bg-muted/30 p-3 rounded-xl border border-border/50">
                  {viewProduct.description}
                </p>
              )}

              {/* Prix & Stock */}
              <div className="grid grid-cols-2 gap-3 text-sm my-3">
                <div className="rounded-xl bg-muted/50 p-3 border border-border/50">
                  <p className="text-xs text-muted-foreground">Prix standard</p>
                  <p className="font-bold text-foreground text-base mt-0.5">{formatMoney(viewProduct.price)}</p>
                  {viewProduct.discountPrice && (
                    <p className="text-xs text-primary font-semibold mt-0.5">Promo: {formatMoney(viewProduct.discountPrice)}</p>
                  )}
                </div>
                <div className="rounded-xl bg-muted/50 p-3 border border-border/50">
                  <p className="text-xs text-muted-foreground">Stock disponible</p>
                  <p className={`font-bold text-base mt-0.5 ${viewProduct.stock > 0 ? 'text-foreground' : 'text-red-500'}`}>
                    {viewProduct.stock > 0 ? `${viewProduct.stock} unités` : 'Rupture'}
                  </p>
                </div>
              </div>

              {/* Lecteur Vidéo Dédié */}
              {viewProduct.video && (() => {
                const parsed = parseVideoSource(viewProduct.video);
                return (
                  <div className="mt-4 p-3.5 rounded-2xl bg-muted/40 border border-border space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Video className="w-4 h-4 text-orange-500" />
                        <span className="text-xs font-bold text-foreground">Vidéo de présentation</span>
                        {parsed.platform !== 'other' && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-orange-500/10 text-orange-600 border border-orange-500/20">
                            {parsed.label}
                          </span>
                        )}
                      </div>
                      <a
                        href={parsed.url || viewProduct.video}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-accent-blue hover:underline flex items-center gap-1 font-semibold bg-accent-blue/10 px-2.5 py-1 rounded-lg transition-colors"
                      >
                        <span>Ouvrir la vidéo</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>

                    <div className="relative aspect-video rounded-xl overflow-hidden bg-black border border-border flex items-center justify-center">
                      {parsed.embedUrl ? (
                        <iframe
                          key={parsed.embedUrl}
                          src={parsed.embedUrl}
                          className="w-full h-full border-0"
                          allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
                          allowFullScreen
                        />
                      ) : (
                        <video
                          key={parsed.url || viewProduct.video}
                          src={parsed.url || viewProduct.video}
                          controls
                          playsInline
                          className="w-full h-full object-contain"
                        />
                      )}
                    </div>

                    {parsed.platform === 'facebook' && (
                      <p className="text-[11px] text-muted-foreground mt-1">
                        💡 Si la vidéo Facebook affiche « Non disponible », vérifiez que sa confidentialité est en mode Public sur Facebook, ou cliquez sur « Ouvrir la vidéo » ci-dessus.
                      </p>
                    )}
                  </div>
                );
              })()}

              {/* Lien externe */}
              {viewProduct.externalLink && (
                <div className="mt-3 rounded-xl bg-muted/50 p-3 flex items-center justify-between text-xs border border-border/50">
                  <div className="flex items-center gap-2 truncate">
                    <Link2 className="w-4 h-4 text-accent-blue flex-shrink-0" />
                    <span className="truncate text-muted-foreground">{viewProduct.externalLink}</span>
                  </div>
                  <a
                    href={viewProduct.externalLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent-blue hover:underline font-semibold ml-2 flex-shrink-0"
                  >
                    Visiter
                  </a>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Products;
