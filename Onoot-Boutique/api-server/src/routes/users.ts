import { Router, type IRouter } from "express";
import { User } from "../models/User";
import { Order } from "../models/Order";
import { GetUserParams, UpdateUserBody, UpdateUserParams, ListAdminUsersQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

function formatUser(user: any, orderCount = 0) {
  const lastActiveDate = user.lastActive || user.lastLogin;
  const isOnline = lastActiveDate ? (Date.now() - new Date(lastActiveDate).getTime() < 15 * 60 * 1000) : false;

  return {
    id: user._id,
    _id: user._id,
    email: user.email,
    name: user.name || `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    phone: user.phone ?? null,
    avatar: user.avatar ?? null,
    address: user.address ?? null,
    city: user.city ?? null,
    country: user.country ?? null,
    status: user.status ?? 'actif',
    joinDate: user.joinDate?.toISOString() || user.createdAt?.toISOString(),
    createdAt: user.createdAt?.toISOString() || user.joinDate?.toISOString(),
    lastLogin: user.lastLogin ? user.lastLogin.toISOString() : null,
    lastActive: user.lastActive ? user.lastActive.toISOString() : null,
    isOnline,
    orderCount,
  };
}

router.get("/users/:id", async (req, res): Promise<void> => {
  const params = GetUserParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const user = await User.findById(params.data.id);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  const orderCount = await Order.countDocuments({ userId: user._id.toString() });
  res.json(formatUser(user, orderCount));
});

router.patch("/users/:id", async (req, res): Promise<void> => {
  const params = UpdateUserParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const updated = await User.findByIdAndUpdate(params.data.id, parsed.data, { new: true });
  if (!updated) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json(formatUser(updated, 0));
});

router.get("/admin/users", async (req, res): Promise<void> => {
  const params = ListAdminUsersQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const { page = 1, limit = 20 } = params.data;
  const offset = (page - 1) * limit;
  const users = await User.find().sort({ createdAt: -1 }).skip(offset).limit(limit);
  const total = await User.countDocuments();
  const result = await Promise.all(
    users.map(async (user) => {
      const orderCount = await Order.countDocuments({ userId: user._id.toString() });
      return formatUser(user, orderCount);
    })
  );
  res.json({ users: result, total, page, limit });
});

export default router;
