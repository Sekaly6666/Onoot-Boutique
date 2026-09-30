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
  RotateCcw,
  MessageCircle
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
function cleanPhoneNumber(phone?: string): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('225')) return digits;
  if (digits.length === 10) return `225${digits}`;
  return digits;
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
  const [shippingFees, setShippingFees] = useState<Record<string, string>>({});

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

  const updateShippingFeeMutation = useMutation({
    mutationFn: ({ id, shippingCost }: { id: string; shippingCost: number }) =>
      adminFetch(`/api/orders/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ shippingCost }),
      }),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      setShippingFees((prev) => {
        const next = { ...prev };
        delete next[vars.id];
        return next;
      });
      toast.success('Frais de transport enregistrés et mis à jour');
    },
    onError: (error) => {
      toast.error('Erreur lors de la mise à jour des frais : ' + error.message);
    },
  });

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
            const isInteriorOrder = Boolean(
              o.notes?.toLowerCase().includes("expédition hors abidjan") ||
              o.notes?.toLowerCase().includes("expédition en gare") ||
              o.shippingAddress?.city?.toLowerCase().includes("intérieur") ||
              o.shippingAddress?.city?.toLowerCase().includes("hors abidjan")
            );
            const shippingCostVal = (o as any).shippingCost ?? 0;
            const isPendingShippingQuote = isInteriorOrder && shippingCostVal === 0;

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
                        {isInteriorOrder && (
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${
                            isPendingShippingQuote 
                              ? 'bg-amber-100 text-amber-800 border-amber-300 animate-pulse'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}>
                            <Truck className="w-3 h-3" />
                            {isPendingShippingQuote ? 'Gare : Devis en attente' : 'Gare : Frais fixés'}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {date} · {totalItems} art. · Colis: {((o as any).itemsTotal ?? (o.totalAmount - shippingCostVal)).toLocaleString()} FCFA + Livr: {isPendingShippingQuote ? (
                          <span className="text-amber-600 font-bold">À convenir (WhatsApp)</span>
                        ) : (
                          `${shippingCostVal.toLocaleString()} FCFA`
                        )} &bull; <strong className="text-slate-700">{o.totalAmount.toLocaleString()} FCFA</strong>
                      </div>
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

                        {/* Bloc Expédition Hors d'Abidjan en Gare (Option 2 - Devis WhatsApp & Saisie des Frais) */}
                        {isInteriorOrder && (
                          <div className={`rounded-2xl p-4 border transition-all ${
                            isPendingShippingQuote 
                              ? 'bg-amber-50/90 border-amber-300 shadow-xs' 
                              : 'bg-slate-50/80 border-slate-200'
                          }`}>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-amber-200/60">
                              <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                                  <Truck className="w-5 h-5" />
                                </div>
                                <div>
                                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                    <span>Expédition Hors d'Abidjan (En gare)</span>
                                    {isPendingShippingQuote && (
                                      <span className="text-[10px] font-extrabold px-2 py-0.5 bg-amber-200 text-amber-900 rounded-full">
                                        À TRAITER
                                      </span>
                                    )}
                                  </h4>
                                  <p className="text-xs text-slate-500">
                                    {isPendingShippingQuote 
                                      ? 'Échangez avec le client sur WhatsApp pour convenir des frais de transport en gare.' 
                                      : 'Frais de transport fixés et enregistrés sur la commande.'}
                                  </p>
                                </div>
                              </div>

                              {o.shippingAddress?.phone && (
                                <a
                                  href={`https://wa.me/${cleanPhoneNumber(o.shippingAddress.phone)}?text=${encodeURIComponent(
                                    `Bonjour ${customerName},\nConcernant votre commande Onoot Boutique #${o.id.substring(o.id.length - 6).toUpperCase()} (${totalItems} article(s) d'un montant de ${((o as any).itemsTotal ?? (o.totalAmount - shippingCostVal)).toLocaleString()} FCFA).\nNous vous contactons pour convenir des frais d'expédition en car/gare vers ${o.shippingAddress?.city || 'votre destination'}.`
                                  )}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer active:scale-95 shrink-0"
                                >
                                  <MessageCircle className="w-4 h-4" />
                                  <span>Contacter sur WhatsApp</span>
                                </a>
                              )}
                            </div>

                            {o.notes && (
                              <div className="mt-3 p-3 rounded-xl bg-white/90 border border-amber-200/80 text-xs text-slate-700 space-y-1">
                                <span className="font-bold text-amber-900 block text-[11px] uppercase tracking-wide">
                                  Détails de l'expédition (renseignés par le client) :
                                </span>
                                <p className="font-medium text-xs text-slate-800 whitespace-pre-wrap">{o.notes}</p>
                              </div>
                            )}

                            {/* Formulaire de saisie et modification des frais de livraison */}
                            <div className="mt-3.5 pt-3 border-t border-amber-200/60 space-y-2">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                                <label className="font-bold text-slate-800">
                                  Frais de transport convenus avec le client (FCFA) :
                                </label>
                                {shippingCostVal > 0 ? (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 text-[11px]">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                    Frais actuels : {shippingCostVal.toLocaleString()} FCFA (Modifiable)
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-bold text-amber-800 bg-amber-100 border border-amber-300 text-[11px]">
                                    Frais non encore renseignés
                                  </span>
                                )}
                              </div>

                              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                                <div className="relative flex-1">
                                  <input
                                    type="number"
                                    min="0"
                                    step="500"
                                    placeholder={shippingCostVal > 0 ? `Montant actuel: ${shippingCostVal}` : "Ex: 2500"}
                                    value={shippingFees[o.id] !== undefined ? shippingFees[o.id] : (shippingCostVal > 0 ? shippingCostVal : '')}
                                    onClick={(e) => e.stopPropagation()}
                                    onChange={(e) => {
                                      setShippingFees({ ...shippingFees, [o.id]: e.target.value });
                                    }}
                                    className="w-full text-xs px-3.5 py-2.5 border border-slate-300 rounded-xl bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 font-bold"
                                  />
                                </div>

                                <button
                                  type="button"
                                  disabled={updateShippingFeeMutation.isPending}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const feeInput = shippingFees[o.id];
                                    const feeNumber = feeInput !== undefined && feeInput !== '' ? parseFloat(feeInput) : shippingCostVal;
                                    if (isNaN(feeNumber) || feeNumber < 0) {
                                      toast.error('Veuillez saisir un montant de frais valide (0 ou plus)');
                                      return;
                                    }
                                    updateShippingFeeMutation.mutate({ id: o.id, shippingCost: feeNumber });
                                  }}
                                  className={`px-5 py-2.5 min-h-[42px] rounded-xl text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer active:scale-95 shrink-0 ${
                                    shippingCostVal > 0
                                      ? "bg-blue-600 hover:bg-blue-700"
                                      : "bg-amber-600 hover:bg-amber-700"
                                  }`}
                                >
                                  {updateShippingFeeMutation.isPending ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : shippingCostVal > 0 ? (
                                    <RotateCcw className="w-4 h-4" />
                                  ) : (
                                    <CheckCircle2 className="w-4 h-4" />
                                  )}
                                  <span>{shippingCostVal > 0 ? "Modifier / Mettre à jour" : "Enregistrer les frais"}</span>
                                </button>
                              </div>

                              {shippingCostVal > 0 && (
                                <p className="text-[11px] text-slate-500 italic">
                                  Vous pouvez modifier ce montant à tout moment ci-dessus en cas d'erreur ou d'ajustement. Le total de la commande sera automatiquement recalculé.
                                </p>
                              )}
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
                            <div className="border-t border-slate-200 mt-2.5 pt-2.5 space-y-1.5 text-xs">
                              <div className="flex justify-between text-slate-500">
                                <span>Prix colis (Articles) :</span>
                                <span className="font-semibold text-slate-800">
                                  {((o as any).itemsTotal ?? (o.totalAmount - shippingCostVal)).toLocaleString()} FCFA
                                </span>
                              </div>
                              <div className="flex justify-between text-slate-500">
                                <span>Frais de livraison :</span>
                                {isPendingShippingQuote ? (
                                  <span className="font-bold text-amber-600">
                                    À convenir sur WhatsApp
                                  </span>
                                ) : (
                                  <span className="font-semibold text-orange-600">
                                    +{shippingCostVal.toLocaleString()} FCFA
                                  </span>
                                )}
                              </div>
                              <div className="border-t border-slate-200 pt-1.5 flex justify-between font-bold text-slate-900 text-sm">
                                <span>Total à encaisser :</span>
                                <span className="text-emerald-700 font-extrabold">{o.totalAmount.toLocaleString()} FCFA</span>
                              </div>
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
