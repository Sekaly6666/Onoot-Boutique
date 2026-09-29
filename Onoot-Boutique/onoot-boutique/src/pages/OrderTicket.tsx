import React, { useRef } from "react";
import { useParams, Link } from "wouter";
import { useGetOrder, getGetOrderQueryKey } from "@workspace/api-client-react";
import html2canvas from "html2canvas";

import { ArrowLeft, Download, ShoppingBag, MapPin, Phone, User, Calendar, CircleDashed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import { OnootLogo } from "@/components/ui/OnootLogo";

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
      const canvas = await html2canvas(ticketRef.current, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
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

  const locationText = formatLocation(order.shippingAddress.address, order.shippingAddress.city);

  return (
    <div className="min-h-screen bg-slate-100 py-10 px-4 flex flex-col items-center">
      
      {/* Actions de navigation */}
      <div className="max-w-[360px] w-full flex justify-between items-center mb-6">
        <Button variant="ghost" className="text-slate-500 hover:text-slate-900" asChild>
          <Link href={`/orders/${order.id}`}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Retour
          </Link>
        </Button>
        <Button onClick={handleDownloadImage} className="bg-primary text-white hover:bg-primary/90 shadow-md">
          <Download className="w-4 h-4 mr-2" /> Télécharger
        </Button>
      </div>

      {/* Le Ticket */}
      <div ref={ticketRef} className="max-w-[360px] w-full bg-white rounded-2xl shadow-xl overflow-hidden relative border border-slate-200">
        
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
        <div className="p-6 bg-white relative">
          
          {/* Effet cranté (Notch) simulé via CSS pour un look de ticket */}
          <div className="absolute top-0 left-0 w-full h-4 -mt-2 flex justify-between px-4 overflow-hidden print:hidden">
            <div className="w-6 h-6 rounded-full bg-slate-100 shadow-inner -ml-3"></div>
            <div className="w-6 h-6 rounded-full bg-slate-100 shadow-inner -mr-3"></div>
          </div>
          
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
                  <span className="font-semibold text-slate-700 leading-relaxed">
                    {locationText}
                  </span>
                </p>
                <p className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  <span className="font-medium text-slate-600">{order.shippingAddress.phone}</span>
                </p>
              </div>
            </div>
          </div>

          <Separator className="border-dashed border-slate-200 my-6" />

          {/* Articles */}
          <div className="mb-6">
            <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center"><ShoppingBag className="w-4 h-4 mr-2 text-slate-400" /> Achats</h3>
            <div className="space-y-3">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-start text-sm">
                  <div className="flex-1 pr-4">
                    <p className="font-medium text-slate-700 line-clamp-2">{item.productName}</p>
                    <p className="text-slate-400 text-xs mt-0.5">Qté: {item.quantity} × {item.price.toLocaleString()} FCFA</p>
                  </div>
                  <div className="font-bold text-slate-700">
                    {(item.price * item.quantity).toLocaleString()} FCFA
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
              <span className="font-bold text-orange-600">
                +{(((order as any).shippingCost ?? 0)).toLocaleString()} FCFA
              </span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-slate-200">
              <span className="font-bold text-slate-800">Règlement :</span>
              <span className="font-medium text-slate-700 capitalize">
                {order.paymentMethod === 'card' ? 'Carte bancaire' : order.paymentMethod === 'mobile_money' ? 'Mobile Money' : order.paymentMethod}
              </span>
            </div>
          </div>

          {/* Total */}
          <div className="bg-slate-900 text-white p-4 rounded-2xl flex justify-between items-center shadow-md mb-8">
            <div>
              <span className="font-medium text-slate-300 block text-xs">TOTAL À PAYER</span>
              <span className="text-[10px] text-slate-400">Au livreur en espèces</span>
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
