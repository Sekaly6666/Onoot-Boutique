import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/onootboutique';

const adminSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});
const Admin = mongoose.model('Admin', adminSchema);

async function resetAdmin() {
  await mongoose.connect(uri);
  const email = process.env.VITE_ADMIN_EMAIL || 'adminonoot@boutique.com';
  const plainPwd = process.env.VITE_ADMIN_PASSWORD || 'onootboutique1234';
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(plainPwd, salt);
  const result = await Admin.findOneAndUpdate(
    { email },
    { email, passwordHash },
    { upsert: true, new: true }
  );
  console.log('✅ Admin credentials ensured:', result.email);
  await mongoose.disconnect();
  process.exit(0);
}

resetAdmin();
