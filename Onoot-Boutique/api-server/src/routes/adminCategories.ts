import { Router } from 'express';
import { Category } from '../models/Category';
import { Product } from '../models/Product';
import { requireAdmin } from '../middlewares/auth';
import { logger } from '../lib/logger';

const router = Router();

router.use(requireAdmin);

const formatCategory = async (cat: any) => ({
  id: cat._id,
  name: cat.name,
  slug: cat.slug,
  description: cat.description ?? null,
  image: cat.image ?? null,
  productCount: await Product.countDocuments({ category: cat.slug }),
});

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

router.get('/', async (_req, res): Promise<void> => {
  try {
    const cats = await Category.find().sort({ name: 1 });
    res.json(await Promise.all(cats.map(formatCategory)));
  } catch (err) {
    logger.error({ err }, 'Failed to fetch categories');
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', async (req, res): Promise<void> => {
  try {
    const name = String(req.body.name ?? '').trim();
    if (!name) {
      res.status(400).json({ error: 'Le nom est obligatoire.' });
      return;
    }

    const cat = new Category({
      name,
      slug: req.body.slug?.trim() || slugify(name),
      description: req.body.description?.trim() || undefined,
      image: req.body.image?.trim() || undefined,
    });
    await cat.save();
    res.status(201).json(await formatCategory(cat));
  } catch (err) {
    logger.error({ err }, 'Failed to create category');
    res.status(400).json({ error: 'Invalid category data' });
  }
});

router.put('/:id', async (req, res): Promise<void> => {
  try {
    const name = req.body.name ? String(req.body.name).trim() : undefined;
    const updates = {
      ...(name ? { name, slug: req.body.slug?.trim() || slugify(name) } : {}),
      description: req.body.description?.trim() || undefined,
      image: req.body.image?.trim() || undefined,
    };
    const updated = await Category.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!updated) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }
    res.json(await formatCategory(updated));
  } catch (err) {
    logger.error({ err }, 'Failed to update category');
    res.status(400).json({ error: 'Invalid category data' });
  }
});

router.delete('/:id', async (req, res): Promise<void> => {
  try {
    const deleted = await Category.findByIdAndDelete(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }
    res.sendStatus(204);
  } catch (err) {
    logger.error({ err }, 'Failed to delete category');
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
