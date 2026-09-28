import mongoose, { Schema, Document } from 'mongoose';

export interface IPromoVideo extends Document {
  title: string;
  subtitle?: string;
  description?: string;
  videoUrl: string;
  thumbnailUrl?: string;
  productLink?: string;
  productName?: string;
  productId?: string;
  price?: number;
  discountPrice?: number;
  badge?: string;
  placement: 'all' | 'marquee' | 'showcase';
  isActive: boolean;
  order: number;
  viewsCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const PromoVideoSchema: Schema = new Schema(
  {
    title: { type: String, required: true },
    subtitle: { type: String, required: false },
    description: { type: String, required: false },
    videoUrl: { type: String, required: true },
    thumbnailUrl: { type: String, required: false },
    productLink: { type: String, required: false },
    productName: { type: String, required: false },
    productId: { type: String, required: false },
    price: { type: Number, required: false },
    discountPrice: { type: Number, required: false },
    badge: { type: String, default: 'PROMO EXCLUSIVE' },
    placement: { 
      type: String, 
      enum: ['all', 'marquee', 'showcase'], 
      default: 'all' 
    },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
    viewsCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const PromoVideo = mongoose.model<IPromoVideo>('PromoVideo', PromoVideoSchema);
