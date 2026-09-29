import { Router, type IRouter } from "express";
import { Order } from "../models/Order";
import { Product } from "../models/Product";
import { User } from "../models/User";
import { DeliveryDriver } from "../models/DeliveryDriver";
import { PromoVideo } from "../models/PromoVideo";
import { Category } from "../models/Category";
import { Review } from "../models/Review";
import { AdminNotification } from "../models/AdminNotification";
import { GetTopProductsQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/admin/stats", async (_req, res): Promise<void> => {
  const totalRevenueAgg = await Order.aggregate([ { $group: { _id: null, totalRevenue: { $sum: "$totalAmount" } } } ]);
  const totalRevenue = (totalRevenueAgg[0] as any)?.totalRevenue ?? 0;

  const [
    totalOrders,
    totalProducts,
    totalUsers,
    totalDrivers,
    totalAds,
    totalCategories,
    totalReviews,
    totalNotifications,
  ] = await Promise.all([
    Order.countDocuments(),
    Product.countDocuments(),
    User.countDocuments(),
    DeliveryDriver.countDocuments().catch(() => 0),
    PromoVideo.countDocuments().catch(() => 0),
    Category.countDocuments().catch(() => 0),
    Review.countDocuments().catch(() => 0),
    AdminNotification.countDocuments().catch(() => 0),
  ]);

  const recentOrders = await Order.find().sort({ createdAt: -1 }).limit(5);

  const ordersByStatusAgg = await Order.aggregate([ { $group: { _id: "$orderStatus", count: { $sum: 1 } } } ]);
  const ordersByStatus = ordersByStatusAgg.map(o => ({ status: o._id, count: o.count }));

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const newUsersThisMonth = await User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });

  const revenueByMonthAgg = await Order.aggregate([
    { $group: { _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } }, revenue: { $sum: "$totalAmount" } } },
    { $sort: { "_id": 1 } }
  ]);
  const revenueByMonth = revenueByMonthAgg.map(r => ({ month: r._id, revenue: r.revenue }));

  res.json({
    totalRevenue,
    totalOrders,
    totalProducts,
    totalUsers,
    totalDrivers,
    totalAds,
    totalCategories,
    totalReviews,
    totalNotifications,
    recentOrders: recentOrders.map(o => ({
      id: o.id,
      userId: o.userId ?? 0,
      items: o.items,
      totalAmount: o.totalAmount,
      paymentMethod: o.paymentMethod,
      orderStatus: o.orderStatus,
      shippingAddress: o.shippingAddress,
      notes: o.notes ?? null,
      createdAt: (o as any).createdAt?.toISOString() ?? new Date().toISOString(),
      updatedAt: (o as any).updatedAt?.toISOString() ?? new Date().toISOString(),
    })),
    ordersByStatus,
    revenueByMonth,
    newUsersThisMonth,
  });
});

router.get("/admin/top-products", async (req, res): Promise<void> => {
  const params = GetTopProductsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const limit = params.data.limit ?? 10;
  const topProducts = await Product.find().sort({ salesCount: -1 }).limit(limit);

  res.json(topProducts.map((p: any) => ({
    product: {
      id: p.id,
      name: p.name,
      slug: p.slug,
      description: p.description ?? null,
      price: p.price,
      discountPrice: p.discountPrice ?? null,
      category: p.category,
      subCategory: p.subCategory ?? null,
      brand: p.brand ?? null,
      stock: p.stock,
      images: (p.images && p.images.length > 0) ? p.images : (p.imageUrl ? [p.imageUrl] : []),
      colors: p.colors ?? [],
      tags: p.tags ?? [],
      featured: p.featured,
      bestSeller: p.bestSeller,
      rating: p.rating,
      reviewCount: p.reviewCount,
      salesCount: p.salesCount,
      createdAt: p.createdAt.toISOString(),
    },
    salesCount: p.salesCount,
    revenue: p.price * p.salesCount,
  })));
});

export default router;
