import React from "react";
import { Link, useLocation } from "wouter";
import { useListOrders } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, ArrowRight, X } from "lucide-react";

/**
 * PendingOrderBanner
 * Affiche une banniere discrète uniquement si une commande est encore en attente (pending).
 * Dès que l'administrateur confirme la commande (orderStatus !== "pending"), elle disparaît automatiquement.
 */
export function PendingOrderBanner() {
  const { user } = useAuth();
  const [location] = useLocation();
  const [dismissed, setDismissed] = React.useState(false);

  const { data } = useListOrders(
    { userId: user?.id },
    { query: { enabled: !!user?.id, refetchInterval: 4000, refetchOnWindowFocus: true } }
  );

  const pendingOrder = React.useMemo(() => {
    if (!data?.orders) return null;
    return data.orders.find((o) => o.orderStatus === "pending") ?? null;
  }, [data]);

  // Masquer la bannière si l'utilisateur est déjà sur la page de suivi (/orders) ou à la caisse (/checkout),
  // ou si la commande a été confirmée par l'admin (orderStatus != "pending")
  if (!user || !pendingOrder || dismissed) return null;
  if (location.startsWith("/orders") || location.startsWith("/checkout")) return null;

  const orderShort = pendingOrder.id.substring(pendingOrder.id.length - 6).toUpperCase();

  return (
    <AnimatePresence>
      <motion.div
        key="pending-order-banner"
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.35 }}
        className="w-full bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-800/60 transition-colors"
      >
        <div className="container mx-auto px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3">
            <div className="bg-amber-100 dark:bg-amber-900/60 rounded-full p-2 flex-shrink-0 mt-0.5 sm:mt-0">
              <ShoppingCart className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="text-sm">
              <span className="font-bold text-amber-900 dark:text-amber-200">Commande en attente</span>
              <span className="text-amber-800 dark:text-amber-300">
                {" "}— #{orderShort} · <span className="font-semibold">{pendingOrder.totalAmount.toLocaleString()} FCFA</span>
              </span>
              <span className="text-amber-700 dark:text-amber-400 block text-xs sm:text-sm mt-0.5 sm:mt-0 sm:inline sm:ml-1">
                En cours de confirmation par la boutique.
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between w-full sm:w-auto gap-2 flex-shrink-0 pt-2 sm:pt-0 border-t border-amber-200/60 sm:border-0">
            <Link
              href={`/orders/${pendingOrder.id}`}
              className="inline-flex items-center justify-center gap-1.5 text-xs sm:text-sm font-semibold text-amber-900 dark:text-white bg-amber-200 hover:bg-amber-300 dark:bg-amber-800 dark:hover:bg-amber-700 px-3.5 py-1.5 rounded-full transition-colors shadow-sm flex-1 sm:flex-initial text-center"
            >
              Suivre ma commande <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <button
              onClick={() => setDismissed(true)}
              className="text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-200 transition-colors p-1.5 rounded-full hover:bg-amber-100 dark:hover:bg-amber-900/40"
              aria-label="Fermer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
