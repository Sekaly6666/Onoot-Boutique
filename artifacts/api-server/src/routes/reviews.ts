import { Router, type IRouter } from "express";
import { db, reviewsTable, productsTable } from "@workspace/db";
import { ListProductReviewsParams, CreateReviewParams, CreateReviewBody } from "@workspace/api-zod";
import { eq, sql, avg } from "drizzle-orm";

const router: IRouter = Router();

function formatReview(r: typeof reviewsTable.$inferSelect) {
  return {
    id: r.id,
    productId: r.productId,
    userId: r.userId ?? null,
    userName: r.userName,
    rating: r.rating,
    comment: r.comment,
    createdAt: r.createdAt.toISOString(),
  };
}

router.get("/products/:id/reviews", async (req, res): Promise<void> => {
  const params = ListProductReviewsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const reviews = await db.select().from(reviewsTable).where(eq(reviewsTable.productId, params.data.id));
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

  const [review] = await db.insert(reviewsTable).values({
    productId: params.data.id,
    userId: parsed.data.userId ?? null,
    userName: parsed.data.userName,
    rating: parsed.data.rating,
    comment: parsed.data.comment,
  }).returning();

  const [{ avgRating, reviewCount }] = await db
    .select({ avgRating: avg(reviewsTable.rating), reviewCount: sql<number>`count(*)::int` })
    .from(reviewsTable)
    .where(eq(reviewsTable.productId, params.data.id));

  await db.update(productsTable)
    .set({
      rating: String(parseFloat(avgRating ?? "0").toFixed(2)),
      reviewCount: reviewCount ?? 0,
    })
    .where(eq(productsTable.id, params.data.id));

  res.status(201).json(formatReview(review));
});

export default router;
