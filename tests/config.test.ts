import { describe, it, afterEach } from "node:test";
import assert from "assert";
import fs from "fs";
import path from "path";
import os from "os";

const CONFIG_DIR = path.join(os.homedir(), ".tracebug");
const CONFIG_PATH = path.join(CONFIG_DIR, "settings.json");

describe("config loading", () => {
  afterEach(() => {
    // Clean up test config
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
          user: "testuser",
          password: "testpass",
          database: "testdb",
        },
      }),
    );

    // This will fail because config.ts doesn't exist yet
    const { loadConfig } = await import("../src/config.ts");
    const config = loadConfig();
    assert.equal(config.db.host, "localhost");
    assert.equal(config.db.port, 3306);
  });

  it("should throw when config file missing", async () => {
    // Ensure config doesn't exist
    if (fs.existsSync(CONFIG_PATH)) {
      fs.unlinkSync(CONFIG_PATH);
    }

    const { loadConfig } = await import("../src/config.ts");
    assert.throws(() => loadConfig(), /Config not found/);
  });

  it("should throw when db field missing", async () => {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
    fs.writeFileSync(CONFIG_PATH, JSON.stringify({ port: 3000 }));

    const { loadConfig } = await import("../src/config.ts");
    assert.throws(() => loadConfig(), /missing 'db' field/);
  });
});
