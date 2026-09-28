import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import uploadRouter from "./routes/upload";
import { logger } from "./lib/logger";
import { connectDB } from "./lib/mongoose";
import mongoose from "mongoose";
import path from "path";
import fs from "fs";

const app: Express = express();

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
app.use(cors());
app.use(express.json({ limit: "500mb" }));
app.use(express.urlencoded({ extended: true, limit: "500mb" }));

// Serve uploaded files as static assets with proper range and content-type support for video streaming
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

app.get(["/", "/health", "/healthz", "/api/health"], (_req, res) => {
  res.json({ status: "ok", service: "onoot-boutique-api", timestamp: new Date().toISOString() });
});

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

export default app;
