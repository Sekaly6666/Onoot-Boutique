import mongoose from 'mongoose';
import { logger } from './logger';

export async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb+srv://onootboutique_db_user:RCUHCMxfFQIE89nu@onoot-boutique.baoyvzr.mongodb.net/onootboutique?retryWrites=true&w=majority';
  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
    });
    logger.info('MongoDB connected successfully');
  } catch (error) {
    logger.error({ err: error }, 'MongoDB connection failed');
  }
}
