import { Router } from 'express';
import { Product } from '../models/Product';
import { requireAdmin } from '../middlewares/auth';
import { logger } from '../lib/logger';

const router = Router();

router.use(requireAdmin);

// GET all products with optional filters (category, price range, search)
router.get('/', async (req, res): Promise<void> => {
  try {
    const { search, category, minPrice, maxPrice } = req.query as any;
    const filter: any = {};
    if (search) {
      const regex = new RegExp(search, 'i');
      filter.$or = [{ name: regex }, { description: regex }];
    }
    if (category) filter.category = category;
    if (minPrice) filter.price = { ...(filter.price || {}), $gte: Number(minPrice) };
    if (maxPrice) filter.price = { ...(filter.price || {}), $lte: Number(maxPrice) };

    const products = await Product.find(filter).sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    logger.error({ err }, 'Failed to fetch products');
    res.status(500).json({ error: 'Internal server error' });
  }
});

// CREATE product
router.post('/', async (req, res): Promise<void> => {
  try {
    const {
      name,
      description,
      price,
      discountPrice,
      stock,
      category,
      imageUrl,
      images,
      video,
      externalLink,
      status,
      featured,
      newArrival,
      bestSeller,
      flashSale,
      flashSaleEndDate,
    } = req.body;
    const newProduct = new Product({
      name,
      description,
      price,
      discountPrice,
      stock,
      category,
      imageUrl,
      images,
      video,
      externalLink,
      status,
      featured,
      newArrival,
      bestSeller,
      flashSale,
      flashSaleEndDate,
      slug: name?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Date.now(),
    });
    await newProduct.save();
    res.status(201).json(newProduct);
  } catch (err) {
    logger.error({ err }, 'Failed to create product');
    res.status(400).json({ error: 'Invalid product data' });
  }
});

// UPDATE product
router.put('/:id', async (req, res): Promise<void> => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const updated = await Product.findByIdAndUpdate(id, updates, { new: true });
    if (!updated) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    res.json(updated);
  } catch (err) {
    logger.error({ err }, 'Failed to update product');
    res.status(400).json({ error: 'Invalid update data' });
  }
});

// DELETE product
router.delete('/:id', async (req, res): Promise<void> => {
  try {
    const { id } = req.params;
    const deleted = await Product.findByIdAndDelete(id);
    if (!deleted) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    res.json({ message: 'Product deleted' });
  } catch (err) {
    logger.error({ err }, 'Failed to delete product');
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
