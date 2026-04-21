#!/usr/bin/env node

import { createServer } from "./server.js";
import { loadConfig } from "./config.js";
import open from "open";
import { closePool } from "./db.js";

async function main() {
  const config = loadConfig();
  const port = config.port ?? 3000;

  const server = createServer(config);

  server.listen(port, () => {
    const url = `http://localhost:${port}`;
    console.log("Loaded config:", JSON.stringify(config));
    console.log(`tracebug running at ${url}`);
    open(url).catch(() => {
      console.log(`Open your browser at ${url}`);
    });
  });

  const shutdown = async () => {
    console.log("\nShutting down...");
    server.close(async () => {
      await closePool();
      process.exit(0);
    });

    setTimeout(() => {
      console.error("Forced shutdown after timeout");
      process.exit(1);
    }, 5000);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main();
