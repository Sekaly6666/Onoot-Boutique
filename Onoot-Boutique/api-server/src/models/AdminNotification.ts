import mongoose, { Schema, Document } from 'mongoose';

export interface IAdminNotification extends Document {
  type: 'order' | 'user' | 'stock' | 'review' | 'info';
  title: string;
  desc: string;
  read: boolean;
  createdAt: Date;
}

const AdminNotificationSchema = new Schema<IAdminNotification>(
  {
    type: { type: String, required: true, enum: ['order', 'user', 'stock', 'review', 'info'] },
    title: { type: String, required: true },
    desc: { type: String, required: true },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const AdminNotification = mongoose.model<IAdminNotification>('AdminNotification', AdminNotificationSchema);
