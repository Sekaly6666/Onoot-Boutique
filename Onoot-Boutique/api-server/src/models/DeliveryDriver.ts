import mongoose, { Schema, Document } from 'mongoose';

export interface IDeliveryDriver extends Document {
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  avatarUrl?: string;
  idCardNumber?: string;
  idCardPhotoUrl?: string;
  idCardRectoUrl?: string;
  idCardVersoUrl?: string;
  vehicleType: 'moto' | 'tricycle' | 'voiture';
  licensePlate: string;
  vehiclePhotoUrl?: string;
  licensePlatePhotoUrl?: string;
  status: 'disponible' | 'en_course' | 'inactif';
  zone: string;
  deliveriesCount: number;
  rating: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DeliveryDriverSchema: Schema = new Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: false },
    phone: { type: String, required: true },
    avatarUrl: { type: String, required: false },
    idCardNumber: { type: String, required: false },
    idCardPhotoUrl: { type: String, required: false },
    idCardRectoUrl: { type: String, required: false },
    idCardVersoUrl: { type: String, required: false },
    vehicleType: { type: String, enum: ['moto', 'tricycle', 'voiture'], default: 'moto' },
    licensePlate: { type: String, required: true },
    vehiclePhotoUrl: { type: String, required: false },
    licensePlatePhotoUrl: { type: String, required: false },
    status: { type: String, enum: ['disponible', 'en_course', 'inactif'], default: 'disponible' },
    zone: { type: String, default: 'Abidjan - Toutes zones' },
    deliveriesCount: { type: Number, default: 0 },
    rating: { type: Number, default: 5.0 },
    notes: { type: String, required: false },
  },
  { timestamps: true }
);

export const DeliveryDriver = mongoose.model<IDeliveryDriver>('DeliveryDriver', DeliveryDriverSchema);
