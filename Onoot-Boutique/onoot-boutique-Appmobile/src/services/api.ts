import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { Product, Category, CartResponse, Order, User, PromoVideo } from '../types';

export const CLOUD_API_URL = 'https://onoot-boutique.onrender.com';

// Dynamically determine backend URL:
// 1. Try to detect host machine IP from Expo Go (e.g. 192.168.1.4)
// 2. Fallback to local network IP 192.168.1.4:5005
// 3. Cloud fallback: https://onoot-boutique.onrender.com
const detectDevApiUrl = (): string => {
  try {
    const hostUri = Constants.expoConfig?.hostUri;
    if (hostUri) {
      const ip = hostUri.split(':')[0];
      if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
        return `http://${ip}:5005`;
      }
    }
  } catch (e) {
    // ignore
  }
  return 'http://192.168.1.4:5005';
};

export const DEFAULT_API_URL = detectDevApiUrl();

const STORAGE_API_KEY = '@onoot_api_base_url';
const STORAGE_TOKEN_KEY = '@onoot_auth_token';

let currentBaseUrl = DEFAULT_API_URL;

export const getApiBaseUrl = async (): Promise<string> => {
  try {
    const saved = await AsyncStorage.getItem(STORAGE_API_KEY);
    if (saved) {
      currentBaseUrl = saved;
      return saved;
    }
  } catch (e) {
    // ignore
  }
  return currentBaseUrl;
};

export const setApiBaseUrl = async (url: string): Promise<void> => {
  const trimmed = url.replace(/\/$/, '');
  currentBaseUrl = trimmed;
  await AsyncStorage.setItem(STORAGE_API_KEY, trimmed);
};

// Create Axios Instance with automatic cloud failover
export const apiClient = axios.create({
  baseURL: currentBaseUrl,
  timeout: 6000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Update baseURL on each request if changed
apiClient.interceptors.request.use(async (config) => {
  const baseUrl = await getApiBaseUrl();
  if (!config.baseURL) {
    config.baseURL = baseUrl;
  }

  const token = await AsyncStorage.getItem(STORAGE_TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-failover to cloud backend if local dev machine is unreachable
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (
      originalRequest &&
      !originalRequest._retryWithCloud &&
      (error.code === 'ECONNABORTED' ||
        error.message?.includes('Network Error') ||
        error.message?.includes('timeout') ||
        !error.response)
    ) {
      originalRequest._retryWithCloud = true;
      originalRequest.baseURL = CLOUD_API_URL;
      return apiClient(originalRequest);
    }
    return Promise.reject(error);
  }
);

// Helper for image URLs (handles relative backend paths & CDN URLs)
export const getImageUrl = (path?: string | null): string => {
  if (!path) return 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const base = currentBaseUrl || DEFAULT_API_URL;
  return `${base}${path.startsWith('/') ? '' : '/'}${path}`;
};

// Helper for FCFA formatting
export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'decimal',
    maximumFractionDigits: 0,
  }).format(price) + ' FCFA';
};

// Official Google OAuth URL generator for mobile
export const getGoogleAuthUrl = (redirectUrl: string, from: 'login' | 'register' = 'login'): string => {
  // Always authenticate against cloud endpoint to guarantee matching Google Cloud Console redirect URIs
  return `https://onoot-boutique.onrender.com/api/auth/google?origin=${encodeURIComponent(redirectUrl)}&from=${from}`;
};

