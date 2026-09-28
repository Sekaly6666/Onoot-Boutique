import mongoose from 'mongoose';
import { logger } from './logger';

export async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/onootboutique';
  try {
    await mongoose.connect(uri);
    logger.info('MongoDB connected successfully to ' + uri);
  } catch (error) {
    logger.error({ err: error }, 'MongoDB connection failed');
    process.exit(1);
  }
}
