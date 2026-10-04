/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// API Routes
// 1. Healthcheck
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    time: new Date().toISOString()
  });
});

// Vite & Static file serving setup
async function setupServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Setting up Vite developer middleware...");
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Running in Production. Serving pre-compiled static files...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Morkhē Studio server is listening on http://0.0.0.0:${PORT}`);
  });
}

setupServer();
