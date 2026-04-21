import express from "express";
import cors from "cors";
import { loadConfig } from "./config.js";
import { createPool, closePool } from "./db.js";
import { sessionRouter } from "./routes/session.js";

async function main() {
  const config = loadConfig();
  const port = config.port ?? 3000;
  createPool(config.db);

  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use("/api", sessionRouter());

  const server = app.listen(port, () => {
    console.log("Loaded config:", JSON.stringify(config));
    console.log(`tracebug API running at http://localhost:${port}`);
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