// Real database promo videos matching website
export const DEMO_PROMO_VIDEOS: PromoVideo[] = [
  {
    _id: '6ac18d10e3bf5c34011d4b2d',
    title: 'IPHONE 18 PRO ➜ 18 PRO MAX',
    subtitle: 'PROTÈGE ROBUSTE AVEC VIS',
    description: 'Protection renforcée contre les chocs, les rayures et les fissures. Elle assure la sécurité totale de votre téléphone. Compatible iPhone 17 Pro ➜ 18 Pro Max.',
    videoUrl: 'https://www.facebook.com/reel/1480018313950943/',
    thumbnailUrl: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&q=80',
    productName: 'PROTÈGE ROBUSTE AVEC VIS IPHONE 18 PRO ➜ 18 PRO MAX',
    productId: '6ac18bb4e3bf5c34011d4b2c',
    productLink: '/products/6ac18bb4e3bf5c34011d4b2c',
    price: 15500,
    badge: 'NOUVEAUTE',
    viewsCount: 48,
  },
  {
    _id: '6abbdb07699bff8408eaab8b',
    title: 'ACLAPET Z FOLD 8',
    subtitle: 'Ultra - cuir prenium + support',
    description: 'Le modèle qui protège bien ton Z 8 Fold. Protection caméra + charnière. Protège écran avant inclus. Couleurs: Noir et Marron',
    videoUrl: 'https://www.facebook.com/reel/27875137132164368/',
    thumbnailUrl: '/images/zfold_case.jpg',
    productName: 'Samsung Galaxy',
    productLink: '/products',
    price: 15000,
    badge: 'PROMO EXCLUSIVE',
    viewsCount: 224,
  },
];

// Real database products matching website
export const DEMO_PRODUCTS: Product[] = [
  {
    id: '6abbc831b79f649bf55d9e50',
    name: 'Coque protection Iphone 13Pro',
    price: 6000,
    discountPrice: null,
    images: ['/images/case.png'],
    category: 'Accessoires',
    stock: 20,
    rating: 5,
    reviewCount: 0,
    featured: false,
    newArrival: false,
    bestSeller: false,
    flashSale: false,
    colors: ['Noir', 'Transparent'],
    description: 'Coque de haute qualité conçue pour protéger efficacement votre iPhone 13 Pro.',
  },
  {
    id: '6abbc7a6b79f649bf55d9e4f',
    name: 'Protection d\'écran Confidentialité',
    price: 5000,
    discountPrice: null,
    images: ['/images/case.png'],
    category: 'Accessoires',
    stock: 15,
    rating: 5,
    reviewCount: 0,
    featured: false,
    newArrival: false,
    bestSeller: false,
    flashSale: false,
    colors: ['Noir'],
    description: 'Verre trempé anti-espion haute définition pour une confidentialité totale.',
  },
  {
    id: '6ac18bb4e3bf5c34011d4b2c',
    name: 'PROTÈGE ROBUSTE AVEC VIS IPHONE 18 PRO ➜ 18 PRO MAX',
    price: 15500,
    discountPrice: null,
    images: ['/images/case.png'],
    category: 'Accessoires',
    stock: 12,
    rating: 5,
    reviewCount: 0,
    featured: true,
    newArrival: true,
    bestSeller: true,
    flashSale: false,
    colors: ['Bleu', 'Violet'],
    description: 'Protection ultra-renforcée en alliage et vis pour conditions extrêmes.',
  },
  {
    id: '6abbb53c6ef2d84fc62411ec',
    name: 'Chargeur Rapide 65W GaN',
    price: 14000,
    discountPrice: 12000,
    images: ['/images/charger.png'],
    category: 'Accessoires',
    stock: 24,
    rating: 4.7,
    reviewCount: 15,
    featured: false,
    newArrival: false,
    bestSeller: false,
    flashSale: false,
    colors: ['Blanc', 'Noir'],
    description: 'Chargeur secteur technologie GaN 65W, compact et compatible tous appareils USB-C.',
  },
  {
    id: '6abbb53b6ef2d84fc62411eb',
    name: 'Batterie Externe 20000mAh Ultra',
    price: 22000,
    discountPrice: 18500,
    images: ['/images/powerbank.png'],
    category: 'Accessoires',
    stock: 15,
    rating: 4.9,
    reviewCount: 31,
    featured: true,
    newArrival: false,
    bestSeller: true,
    flashSale: false,
    colors: ['Noir', 'Bleu'],
    description: 'Batterie portable haute capacité 20000mAh avec charge ultra-rapide Power Delivery.',
  },
  {
    id: '6abbb53b6ef2d84fc62411ea',
    name: 'Coque Protection Premium Armor',
    price: 6000,
    discountPrice: 5000,
    images: ['/images/case.png'],
    category: 'Accessoires',
    stock: 35,
    rating: 4.5,
    reviewCount: 12,
    featured: false,
    newArrival: false,
    bestSeller: false,
    flashSale: false,
    colors: ['Noir', 'Gris'],
    description: 'Coque antichoc renforcée pour une protection intégrale de votre smartphone.',
  },
  {
    id: '6abbb53b6ef2d84fc62411e9',
    name: 'Écouteurs Bluetooth Pro ANC',
    price: 25000,
    discountPrice: 19000,
    images: ['/images/earbuds.png'],
    category: 'Écouteurs',
    stock: 18,
    rating: 4.6,
    reviewCount: 18,
    featured: true,
    newArrival: false,
    bestSeller: false,
    flashSale: true,
    colors: ['Blanc', 'Noir'],
    description: 'Écouteurs sans fil haute fidélité avec réduction active du bruit et boîtier de recharge ultra-compact.',
  },
  {
    id: '6abbb53b6ef2d84fc62411e8',
    name: 'Smartwatch Pro S8',
    price: 45000,
    discountPrice: 38000,
    images: ['/images/smartwatch.png'],
    category: 'Montres Connectées',
    stock: 6,
    rating: 4.8,
    reviewCount: 24,
    featured: true,
    newArrival: false,
    bestSeller: true,
    flashSale: false,
    colors: ['Noir', 'Argent'],
    description: 'Superbe montre connectée avec suivi santé complet, appels Bluetooth, écran HD et autonomie prolongée.',
  },
];

