import { describe, it, afterEach, expect, vi } from "vitest";
import fs from "fs";
import path from "path";
import os from "os";

const CONFIG_DIR = path.join(os.homedir(), ".tracebug");
const CONFIG_PATH = path.join(CONFIG_DIR, "settings.json");

describe("config loading", () => {
  afterEach(() => {
    vi.resetModules();
    if (fs.existsSync(CONFIG_PATH)) {
      fs.unlinkSync(CONFIG_PATH);
    }
  });

  it("should load valid config successfully", async () => {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
    fs.writeFileSync(
      CONFIG_PATH,
      JSON.stringify({
        db: {
          host: "localhost",
          port: 3306,
          user: "root",
          password: "voithan",
          database: "bc_app",
        },
      }),
    );

    const { loadConfig } = await import("../src/config.js");
    const config = loadConfig();
    expect(config.db.host).toBe("localhost");
    expect(config.db.port).toBe(3306);
  });

  it("should throw when config file missing", async () => {
    if (fs.existsSync(CONFIG_PATH)) {
      fs.unlinkSync(CONFIG_PATH);
    }

    const { loadConfig } = await import("../src/config.js");
    expect(() => loadConfig()).toThrow(/Config not found/);
  });

  it("should throw when db field missing", async () => {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
    fs.writeFileSync(CONFIG_PATH, JSON.stringify({ port: 3000 }));

    const { loadConfig } = await import("../src/config.js");
    expect(() => loadConfig()).toThrow(/missing 'db' field/);
  });
});
