import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import router from "./routes";
import uploadRouter from "./routes/upload";
import { logger } from "./lib/logger";
import { connectDB } from "./lib/mongoose";
import mongoose from "mongoose";
import path from "path";
import fs from "fs";

const app: Express = express();

// ─── 1. Cybersecurity: Hide Server Signature & Add Security Headers ───
app.disable("x-powered-by");
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false,
  })
);

// ─── 2. Cybersecurity: Controlled & Restricted CORS ───
const allowedOrigins = [
  "https://onoot-boutique.vercel.app",
  "https://onoot-boutique-admin.vercel.app",
  "https://onoot-boutique.onrender.com",
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (UptimeRobot, server-to-server, curl)
      if (!origin) return callback(null, true);

      // Allow local development ports
      if (origin.startsWith("http://localhost:") || origin.startsWith("http://127.0.0.1:")) {
        return callback(null, true);
      }

      // Allow Vercel preview environments
      if (origin.endsWith(".vercel.app") && origin.includes("onoot-boutique")) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      callback(new Error("Accès bloqué par la politique de sécurité (CORS)"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);

// ─── 3. HTTP Request Logging ───
app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

// ─── 4. Safe Payload Limits & NoSQL Injection Protection ───
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

function sanitizeData(data: any): any {
  if (!data || typeof data !== "object") return data;
  if (Array.isArray(data)) {
    return data.map(sanitizeData);
  }
  const sanitized: any = {};
  for (const [key, value] of Object.entries(data)) {
    if (key.startsWith("$") || key.includes(".")) {
      continue;
    }
    sanitized[key] = sanitizeData(value);
  }
  return sanitized;
}

app.use((req, _res, next) => {
  if (req.body) req.body = sanitizeData(req.body);
  if (req.query) req.query = sanitizeData(req.query);
  if (req.params) req.params = sanitizeData(req.params);
  next();
});

// ─── 5. Cybersecurity: Rate Limiting & Anti-Brute Force ───
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Trop de requêtes. Veuillez réessayer dans quelques minutes." },
});
app.use("/api", globalLimiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Trop de tentatives. Par mesure de sécurité, veuillez patienter 15 minutes." },
});
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);
app.use("/api/admin/auth/login", authLimiter);

// ─── 6. Static Uploads Serving ───
const uploadsDir = path.resolve(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir, {
  setHeaders: (res, filePath) => {
    res.setHeader('Accept-Ranges', 'bytes');
    const ext = path.extname(filePath).toLowerCase();
    if (ext === '.mp4') res.setHeader('Content-Type', 'video/mp4');
    else if (ext === '.webm') res.setHeader('Content-Type', 'video/webm');
    else if (ext === '.mov') res.setHeader('Content-Type', 'video/quicktime');
  },
}));

// ─── 7. Health Check ───
app.get(["/", "/health", "/healthz", "/api/health"], (_req, res) => {
  res.json({ status: "ok", service: "onoot-boutique-api", timestamp: new Date().toISOString() });
});

// ─── 8. Database Connection Middleware ───
app.use("/api", async (_req, _res, next) => {
  if (mongoose.connection.readyState !== 1) {
    try {
      await connectDB();
    } catch {
      // Handled by route handlers
    }
  }
  next();
});

app.use("/api", uploadRouter);
app.use("/api", router);

// ─── 9. Global Error Handler (Hides Internal Details) ───
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error({ err }, "Unhandled application error");
  const message = err.message || "Erreur interne du serveur";
  const status = err.status || 500;
  res.status(status).json({ error: status === 500 ? "Une erreur inattendue est survenue." : message });
});

export default app;