export const DEMO_CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'Tous', slug: 'all', productCount: 10 },
  { id: 'cat-2', name: 'Accessoires', slug: 'Accessoires', productCount: 6 },
  { id: 'cat-3', name: 'Écouteurs', slug: 'Écouteurs', productCount: 1 },
  { id: 'cat-4', name: 'Montres Connectées', slug: 'Montres Connectées', productCount: 1 },
  { id: 'cat-5', name: 'Audio', slug: 'Audio', productCount: 1 },
];

// API Functions
export const api = {
  // Products
  async getProducts(params?: { category?: string; search?: string; limit?: number; page?: number }): Promise<Product[]> {
    try {
      const res = await apiClient.get('/api/products', { params });
      if (res.data?.products && Array.isArray(res.data.products)) {
        return res.data.products;
      }
      if (Array.isArray(res.data)) {
        return res.data;
      }
    } catch (err) {
      console.log('[API] Backend error fetching products, using database replica');
    }
    // Fallback filter
    let list = [...DEMO_PRODUCTS];
    if (params?.category && params.category !== 'all') {
      list = list.filter((p) => p.category?.toLowerCase() === params.category?.toLowerCase());
    }
    if (params?.search) {
      const q = params.search.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q) || (p.description && p.description.toLowerCase().includes(q)));
    }
    return list;
  },

  async getProduct(id: string): Promise<Product | null> {
    try {
      const res = await apiClient.get(`/api/products/${id}`);
      if (res.data) return res.data;
    } catch (err) {
      // ignore
    }
    const found = DEMO_PRODUCTS.find((p) => p.id === id);
    return found || null;
  },

  // Categories
  async getCategories(): Promise<Category[]> {
    try {
      const res = await apiClient.get('/api/categories');
      if (Array.isArray(res.data) && res.data.length > 0) {
        return res.data;
      }
    } catch (err) {
      // ignore
    }
    return DEMO_CATEGORIES;
  },

  // Cart
  async getCart(sessionId: string): Promise<CartResponse> {
    try {
      const res = await apiClient.get('/api/cart', { params: { sessionId } });
      if (res.data) return res.data;
    } catch (err) {
      // ignore
    }
    return { sessionId, items: [], subtotal: 0, total: 0 };
  },

  async addToCart(sessionId: string, productId: string, quantity: number, color?: string): Promise<any> {
    try {
      const res = await apiClient.post('/api/cart/items', { sessionId, productId, quantity, color });
      return res.data;
    } catch (err) {
      return null;
    }
  },

  async updateCartItem(sessionId: string, productId: string, quantity: number): Promise<any> {
    try {
      const res = await apiClient.patch(`/api/cart/items/${productId}`, { sessionId, quantity });
      return res.data;
    } catch (err) {
      return null;
    }
  },

  async removeCartItem(sessionId: string, productId: string): Promise<any> {
    try {
      const res = await apiClient.delete(`/api/cart/items/${productId}`, { data: { sessionId } });
      return res.data;
    } catch (err) {
      return null;
    }
  },

  // Orders
  async createOrder(orderData: Partial<Order>): Promise<Order | null> {
    try {
      const formattedItems = (orderData.items || []).map((it: any) => ({
        productId: String(it.productId || it.id || 'prod-custom'),
        productName: (it.productName || it.name || 'Article Onoot').trim(),
        productImage: it.productImage || it.image || null,
        name: (it.productName || it.name || 'Article Onoot').trim(),
        price: Number(it.price) || 0,
        quantity: Math.max(1, Number(it.quantity) || 1),
        color: it.color || null,
      }));

      const payload = {
        userId: orderData.userId || undefined,
        customerEmail: orderData.customerEmail?.trim() || undefined,
        items: formattedItems,
        totalAmount: orderData.totalAmount,
        shippingFee: orderData.shippingFee,
        shippingCost: orderData.shippingFee,
        paymentMethod: orderData.paymentMethod || 'Paiement à la livraison',
        notes: orderData.notes,
        shippingAddress: {
          fullName: orderData.customerName?.trim() || 'Client Onoot',
          phone: orderData.customerPhone?.trim() || '0700000000',
          address: orderData.deliveryAddress?.trim() || 'Abidjan',
          city: orderData.city?.trim() || 'Cocody',
          country: "Côte d'Ivoire",
        },
      };

      const res = await apiClient.post('/api/orders', payload);
      if (res.data) return res.data;
    } catch (err: any) {
      console.warn('[API] Error creating order on server:', err?.response?.data || err.message);
      throw new Error(err?.response?.data?.error || err?.message || 'Erreur lors de la validation de la commande');
    }
    return null;
  },

  async getUserOrders(param?: string | { userId?: string; email?: string; phone?: string | null }): Promise<Order[]> {
    try {
      const params = typeof param === 'string' ? { userId: param } : param;
      const res = await apiClient.get('/api/orders', { params });
      if (Array.isArray(res.data)) return res.data;
      if (res.data?.orders && Array.isArray(res.data.orders)) return res.data.orders;
    } catch (err) {
      // ignore
    }
    return [];
  },

  async getOrder(orderId: string): Promise<Order | null> {
    try {
      const res = await apiClient.get(`/api/orders/${orderId}`);
      if (res.data) return res.data;
    } catch (err) {
      // ignore
    }
    return null;
  },

  // Auth
  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    const res = await apiClient.post('/api/auth/login', { email, password });
    if (res.data?.token) {
      await AsyncStorage.setItem(STORAGE_TOKEN_KEY, res.data.token);
    }
    return res.data;
  },

  async register(data: { email: string; password: string; name: string; phone?: string }): Promise<{ user: User; token: string }> {
    const res = await apiClient.post('/api/auth/register', data);
    if (res.data?.token) {
      await AsyncStorage.setItem(STORAGE_TOKEN_KEY, res.data.token);
    }
    return res.data;
  },

  async getCurrentUser(customToken?: string): Promise<User | null> {
    try {
      const headers = customToken ? { Authorization: `Bearer ${customToken}` } : undefined;
      const res = await apiClient.get('/api/auth/me', { headers });
      return res.data?.user || res.data;
    } catch (err) {
      return null;
    }
  },

  async updateUser(userId: string, data: Partial<User>): Promise<User | null> {
    try {
      const res = await apiClient.patch(`/api/users/${userId}`, data);
      return res.data?.user || res.data;
    } catch (err) {
      console.warn('Update user error', err);
      return null;
    }
  },

  // Promo Videos / Onoot Live & Démos Vidéos
  async getPromoVideos(): Promise<PromoVideo[]> {
    try {
      const res = await apiClient.get('/api/promo-videos', {
        params: { placement: 'showcase' },
      });
      if (Array.isArray(res.data) && res.data.length > 0) {
        return res.data;
      }
    } catch (err) {
      try {
        const res2 = await apiClient.get('/api/promo-videos');
        if (Array.isArray(res2.data) && res2.data.length > 0) {
          return res2.data;
        }
      } catch (e2) {
        // ignore
      }
    }
    return DEMO_PROMO_VIDEOS;
  },
};
