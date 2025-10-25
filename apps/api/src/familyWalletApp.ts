/**
 * Family Wallet API Application
 *
 * Hono APIアプリケーションのメインエントリーポイント
 */

import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { initializeDatabaseFromEnv, healthCheck } from "./db/client.js";
import vaultsRouter from "./routes/vaults.js";
import escrowsRouter from "./routes/escrows.js";
import shareableKeysRouter from "./routes/shareable-keys.js";

const WEB_ORIGIN = process.env.WEB_ORIGIN || "http://localhost:5174";

export function createFamilyWalletApp() {
  const app = new Hono();

  // Middleware
  app.use("*", logger());

  app.use(
    "*",
    cors({
      origin: (origin) => origin ?? WEB_ORIGIN,
      allowHeaders: [
        "Origin",
        "X-Requested-With",
        "Content-Type",
        "Accept",
        "Authorization",
      ],
      allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      credentials: true,
    })
  );

  // Initialize database
  try {
    initializeDatabaseFromEnv(process.env as Record<string, string>);
  } catch (error) {
    console.error("Failed to initialize database:", error);
    // Continue without database for development
  }

  // Health check
  app.get("/health", async (c) => {
    const dbHealthy = await healthCheck();
    return c.json({
      ok: true,
      database: dbHealthy ? "connected" : "disconnected",
      timestamp: new Date().toISOString(),
    });
  });

  // API Routes
  app.route("/vaults", vaultsRouter);
  app.route("/escrows", escrowsRouter);
  app.route("/shareable-keys", shareableKeysRouter);

  // 404 handler
  app.notFound((c) => {
    return c.json({ error: "Not Found" }, 404);
  });

  // Error handler
  app.onError((err, c) => {
    console.error("Server error:", err);
    return c.json(
      {
        error: "Internal Server Error",
        message: err.message,
      },
      500
    );
  });

  return app;
}

export default createFamilyWalletApp;
