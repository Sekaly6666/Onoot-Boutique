import React from "react";
import { useParams, Link } from "wouter";
import { Layout } from "@/components/layout/Layout";
import { useGetOrder, getGetOrderQueryKey, useListProducts } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, CheckCircle2, Clock, Truck, PackageCheck, QrCode, XCircle, Trash2, Loader2, MessageCircle, Package, UserCheck } from "lucide-react";
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

const DEFAULT_PRODUCT_IMAGES: Record<string, string> = {
  "haut-parleur bluetooth portable bass": "/images/speaker.png",
  "écouteurs bluetooth pro anc": "/images/earbuds.png",
  "ecouteurs bluetooth pro anc": "/images/earbuds.png",
  "smartwatch pro s8": "/images/smartwatch.png",
  "batterie externe 20000mah ultra": "/images/powerbank.png",
  "chargeur rapide 65w gan": "/images/charger.png",
  "coque protection premium armor": "/images/case.png",
};

function getProductImageFallback(name?: string): string | null {
  if (!name) return null;
  const clean = name.toLowerCase().trim();
  for (const [key, url] of Object.entries(DEFAULT_PRODUCT_IMAGES)) {
    if (clean.includes(key) || key.includes(clean)) return url;
  }
  if (clean.includes("smartwatch") || clean.includes("montre")) return "/images/smartwatch.png";
  if (clean.includes("écouteur") || clean.includes("ecouteur") || clean.includes("earbuds") || clean.includes("airpod")) return "/images/earbuds.png";
  if (clean.includes("haut-parleur") || clean.includes("speaker") || clean.includes("enceinte")) return "/images/speaker.png";
  if (clean.includes("batterie") || clean.includes("powerbank")) return "/images/powerbank.png";
  if (clean.includes("chargeur") || clean.includes("charger")) return "/images/charger.png";
  if (clean.includes("coque") || clean.includes("case") || clean.includes("protection")) return "/images/case.png";
  return null;
}

function parseRecipient(notes?: string | null, shippingAddress?: any) {
  if (shippingAddress?.recipientName) {
    return {
      name: shippingAddress.recipientName,
      phone: shippingAddress.recipientPhone || null,
    };
  }
  if (notes) {
    const match = notes.match(/\[Réceptionnaire désigné\s*:\s*([^\]\-]+)(?:-\s*Tél\s*:\s*([^\]]+))?\]/i);
    if (match) {
      return {
        name: match[1]?.trim(),
        phone: match[2]?.trim() || null,
      };
    }
  }
  return null;
}

