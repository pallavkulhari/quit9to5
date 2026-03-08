import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { supabase } from "./lib/supabase";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// 🔹 HEALTH CHECK (IMPORTANT)
app.get("/health", (_req, res) => {
  res.status(200).send("OK");
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
  });

  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ✅ RENDER-COMPATIBLE PORT
  const port = process.env.PORT || 3000;

  server.listen(
    {
      port,
      host: "0.0.0.0",
    },
    () => {
      log(`serving on port ${port}`);

      // ── Supabase keep-alive (prevents free-tier pause after 7 days) ──
      const pingSupabase = async () => {
        try {
          await supabase.from("keepalive").upsert(
            { id: 1, pinged_at: new Date().toISOString() },
            { onConflict: "id" }
          );
          log("Supabase keep-alive ping sent");
        } catch (err) {
          console.error("Keep-alive ping failed:", err);
        }
      };
      pingSupabase(); // ping on startup
      setInterval(pingSupabase, 3 * 24 * 60 * 60 * 1000); // every 3 days
    }
  );
})();
