import { Router } from 'express';
import { Review } from '../models/Review';
import { Product } from '../models/Product';
import { requireAdmin } from '../middlewares/auth';
import { logger } from '../lib/logger';

import mongoose from 'mongoose';

const router = Router();

router.use(requireAdmin);

// GET all reviews for admin panel
router.get('/', async (req, res): Promise<void> => {
  try {
    const reviews = await Review.find().sort({ createdAt: -1 });
    
    // Enrich with product names
    const enrichedReviews = await Promise.all(reviews.map(async (r: any) => {
      let product = null;
      if (mongoose.isValidObjectId(r.productId)) {
        product = await Product.findById(r.productId);
      } else {
        product = await Product.findOne({ id: r.productId });
      }
      return {
        id: r._id,
        productId: r.productId,
        productName: product ? product.name : 'Produit inconnu',
        userId: r.userId ?? null,
        userName: r.userName,
        rating: r.rating,
        comment: r.comment ?? null,
        createdAt: r.createdAt?.toISOString(),
      };
    }));
    
    res.json(enrichedReviews);
  } catch (err) {
    logger.error({ err }, 'Failed to fetch admin reviews');
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE a review
router.delete('/:id', async (req, res): Promise<void> => {
  try {
    const { id } = req.params;
    let deleted = null;
    if (mongoose.isValidObjectId(id)) {
      deleted = await Review.findByIdAndDelete(id);
    } else {
      deleted = await Review.findOneAndDelete({ _id: id });
    }
    if (!deleted) {
      res.status(404).json({ error: 'Review not found' });
      return;
    }
    
    // Recalculate average rating and count
    const productId = deleted.productId;
    const agg = await Review.aggregate([
      { $match: { productId } },
      { $group: { _id: null, avgRating: { $avg: "$rating" }, reviewCount: { $sum: 1 } } },
    ]);
    const { avgRating = 0, reviewCount = 0 } = agg[0] || {};
    const rating = parseFloat(avgRating.toFixed(2));
  
    if (mongoose.isValidObjectId(productId)) {
      await Product.findByIdAndUpdate(productId, { rating, reviewCount });
    } else {
      await Product.findOneAndUpdate(
        { $or: [{ slug: productId }, { name: productId }] },
        { rating, reviewCount }
      );
    }

    res.json({ message: 'Review deleted successfully' });
  } catch (err) {
    logger.error({ err }, 'Failed to delete review');
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
