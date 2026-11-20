import cors from "cors";
import express from "express";

import errorHandler from "./middleware/errorHandler.js";
import { createRateLimiter } from "./middleware/rateLimiter.js";
import healthRoutes from "./routes/health.routes.js";
import interviewRoutes from "./routes/interview.routes.js";

const DEFAULT_CORS_ORIGINS = ["http://localhost:5173"];

function getAllowedOrigins() {
  const configured = process.env.CORS_ORIGINS;
  return configured
    ? configured.split(",").map((origin) => origin.trim()).filter(Boolean)
    : DEFAULT_CORS_ORIGINS;
}

export function createApp() {
  const app = express();
  const allowedOrigins = getAllowedOrigins();

  app.disable("x-powered-by");
  app.set("trust proxy", false);
  app.set("query parser", "simple");
  app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Referrer-Policy", "no-referrer");
    res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
    res.setHeader("Cross-Origin-Resource-Policy", "same-origin");
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Pragma", "no-cache");
    if (process.env.NODE_ENV === "production") {
      res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    }
    next();
  });
  app.use(cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(null, false);
    },
  }));
  app.use(createRateLimiter());
  app.use(express.json({ limit: "16kb", strict: true, inflate: false }));

  app.get("/", (req, res) => {
    res.status(200).json({ success: true, message: "Backend is running." });
  });
  app.use("/health", healthRoutes);
  app.use("/api/interview", interviewRoutes);
  app.use(errorHandler);

  return app;
}

export default createApp;
