import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Users, Package, Star, Info, Trash2, AlertTriangle, X, CheckSquare, Square, CheckCheck } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';

interface Notification {
  id: string;
  type: 'order' | 'user' | 'stock' | 'review' | 'info';
  title: string;
  desc: string;
  read: boolean;
  createdAt: string;
}

const TYPE_CONFIG = {
  order:  { icon: ShoppingCart, color: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' },
  user:   { icon: Users,        color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' },
  stock:  { icon: Package,      color: 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400' },
  review: { icon: Star,         color: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400' },
  info:   { icon: Info,         color: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' },
};

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

const Notifications: React.FC = () => {
  const queryClient = useQueryClient();
  const [notificationToDelete, setNotificationToDelete] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);

  const notificationsQuery = useQuery({
    queryKey: ['admin-notifications'],
    queryFn: () => adminFetch<Notification[]>('/api/admin/notifications'),
  });

  const notifications = notificationsQuery.data || [];
  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = useMutation({
    mutationFn: () => adminFetch('/api/admin/notifications/mark-read', { method: 'POST' }),
    onSuccess: () => {
      toast.success('Toutes les notifications ont été marquées comme lues');
      queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Erreur lors de la mise à jour');
    },
  });

  // Single delete
  const deleteNotification = useMutation({
    mutationFn: (id: string) => adminFetch(`/api/admin/notifications/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      toast.success('Notification supprimée');
      if (notificationToDelete) {
        setSelectedIds(prev => prev.filter(id => id !== notificationToDelete));
      }
      setNotificationToDelete(null);
      queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Erreur lors de la suppression');
    },
  });

  // Batch delete
  const batchDeleteMutation = useMutation({
    mutationFn: ({ ids, all }: { ids?: string[]; all?: boolean }) =>
      adminFetch('/api/admin/notifications/batch-delete', {
        method: 'POST',
        body: JSON.stringify({ ids, all }),
      }),
    onSuccess: () => {
      toast.success(
        isDeletingAll
          ? 'Toutes les notifications ont été supprimées'
          : `${selectedIds.length} notification(s) supprimée(s)`
      );
      setSelectedIds([]);
      setBatchModalOpen(false);
      setIsDeletingAll(false);
      queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Erreur lors de la suppression groupée');
    },
  });

  const handleDeleteSingle = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotificationToDelete(id);
  };

  const toggleSelectOne = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const isAllSelected = notifications.length > 0 && selectedIds.length === notifications.length;
  const isIndeterminate = selectedIds.length > 0 && selectedIds.length < notifications.length;

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(notifications.map(n => n.id));
    }
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
          <p className="text-muted-foreground mt-1">
            {notifications.length} notification{notifications.length > 1 ? 's' : ''} au total • {unreadCount} non lue{unreadCount > 1 ? 's' : ''}
          </p>
        </div>

        {/* Global actions */}
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-primary hover:bg-primary/10 rounded-xl border border-primary/20 transition-colors disabled:opacity-50"
            >
              <CheckCheck className="w-4 h-4" />
              Tout marquer lu
            </button>
          )}

          {notifications.length > 0 && (
            <button
              onClick={() => {
                setIsDeletingAll(true);
                setBatchModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl border border-red-200 dark:border-red-900/40 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Tout vider
            </button>
          )}
        </div>
      </div>

      {/* Barre de sélection groupée */}
      {notifications.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-card border border-border rounded-2xl shadow-sm">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2.5 cursor-pointer select-none text-xs sm:text-sm font-semibold text-foreground">
              <input
                type="checkbox"
                checked={isAllSelected}
                ref={(el) => {
                  if (el) el.indeterminate = isIndeterminate;
                }}
                onChange={handleSelectAll}
                className="w-4 h-4 rounded border-border text-[#E87C2A] focus:ring-[#E87C2A] cursor-pointer"
              />
              <span>Tout sélectionner ({notifications.length})</span>
            </label>

            {selectedIds.length > 0 && (
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary">
                {selectedIds.length} sélectionnée{selectedIds.length > 1 ? 's' : ''}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {selectedIds.length > 0 ? (
              <>
                <button
                  onClick={() => setSelectedIds([])}
                  className="text-xs font-medium text-muted-foreground hover:text-foreground px-2.5 py-1.5 rounded-lg hover:bg-muted transition-colors"
                >
                  Désélectionner
                </button>
                <button
                  onClick={() => {
                    setIsDeletingAll(false);
                    setBatchModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-sm transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Supprimer la sélection ({selectedIds.length})
                </button>
              </>
            ) : (
              <span className="text-xs text-muted-foreground italic">
                Cochez des notifications pour les supprimer en groupe
              </span>
            )}
          </div>
        </div>
      )}

      {/* Notifications list */}
      <div className="space-y-3">
        {notificationsQuery.isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-card border border-border rounded-2xl animate-pulse" />
            ))}
          </div>
        )}

        {notificationsQuery.isError && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl text-center">
            Impossible de charger les notifications.
          </div>
        )}

        {!notificationsQuery.isLoading && !notificationsQuery.isError && notifications.length === 0 && (
          <div className="bg-card border border-border rounded-2xl p-12 text-center text-muted-foreground">
            Aucune notification disponible.
          </div>
        )}

        {!notificationsQuery.isLoading && !notificationsQuery.isError && notifications.map((n, i) => {
          const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.info;
          const Icon = cfg.icon;
          const isSelected = selectedIds.includes(n.id);

          return (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: Math.min(i * 0.04, 0.3) }}
              className={`flex items-start gap-3.5 p-4 sm:p-5 rounded-2xl border transition-all ${
                isSelected
                  ? 'bg-primary/5 border-primary/40 shadow-sm'
                  : !n.read
                  ? 'bg-card border-primary/20 shadow-sm'
                  : 'bg-muted/30 border-border/50'
              }`}
            >
              {/* Checkbox sélection individuelle */}
              <div className="pt-2 flex-shrink-0">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={(e) => toggleSelectOne(n.id, e as any)}
                  className="w-4 h-4 rounded border-border text-[#E87C2A] focus:ring-[#E87C2A] cursor-pointer"
                  title="Sélectionner pour suppression groupée"
                />
              </div>

              {/* Icône du type */}
              <div className={`p-2.5 rounded-xl flex-shrink-0 ${cfg.color}`}>
                <Icon className="w-5 h-5" />
              </div>

              {/* Contenu */}
              <div className="flex-1 min-w-0 cursor-pointer" onClick={() => toggleSelectOne(n.id)}>
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-sm font-semibold ${!n.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {n.title}
                  </p>
                  <span className="text-xs text-muted-foreground flex-shrink-0">{formatTime(n.createdAt)}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">{n.desc}</p>
              </div>

              {/* Actions individuelles */}
              <div className="flex items-center gap-2.5 flex-shrink-0 ml-1 pt-1">
                {!n.read && <div className="w-2 h-2 rounded-full bg-primary" title="Non lu" />}
                <button
                  onClick={(e) => handleDeleteSingle(n.id, e)}
                  disabled={deleteNotification.isPending}
                  className="p-2 text-muted-foreground hover:text-red-600 hover:bg-red-500/10 rounded-xl transition-colors"
                  title="Supprimer cette notification"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* MODAL : Suppression individuelle */}
      <AnimatePresence>
        {notificationToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border shadow-xl rounded-2xl w-full max-w-md overflow-hidden relative"
            >
              <button
                onClick={() => setNotificationToDelete(null)}
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground">Supprimer la notification</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Êtes-vous sûr de vouloir supprimer cette notification ? Cette action est irréversible.
                    </p>
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => setNotificationToDelete(null)}
                    disabled={deleteNotification.isPending}
                    className="px-4 py-2 text-sm font-medium rounded-xl text-muted-foreground hover:bg-muted transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={() => deleteNotification.mutate(notificationToDelete)}
                    disabled={deleteNotification.isPending}
                    className="px-4 py-2 text-sm font-bold rounded-xl bg-red-600 text-white hover:bg-red-700 transition-colors flex items-center gap-2"
                  >
                    {deleteNotification.isPending ? 'Suppression...' : 'Oui, supprimer'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL : Suppression groupée / Tout supprimer */}
      <AnimatePresence>
        {batchModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border shadow-xl rounded-2xl w-full max-w-md overflow-hidden relative"
            >
              <button
                onClick={() => setBatchModalOpen(false)}
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground">
                      {isDeletingAll ? 'Vider toutes les notifications' : 'Supprimer la sélection groupée'}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {isDeletingAll
                        ? `Êtes-vous sûr de vouloir supprimer définitivement la totalité des ${notifications.length} notifications ?`
                        : `Êtes-vous sûr de vouloir supprimer définitivement les ${selectedIds.length} notification(s) cochée(s) ?`}
                    </p>
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => setBatchModalOpen(false)}
                    disabled={batchDeleteMutation.isPending}
                    className="px-4 py-2 text-sm font-medium rounded-xl text-muted-foreground hover:bg-muted transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={() => {
                      if (isDeletingAll) {
                        batchDeleteMutation.mutate({ all: true });
                      } else {
                        batchDeleteMutation.mutate({ ids: selectedIds });
                      }
                    }}
                    disabled={batchDeleteMutation.isPending}
                    className="px-4 py-2 text-sm font-bold rounded-xl bg-red-600 text-white hover:bg-red-700 transition-colors flex items-center gap-2"
                  >
                    {batchDeleteMutation.isPending ? 'Suppression...' : 'Confirmer la suppression'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Notifications;
