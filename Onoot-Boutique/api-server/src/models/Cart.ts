import mongoose, { Schema, model, Document } from "mongoose";

export interface ICartItem {
  productId: string; // store as string (MongoDB ObjectId or external id)
  quantity: number;
  price: number;
  color?: string;
}

export interface ICart extends Document {
  sessionId: string;
  items: ICartItem[];
}

const CartItemSchema = new Schema<ICartItem>({
  productId: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true },
  color: String,
});

const CartSchema = new Schema<ICart>({
  sessionId: { type: String, required: true, unique: true },
  items: { type: [CartItemSchema], default: [] },
});

export const Cart = model<ICart>("Cart", CartSchema);
