import React, { useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { Edit2, Eye, Filter, ImageIcon, Package, Plus, Search, Trash2, X, Video, Link2, CheckCircle, Clock, FileText } from 'lucide-react';
import DeleteConfirm from '../components/DeleteConfirm';
import ProductForm, { type CategoryOption } from '../components/ProductForm';

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
  'Publié':    { label: 'Publié',    icon: CheckCircle, className: 'bg-green-500/10 text-green-500' },
  'Brouillon': { label: 'Brouillon', icon: FileText,    className: 'bg-muted text-muted-foreground' },
  'En attente':{ label: 'En attente',icon: Clock,       className: 'bg-accent-yellow/20 text-amber-600 dark:text-accent-yellow' },
} as const;

const StatusBadge = ({ status }: { status?: string }) => {
  const normalizedStatus = status === 'Publi?' ? 'Publi??' : status;
  const cfg = STATUS_CONFIG[normalizedStatus as keyof typeof STATUS_CONFIG] || STATUS_CONFIG['Brouillon'];
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.className}`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
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
    mutationFn: (data: ProductInput) => adminFetch<Product>('/api/admin/products', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => { toast.success('Produit ajouté'); queryClient.invalidateQueries({ queryKey: ['admin-products'] }); },
    onError: (error: any) => { toast.error(error.message || "Erreur lors de l'ajout"); },
  });

  const updateProduct = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ProductInput> }) => adminFetch<Product>(`/api/admin/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => { toast.success('Produit mis à jour'); queryClient.invalidateQueries({ queryKey: ['admin-products'] }); },
    onError: (error: any) => { toast.error(error.message || 'Erreur lors de la mise à jour'); },
  });

  const deleteProduct = useMutation({
    mutationFn: (id: string) => adminFetch(`/api/admin/products/${id}`, { method: 'DELETE' }),
    onSuccess: () => { toast.success('Produit supprimé'); queryClient.invalidateQueries({ queryKey: ['admin-products'] }); },
    onError: (error: any) => { toast.error(error.message || 'Erreur lors de la suppression du produit'); },
  });

  const products = productsQuery.data || [];
  const fallbackCategories = useMemo(() => Array.from(new Set(products.map((p) => p.category).filter(Boolean))).map((slug) => ({ name: slug, slug })), [products]);
  const categoryOptions = categoriesQuery.data?.length ? categoriesQuery.data : fallbackCategories;
  const categoryLabel = (slug: string) => categoryOptions.find((category) => category.slug === slug)?.name || slug;
  
  const filteredProducts = products.filter((product) => {
    const matchesSearch = `${product.name} ${product.category} ${product.description || ''}`.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || product.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleSubmit = async (product: ProductInput) => {
    if (editingProduct) {
      await updateProduct.mutateAsync({ id: productId(editingProduct), data: product });
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
    'Publié': products.filter(p => p.status === 'Publié').length,
    'Brouillon': products.filter(p => p.status === 'Brouillon').length,
    'En attente': products.filter(p => p.status === 'En attente').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      {showDeleteConfirm && productToDelete && (
        <DeleteConfirm
          title="Confirmer la suppression"
          message={`Supprimer "${productToDelete.name}" ? Cette action est irréversible.`}
          onClose={() => setShowDeleteConfirm(false)}
          onConfirm={confirmDelete}
        />
      )}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Produits</h1>
          <p className="text-muted-foreground mt-1">Gérer tout les produits de la boutique onoot</p>
        </div>
        <button
          className="w-full sm:w-auto min-h-[46px] sm:min-h-[40px] flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl shadow-md hover:opacity-95 active:scale-[0.98] transition-all text-sm sm:text-base"
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
            className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all active:scale-95 ${statusFilter === s ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-card text-muted-foreground border border-border hover:border-primary/50 hover:text-foreground'}`}
          >
            {s === 'all' ? 'Tous' : s}
            <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${statusFilter === s ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
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
            placeholder="Rechercher un produit..."
            className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
          />
        </div>
        <div className="relative md:w-56">
          <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full appearance-none pl-10 pr-4 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          >
            <option value="all">Toutes les catégories</option>
            {categoryOptions.map((category) => <option key={category.slug} value={category.slug}>{category.name}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b border-border">

                <th className="text-left px-6 py-4 font-semibold text-muted-foreground">Média</th>
                <th className="text-left px-6 py-4 font-semibold text-muted-foreground">Produit</th>
                <th className="text-left px-6 py-4 font-semibold text-muted-foreground">Catégorie</th>
                <th className="text-left px-6 py-4 font-semibold text-muted-foreground">Prix</th>
                <th className="text-left px-6 py-4 font-semibold text-muted-foreground">Stock</th>
                <th className="text-left px-6 py-4 font-semibold text-muted-foreground">Début Flash Sale</th>
                <th className="text-left px-6 py-4 font-semibold text-muted-foreground">Fin Flash Sale</th>
                <th className="text-left px-6 py-4 font-semibold text-muted-foreground">Statut</th>
                <th className="text-right px-6 py-4 font-semibold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {productsQuery.isLoading && (
                [...Array(4)].map((_, i) => (
                  <tr key={i}>
                     <td colSpan={9} className="px-6 py-4">
                      <div className="h-10 animate-pulse rounded-lg bg-muted" />
                    </td>
                  </tr>
                ))
              )}
              {productsQuery.isError && (
                <tr><td colSpan={9} className="p-8 text-center text-red-500">Impossible de charger les produits.</td></tr>
              )}
              {!productsQuery.isLoading && filteredProducts.map((product) => {
                const image = product.imageUrl || product.images?.[0];
                const inStock = product.stock > 0;
                return (
                  <tr key={productId(product)} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="w-12 h-12 bg-accent-yellow/10 rounded-xl flex items-center justify-center overflow-hidden relative">
                        {image ? <img src={image} alt={product.name} className="w-full h-full object-cover" /> : <ImageIcon className="w-5 h-5 text-accent-yellow" />}
                        {product.video && <span className="absolute bottom-0 right-0 bg-primary p-0.5 rounded-tl-lg"><Video className="w-2.5 h-2.5 text-white" /></span>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <span className="font-semibold text-foreground">{product.name}</span>
                        <div className="flex items-center gap-2 mt-0.5">
                          {product.featured && <span className="text-[10px] bg-primary/10 text-primary px-1.5 rounded font-medium">Vedette</span>}
                          {product.newArrival && <span className="text-[10px] bg-sky-500/10 text-sky-600 px-1.5 rounded font-medium">Nouveaute</span>}
                          {product.bestSeller && <span className="text-[10px] bg-accent-yellow/20 text-amber-600 dark:text-accent-yellow px-1.5 rounded font-medium">Best Seller</span>}
                          {product.flashSale && <span className="text-[10px] bg-red-500/10 text-red-600 px-1.5 rounded font-medium">Flash</span>}
                          {product.externalLink && <span title="Lien externe"><Link2 className="w-3 h-3 text-accent-blue" /></span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{categoryLabel(product.category)}</td>
                    <td className="px-6 py-4">
                      <div>
                        <span className="font-semibold text-foreground">{formatMoney(product.price)}</span>
                        {product.discountPrice && <p className="text-xs text-primary">{formatMoney(product.discountPrice)}</p>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={inStock ? 'text-foreground' : 'text-red-500 font-semibold'}>{product.stock}</span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {(product as any).flashSaleStart ? new Date((product as any).flashSaleStart).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '–'}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {(product as any).flashSaleEnd ? new Date((product as any).flashSaleEnd).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '–'}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={product.status} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button title="Voir" className="p-2 sm:p-1.5 text-muted-foreground hover:text-accent-blue hover:bg-accent-blue/10 rounded-lg transition-colors active:scale-95" onClick={() => setViewProduct(product)}><Eye className="w-4 h-4" /></button>
                        <button title="Modifier" className="p-2 sm:p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors active:scale-95" onClick={() => { setEditingProduct(product); setShowForm(true); }}><Edit2 className="w-4 h-4" /></button>
                        <button title="Supprimer" className="p-2 sm:p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors active:scale-95" onClick={() => handleDelete(product)}><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!productsQuery.isLoading && filteredProducts.length === 0 && (
                <tr><td colSpan={9} className="p-12 text-center text-muted-foreground">
                  <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  Aucun produit trouvé.
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Product Form */}
      <AnimatePresence>
        {showForm && (
          <ProductForm
            categories={categoryOptions}
            initialProduct={editingProduct ? {
              name: editingProduct.name,
              description: editingProduct.description,
              category: editingProduct.category,
              price: editingProduct.price,
              discountPrice: editingProduct.discountPrice,
              stock: editingProduct.stock,
              imageUrl: (editingProduct as any).imageUrl || editingProduct.images?.[0],
              images: editingProduct.images,
              externalLink: editingProduct.externalLink,
              status: editingProduct.status,
              featured: editingProduct.featured,
              newArrival: editingProduct.newArrival,
              bestSeller: editingProduct.bestSeller,
              flashSale: editingProduct.flashSale,
              flashSaleEndDate: editingProduct.flashSaleEndDate,
            } : undefined}
            submitLabel={editingProduct ? 'Enregistrer' : 'Ajouter'}
            onClose={() => { setShowForm(false); setEditingProduct(null); }}
            onSubmit={handleSubmit}
          />
        )}
      </AnimatePresence>

      {/* View Modal */}
      <AnimatePresence>
        {viewProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setViewProduct(null)} className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.96, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 20 }} className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
              <button className="absolute right-4 top-4 rounded-lg p-2 text-muted-foreground hover:bg-muted" onClick={() => setViewProduct(null)}><X className="h-5 w-5" /></button>
              <div className="mb-4 w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center overflow-hidden">
                {viewProduct.imageUrl || viewProduct.images?.[0]
                  ? <img src={viewProduct.imageUrl || viewProduct.images?.[0]} alt={viewProduct.name} className="w-full h-full object-cover" />
                  : <Package className="h-8 w-8 text-primary" />
                }
              </div>
              <h2 className="text-xl font-bold text-foreground">{viewProduct.name}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{viewProduct.category}</p>
              <StatusBadge status={viewProduct.status} />
              <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl bg-muted p-3"><p className="text-muted-foreground">Prix</p><p className="font-bold text-foreground">{formatMoney(viewProduct.price)}</p></div>
                <div className="rounded-xl bg-muted p-3"><p className="text-muted-foreground">Stock</p><p className="font-bold text-foreground">{viewProduct.stock}</p></div>
              </div>
              {viewProduct.video && (
                <div className="mt-3 rounded-xl bg-muted p-3 flex items-center gap-2 text-sm">
                  <Video className="w-4 h-4 text-primary" />
                  <a href={viewProduct.video} target="_blank" rel="noopener noreferrer" className="text-accent-blue truncate hover:underline">{viewProduct.video}</a>
                </div>
              )}
              {viewProduct.externalLink && (
                <div className="mt-2 rounded-xl bg-muted p-3 flex items-center gap-2 text-sm">
                  <Link2 className="w-4 h-4 text-accent-blue" />
                  <a href={viewProduct.externalLink} target="_blank" rel="noopener noreferrer" className="text-accent-blue truncate hover:underline">{viewProduct.externalLink}</a>
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
