import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Users, Package, Star, Info, Trash2, AlertTriangle, X } from 'lucide-react';
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
  const [notificationToDelete, setNotificationToDelete] = React.useState<string | null>(null);

  const notificationsQuery = useQuery({
    queryKey: ['admin-notifications'],
    queryFn: () => adminFetch<Notification[]>('/api/admin/notifications'),
  });

  const markAllRead = useMutation({
    mutationFn: () => adminFetch('/api/admin/notifications/mark-read', { method: 'POST' }),
    onSuccess: () => {
      toast.success('Notifications marquées comme lues');
      queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Erreur lors de la mise à jour');
    },
  });

  const deleteNotification = useMutation({
    mutationFn: (id: string) => adminFetch(`/api/admin/notifications/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      toast.success('Notification supprimée');
      setNotificationToDelete(null);
      queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Erreur lors de la suppression');
    },
  });

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotificationToDelete(id);
  };

  const notifications = notificationsQuery.data || [];
  const unreadCount = notifications.filter(n => !n.read).length;

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
          <p className="text-muted-foreground mt-1">
            {unreadCount} notification{unreadCount > 1 ? 's' : ''} non lue{unreadCount > 1 ? 's' : ''}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllRead.mutate()}
            disabled={markAllRead.isPending}
            className="text-sm text-primary font-medium hover:underline disabled:opacity-50"
          >
            Tout marquer comme lu
          </button>
        )}
      </div>

      <div className="space-y-3">
        {notificationsQuery.isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-card border border-border animate-pulse" />
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
          return (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: Math.min(i * 0.05, 0.4) }}
              className={`flex items-start gap-4 p-5 rounded-2xl border transition-colors ${!n.read ? 'bg-card border-primary/20 shadow-sm' : 'bg-muted/30 border-border/50'}`}
            >
              <div className={`p-2.5 rounded-xl flex-shrink-0 ${cfg.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-sm font-semibold ${!n.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {n.title}
                  </p>
                  <span className="text-xs text-muted-foreground flex-shrink-0">{formatTime(n.createdAt)}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">{n.desc}</p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0 ml-2">
                {!n.read && <div className="w-2 h-2 rounded-full bg-primary" />}
                <button
                  onClick={(e) => handleDelete(n.id, e)}
                  disabled={deleteNotification.isPending}
                  className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                  title="Supprimer la notification"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence>
        {notificationToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border shadow-lg rounded-xl w-full max-w-md overflow-hidden relative"
            >
              <button
                onClick={() => setNotificationToDelete(null)}
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0">
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
                    className="px-4 py-2 text-sm font-medium rounded-lg text-muted-foreground hover:bg-muted transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={() => deleteNotification.mutate(notificationToDelete)}
                    disabled={deleteNotification.isPending}
                    className="px-4 py-2 text-sm font-medium rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors flex items-center gap-2"
                  >
                    {deleteNotification.isPending ? 'Suppression...' : 'Oui, supprimer'}
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