export default function OrderDetail() {
  const { id } = useParams();
  const orderId = id as string;
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const [isCancelDialogOpen, setIsCancelDialogOpen] = React.useState<boolean>(false);

  const { data: productsData } = useListProducts({ limit: 100 });

  const { productMapById, productMapByName } = React.useMemo(() => {
    const byId = new Map<string, any>();
    const byName = new Map<string, any>();
    const list: any[] = Array.isArray(productsData)
      ? productsData
      : (productsData as any)?.products && Array.isArray((productsData as any).products)
      ? (productsData as any).products
      : [];

    list.forEach((p: any) => {
      if (p.id) byId.set(String(p.id), p);
      if (p._id) byId.set(String(p._id), p);
      if (p.name) byName.set(p.name.trim().toLowerCase(), p);
    });
    return { productMapById: byId, productMapByName: byName };
  }, [productsData]);

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

  const city = (order.shippingAddress?.city || "").toLowerCase().trim();
  const address = (order.shippingAddress?.address || "").toLowerCase().trim();
  const notes = (order.notes || "").toLowerCase().trim();
  const payment = (order.paymentMethod || "").toLowerCase().trim();

  const isInteriorExplicit =
    city.includes("intérieur") ||
    city.includes("interieur") ||
    city.includes("hors") ||
    city.includes("gare") ||
    address.includes("gare") ||
    notes.includes("expédition") ||
    notes.includes("expedition") ||
    payment.includes("convenir") ||
    payment.includes("boutique");

  const abidjanKeywords = [
    "abidjan", "cocody", "yopougon", "marcory", "plateau", "treichville",
    "koumassi", "port-bouet", "port-bouët", "adjamé", "adjame", "abobo",
    "attécoubé", "attecoube", "bingerville", "songon", "anyama"
  ];

  const isAbidjan = !isInteriorExplicit && abidjanKeywords.some((kw) => city.includes(kw) || address.includes(kw));

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
              {(() => {
                const recipientInfo = parseRecipient(order.notes, order.shippingAddress);
                if (!recipientInfo) return null;
                return (
                  <div className="mt-3 p-3 bg-primary/5 dark:bg-primary/10 rounded-xl border border-primary/20">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-primary mb-1">
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Réceptionnaire désigné (proche / mandataire) :</span>
                    </div>
                    <p className="text-xs text-foreground font-semibold">
                      {recipientInfo.name}
                      {recipientInfo.phone && <span className="text-muted-foreground font-normal"> · Tél : {recipientInfo.phone}</span>}
                    </p>
                  </div>
                );
              })()}
            </div>
            <Separator className="my-4" />
            <h2 className="font-bold text-lg mb-3">Paiement</h2>
            {isAbidjan ? (
              <div className="space-y-1.5 bg-muted/40 p-3.5 rounded-lg border border-border">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-sm">Méthode :</span>
                  <span className="font-semibold text-sm text-foreground">
                    Paiement à la livraison (En espèces)
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Règlement en espèces directement auprès du livreur à la réception de votre colis.
                </p>
              </div>
            ) : (
              <div className="space-y-1.5 bg-amber-50/70 dark:bg-amber-950/30 p-3.5 rounded-lg border border-amber-200/80 dark:border-amber-800/50">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-muted-foreground text-sm">Méthode :</span>
                  <span className="font-semibold text-sm text-amber-900 dark:text-amber-200">
                    À convenir avec la boutique
                  </span>
                  <Badge variant="outline" className="border-amber-400 text-amber-800 dark:text-amber-300 text-[10px] px-1.5 py-0 bg-amber-100/50 dark:bg-amber-900/40">
                    Expédition Hors Abidjan
                  </Badge>
                </div>
                <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                  Pour les expéditions hors d'Abidjan, les modalités de paiement des articles et de transport (Wave, Orange Money ou règlement en gare) sont convenues directement avec la boutique sur WhatsApp avant l'expédition du colis.
                </p>
              </div>
            )}
          </div>

          <div className="bg-card border border-border p-6 rounded-xl">
            <h2 className="font-bold text-lg mb-4">Articles commandés</h2>
            <div className="space-y-4 mb-4">
              {order.items.map(item => {
                const matchedProduct = productMapById.get(String(item.productId)) || productMapByName.get(item.productName.trim().toLowerCase());
                const imageSrc = item.productImage || matchedProduct?.images?.[0] || (matchedProduct as any)?.imageUrl || (matchedProduct as any)?.image || getProductImageFallback(item.productName);

                return (
                  <div key={item.productId} className="flex justify-between items-center text-sm gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center p-1 overflow-hidden shrink-0 shadow-2xs">
                        {imageSrc ? (
                          <img
                            src={imageSrc}
                            alt={item.productName}
                            className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal"
                            onError={(e) => {
                              (e.currentTarget as HTMLElement).style.display = 'none';
                              const nextSibling = (e.currentTarget as HTMLElement).nextElementSibling as HTMLElement;
                              if (nextSibling) nextSibling.classList.remove('hidden');
                            }}
                          />
                        ) : null}
                        <div className={`items-center justify-center ${imageSrc ? 'hidden' : 'flex'}`}>
                          <Package className="w-5 h-5 text-muted-foreground/60" />
                        </div>
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground truncate">{item.productName}</p>
                        <p className="text-muted-foreground text-xs">Qté : {item.quantity}</p>
                      </div>
                    </div>
                    <span className="font-bold text-foreground shrink-0">{(item.price * item.quantity).toLocaleString("fr-FR")} FCFA</span>
                  </div>
                );
              })}
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
                {(order as any).shippingCost && (order as any).shippingCost > 0 ? (
                  <span className="font-semibold text-primary">
                    +{((order as any).shippingCost).toLocaleString()} FCFA
                  </span>
                ) : !isAbidjan ? (
                  <span className="font-bold text-amber-600 dark:text-amber-400 text-xs">
                    À convenir sur WhatsApp
                  </span>
                ) : (
                  <span className="font-semibold text-primary">+0 FCFA</span>
                )}
              </div>
            </div>
            <Separator className="my-3" />
            <div className="flex justify-between items-center font-bold text-lg">
              <div>
                <span>Total à payer</span>
                <p className="text-xs font-normal text-muted-foreground">
                  {!isAbidjan && (!(order as any).shippingCost || (order as any).shippingCost === 0)
                    ? "Hors frais d'expédition en gare"
                    : !isAbidjan
                    ? "Articles + expédition convenue"
                    : "À régler au livreur en espèces"}
                </p>
              </div>
              <span className="text-accent text-xl">{order.totalAmount.toLocaleString()} FCFA</span>
            </div>

            {/* Bouton WhatsApp direct si frais d'expédition en gare en attente */}
            {(order.shippingAddress?.city?.toLowerCase().includes("intérieur") || order.shippingAddress?.city?.toLowerCase().includes("interieur") || order.shippingAddress?.city?.toLowerCase().includes("hors") || order.notes?.toLowerCase().includes("expédition")) && (!(order as any).shippingCost || (order as any).shippingCost === 0) && (
              <div className="mt-4 p-3.5 rounded-xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60">
                <p className="text-xs text-amber-800 dark:text-amber-300 font-medium mb-2.5">
                  Cette commande est destinée à l'expédition en gare. Discutez avec la boutique sur WhatsApp pour convenir des frais de transport de votre colis :
                </p>
                <a
                  href={`https://wa.me/2250503648312?text=${encodeURIComponent(`Bonjour Onoot Boutique, je vous contacte pour ma commande #${order.id.slice(-8).toUpperCase()} concernant les frais d'expédition en gare vers : ${order.shippingAddress?.city || ''}.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Convenir des frais de transport sur WhatsApp</span>
                </a>
              </div>
            )}

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
