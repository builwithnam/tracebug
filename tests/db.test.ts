import { describe, it, before, after } from "node:test";
import assert from "assert";
import mysql from "mysql2/promise";
import { createPool, getSessionByShareId, closePool } from "../dist/db.js";

const TEST_DB_CONFIG = {
  host: "172.18.0.2",
  port: 3306,
  user: "root",
  password: "voithan",
  database: "tracebug_test",
};

describe("database pool", () => {
  let pool: mysql.Pool;

  before(async () => {
    // Create test database and tables
    const conn = await mysql.createConnection({
      host: TEST_DB_CONFIG.host,
      port: TEST_DB_CONFIG.port,
      user: TEST_DB_CONFIG.user,
      password: TEST_DB_CONFIG.password,
    });

    await conn.query(`DROP DATABASE IF EXISTS ${TEST_DB_CONFIG.database}`);
    await conn.query(`CREATE DATABASE ${TEST_DB_CONFIG.database}`);

    // Close and reconnect with the database specified
    await conn.end();
    const dbConn = await mysql.createConnection({
      host: TEST_DB_CONFIG.host,
      port: TEST_DB_CONFIG.port,
      user: TEST_DB_CONFIG.user,
      password: TEST_DB_CONFIG.password,
      database: TEST_DB_CONFIG.database,
    });

    // Create tables matching the schema
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

    // Insert test data
    await dbConn.execute(
      "INSERT INTO share (id, session_id) VALUES (?, ?)",
      ["test-share-123", "session-abc"]
    );

    await dbConn.execute(
      "INSERT INTO message (session_id, role, content) VALUES (?, ?, ?)",
      ["session-abc", "user", "Hello"]
    );

    await dbConn.execute(
      "INSERT INTO message (session_id, role, content) VALUES (?, ?, ?)",
      ["session-abc", "assistant", "Hi there!"]
    );

    await dbConn.execute(
      "INSERT INTO message_data (session_id, stage, payload) VALUES (?, ?, ?)",
      ["session-abc", "querier", JSON.stringify({ intent: "greeting" })]
    );

    await dbConn.execute(
      "INSERT INTO message_data (session_id, stage, payload) VALUES (?, ?, ?)",
      ["session-abc", "router", JSON.stringify({ scenario: "greeting" })]
    );

    await dbConn.end();
  });

  it("should create a pool and get connection", async () => {
    pool = createPool(TEST_DB_CONFIG);
    assert.ok(pool, "Pool should be created");

    const conn = await pool.getConnection();
    assert.ok(conn, "Should get connection from pool");
    conn.release();
  });

  it("should get session by share_id", async () => {
    const result = await getSessionByShareId(pool, "test-share-123");

    assert.ok(result, "Should return session data");
    assert.equal(result.share_id, "test-share-123");
    assert.equal(result.session_id, "session-abc");
    assert.ok(Array.isArray(result.messages));
    assert.equal(result.messages.length, 2);
    assert.equal(result.messages[0].role, "user");
    assert.equal(result.messages[0].content, "Hello");
    assert.ok(Array.isArray(result.traces));
    assert.equal(result.traces.length, 2);
    assert.equal(result.traces[0].stage, "querier");
  });

  it("should return null for non-existent share_id", async () => {
    const result = await getSessionByShareId(pool, "non-existent");
    assert.equal(result, null);
  });

  it("should handle concurrent requests", async () => {
    const promises: Promise<ReturnType<typeof getSessionByShareId>>[] = [];
    for (let i = 0; i < 10; i++) {
      promises.push(getSessionByShareId(pool, "test-share-123"));
    }

    const results = await Promise.all(promises);
    assert.equal(results.length, 10);
    results.forEach((result) => {
      assert.ok(result);
      assert.equal(result.share_id, "test-share-123");
    });
  });

  after(async () => {
    await closePool();

    // Clean up test database
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
