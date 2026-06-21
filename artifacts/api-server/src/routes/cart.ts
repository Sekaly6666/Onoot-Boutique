import { Router, type IRouter } from "express";
import { db, cartsTable, productsTable } from "@workspace/db";
import {
  GetCartQueryParams,
  AddCartItemBody,
  UpdateCartItemBody,
  UpdateCartItemParams,
  RemoveCartItemBody,
  RemoveCartItemParams,
} from "@workspace/api-zod";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

type CartItem = {
  productId: number;
  quantity: number;
  price: number;
  color?: string;
};

async function buildCartResponse(sessionId: string, items: CartItem[]) {
  const productIds = items.map(i => i.productId);
  const products = productIds.length > 0
    ? await db.select().from(productsTable).where(
        productIds.length === 1
          ? eq(productsTable.id, productIds[0])
          : db.$dynamic().where(undefined) as never
      )
    : [];

  const allProducts = productIds.length > 0
    ? await Promise.all(productIds.map(id => db.select().from(productsTable).where(eq(productsTable.id, id)).then(r => r[0])))
    : [];

  const enriched = items.map(item => {
    const product = allProducts.find(p => p && p.id === item.productId);
    if (!product) return null;
    return {
      productId: item.productId,
      quantity: item.quantity,
      price: item.price,
      product: {
        id: product.id,
        name: product.name,
        slug: product.slug,
        description: product.description ?? null,
        price: parseFloat(product.price),
        discountPrice: product.discountPrice ? parseFloat(product.discountPrice) : null,
        category: product.category,
        subCategory: product.subCategory ?? null,
        brand: product.brand ?? null,
        stock: product.stock,
        images: product.images ?? [],
        colors: product.colors ?? [],
        tags: product.tags ?? [],
        featured: product.featured,
        bestSeller: product.bestSeller,
        rating: parseFloat(product.rating),
        reviewCount: product.reviewCount,
        salesCount: product.salesCount,
        createdAt: product.createdAt.toISOString(),
      },
    };
  }).filter(Boolean);

  const totalAmount = enriched.reduce((sum, item) => sum + (item!.price * item!.quantity), 0);
  const totalItems = enriched.reduce((sum, item) => sum + item!.quantity, 0);

  return { sessionId, items: enriched, totalAmount, totalItems };
}

router.get("/cart", async (req, res): Promise<void> => {
  const params = GetCartQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const { sessionId } = params.data;
  const [cart] = await db.select().from(cartsTable).where(eq(cartsTable.sessionId, sessionId));

  if (!cart) {
    res.json(await buildCartResponse(sessionId, []));
    return;
  }

  res.json(await buildCartResponse(sessionId, cart.items as CartItem[]));
});

router.post("/cart/items", async (req, res): Promise<void> => {
  const parsed = AddCartItemBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { sessionId, productId, quantity } = parsed.data;

  const [product] = await db.select().from(productsTable).where(eq(productsTable.id, productId));
  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  const price = product.discountPrice ? parseFloat(product.discountPrice) : parseFloat(product.price);

  const [existingCart] = await db.select().from(cartsTable).where(eq(cartsTable.sessionId, sessionId));

  let items: CartItem[] = existingCart ? (existingCart.items as CartItem[]) : [];
  const existingIdx = items.findIndex(i => i.productId === productId);

  if (existingIdx >= 0) {
    items[existingIdx].quantity += quantity;
  } else {
    items.push({ productId, quantity, price });
  }

  if (existingCart) {
    await db.update(cartsTable).set({ items }).where(eq(cartsTable.sessionId, sessionId));
  } else {
    await db.insert(cartsTable).values({ sessionId, items });
  }

  res.json(await buildCartResponse(sessionId, items));
});

router.patch("/cart/items/:productId", async (req, res): Promise<void> => {
  const params = UpdateCartItemParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateCartItemBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { sessionId, quantity } = parsed.data;
  const productId = params.data.productId;

  const [existingCart] = await db.select().from(cartsTable).where(eq(cartsTable.sessionId, sessionId));
  if (!existingCart) {
    res.status(404).json({ error: "Cart not found" });
    return;
  }

  let items: CartItem[] = existingCart.items as CartItem[];
  const idx = items.findIndex(i => i.productId === productId);
  if (idx < 0) {
    res.status(404).json({ error: "Item not in cart" });
    return;
  }

  if (quantity <= 0) {
    items = items.filter(i => i.productId !== productId);
  } else {
    items[idx].quantity = quantity;
  }

  await db.update(cartsTable).set({ items }).where(eq(cartsTable.sessionId, sessionId));
  res.json(await buildCartResponse(sessionId, items));
});

router.delete("/cart/items/:productId", async (req, res): Promise<void> => {
  const params = RemoveCartItemParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = RemoveCartItemBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { sessionId } = parsed.data;
  const productId = params.data.productId;

  const [existingCart] = await db.select().from(cartsTable).where(eq(cartsTable.sessionId, sessionId));
  if (!existingCart) {
    res.json(await buildCartResponse(sessionId, []));
    return;
  }

  const items: CartItem[] = (existingCart.items as CartItem[]).filter(i => i.productId !== productId);
  await db.update(cartsTable).set({ items }).where(eq(cartsTable.sessionId, sessionId));
  res.json(await buildCartResponse(sessionId, items));
});

export default router;
