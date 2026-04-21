import fs from "fs";
import path from "path";
import os from "os";

export interface DbConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

export interface AppConfig {
  db: DbConfig;
  port?: number;
}

const CONFIG_DIR = path.join(os.homedir(), ".tracebug");
const CONFIG_PATH = path.join(CONFIG_DIR, "settings.json");

export function loadConfig(): AppConfig {
  if (!fs.existsSync(CONFIG_PATH)) {
    throw new Error(`Config not found at ${CONFIG_PATH}`);
  }

  const raw = fs.readFileSync(CONFIG_PATH, "utf-8");
  const config: AppConfig = JSON.parse(raw);

  if (!config.db) {
    throw new Error("Config missing 'db' field");
  }

  return config;
}
