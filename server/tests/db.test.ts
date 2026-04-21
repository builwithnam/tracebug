import { describe, it, beforeAll, afterAll, expect } from "vitest";
import mysql from "mysql2/promise";
import { createPool, getSessionByShareId, closePool } from "../src/db.js";

const TEST_DB_CONFIG = {
  host: "localhost",
  port: 3306,
  user: "root",
  password: "voithan",
  database: "test_db",
};

describe("database pool", () => {
  let pool: mysql.Pool;

  beforeAll(async () => {
    const conn = await mysql.createConnection({
      host: TEST_DB_CONFIG.host,
      port: TEST_DB_CONFIG.port,
      user: TEST_DB_CONFIG.user,
      password: TEST_DB_CONFIG.password,
    });

    await conn.query(`DROP DATABASE IF EXISTS ${TEST_DB_CONFIG.database}`);
    await conn.query(`CREATE DATABASE ${TEST_DB_CONFIG.database}`);

    await conn.end();
    const dbConn = await mysql.createConnection({
      host: TEST_DB_CONFIG.host,
      port: TEST_DB_CONFIG.port,
      user: TEST_DB_CONFIG.user,
      password: TEST_DB_CONFIG.password,
      database: TEST_DB_CONFIG.database,
    });

    await dbConn.query(`
      CREATE TABLE share (
        id VARCHAR(255) PRIMARY KEY,
        session_id VARCHAR(255) NOT NULL
      )
    `);

    await dbConn.query(`
      CREATE TABLE message (
        id INT AUTO_INCREMENT PRIMARY KEY,
        session_id VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL,
        content TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await dbConn.query(`
      CREATE TABLE message_data (
        id INT AUTO_INCREMENT PRIMARY KEY,
        session_id VARCHAR(255) NOT NULL,
        stage VARCHAR(100) NOT NULL,
        payload JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await dbConn.execute("INSERT INTO share (id, session_id) VALUES (?, ?)", [
      "test-share-123",
      "session-abc",
    ]);

    await dbConn.execute("INSERT INTO message (session_id, role, content) VALUES (?, ?, ?)", [
      "session-abc",
      "user",
      "Hello",
    ]);

    await dbConn.execute("INSERT INTO message (session_id, role, content) VALUES (?, ?, ?)", [
      "session-abc",
      "assistant",
      "Hi there!",
    ]);

    await dbConn.execute("INSERT INTO message_data (session_id, stage, payload) VALUES (?, ?, ?)", [
      "session-abc",
      "querier",
      JSON.stringify({ intent: "greeting" }),
    ]);

    await dbConn.execute("INSERT INTO message_data (session_id, stage, payload) VALUES (?, ?, ?)", [
      "session-abc",
      "router",
      JSON.stringify({ scenario: "greeting" }),
    ]);

    await dbConn.end();
  });

  it("should get session by share_id", async () => {
    pool = createPool(TEST_DB_CONFIG);
    const result = await getSessionByShareId(pool, "test-share-123");

    expect(result).toBeTruthy();
    expect(result!.share_id).toBe("test-share-123");
    expect(result!.session_id).toBe("session-abc");
    expect(Array.isArray(result!.messages)).toBe(true);
    expect(result!.messages.length).toBe(2);
    expect(result!.messages[0].type).toBe("user");
    expect(result!.messages[0].text).toBe("Hello");
    expect(Array.isArray(result!.traces)).toBe(true);
    expect(result!.traces.length).toBe(2);
    expect(result!.traces[0].querier).toBe("querier");
  });

  it("should return null for non-existent share_id", async () => {
    const result = await getSessionByShareId(pool, "non-existent");
    expect(result).toBeNull();
  });

  it("should handle concurrent requests", async () => {
    const promises: Promise<Awaited<ReturnType<typeof getSessionByShareId>>>[] = [];
    for (let i = 0; i < 10; i++) {
      promises.push(getSessionByShareId(pool, "test-share-123"));
    }

    const results = await Promise.all(promises);
    expect(results.length).toBe(10);
    for (const result of results) {
      expect(result).toBeTruthy();
      expect(result!.share_id).toBe("test-share-123");
    }
  });

  afterAll(async () => {
    await closePool();

    const conn = await mysql.createConnection({
      host: TEST_DB_CONFIG.host,
      port: TEST_DB_CONFIG.port,
      user: TEST_DB_CONFIG.user,
      password: TEST_DB_CONFIG.password,
    });
    await conn.query(`DROP DATABASE IF EXISTS ${TEST_DB_CONFIG.database}`);
    await conn.end();
  });
});
