import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Search, 
  CheckCircle, 
  Clock, 
  XCircle, 
  TruckIcon, 
  Loader2, 
  Package, 
  ChevronRight, 
  Trash2,
  Phone,
  Calendar,
  CreditCard,
  CheckCircle2,
  Truck,
  PackageCheck,
  AlertCircle,
  RotateCcw
} from 'lucide-react';
import toast from 'react-hot-toast';

async function adminFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('adminToken');
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    ...((options.headers as Record<string, string>) || {}),
  };
  if (options.body && typeof options.body === 'string') {
    headers['Content-Type'] = 'application/json';
  }
  const res = await fetch(path, { ...options, headers });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || 'Erreur réseau');
  }
  return res.json();
}

type Order = {
  id: string;
  userId: string | null;
  items: any[];
  totalAmount: number;
  paymentMethod: string;
  orderStatus: string;
  shippingAddress: any;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

// Workflow des statuts dans l'ordre
const STATUS_FLOW = ['pending', 'confirmed', 'shipped', 'delivered'];

const statusConfig: Record<string, { label: string; bgClass: string; textClass: string; borderClass: string; icon: any }> = {
  pending:   { label: 'En attente',  bgClass: 'bg-amber-50',   textClass: 'text-amber-700',   borderClass: 'border-amber-200',  icon: Clock },
  confirmed: { label: 'Confirmée',   bgClass: 'bg-blue-50',    textClass: 'text-blue-700',    borderClass: 'border-blue-200',   icon: Package },
  shipped:   { label: 'Expédiée',    bgClass: 'bg-indigo-50',  textClass: 'text-indigo-700',  borderClass: 'border-indigo-200', icon: TruckIcon },
  delivered: { label: 'Livrée',      bgClass: 'bg-emerald-50', textClass: 'text-emerald-700', borderClass: 'border-emerald-200',icon: CheckCircle },
  cancelled: { label: 'Annulée',     bgClass: 'bg-red-50',     textClass: 'text-red-700',     borderClass: 'border-red-200',    icon: XCircle },
};

// Actions possibles selon le statut actuel (vers l'avant)
const nextActionConfig: Record<string, { label: string; nextStatus: string; btnClass: string; icon: any } | null> = {
  pending:   { label: 'Confirmer la commande',    nextStatus: 'confirmed', btnClass: 'bg-blue-600 hover:bg-blue-700 text-white', icon: CheckCircle2 },
  confirmed: { label: 'Marquer comme Expédiée',  nextStatus: 'shipped',   btnClass: 'bg-indigo-600 hover:bg-indigo-700 text-white', icon: Truck },
  shipped:   { label: 'Marquer comme Livrée',    nextStatus: 'delivered', btnClass: 'bg-emerald-600 hover:bg-emerald-700 text-white', icon: PackageCheck },
  delivered: null,
  cancelled: null,
};

// Actions de retour en arrière (en cas d'oubli ou de modification nécessaire)
const prevActionConfig: Record<string, { label: string; prevStatus: string; icon: any } | null> = {
  pending: null,
  confirmed: { label: 'Revenir à « En attente »', prevStatus: 'pending', icon: RotateCcw },
  shipped:   { label: 'Revenir à « Confirmée »',   prevStatus: 'confirmed', icon: RotateCcw },
  delivered: { label: 'Revenir à « Expédiée »',    prevStatus: 'shipped',   icon: RotateCcw },
  cancelled: null,
};

const filterOptions = ['Toutes', 'En attente', 'Confirmées', 'Expédiées', 'Livrées', 'Annulées'];

function formatLocation(address?: string, city?: string): string {
  const rawParts: string[] = [];
  if (city && city.trim()) rawParts.push(...city.split(','));
  if (address && address.trim()) rawParts.push(...address.split(','));

  const cleanParts: string[] = [];
  const seen = new Set<string>();

  for (const part of rawParts) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const lower = trimmed.toLowerCase();
    if (!seen.has(lower)) {
      seen.add(lower);
      cleanParts.push(trimmed);
    }
  }

  return cleanParts.join(', ');
}
const filterToStatus: Record<string, string> = {
  'En attente': 'pending',
  'Confirmées': 'confirmed',
  'Expédiées':  'shipped',
  'Livrées':    'delivered',
  'Annulées':   'cancelled',
};

