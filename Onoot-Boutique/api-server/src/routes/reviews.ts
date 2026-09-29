import { Router, type IRouter } from "express";
import mongoose from "mongoose";
import { Review } from "../models/Review";
import { Product } from "../models/Product";
import { AdminNotification } from "../models/AdminNotification";
import { ListProductReviewsParams, CreateReviewParams, CreateReviewBody } from "@workspace/api-zod";

const router: IRouter = Router();

function formatReview(r: any) {
  return {
    id: r._id?.toString() || r.id,
    productId: r.productId,
    userId: r.userId ?? null,
    userName: r.userName,
    rating: r.rating,
    comment: r.comment ?? null,
    createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
  };
}

async function findProductSafe(id: string) {
  try {
    if (mongoose.isValidObjectId(id)) {
      return await Product.findById(id);
    }
    return await Product.findOne({ $or: [{ slug: id }, { name: id }] });
  } catch {
    return null;
  }
}

async function updateProductRatingStats(productId: string) {
  try {
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
  } catch (err) {
    console.error("Failed to update product rating stats:", err);
  }
}

router.get("/products/:id/reviews", async (req, res): Promise<void> => {
  const params = ListProductReviewsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  try {
    const reviews = await Review.find({ productId: params.data.id }).sort({ createdAt: -1 });
    res.json(reviews.map(formatReview));
  } catch (err: any) {
    console.error("Failed to fetch product reviews:", err);
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
});

router.post("/products/:id/reviews", async (req, res): Promise<void> => {
  const params = CreateReviewParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = CreateReviewBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  try {
    const newReview = new Review({
      productId: params.data.id,
      userId: parsed.data.userId ?? null,
      userName: parsed.data.userName,
      rating: parsed.data.rating,
      comment: parsed.data.comment,
    });
    await newReview.save();

    // Create admin notification safely
    try {
      const product = await findProductSafe(params.data.id);
      const productName = product ? product.name : (params.data.id.startsWith("example-") ? "Produit Démo" : "Produit");
      const notif = new AdminNotification({
        type: "review",
        title: "Nouvel avis client",
        desc: `${parsed.data.userName} a laissé un avis ${parsed.data.rating} étoiles sur "${productName}"`,
      });
      await notif.save();
    } catch (err) {
      console.error("Failed to create admin notification for review", err);
    }

    // Recalculate average rating and count safely without casting errors
    await updateProductRatingStats(params.data.id);

    res.status(201).json(formatReview(newReview));
  } catch (err: any) {
    console.error("Failed to save review:", err);
    res.status(500).json({ error: err.message || "Failed to create review" });
  }
});

// PATCH /products/:id/reviews/:reviewId — Update an existing review
router.patch("/products/:id/reviews/:reviewId", async (req, res): Promise<void> => {
  const { id: productId, reviewId } = req.params;

  try {
    let review = null;
    if (mongoose.isValidObjectId(reviewId)) {
      review = await Review.findById(reviewId);
    } else {
      review = await Review.findOne({ _id: reviewId });
    }

    if (!review) {
      res.status(404).json({ error: "Avis introuvable" });
      return;
    }

    const { rating, comment } = req.body;
    if (rating !== undefined) review.rating = rating;
    if (comment !== undefined) review.comment = comment;
    await review.save();

    // Create admin notification
    try {
      const product = await findProductSafe(productId);
      const productName = product ? product.name : (productId.startsWith("example-") ? "Produit Démo" : "Produit");
      const notif = new AdminNotification({
        type: "review",
        title: "Avis client modifié",
        desc: `${review.userName} a modifié son avis (${review.rating} étoiles) sur "${productName}"`,
      });
      await notif.save();
    } catch (err) {
      console.error("Failed to create admin notification for review update", err);
    }

    await updateProductRatingStats(productId);

    res.json(formatReview(review));
  } catch (err: any) {
    console.error("Failed to update review:", err);
    res.status(500).json({ error: err.message || "Failed to update review" });
  }
});

export default router;
