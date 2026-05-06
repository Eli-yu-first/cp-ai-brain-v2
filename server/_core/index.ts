import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { sdk } from "./sdk";
import { getSessionCookieOptions } from "./cookies";
import * as db from "../db";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

// Local login credentials (used when Manus OAuth is not configured)
const LOCAL_ADMIN_PASSWORD = process.env.LOCAL_ADMIN_PASSWORD || "cpbrain2024";
const LOCAL_ADMIN_OPEN_ID = "local-admin-001";
const LOCAL_ADMIN_NAME = "管理员";

function registerLocalAuthRoutes(app: express.Express) {
  // Local login endpoint (used when VITE_OAUTH_PORTAL_URL is not configured)
  app.post("/api/auth/local-login", async (req, res) => {
    const { password } = req.body;
    if (!password || password !== LOCAL_ADMIN_PASSWORD) {
      res.status(401).json({ error: "密码错误" });
      return;
    }
    try {
      // Ensure user exists in DB
      await db.upsertUser({
        openId: LOCAL_ADMIN_OPEN_ID,
        name: LOCAL_ADMIN_NAME,
        email: "admin@cpbrain.local",
        loginMethod: "local",
        lastSignedIn: new Date(),
      });
      // Create session token
      const sessionToken = await sdk.createSessionToken(LOCAL_ADMIN_OPEN_ID, {
        name: LOCAL_ADMIN_NAME,
        expiresInMs: ONE_YEAR_MS,
      });
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      // Also return token in response body for environments where cookies may be filtered by proxy
      res.json({ success: true, name: LOCAL_ADMIN_NAME, token: sessionToken });
    } catch (error) {
      console.error("[LocalAuth] Login failed", error);
      res.status(500).json({ error: "登录失败，请重试" });
    }
  });

  // Check if Manus OAuth is configured
  app.get("/api/auth/config", (req, res) => {
    const hasOAuth = !!(process.env.VITE_OAUTH_PORTAL_URL && process.env.VITE_APP_ID);
    res.json({ hasOAuth, hasLocalAuth: true });
  });
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  app.set("trust proxy", 1);
  app.disable("x-powered-by");
  app.use((_, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    next();
  });
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  registerLocalAuthRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
