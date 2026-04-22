#!/usr/bin/env node

import { Command } from "commander";
import { getSessionByShareId, getSessionBySessionId, closePool } from "./db.js";
import { getConfig, getEnvConfig } from "./config.js";
import { formatOutput, formatError } from "./format.js";
import * as os from "node:os";
import * as path from "node:path";

const program = new Command();

program
  .name("tracebug")
  .description("CLI tool for debugging chatbot session traces")
  .version("0.1.0")
  .argument("[share_id]", "The share ID to look up")
  .option("--session-id <id>", "Look up by session ID instead of share ID")
  .option("--json", "Output as JSON (default: pretty-printed text)", false)
  .option("--env", "Use environment variables for config", false)
  .action(async (shareId: string | undefined, options) => {
    const config = options.env ? getEnvConfig() : getConfig();
    const output = options.json ? "json" : (config.output ?? "pretty");

    if (!config.db || !config.db.host) {
      console.error(
        formatError(
          "Database configuration missing. Set TRACEBUG_DB_HOST or configure ~/.tracebug/settings.json",
        ),
      );
      process.exit(1);
    }

    if (!shareId && !options.sessionId) {
      console.error(formatError("Provide a share_id argument or use --session-id <id>"));
      process.exit(1);
    }

    try {
      const session = options.sessionId
        ? await getSessionBySessionId(options.sessionId)
        : await getSessionByShareId(shareId!);

      if (!session) {
        const lookupId = options.sessionId ?? shareId;
        const lookupType = options.sessionId ? "Session ID" : "Share ID";
        console.error(formatError(`${lookupType} "${lookupId}" not found`));
        process.exit(1);
      }

      console.log(formatOutput(session, output as "json" | "pretty"));
    } catch (error) {
      console.error(formatError(error instanceof Error ? error.message : String(error)));
      process.exit(1);
    } finally {
      await closePool();
    }
  });

program
  .command("config")
  .description("Print current configuration location")
  .action(() => {
    const configPath = path.join(os.homedir(), ".tracebug", "settings.json");
    console.log(`Configuration file: ${configPath}`);

    // Check individual environment variables
    const envVars = [
      "TRACEBUG_DB_HOST",
      "TRACEBUG_DB_PORT",
      "TRACEBUG_DB_USER",
      "TRACEBUG_DB_PASSWORD",
      "TRACEBUG_DB_NAME",
      "TRACEBUG_OUTPUT",
    ];

    const setEnvVars = envVars.filter((key) => process.env[key]);

    if (setEnvVars.length > 0) {
      console.log("\nEnvironment variables configured:");
      for (const key of setEnvVars) {
        const value = process.env[key]!;
        console.log(`  ${key}: ${key.includes("PASSWORD") ? "***" : value}`);
      }
    }
  });

program.parse(process.argv);
