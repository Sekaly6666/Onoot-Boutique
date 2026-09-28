import mongoose, { Schema, Document } from 'mongoose';

export interface IOrderItem {
  productId: string; // reference to Product ObjectId as string
  quantity: number;
  price: number;
  productName?: string;
  productImage?: string;
}

export interface IShippingAddress {
  fullName: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  postalCode?: string;
}

export interface IOrder extends Document {
  userId?: string; // reference to User ObjectId
  sessionId?: string;
  customerEmail?: string;
  items: IOrderItem[];
  totalAmount: number;
  paymentMethod: string;
  orderStatus: string;
  cancelReason?: string;
  estimatedDeliveryDate?: string;
  shippingAddress: IShippingAddress;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const OrderItemSchema = new Schema<IOrderItem>({
  productId: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true },
  productName: String,
  productImage: String,
});

const ShippingAddressSchema = new Schema<IShippingAddress>({
  fullName: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  city: { type: String, required: true },
  country: { type: String, required: true },
  postalCode: String,
});

const OrderSchema = new Schema<IOrder>(
  {
    userId: String,
    sessionId: String,
    customerEmail: String,
    items: { type: [OrderItemSchema], default: [] },
    totalAmount: { type: Number, required: true },
    paymentMethod: { type: String, required: true },
    orderStatus: { type: String, required: true },
    cancelReason: String,
    estimatedDeliveryDate: String,
    shippingAddress: { type: ShippingAddressSchema, required: true },
    notes: String,
  },
  { timestamps: true },
);

export const Order = mongoose.model<IOrder>('Order', OrderSchema);
