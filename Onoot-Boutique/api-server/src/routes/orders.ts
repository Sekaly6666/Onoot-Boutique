import { Router, type IRouter } from "express";
import mongoose from "mongoose";
import { Order } from "../models/Order";
import { Product } from "../models/Product";
import { User } from "../models/User";
import { AdminNotification } from "../models/AdminNotification";
import {
  sendOrderConfirmation,
  sendOrderStatusUpdate,
  sendShippingCostUpdatedNotification,
  sendShopNewOrderNotification,
  sendShopOrderCancelledNotification,
  SHOP_EMAIL,
} from "../lib/email";
import {
  ListOrdersQueryParams,
  CreateOrderBody,
  GetOrderParams,
  UpdateOrderStatusParams,
  UpdateOrderStatusBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

export function getShippingFeeForCity(cityStr?: string): number {
  if (!cityStr) return 1500;
  const lower = cityStr.toLowerCase();
  if (lower.includes("bassam")) return 3000;
  if (lower.includes("cocody")) return 1000;
  if (lower.includes("bingerville") && (lower.includes("eloign") || lower.includes("intérieur") || lower.includes("interieur"))) return 2000;
  if (lower.includes("bingerville")) return 1500;
  if (lower.includes("anyama") || lower.includes("gonzague") || lower.includes("songon")) return 2000;
  if (lower.includes("intérieur") || lower.includes("interieur") || lower.includes("gare") || lower.includes("expedition") || lower.includes("expédition")) return 2500;
  if (
    lower.includes("koumassi") ||
    lower.includes("marcory") ||
    lower.includes("treichville") ||
    lower.includes("yopougon") ||
    lower.includes("abobo") ||
    lower.includes("port-bouet") ||
    lower.includes("port bouet") ||
    lower.includes("plateau") ||
    lower.includes("adjame") ||
    lower.includes("adjamé") ||
    lower.includes("attecoube") ||
    lower.includes("attécoubé")
  ) {
    return 1500;
  }
  return 1500;
}

function formatOrder(order: any) {
  const shippingCost = typeof order.shippingCost === "number" ? order.shippingCost : (order.shippingCost ?? 0);
  const itemsTotal = typeof order.itemsTotal === "number" && order.itemsTotal > 0 ? order.itemsTotal : (order.totalAmount - shippingCost);

  return {
    id: order._id,
    userId: order.userId ?? null,
    customerEmail: order.customerEmail ?? null,
    items: order.items,
    totalAmount: order.totalAmount,
    shippingCost,
    itemsTotal,
    paymentMethod: order.paymentMethod,
    orderStatus: order.orderStatus,
    cancelReason: order.cancelReason ?? null,
    estimatedDeliveryDate: order.estimatedDeliveryDate ?? null,
    shippingAddress: order.shippingAddress,
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
  const skip = (page - 1) * limit;

  const filter: any = {};
  if (userId) filter.userId = userId;
  if (status) filter.orderStatus = status;

  const [orders, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Order.countDocuments(filter),
  ]);

  res.json({ orders: orders.map(formatOrder), total, page, limit });
});

router.post("/orders", async (req, res): Promise<void> => {
  const parsed = CreateOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const shipping = parsed.data.shippingAddress;
  if (
    !shipping?.fullName?.trim() ||
    !shipping?.phone?.trim() ||
    !shipping?.address?.trim() ||
    !shipping?.city?.trim() ||
    !shipping?.country?.trim()
  ) {
    res.status(400).json({ error: "Tous les champs de l'adresse de livraison sont obligatoires." });
    return;
  }

  // ─── Anti-Fraud / Anti-Arnaque: Recalculate price and verify stock server-side ───
  const verifiedItems: any[] = [];
  let calculatedTotal = 0;

  for (const item of parsed.data.items) {
    if (!item.quantity || item.quantity <= 0) {
      res.status(400).json({ error: "Quantité invalide pour un des articles de la commande." });
      return;
    }

    let unitPrice = item.price;
    let productName = item.name;

    if (mongoose.Types.ObjectId.isValid(item.productId)) {
      const dbProduct = await Product.findById(item.productId).exec();
      if (!dbProduct) {
        res.status(400).json({ error: `Le produit "${item.name || item.productId}" n'est plus disponible.` });
        return;
      }

      // Check stock
      if (typeof dbProduct.stock === "number" && dbProduct.stock < item.quantity) {
        res.status(400).json({
          error: `Stock insuffisant pour "${dbProduct.name}". Quantité en stock : ${dbProduct.stock}`,
        });
        return;
      }

      // Recalculate official price (with discount if applicable)
      if (
        typeof dbProduct.discountPrice === "number" &&
        dbProduct.discountPrice > 0 &&
        dbProduct.discountPrice < dbProduct.price
      ) {
        unitPrice = dbProduct.discountPrice;
      } else {
        unitPrice = dbProduct.price;
      }
      productName = dbProduct.name;
    } else {
      // Demo / example product validation
      if (unitPrice <= 0) {
        res.status(400).json({ error: "Prix d'article invalide." });
        return;
      }
    }

    calculatedTotal += unitPrice * item.quantity;
    verifiedItems.push({
      ...item,
      name: productName,
      price: unitPrice,
    });
  }

  const itemsTotal = calculatedTotal;

  // Single fixed shipping fee per order, determined from commune/city
  const rawShippingCost = (req.body as any).shippingCost;
  const shippingCost = typeof rawShippingCost === "number" && rawShippingCost >= 0
    ? rawShippingCost
    : getShippingFeeForCity(shipping.city);

  const totalAmount = itemsTotal + shippingCost;

  // Determine customer email
  let customerEmail = (req.body as any).customerEmail || null;
  if (!customerEmail && parsed.data.userId) {
    const user = await User.findById(parsed.data.userId).exec();
    if (user?.email) customerEmail = user.email;
  }

  const order = new Order({
    userId: parsed.data.userId ?? null,
    sessionId: parsed.data.sessionId ?? null,
    customerEmail,
    items: verifiedItems,
    itemsTotal,
    shippingCost,
    totalAmount,
    paymentMethod: parsed.data.paymentMethod,
    orderStatus: "pending",
    shippingAddress: parsed.data.shippingAddress,
    notes: parsed.data.notes ?? null,
  });
  await order.save();

  // Create admin notification
  try {
    const notif = new AdminNotification({
      type: "order",
      title: "Nouvelle commande reçue",
      desc: `#${order._id.toString().slice(-6)} — ${parsed.data.shippingAddress.fullName} — Colis: ${itemsTotal.toLocaleString('fr-FR')} FCFA + Livr: ${shippingCost.toLocaleString('fr-FR')} FCFA = Total: ${totalAmount.toLocaleString('fr-FR')} FCFA`,
    });
    await notif.save();
  } catch (err) {
    console.error("Failed to create admin notification for order", err);
  }

  // Send Order Confirmation Email to customer (if email provided)
  if (customerEmail) {
    sendOrderConfirmation(order, customerEmail).catch((err) =>
      console.error("Failed to send order confirmation email:", err)
    );
  }

  // Always send new order notification email to the shop pro email (onootboutique@gmail.com)
  sendShopNewOrderNotification(order, SHOP_EMAIL).catch((err) =>
    console.error("Failed to send shop new order notification email:", err)
  );

  // Update product stock and salesCount
  for (const item of verifiedItems) {
    if (typeof item.productId === 'string' && item.productId.startsWith('example-')) continue;
    if (!mongoose.Types.ObjectId.isValid(item.productId)) continue;

    await Product.updateOne({ _id: item.productId }, { $inc: { salesCount: item.quantity, stock: -item.quantity } });
  }

  // Empty the cart
  if (parsed.data.sessionId) {
    const CartModel = require('../models/Cart').Cart;
    await CartModel.updateOne({ sessionId: parsed.data.sessionId }, { $set: { items: [] } });
  }

  res.status(201).json(formatOrder(order));
});

