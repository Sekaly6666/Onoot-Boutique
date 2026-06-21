import { Router, type IRouter } from "express";
import { db, usersTable, ordersTable } from "@workspace/db";
import { GetUserParams, UpdateUserBody, UpdateUserParams, ListAdminUsersQueryParams } from "@workspace/api-zod";
import { eq, sql, desc } from "drizzle-orm";

const router: IRouter = Router();

function formatUser(user: typeof usersTable.$inferSelect, orderCount = 0) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    phone: user.phone ?? null,
    avatar: user.avatar ?? null,
    address: user.address ?? null,
    city: user.city ?? null,
    country: user.country ?? null,
    createdAt: user.createdAt.toISOString(),
    orderCount,
  };
}

router.get("/users/:id", async (req, res): Promise<void> => {
  const params = GetUserParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, params.data.id));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(ordersTable).where(eq(ordersTable.userId, user.id));

  res.json(formatUser(user, count ?? 0));
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

  const [user] = await db.update(usersTable).set(parsed.data).where(eq(usersTable.id, params.data.id)).returning();
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json(formatUser(user, 0));
});

router.get("/admin/users", async (req, res): Promise<void> => {
  const params = ListAdminUsersQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const { page = 1, limit = 20 } = params.data;
  const offset = (page - 1) * limit;

  const users = await db.select().from(usersTable).orderBy(desc(usersTable.createdAt)).limit(limit).offset(offset);
  const [{ total }] = await db.select({ total: sql<number>`count(*)::int` }).from(usersTable);

  const result = await Promise.all(
    users.map(async (user) => {
      const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(ordersTable).where(eq(ordersTable.userId, user.id));
      return formatUser(user, count ?? 0);
    })
  );

  res.json({ users: result, total, page, limit });
});

export default router;
