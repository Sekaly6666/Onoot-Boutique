import { Router, type IRouter } from "express";
import { Category } from "../models/Category";
import { Product } from "../models/Product";
import { CreateCategoryBody } from "@workspace/api-zod";
import { seedDefaultCategoriesIfEmpty } from "./adminCategories";

const router: IRouter = Router();

router.get("/categories", async (_req, res): Promise<void> => {
  let cats = await Category.find().sort({ name: 1 });
  if (cats.length === 0) {
    await seedDefaultCategoriesIfEmpty();
    cats = await Category.find().sort({ name: 1 });
  }

  const result = await Promise.all(
    cats.map(async (cat) => {
      const productCount = await Product.countDocuments({ category: cat.slug });
      return {
        id: cat._id,
        name: cat.name,
        slug: cat.slug,
        description: cat.description ?? null,
        image: cat.image ?? null,
        productCount,
      };
    })
  );

  res.json(result);
});

router.post("/categories", async (req, res): Promise<void> => {
  const parsed = CreateCategoryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const cat = new Category(parsed.data);
  await cat.save();

  res.status(201).json({
    id: cat._id,
    name: cat.name,
    slug: cat.slug,
    description: cat.description ?? null,
    image: cat.image ?? null,
    productCount: 0,
  });
});

export default router;
