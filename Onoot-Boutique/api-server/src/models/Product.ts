import mongoose, { Schema, Document } from 'mongoose';

export interface IProduct extends Document {
  name: string;
  description?: string;
  price: number;
  discountPrice?: number;
  stock: number;
  category: string;
  imageUrl?: string;
  images?: string[];
  video?: string;
  externalLink?: string;
  status: 'Publié' | 'Brouillon' | 'En attente';
  featured?: boolean;
  newArrival?: boolean;
  bestSeller?: boolean;
  flashSale?: boolean;
  flashSaleEndDate?: Date;
  slug?: string;
  subCategory?: string;
  brand?: string;
  colors?: string[];
  tags?: string[];
  rating?: number;
  reviewCount?: number;
  salesCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    price: { type: Number, required: true },
    stock: { type: Number, required: true },
    category: { type: String, required: true },
    imageUrl: { type: String },
    // Additional optional fields for compatibility with existing routes
    slug: { type: String },
    discountPrice: { type: Number },
    subCategory: { type: String },
    brand: { type: String },
    images: { type: [String], default: [] },
    colors: { type: [String], default: [] },
    tags: { type: [String], default: [] },
    featured: { type: Boolean, default: false },
    newArrival: { type: Boolean, default: false },
    bestSeller: { type: Boolean, default: false },
    flashSale: { type: Boolean, default: false },
    flashSaleEndDate: { type: Date },
    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    salesCount: { type: Number, default: 0 },
    video: { type: String },
    externalLink: { type: String },
    status: { type: String, enum: ['Publié', 'Brouillon', 'En attente'], default: 'Brouillon' },
  },
  { timestamps: true }
);

export const Product = mongoose.model<IProduct>('Product', ProductSchema);
