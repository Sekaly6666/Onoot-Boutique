import { Router, type IRouter } from "express";
import { Cart } from "../models/Cart";
import { Product } from "../models/Product";
import {
  GetCartQueryParams,
  AddCartItemBody,
  UpdateCartItemBody,
  UpdateCartItemParams,
  RemoveCartItemBody,
  RemoveCartItemParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

async function buildCartResponse(sessionId: string, items: any[]) {
  const productIds = items.map((i) => i.productId);
  const dbProductIds = productIds.filter(id => !id.startsWith("example-"));
  const products =
    dbProductIds.length > 0
      ? await Product.find({ _id: { $in: dbProductIds } })
      : [];

  const enriched = items
    .map((item) => {
      let product;
      if (item.productId.startsWith("example-")) {
        product = {
          _id: item.productId,
          name: `Produit Test (${item.productId})`,
          price: item.price,
          category: "test",
          images: ["/images/smartwatch.png"],
          stock: 50,
          createdAt: new Date()
        };
      } else {
        product = products.find(
          (p) => p._id.toString() === item.productId.toString()
        );
      }
      if (!product) return null;
      return {
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
        color: item.color ?? null,
        product: {
          id: product._id,
          name: product.name,
          description: product.description ?? null,
          price: product.price,
          discountPrice: (product as any).discountPrice ?? null,
          category: product.category,
          images: (product as any).images ?? [],
          stock: product.stock,
          slug: (product as any).slug ?? null,
          createdAt: product.createdAt ? new Date(product.createdAt).toISOString() : new Date().toISOString(),
        },
      };
    })
    .filter(Boolean) as any[];

  const totalAmount = enriched.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const totalItems = enriched.reduce((sum, item) => sum + item.quantity, 0);

  return { sessionId, items: enriched, totalAmount, totalItems };
}

router.get("/cart", async (req, res): Promise<void> => {
  try {
    const params = GetCartQueryParams.safeParse(req.query);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const { sessionId } = params.data;
    const cart = await Cart.findOne({ sessionId });
    if (!cart) {
      res.json(await buildCartResponse(sessionId, []));
      return;
    }
    res.json(await buildCartResponse(sessionId, cart.items as any[]));
    return;
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/cart/items", async (req, res): Promise<void> => {
  try {
    const parsed = AddCartItemBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    const { sessionId, productId, quantity } = parsed.data;

    let product: any = null;
    let isExample = false;

    if (productId.startsWith("example-")) {
      isExample = true;
      // Mock example product for testing purposes
      product = {
        _id: productId,
        name: `Produit Test (${productId})`,
        price: 25000,
        discountPrice: 20000,
        category: "test",
        images: ["/images/smartwatch.png"],
        stock: 50,
        createdAt: new Date()
      };
    } else {
      // Validate ObjectId to prevent CastError
      const mongoose = require('mongoose');
      if (!mongoose.Types.ObjectId.isValid(productId)) {
        res.status(400).json({ error: "Invalid product ID format." });
        return;
      }
      product = await Product.findById(productId);
    }

    if (!product) {
      res.status(404).json({ error: "Product not found" });
      return;
    }

    const price = (product as any).discountPrice
      ? Number((product as any).discountPrice)
      : product.price;

    let cart = await Cart.findOne({ sessionId });
    if (!cart) {
      cart = new Cart({ sessionId, items: [] });
    }

    const items = cart.items as any[];
    const existingIdx = items.findIndex(
      (i) => i.productId.toString() === productId.toString()
    );
    if (existingIdx >= 0) {
      items[existingIdx].quantity += quantity;
    } else {
      items.push({ productId, quantity, price });
    }
    cart.items = items;
    await cart.save();

    res.json(await buildCartResponse(sessionId, items));
    return;
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/cart/items/:productId", async (req, res): Promise<void> => {
  try {
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

    const cart = await Cart.findOne({ sessionId });
    if (!cart) {
      res.status(404).json({ error: "Cart not found" });
      return;
    }
    const items = cart.items as any[];
    const idx = items.findIndex(
      (i) => i.productId.toString() === productId.toString()
    );
    if (idx < 0) {
      res.status(404).json({ error: "Item not in cart" });
      return;
    }
    if (quantity <= 0) {
      cart.items = items.filter(
        (i) => i.productId.toString() !== productId.toString()
      );
    } else {
      items[idx].quantity = quantity;
      cart.items = items;
    }
    await cart.save();
    res.json(await buildCartResponse(sessionId, cart.items as any[]));
    return;
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/cart/items/:productId", async (req, res): Promise<void> => {
  try {
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

    const cart = await Cart.findOne({ sessionId });
    if (!cart) {
      res.json(await buildCartResponse(sessionId, []));
      return;
    }
    cart.items = (cart.items as any[]).filter(
      (i) => i.productId.toString() !== productId.toString()
    );
    await cart.save();
    res.json(await buildCartResponse(sessionId, cart.items as any[]));
    return;
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
