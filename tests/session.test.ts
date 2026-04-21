import { describe, it, before, after } from "node:test";
import assert from "node:assert";
import { IncomingMessage, ServerResponse } from "http";
import mysql from "mysql2/promise";
import { handleSession } from "../dist/api/session.js";
import { closePool } from "../dist/db.js";
// createPool is used via the handleSession handler which initializes the pool internally

interface TestResponse extends ServerResponse {
  getStatusCode(): number;
  getHeaders(): Record<string, string>;
  getBody(): string;
}

function createMocks(url: string, method = "GET"): { req: IncomingMessage; res: TestResponse } {
  const req = {
    url,
    method,
  } as unknown as IncomingMessage;

  let statusCode = 0;
  let headers: Record<string, string> = {};
  let body = "";

  const res = {
    writeHead: (code: number, h?: Record<string, string>) => {
      statusCode = code;
      if (h) headers = { ...headers, ...h };
    },
    end: (data?: string) => {
      if (data) body = data;
    },
    getStatusCode: () => statusCode,
    getHeaders: () => headers,
    getBody: () => body,
  } as unknown as TestResponse;

  return { req, res };
}

const TEST_DB_CONFIG = {
  host: "localhost",
  port: 3306,
  user: "root",
  password: "voithan",
  database: "db_test",
};

const mockConfig = {
  port: 3000,
  db: TEST_DB_CONFIG,
};

describe("GET /api/session", () => {
  before(async () => {
    const conn = await mysql.createConnection({
      host: TEST_DB_CONFIG.host,
      port: TEST_DB_CONFIG.port,
      user: TEST_DB_CONFIG.user,
      password: TEST_DB_CONFIG.password,
    });

    await conn.query(`DROP DATABASE IF EXISTS ${TEST_DB_CONFIG.database}`);
    await conn.query(`CREATE DATABASE ${TEST_DB_CONFIG.database}`);
    await conn.query(`USE ${TEST_DB_CONFIG.database}`);

    await conn.query(`
      CREATE TABLE share (
        id VARCHAR(255) PRIMARY KEY,
        session_id VARCHAR(255) NOT NULL
      )
    `);

    await conn.query(`
      CREATE TABLE message (
        id INT AUTO_INCREMENT PRIMARY KEY,
        session_id VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL,
        content TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await conn.query(`
      CREATE TABLE message_data (
        id INT AUTO_INCREMENT PRIMARY KEY,
        session_id VARCHAR(255) NOT NULL,
        stage VARCHAR(100) NOT NULL,
        payload JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await conn.execute("INSERT INTO share (id, session_id) VALUES (?, ?)", [
      "valid-share-id",
      "session-123",
    ]);

    await conn.execute("INSERT INTO message (session_id, role, content) VALUES (?, ?, ?)", [
      "session-123",
      "user",
      "Hello",
    ]);

    await conn.execute("INSERT INTO message (session_id, role, content) VALUES (?, ?, ?)", [
      "session-123",
      "assistant",
      "Hi there!",
    ]);

    await conn.execute("INSERT INTO message_data (session_id, stage, payload) VALUES (?, ?, ?)", [
      "session-123",
      "querier",
      JSON.stringify({
        message: {
          kwargs: {
            content: "test query",
            additional_kwargs: {
              context: { traceId: "trace-123" },
              response_metadata: { model_name: "gpt-4" },
            },
          },
        },
      }),
    ]);

    await conn.execute("INSERT INTO message_data (session_id, stage, payload) VALUES (?, ?, ?)", [
      "session-123",
      "stat",
      JSON.stringify({
        querierDuration: 100,
        routerDuration: 50,
      }),
    ]);

    await conn.end();
  });

  it("should return 400 when share_id is missing", async () => {
    const { req, res } = createMocks("/api/session");

    await handleSession(req, res, mockConfig);

    assert.strictEqual(res.getStatusCode(), 400);
    assert.strictEqual(res.getHeaders()["Content-Type"], "application/json");
    assert.strictEqual(res.getHeaders()["Access-Control-Allow-Origin"], "*");

    const body = JSON.parse(res.getBody());
    assert.deepStrictEqual(body, { error: "share_id is required" });
  });

  it("should return 404 when share_id not found", async () => {
    const { req, res } = createMocks("/api/session?share_id=non-existent-share-id");

    await handleSession(req, res, mockConfig);

    assert.strictEqual(res.getStatusCode(), 404);
    assert.strictEqual(res.getHeaders()["Content-Type"], "application/json");
    assert.strictEqual(res.getHeaders()["Access-Control-Allow-Origin"], "*");

    const body = JSON.parse(res.getBody());
    assert.deepStrictEqual(body, { error: "Share ID not found" });
  });

  it("should return session data with valid share_id", async () => {
    const { req, res } = createMocks("/api/session?share_id=valid-share-id");

    await handleSession(req, res, mockConfig);

    assert.strictEqual(res.getStatusCode(), 200);
    assert.strictEqual(res.getHeaders()["Content-Type"], "application/json");
    assert.strictEqual(res.getHeaders()["Access-Control-Allow-Origin"], "*");

    const body = JSON.parse(res.getBody());
    assert.strictEqual(body.share_id, "valid-share-id");
    assert.strictEqual(body.session_id, "session-123");
    assert.ok(Array.isArray(body.messages));
    assert.ok(Array.isArray(body.traces));

    // Check message structure
    assert.strictEqual(body.messages.length, 2);
    const msg = body.messages[0];
    assert.ok("id" in msg);
    assert.ok("type" in msg);
    assert.ok("text" in msg);
    assert.ok("code" in msg);
    assert.ok("feedback_type" in msg);
    assert.ok("referer_id" in msg);
    assert.ok("quick_replies" in msg);
    assert.ok("buttons" in msg);
    assert.ok("metadata" in msg);
    assert.ok("created_at" in msg);

    // Check trace structure with parsed stages
    assert.strictEqual(body.traces.length, 1);
    const trace = body.traces[0];
    assert.ok("id" in trace);
    assert.ok("created_at" in trace);
    assert.ok("stages" in trace);
    assert.ok("stat" in trace);
    assert.strictEqual(typeof trace.stages, "object");

    // Verify querier stage was parsed
    assert.ok(trace.stages.querier);
    assert.ok("summary" in trace.stages.querier);
    assert.ok("raw" in trace.stages.querier);

    // Verify stat was parsed
    assert.ok(trace.stat);
    assert.strictEqual(trace.stat.querierDuration, 100);
    assert.strictEqual(trace.stat.routerDuration, 50);
  });

  it("should include CORS headers on all responses", async () => {
    const { req, res } = createMocks("/api/session");

    await handleSession(req, res, mockConfig);

    assert.strictEqual(res.getHeaders()["Access-Control-Allow-Origin"], "*");
  });

  it("should return 500 for unexpected errors", async () => {
    // Close existing pool to force new connection attempt
    await closePool();

    // Use invalid config that will cause an error
    const badConfig = {
      port: 3000,
      db: {
        host: "invalid-host",
        port: 9999,
        user: "invalid",
        password: "invalid",
        database: "invalid",
      },
    };

    const { req, res } = createMocks("/api/session?share_id=test");

    await handleSession(req, res, badConfig);

    assert.strictEqual(res.getStatusCode(), 500);
    assert.strictEqual(res.getHeaders()["Content-Type"], "application/json");

    const body = JSON.parse(res.getBody());
    assert.deepStrictEqual(body, { error: "Internal server error" });
  });

  after(async () => {
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
