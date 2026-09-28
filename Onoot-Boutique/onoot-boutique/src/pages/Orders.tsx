import React from "react";
import { Link, useLocation } from "wouter";
import { Layout } from "@/components/layout/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { useListOrders, getListOrdersQueryKey } from "@workspace/api-client-react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Package, Eye, Clock, CheckCircle, TruckIcon, TicketIcon, XCircle, Trash2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { CancelOrderDialog } from "@/components/CancelOrderDialog";

const STATUS_FLOW = [
  { key: 'pending',   label: 'En attente', icon: Clock,       color: 'text-amber-500',   bg: 'bg-amber-100'   },
  { key: 'confirmed', label: 'Confirmée',  icon: CheckCircle, color: 'text-blue-500',    bg: 'bg-blue-100'    },
  { key: 'shipped',   label: 'Expédiée',   icon: TruckIcon,   color: 'text-indigo-500',  bg: 'bg-indigo-100'  },
  { key: 'delivered', label: 'Livrée',     icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-100' },
];

const STATUS_BADGE: Record<string, string> = {
  pending:   'bg-amber-100   text-amber-700',
  confirmed: 'bg-blue-100    text-blue-700',
  shipped:   'bg-indigo-100  text-indigo-700',
  delivered: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-red-100     text-red-700',
};

const STATUS_LABEL: Record<string, string> = {
  pending:   'En attente',
  confirmed: 'Confirmée',
  shipped:   'Expédiée',
  delivered: 'Livrée',
  cancelled: 'Annulée',
};

function OrderProgress({ status }: { status: string }) {
  if (status === 'cancelled') return null;
  const currentIdx = STATUS_FLOW.findIndex((s) => s.key === status);
  return (
    <div className="flex items-center gap-1 mt-4">
      {STATUS_FLOW.map((step, i) => {
        const StepIcon = step.icon;
        const isDone = i <= currentIdx;
        const isCurrent = i === currentIdx;
        return (
          <React.Fragment key={step.key}>
            <div className={`flex flex-col items-center gap-0.5 font-medium transition-all ${isDone ? step.color : 'text-slate-300'}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                isCurrent
                  ? `${step.bg} ${step.color} ring-2 ring-current/30 scale-110`
                  : isDone
                  ? `${step.bg} ${step.color}`
                  : 'bg-slate-100 text-slate-300'
              }`}>
                <StepIcon className="w-3.5 h-3.5" />
              </div>
              <span className="hidden sm:block leading-tight text-center" style={{ fontSize: '9px' }}>{step.label}</span>
            </div>
            {i < STATUS_FLOW.length - 1 && (
              <div className={`h-0.5 flex-1 rounded-full transition-colors ${i < currentIdx ? 'bg-emerald-400' : 'bg-slate-200'}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

export default function Orders() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  if (!user) {
    setLocation("/auth/login");
    return null;
  }

  const [orderToCancel, setOrderToCancel] = React.useState<string | null>(null);

  const deleteOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const res = await fetch(`/api/orders/${orderId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Erreur réseau');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey({ userId: user.id }) });
      toast({ title: "Commande supprimée", description: "L'historique de cette commande a été effacé." });
    }
  });

  const { data, isLoading } = useListOrders({ userId: user.id }, {
    query: {
      enabled: !!user.id,
      queryKey: getListOrdersQueryKey({ userId: user.id }),
      refetchInterval: 3000, // Rafraîchissement toutes les 3s pour des tests plus rapides
      refetchIntervalInBackground: true, // Rafraîchit même si la fenêtre n'est pas au premier plan
    }
  });

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <Package className="h-8 w-8 text-primary" /> Mes Commandes
        </h1>
        <p className="text-muted-foreground text-sm mb-8">Suivez la progression de vos commandes en temps réel</p>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <div key={i} className="h-40 bg-card border border-border animate-pulse rounded-2xl" />)}
          </div>
        ) : !data || data.orders.length === 0 ? (
          <div className="text-center py-16 bg-card border border-border rounded-2xl">
            <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-40" />
            <p className="text-muted-foreground mb-4">Vous n'avez passé aucune commande.</p>
            <Button asChild>
              <Link href="/products">Découvrir nos produits</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {data.orders.map(order => (
              <div key={order.id} className="bg-card border border-border p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                {/* En-tête */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 text-white text-sm flex items-center justify-center font-bold flex-shrink-0">
                      {(order.shippingAddress?.fullName || 'C').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                          #{order.id.substring(order.id.length - 6).toUpperCase()}
                        </span>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_BADGE[order.orderStatus] || 'bg-slate-100 text-slate-600'}`}>
                          {STATUS_LABEL[order.orderStatus] || order.orderStatus}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Passée le {new Date(order.createdAt).toLocaleDateString('fr-FR')} · {order.items.length} art. · <span className="font-bold text-foreground">{order.totalAmount.toLocaleString()} FCFA</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/orders/${order.id}`}>
                        <Eye className="mr-1.5 h-3.5 w-3.5" /> Détails
                      </Link>
                    </Button>
                    <Button size="sm" className="bg-primary hover:bg-primary/90" asChild>
                      <Link href={`/orders/${order.id}/ticket`}>
                        <TicketIcon className="mr-1.5 h-3.5 w-3.5" /> Ticket
                      </Link>
                    </Button>
                  </div>
                </div>

                {/* Barre de progression */}
                <OrderProgress status={order.orderStatus} />

                {/* Actions contextuelles (Annuler / Supprimer) */}
                {(order.orderStatus === 'pending' || order.orderStatus === 'delivered' || order.orderStatus === 'cancelled') && (
                  <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end gap-2">
                    {order.orderStatus === 'pending' && (
                      <button
                        onClick={() => setOrderToCancel(order.id)}
                        className="text-xs flex items-center gap-1.5 text-amber-600 hover:text-amber-700 hover:bg-amber-50 px-3 py-1.5 rounded-lg transition-colors font-medium"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Annuler la commande
                      </button>
                    )}
                    
                    {(order.orderStatus === 'delivered' || order.orderStatus === 'cancelled') && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <button
                            disabled={deleteOrderMutation.isPending}
                            className="text-xs flex items-center gap-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors font-medium"
                          >
                            {deleteOrderMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                            Supprimer l'historique
                          </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Supprimer l'historique</AlertDialogTitle>
                            <AlertDialogDescription>
                              Voulez-vous vraiment effacer cette commande de votre historique ? Cette action est irréversible.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteOrderMutation.mutate(order.id)} className="bg-red-600 hover:bg-red-700">
                              Supprimer
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Modal d'annulation de commande avec motif */}
        <CancelOrderDialog
          orderId={orderToCancel}
          isOpen={!!orderToCancel}
          onClose={() => setOrderToCancel(null)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey({ userId: user?.id }) });
          }}
        />
      </div>
    </Layout>
  );
}
