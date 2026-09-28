import dotenv from 'dotenv';
dotenv.config();

import app from "./app";
import { logger } from "./lib/logger";
import { connectDB } from "./lib/mongoose";
import bcrypt from 'bcryptjs';
import { Admin } from './models/Admin';

await connectDB();

async function ensureAdminExists() {
  const count = await Admin.countDocuments();
  if (count === 0) {
    const email = process.env.VITE_ADMIN_EMAIL || 'adminonoot@boutique.com';
    const plainPwd = process.env.VITE_ADMIN_PASSWORD || 'onootboutique1234';
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(plainPwd, salt);
    await new Admin({ email, passwordHash }).save();
    console.log('✅ Default admin created');
  }
}
await ensureAdminExists();

const rawPort = process.env["PORT"] || "5001";

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
});

