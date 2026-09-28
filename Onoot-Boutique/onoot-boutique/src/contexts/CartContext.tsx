import React, { createContext, useContext, useMemo } from "react";
import { useGetCart, getGetCartQueryKey, useAddCartItem, useUpdateCartItem, useRemoveCartItem, Cart } from "@workspace/api-client-react";
import { getCartSessionId, getCartSessionIdForUser } from "@/lib/session";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface CartContextType {
  cart: Cart | undefined;
  isLoading: boolean;
  sessionId: string;
  addItem: (productId: string, quantity: number, color?: string) => void;
  updateItem: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  // Utilise le sessionId de l'utilisateur s il est connecte, sinon le sessionId anonyme.
  // - A la deconnexion : bascule sur le sessionId anonyme => panier vide
  // - A la reconnexion : retrouve le panier persiste de l utilisateur
  const sessionId = useMemo(
    () => (user ? getCartSessionIdForUser(user.id) : getCartSessionId()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user?.id]
  );

  const { data: cart, isLoading } = useGetCart({ sessionId }, {
    query: {
      queryKey: getGetCartQueryKey({ sessionId }),
      enabled: true
    }
  });

  const addCartItem = useAddCartItem();
  const updateCartItem = useUpdateCartItem();
  const removeCartItem = useRemoveCartItem();

  const addItem = (productId: string, quantity: number, color?: string) => {
    addCartItem.mutate({ data: { sessionId, productId, quantity, color } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetCartQueryKey({ sessionId }) });
        toast({ title: "Ajout au panier", description: "Le produit a ete ajoute a votre panier." });
      },
      onError: () => {
        toast({ title: "Erreur", description: "Impossible d ajouter le produit.", variant: "destructive" });
      }
    });
  };

  const updateItem = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    updateCartItem.mutate({ productId, data: { sessionId, quantity } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetCartQueryKey({ sessionId }) });
      }
    });
  };

  const removeItem = (productId: string) => {
    removeCartItem.mutate({ productId, data: { sessionId } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetCartQueryKey({ sessionId }) });
      }
    });
  };

  return (
    <CartContext.Provider value={{ cart, isLoading, sessionId, addItem, updateItem, removeItem }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCartContext() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCartContext must be used within a CartProvider");
  }
  return context;
}
