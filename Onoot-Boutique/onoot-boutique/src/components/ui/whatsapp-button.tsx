import React from "react";
import { MessageCircle } from "lucide-react";

const WHATSAPP_NUMBER = "2250503648312";

interface ProductInfo {
  id?: string;
  name: string;
  price: number;
  discountPrice?: number | null;
}

export function buildWhatsAppUrl(product?: ProductInfo) {
  if (product) {
    const price = product.discountPrice ?? product.price;
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const productUrl = product.id && origin
      ? `${origin}/products/${product.id}`
      : "";
    const message =
      `Bonjour Onoot Boutique !\n` +
      `Je souhaite commander ce produit :\n\n` +
      `► *${product.name}*\n` +
      `► Prix : *${price.toLocaleString("fr-FR")} FCFA*` +
      (productUrl ? `\n► Voir le produit : ${productUrl}` : "") +
      `\n\nPouvez-vous confirmer la disponibilité et les délais de livraison ?`;
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  } else {
    const message = "Bonjour Onoot Boutique !\nJe vous contacte depuis le site web. Pouvez-vous m'aider ?";
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  }
}

/* Bouton flottant global */
export function WhatsAppButton() {
  const url = buildWhatsAppUrl();
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-5 right-4 sm:bottom-6 sm:right-6 z-50 flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 bg-[#25D366] text-white rounded-full shadow-lg hover:shadow-xl hover:scale-110 active:scale-95 transition-all duration-300 group"
      aria-label="Besoin d'aide ? Discutons sur WhatsApp !"
      title="Besoin d'aide ? Discutons !"
    >
      <MessageCircle className="w-6 h-6 sm:w-7 sm:h-7" />
      <div className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-30 -z-10"></div>
      <span className="absolute right-full mr-3 bg-slate-900 text-white text-xs font-semibold py-2 px-3 rounded-xl shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap hidden md:block">
        Besoin d'aide ? Discutons !
      </span>
    </a>
  );
}
