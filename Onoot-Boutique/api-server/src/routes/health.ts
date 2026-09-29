import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";

const router: IRouter = Router();

import mongoose from "mongoose";
import { getCleanMongoUri } from "../lib/mongoose";
import { createTransporter, sendMailWithFallback } from "../lib/email";

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

  let apiBase = process.env.API_BASE_URL;
  if (!apiBase || apiBase.includes("localhost")) {
    if (process.env.NODE_ENV === "production" || process.env.RENDER) {
      apiBase = "https://onoot-boutique.onrender.com";
    } else {
      apiBase = `http://localhost:${process.env.PORT || 5005}`;
    }
  }

  let boutiqueUrl = process.env.BOUTIQUE_URL;
  if (!boutiqueUrl || boutiqueUrl.includes("localhost")) {
    if (process.env.NODE_ENV === "production" || process.env.RENDER) {
      boutiqueUrl = "https://onoot-boutique.vercel.app";
    } else {
      boutiqueUrl = "http://localhost:5182";
    }
  }

  const redirectUri = `${apiBase.replace(/\/$/, "")}/api/auth/google/callback`;

  res.json({
    googleClientIdConfigured: Boolean(clientId),
    googleClientIdPrefix: clientId ? clientId.substring(0, 15) + "..." : null,
    googleClientSecretConfigured: Boolean(clientSecret),
    googleClientSecretPrefix: clientSecret ? clientSecret.substring(0, 8) + "..." : null,
    apiBase,
    redirectUri,
    boutiqueUrl,
    requiredGoogleConsoleRedirectUri: redirectUri,
    tip: "Dans Google Cloud Console (console.cloud.google.com > APIs & Services > Credentials > Identifiants OAuth), vérifiez que 'URI de redirection autorisés' contient EXACTEMENT : " + redirectUri,
  });
});

router.get(["/debug/email", "/api/debug/email"], async (_req, res) => {
  const host = process.env.SMTP_HOST || "smtp-relay.brevo.com";
  const user = (process.env.SMTP_USER || "").trim();
  const pass = (process.env.SMTP_PASS || "").trim();
  const from = (process.env.SMTP_FROM || "").trim();

  res.json({
    host,
    userConfigured: Boolean(user),
    userPrefix: user ? user.substring(0, 5) + "..." : null,
    passConfigured: Boolean(pass),
    fromConfigured: Boolean(from),
    fromValue: from || null,
    tip: (!user || !pass)
      ? "ATTENTION: Les variables SMTP_USER et/ou SMTP_PASS ne sont pas renseignées dans les paramètres Render. Veuillez les ajouter dans Render Dashboard > Environment."
      : "SMTP est entièrement configuré sur ce serveur.",
  });
});

router.get(["/debug/test-send", "/api/debug/test-send"], async (req, res) => {
  const to = (req.query.to as string) || "onootboutique@gmail.com";
  try {
    const info = await sendMailWithFallback({
      from: '"Onoot Boutique" <onootboutique@gmail.com>',
      to,
      subject: "Test Diagnostic Direct Render - Onoot Boutique",
      text: "Ceci est un test de diagnostic envoyé directement depuis le serveur Render.",
    });
    res.json({
      success: true,
      messageId: info.messageId,
      response: info.response,
      accepted: info.accepted,
      rejected: info.rejected,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err.message,
      code: err.code,
      command: err.command,
    });
  }
});

export default router;
