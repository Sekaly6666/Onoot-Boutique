import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Edit2, ImageIcon, Package, Plus, Tag, Trash2, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import DeleteConfirm from '../components/DeleteConfirm';

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  image?: string | null;
  productCount?: number;
}

interface CategoryInput {
  name: string;
  slug?: string;
  description?: string;
  image?: string;
}

const inputClass = 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20';
const labelClass = 'mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500';

const generateSlug = (name: string) =>
  name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

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

const CategoryModal = ({ initialCategory, onClose, onSubmit }: { initialCategory?: Category; onClose: () => void; onSubmit: (data: CategoryInput) => Promise<void> }) => {
  const [name, setName] = useState(initialCategory?.name || '');
  const [slug, setSlug] = useState(initialCategory?.slug || '');
  const [description, setDescription] = useState(initialCategory?.description || '');
  const [image, setImage] = useState(initialCategory?.image || '');
  const [imagePreview, setImagePreview] = useState(initialCategory?.image || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const effectiveSlug = slug.trim() || generateSlug(name);

  const uploadFile = async (file: File): Promise<string> => {
    const token = localStorage.getItem('adminToken');
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/admin/upload', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    if (!res.ok) throw new Error('Erreur upload');
    const data = await res.json();
    return data.url;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    try {
      await onSubmit({
        name: name.trim(),
        slug: effectiveSlug,
        description: description.trim() || undefined,
        image: image.trim() || undefined,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, scale: 0.96, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="w-full max-w-md max-h-[90vh] flex flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex-shrink-0 flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">{initialCategory ? 'Modifier la categorie' : 'Nouvelle categorie'}</h2>
            <p className="text-xs text-slate-500">Nom, description et image visible sur la boutique.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="space-y-4 p-6 overflow-y-auto">
            <div>
              <label className={labelClass}>Nom *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required className={inputClass} placeholder="Ex: Montres connectees" />
          </div>
          <div>
            <label className={labelClass}>Slug</label>
            <input value={slug} onChange={(e) => setSlug(e.target.value)} className={inputClass} placeholder={generateSlug(name) || 'montres-connectees'} />
            <p className="mt-1 text-xs text-slate-400">Utilise dans les liens et filtres: /products?category={effectiveSlug || 'categorie'}</p>
          </div>
          <div>
            <label className={labelClass}>Description</label>
            <textarea value={description ?? ''} onChange={(e) => setDescription(e.target.value)} rows={2} className={inputClass + ' resize-none'} placeholder="Courte description de la categorie" />
          </div>
          <div>
            <label className={labelClass}>Image (Fichier ou URL)</label>
            <div className="flex flex-col gap-2">
              <input type="text" value={image ?? ''} onChange={(e) => { setImage(e.target.value); setImagePreview(e.target.value); }} className={inputClass} placeholder="https://..." />
              <div className="flex items-center gap-2 px-1">
                <span className="text-xs text-slate-400 font-medium">OU</span>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const previewUrl = URL.createObjectURL(file);
                      setImagePreview(previewUrl);
                      setIsUploading(true);
                      try {
                        const uploadedUrl = await uploadFile(file);
                        setImage(uploadedUrl);
                        setImagePreview(uploadedUrl);
                        URL.revokeObjectURL(previewUrl);
                      } catch {
                        setImagePreview('');
                      } finally {
                        setIsUploading(false);
                      }
                    }
                  }}
                  className="text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:font-medium file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
                />
              </div>
            </div>
            {isUploading && (
              <p className="mt-2 text-xs text-primary bg-primary/5 rounded-lg px-3 py-2 flex items-center gap-2">
                <span className="animate-spin">⏳</span> Upload en cours...
              </p>
            )}
            <div className="mt-3 flex h-24 items-center justify-center overflow-hidden rounded-xl border border-dashed border-slate-200 bg-slate-50">
              {imagePreview ? <img src={imagePreview} alt="Apercu" className="h-full w-full object-cover" /> : <div className="flex flex-col items-center gap-2 text-slate-400"><ImageIcon className="h-8 w-8" /><span className="text-xs">Apercu de l'image</span></div>}
            </div>
          </div>
          </div>
          <div className="flex-shrink-0 flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 border-t border-slate-100 p-4 bg-slate-50">
            <button type="button" onClick={onClose} className="w-full sm:w-auto min-h-[44px] rounded-xl bg-white border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 active:scale-98 transition-all">Annuler</button>
            <button type="submit" disabled={isSaving || isUploading} className="w-full sm:w-auto min-h-[44px] rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-primary/90 active:scale-98 transition-all disabled:opacity-60">{isSaving ? 'Enregistrement...' : 'Enregistrer'}</button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

const Categories: React.FC = () => {
  const queryClient = useQueryClient();
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);

  const categoriesQuery = useQuery({
    queryKey: ['admin-categories'],
    queryFn: () => adminFetch<Category[]>('/api/admin/categories'),
  });

  const createCategory = useMutation({
    mutationFn: (data: CategoryInput) => adminFetch<Category>('/api/admin/categories', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => { toast.success('Categorie ajoutee'); queryClient.invalidateQueries({ queryKey: ['admin-categories'] }); },
    onError: () => toast.error("Impossible d'ajouter la categorie"),
  });

  const updateCategory = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CategoryInput }) => adminFetch<Category>(`/api/admin/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => { toast.success('Categorie mise a jour'); queryClient.invalidateQueries({ queryKey: ['admin-categories'] }); },
    onError: () => toast.error('Impossible de modifier la categorie'),
  });

  const deleteCategory = useMutation({
    mutationFn: (id: string) => adminFetch<void>(`/api/admin/categories/${id}`, { method: 'DELETE' }),
    onSuccess: () => { toast.success('Categorie supprimee'); queryClient.invalidateQueries({ queryKey: ['admin-categories'] }); },
    onError: () => toast.error('Impossible de supprimer la categorie'),
  });

  const categories = useMemo(() => categoriesQuery.data || [], [categoriesQuery.data]);

  const handleSubmit = async (data: CategoryInput) => {
    if (editingCategory) {
      await updateCategory.mutateAsync({ id: editingCategory.id, data });
    } else {
      await createCategory.mutateAsync(data);
    }
    setEditingCategory(null);
    setShowForm(false);
  };

  const handleDelete = (category: Category) => {
    setCategoryToDelete(category);
  };

  const confirmDelete = async () => {
    if (!categoryToDelete) return;
    await deleteCategory.mutateAsync(categoryToDelete.id);
    setCategoryToDelete(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Catégories</h1>
          <p className="text-slate-500 mt-1">Organisez votre catalogue par catégories dynamiques</p>
        </div>
        <button
          className="w-full sm:w-auto min-h-[46px] sm:min-h-[40px] flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-white font-bold rounded-xl shadow-md hover:bg-primary/90 active:scale-[0.98] transition-all text-sm sm:text-base"
          onClick={() => { setEditingCategory(null); setShowForm(true); }}
        >
          <Plus className="w-5 h-5 flex-shrink-0" />
          <span>Nouvelle catégorie</span>
        </button>
      </div>

      {categoriesQuery.isError && <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">Impossible de charger les categories.</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categoriesQuery.isLoading && [...Array(3)].map((_, i) => <div key={i} className="h-52 animate-pulse rounded-2xl bg-slate-100" />)}
        {!categoriesQuery.isLoading && categories.map((cat, i) => (
          <motion.div key={cat.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
            <div className="h-32 bg-slate-50 flex items-center justify-center overflow-hidden">
              {cat.image ? <img src={cat.image} alt={cat.name} className="h-full w-full object-cover" /> : <ImageIcon className="h-8 w-8 text-slate-300" />}
            </div>
            <div className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium bg-slate-100 text-slate-700">
                  <Tag className="w-3.5 h-3.5" />
                  {cat.name}
                </div>
                <div className="flex gap-1">
                  <button className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors" onClick={() => { setEditingCategory(cat); setShowForm(true); }}><Edit2 className="w-4 h-4" /></button>
                  <button className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" onClick={() => handleDelete(cat)}><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              <p className="text-xs text-slate-400 mb-2">/{cat.slug}</p>
              {cat.description && <p className="mb-3 line-clamp-2 text-sm text-slate-500">{cat.description}</p>}
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Package className="w-4 h-4 text-slate-400" />
                <span><strong className="text-slate-900">{cat.productCount ?? 0}</strong> produits</span>
              </div>
            </div>
          </motion.div>
        ))}

        <motion.button initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="min-h-52 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 p-6 flex flex-col items-center justify-center gap-3 text-slate-400 hover:border-primary hover:text-primary hover:bg-primary/5 transition-all" onClick={() => { setEditingCategory(null); setShowForm(true); }}>
          <Plus className="w-8 h-8" />
          <span className="text-sm font-medium">Ajouter une categorie</span>
        </motion.button>
      </div>

      {showForm && <CategoryModal initialCategory={editingCategory || undefined} onClose={() => { setShowForm(false); setEditingCategory(null); }} onSubmit={handleSubmit} />}

      {categoryToDelete && (
        <DeleteConfirm
          title="Supprimer la catégorie"
          message={`Êtes-vous sûr de vouloir supprimer "${categoryToDelete.name}" ? Cette action est irréversible.`}
          onClose={() => setCategoryToDelete(null)}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
};

export default Categories;
