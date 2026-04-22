import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import type { DbConfig, AppConfig } from "@tracebug/core";

const CONFIG_PATH = path.join(os.homedir(), ".tracebug", "settings.json");

export interface CliConfig extends AppConfig {
  output?: "json" | "pretty";
}

export function loadConfig(): CliConfig {
  try {
    const configContent = fs.readFileSync(CONFIG_PATH, "utf-8");
    return JSON.parse(configContent) as CliConfig;
  } catch (error) {
    console.error(`Failed to load config from ${CONFIG_PATH}`);
    throw error;
  }
}

export function getEnvConfig(): Partial<CliConfig> {
  const env: Partial<CliConfig> = {};

  if (process.env.TRACEBUG_DB_HOST) {
    env.db = {
      host: process.env.TRACEBUG_DB_HOST,
      port: parseInt(process.env.TRACEBUG_DB_PORT || "3306", 10),
      user: process.env.TRACEBUG_DB_USER || "root",
      password: process.env.TRACEBUG_DB_PASSWORD || "",
      database: process.env.TRACEBUG_DB_NAME || "bc_app",
    };
  }

  if (process.env.TRACEBUG_OUTPUT === "json" || process.env.TRACEBUG_OUTPUT === "pretty") {
    env.output = process.env.TRACEBUG_OUTPUT;
  }

  return env;
}

export function getConfig(): CliConfig {
  const fileConfig = loadConfig();
  const envConfig = getEnvConfig();
  return { ...fileConfig, ...envConfig };
}
