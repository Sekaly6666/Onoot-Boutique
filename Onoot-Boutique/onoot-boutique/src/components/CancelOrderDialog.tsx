import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, CheckCircle2, Loader2, XCircle } from "lucide-react";

interface CancelOrderDialogProps {
  orderId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CANCEL_REASONS = [
  "Changement d'avis",
  "Délai de livraison trop long",
  "Erreur d'article ou de quantité",
  "Problème d'adresse ou de téléphone",
  "Commande passée par erreur",
  "Autre motif",
];

export const CancelOrderDialog: React.FC<CancelOrderDialogProps> = ({
  orderId,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [selectedReason, setSelectedReason] = useState<string>("Changement d'avis");
  const [customReason, setCustomReason] = useState<string>("");
  const [isPending, setIsPending] = useState<boolean>(false);
  const { toast } = useToast();

  const handleConfirm = async () => {
    if (!orderId) return;

    let finalReason = selectedReason;
    if (selectedReason === "Autre motif") {
      finalReason = customReason.trim() ? customReason.trim() : "Autre motif non précisé";
    } else if (customReason.trim()) {
      finalReason = `${selectedReason} : ${customReason.trim()}`;
    }

    setIsPending(true);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderStatus: "cancelled",
          cancelReason: finalReason,
        }),
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }

      toast({
        title: "Commande annulée",
        description: "Votre commande a été annulée. La boutique a été notifiée de votre motif.",
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: "Impossible d annuler la commande pour le moment.",
        variant: "destructive",
      });
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isPending && onClose()}>
      <DialogContent className="sm:max-w-[480px] p-6 rounded-2xl">
        <DialogHeader>
          <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-2 border border-red-100">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <DialogTitle className="text-xl font-bold text-center text-foreground">
            Annuler la commande
          </DialogTitle>
          <DialogDescription className="text-sm text-center text-muted-foreground">
            Veuillez préciser le motif de l'annulation afin d'informer la boutique et nous aider à nous améliorer.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Options de motif */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Sélectionnez un motif principal :
            </label>
            <div className="grid grid-cols-1 gap-2">
              {CANCEL_REASONS.map((reason) => {
                const isSelected = selectedReason === reason;
                return (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => setSelectedReason(reason)}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-sm font-medium transition-all text-left ${
                      isSelected
                        ? "border-red-500 bg-red-50/60 text-red-900 shadow-sm"
                        : "border-border hover:bg-muted/50 text-foreground"
                    }`}
                  >
                    <span>{reason}</span>
                    {isSelected ? (
                      <CheckCircle2 className="w-4 h-4 text-red-600 shrink-0 ml-2" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-slate-300 shrink-0 ml-2" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Précision facultative ou requise */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              {selectedReason === "Autre motif" ? "Précisez votre motif :" : "Détails supplémentaires (facultatif) :"}
            </label>
            <Textarea
              placeholder={
                selectedReason === "Autre motif"
                  ? "Expliquez brièvement la raison de votre annulation..."
                  : "Une remarque ou un détail pour l'équipe..."
              }
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              className="resize-none text-sm h-20 rounded-xl"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 mt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isPending}
            className="rounded-xl"
          >
            Retour
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={isPending || (selectedReason === "Autre motif" && !customReason.trim())}
            className="bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold flex items-center gap-2"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Annulation en cours...</span>
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4" />
                <span>Confirmer l'annulation</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
