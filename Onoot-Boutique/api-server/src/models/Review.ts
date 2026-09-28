import mongoose, { Schema, Document } from 'mongoose';

export interface IReview extends Document {
  productId: string; // ObjectId as string
  userId?: string;
  userName: string;
  rating: number;
  comment?: string;
  createdAt?: Date;
}

const ReviewSchema = new Schema<IReview>(
  {
    productId: { type: String, required: true },
    userId: { type: String },
    userName: { type: String, required: true },
    rating: { type: Number, required: true },
    comment: { type: String },
  },
  { timestamps: true }
);

export const Review = mongoose.model<IReview>('Review', ReviewSchema);
