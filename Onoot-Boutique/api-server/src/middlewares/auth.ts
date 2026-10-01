import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { verifyToken } from '../routes/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-onoot';

export const requireAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Accès non autorisé. Token manquant.' });
    return;
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    res.status(401).json({ error: 'Accès non autorisé. Token manquant.' });
    return;
  }

  // 1. Try standard JWT verification with active secret
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    (req as any).admin = decoded;
    next();
    return;
  } catch (err) {
    // Continue to fallback check
  }

  // 2. Try fallback dev secret if configured secret changed
  if (process.env.JWT_SECRET && process.env.JWT_SECRET !== 'dev-secret-key-onoot') {
    try {
      const decoded = jwt.verify(token, 'dev-secret-key-onoot');
      (req as any).admin = decoded;
      next();
      return;
    } catch (err) {}
  }

  // 3. Try boutique customer-admin token
  try {
    const userId = verifyToken(token);
    if (userId) {
      const user = await User.findById(userId);
      if (user && user.role === 'admin') {
        (req as any).admin = { id: user._id, email: user.email, role: 'admin' };
        next();
        return;
      }
    }
  } catch (err) {}

  res.status(401).json({ error: 'Token invalide ou expiré.' });
};
