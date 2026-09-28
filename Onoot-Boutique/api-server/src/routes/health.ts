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

router.get(["/debug/google", "/api/debug/google"], (_req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID || "";
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || "";
  const apiBase =
    process.env.API_BASE_URL ||
    (process.env.NODE_ENV === "production" || process.env.RENDER
      ? "https://onoot-boutique.onrender.com"
      : `http://localhost:${process.env.PORT || 5005}`);
  const redirectUri = `${apiBase.replace(/\/$/, "")}/api/auth/google/callback`;
  const boutiqueUrl =
    process.env.BOUTIQUE_URL ||
    (process.env.NODE_ENV === "production"
      ? "https://onoot-boutique.vercel.app"
      : "http://localhost:5182");

  res.json({
    googleClientIdConfigured: Boolean(clientId),
    googleClientIdPrefix: clientId ? clientId.substring(0, 15) + "..." : null,
    googleClientSecretConfigured: Boolean(clientSecret),
    googleClientSecretPrefix: clientSecret ? clientSecret.substring(0, 8) + "..." : null,
    apiBase,
    redirectUri,
    boutiqueUrl,
    requiredGoogleConsoleRedirectUri: redirectUri,
    tip: "Vérifiez que cette URL exacte est ajoutée dans Google Cloud Console > Identifiants OAuth > URI de redirection autorisés.",
  });
});

export default router;
