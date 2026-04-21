import { describe, it, beforeAll, afterAll, expect, vi } from "vitest";
import { IncomingMessage, ServerResponse } from "http";
import mysql from "mysql2/promise";
import { handleSession } from "../src/api/session.js";
import { closePool } from "../src/db.js";

function createMocks(url: string, method = "GET") {
  const req = { url, method } as unknown as IncomingMessage;

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
  } as unknown as ServerResponse;

  return {
    req,
    res,
    getStatus: () => statusCode,
    getHeaders: () => headers,
    getBody: () => body,
  };
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
  beforeAll(async () => {
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
    const { req, res, getStatus, getHeaders, getBody } = createMocks("/api/session");

    await handleSession(req, res, mockConfig);

    expect(getStatus()).toBe(400);
    expect(getHeaders()["Content-Type"]).toBe("application/json");
    expect(getHeaders()["Access-Control-Allow-Origin"]).toBe("*");

    const body = JSON.parse(getBody());
    expect(body).toEqual({ error: "share_id is required" });
  });

  it("should return 404 when share_id not found", async () => {
    const { req, res, getStatus, getHeaders, getBody } = createMocks(
      "/api/session?share_id=non-existent-share-id",
    );

    await handleSession(req, res, mockConfig);

    expect(getStatus()).toBe(404);
    expect(getHeaders()["Content-Type"]).toBe("application/json");
    expect(getHeaders()["Access-Control-Allow-Origin"]).toBe("*");

    const body = JSON.parse(getBody());
    expect(body).toEqual({ error: "Share ID not found" });
  });

  it("should return session data with valid share_id", async () => {
    const { req, res, getStatus, getHeaders, getBody } = createMocks(
      "/api/session?share_id=valid-share-id",
    );

    await handleSession(req, res, mockConfig);

    expect(getStatus()).toBe(200);
    expect(getHeaders()["Content-Type"]).toBe("application/json");
    expect(getHeaders()["Access-Control-Allow-Origin"]).toBe("*");

    const body = JSON.parse(getBody());
    expect(body.share_id).toBe("valid-share-id");
    expect(body.session_id).toBe("session-123");
    expect(Array.isArray(body.messages)).toBe(true);
    expect(Array.isArray(body.traces)).toBe(true);

    expect(body.messages.length).toBe(2);
    const msg = body.messages[0];
    expect("id" in msg).toBe(true);
    expect("type" in msg).toBe(true);
    expect("text" in msg).toBe(true);
    expect("code" in msg).toBe(true);
    expect("feedback_type" in msg).toBe(true);
    expect("referer_id" in msg).toBe(true);
    expect("quick_replies" in msg).toBe(true);
    expect("buttons" in msg).toBe(true);
    expect("metadata" in msg).toBe(true);
    expect("created_at" in msg).toBe(true);

    expect(body.traces.length).toBe(1);
    const trace = body.traces[0];
    expect("id" in trace).toBe(true);
    expect("created_at" in trace).toBe(true);
    expect("stages" in trace).toBe(true);
    expect("stat" in trace).toBe(true);
    expect(typeof trace.stages).toBe("object");

    expect(trace.stages.querier).toBeTruthy();
    expect("summary" in trace.stages.querier).toBe(true);
    expect("raw" in trace.stages.querier).toBe(true);

    expect(trace.stat).toBeTruthy();
    expect(trace.stat.querierDuration).toBe(100);
    expect(trace.stat.routerDuration).toBe(50);
  });

  it("should include CORS headers on all responses", async () => {
    const { req, res, getHeaders } = createMocks("/api/session");

    await handleSession(req, res, mockConfig);

    expect(getHeaders()["Access-Control-Allow-Origin"]).toBe("*");
  });

  it("should return 500 for unexpected errors", async () => {
    await closePool();

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

    const { req, res, getStatus, getHeaders, getBody } = createMocks(
      "/api/session?share_id=test",
    );

    await handleSession(req, res, badConfig);

    expect(getStatus()).toBe(500);
    expect(getHeaders()["Content-Type"]).toBe("application/json");

    const body = JSON.parse(getBody());
    expect(body).toEqual({ error: "Internal server error" });
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
