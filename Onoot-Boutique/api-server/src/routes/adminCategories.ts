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

export const DEFAULT_STORE_CATEGORIES = [
  {
    name: "Smartphones & Téléphonie",
    slug: "smartphones",
    description: "Smartphones derniers cris, téléphones portables et accessoires mobiles de qualité.",
    image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600",
  },
  {
    name: "Montres connectées",
    slug: "watches",
    description: "Smartwatches intelligentes, bracelets connectés sport et élégance.",
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600",
  },
  {
    name: "Écouteurs",
    slug: "earphones",
    description: "Écouteurs sans fil bluetooth, oreillettes réducteur de bruit et casques audio.",
    image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600",
  },
  {
    name: "Coques & Protections",
    slug: "cases",
    description: "Coques antichoc, verres trempés et étuis de protection ultra résistants.",
    image: "https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=600",
  },
  {
    name: "Batteries externes",
    slug: "power-banks",
    description: "Power banks haute capacité, charge rapide pour ne jamais manquer d'énergie.",
    image: "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=600",
  },
  {
    name: "Chargeurs & Câbles",
    slug: "chargers",
    description: "Chargeurs rapides Type-C, câbles renforcés et adaptateurs universels.",
    image: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=600",
  },
  {
    name: "Haut-parleurs",
    slug: "speakers",
    description: "Enceintes portables bluetooth étanches avec basses puissantes.",
    image: "https://images.unsplash.com/photo-1545454675-3531b543be5d?w=600",
  },
  {
    name: "Robes",
    slug: "robes",
    description: "Robes élégantes pour toutes les occasions et prêt-à-porter féminin.",
    image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600",
  },
  {
    name: "Chaussures",
    slug: "chaussures",
    description: "Chaussures tendance, sneakers et sandales chics.",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600",
  },
  {
    name: "Sacs",
    slug: "sacs",
    description: "Sacs à main, maroquinerie et accessoires de mode de qualité.",
    image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600",
  },
  {
    name: "Bijoux",
    slug: "bijoux",
    description: "Bijoux et accessoires raffinés, montres et parures.",
    image: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600",
  },
  {
    name: "Parfums",
    slug: "parfums",
    description: "Parfums et soins de luxe pour hommes et femmes.",
    image: "https://images.unsplash.com/photo-1541643600914-78b084683702?w=600",
  },
];

export async function seedDefaultCategoriesIfEmpty() {
  try {
    const count = await Category.countDocuments();
    if (count === 0) {
      await Category.insertMany(DEFAULT_STORE_CATEGORIES);
      logger.info(`Seeded ${DEFAULT_STORE_CATEGORIES.length} default categories into database`);
    }
  } catch (err) {
    logger.warn({ err }, "Could not seed default categories");
  }
}

// Auto seed on boot
seedDefaultCategoriesIfEmpty();

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

router.get('/', async (_req, res): Promise<void> => {
  try {
    let cats = await Category.find().sort({ name: 1 });
    if (cats.length === 0) {
      await seedDefaultCategoriesIfEmpty();
      cats = await Category.find().sort({ name: 1 });
    }
    res.json(await Promise.all(cats.map(formatCategory)));
  } catch (err) {
    logger.error({ err }, 'Failed to fetch categories');
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/sync-defaults', async (_req, res): Promise<void> => {
  try {
    for (const item of DEFAULT_STORE_CATEGORIES) {
      await Category.findOneAndUpdate(
        { slug: item.slug },
        { $setOnInsert: item },
        { upsert: true, new: true }
      );
    }
    // Also include any categories used on products
    const productSlugs = await Product.distinct('category');
    for (const slug of productSlugs) {
      if (slug) {
        await Category.findOneAndUpdate(
          { slug: slug.toLowerCase() },
          { 
            $setOnInsert: { 
              name: slug.charAt(0).toUpperCase() + slug.slice(1), 
              slug: slug.toLowerCase() 
            } 
          },
          { upsert: true, new: true }
        );
      }
    }
    const cats = await Category.find().sort({ name: 1 });
    res.json(await Promise.all(cats.map(formatCategory)));
  } catch (err) {
    logger.error({ err }, 'Failed to sync categories');
    res.status(500).json({ error: 'Erreur lors de la synchronisation des catégories' });
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
