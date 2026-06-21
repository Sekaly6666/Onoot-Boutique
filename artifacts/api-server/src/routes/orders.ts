import { Router, type IRouter } from "express";
import { db, ordersTable, productsTable } from "@workspace/db";
import {
  ListOrdersQueryParams,
  CreateOrderBody,
  GetOrderParams,
  UpdateOrderStatusParams,
  UpdateOrderStatusBody,
} from "@workspace/api-zod";
import { eq, and, desc, sql } from "drizzle-orm";

const router: IRouter = Router();

type OrderItem = {
  productId: number;
  quantity: number;
  price: number;
  productName: string;
  productImage: string | null;
};

type ShippingAddress = {
  fullName: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  postalCode?: string | null;
};

function formatOrder(order: typeof ordersTable.$inferSelect) {
  return {
    id: order.id,
    userId: order.userId ?? 0,
    items: order.items as OrderItem[],
    totalAmount: parseFloat(order.totalAmount),
    paymentMethod: order.paymentMethod,
    orderStatus: order.orderStatus,
    shippingAddress: order.shippingAddress as ShippingAddress,
    notes: order.notes ?? null,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  };
}

router.get("/orders", async (req, res): Promise<void> => {
  const params = ListOrdersQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const { userId, status, page = 1, limit = 20 } = params.data;
  const offset = (page - 1) * limit;

  const conditions = [];
  if (userId) conditions.push(eq(ordersTable.userId, userId));
  if (status) conditions.push(eq(ordersTable.orderStatus, status));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  const orders = await db.select().from(ordersTable).where(whereClause).orderBy(desc(ordersTable.createdAt)).limit(limit).offset(offset);
  const [{ total }] = await db.select({ total: sql<number>`count(*)::int` }).from(ordersTable).where(whereClause);

  res.json({ orders: orders.map(formatOrder), total, page, limit });
});

router.post("/orders", async (req, res): Promise<void> => {
  const parsed = CreateOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const totalAmount = parsed.data.totalAmount ?? parsed.data.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const [order] = await db.insert(ordersTable).values({
    userId: parsed.data.userId ?? null,
    sessionId: parsed.data.sessionId ?? null,
    items: parsed.data.items as unknown as typeof ordersTable.$inferInsert["items"],
    totalAmount: String(totalAmount),
    paymentMethod: parsed.data.paymentMethod,
    orderStatus: "pending",
    shippingAddress: parsed.data.shippingAddress as unknown as typeof ordersTable.$inferInsert["shippingAddress"],
    notes: parsed.data.notes ?? null,
  }).returning();

  for (const item of parsed.data.items) {
    await db.update(productsTable)
      .set({ salesCount: sql`${productsTable.salesCount} + ${item.quantity}`, stock: sql`${productsTable.stock} - ${item.quantity}` })
      .where(eq(productsTable.id, item.productId));
  }

  res.status(201).json(formatOrder(order));
});

router.get("/orders/:id", async (req, res): Promise<void> => {
  const params = GetOrderParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, params.data.id));
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  res.json(formatOrder(order));
});

router.patch("/orders/:id", async (req, res): Promise<void> => {
  const params = UpdateOrderStatusParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateOrderStatusBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [order] = await db.update(ordersTable).set({ orderStatus: parsed.data.orderStatus }).where(eq(ordersTable.id, params.data.id)).returning();
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  res.json(formatOrder(order));
});

export default router;