const Orders: React.FC = () => {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('Toutes');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);

  const { data, isLoading, isError } = useQuery<{ orders: Order[]; total: number }>({
    queryKey: ['admin-orders', statusFilter],
    queryFn: () => {
      let url = '/api/orders?limit=100';
      const status = filterToStatus[statusFilter];
      if (status) url += `&status=${status}`;
      return adminFetch(url);
    },
    refetchInterval: 30000,
  });

  const [deliveryDates, setDeliveryDates] = useState<Record<string, string>>({});

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, estimatedDeliveryDate }: { id: string; status: string; estimatedDeliveryDate?: string }) =>
      adminFetch(`/api/orders/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ 
          orderStatus: status,
          estimatedDeliveryDate: estimatedDeliveryDate || deliveryDates[id] || undefined
        }),
      }),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      const cfg = statusConfig[vars.status];
      toast.success(`Statut mis à jour → ${cfg?.label || vars.status}`);
    },
    onError: (error) => {
      toast.error('Erreur: ' + error.message);
    },
  });

  const deleteOrderMutation = useMutation({
    mutationFn: (id: string) =>
      adminFetch(`/api/orders/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      toast.success('Commande supprimée avec succès');
      setExpandedOrder(null);
      setOrderToDelete(null);
    },
    onError: (error) => {
      toast.error('Erreur lors de la suppression: ' + error.message);
    },
  });

  const orders = data?.orders || [];
  const filteredOrders = orders.filter((o) => {
    const s = `${o.id} ${o.shippingAddress?.fullName} ${o.shippingAddress?.city}`.toLowerCase();
    return s.includes(searchTerm.toLowerCase());
  });

  const stats = {
    pending:   orders.filter((o) => o.orderStatus === 'pending').length,
    confirmed: orders.filter((o) => o.orderStatus === 'confirmed').length,
    shipped:   orders.filter((o) => o.orderStatus === 'shipped').length,
    delivered: orders.filter((o) => o.orderStatus === 'delivered').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Commandes</h1>
        <p className="text-slate-500 mt-1">Gérez et faites progresser chaque commande</p>
      </div>

      {/* Cartes de stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { key: 'pending',   label: 'En attente', color: 'text-amber-600   bg-amber-50   border-amber-100'   },
          { key: 'confirmed', label: 'Confirmées', color: 'text-blue-600    bg-blue-50    border-blue-100'    },
          { key: 'shipped',   label: 'Expédiées',  color: 'text-indigo-600  bg-indigo-50  border-indigo-100'  },
          { key: 'delivered', label: 'Livrées',    color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
        ].map((s) => {
          const Ic = statusConfig[s.key].icon;
          return (
            <button
              key={s.key}
              onClick={() => setStatusFilter(filterOptions.find((f) => filterToStatus[f] === s.key) || 'Toutes')}
              className={`flex items-center gap-3 p-4 rounded-xl border font-medium transition-all hover:shadow-sm cursor-pointer ${s.color}`}
            >
              <Ic className="w-5 h-5 flex-shrink-0" />
              <div className="text-left">
                <div className="text-2xl font-bold">{stats[s.key as keyof typeof stats]}</div>
                <div className="text-xs opacity-80">{s.label}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Filtres et recherche */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher par ID, client ou ville..."
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-white"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0 flex-shrink-0 scrollbar-none">
          {filterOptions.map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`whitespace-nowrap px-3.5 py-2 min-h-[38px] text-xs font-semibold rounded-xl transition-all active:scale-95 ${
                statusFilter === f ? 'bg-primary text-white shadow-sm' : 'text-slate-600 bg-white border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Liste des commandes */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
        {isLoading ? (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-6 py-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
            <p className="text-slate-500">Chargement des commandes...</p>
          </div>
        ) : isError ? (
          <div className="bg-red-50 border border-red-100 rounded-2xl px-6 py-12 text-center text-red-600">
            Impossible de charger les commandes.
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-6 py-12 text-center text-slate-500">
            Aucune commande trouvée.
          </div>
        ) : (
          filteredOrders.map((o, idx) => {
            const s = statusConfig[o.orderStatus] || statusConfig['pending'];
            const StatusIcon = s.icon;
            const action = nextActionConfig[o.orderStatus];
            const prevAction = prevActionConfig[o.orderStatus];
            const deliveryDateValue = (deliveryDates[o.id] ?? (o as any).estimatedDeliveryDate ?? '').trim();
            const isPendingWithoutDate = o.orderStatus === 'pending' && !deliveryDateValue;
            const totalItems = o.items.reduce((acc, item) => acc + item.quantity, 0);
            const customerName = o.shippingAddress?.fullName || 'Client Anonyme';
            const date = new Date(o.createdAt).toLocaleDateString('fr-FR', {
              day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
            });
            const isExpanded = expandedOrder === o.id;
            const statusIndex = STATUS_FLOW.indexOf(o.orderStatus);

            return (
              <motion.div
                key={o.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
              >
                {/* Ligne principale - cliquable pour déplier */}
                <div
                  className="flex items-center justify-between gap-4 px-5 py-4 cursor-pointer hover:bg-slate-50/50 transition-colors"
                  onClick={() => setExpandedOrder(isExpanded ? null : o.id)}
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-white text-sm flex items-center justify-center font-bold flex-shrink-0 shadow-sm">
                      {customerName.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          #{o.id.substring(o.id.length - 6).toUpperCase()}
                        </span>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${s.bgClass} ${s.textClass} ${s.borderClass}`}>
                          <StatusIcon className="w-3 h-3" /> {s.label}
                        </span>
                      </div>
                      <div className="font-semibold text-slate-800 mt-0.5 truncate">{customerName}</div>
                      <div className="text-xs text-slate-400">{date} · {totalItems} art. · {o.totalAmount.toLocaleString()} FCFA</div>
                    </div>
                  </div>
                  <ChevronRight className={`w-5 h-5 text-slate-400 flex-shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
                </div>

                {/* Panneau déplié */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 border-t border-slate-100 pt-4 space-y-5">

                        {/* Barre de progression du workflow */}
                        {o.orderStatus !== 'cancelled' && (
                          <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Progression</p>
                            <div className="flex items-center gap-1">
                              {STATUS_FLOW.map((st, i) => {
                                const stCfg = statusConfig[st];
                                const StIcon = stCfg.icon;
                                const isDone = i <= statusIndex;
                                const isCurrent = i === statusIndex;
                                return (
                                  <React.Fragment key={st}>
                                    <div className={`flex flex-col items-center gap-1 text-xs font-medium transition-all ${isDone ? stCfg.textClass : 'text-slate-300'}`}>
                                      <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all ${
                                        isCurrent
                                          ? `${stCfg.bgClass} ${stCfg.textClass} border-current shadow-md scale-110`
                                          : isDone
                                          ? `${stCfg.bgClass} ${stCfg.textClass} border-current`
                                          : 'bg-slate-100 border-slate-200 text-slate-300'
                                      }`}>
                                        <StIcon className="w-4 h-4" />
                                      </div>
                                      <span className="hidden sm:block text-center leading-tight" style={{ fontSize: '9px' }}>{stCfg.label}</span>
                                    </div>
                                    {i < STATUS_FLOW.length - 1 && (
                                      <div className={`h-0.5 flex-1 rounded-full transition-colors ${i < statusIndex ? 'bg-emerald-400' : 'bg-slate-200'}`} />
                                    )}
                                  </React.Fragment>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Info client + Articles */}
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div className="bg-slate-50 rounded-xl p-4">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Client & Livraison</p>
                            <p className="font-semibold text-slate-800">{o.shippingAddress?.fullName}</p>
                            <p className="text-sm font-medium text-slate-600">{formatLocation(o.shippingAddress?.address, o.shippingAddress?.city)}</p>
                            
                            {o.shippingAddress?.phone && (
                              <div className="flex items-center gap-2 text-sm text-slate-600 mt-2">
                                <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                                <span>{o.shippingAddress?.phone}</span>
                              </div>
                            )}

                            <div className="flex items-center gap-2 text-xs text-slate-500 mt-1.5">
                              <CreditCard className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                              <span>Paiement : <strong className="text-slate-700 font-medium capitalize">{o.paymentMethod}</strong></span>
                            </div>

                            {/* Affichage épuré du délai prévu s'il existe une fois la commande confirmée */}
                            {(o as any).estimatedDeliveryDate && o.orderStatus !== 'pending' && (
                              <div className="flex items-center gap-2 text-xs text-blue-700 bg-blue-50 border border-blue-200/70 rounded-lg px-2.5 py-1.5 mt-2.5">
                                <Calendar className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                                <span>Livraison prévue : <strong className="text-blue-900 font-semibold">{(o as any).estimatedDeliveryDate}</strong></span>
                              </div>
                            )}
                          </div>
                          <div className="bg-slate-50 rounded-xl p-4">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Articles commandés</p>
                            <div className="space-y-1">
                              {o.items.map((item: any, i: number) => (
                                <div key={i} className="flex justify-between text-sm">
                                  <span className="text-slate-700 truncate flex-1 mr-2">{item.productName}</span>
                                  <span className="text-slate-500 flex-shrink-0">×{item.quantity}</span>
                                </div>
                              ))}
                            </div>
                            <div className="border-t border-slate-200 mt-2 pt-2 flex justify-between font-bold text-slate-800 text-sm">
                              <span>Total</span>
                              <span>{o.totalAmount.toLocaleString()} FCFA</span>
                            </div>
                          </div>
                        </div>

                        {/* Champ obligatoire de date de livraison estimée : UNIQUEMENT à l'étape "En attente" pour la confirmation */}
                        {o.orderStatus === 'pending' && (
                          <div className={`mb-3 rounded-xl p-3.5 border transition-all ${
                            isPendingWithoutDate
                              ? 'bg-amber-50/70 border-amber-300'
                              : 'bg-blue-50/50 border-blue-100'
                          }`}>
                            <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
                              <label className="flex items-center gap-2 text-xs font-semibold text-slate-800">
                                <Calendar className="w-4 h-4 text-blue-600 flex-shrink-0" />
                                <span>Date / Délai prévu de livraison :</span>
                              </label>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                isPendingWithoutDate
                                  ? 'bg-amber-100 text-amber-800 border-amber-300'
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              }`}>
                                {isPendingWithoutDate ? '* Champ obligatoire' : '✓ Renseigné'}
                              </span>
                            </div>
                            <input
                              type="text"
                              placeholder="Ex: Demain entre 14h et 18h / Sous 24h - 48h"
                              value={deliveryDates[o.id] ?? (o as any).estimatedDeliveryDate ?? ''}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => {
                                setDeliveryDates({ ...deliveryDates, [o.id]: e.target.value });
                              }}
                              className={`w-full text-xs px-3 py-2.5 border rounded-lg bg-white focus:outline-none focus:ring-2 transition-all text-slate-800 placeholder:text-slate-400 ${
                                isPendingWithoutDate
                                  ? 'border-amber-400 focus:ring-amber-200 focus:border-amber-500'
                                  : 'border-slate-200 focus:ring-blue-500/20 focus:border-blue-500'
                              }`}
                            />
                            {isPendingWithoutDate && (
                              <p className="text-[11px] text-amber-700 font-medium mt-1.5 flex items-center gap-1.5">
                                <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                Vous devez obligatoirement renseigner ce délai pour pouvoir confirmer la commande.
                              </p>
                            )}
                          </div>
                        )}

                        {/* Motif d'annulation client si commande annulée */}
                        {o.orderStatus === 'cancelled' && (o as any).cancelReason && (
                          <div className="mb-3 bg-red-50/80 border border-red-200 rounded-xl p-3.5">
                            <p className="text-xs font-bold uppercase tracking-wider text-red-700 mb-1 flex items-center gap-1.5">
                              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                              <span>Motif d'annulation client :</span>
                            </p>
                            <p className="text-sm font-semibold text-red-900">
                              &laquo;&nbsp;{(o as any).cancelReason}&nbsp;&raquo;
                            </p>
                          </div>
                        )}

                        {/* Boutons d'action (Progression et Retour en arrière) */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                          {prevAction && (
                            <button
                              type="button"
                              disabled={updateStatusMutation.isPending}
                              onClick={(e) => {
                                e.stopPropagation();
                                updateStatusMutation.mutate({ 
                                  id: o.id, 
                                  status: prevAction.prevStatus,
                                });
                              }}
                              className="order-2 sm:order-1 px-4 py-3 min-h-[46px] rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-xs active:scale-[0.98] cursor-pointer hover:border-slate-400"
                              title="Revenir à l'étape précédente en cas d'oubli ou d'erreur"
                            >
                              <RotateCcw className="w-4 h-4 text-slate-500" />
                              <span>{prevAction.label}</span>
                            </button>
                          )}

                          {action ? (
                            <button
                              type="button"
                              disabled={updateStatusMutation.isPending || isPendingWithoutDate}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (isPendingWithoutDate) return;
                                updateStatusMutation.mutate({ 
                                  id: o.id, 
                                  status: action.nextStatus,
                                  estimatedDeliveryDate: deliveryDates[o.id]
                                });
                              }}
                              className={`order-1 sm:order-2 flex-1 w-full min-h-[48px] py-3.5 px-5 rounded-xl font-bold text-sm sm:text-base transition-all flex items-center justify-center gap-2.5 shadow-md active:scale-[0.99] ${
                                isPendingWithoutDate 
                                  ? 'bg-slate-200 text-slate-400 border border-slate-300 shadow-none cursor-not-allowed opacity-75' 
                                  : `${action.btnClass} cursor-pointer`
                              }`}
                              title={isPendingWithoutDate ? "Veuillez obligatoirement renseigner le délai de livraison ci-dessus pour valider" : ""}
                            >
                              {updateStatusMutation.isPending ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                              ) : (
                                action.icon && <action.icon className="w-5 h-5" />
                              )}
                              <span>{action.label}</span>
                            </button>
                          ) : o.orderStatus === 'delivered' ? (
                            <div className="order-1 sm:order-2 flex-1 w-full min-h-[48px] py-3.5 px-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-sm sm:text-base text-center flex items-center justify-center gap-2.5">
                              <CheckCircle className="w-5 h-5 text-emerald-600" />
                              <span>Commande livrée avec succès</span>
                            </div>
                          ) : null}
                        </div>

                        {/* Bouton Supprimer */}
                        <div className="pt-2 flex justify-end border-t border-slate-100 mt-4">
                          <button
                            disabled={deleteOrderMutation.isPending}
                            onClick={(e) => {
                              e.stopPropagation();
                              setOrderToDelete(o.id);
                            }}
                            className="w-full sm:w-auto min-h-[40px] text-xs sm:text-sm flex items-center justify-center gap-2 text-red-500 hover:text-red-700 hover:bg-red-50 px-4 py-2 rounded-xl transition-colors font-semibold active:scale-95"
                          >
                            <Trash2 className="w-4 h-4" />
                            Supprimer la commande
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })
        )}
      </motion.div>

      {/* Modal de confirmation de suppression */}
      <AnimatePresence>
        {orderToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => !deleteOrderMutation.isPending && setOrderToDelete(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 overflow-hidden"
            >
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4 text-red-600">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Supprimer la commande</h3>
              <p className="text-slate-500 mb-6 text-sm">
                Êtes-vous sûr de vouloir supprimer définitivement cette commande ? Cette action est irréversible et supprimera toutes les informations associées.
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setOrderToDelete(null)}
                  disabled={deleteOrderMutation.isPending}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                  Annuler
                </button>
                <button 
                  onClick={() => deleteOrderMutation.mutate(orderToDelete)}
                  disabled={deleteOrderMutation.isPending}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {deleteOrderMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  Supprimer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Orders;
