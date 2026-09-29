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
  const { category, brand, search, minPrice, maxPrice, minRating, inStock, featured, bestSeller, onSale, page = 1, limit = 20, sortBy, status } = (params.data as any);

  const filter: any = {};
  if (category) filter.category = category;
  if (brand) filter.brand = brand;
  if (search) filter.$or = [{ name: new RegExp(search, "i") }, { description: new RegExp(search, "i") }];
  if (minPrice != null) filter.price = { ...(filter.price || {}), $gte: Number(minPrice) };
  if (maxPrice != null) filter.price = { ...(filter.price || {}), $lte: Number(maxPrice) };
  if (minRating != null) filter.rating = { ...(filter.rating || {}), $gte: Number(minRating) };
  if (inStock) filter.stock = { $gt: 0 };
  if (featured) filter.featured = true;
  if (bestSeller) filter.bestSeller = true;
  if (onSale) filter.discountPrice = { $lt: "$price" };
  
  // Ensure we only show published products on the public storefront
  filter.status = 'Publié';

  let sort: any = { createdAt: -1 };
  if (sortBy === "price_asc") sort = { price: 1 };
  else if (sortBy === "price_desc") sort = { price: -1 };
  else if (sortBy === "rating") sort = { rating: -1 };
  else if (sortBy === "sales") sort = { salesCount: -1 };

  const skip = (page - 1) * limit;
  const [products, total] = await Promise.all([
    Product.find(filter).sort(sort).skip(skip).limit(limit),
    Product.countDocuments(filter),
  ]);

  res.json({ products: products.map(formatProduct), total, page, limit });
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
