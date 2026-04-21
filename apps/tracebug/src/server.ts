import http, { IncomingMessage, ServerResponse } from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import type { AppConfig } from "@tracebug/core";
import { handleSession } from "./api/session.js";
import { closePool } from "./db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In dev: src/server.ts → src/public/. In prod: dist/server.js → dist/public/
const PUBLIC_DIR = path.join(__dirname, "public");

function serveStatic(res: ServerResponse, filePath: string, contentType: string): void {
  try {
    const data = fs.readFileSync(filePath);
    res.writeHead(200, { "Content-Type": contentType });
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end("Not found");
  }
}

export function createServer(config: AppConfig): http.Server {
  const server = http.createServer(async (req: IncomingMessage, res: ServerResponse) => {
    const url = new URL(req.url ?? "/", `http://localhost`);

    if (url.pathname === "/api/session" && req.method === "GET") {
      await handleSession(req, res, config);
      return;
    }

    let filePath: string;
    let contentType: string;

    if (url.pathname === "/" || url.pathname === "/index.html") {
      filePath = path.join(PUBLIC_DIR, "index.html");
      contentType = "text/html";
    } else if (url.pathname === "/style.css") {
      filePath = path.join(PUBLIC_DIR, "style.css");
      contentType = "text/css";
    } else if (url.pathname === "/app.js") {
      filePath = path.join(PUBLIC_DIR, "app.js");
      contentType = "application/javascript";
    } else {
      res.writeHead(404);
      res.end("Not found");
      return;
    }

    serveStatic(res, filePath, contentType);
  });

  server.on("close", async () => {
    await closePool();
  });

  return server;
}
