import React, { createContext, useContext } from "react";
import { useGetCart, getGetCartQueryKey, useAddCartItem, useUpdateCartItem, useRemoveCartItem, Cart } from "@workspace/api-client-react";
import { getCartSessionId } from "@/lib/session";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface CartContextType {
  cart: Cart | undefined;
  isLoading: boolean;
  sessionId: string;
  addItem: (productId: number, quantity: number, color?: string) => void;
  updateItem: (productId: number, quantity: number) => void;
  removeItem: (productId: number) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const sessionId = getCartSessionId();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: cart, isLoading } = useGetCart({ sessionId }, {
    query: {
      queryKey: getGetCartQueryKey({ sessionId }),
      enabled: true
    }
  });

  const addCartItem = useAddCartItem();
  const updateCartItem = useUpdateCartItem();
  const removeCartItem = useRemoveCartItem();

  const addItem = (productId: number, quantity: number, color?: string) => {
    addCartItem.mutate({ data: { sessionId, productId, quantity, color } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetCartQueryKey({ sessionId }) });
        toast({ title: "Ajouté au panier", description: "Le produit a été ajouté à votre panier." });
      },
      onError: () => {
        toast({ title: "Erreur", description: "Impossible d'ajouter le produit.", variant: "destructive" });
      }
    });
  };

  const updateItem = (productId: number, quantity: number) => {
    updateCartItem.mutate({ productId, data: { sessionId, quantity } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetCartQueryKey({ sessionId }) });
      }
    });
  };

  const removeItem = (productId: number) => {
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
