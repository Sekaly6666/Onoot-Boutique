export interface Product {
  id: string;
  name: string;
  slug?: string | null;
  description?: string | null;
  price: number;
  discountPrice?: number | null;
  category: string;
  subCategory?: string | null;
  brand?: string | null;
  stock: number;
  images: string[];
  colors?: string[];
  tags?: string[];
  featured?: boolean;
  newArrival?: boolean;
  bestSeller?: boolean;
  flashSale?: boolean;
  rating?: number;
  reviewCount?: number;
  salesCount?: number;
  video?: string | null;
  status?: string;
  createdAt?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  image?: string | null;
  productCount?: number;
}

export interface CartItem {
  productId: string;
  quantity: number;
  price: number;
  color?: string | null;
  product: {
    id: string;
    name: string;
    description?: string | null;
    price: number;
    discountPrice?: number | null;
    category: string;
    images: string[];
    stock: number;
  };
}

export interface CartResponse {
  sessionId: string;
  items: CartItem[];
  subtotal: number;
  total: number;
}

export interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  color?: string | null;
  image?: string | null;
}

export interface Order {
  id: string;
  _id?: string;
  orderNumber: string;
  userId?: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryAddress: string;
  city: string;
  items: OrderItem[];
  subtotal?: number;
  shippingFee: number;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  status: 'En attente' | 'Confirmée' | 'En cours de livraison' | 'Livrée' | 'Annulée';
  notes?: string | null;
  createdAt: string;
  qrCode?: string;
  ticketCode?: string;
}

export interface User {
  id: string;
  _id?: string;
  name: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  role?: string;
  status?: string;
  createdAt?: string;
}

export interface PromoVideo {
  id?: string;
  _id?: string;
  title: string;
  subtitle?: string;
  description?: string;
  videoUrl: string;
  thumbnailUrl?: string;
  productLink?: string;
  productId?: string;
  productName?: string;
  price?: number;
  discountPrice?: number;
  badge?: string;
  viewsCount?: number;
}
