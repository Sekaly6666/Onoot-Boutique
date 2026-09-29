import React from "react";
import { useParams, Link } from "wouter";
import { Layout } from "@/components/layout/Layout";
import { useGetOrder, getGetOrderQueryKey } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, CheckCircle2, Clock, Truck, PackageCheck, QrCode, XCircle, Trash2, Loader2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
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

export default function OrderDetail() {
  const { id } = useParams();
  const orderId = id as string;
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const [isCancelDialogOpen, setIsCancelDialogOpen] = React.useState<boolean>(false);

  const deleteOrderMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/orders/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Erreur réseau');
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Commande supprimée", description: "L'historique de cette commande a été effacé." });
      setLocation("/orders");
    }
  });

  const { data: order, isLoading } = useGetOrder(orderId, {
    query: {
      enabled: !!orderId,
      queryKey: getGetOrderQueryKey(orderId),
      refetchInterval: 3000,
      refetchIntervalInBackground: true,
    }
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 text-center">Chargement...</div>
      </Layout>
    );
  }

  if (!order) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 text-center">Commande non trouvée</div>
      </Layout>
    );
  }

  const statuses = ['pending', 'confirmed', 'shipped', 'delivered'];
  const currentIndex = statuses.indexOf(order.orderStatus);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <Button variant="link" className="px-0 text-primary" asChild>
            <Link href="/orders">
              <ArrowLeft className="mr-1 h-4 w-4" /> Retour aux commandes
            </Link>
          </Button>
          <Button variant="outline" className="gap-2" asChild>
            <Link href={`/orders/${order.id}/ticket`}>
              <QrCode className="w-4 h-4" /> Voir le ticket
            </Link>
          </Button>
        </div>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold">Commande #{order.id.substring(order.id.length - 6).toUpperCase()}</h1>
            <p className="text-muted-foreground mt-1">Passée le {new Date(order.createdAt).toLocaleString()}</p>
          </div>
          <Badge className="text-sm px-3 py-1 bg-primary text-white">
            {{
              pending: 'En attente',
              confirmed: 'Confirmée',
              shipped: 'Expédiée',
              delivered: 'Livrée'
            }[order.orderStatus] || order.orderStatus}
          </Badge>
        </div>

        {/* Timeline */}
        <div className="bg-card border border-border p-6 rounded-xl mb-8 overflow-hidden">
          <div className="flex items-center justify-between relative">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-muted z-0"></div>
            <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary z-0 transition-all duration-500" style={{ width: `${(currentIndex / (statuses.length - 1)) * 100}%` }}></div>
            
            {statuses.map((statusKey, index) => {
              const isCompleted = index <= currentIndex;
              const isCurrent = index === currentIndex;
              let Icon = Clock;
              if (index === 1) Icon = CheckCircle2;
              if (index === 2) Icon = Truck;
              if (index === 3) Icon = PackageCheck;

              const STATUS_LABEL: Record<string, string> = {
                pending: 'En attente',
                confirmed: 'Confirmée',
                shipped: 'Expédiée',
                delivered: 'Livrée'
              };

              return (
                <div key={statusKey} className="relative z-10 flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border-4 border-card transition-colors ${isCompleted ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className={`text-xs mt-2 font-medium transition-colors ${isCurrent ? 'text-primary' : isCompleted ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {STATUS_LABEL[statusKey] || statusKey}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-card border border-border p-6 rounded-xl">
            <h2 className="font-bold text-lg mb-4">Informations de livraison</h2>
            <div className="space-y-2 text-sm">
              <p><span className="text-muted-foreground">Nom:</span> {order.shippingAddress.fullName}</p>
              <p><span className="text-muted-foreground">Téléphone:</span> {order.shippingAddress.phone}</p>
              <p><span className="text-muted-foreground">Localisation:</span> {formatLocation(order.shippingAddress.address, order.shippingAddress.city)}</p>
              {order.shippingAddress.country && (
                <p><span className="text-muted-foreground">Pays:</span> {order.shippingAddress.country}</p>
              )}
            </div>
            <Separator className="my-4" />
            <h2 className="font-bold text-lg mb-4">Paiement</h2>
            <p className="text-sm">Méthode: <span className="font-medium">{order.paymentMethod}</span></p>
          </div>

          <div className="bg-card border border-border p-6 rounded-xl">
            <h2 className="font-bold text-lg mb-4">Articles commandés</h2>
            <div className="space-y-4 mb-4">
              {order.items.map(item => (
                <div key={item.productId} className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                      {item.productImage && <img src={item.productImage} alt={item.productName} className="w-8 h-8 object-contain mix-blend-multiply" />}
                    </div>
                    <div>
                      <p className="font-medium">{item.productName}</p>
                      <p className="text-muted-foreground">Qté: {item.quantity}</p>
                    </div>
                  </div>
                  <span className="font-medium">{(item.price * item.quantity).toLocaleString()} FCFA</span>
                </div>
              ))}
            </div>
            <Separator className="my-4" />
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center text-muted-foreground">
                <span>Sous-total articles</span>
                <span className="font-semibold text-foreground">
                  {((order as any).itemsTotal ?? (order.totalAmount - ((order as any).shippingCost || 0))).toLocaleString()} FCFA
                </span>
              </div>
              <div className="flex justify-between items-center text-muted-foreground">
                <span>Frais de livraison ({order.shippingAddress?.city || 'Standard'})</span>
                <span className="font-semibold text-primary">
                  +{(((order as any).shippingCost ?? 0)).toLocaleString()} FCFA
                </span>
              </div>
            </div>
            <Separator className="my-3" />
            <div className="flex justify-between items-center font-bold text-lg">
              <div>
                <span>Total à payer</span>
                <p className="text-xs font-normal text-muted-foreground">À régler au livreur en espèces</p>
              </div>
              <span className="text-accent text-xl">{order.totalAmount.toLocaleString()} FCFA</span>
            </div>

            {/* Actions contextuelles (Annuler / Supprimer) */}
            {/* Motif d'annulation si commande annulée */}
            {order.orderStatus === 'cancelled' && (order as any).cancelReason && (
              <div className="mt-6 p-4 rounded-xl bg-red-50/80 border border-red-200 text-red-900">
                <p className="text-xs font-bold uppercase tracking-wider text-red-700 mb-1 flex items-center gap-1.5">
                  <XCircle className="w-3.5 h-3.5" />
                  Motif de l'annulation :
                </p>
                <p className="text-sm font-semibold">&laquo;&nbsp;{(order as any).cancelReason}&nbsp;&raquo;</p>
              </div>
            )}

            {/* Actions contextuelles (Annuler / Supprimer) */}
            {(order.orderStatus === 'pending' || order.orderStatus === 'delivered' || order.orderStatus === 'cancelled') && (
              <div className="mt-8 pt-4 border-t border-slate-100 flex justify-end gap-3">
                {order.orderStatus === 'pending' && (
                  <button
                    onClick={() => setIsCancelDialogOpen(true)}
                    className="text-sm flex items-center gap-2 text-amber-600 hover:text-amber-700 hover:bg-amber-50 px-4 py-2 rounded-xl transition-colors font-semibold"
                  >
                    <XCircle className="w-4 h-4" />
                    Annuler la commande
                  </button>
                )}
                
                {(order.orderStatus === 'delivered' || order.orderStatus === 'cancelled') && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button
                        disabled={deleteOrderMutation.isPending}
                        className="text-sm flex items-center gap-2 text-red-500 hover:text-red-700 hover:bg-red-50 px-4 py-2 rounded-xl transition-colors font-semibold"
                      >
                        {deleteOrderMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
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

            {/* Modal d'annulation de commande avec motif */}
            <CancelOrderDialog
              orderId={orderId}
              isOpen={isCancelDialogOpen}
              onClose={() => setIsCancelDialogOpen(false)}
              onSuccess={() => {
                queryClient.invalidateQueries({ queryKey: getGetOrderQueryKey(orderId) });
              }}
            />
          </div>
        </div>
      </div>
    </Layout>
  );
}