router.get("/orders/:id", async (req, res): Promise<void> => {
  const params = GetOrderParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const order = await Order.findById(params.data.id);
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

  const estimatedDeliveryDate = (req.body as any).estimatedDeliveryDate || undefined;
  const cancelReason = (req.body as any).cancelReason || (req.body as any).reason || undefined;
  const newShippingCost = typeof (req.body as any).shippingCost === "number" ? (req.body as any).shippingCost : undefined;

  const updateData: any = {};
  if (parsed.data.orderStatus) {
    updateData.orderStatus = parsed.data.orderStatus;
  }
  if (estimatedDeliveryDate) {
    updateData.estimatedDeliveryDate = estimatedDeliveryDate;
  }
  if (cancelReason) {
    updateData.cancelReason = cancelReason;
  }
  if (newShippingCost !== undefined && newShippingCost >= 0) {
    updateData.shippingCost = newShippingCost;
    const currentOrder = await Order.findById(params.data.id);
    if (currentOrder) {
      const itemsTotal = typeof currentOrder.itemsTotal === "number" && currentOrder.itemsTotal > 0
        ? currentOrder.itemsTotal
        : (currentOrder.totalAmount - (currentOrder.shippingCost || 0));
      updateData.itemsTotal = itemsTotal;
      updateData.totalAmount = itemsTotal + newShippingCost;
    }
  }

  const order = await Order.findByIdAndUpdate(
    params.data.id,
    updateData,
    { new: true }
  );
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  // Determine customer email to notify
  let targetEmail = order.customerEmail;
  if (!targetEmail && order.userId) {
    const user = await User.findById(order.userId).exec();
    if (user?.email) targetEmail = user.email;
  }

  // 1. Notify customer of status change ONLY if orderStatus was explicitly provided and valid
  if (targetEmail && parsed.data.orderStatus) {
    sendOrderStatusUpdate(order, targetEmail, parsed.data.orderStatus, estimatedDeliveryDate || order.estimatedDeliveryDate).catch((err) =>
      console.error("Failed to send order status update email to customer:", err)
    );
  }

  // 1b. If shipping cost was updated (without status change), notify customer of the confirmed shipping fee
  if (targetEmail && newShippingCost !== undefined && !parsed.data.orderStatus) {
    sendShippingCostUpdatedNotification(order, targetEmail).catch((err) =>
      console.error("Failed to send shipping cost notification email:", err)
    );
  }

  // 2. Notify shop pro email (onootboutique@gmail.com) ONLY when order is CANCELLED (with reason)
  if (parsed.data.orderStatus === 'cancelled') {
    sendShopOrderCancelledNotification(order, cancelReason, SHOP_EMAIL).catch((err) =>
      console.error("Failed to send order cancelled notification email to shop:", err)
    );

    // Create admin notification in dashboard
    try {
      const notif = new AdminNotification({
        type: "order",
        title: "Commande annulée par le client",
        desc: `#${order._id.toString().slice(-6)} — ${order.shippingAddress?.fullName || 'Client'} — Motif : ${cancelReason || 'Non précisé'}`,
      });
      await notif.save();
    } catch (err) {
      console.error("Failed to create admin notification for cancelled order", err);
    }
  }

  res.json(formatOrder(order));
});

router.delete("/orders/:id", async (req, res): Promise<void> => {
  const params = GetOrderParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const order = await Order.findByIdAndDelete(params.data.id);
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  res.json({ success: true });
});

export default router;
