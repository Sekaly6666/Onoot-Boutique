import dotenv from 'dotenv';
dotenv.config();

import app from "./app";
import { logger } from "./lib/logger";
import { connectDB } from "./lib/mongoose";
import bcrypt from 'bcryptjs';
import { Admin } from './models/Admin';

async function ensureAdminExists() {
  try {
    const count = await Admin.countDocuments();
    if (count === 0) {
      const email = process.env.VITE_ADMIN_EMAIL || process.env.ADMIN_EMAIL || 'adminonoot@boutique.com';
      const plainPwd = process.env.VITE_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || 'onootboutique1234';
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(plainPwd, salt);
      await new Admin({ email, passwordHash }).save();
      logger.info('✅ Default admin created');
    }
  } catch (err) {
    logger.error({ err }, 'Failed to verify or seed admin account');
  }
}

const rawPort = process.env["PORT"] || "5005";

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, "0.0.0.0", async () => {
  logger.info({ port, host: "0.0.0.0" }, "Server listening on 0.0.0.0");
  try {
    await connectDB();
    await ensureAdminExists();
  } catch (err) {
    logger.error({ err }, "Background DB initialization error");
  }
});

