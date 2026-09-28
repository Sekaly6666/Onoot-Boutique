import { Router, type IRouter } from "express";
import { Review } from "../models/Review";
import { Product } from "../models/Product";
import { AdminNotification } from "../models/AdminNotification";
import { ListProductReviewsParams, CreateReviewParams, CreateReviewBody } from "@workspace/api-zod";

const router: IRouter = Router();

function formatReview(r: any) {
  return {
    id: r._id,
    productId: r.productId,
    userId: r.userId ?? null,
    userName: r.userName,
    rating: r.rating,
    comment: r.comment ?? null,
    createdAt: r.createdAt?.toISOString(),
  };
}

router.get("/products/:id/reviews", async (req, res): Promise<void> => {
  const params = ListProductReviewsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const reviews = await Review.find({ productId: params.data.id });
  res.json(reviews.map(formatReview));
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
  const newReview = new Review({
    productId: params.data.id,
    userId: parsed.data.userId ?? null,
    userName: parsed.data.userName,
    rating: parsed.data.rating,
    comment: parsed.data.comment,
  });
  await newReview.save();

  // Create admin notification
  try {
    const product = await Product.findById(params.data.id);
    const productName = product ? product.name : "Produit";
    const notif = new AdminNotification({
      type: "review",
      title: "Nouvel avis client",
      desc: `${parsed.data.userName} a laissé un avis ${parsed.data.rating} étoiles sur "${productName}"`,
    });
    await notif.save();
  } catch (err) {
    console.error("Failed to create admin notification for review", err);
  }

  // Recalculate average rating and count
  const agg = await Review.aggregate([
    { $match: { productId: params.data.id } },
    { $group: { _id: null, avgRating: { $avg: "$rating" }, reviewCount: { $sum: 1 } } },
  ]);
  const { avgRating = 0, reviewCount = 0 } = agg[0] || {};

  await Product.findByIdAndUpdate(params.data.id, {
    rating: parseFloat(avgRating.toFixed(2)),
    reviewCount,
  });

  res.status(201).json(formatReview(newReview));
});

// PATCH /products/:id/reviews/:reviewId — Update an existing review
router.patch("/products/:id/reviews/:reviewId", async (req, res): Promise<void> => {
  const { id: productId, reviewId } = req.params;

  const review = await Review.findById(reviewId);
  if (!review) {
    res.status(404).json({ error: "Avis introuvable" });
    return;
  }

  // Only the original author may edit (if userId was provided)
  const { rating, comment } = req.body;
  if (rating !== undefined) review.rating = rating;
  if (comment !== undefined) review.comment = comment;
  await review.save();

  // Create admin notification
  try {
    const product = await Product.findById(productId);
    const productName = product ? product.name : "Produit";
    const notif = new AdminNotification({
      type: "review",
      title: "Avis client modifié",
      desc: `${review.userName} a modifié son avis (${review.rating} étoiles) sur "${productName}"`,
    });
    await notif.save();
  } catch (err) {
    console.error("Failed to create admin notification for review update", err);
  }

  // Recalculate average rating
  const agg = await Review.aggregate([
    { $match: { productId } },
    { $group: { _id: null, avgRating: { $avg: "$rating" }, reviewCount: { $sum: 1 } } },
  ]);
  const { avgRating = 0, reviewCount = 0 } = agg[0] || {};
  await Product.findByIdAndUpdate(productId, {
    rating: parseFloat(avgRating.toFixed(2)),
    reviewCount,
  });

  res.json(formatReview(review));
});

export default router;
