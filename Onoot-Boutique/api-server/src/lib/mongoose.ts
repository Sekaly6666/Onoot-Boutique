import mongoose from 'mongoose';
import { logger } from './logger';

export function getCleanMongoUri(): string {
  let uri = process.env.MONGODB_URI || 'mongodb+srv://onootboutique_db_user:RCUHCMxfFQIE89nu@onoot-boutique.baoyvzr.mongodb.net/onootboutique?retryWrites=true&w=majority';
  // Strip quotes or whitespace that might be accidentally set
  uri = uri.replace(/^["']|["']$/g, '').trim();

  if (uri.startsWith('mongodb+srv://') && !uri.includes('?')) {
    const withoutProtocol = uri.slice('mongodb+srv://'.length);
    const slashIdx = withoutProtocol.indexOf('/');
    if (slashIdx === -1) {
      uri = `${uri}/onootboutique?retryWrites=true&w=majority`;
    } else {
      const dbPart = withoutProtocol.slice(slashIdx + 1);
      if (!dbPart) {
        uri = `${uri.replace(/\/$/, '')}/onootboutique?retryWrites=true&w=majority`;
      } else {
        uri = `${uri}?retryWrites=true&w=majority`;
      }
    }
  }
  return uri;
}

export async function connectDB() {
  if (mongoose.connection.readyState === 1) return;
  const uri = getCleanMongoUri();
  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000,
    });
    logger.info('✅ MongoDB connected successfully');
  } catch (error) {
    logger.error({ err: error }, '❌ MongoDB connection failed');
  }
}
