import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { requireAdmin } from '../middlewares/auth';
import { logger } from '../lib/logger';

const router = Router();

// Ensure uploads directory exists
const uploadsDir = path.resolve(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    let ext = path.extname(file.originalname).toLowerCase();
    if (!ext) {
      if (file.mimetype.includes('quicktime') || file.mimetype.includes('mov')) ext = '.mov';
      else if (file.mimetype.startsWith('video/')) ext = '.mp4';
      else if (file.mimetype.startsWith('image/')) {
        if (file.mimetype.includes('png')) ext = '.png';
        else if (file.mimetype.includes('webp')) ext = '.webp';
        else ext = '.jpg';
      } else {
        ext = '.mp4';
      }
    }
    const safeName = `${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`;
    cb(null, safeName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500 MB max for videos & images
  fileFilter: (_req, file, cb) => {
    const isImage = file.mimetype.startsWith('image/');
    const isVideo = file.mimetype.startsWith('video/') || file.mimetype.includes('quicktime');
    const allowedExtensions = /\.(jpg|jpeg|png|gif|webp|svg|bmp|heic|heif|mp4|mov|avi|mkv|webm|m4v|3gp|flv|wmv|ts|ogv|qt)$/i;
    const hasAllowedExt = allowedExtensions.test(path.extname(file.originalname));
    const isOctetStream = file.mimetype === 'application/octet-stream';

    if (isImage || isVideo || hasAllowedExt || isOctetStream) {
      cb(null, true);
    } else {
      cb(new Error('Format de fichier non supporté. Veuillez choisir une image ou une vidéo (MP4, MOV, WebM, etc.).'));
    }
  },
});

// Admin upload route with graceful error handling
router.post('/admin/upload', requireAdmin, (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'Fichier trop volumineux. La taille maximale autorisée est de 500 Mo.' });
      }
      logger.warn({ err }, 'Multer upload error');
      return res.status(400).json({ error: `Erreur d'importation : ${err.message}` });
    }

    if (err) {
      logger.warn({ err }, 'Upload error');
      return res.status(400).json({ error: err.message || 'Erreur lors du téléversement du fichier.' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier reçu' });
    }

    // Return static URL
    const fileUrl = `/uploads/${req.file.filename}`;
    logger.info({ filename: req.file.filename, size: req.file.size }, 'File uploaded successfully');
    res.json({
      url: fileUrl,
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype,
    });
  });
});

export default router;
