import { Router, type IRouter } from "express";
import { eq, like, and, gte, lte, desc, asc, or, ilike } from "drizzle-orm";
import { db, productsTable, reviewsTable } from "@workspace/db";
import {
  ListProductsQueryParams,
  GetProductParams,
  CreateProductBody,
  UpdateProductBody,
  UpdateProductParams,
  DeleteProductParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function formatProduct(p: typeof productsTable.$inferSelect) {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    description: p.description ?? null,
    price: parseFloat(p.price),
    discountPrice: p.discountPrice ? parseFloat(p.discountPrice) : null,
    category: p.category,
    subCategory: p.subCategory ?? null,
    brand: p.brand ?? null,
    stock: p.stock,
    images: p.images ?? [],
    colors: p.colors ?? [],
    tags: p.tags ?? [],
    featured: p.featured,
    bestSeller: p.bestSeller,
    rating: parseFloat(p.rating),
    reviewCount: p.reviewCount,
    salesCount: p.salesCount,
    createdAt: p.createdAt.toISOString(),
  };
}

router.get("/products", async (req, res): Promise<void> => {
  const params = ListProductsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const { category, brand, search, minPrice, maxPrice, minRating, inStock, featured, bestSeller, onSale, page = 1, limit = 20, sortBy } = params.data;

  const conditions = [];

  if (category) conditions.push(eq(productsTable.category, category));
  if (brand) conditions.push(eq(productsTable.brand, brand));
  if (search) conditions.push(or(ilike(productsTable.name, `%${search}%`), ilike(productsTable.description, `%${search}%`)));
  if (minPrice != null) conditions.push(gte(productsTable.price, String(minPrice)));
  if (maxPrice != null) conditions.push(lte(productsTable.price, String(maxPrice)));
  if (minRating != null) conditions.push(gte(productsTable.rating, String(minRating)));
  if (inStock) conditions.push(gte(productsTable.stock, 1));
  if (featured) conditions.push(eq(productsTable.featured, true));
  if (bestSeller) conditions.push(eq(productsTable.bestSeller, true));
  if (onSale) conditions.push(lte(productsTable.discountPrice, productsTable.price));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  let orderBy;
  if (sortBy === "price_asc") orderBy = asc(productsTable.price);
  else if (sortBy === "price_desc") orderBy = desc(productsTable.price);
  else if (sortBy === "rating") orderBy = desc(productsTable.rating);
  else if (sortBy === "sales") orderBy = desc(productsTable.salesCount);
  else orderBy = desc(productsTable.createdAt);

  const offset = ((page as number) - 1) * (limit as number);
  const products = await db.select().from(productsTable).where(whereClause).orderBy(orderBy).limit(limit as number).offset(offset);
  const allProducts = await db.select({ id: productsTable.id }).from(productsTable).where(whereClause);

  res.json({
    products: products.map(formatProduct),
    total: allProducts.length,
    page: page as number,
    limit: limit as number,
  });
});

router.post("/products", async (req, res): Promise<void> => {
  const parsed = CreateProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const slug = parsed.data.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") + "-" + Date.now();
  const [product] = await db.insert(productsTable).values({
    ...parsed.data,
    slug,
    price: String(parsed.data.price),
    discountPrice: parsed.data.discountPrice ? String(parsed.data.discountPrice) : undefined,
    images: parsed.data.images ?? [],
    colors: parsed.data.colors ?? [],
    tags: parsed.data.tags ?? [],
  }).returning();

  res.status(201).json(formatProduct(product));
});

router.get("/products/featured", async (_req, res): Promise<void> => {
  const products = await db.select().from(productsTable).where(eq(productsTable.featured, true)).orderBy(desc(productsTable.createdAt)).limit(8);
  res.json(products.map(formatProduct));
});

router.get("/products/new-arrivals", async (_req, res): Promise<void> => {
  const products = await db.select().from(productsTable).orderBy(desc(productsTable.createdAt)).limit(8);
  res.json(products.map(formatProduct));
});

router.get("/products/best-sellers", async (_req, res): Promise<void> => {
  const products = await db.select().from(productsTable).where(eq(productsTable.bestSeller, true)).orderBy(desc(productsTable.salesCount)).limit(8);
  res.json(products.map(formatProduct));
});

router.get("/products/on-sale", async (_req, res): Promise<void> => {
  const products = await db.select().from(productsTable).orderBy(desc(productsTable.createdAt)).limit(8);
  const onSale = products.filter(p => p.discountPrice != null && parseFloat(p.discountPrice) < parseFloat(p.price));
  res.json(onSale.map(formatProduct));
});

router.get("/products/:id", async (req, res): Promise<void> => {
  const params = GetProductParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [product] = await db.select().from(productsTable).where(eq(productsTable.id, params.data.id));
  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  res.json(formatProduct(product));
});

router.patch("/products/:id", async (req, res): Promise<void> => {
  const params = UpdateProductParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.price != null) updateData.price = String(parsed.data.price);
  if (parsed.data.discountPrice != null) updateData.discountPrice = String(parsed.data.discountPrice);
  else if (parsed.data.discountPrice === null) updateData.discountPrice = null;

  const [product] = await db.update(productsTable).set(updateData).where(eq(productsTable.id, params.data.id)).returning();
  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  res.json(formatProduct(product));
});

router.delete("/products/:id", async (req, res): Promise<void> => {
  const params = DeleteProductParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [product] = await db.delete(productsTable).where(eq(productsTable.id, params.data.id)).returning();
  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
