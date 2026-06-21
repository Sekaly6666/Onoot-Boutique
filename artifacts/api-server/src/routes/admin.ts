import { Router, type IRouter } from "express";
import { db, ordersTable, productsTable, usersTable } from "@workspace/db";
import { GetTopProductsQueryParams } from "@workspace/api-zod";
import { sql, desc, gte } from "drizzle-orm";

const router: IRouter = Router();

router.get("/admin/stats", async (_req, res): Promise<void> => {
  const [{ totalRevenue }] = await db.select({ totalRevenue: sql<number>`coalesce(sum(total_amount::numeric), 0)::float` }).from(ordersTable);
  const [{ totalOrders }] = await db.select({ totalOrders: sql<number>`count(*)::int` }).from(ordersTable);
  const [{ totalProducts }] = await db.select({ totalProducts: sql<number>`count(*)::int` }).from(productsTable);
  const [{ totalUsers }] = await db.select({ totalUsers: sql<number>`count(*)::int` }).from(usersTable);

  const recentOrders = await db.select().from(ordersTable).orderBy(desc(ordersTable.createdAt)).limit(5);

  const ordersByStatusRaw = await db
    .select({ status: ordersTable.orderStatus, count: sql<number>`count(*)::int` })
    .from(ordersTable)
    .groupBy(ordersTable.orderStatus);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const [{ newUsersThisMonth }] = await db.select({ newUsersThisMonth: sql<number>`count(*)::int` })
    .from(usersTable)
    .where(gte(usersTable.createdAt, thirtyDaysAgo));

  const revenueByMonth = await db
    .select({
      month: sql<string>`to_char(created_at, 'YYYY-MM')`,
      revenue: sql<number>`coalesce(sum(total_amount::numeric), 0)::float`,
    })
    .from(ordersTable)
    .groupBy(sql`to_char(created_at, 'YYYY-MM')`)
    .orderBy(sql`to_char(created_at, 'YYYY-MM')`);

  res.json({
    totalRevenue: totalRevenue ?? 0,
    totalOrders: totalOrders ?? 0,
    totalProducts: totalProducts ?? 0,
    totalUsers: totalUsers ?? 0,
    recentOrders: recentOrders.map(o => ({
      id: o.id,
      userId: o.userId ?? 0,
      items: o.items,
      totalAmount: parseFloat(o.totalAmount),
      paymentMethod: o.paymentMethod,
      orderStatus: o.orderStatus,
      shippingAddress: o.shippingAddress,
      notes: o.notes ?? null,
      createdAt: o.createdAt.toISOString(),
      updatedAt: o.updatedAt.toISOString(),
    })),
    ordersByStatus: ordersByStatusRaw,
    revenueByMonth,
    newUsersThisMonth: newUsersThisMonth ?? 0,
  });
});

router.get("/admin/top-products", async (req, res): Promise<void> => {
  const params = GetTopProductsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const limit = params.data.limit ?? 10;
  const products = await db.select().from(productsTable).orderBy(desc(productsTable.salesCount)).limit(limit);

  res.json(products.map(p => ({
    product: {
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
    },
    salesCount: p.salesCount,
    revenue: parseFloat(p.price) * p.salesCount,
  })));
});

export default router;
