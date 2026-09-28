import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";

const router: IRouter = Router();

import mongoose from "mongoose";
import { getCleanMongoUri } from "../lib/mongoose";

router.get(["/healthz", "/api/health", "/health"], (_req, res) => {
  const data = HealthCheckResponse.parse({ status: "ok" });
  res.json(data);
});

router.get(["/debug/db", "/api/debug/db"], async (_req, res) => {
  const rawEnv = process.env.MONGODB_URI ? "DEFINED" : "UNDEFINED";
  const cleanUri = getCleanMongoUri();
  const maskedUri = cleanUri.replace(/:([^:@]+)@/, ":****@");
  let connectError = null;
  try {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(cleanUri, { serverSelectionTimeoutMS: 5000 });
    }
  } catch (err: any) {
    connectError = err.message;
  }

  res.json({
    readyState: mongoose.connection.readyState,
    rawEnv,
    maskedUri,
    connectError,
  });
});

export default router;
