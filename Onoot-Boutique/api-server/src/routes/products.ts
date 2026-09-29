import { Router, type IRouter } from "express";
import { Product } from "../models/Product";
import { ListProductsQueryParams, GetProductParams, CreateProductBody, UpdateProductBody, UpdateProductParams, DeleteProductParams } from "@workspace/api-zod";
import { logger } from "../lib/logger";

const router: IRouter = Router();

function formatProduct(p: any) {
  return {
    id: p._id,
    name: p.name,
    slug: p.slug ?? null,
    description: p.description ?? null,
    price: p.price ?? 0,
    discountPrice: p.discountPrice ?? null,
    category: p.category ?? '',
    subCategory: p.subCategory ?? null,
    brand: p.brand ?? null,
    stock: p.stock ?? 0,
    images: (p.images && p.images.length > 0) ? p.images : (p.imageUrl ? [p.imageUrl] : []),
    colors: p.colors ?? [],
    tags: p.tags ?? [],
    featured: p.featured ?? false,
    newArrival: p.newArrival ?? false,
    bestSeller: p.bestSeller ?? false,
    flashSale: p.flashSale ?? false,
    flashSaleEndDate: p.flashSaleEndDate ? new Date(p.flashSaleEndDate).toISOString() : null,
    rating: p.rating ?? 0,
    reviewCount: p.reviewCount ?? 0,
    salesCount: p.salesCount ?? 0,
    video: p.video ?? null,
    externalLink: p.externalLink ?? null,
    status: p.status ?? 'Publié',
    createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : new Date().toISOString(),
  };
}

router.get("/products", async (req, res): Promise<void> => {
  const params = ListProductsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const { 
    category, 
    brand, 
    search, 
    minPrice, 
    maxPrice, 
    minRating, 
    inStock, 
    featured, 
    bestSeller, 
    onSale, 
    page = 1, 
    limit = 24, 
    sortBy 
  } = (params.data as any);

  const conditions: any[] = [{ status: 'Publié' }];

  if (category && category !== "all" && category.trim() !== "") {
    const catClean = category.trim();
    conditions.push({
      $or: [
        { category: new RegExp(`^${catClean}$`, "i") },
        { category: new RegExp(catClean.replace(/-/g, " "), "i") },
        { subCategory: new RegExp(catClean, "i") },
        { tags: { $in: [new RegExp(catClean, "i")] } }
      ]
    });
  }

  if (brand && brand.trim() !== "") {
    conditions.push({ brand: new RegExp(brand.trim(), "i") });
  }

  if (search && search.trim() !== "") {
    const s = search.trim();
    conditions.push({
      $or: [
        { name: new RegExp(s, "i") },
        { description: new RegExp(s, "i") },
        { category: new RegExp(s, "i") },
        { tags: { $in: [new RegExp(s, "i")] } }
      ]
    });
  }

  if (minPrice != null && !isNaN(Number(minPrice)) && Number(minPrice) > 0) {
    conditions.push({ price: { $gte: Number(minPrice) } });
  }

  if (maxPrice != null && !isNaN(Number(maxPrice)) && Number(maxPrice) < 100000) {
    conditions.push({ price: { $lte: Number(maxPrice) } });
  }

  if (minRating != null && !isNaN(Number(minRating)) && Number(minRating) > 0) {
    conditions.push({ rating: { $gte: Number(minRating) } });
  }

  if (inStock === true || inStock === "true") {
    conditions.push({ stock: { $gt: 0 } });
  }

  if (featured === true || featured === "true") {
    conditions.push({ featured: true });
  }

  if (bestSeller === true || bestSeller === "true") {
    conditions.push({ bestSeller: true });
  }

  if (onSale === true || onSale === "true") {
    conditions.push({
      $or: [
        { discountPrice: { $gt: 0, $ne: null } },
        { flashSale: true }
      ]
    });
  }

  const filter = conditions.length === 1 ? conditions[0] : { $and: conditions };

  // Support both underscore and colon syntax for sorting
  let sort: any = { createdAt: -1 };
  if (sortBy === "price_asc" || sortBy === "price:asc") {
    sort = { price: 1 };
  } else if (sortBy === "price_desc" || sortBy === "price:desc") {
    sort = { price: -1 };
  } else if (sortBy === "rating" || sortBy === "rating_desc" || sortBy === "rating:desc") {
    sort = { rating: -1 };
  } else if (sortBy === "sales" || sortBy === "sales_desc" || sortBy === "sales:desc" || sortBy === "bestSeller") {
    sort = { salesCount: -1 };
  } else if (sortBy === "newest" || sortBy === "createdAt_desc" || sortBy === "createdAt:desc") {
    sort = { createdAt: -1 };
  }

  const skip = (Math.max(1, Number(page)) - 1) * Math.max(1, Number(limit));
  const [products, total] = await Promise.all([
    Product.find(filter).sort(sort).skip(skip).limit(Number(limit)),
    Product.countDocuments(filter),
  ]);

  res.json({ products: products.map(formatProduct), total, page: Number(page), limit: Number(limit) });
});

router.post("/products", async (req, res): Promise<void> => {
  const parsed = CreateProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const slug = parsed.data.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") + "-" + Date.now();
  const newProduct = new Product({ ...parsed.data, slug });
  await newProduct.save();
  res.status(201).json(formatProduct(newProduct));
});

router.get("/products/featured", async (_req, res): Promise<void> => {
  const products = await Product.find({ featured: true, status: 'Publié' }).sort({ createdAt: -1 }).limit(8);
  res.json(products.map(formatProduct));
});

router.get("/products/new-arrivals", async (_req, res): Promise<void> => {
  const products = await Product.find({ newArrival: true, status: 'Publié' }).sort({ createdAt: -1 }).limit(8);
  res.json(products.map(formatProduct));
});

router.get("/products/best-sellers", async (_req, res): Promise<void> => {
  const products = await Product.find({ bestSeller: true, status: 'Publié' }).sort({ salesCount: -1 }).limit(8);
  res.json(products.map(formatProduct));
});

router.get("/products/on-sale", async (_req, res): Promise<void> => {
  const products = await Product.find({ flashSale: true, status: 'Publié' }).sort({ flashSaleEndDate: 1, createdAt: -1 }).limit(8);
  res.json(products.map(formatProduct));
});

import mongoose from "mongoose";

router.get("/products/:id", async (req, res): Promise<void> => {
  const params = GetProductParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  let product = null;
  if (mongoose.isValidObjectId(params.data.id)) {
    product = await Product.findById(params.data.id);
  } else {
    product = await Product.findOne({ $or: [{ slug: params.data.id }, { name: params.data.id }] });
  }
  if (!product || product.status !== 'Publié') {
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
  let updated = null;
  if (mongoose.isValidObjectId(params.data.id)) {
    updated = await Product.findByIdAndUpdate(params.data.id, parsed.data, { new: true });
  } else {
    updated = await Product.findOneAndUpdate({ slug: params.data.id }, parsed.data, { new: true });
  }
  if (!updated) {
    res.status(404).json({ error: "Product not found" });
    return;
  }
  res.json(formatProduct(updated));
});

router.delete("/products/:id", async (req, res): Promise<void> => {
  const params = DeleteProductParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  let deleted = null;
  if (mongoose.isValidObjectId(params.data.id)) {
    deleted = await Product.findByIdAndDelete(params.data.id);
  } else {
    deleted = await Product.findOneAndDelete({ slug: params.data.id });
  }
  if (!deleted) {
    res.status(404).json({ error: "Product not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
