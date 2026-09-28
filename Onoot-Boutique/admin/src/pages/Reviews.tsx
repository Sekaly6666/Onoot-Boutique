import React from 'react';
import { motion } from 'framer-motion';
import { Star, Trash2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import DeleteConfirm from '../components/DeleteConfirm';

interface Review {
  id: string;
  productId: string;
  productName: string;
  userId?: string | null;
  userName: string;
  rating: number;
  comment?: string | null;
  createdAt: string;
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
  if (!res.ok) throw new Error(await res.text());
  return res.status === 204 ? (undefined as T) : res.json();
}

const Reviews: React.FC = () => {
  const queryClient = useQueryClient();
  const [reviewToDelete, setReviewToDelete] = React.useState<{ id: string; userName: string } | null>(null);

  const reviewsQuery = useQuery({
    queryKey: ['admin-reviews'],
    queryFn: () => adminFetch<Review[]>('/api/admin/reviews'),
  });

  const deleteReview = useMutation({
    mutationFn: (id: string) => adminFetch(`/api/admin/reviews/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      toast.success('Avis supprimé avec succès');
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Erreur lors de la suppression');
    },
  });

  const reviews = reviewsQuery.data || [];

  const handleDelete = (id: string, userName: string) => {
    setReviewToDelete({ id, userName });
  };

  const confirmDelete = () => {
    if (!reviewToDelete) return;
    deleteReview.mutate(reviewToDelete.id);
    setReviewToDelete(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Avis Clients</h1>
        <p className="text-muted-foreground mt-1">Gérer et modérer les avis des clients sur vos produits</p>
      </div>

      <div className="space-y-4">
        {reviewsQuery.isLoading && (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-card rounded-2xl border border-border animate-pulse" />
            ))}
          </div>
        )}

        {reviewsQuery.isError && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl text-center">
            Impossible de charger les avis.
          </div>
        )}

        {!reviewsQuery.isLoading && !reviewsQuery.isError && reviews.length === 0 && (
          <div className="bg-card border border-border rounded-2xl p-12 text-center text-muted-foreground">
            Aucun avis client disponible.
          </div>
        )}

        {!reviewsQuery.isLoading && !reviewsQuery.isError && reviews.map((r, i) => (
          <motion.div
            key={r.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i * 0.05, 0.5) }}
            className="bg-card rounded-2xl border border-border shadow-sm p-6"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent-yellow/50 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                  {r.userName?.[0] || '?'}
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-medium text-foreground">{r.userName}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(r.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">Produit : <span className="text-primary font-medium">{r.productName}</span></p>
                  <div className="flex gap-0.5 mb-2">
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star key={s} className={`w-4 h-4 ${s <= r.rating ? 'fill-amber-400 text-amber-400' : 'text-muted/40'}`} />
                    ))}
                  </div>
                  <p className="text-sm text-foreground">"{r.comment || 'Aucun commentaire'}"</p>
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => handleDelete(r.id, r.userName)}
                  disabled={deleteReview.isPending}
                  className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {reviewToDelete && (
        <DeleteConfirm
          title="Supprimer l'avis"
          message={`Êtes-vous sûr de vouloir supprimer l'avis de "${reviewToDelete.userName}" ? Cette action est irréversible.`}
          onClose={() => setReviewToDelete(null)}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
};

export default Reviews;
