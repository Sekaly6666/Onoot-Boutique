import React, { useRef } from "react";
import { useParams, Link } from "wouter";
import { useGetOrder, getGetOrderQueryKey } from "@workspace/api-client-react";
import html2canvas from "html2canvas";

import { ArrowLeft, Download, ShoppingBag, MapPin, Phone, User, Calendar, CircleDashed, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import { OnootLogo } from "@/components/ui/OnootLogo";

function formatLocation(address?: string, city?: string, country?: string): string {
  const rawParts: string[] = [];
  if (city && city.trim()) rawParts.push(...city.split(','));
  if (address && address.trim()) rawParts.push(...address.split(','));
  if (country && country.trim()) rawParts.push(country.trim());

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

export default function OrderTicket() {
  const { id } = useParams();
  const orderId = id as string;
  const ticketRef = useRef<HTMLDivElement>(null);

  const { data: order, isLoading } = useGetOrder(orderId, {
    query: {
      enabled: !!orderId,
      queryKey: getGetOrderQueryKey(orderId)
    }
  });

  const handleDownloadImage = async () => {
    if (!ticketRef.current) return;
    try {
      const canvas = await html2canvas(ticketRef.current, {
        scale: 3,
        useCORS: true,
        backgroundColor: "#ffffff",
        scrollX: 0,
        scrollY: 0,
        onclone: (_clonedDoc, clonedElem) => {
          clonedElem.style.width = "380px";
          clonedElem.style.maxWidth = "380px";
          clonedElem.style.minWidth = "380px";
          clonedElem.style.margin = "0 auto";
          clonedElem.style.boxSizing = "border-box";
        },
      });
      const image = canvas.toDataURL("image/png", 1.0);
      const link = document.createElement("a");
      link.download = `Ticket_Onoot_${order?.id.substring(order.id.length - 8).toUpperCase() || 'Commande'}.png`;
      link.href = image;
      link.click();
    } catch (err) {
      console.error("Erreur lors de la génération de l'image du ticket", err);
    }
  };

  if (isLoading) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center">Chargement de votre ticket...</div>;
  }

  if (!order) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center">Ticket introuvable.</div>;
  }

  const locationText = formatLocation(order.shippingAddress.address, order.shippingAddress.city, order.shippingAddress.country);

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
    <div className="min-h-screen bg-slate-100 py-6 px-3 sm:py-10 sm:px-4 flex flex-col items-center">
      
      {/* Actions de navigation */}
      <div className="w-full max-w-[380px] flex justify-between items-center mb-5 px-1">
        <Button variant="ghost" className="text-slate-600 hover:text-slate-900" asChild>
          <Link href={`/orders/${order.id}`}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Retour
          </Link>
        </Button>
        <Button onClick={handleDownloadImage} className="bg-primary text-white hover:bg-primary/90 shadow-md">
          <Download className="w-4 h-4 mr-2" /> Télécharger
        </Button>
      </div>

      {/* Le Ticket */}
      <div ref={ticketRef} className="w-full max-w-[380px] bg-white rounded-2xl shadow-xl overflow-hidden relative border border-slate-200">
        
        {/* Bande des 3 couleurs */}
        <div className="h-2 w-full flex">
          <div className="h-full flex-1 bg-[#4BB5E8]"></div>
          <div className="h-full flex-1 bg-[#F5C430]"></div>
          <div className="h-full flex-1 bg-[#E87C2A]"></div>
        </div>

        {/* En-tête du ticket */}
        <div className="bg-slate-50 p-5 pb-4 text-center border-b border-dashed border-slate-200">
          <div className="flex flex-col items-center justify-center">
            <div className="mb-2">
              <OnootLogo size="md" variant="color" />
            </div>
          </div>
        </div>

        {/* Corps du ticket */}
        <div className="p-5 sm:p-6 bg-white relative">
          
          {/* Info client & Commande */}
          <div className="text-center mb-6">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Reçu de commande</p>
            <h2 className="text-2xl font-mono font-bold text-slate-800 tracking-tight">
              #{order.id.substring(order.id.length - 8).toUpperCase()}
            </h2>
            <div className="flex items-center justify-center text-slate-500 mt-1.5 text-xs font-medium">
              <Calendar className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
              {new Date(order.createdAt).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute:'2-digit' })}
            </div>
          </div>

          <Separator className="border-dashed border-slate-200 my-5" />

          {/* Destinataire */}
          <div className="space-y-3 mb-5">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center">
              <User className="w-3.5 h-3.5 mr-1.5 text-slate-400" /> Destinataire
            </h3>
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              <p className="font-bold text-slate-800 text-base">{order.shippingAddress.fullName}</p>
              <div className="mt-2.5 space-y-2 text-xs text-slate-600">
                <p className="flex items-start gap-2">
                  <MapPin className="w-3.5 h-3.5 mt-0.5 text-slate-400 flex-shrink-0" />
                  <span className="font-semibold text-slate-700 leading-relaxed break-words">
                    {locationText}
                  </span>
                </p>
                <p className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  <span className="font-medium text-slate-600">{order.shippingAddress.phone}</span>
                </p>
              </div>

              {/* Réceptionnaire désigné (si renseigné) */}
              {(() => {
                const recipientName = (order.shippingAddress as any)?.recipientName || order.notes?.match(/\[Réceptionnaire désigné\s*:\s*([^\]\-]+)(?:-\s*Tél\s*:\s*([^\]]+))?\]/i)?.[1]?.trim();
                const recipientPhone = (order.shippingAddress as any)?.recipientPhone || order.notes?.match(/\[Réceptionnaire désigné\s*:\s*([^\]\-]+)(?:-\s*Tél\s*:\s*([^\]]+))?\]/i)?.[2]?.trim();

                if (!recipientName && !recipientPhone) return null;

                return (
                  <div className="mt-3 pt-3 border-t border-slate-200">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-primary mb-1">
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Personne qui réceptionne le colis :</span>
                    </div>
                    <p className="text-xs font-bold text-slate-800">{recipientName}</p>
                    {recipientPhone && (
                      <p className="text-xs text-slate-600 flex items-center gap-1.5 mt-0.5">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{recipientPhone}</span>
                      </p>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>

          <Separator className="border-dashed border-slate-200 my-6" />

          {/* Articles */}
          <div className="mb-6">
            <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center"><ShoppingBag className="w-4 h-4 mr-2 text-slate-400" /> Achats</h3>
            <div className="space-y-3.5">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-start text-sm gap-2">
                  <div className="flex-1 min-w-0 pr-2">
                    <p className="font-semibold text-slate-800 text-sm leading-snug break-words">{item.productName}</p>
                    <p className="text-slate-500 text-xs mt-0.5 font-medium">Qté: {item.quantity} × {item.price.toLocaleString("fr-FR")} FCFA</p>
                  </div>
                  <div className="font-bold text-slate-800 text-sm shrink-0 whitespace-nowrap text-right">
                    {(item.price * item.quantity).toLocaleString("fr-FR")} FCFA
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator className="border-dashed border-slate-200 my-6" />

          {/* Mode de paiement & Détail de livraison */}
          <div className="mb-4 bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="font-medium text-slate-500">Sous-total articles :</span>
              <span className="font-bold text-slate-800">
                {((order as any).itemsTotal ?? (order.totalAmount - ((order as any).shippingCost || 0))).toLocaleString()} FCFA
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium text-slate-500">Frais de livraison :</span>
              {(order as any).shippingCost && (order as any).shippingCost > 0 ? (
                <span className="font-bold text-orange-600">
                  +{((order as any).shippingCost).toLocaleString()} FCFA
                </span>
              ) : (order.shippingAddress?.city?.toLowerCase().includes("intérieur") || order.shippingAddress?.city?.toLowerCase().includes("interieur")) ? (
                <span className="font-bold text-amber-600">
                  À convenir sur WhatsApp
                </span>
              ) : (
                <span className="font-bold text-slate-700">+0 FCFA</span>
              )}
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-slate-200">
              <span className="font-bold text-slate-800">Règlement :</span>
              <span className="font-medium text-slate-700">
                {isAbidjan ? (
                  order.paymentMethod === 'card' ? 'Carte bancaire' : order.paymentMethod === 'mobile_money' ? 'Mobile Money' : 'Paiement à la livraison (En espèces)'
                ) : (
                  'À convenir avec la boutique'
                )}
              </span>
            </div>
          </div>

          {/* Total */}
          <div className="bg-slate-900 text-white p-4 rounded-2xl flex justify-between items-center shadow-md mb-8">
            <div>
              <span className="font-medium text-slate-300 block text-xs">TOTAL À PAYER</span>
              <span className="text-[10px] text-slate-400">
                {isAbidjan ? 'Au livreur en espèces' : 'Règlement convenu avec la boutique'}
              </span>
            </div>
            <span className="text-2xl font-black text-amber-400">{order.totalAmount.toLocaleString()} FCFA</span>
          </div>
          

          
        </div>
        
        {/* Footer ticket */}
        <div className="bg-slate-50 py-4 text-center text-xs font-medium text-slate-400 border-t border-slate-100 flex items-center justify-center">
          <CircleDashed className="w-3 h-3 mr-1.5 animate-spin-slow opacity-50" />
          Merci de votre confiance
        </div>
      </div>
    </div>
  );
}
