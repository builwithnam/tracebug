import http, { IncomingMessage, ServerResponse } from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import type { AppConfig } from "@tracebug/core";
import { handleSession } from "./api/session.js";
import { closePool } from "./db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Built frontend assets (vite output)
const DIST_DIR = path.join(__dirname, "..", "..", "dist", "public");

const MIME_TYPES: Record<string, string> = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

function serveStatic(res: ServerResponse, filePath: string): void {
  try {
    const data = fs.readFileSync(filePath);
    const ext = path.extname(filePath);
    res.writeHead(200, { "Content-Type": MIME_TYPES[ext] ?? "application/octet-stream" });
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end("Not found");
  }
}

export function createServer(config: AppConfig): http.Server {
  const server = http.createServer(async (req: IncomingMessage, res: ServerResponse) => {
    const url = new URL(req.url ?? "/", `http://localhost`);

    // API routes
    if (url.pathname === "/api/session" && req.method === "GET") {
      await handleSession(req, res, config);
      return;
    }

    // Static assets from vite build output
    let filePath: string;

    if (url.pathname === "/" || url.pathname === "/index.html") {
      filePath = path.join(DIST_DIR, "index.html");
    } else {
      // Security: prevent path traversal
      const safePath = path.normalize(url.pathname).replace(/^(\.\.[/\\])+/, "");
      filePath = path.join(DIST_DIR, safePath);
    }

    // If file doesn't exist, serve index.html (SPA fallback)
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      filePath = path.join(DIST_DIR, "index.html");
    }

    serveStatic(res, filePath);
  });

  server.on("close", async () => {
    await closePool();
  });

  return server;
}
