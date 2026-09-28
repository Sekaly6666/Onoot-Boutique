import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: 'client' | 'admin';
  status: 'actif' | 'inactif';
  passwordHash?: string;
  authProvider: 'local' | 'google';
  googleId?: string;
  avatar?: string;
  joinDate: Date;
  lastLogin?: Date;
  lastActive?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const UserSchema: Schema = new Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: false, default: '' },
    email: { type: String, required: true, unique: true },
    phone: { type: String },
    role: { type: String, enum: ['client', 'admin', 'customer'], default: 'client' },
    status: { type: String, enum: ['actif', 'inactif'], default: 'actif' },
    passwordHash: { type: String },
    authProvider: { type: String, enum: ['local', 'google'], default: 'local' },
    googleId: { type: String, sparse: true, index: true },
    avatar: { type: String },
    joinDate: { type: Date, default: Date.now },
    lastLogin: { type: Date },
    lastActive: { type: Date },
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>('User', UserSchema);
