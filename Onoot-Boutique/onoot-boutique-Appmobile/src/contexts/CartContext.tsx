import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { CartItem, Product } from '../types';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

interface CartContextType {
  items: CartItem[];
  totalCount: number;
  subtotal: number;
  sessionId: string;
  isLoading: boolean;
  addToCart: (product: Product, quantity?: number, color?: string) => Promise<boolean>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  clearCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_ITEMS_KEY = '@onoot_cart_items';

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [sessionId, setSessionId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  // Initialize Session ID & Cart based on User
  useEffect(() => {
    initSessionAndCart();
  }, [user?.id]);

  const initSessionAndCart = async () => {
    try {
      setIsLoading(true);
      if (!user) {
        setItems([]);
        setSessionId('');
        setIsLoading(false);
        return;
      }

      const sid = `user-${user.id}`;
      setSessionId(sid);

      // Load local cache
      const storedItems = await AsyncStorage.getItem(`${CART_ITEMS_KEY}_${sid}`);
      if (storedItems) {
        setItems(JSON.parse(storedItems));
      }

      // Sync with backend API
      try {
        const apiCart = await api.getCart(sid);
        if (apiCart?.items && apiCart.items.length > 0) {
          setItems(apiCart.items);
          await AsyncStorage.setItem(`${CART_ITEMS_KEY}_${sid}`, JSON.stringify(apiCart.items));
        }
      } catch (err) {
        // Backend offline, fallback to local storage
      }
    } catch (e) {
      console.error('Failed to init cart', e);
    } finally {
      setIsLoading(false);
    }
  };

  const saveItems = async (newItems: CartItem[]) => {
    setItems(newItems);
    if (sessionId) {
      await AsyncStorage.setItem(`${CART_ITEMS_KEY}_${sessionId}`, JSON.stringify(newItems));
    }
  };

  const addToCart = async (product: Product, quantity = 1, color?: string): Promise<boolean> => {
    // STRICT RULE: User must be signed in to add to cart
    if (!user) {
      Alert.alert(
        'Connexion requise',
        'Veuillez vous connecter ou créer un compte pour ajouter des articles à votre panier.',
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Se connecter',
            onPress: () => router.push('/login'),
          },
        ]
      );
      return false;
    }

    const existingIndex = items.findIndex((i) => i.productId === product.id && i.color === color);
    let updated: CartItem[];
    const unitPrice = product.discountPrice ?? product.price;

    if (existingIndex > -1) {
      updated = [...items];
      updated[existingIndex].quantity += quantity;
    } else {
      const newItem: CartItem = {
        productId: product.id,
        quantity,
        price: unitPrice,
        color: color || null,
        product: {
          id: product.id,
          name: product.name,
          description: product.description,
          price: product.price,
          discountPrice: product.discountPrice,
          category: product.category,
          images: product.images && product.images.length > 0 ? product.images : [],
          stock: product.stock,
        },
      };
      updated = [...items, newItem];
    }

    await saveItems(updated);

    // Call API in background
    if (sessionId) {
      api.addToCart(sessionId, product.id, quantity, color).catch(() => {});
    }
    return true;
  };

  const updateQuantity = async (productId: string, quantity: number) => {
    if (quantity <= 0) {
      await removeFromCart(productId);
      return;
    }

    const updated = items.map((item) =>
      item.productId === productId ? { ...item, quantity } : item
    );

    await saveItems(updated);

    if (sessionId) {
      api.updateCartItem(sessionId, productId, quantity).catch(() => {});
    }
  };

  const removeFromCart = async (productId: string) => {
    const updated = items.filter((item) => item.productId !== productId);
    await saveItems(updated);

    if (sessionId) {
      api.removeCartItem(sessionId, productId).catch(() => {});
    }
  };

  const clearCart = async () => {
    await saveItems([]);
    if (sessionId) {
      await AsyncStorage.removeItem(`${CART_ITEMS_KEY}_${sessionId}`);
    }
  };

  const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => {
    const itemPrice = item.product?.discountPrice ?? item.product?.price ?? item.price;
    return sum + itemPrice * item.quantity;
  }, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        totalCount,
        subtotal,
        sessionId,
        isLoading,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within a CartProvider');
  return ctx;
};
