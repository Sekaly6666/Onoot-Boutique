import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Film,
  Plus,
  Search,
  Trash2,
  Edit2,
  Eye,
  EyeOff,
  Play,
  Upload,
  Flame,
  CheckCircle2,
  XCircle,
  Tv,
  Radio,
  Loader2,
  X
} from 'lucide-react';
import DeleteConfirm from '../components/DeleteConfirm';

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
  placement: 'all' | 'marquee' | 'showcase';
  isActive: boolean;
  order: number;
  viewsCount: number;
  createdAt: string;
}

interface PromoVideoInput {
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
  placement: 'all' | 'marquee' | 'showcase';
  isActive: boolean;
  order: number;
}

function cleanBadgeText(badge?: string): string {
  if (!badge) return 'PROMO';
  return (
    badge
      .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{27BF}\u{2B50}\u{2B00}-\u{2BFF}\u{1F1E6}-\u{1F1FF}]/gu, '')
      .replace(/\p{Extended_Pictographic}/gu, '')
      .trim() || 'PROMO'
  );
}

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
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Erreur requête ${res.status}`);
  }
  return res.status === 204 ? (undefined as T) : res.json();
}

export default function AdsVideos() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [placementFilter, setPlacementFilter] = useState<'all' | 'marquee' | 'showcase'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<PromoVideo | null>(null);
  const [deletingVideo, setDeletingVideo] = useState<PromoVideo | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);

  // Fetch videos
  const { data, isLoading } = useQuery({
    queryKey: ['admin-promo-videos'],
    queryFn: () => adminFetch<{ videos: PromoVideo[]; stats: any }>('/api/admin/promo-videos'),
  });

  const videos = data?.videos || [];
  const stats = data?.stats || { total: 0, active: 0, totalViews: 0, marqueeCount: 0 };

  // Mutations
  const toggleMutation = useMutation({
    mutationFn: (id: string) => adminFetch(`/api/admin/promo-videos/${id}/toggle`, { method: 'PATCH' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-promo-videos'] });
      toast.success('Statut de diffusion mis à jour !');
    },
    onError: (err: any) => toast.error(err.message || 'Erreur lors du changement de statut'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminFetch(`/api/admin/promo-videos/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-promo-videos'] });
      toast.success('Publicité vidéo supprimée');
      setDeletingVideo(null);
    },
    onError: (err: any) => toast.error(err.message || 'Erreur lors de la suppression'),
  });

  // Filtered list
  const filteredVideos = videos.filter((v) => {
    const matchesSearch =
      v.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (v.subtitle && v.subtitle.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (v.productName && v.productName.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesPlacement =
      placementFilter === 'all' || v.placement === placementFilter || v.placement === 'all';

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && v.isActive) ||
      (statusFilter === 'inactive' && !v.isActive);

    return matchesSearch && matchesPlacement && matchesStatus;
  });

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-orange-500/20 text-orange-500 border border-orange-500/30">
              <Film className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Publicités & Vidéos</h1>
              <p className="text-sm text-muted-foreground">
                Gérez les bannières animées en Marquee et les démonstrations vidéos de la boutique Onoot.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            setEditingVideo(null);
            setIsFormOpen(true);
          }}
          className="w-full sm:w-auto min-h-[46px] sm:min-h-[42px] flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-orange-500/25 transition-all active:scale-[0.98] text-sm sm:text-base"
        >
          <Plus className="w-5 h-5 flex-shrink-0" />
          <span>Nouvelle Publicité Vidéo</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card p-4 rounded-2xl border border-border shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-primary/10 text-primary">
            <Tv className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Total Vidéos</p>
            <p className="text-2xl font-bold text-foreground">{stats.total}</p>
          </div>
        </div>

        <div className="bg-card p-4 rounded-2xl border border-border shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">En Diffusion</p>
            <p className="text-2xl font-bold text-emerald-500">{stats.active}</p>
          </div>
        </div>

        <div className="bg-card p-4 rounded-2xl border border-border shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-orange-500/10 text-orange-500">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Marquee Défilant</p>
            <p className="text-2xl font-bold text-orange-500">{stats.marqueeCount}</p>
          </div>
        </div>

        <div className="bg-card p-4 rounded-2xl border border-border shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-blue-500/10 text-blue-500">
            <Eye className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Vues Cumulées</p>
            <p className="text-2xl font-bold text-blue-500">{stats.totalViews.toLocaleString('fr-FR')}</p>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-card p-4 rounded-2xl border border-border flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Rechercher une pub, produit..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Status Filter */}
          <div className="flex bg-background border border-border p-1 rounded-xl text-xs font-medium">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${statusFilter === 'all' ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Tous
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${statusFilter === 'active' ? 'bg-emerald-600 text-white' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Actives
            </button>
            <button
              onClick={() => setStatusFilter('inactive')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${statusFilter === 'inactive' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              En pause
            </button>
          </div>

          {/* Placement Filter */}
          <div className="flex bg-background border border-border p-1 rounded-xl text-xs font-medium">
            <button
              onClick={() => setPlacementFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${placementFilter === 'all' ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Tous formats
            </button>
            <button
              onClick={() => setPlacementFilter('marquee')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${placementFilter === 'marquee' ? 'bg-orange-500 text-white' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Marquee
            </button>
            <button
              onClick={() => setPlacementFilter('showcase')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${placementFilter === 'showcase' ? 'bg-blue-600 text-white' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Vitrine
            </button>
          </div>
        </div>
      </div>

      {/* Videos Grid */}
      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filteredVideos.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-2xl border border-dashed border-border p-8">
          <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
            <Film className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold mb-1">Aucune publicité vidéo trouvée</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-6">
            Ajoutez votre première vidéo promotionnelle pour dynamiser l'accueil de la boutique Onoot !
          </p>
          <button
            onClick={() => {
              setEditingVideo(null);
              setIsFormOpen(true);
            }}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl font-medium"
          >
            <Plus className="w-4 h-4" />
            Créer une publicité
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVideos.map((video) => {
            const isPlaying = playingId === video._id;
            return (
              <motion.div
                key={video._id}
                layout
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-card rounded-2xl border overflow-hidden shadow-sm flex flex-col transition-all duration-200 hover:shadow-md ${video.isActive ? 'border-border' : 'border-border/60 opacity-75'}`}
              >
                {/* Video / Preview Header */}
                <div className="relative aspect-video bg-black/90 group overflow-hidden">
                  <video
                    id={`video-${video._id}`}
                    src={video.videoUrl}
                    poster={video.thumbnailUrl}
                    controls={isPlaying}
                    muted={!isPlaying}
                    loop
                    className="w-full h-full object-cover"
                    onEnded={() => setPlayingId(null)}
                  />

                  {/* Play overlay button */}
                  {!isPlaying && (
                    <button
                      onClick={() => {
                        const el = document.getElementById(`video-${video._id}`) as HTMLVideoElement;
                        if (el) {
                          el.play();
                          setPlayingId(video._id);
                        }
                      }}
                      className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/20 transition-colors"
                    >
                      <div className="w-12 h-12 rounded-full bg-white/90 text-black flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                        <Play className="w-5 h-5 ml-0.5 fill-black" />
                      </div>
                    </button>
                  )}

                  {/* Badges on video */}
                  <div className="absolute top-3 left-3 flex items-center gap-2 pointer-events-none">
                    <span className="bg-orange-500/90 text-white font-bold text-[11px] px-2.5 py-1 rounded-full backdrop-blur-md shadow-sm flex items-center gap-1">
                      <Flame className="w-3 h-3 text-white" />
                      <span>{cleanBadgeText(video.badge)}</span>
                    </span>
                    <span className="bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full backdrop-blur-md uppercase tracking-wider font-semibold">
                      {video.placement === 'all' ? 'Partout' : video.placement === 'marquee' ? 'Marquee' : 'Vitrine'}
                    </span>
                  </div>

                  <div className="absolute top-3 right-3 flex items-center gap-1.5 pointer-events-none">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold backdrop-blur-md ${video.isActive ? 'bg-emerald-500/90 text-white' : 'bg-gray-800/90 text-gray-300'}`}>
                      {video.isActive ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      {video.isActive ? 'En direct' : 'En pause'}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-bold text-foreground text-base line-clamp-1">{video.title}</h3>
                    </div>

                    {video.subtitle && (
                      <p className="text-xs font-medium text-primary line-clamp-1 mb-2">
                        {video.subtitle}
                      </p>
                    )}

                    {video.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                        {video.description}
                      </p>
                    )}

                    {/* Product & Price details */}
                    {(video.productName || video.price) && (
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/40 border border-border/50 text-xs">
                        <div className="truncate pr-2">
                          <span className="text-muted-foreground block text-[10px]">Produit lié :</span>
                          <span className="font-semibold text-foreground truncate block">
                            {video.productName || 'Catalogue'}
                          </span>
                        </div>
                        {video.price && (
                          <div className="text-right flex-shrink-0">
                            {video.discountPrice ? (
                              <>
                                <span className="text-xs font-bold text-orange-500 block">
                                  {video.discountPrice.toLocaleString('fr-FR')} F
                                </span>
                                <span className="text-[10px] text-muted-foreground line-through block">
                                  {video.price.toLocaleString('fr-FR')} F
                                </span>
                              </>
                            ) : (
                              <span className="text-xs font-bold text-foreground block">
                                {video.price.toLocaleString('fr-FR')} F
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions & Footer */}
                  <div className="pt-3 border-t border-border flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Eye className="w-3.5 h-3.5" />
                      <span>{video.viewsCount || 0} vues</span>
                    </div>

                    <div className="flex items-center gap-1">
                      {/* Toggle On/Off */}
                      <button
                        onClick={() => toggleMutation.mutate(video._id)}
                        title={video.isActive ? 'Mettre en pause' : 'Activer'}
                        className={`p-1.5 rounded-lg border transition-colors ${video.isActive ? 'border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10' : 'border-border text-muted-foreground hover:bg-muted'}`}
                      >
                        {video.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>

                      {/* Edit */}
                      <button
                        onClick={() => {
                          setEditingVideo(video);
                          setIsFormOpen(true);
                        }}
                        title="Modifier"
                        className="p-1.5 rounded-lg border border-border text-foreground hover:bg-muted transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => setDeletingVideo(video)}
                        title="Supprimer"
                        className="p-1.5 rounded-lg border border-red-500/30 text-red-500 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Modal */}
      <AnimatePresence>
        {isFormOpen && (
          <PromoVideoModal
            initialVideo={editingVideo}
            onClose={() => {
              setIsFormOpen(false);
              setEditingVideo(null);
            }}
            onSuccess={() => {
              setIsFormOpen(false);
              setEditingVideo(null);
              queryClient.invalidateQueries({ queryKey: ['admin-promo-videos'] });
            }}
          />
        )}
      </AnimatePresence>

      {/* Delete confirmation modal */}
      {deletingVideo && (
        <DeleteConfirm
          title="Supprimer cette publicité vidéo ?"
          message={`Êtes-vous sûr de vouloir supprimer "${deletingVideo.title}" ? Cette action est irréversible.`}
          onConfirm={() => deleteMutation.mutate(deletingVideo._id)}
          onClose={() => setDeletingVideo(null)}
        />
      )}
    </div>
  );
}

/* ─── Promo Video Modal Form ─── */
function PromoVideoModal({
  initialVideo,
  onClose,
  onSuccess,
}: {
  initialVideo: PromoVideo | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const isEditing = Boolean(initialVideo);
  const [title, setTitle] = useState(initialVideo?.title || '');
  const [subtitle, setSubtitle] = useState(initialVideo?.subtitle || '');
  const [description, setDescription] = useState(initialVideo?.description || '');
  const [videoUrl, setVideoUrl] = useState(initialVideo?.videoUrl || '');
  const [thumbnailUrl, setThumbnailUrl] = useState(initialVideo?.thumbnailUrl || '');
  const [productName, setProductName] = useState(initialVideo?.productName || '');
  const [productLink, setProductLink] = useState(initialVideo?.productLink || '/products');
  const [price, setPrice] = useState(initialVideo?.price ? String(initialVideo.price) : '');
  const [discountPrice, setDiscountPrice] = useState(initialVideo?.discountPrice ? String(initialVideo.discountPrice) : '');
  const [badge, setBadge] = useState(initialVideo?.badge || 'PROMO EXCLUSIVE');
  const [placement, setPlacement] = useState<'all' | 'marquee' | 'showcase'>(initialVideo?.placement || 'all');
  const [isActive, setIsActive] = useState(initialVideo?.isActive !== undefined ? initialVideo.isActive : true);
  const [order, setOrder] = useState(initialVideo?.order !== undefined ? String(initialVideo.order) : '0');

  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // File upload handler
  const handleFileUpload = async (file: File, type: 'video' | 'image') => {
    const token = localStorage.getItem('adminToken');
    const formData = new FormData();
    formData.append('file', file);

    if (type === 'video') setIsUploadingVideo(true);
    else setIsUploadingThumbnail(true);

    try {
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || 'Erreur lors du téléversement');
      }
      const data = await res.json();
      if (type === 'video') {
        setVideoUrl(data.url);
        toast.success('Vidéo uploadée avec succès !');
      } else {
        setThumbnailUrl(data.url);
        toast.success('Miniature uploadée !');
      }
    } catch (err: any) {
      toast.error(err.message || "Échec de l'envoi du fichier");
    } finally {
      if (type === 'video') setIsUploadingVideo(false);
      else setIsUploadingThumbnail(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !videoUrl.trim()) {
      toast.error('Le titre et la vidéo sont obligatoires');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: PromoVideoInput = {
        title: title.trim(),
        subtitle: subtitle.trim() || undefined,
        description: description.trim() || undefined,
        videoUrl: videoUrl.trim(),
        thumbnailUrl: thumbnailUrl.trim() || undefined,
        productName: productName.trim() || undefined,
        productLink: productLink.trim() || '/products',
        price: price ? Number(price) : undefined,
        discountPrice: discountPrice ? Number(discountPrice) : undefined,
        badge: cleanBadgeText(badge),
        placement,
        isActive,
        order: Number(order) || 0,
      };

      if (isEditing && initialVideo) {
        await adminFetch(`/api/admin/promo-videos/${initialVideo._id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        toast.success('Publicité mise à jour avec succès !');
      } else {
        await adminFetch('/api/admin/promo-videos', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        toast.success('Nouvelle publicité vidéo créée !');
      }

      onSuccess();
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de l'enregistrement");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
    >
      <motion.div
        initial={{ scale: 0.95, y: 15 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 15 }}
        className="bg-card w-full max-w-2xl rounded-2xl border border-border shadow-2xl overflow-hidden my-8"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/20">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-orange-500/10 text-orange-500">
              <Film className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-foreground">
              {isEditing ? 'Modifier la publicité vidéo' : 'Ajouter une publicité vidéo'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Title & Subtitle */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                Titre de la publicité *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Smartwatch Ultra Series"
                className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                Sous-titre / Accroche
              </label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="Ex: Autonomie 7 jours & Écran AMOLED"
                className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
              Description courte
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Texte accrocheur décrivant l'offre ou la vidéo..."
              className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none"
            />
          </div>

          {/* Video Upload / URL */}
          <div className="p-4 rounded-xl bg-muted/30 border border-border space-y-3">
            <label className="block text-xs font-semibold text-foreground uppercase tracking-wide flex items-center justify-between">
              <span>Fichier Vidéo (MP4, WebM, MOV) *</span>
              {isUploadingVideo && (
                <span className="text-orange-500 flex items-center gap-1 normal-case text-xs">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Téléversement en cours...
                </span>
              )}
            </label>

            <div className="flex flex-col sm:flex-row gap-3">
              <label className="flex-1 flex items-center justify-center gap-2 border-2 border-dashed border-border hover:border-orange-500/60 p-4 rounded-xl cursor-pointer transition-colors bg-background">
                <Upload className="w-5 h-5 text-orange-500" />
                <span className="text-xs font-medium text-foreground">
                  {isUploadingVideo ? 'Envoi en cours...' : 'Choisir un fichier vidéo (jusqu’à 500 Mo)'}
                </span>
                <input
                  type="file"
                  accept="video/*"
                  disabled={isUploadingVideo}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFileUpload(f, 'video');
                  }}
                  className="hidden"
                />
              </label>

              <div className="flex-1">
                <input
                  type="text"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="Ou collez une URL vidéo directe (ex: /uploads/... ou https://...)"
                  className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-primary/20 focus:outline-none h-full"
                />
              </div>
            </div>

            {videoUrl && (
              <div className="relative aspect-video rounded-xl overflow-hidden bg-black max-h-48 mx-auto">
                <video src={videoUrl} controls className="w-full h-full object-contain" />
              </div>
            )}
          </div>

          {/* Thumbnail / Poster */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                Miniature / Poster (Optionnel)
              </label>
              <div className="flex gap-2">
                <label className="flex-shrink-0 px-3 py-2 bg-muted hover:bg-muted/80 rounded-xl border border-border text-xs cursor-pointer flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Image</span>
                  <input
                    type="file"
                    accept="image/*"
                    disabled={isUploadingThumbnail}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleFileUpload(f, 'image');
                    }}
                    className="hidden"
                  />
                </label>
                <input
                  type="text"
                  value={thumbnailUrl}
                  onChange={(e) => setThumbnailUrl(e.target.value)}
                  placeholder="URL de l'image de couverture"
                  className="flex-1 bg-background border border-border rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                Badge Promotionnel
              </label>
              <input
                type="text"
                value={badge}
                onChange={(e) => setBadge(e.target.value)}
                placeholder="Ex: FLASH SALE -30%, NOUVEAUTE, EXCLUSIF"
                className="w-full bg-background border border-border rounded-xl px-3.5 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none"
              />
            </div>
          </div>

          {/* Product Link & Name */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                Nom du Produit Lié
              </label>
              <input
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="Ex: Smartwatch Pro S8"
                className="w-full bg-background border border-border rounded-xl px-3.5 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                Lien de Redirection
              </label>
              <input
                type="text"
                value={productLink}
                onChange={(e) => setProductLink(e.target.value)}
                placeholder="Ex: /products ou /products/id..."
                className="w-full bg-background border border-border rounded-xl px-3.5 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none"
              />
            </div>
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                Prix Normal (FCFA)
              </label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="Ex: 45000"
                className="w-full bg-background border border-border rounded-xl px-3.5 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                Prix Promotionnel (FCFA)
              </label>
              <input
                type="number"
                value={discountPrice}
                onChange={(e) => setDiscountPrice(e.target.value)}
                placeholder="Ex: 38000"
                className="w-full bg-background border border-border rounded-xl px-3.5 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none"
              />
            </div>
          </div>

          {/* Placement & Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-border">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                Emplacement d'affichage
              </label>
              <select
                value={placement}
                onChange={(e) => setPlacement(e.target.value as any)}
                className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none"
              >
                <option value="all">Partout (Marquee + Vitrine)</option>
                <option value="marquee">Bandeau Marquee uniquement</option>
                <option value="showcase">Vitrine Vidéo uniquement</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                Ordre d'affichage
              </label>
              <input
                type="number"
                value={order}
                onChange={(e) => setOrder(e.target.value)}
                placeholder="0"
                className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none"
              />
            </div>

            <div className="flex flex-col justify-end">
              <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl bg-muted/40 border border-border">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 rounded text-primary focus:ring-primary/20"
                />
                <span className="text-xs font-semibold text-foreground">Diffuser immédiatement</span>
              </label>
            </div>
          </div>

          {/* Footer actions */}
          <div className="pt-4 border-t border-border flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isUploadingVideo}
              className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-6 py-2.5 rounded-xl text-sm font-medium shadow-lg shadow-orange-500/25 disabled:opacity-50 transition-all"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              <span>{isEditing ? 'Enregistrer les modifications' : 'Publier la vidéo'}</span>
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
