import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Admin } from '../models/Admin';
import { logger } from '../lib/logger';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-onoot';

router.get('/ping', (req, res) => {
  res.json({ ok: true });
});

router.post('/setup', async (req, res) => {
  try {
    const adminCount = await Admin.countDocuments();
    if (adminCount > 0) {
      res.status(400).json({ error: 'Un administrateur existe déjà.' });
      return;
    }

    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;

    if (!email || !password) {
      logger.error('ADMIN_EMAIL et ADMIN_PASSWORD doivent être définis dans les variables d\'environnement.');
      res.status(500).json({ error: 'Configuration du serveur incomplète pour la création de l\'administrateur.' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newAdmin = new Admin({ email, passwordHash });
    await newAdmin.save();

    logger.info({ email }, 'Compte administrateur créé');
    res.status(201).json({ message: 'Compte administrateur créé avec succès.' });
  } catch (error) {
    logger.error({ err: error }, 'Erreur setup admin');
    res.status(500).json({ error: 'Erreur interne du serveur.' });
  }
});

// Route de connexion (login)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'Email et mot de passe requis.' });
      return;
    }

    const defaultEmail = process.env.ADMIN_EMAIL || process.env.VITE_ADMIN_EMAIL || 'adminboutique@onoot.com';
    const defaultPassword = process.env.ADMIN_PASSWORD || process.env.VITE_ADMIN_PASSWORD || 'admin1234';

    let admin = await Admin.findOne({ email });
    if (!admin) {
      // If admin not found, try to create default admin from env vars if credentials match
      if (email.toLowerCase() === defaultEmail.toLowerCase() && password === defaultPassword) {
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(defaultPassword, salt);
        admin = await Admin.create({ email: defaultEmail, passwordHash });
        logger.info({ email: defaultEmail }, 'Admin par défaut créé automatiquement lors du login');
      } else {
        res.status(401).json({ error: 'Aucun administrateur trouvé avec cet email.' });
        return;
      }
    }

    let isMatch = await bcrypt.compare(password, admin.passwordHash);
    if (!isMatch) {
      // If default admin credentials match, update the passwordHash to restore access
      if (email.toLowerCase() === defaultEmail.toLowerCase() && password === defaultPassword) {
        const salt = await bcrypt.genSalt(10);
        admin.passwordHash = await bcrypt.hash(defaultPassword, salt);
        await admin.save();
        isMatch = true;
      } else {
        res.status(401).json({ error: 'Mot de passe incorrect.' });
        return;
      }
    }

    // Generate JWT
    const token = jwt.sign(
      { id: admin._id, email: admin.email, role: 'admin' },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    logger.info({ email }, 'Administrateur connecté');
    res.status(200).json({ token, email: admin.email });
  } catch (error: any) {
    logger.error({ err: error }, 'Erreur login admin');
    if (error?.name === 'MongooseServerSelectionError' || error?.message?.includes('buffering timed out')) {
      res.status(503).json({ error: 'Connexion à MongoDB Atlas impossible : autorisez l\'adresse IP 0.0.0.0/0 dans MongoDB Atlas Network Access.' });
      return;
    }
    res.status(500).json({ error: error?.message || 'Erreur interne du serveur.' });
  }
});

export default router;
